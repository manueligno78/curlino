"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
const electron = require("electron");
const path = require("path");
const url = require("url");
const __filename$1 = url.fileURLToPath(require("url").pathToFileURL(__filename).href);
const __dirname$1 = path.dirname(__filename$1);
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
    const url2 = await import("url");
    const possiblePaths = [
      path.join(__dirname$1, "../renderer"),
      path.join(__dirname$1, "../../out/renderer"),
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
      const parsedUrl = url2.parse(req.url);
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
  mainWindow = new electron.BrowserWindow({
    width: 1200,
    height: 800,
    title: "cUrlino",
    webPreferences: {
      preload: path.resolve(__dirname$1, "preload-simple.js"),
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
  electron.session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
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
        path.join(__dirname$1, "../renderer/index.html"),
        path.join(__dirname$1, "../../out/renderer/index.html"),
        path.join(process.resourcesPath, "app/out/renderer/index.html"),
        path.join(process.resourcesPath, "app.asar/out/renderer/index.html")
      ];
      let htmlPath = possiblePaths[0];
      for (const testPath of possiblePaths) {
        try {
          if (require("fs").existsSync(testPath)) {
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
electron.app.on("ready", createWindow);
electron.app.on("window-all-closed", () => {
  closeStaticServer();
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
electron.app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
electron.app.on("before-quit", () => {
  console.log("App is quitting, closing static server...");
  closeStaticServer();
});
electron.app.on("will-quit", () => {
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
