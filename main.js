const { app, BrowserWindow, Tray, Menu, session, nativeImage, ipcMain, screen } = require('electron');
const http = require('http');
const fs = require('fs');
const path = require('path');

const APP_DIR = path.join(__dirname, 'app');
const MIME = {
  '.html':'text/html', '.js':'text/javascript', '.mjs':'text/javascript',
  '.json':'application/json', '.webmanifest':'application/manifest+json',
  '.png':'image/png', '.svg':'image/svg+xml', '.ico':'image/x-icon', '.css':'text/css'
};

let server, baseURL, win, tray, popups = [];

// Serve the app/ folder over 127.0.0.1 so it runs in a secure context
// (needed for camera + service worker; file:// is not trusted for getUserMedia).
function startServer(){
  return new Promise((resolve) => {
    server = http.createServer((req, res) => {
      let urlPath = decodeURIComponent(req.url.split('?')[0]);
      if (urlPath === '/') urlPath = '/index.html';
      const filePath = path.join(APP_DIR, path.normalize(urlPath));
      if (!filePath.startsWith(APP_DIR)) { res.writeHead(403); res.end('forbidden'); return; }
      fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404); res.end('not found'); return; }
        res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
        res.end(data);
      });
    });
    server.listen(0, '127.0.0.1', () => {
      baseURL = `http://127.0.0.1:${server.address().port}/index.html`;
      resolve();
    });
  });
}

function createWindow(){
  win = new BrowserWindow({
    width: 1120, height: 780,
    backgroundColor: '#0e1113',
    icon: path.join(APP_DIR, 'icon-512.png'),
    title: 'Snoop Catcher',
    minimizable: true,
    maximizable: true,
    closable: true,
    fullscreenable: false,   // never let the app window itself go fullscreen (it hides the title-bar buttons)
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false   // keep watching at full speed while minimized/hidden
    }
  });
  if (win.removeMenu) win.removeMenu();
  win.loadURL(baseURL);
  // Standard buttons: minimize keeps it running in the background; close quits the app.
  win.on('closed', () => { app.quit(); });
}

function createTray(){
  const img = nativeImage.createFromPath(path.join(APP_DIR, 'icon-192.png')).resize({ width: 18, height: 18 });
  tray = new Tray(img);
  tray.setToolTip('Snoop Catcher');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Show Snoop Catcher', click: () => { win.show(); win.focus(); } },
    { type: 'checkbox', label: 'Start at login',
      checked: app.getLoginItemSettings().openAtLogin,
      click: (mi) => app.setLoginItemSettings({ openAtLogin: mi.checked }) },
    { type: 'separator' },
    { label: 'Quit', click: () => { app.quit(); } }
  ]));
  tray.on('click', () => { win.isVisible() ? win.focus() : win.show(); });
}

// One transparent always-on-top window per display, so the overlay covers ALL screens.
function buildPopups(){
  for (const p of popups) { try { p.destroy(); } catch(_){} }
  popups = [];
  for (const d of screen.getAllDisplays()) {
    const p = new BrowserWindow({
      show: false, frame: false, skipTaskbar: true,
      transparent: true, hasShadow: false,
      resizable: false, movable: false, minimizable: false, maximizable: false,
      fullscreenable: true,
      x: d.bounds.x, y: d.bounds.y, width: d.bounds.width, height: d.bounds.height,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false
      }
    });
    p.loadFile(path.join(__dirname, 'popup.html'));
    p.setAlwaysOnTop(true, 'screen-saver');
    popups.push(p);
  }
}
function hideAllPopups(){ for (const p of popups) { try { p.hide(); } catch(_){} } }

// Show the overlay on every screen; the app window is untouched.
ipcMain.on('popup-show', (e, data) => {
  popups.forEach((p) => {
    try { p.setBackgroundMaterial(data && data.style === 'blur' ? 'acrylic' : 'none'); } catch(_){}
    p.webContents.send('render', data);
    p.setAlwaysOnTop(true, 'screen-saver');
    p.show();
  });
  if (popups[0]) popups[0].focus();
});
ipcMain.on('popup-hide', hideAllPopups);
// Dismiss initiated from inside a popup -> hide all of them and tell the app to snooze.
ipcMain.on('popup-dismiss', () => {
  hideAllPopups();
  if (win) win.webContents.send('app-dismiss');
});

// Single instance so it doesn't launch twice
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => { if (win) { win.show(); win.focus(); } });
  app.whenReady().then(async () => {
    session.defaultSession.setPermissionRequestHandler((wc, permission, cb) => cb(permission === 'media'));
    session.defaultSession.setPermissionCheckHandler((wc, permission) => permission === 'media');
    await startServer();
    createWindow();
    createTray();
    buildPopups();
    screen.on('display-added', buildPopups);
    screen.on('display-removed', buildPopups);
    screen.on('display-metrics-changed', buildPopups);
  });
  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
  app.on('activate', () => { if (win) win.show(); });
}
