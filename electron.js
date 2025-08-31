import { app, BrowserWindow, session, ipcMain, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'path';
import https from 'https';
import http from 'http';
import zlib from 'zlib';

let mainWindow = null;

const isDevelopment = process.env.NODE_ENV !== 'production';

// Get app version from Electron's built-in method
const APP_VERSION = app.getVersion();

// Auto-updater configuration
autoUpdater.checkForUpdatesAndNotify = false; // We'll handle this manually
autoUpdater.autoDownload = false; // Ask user before downloading
autoUpdater.logger = console;

// Auto-updater event handlers
autoUpdater.on('checking-for-update', () => {
  console.log('Checking for update...');
});

autoUpdater.on('update-available', (info) => {
  console.log('Update available:', info);
  if (mainWindow) {
    mainWindow.webContents.send('update-available', info);
  }
});

autoUpdater.on('update-not-available', (info) => {
  console.log('Update not available:', info);
  if (mainWindow) {
    mainWindow.webContents.send('update-not-available', info);
  }
});

autoUpdater.on('error', (err) => {
  console.log('Error in auto-updater:', err);
  if (mainWindow) {
    mainWindow.webContents.send('update-error', err);
  }
});

autoUpdater.on('download-progress', (progressObj) => {
  console.log('Download progress:', progressObj);
  if (mainWindow) {
    mainWindow.webContents.send('update-download-progress', progressObj);
  }
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('Update downloaded:', info);
  if (mainWindow) {
    mainWindow.webContents.send('update-downloaded', info);
  }
});

// HTTP request handler to bypass CORS
function makeHttpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const httpModule = isHttps ? https : http;
    
    // Parse URL
    const urlObj = new URL(url);
    
    // Setup standard HTTP headers
    const standardHeaders = {
      'Host': urlObj.host,
      'User-Agent': `Curlino/${APP_VERSION} (compatible; HTTP client)`,
      'Accept': '*/*',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      // Add standard content headers if body is present
      ...(options.body && {
        'Content-Length': Buffer.byteLength(options.body, 'utf8').toString()
      })
    };

    // Merge user headers with standard headers (user headers override standard ones)
    const finalHeaders = {
      ...standardHeaders,
      ...options.headers
    };

    // Setup request options
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: finalHeaders,
      timeout: options.timeout || 30000,
    };

    // Handle SSL verification setting
    if (isHttps && options.rejectUnauthorized === false) {
      requestOptions.rejectUnauthorized = false;
    }

    const startTime = Date.now();
    
    const req = httpModule.request(requestOptions, (res) => {
      let responseStream = res;
      
      // Handle compressed responses
      const encoding = res.headers['content-encoding'];
      if (encoding === 'gzip') {
        responseStream = res.pipe(zlib.createGunzip());
      } else if (encoding === 'deflate') {
        responseStream = res.pipe(zlib.createInflate());
      } else if (encoding === 'br') {
        responseStream = res.pipe(zlib.createBrotliDecompress());
      }
      
      let data = '';
      
      responseStream.on('data', (chunk) => {
        data += chunk;
      });
      
      responseStream.on('end', () => {
        const endTime = Date.now();
        
        // Parse response body based on content-type
        let body = data;
        const contentType = res.headers['content-type'] || '';
        
        if (contentType.includes('application/json')) {
          try {
            body = JSON.parse(data);
          } catch (e) {
            // Keep as string if parsing fails
          }
        }
        
        resolve({
          status: res.statusMessage || 'OK',
          statusCode: res.statusCode,
          headers: res.headers,
          body: body,
          responseTime: endTime - startTime,
        });
      });
      
      responseStream.on('error', (error) => {
        const endTime = Date.now();
        reject({
          error: `Decompression error: ${error.message}`,
          code: 'DECOMPRESSION_ERROR',
          responseTime: endTime - startTime,
        });
      });
    });
    
    req.on('error', (error) => {
      const endTime = Date.now();
      reject({
        error: error.message,
        code: error.code,
        responseTime: endTime - startTime,
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      const endTime = Date.now();
      reject({
        error: 'Request timeout',
        code: 'ETIMEDOUT',
        responseTime: endTime - startTime,
      });
    });
    
    // Send body if provided
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Setup IPC handlers
ipcMain.handle('app:http-request', async (event, requestData) => {
  try {
    const { url, method, headers, body, timeout, rejectUnauthorized } = requestData;
    
    const result = await makeHttpRequest(url, {
      method,
      headers,
      body,
      timeout,
      rejectUnauthorized,
    });
    
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error };
  }
});

// Auto-updater IPC handlers
ipcMain.handle('app:check-for-updates', async () => {
  if (!isDevelopment) {
    try {
      const result = await autoUpdater.checkForUpdates();
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  } else {
    return { success: false, error: 'Updates not available in development mode' };
  }
});

ipcMain.handle('app:download-update', async () => {
  if (!isDevelopment) {
    try {
      await autoUpdater.downloadUpdate();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  } else {
    return { success: false, error: 'Updates not available in development mode' };
  }
});

ipcMain.handle('app:install-update', async () => {
  if (!isDevelopment) {
    try {
      autoUpdater.quitAndInstall();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  } else {
    return { success: false, error: 'Updates not available in development mode' };
  }
});

ipcMain.handle('app:get-version', () => {
  return APP_VERSION;
});

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
    title: `Curlino v${APP_VERSION}`,
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

app.on('ready', () => {
  createWindow();
  
  // Check for updates when app is ready (but not in development)
  if (!isDevelopment) {
    setTimeout(() => {
      autoUpdater.checkForUpdatesAndNotify();
    }, 3000); // Wait 3 seconds after startup
  }
});

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
