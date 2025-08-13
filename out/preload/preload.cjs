"use strict";
const require$$0 = require("electron");
const require$$1 = require("path");
const require$$2 = require("fs");
const require$$3 = require("@electron/remote");
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
var preload$1 = {};
var hasRequiredPreload;
function requirePreload() {
  if (hasRequiredPreload) return preload$1;
  hasRequiredPreload = 1;
  const { contextBridge, ipcRenderer } = require$$0;
  contextBridge.exposeInMainWorld("electron", {
    // Funzioni per consentire al renderer di comunicare con il processo principale
    send: (channel, data) => {
      if (channel.startsWith("app:")) {
        ipcRenderer.send(channel, data);
      }
    },
    receive: (channel, func) => {
      if (channel.startsWith("app:")) {
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
    // Forniamo funzioni specifiche per i moduli comuni invece di esporre require
    path: {
      join: (...args) => require$$1.join(...args),
      resolve: (...args) => require$$1.resolve(...args)
    },
    fs: {
      readFileSync: (path, options) => require$$2.readFileSync(path, options),
      writeFileSync: (path, data, options) => require$$2.writeFileSync(path, data, options)
    },
    // Aggiungi funzioni per aprire cartelle nel filesystem
    openFolder: (path) => {
      const { shell } = require$$0;
      shell.openPath(path);
    },
    getAppDataPath: () => {
      const { app } = require$$0.remote || require$$3;
      return app.getPath("userData");
    },
    getPlatform: () => process.platform
  });
  if (!window.electronStorage) {
    contextBridge.exposeInMainWorld("electronStorage", {
      getItem: (key) => {
        try {
          return localStorage.getItem(key);
        } catch (e) {
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          localStorage.setItem(key, value);
        } catch (e) {
        }
      },
      removeItem: (key) => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
        }
      }
    });
  }
  return preload$1;
}
var preloadExports = requirePreload();
const preload = /* @__PURE__ */ getDefaultExportFromCjs(preloadExports);
module.exports = preload;
