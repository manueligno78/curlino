# Curlino - Modern Desktop Curl Client

<p align="left">
   <img alt="Curlino logo" width="96" src="public/images/logos_generated/084b9f5e-931b-4b5a-8daa-d7f77f8d28c8.png" />
</p>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/github/actions/workflow/status/manueligno78/curlino/ci.yml?branch=main)](https://github.com/manueligno78/curlino/actions)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/manueligno78/curlino)](https://github.com/manueligno78/curlino/releases)
[![GitHub stars](https://img.shields.io/github/stars/manueligno78/curlino)](https://github.com/manueligno78/curlino/stargazers)
[![npm audit](https://img.shields.io/badge/npm%20audit-0%20vulnerabilities-green)](https://docs.npmjs.com/cli/v8/commands/npm-audit)
[![Dependabot Status](https://img.shields.io/badge/dependabot-enabled-brightgreen.svg)](https://github.com/manueligno78/curlino/network/dependencies)
[![Security Policy](https://img.shields.io/badge/security-policy-blue)](SECURITY.md)
[![Privacy Policy](https://img.shields.io/badge/privacy-zero%20data%20collection-green)](PRIVACY.md)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![Electron](https://img.shields.io/badge/Electron-191970?style=flat&logo=Electron&logoColor=white)](https://electronjs.org/)
[![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)](https://reactjs.org/)

**Curlino** is a modern, cross-platform **desktop app to import, manage and execute curl** commands with a beautiful graphical interface. Built with **Electron**, **React**, and **TypeScript**, it transforms your curl commands into an organized, visual REST API client experience.

🚀 **Key Features**: **Native curl command import**, cross-platform compatibility, modern UI design, advanced request management, environment variables, response visualization, and comprehensive testing capabilities.

### Main Interface
Clean and intuitive workspace for managing your API requests with organized groups and collections.

<img width="600" alt="Curlino Main Interface - Request Management" src="https://github.com/user-attachments/assets/f344c9b9-e8c2-465b-8e1f-7b326c2b498b" />

### Request Builder & Response Viewer
Import cURL commands seamlessly and view formatted responses with syntax highlighting.

<img width="600" alt="Curlino Request Builder - cURL Import and Response Viewer" src="https://github.com/user-attachments/assets/e0b3e95c-1312-4a3b-b1da-63b28faa70bb" />

### History view
Configure environments, variables, and application preferences for different development workflows.

<img width="600" alt="Curlino Advanced Features - Environment Variables and Settings" src="https://github.com/user-attachments/assets/e5e69623-338c-432d-aaee-8c2a2a653dec" />

## ✨ Features

### 🔧 cURL Integration & Request Management
- **🎯 Native cURL Import**: Paste any curl command and automatically parse it into a visual request
- **⚡ cURL Export**: Convert any request back to curl command for command-line usage  
- **🔄 cURL Command Execution**: Execute imported curl commands with full parameter support
- **HTTP Methods Support**: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS
- **Request Builder**: Intuitive graphical interface for crafting API requests
- **Headers & Parameters**: Full control over request headers and query parameters
- **Request Body**: Support for JSON, XML, form data, and raw text

### 📁 Organization & Workflow
- **Group Organization**: Organize requests into logical groups and collections
- **Environment Variables**: Manage different environments (dev, staging, prod) with variable substitution
- **Tabbed Interface**: Work with multiple requests simultaneously
- **Request History**: Track and revisit previously executed requests
- **Auto-save**: Automatic saving of groups and environments

### 📊 Response Analysis
- **Response Viewer**: Beautiful syntax highlighting for JSON, XML, HTML
- **Headers Inspection**: Detailed view of response headers and status codes
- **Response Time Tracking**: Monitor API performance
- **Status Code Analysis**: Visual indicators for HTTP status codes
- **Response Export**: Save responses for documentation or debugging

### 🎨 Modern UI & UX
- **Cross-platform**: Native desktop app for macOS, Windows, and Linux
- **Dark/Light Theme**: Customizable themes with system preference support
- **Responsive Design**: Optimized interface that adapts to different screen sizes
- **Keyboard Shortcuts**: Efficient workflow with customizable shortcuts
- **Settings Panel**: Comprehensive configuration options

## 🚀 Quick Start

### 📋 Using with cURL Commands
```bash
# Simply copy any curl command like this:
curl -X POST https://api.example.com/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token123" \
  -d '{"name": "John", "email": "john@example.com"}'

# Paste it directly into Curlino's import dialog
# → Curlino automatically parses and creates a visual request
# → Execute, modify, and manage it through the GUI
# → Export back to curl when needed
```

### 📥 Download & Install
1. **Download** the latest release from [GitHub Releases](https://github.com/manueligno78/curlino/releases)
2. **Install** the appropriate package for your operating system:
   - **macOS**: Download `.dmg` file
   - **Windows**: Download `.exe` installer
   - **Linux**: Download `.AppImage` file

### Development Setup
```bash
# Clone the repository
git clone https://github.com/manueligno78/curlino.git
cd curlino

# Install dependencies
npm install

# Start development server
npm run dev
```

## 💻 Technologies & Stack

### Core Framework
- **[Electron](https://electronjs.org/)** - Cross-platform desktop app framework
- **[React 18](https://reactjs.org/)** - Modern UI library with hooks
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript development
- **[Node.js](https://nodejs.org/)** - Runtime for API calls and system integration

### Development Tools
- **[Webpack](https://webpack.js.org/)** - Module bundling and optimization
- **[ESLint](https://eslint.org/)** & **[Prettier](https://prettier.io/)** - Code quality and formatting
- **[Jest](https://jestjs.io/)** - Testing framework with React Testing Library
- **[GitHub Actions](https://github.com/features/actions)** - CI/CD pipeline

### Key Libraries
- **[Axios](https://axios-http.com/)** - HTTP client for API requests
- **[UUID](https://www.npmjs.com/package/uuid)** - Unique identifier generation
- **[HTTP Status Messages](https://www.npmjs.com/package/http-status-message)** - Status code utilities

## Settings

The application supports various customization options through its settings panel:

### Appearance

- **Theme**: Choose between Light, Dark, or System theme
- **Font Size**: Adjust the font size throughout the application

### Request Defaults

- **Follow Redirects**: Automatically follow HTTP redirects
- **Timeout**: Set the default timeout for requests in milliseconds
- **SSL Verification**: Enable/disable SSL certificate verification
- **Default Headers**: Configure headers to include in all requests by default

### General Settings

- **Auto Save**: Enable/disable automatic saving of groups and environments
- **Usage Data**: Opt-in/out of sending anonymous usage data
- **History Items**: Configure the maximum number of items to keep in history

### Accessing Settings

- Click on "Settings" in the main navigation bar to open the settings panel
- All settings are automatically saved to your application data directory

## Logging System

The application includes a comprehensive structured logging system for monitoring and debugging.

### Log Levels

The application supports four log levels:

- **ERROR**: Critical errors that may cause the application to malfunction
- **WARN**: Warning messages for potential issues
- **INFO**: General information about application operations
- **DEBUG**: Detailed debugging information (only shown in development)

By default:

- **Development mode**: Shows all logs (DEBUG level and above)
- **Production mode**: Shows INFO level and above (hides DEBUG logs)

### Reading Logs

Logs are displayed in the browser's developer console with the following format:

```
2025-07-31T14:39:44.173Z [ERROR] [ComponentName]: Error message {"context":"data"}
```

Each log entry includes:

- **Timestamp**: ISO 8601 format timestamp
- **Level**: Log level in brackets (ERROR, WARN, INFO, DEBUG)
- **Component**: The application component that generated the log
- **Message**: Human-readable description of the event
- **Context**: Additional structured data (JSON format)

### Changing Log Level

To change the log level at runtime, open the browser's developer console and use:

```javascript
// Set to show only errors and warnings
window.logger?.setLogLevel('warn');

// Set to show all logs (including debug)
window.logger?.setLogLevel('debug');

// Set to show info and above (default for production)
window.logger?.setLogLevel('info');

// Set to show only errors
window.logger?.setLogLevel('error');
```

### Log Categories

Logs are categorized by component:

- **ApiService**: HTTP requests and responses
- **StorageService**: Data persistence operations
- **ErrorHandler**: Error management and reporting
- **UI Components**: User interface interactions
- **App**: Application lifecycle events

### Examples

```
// API Request log
2025-07-31T14:39:44.173Z [INFO] [ApiService]: API Request {"method":"GET","url":"https://api.example.com/data","statusCode":200,"responseTime":145}

// Storage operation log
2025-07-31T14:39:44.186Z [DEBUG] [StorageService]: Saving groups {"action":"saveGroups","count":3}

// Error log
2025-07-31T14:39:44.204Z [ERROR] [ErrorHandler]: Network request failed {"errorType":"NETWORK_ERROR","url":"https://api.example.com/data"}
```

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm (Node package manager)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/curlino.git
   ```
2. Navigate to the project directory:
   ```
   cd curlino
   ```
3. Install the dependencies:
   ```
   npm install
   ```

   ## 🖼️ Generated assets

   The following logo proposals were collected from the discussion in issue #45 and placed in the repository under `public/images/logos_generated` and `src/assets/images/logos_generated`:

   - `084b9f5e-931b-4b5a-8daa-d7f77f8d28c8.png` (1024x1024)
   - `3b80bebc-cefe-468d-9bfa-f6bd0c8f9a81.png` (512x512)
   - `f0a6e405-121a-41b4-9834-7007d413fe15.png` (256x256)
   - `376a519d-804c-4dfc-bcac-b80736a781e6.png` (64x64)
   - `9345316e-f91c-40f3-b769-3377ccf10b61.png` (32x32)
   - `cd6bd9d2-358b-4a54-9197-9761d961e342.png` (48x48)
   - `5abeccda-6d0b-4571-a128-162ac492551c.png` (16x16)

   If you want different sizes or formats (SVG, ICO, ICNS), I can generate them and add here.

### Running the Application

To start the application, run the following command:

```
npm start
```

### Building for Production

To create a production build of the application, use:

```
npm run build
```

## Packaging and Running as a Native macOS App (.app)

You can generate a native `.app` file for macOS using [electron-builder](https://www.electron.build/):

### Prerequisites

- macOS with Xcode command line tools installed
- Node.js and npm

### Build Steps

1. Open a terminal and move to the project directory:
   ```
   cd curlino
   ```
2. Install dependencies (if not already done):
   ```
   npm install
   ```
3. Build the production bundle:
   ```
   npm run build
   ```
4. Generate the `.app` and `.dmg` files:

   ```
   npm run dist
   ```

   or directly:

   ```
   npx electron-builder --mac
   ```

5. The `.app` file will be available in the `dist/mac/` folder. You can double-click it to launch Curlino as a native macOS application. The `.dmg` file can be used for easy distribution.

## Usage

Once the application is running, you can:

- Use the sidebar to navigate between groups and environments.
- Create new requests in the Request Panel.
- View responses in the Response Panel.
- Switch between requests using the Tab System.

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our development process, coding standards, and how to submit pull requests.

### Quick Start for Contributors

1. Fork the repository
2. Install dependencies: `npm install`
3. Run quality checks: `npm run quality`
4. Create a feature branch: `git checkout -b feature/your-feature`
5. Make your changes and ensure tests pass
6. Submit a pull request

## Development

### Quality Assurance

This project uses automated quality checks:

- **ESLint** for code quality and consistency
- **Prettier** for code formatting
- **Jest** for testing with coverage reports
- **Husky** for pre-commit hooks
- **GitHub Actions** for CI/CD

Run all quality checks with:

```bash
npm run quality
```

## License

This project is licensed under the MIT License. See the LICENSE file for details.
