# Website Cloner CLI

A powerful CLI tool that can clone any website locally and make it fully functional. This tool downloads HTML, CSS, JavaScript, images, and other assets while rewriting all links and references to work locally.

**Perfect for cloning:**
- Documentation sites (Tailwind, Bootstrap, Vue.js)
- Portfolio websites and landing pages
- Company websites and blogs
- Educational platforms and tutorials
- Open source project sites

## Features

- 🌐 **Complete Website Cloning**: Downloads HTML, CSS, JS, images, and other assets
- 🔗 **Smart Link Rewriting**: Automatically rewrites links and asset references for local use
- 📱 **Depth Control**: Configurable crawling depth to control how many pages to download
- ⚛️ **React Conversion**: Optional conversion to React app structure (experimental)
- 📊 **Website Analysis**: Preview website information before cloning
- 🎨 **Asset Organization**: Automatically organizes downloaded assets by type
- 🛡️ **Error Handling**: Robust error handling and retry mechanisms

## Installation

```bash
# Navigate to the project directory
cd "GenAi-with-js/AI Agent CLI"

# Install dependencies
npm install

# Make the CLI globally available (optional)
npm link
```

## Usage

### Basic Cloning

```bash
# Clone a website to the default directory
node bin/cli.js clone https://example.com

# Clone to a specific directory
node bin/cli.js clone https://tailwindcss.com -o ./my-cloned-site

# Control crawling depth
node bin/cli.js clone https://getbootstrap.com -d 1
```

### Advanced Options

```bash
# Convert to React app (experimental)
node bin/cli.js clone https://vuejs.org --react

# Skip downloading assets (HTML only)
node bin/cli.js clone https://github.com --no-assets

# Set custom timeout
node bin/cli.js clone https://stackoverflow.com --timeout 60000
```

### Website Analysis

```bash
# Get information about a website before cloning
node bin/cli.js info https://reactjs.org
```

## Command Line Options

### `clone <url>`

Clone a website locally.

**Options:**
- `-o, --output <directory>`: Output directory (default: ./cloned-site)
- `-d, --depth <number>`: Maximum crawling depth (default: 2)
- `-r, --react`: Convert to React app structure
- `--no-assets`: Skip downloading assets
- `--timeout <number>`: Request timeout in milliseconds (default: 30000)

### `info <url>`

Analyze a website and show information about it.

## Examples

### Clone Popular Websites

```bash
# Clone Tailwind CSS documentation
node bin/cli.js clone https://tailwindcss.com -o ./tailwind-docs

# Clone Vue.js official site
node bin/cli.js clone https://vuejs.org -o ./vue-site

# Clone GitHub's homepage
node bin/cli.js clone https://github.com -o ./github-clone

# Clone Bootstrap documentation
node bin/cli.js clone https://getbootstrap.com -o ./bootstrap-docs
```

Each command will:
1. Download the main page and linked pages (up to depth 2)
2. Download all assets (images, CSS, JS files)
3. Rewrite all links to work locally
4. Save everything to the specified directory

### React Conversion

```bash
# Convert any website to React app structure
node bin/cli.js clone https://example.com --react -o ./react-site
```

This creates both the regular cloned site and a React app structure in `./react-site/react-app/`.

## Output Structure

```
cloned-site/
├── index.html              # Main page
├── about.html              # Other pages discovered
├── blog.html               # Blog pages (if found)
├── contact.html            # Contact pages (if found)
├── assets/
│   ├── css/               # All stylesheets
│   ├── js/                # JavaScript files
│   ├── image/             # Images and media
│   └── fonts/             # Font files (if any)
└── react-app/             # React version (if --react flag used)
    ├── package.json
    ├── public/
    └── src/
```

## Technical Features

### Smart Asset Handling
- Downloads images, CSS, JavaScript, fonts, and other assets
- Maintains original directory structure where possible
- Handles relative and absolute URLs
- Updates all references to point to local files

### Link Rewriting
- Converts internal links to local file references
- Preserves external links
- Handles hash links and anchors
- Updates CSS background-image URLs

### React Conversion (Experimental)
- Creates a basic React app structure
- Converts HTML content to JSX
- Sets up build configuration
- Copies assets to public directory

## Limitations

- Some dynamic content may not work without server-side functionality
- JavaScript that relies on specific domains may need manual adjustment
- The React conversion is basic and may need manual refinement
- Some modern web frameworks may require additional processing

## Troubleshooting

### Common Issues

1. **Network Errors**: Increase timeout with `--timeout 60000`
2. **Permission Errors**: Ensure write permissions in output directory
3. **Large Sites**: Reduce depth with `-d 1` for faster processing
4. **Asset Loading**: Some assets may be blocked by CORS policies

### Debug Mode

For detailed logging, check the console output during the cloning process.

## Contributing

Feel free to contribute by:
- Reporting bugs
- Suggesting new features
- Submitting pull requests
- Improving documentation

## License

MIT License - feel free to use this tool for any purpose.
