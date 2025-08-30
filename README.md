# Curlino

Curlino is a modern desktop application for creating, managing, and testing API requests. It is built using TypeScript and React, and it leverages Electron for cross-platform compatibility.

## Features

- Create and manage API requests with various HTTP methods.
- Organize requests into groups.
- Use environments to manage variables for different setups.
- View API responses, including status codes, headers, and body content.
- Navigate through different sections using a sidebar.
- Manage multiple requests using a tabbed interface.
- **Settings Management**: Customize application behavior including themes, request defaults, and more.

## Technologies Used

- **TypeScript**: For type safety and better development experience.
- **React**: For building the user interface.
- **Electron**: For creating a cross-platform desktop application.
- **Node.js**: For backend services and API calls.

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
