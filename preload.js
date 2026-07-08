const { contextBridge, ipcRenderer } = require('electron');

// Exposed as window.snoopcatcher inside the app. The app calls these guarded by
// `window.snoopcatcher?.…`, so the exact same index.html still runs in a normal browser.
contextBridge.exposeInMainWorld('snoopcatcher', {
  popup: () => ipcRenderer.send('snoop-popup'),
  dismiss: () => ipcRenderer.send('snoop-dismiss'),
});
