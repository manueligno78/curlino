import { app, BrowserWindow, session } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import __cjs_url__ from "node:url";
import __cjs_path__ from "node:path";
import __cjs_mod__ from "node:module";
const __filename = __cjs_url__.fileURLToPath(import.meta.url);
const __dirname = __cjs_path__.dirname(__filename);
const require2 = __cjs_mod__.createRequire(import.meta.url);
let mainWindow = null;
const isDevelopment = process.env.NODE_ENV !== "production";
async function isDevServerRunning() {
  if (!isDevelopment) return false;
  try {
    const http = await import("http");
    return new Promise((resolve) => {
      const req = http.request({
        hostname: "localhost",
        port: 5173,
        method: "HEAD",
        timeout: 1e3
      }, (res) => {
        resolve(res.statusCode === 200);
      });
      req.on("error", () => resolve(false));
      req.on("timeout", () => resolve(false));
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
    title: "cUrlino",
    webPreferences: {
      preload: path.resolve(__dirname, "preload-simple.js"),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false
    },
    show: false
    // Don't show until ready
  });
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });
  const csp = isDevelopment ? "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https: http: ws: wss: *; font-src 'self';" : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https: http: ws: wss: *; font-src 'self';";
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [csp]
      }
    });
  });
  const devServerRunning = await isDevServerRunning();
  if (devServerRunning) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    const __filename2 = fileURLToPath(import.meta.url);
    const __dirname2 = path.dirname(__filename2);
    const possiblePaths = [
      path.join(__dirname2, "../renderer/index.html"),
      path.join(__dirname2, "../../out/renderer/index.html"),
      path.join(process.resourcesPath, "app/out/renderer/index.html"),
      path.join(process.resourcesPath, "app.asar/out/renderer/index.html")
    ];
    let htmlPath = possiblePaths[0];
    for (const testPath of possiblePaths) {
      try {
        const fs = await import("fs");
        if (fs.existsSync(testPath)) {
          htmlPath = testPath;
          break;
        }
      } catch (e) {
      }
    }
    console.log("Loading file:", htmlPath);
    mainWindow.loadFile(htmlPath);
  }
  if (!isDevelopment) {
    mainWindow.webContents.closeDevTools();
  }
  if (!isDevelopment) {
    mainWindow.webContents.on("console-message", (event, level, message) => {
      if (message.includes("Autofill.enable") || message.includes("Autofill.setAddresses")) {
        event.preventDefault();
      }
    });
  }
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
app.on("ready", createWindow);
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
