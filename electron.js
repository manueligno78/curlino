import { app, BrowserWindow, session } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

let mainWindow = null;

const isDevelopment = process.env.NODE_ENV !== 'production';

// Function to check if dev server is running
async function isDevServerRunning() {
  if (!isDevelopment) return false;
  
  try {
    const http = await import('http');
    return new Promise((resolve) => {
      const req = http.request({
        hostname: 'localhost',
        port: 5173,
        method: 'HEAD',
        timeout: 1000
      }, (res) => {
        resolve(res.statusCode === 200);
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => resolve(false));
      req.end();
    });
  } catch (e) {
    return false;
  }
}


async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'cUrlino',
    webPreferences: {
      preload: path.resolve(__dirname, 'preload-simple.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
    },
    show: false, // Don't show until ready
  });

  // Show window when ready to prevent flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // CSP per development e production
  const csp = isDevelopment
    ? "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https: http: ws: wss: *; font-src 'self';"
    : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https: http: ws: wss: *; font-src 'self';";

  // Imposta CSP per sicurezza
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp],
      },
    });
  });

  // Load from dev server if running, otherwise load files directly
  const devServerRunning = await isDevServerRunning();
  
  if (devServerRunning) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    // Load files directly - much faster and more reliable
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    const possiblePaths = [
      path.join(__dirname, '../renderer/index.html'),
      path.join(__dirname, '../../out/renderer/index.html'),
      path.join(process.resourcesPath, 'app/out/renderer/index.html'),
      path.join(process.resourcesPath, 'app.asar/out/renderer/index.html')
    ];
    
    let htmlPath = possiblePaths[0]; // default
    for (const testPath of possiblePaths) {
      try {
        const fs = await import('fs');
        if (fs.existsSync(testPath)) {
          htmlPath = testPath;
          break;
        }
      } catch (e) {
        // continue trying
      }
    }
    
    console.log('Loading file:', htmlPath);
    mainWindow.loadFile(htmlPath);
  }

  // Disable DevTools in production
  if (!isDevelopment) {
    mainWindow.webContents.closeDevTools();
  }

  // Suppress console warnings in production
  if (!isDevelopment) {
    mainWindow.webContents.on('console-message', (event, level, message) => {
      if (message.includes('Autofill.enable') || message.includes('Autofill.setAddresses')) {
        event.preventDefault();
      }
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
