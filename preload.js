const { contextBridge, ipcRenderer } = require('electron');

// Exposed as window.snoopcatcher in BOTH the app window and the popup window.
// The app calls these guarded by `window.snoopcatcher?.…`, so the exact same
// index.html still runs in a normal browser (where these are simply absent).
contextBridge.exposeInMainWorld('snoopcatcher', {
  // --- app window -> main ---
  popupShow: (faceSvg, banner) => ipcRenderer.send('popup-show', { faceSvg, banner }),
  popupHide: () => ipcRenderer.send('popup-hide'),
  onDismiss: (cb) => ipcRenderer.on('app-dismiss', () => cb()),
  // --- popup window <-> main ---
  onRender: (cb) => ipcRenderer.on('render', (e, data) => cb(data)),
  popupDismiss: () => ipcRenderer.send('popup-dismiss'),
});
