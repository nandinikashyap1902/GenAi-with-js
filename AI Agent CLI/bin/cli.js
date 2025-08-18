#!/usr/bin/env node

const { program } = require('commander');
const WebsiteCloner = require('../src/WebsiteCloner');
const chalk = require('chalk');
const ora = require('ora');

program
  .name('clone-site')
  .description('Clone any website locally and make it functional')
  .version('1.0.0');

program
  .command('clone <url>')
  .description('Clone a website to local directory')
  .option('-o, --output <directory>', 'Output directory', './cloned-site')
  .option('-d, --depth <number>', 'Maximum crawling depth', '2')
  .option('-r, --react', 'Convert to React app (experimental)')
  .option('--no-assets', 'Skip downloading assets')
  .option('--timeout <number>', 'Request timeout in milliseconds', '30000')
  .action(async (url, options) => {
    const spinner = ora('Initializing website cloner...').start();
    
    try {
      // Validate URL
      new URL(url);
    } catch (error) {
      spinner.fail(chalk.red('Invalid URL provided'));
      process.exit(1);
    }

    try {
      const cloner = new WebsiteCloner({
        url,
        outputDir: options.output,
        maxDepth: parseInt(options.depth),
        downloadAssets: options.assets,
        convertToReact: options.react,
        timeout: parseInt(options.timeout)
      });

      spinner.text = 'Starting website cloning process...';
      
      await cloner.clone();
      
      spinner.succeed(chalk.green(`Successfully cloned ${url} to ${options.output}`));
      
      console.log(chalk.blue('\nNext steps:'));
      console.log(chalk.white(`1. Navigate to: ${options.output}`));
      console.log(chalk.white('2. Open index.html in your browser'));
      
      if (options.react) {
        console.log(chalk.white('3. Run: npm install && npm start (React app)'));
      }
      
    } catch (error) {
      spinner.fail(chalk.red(`Failed to clone website: ${error.message}`));
      console.error(chalk.red(error.stack));
      process.exit(1);
    }
  });

program
  .command('info <url>')
  .description('Get information about a website before cloning')
  .action(async (url) => {
    const spinner = ora('Analyzing website...').start();
    
    try {
      const cloner = new WebsiteCloner({ url });
      const info = await cloner.analyzeWebsite();
      
      spinner.succeed(chalk.green('Website analysis complete'));
      
      console.log(chalk.blue('\nWebsite Information:'));
      console.log(chalk.white(`Title: ${info.title}`));
      console.log(chalk.white(`Links found: ${info.links.length}`));
      console.log(chalk.white(`Images found: ${info.images.length}`));
      console.log(chalk.white(`Stylesheets: ${info.stylesheets.length}`));
      console.log(chalk.white(`Scripts: ${info.scripts.length}`));
      console.log(chalk.white(`Estimated size: ${info.estimatedSize}`));
      
    } catch (error) {
      spinner.fail(chalk.red(`Failed to analyze website: ${error.message}`));
      process.exit(1);
    }
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
