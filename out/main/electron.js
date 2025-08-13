import { app, BrowserWindow, session } from "electron";
import path from "path";
import "url";
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
let staticServer = null;
function closeStaticServer() {
  if (staticServer) {
    console.log("Closing static server...");
    staticServer.close((err) => {
      if (err) {
        console.error("Error closing static server:", err);
      } else {
        console.log("Static server closed successfully");
      }
    });
    staticServer.closeAllConnections?.();
    staticServer = null;
  }
}
async function startStaticServer() {
  if (staticServer) return "http://localhost:3000";
  try {
    const http = await import("http");
    const fs = await import("fs");
    const url = await import("url");
    const possiblePaths = [
      path.join(__dirname, "../renderer"),
      path.join(__dirname, "../../out/renderer"),
      path.join(process.resourcesPath, "app/out/renderer"),
      path.join(process.resourcesPath, "app.asar/out/renderer")
    ];
    let rendererPath = possiblePaths[0];
    for (const testPath of possiblePaths) {
      try {
        if (fs.existsSync(testPath)) {
          rendererPath = testPath;
          break;
        }
      } catch (e) {
      }
    }
    staticServer = http.createServer((req, res) => {
      const parsedUrl = url.parse(req.url);
      let pathname = parsedUrl.pathname;
      if (pathname === "/" || !pathname.includes(".")) {
        pathname = "/index.html";
      }
      const filePath = path.join(rendererPath, pathname);
      if (!filePath.startsWith(rendererPath)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end("Not Found");
          return;
        }
        const ext = path.extname(filePath);
        const mimeTypes = {
          ".html": "text/html",
          ".js": "application/javascript",
          ".css": "text/css",
          ".svg": "image/svg+xml",
          ".png": "image/png",
          ".jpg": "image/jpeg",
          ".jpeg": "image/jpeg",
          ".gif": "image/gif",
          ".json": "application/json"
        };
        const contentType = mimeTypes[ext] || "application/octet-stream";
        res.writeHead(200, {
          "Content-Type": contentType,
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept"
        });
        res.end(data);
      });
    });
    return new Promise((resolve, reject) => {
      staticServer.listen(3e3, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log("Static server running at http://localhost:3000");
          console.log("You can access Curlino in your browser at: http://localhost:3000");
          resolve("http://localhost:3000");
        }
      });
    });
  } catch (e) {
    console.error("Failed to start static server:", e);
    return null;
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
    const serverUrl = await startStaticServer();
    if (serverUrl) {
      mainWindow.loadURL(serverUrl);
    } else {
      const possiblePaths = [
        path.join(__dirname, "../renderer/index.html"),
        path.join(__dirname, "../../out/renderer/index.html"),
        path.join(process.resourcesPath, "app/out/renderer/index.html"),
        path.join(process.resourcesPath, "app.asar/out/renderer/index.html")
      ];
      let htmlPath = possiblePaths[0];
      for (const testPath of possiblePaths) {
        try {
          if (require2("fs").existsSync(testPath)) {
            htmlPath = testPath;
            break;
          }
        } catch (e) {
        }
      }
      mainWindow.loadFile(htmlPath);
    }
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
    closeStaticServer();
  });
}
app.on("ready", createWindow);
app.on("window-all-closed", () => {
  closeStaticServer();
  if (process.platform !== "darwin") {
    app.quit();
  }
});
app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
app.on("before-quit", () => {
  console.log("App is quitting, closing static server...");
  closeStaticServer();
});
app.on("will-quit", () => {
  closeStaticServer();
});
process.on("SIGINT", () => {
  console.log("Received SIGINT, closing static server...");
  closeStaticServer();
  setTimeout(() => process.exit(0), 1e3);
});
process.on("SIGTERM", () => {
  console.log("Received SIGTERM, closing static server...");
  closeStaticServer();
  setTimeout(() => process.exit(0), 1e3);
});
process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  closeStaticServer();
  process.exit(1);
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled rejection at:", promise, "reason:", reason);
  closeStaticServer();
});
