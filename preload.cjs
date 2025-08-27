// Preload script for the Electron application
// Questo file sarà eseguito nel processo di rendering prima che il contenuto web venga caricato
// ma con accesso alle API di Electron

const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs');
const { shell } = require('electron');

// Otteniamo i moduli all'inizio per evitare problemi di bundling
let remoteApp;
try {
  remoteApp = require('electron').remote?.app || require('@electron/remote')?.app;
} catch (e) {
  remoteApp = null;
}

// Log to verify that the preload script is executed
// Preload script started - logging will be handled by main app

// Esporre API selezionate al renderer tramite contextBridge
contextBridge.exposeInMainWorld('electron', {
  // Funzioni per consentire al renderer di comunicare con il processo principale
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
  // Forniamo funzioni specifiche per i moduli comuni invece di esporre require
  path: {
    join: (...args) => path.join(...args),
    resolve: (...args) => path.resolve(...args),
  },
  fs: {
    readFileSync: (filePath, options) => fs.readFileSync(filePath, options),
    writeFileSync: (filePath, data, options) => fs.writeFileSync(filePath, data, options),
  },
  // Aggiungi funzioni per aprire cartelle nel filesystem
  openFolder: (folderPath) => {
    shell.openPath(folderPath);
  },
  getAppDataPath: () => {
    return remoteApp ? remoteApp.getPath('userData') : null;
  },
  getPlatform: () => process.platform,
  // HTTP request API to bypass CORS
  httpRequest: (requestData) => {
    return ipcRenderer.invoke('app:http-request', requestData);
  },
});

// Esponiamo un'API che ci permette di interagire con lo storage in modo sicuro
// Controlliamo se l'API esiste già prima di tentare di esporla
if (!window.electronStorage) {
  contextBridge.exposeInMainWorld('electronStorage', {
    getItem: key => {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        // Error in getItem - logging will be handled by main app
        return null;
      }
    },
    setItem: (key, value) => {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        // Error in setItem - logging will be handled by main app
      }
    },
    removeItem: key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        // Error in removeItem - logging will be handled by main app
      }
    },
  });
}
