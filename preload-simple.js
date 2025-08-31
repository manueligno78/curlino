const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  send: (channel, data) => {
    if (channel.startsWith('app:')) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel, func) => {
    if (channel.startsWith('app:')) {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  // HTTP request API to bypass CORS
  httpRequest: (requestData) => {
    return ipcRenderer.invoke('app:http-request', requestData);
  },
  // Auto-updater API
  checkForUpdates: () => {
    return ipcRenderer.invoke('app:check-for-updates');
  },
  downloadUpdate: () => {
    return ipcRenderer.invoke('app:download-update');
  },
  installUpdate: () => {
    return ipcRenderer.invoke('app:install-update');
  },
  getVersion: () => {
    return ipcRenderer.invoke('app:get-version');
  },
  // Update event listeners
  onUpdateAvailable: (callback) => {
    ipcRenderer.on('update-available', (event, info) => callback(info));
  },
  onUpdateNotAvailable: (callback) => {
    ipcRenderer.on('update-not-available', (event, info) => callback(info));
  },
  onUpdateError: (callback) => {
    ipcRenderer.on('update-error', (event, error) => callback(error));
  },
  onUpdateDownloadProgress: (callback) => {
    ipcRenderer.on('update-download-progress', (event, progress) => callback(progress));
  },
  onUpdateDownloaded: (callback) => {
    ipcRenderer.on('update-downloaded', (event, info) => callback(info));
  },
  path: {
    join: (...args) => {
      const path = require('path');
      return path.join(...args);
    },
    resolve: (...args) => {
      const path = require('path');
      return path.resolve(...args);
    },
  },
  fs: {
    readFileSync: (path, options) => {
      const fs = require('fs');
      return fs.readFileSync(path, options);
    },
    writeFileSync: (path, data, options) => {
      const fs = require('fs');
      return fs.writeFileSync(path, data, options);
    },
  },
  openFolder: path => {
    const { shell } = require('electron');
    shell.openPath(path);
  },
  getAppDataPath: () => {
    try {
      const { app } = require('@electron/remote');
      return app.getPath('userData');
    } catch (e) {
      return null;
    }
  },
  getPlatform: () => process.platform,
});

contextBridge.exposeInMainWorld('electronStorage', {
  getItem: key => {
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
      // ignore
    }
  },
  removeItem: key => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      // ignore
    }
  },
});