const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');
const { URL } = require('url');
const mime = require('mime-types');
const UserAgent = require('user-agents');
const chalk = require('chalk');

class WebsiteCloner {
  constructor(options = {}) {
    this.url = options.url;
    this.outputDir = options.outputDir || './cloned-site';
    this.maxDepth = options.maxDepth || 2;
    this.downloadAssets = options.downloadAssets !== false;
    this.convertToReact = options.convertToReact || false;
    this.timeout = options.timeout || 30000;
    
    this.baseUrl = new URL(this.url);
    this.visitedUrls = new Set();
    this.downloadedAssets = new Set();
    this.assetMap = new Map(); // Map original URLs to local paths
    this.userAgent = new UserAgent();
    
    // Create axios instance with default config
    this.client = axios.create({
      timeout: this.timeout,
      headers: {
        'User-Agent': this.userAgent.toString(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      }
    });
  }

  async clone() {
    console.log(chalk.blue(`🌐 Starting to clone: ${this.url}`));
    
    // Ensure output directory exists
    await fs.ensureDir(this.outputDir);
    
    // Start crawling from the main URL
    await this.crawlPage(this.url, 0);
    
    console.log(chalk.green(`✅ Cloning complete! Files saved to: ${this.outputDir}`));
    
    if (this.convertToReact) {
      await this.convertToReactApp();
    }
  }

  async crawlPage(url, depth) {
    if (depth > this.maxDepth || this.visitedUrls.has(url)) {
      return;
    }

    try {
      console.log(chalk.yellow(`📄 Crawling (depth ${depth}): ${url}`));
      
      const response = await this.client.get(url);
      const html = response.data;
      const $ = cheerio.load(html);
      
      this.visitedUrls.add(url);
      
      // Process and download assets
      if (this.downloadAssets) {
        await this.processAssets($, url);
      }
      
      // Rewrite links and references
      this.rewriteLinks($, url);
      
      // Save the modified HTML
      const filename = this.getFilename(url);
      const filepath = path.join(this.outputDir, filename);
      await fs.ensureDir(path.dirname(filepath));
      await fs.writeFile(filepath, $.html());
      
      // Find and crawl internal links
      const links = this.extractInternalLinks($, url);
      for (const link of links) {
        await this.crawlPage(link, depth + 1);
      }
      
    } catch (error) {
      console.error(chalk.red(`❌ Error crawling ${url}: ${error.message}`));
    }
  }

  async processAssets($, pageUrl) {
    const assets = [];
    
    // Images
    $('img[src]').each((i, el) => {
      const src = $(el).attr('src');
      if (src) assets.push({ element: el, attr: 'src', url: src, type: 'image' });
    });
    
    // Stylesheets
    $('link[rel="stylesheet"][href]').each((i, el) => {
      const href = $(el).attr('href');
      if (href) assets.push({ element: el, attr: 'href', url: href, type: 'css' });
    });
    
    // Scripts
    $('script[src]').each((i, el) => {
      const src = $(el).attr('src');
      if (src) assets.push({ element: el, attr: 'src', url: src, type: 'js' });
    });
    
    // Background images in style attributes
    $('[style*="background-image"], [style*="background:"]').each((i, el) => {
      const style = $(el).attr('style') || '';
      const bgImageMatch = style.match(/background-image:\s*url\(['"]?([^'")\s]+)['"]?\)/);
      if (bgImageMatch) {
        assets.push({ 
          element: el, 
          attr: 'style', 
          url: bgImageMatch[1], 
          type: 'image',
          isStyleAttribute: true,
          originalStyle: style
        });
      }
    });
    
    // Download assets
    for (const asset of assets) {
      await this.downloadAsset(asset, pageUrl, $);
    }
  }

  async downloadAsset(asset, pageUrl, $) {
    try {
      const absoluteUrl = new URL(asset.url, pageUrl).href;
      
      if (this.downloadedAssets.has(absoluteUrl)) {
        // Asset already downloaded, just update the reference
        const localPath = this.assetMap.get(absoluteUrl);
        this.updateAssetReference(asset, localPath, $);
        return;
      }

      console.log(chalk.cyan(`📦 Downloading asset: ${absoluteUrl}`));
      
      const response = await this.client.get(absoluteUrl, {
        responseType: 'arraybuffer'
      });
      
      const urlPath = new URL(absoluteUrl).pathname;
      const filename = path.basename(urlPath) || `asset_${Date.now()}`;
      const extension = path.extname(filename) || this.guessExtension(response.headers['content-type']);
      const finalFilename = filename.includes('.') ? filename : filename + extension;
      
      const assetDir = path.join(this.outputDir, 'assets', asset.type);
      await fs.ensureDir(assetDir);
      
      const localFilePath = path.join(assetDir, finalFilename);
      const relativePath = path.relative(this.outputDir, localFilePath);
      
      await fs.writeFile(localFilePath, response.data);
      
      this.downloadedAssets.add(absoluteUrl);
      this.assetMap.set(absoluteUrl, relativePath);
      
      // Update the element reference
      this.updateAssetReference(asset, relativePath, $);
      
    } catch (error) {
      console.error(chalk.red(`❌ Failed to download asset ${asset.url}: ${error.message}`));
    }
  }

  updateAssetReference(asset, localPath, $) {
    const relativePath = localPath.replace(/\\/g, '/'); // Normalize for web
    
    if (asset.isStyleAttribute) {
      const newStyle = asset.originalStyle.replace(
        /background-image:\s*url\(['"]?[^'")\s]+['"]?\)/,
        `background-image: url('${relativePath}')`
      );
      $(asset.element).attr('style', newStyle);
    } else {
      $(asset.element).attr(asset.attr, relativePath);
    }
  }

  rewriteLinks($, pageUrl) {
    $('a[href]').each((i, el) => {
      const href = $(el).attr('href');
      if (this.isInternalLink(href, pageUrl)) {
        const localFilename = this.getFilename(new URL(href, pageUrl).href);
        $(el).attr('href', localFilename);
      }
    });
  }

  extractInternalLinks($, pageUrl) {
    const links = [];
    
    $('a[href]').each((i, el) => {
      const href = $(el).attr('href');
      if (href && this.isInternalLink(href, pageUrl)) {
        const absoluteUrl = new URL(href, pageUrl).href;
        if (!this.visitedUrls.has(absoluteUrl)) {
          links.push(absoluteUrl);
        }
      }
    });
    
    return [...new Set(links)]; // Remove duplicates
  }

  isInternalLink(href, baseUrl) {
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return false;
    }
    
    try {
      const url = new URL(href, baseUrl);
      return url.hostname === this.baseUrl.hostname;
    } catch {
      return false;
    }
  }

  getFilename(url) {
    const urlObj = new URL(url);
    let pathname = urlObj.pathname;
    
    if (pathname === '/' || pathname === '') {
      return 'index.html';
    }
    
    if (pathname.endsWith('/')) {
      return pathname + 'index.html';
    }
    
    if (!path.extname(pathname)) {
      return pathname + '.html';
    }
    
    return pathname.substring(1); // Remove leading slash
  }

  guessExtension(contentType) {
    if (!contentType) return '';
    
    const mimeToExt = {
      'text/css': '.css',
      'application/javascript': '.js',
      'text/javascript': '.js',
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/svg+xml': '.svg',
      'image/webp': '.webp'
    };
    
    return mimeToExt[contentType.split(';')[0]] || '';
  }

  async analyzeWebsite() {
    try {
      const response = await this.client.get(this.url);
      const $ = cheerio.load(response.data);
      
      return {
        title: $('title').text() || 'No title',
        links: $('a[href]').length,
        images: $('img[src]').length,
        stylesheets: $('link[rel="stylesheet"]').length,
        scripts: $('script[src]').length,
        estimatedSize: this.formatBytes(response.data.length)
      };
    } catch (error) {
      throw new Error(`Failed to analyze website: ${error.message}`);
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async convertToReactApp() {
    console.log(chalk.blue('🔄 Converting to React app...'));
    
    // This is a basic implementation - in a real-world scenario,
    // you'd want more sophisticated HTML-to-React conversion
    const reactDir = path.join(this.outputDir, 'react-app');
    await fs.ensureDir(reactDir);
    
    // Create basic React structure
    await this.createReactPackageJson(reactDir);
    await this.createReactApp(reactDir);
    
    console.log(chalk.green('✅ React app structure created!'));
  }

  async createReactPackageJson(reactDir) {
    const packageJson = {
      name: 'cloned-website-react',
      version: '0.1.0',
      private: true,
      dependencies: {
        'react': '^18.2.0',
        'react-dom': '^18.2.0',
        'react-scripts': '5.0.1'
      },
      scripts: {
        'start': 'react-scripts start',
        'build': 'react-scripts build',
        'test': 'react-scripts test',
        'eject': 'react-scripts eject'
      },
      eslintConfig: {
        extends: ['react-app', 'react-app/jest']
      },
      browserslist: {
        production: ['>0.2%', 'not dead', 'not op_mini all'],
        development: ['last 1 chrome version', 'last 1 firefox version', 'last 1 safari version']
      }
    };
    
    await fs.writeFile(
      path.join(reactDir, 'package.json'), 
      JSON.stringify(packageJson, null, 2)
    );
  }

  async createReactApp(reactDir) {
    // Create src directory
    const srcDir = path.join(reactDir, 'src');
    await fs.ensureDir(srcDir);
    
    // Create public directory
    const publicDir = path.join(reactDir, 'public');
    await fs.ensureDir(publicDir);
    
    // Copy assets
    const assetsDir = path.join(this.outputDir, 'assets');
    if (await fs.pathExists(assetsDir)) {
      await fs.copy(assetsDir, path.join(publicDir, 'assets'));
    }
    
    // Create basic React files
    await this.createReactFiles(srcDir, publicDir);
  }

  async createReactFiles(srcDir, publicDir) {
    // Create index.html
    const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Cloned Website</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;
    
    await fs.writeFile(path.join(publicDir, 'index.html'), indexHtml);
    
    // Create App.js - convert the main HTML file
    const mainHtmlPath = path.join(this.outputDir, 'index.html');
    if (await fs.pathExists(mainHtmlPath)) {
      const htmlContent = await fs.readFile(mainHtmlPath, 'utf8');
      const $ = cheerio.load(htmlContent);
      
      // Extract body content
      const bodyContent = $('body').html() || '<div>No content found</div>';
      
      const appJs = `import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <div dangerouslySetInnerHTML={{__html: \`${bodyContent.replace(/`/g, '\\`')}\`}} />
    </div>
  );
}

export default App;`;
      
      await fs.writeFile(path.join(srcDir, 'App.js'), appJs);
    }
    
    // Create index.js
    const indexJs = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);`;
    
    await fs.writeFile(path.join(srcDir, 'index.js'), indexJs);
    
    // Create App.css
    const appCss = `/* Styles for cloned website */
.App {
  width: 100%;
  height: 100%;
}

/* Reset and basic styles */
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}`;
    
    await fs.writeFile(path.join(srcDir, 'App.css'), appCss);
  }
}

module.exports = WebsiteCloner;
