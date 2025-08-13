// Preload script for the Electron application
// Questo file sarà eseguito nel processo di rendering prima che il contenuto web venga caricato
// ma con accesso alle API di Electron

const { contextBridge, ipcRenderer } = require('electron');

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
    join: (...args) => require('path').join(...args),
    resolve: (...args) => require('path').resolve(...args),
  },
  fs: {
    readFileSync: (path, options) => require('fs').readFileSync(path, options),
    writeFileSync: (path, data, options) => require('fs').writeFileSync(path, data, options),
  },
  // Aggiungi funzioni per aprire cartelle nel filesystem
  openFolder: path => {
    const { shell } = require('electron');
    shell.openPath(path);
  },
  getAppDataPath: () => {
    const { app } = require('electron').remote || require('@electron/remote');
    return app.getPath('userData');
  },
  getPlatform: () => process.platform,
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
