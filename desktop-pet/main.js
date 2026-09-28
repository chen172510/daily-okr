/* 行醒桌宠 · 周星星 —— Electron 主进程 */
const { app, BrowserWindow, screen, ipcMain, Tray, Menu, nativeImage } = require('electron');
const path = require('path');

const W = 220;
const H = 260;
let win = null;
let tray = null;
let walkTimer = null;
let dir = 1;
let paused = false;

function createWindow() {
  const { workArea } = screen.getPrimaryDisplay();
  const x = Math.round(workArea.x + workArea.width * 0.5 - W / 2);
  const y = workArea.y + workArea.height - H - 6;

  win = new BrowserWindow({
    width: W, height: H, x, y,
    frame: false, transparent: true, hasShadow: false,
    resizable: false, movable: true, fullscreenable: false,
    alwaysOnTop: true, skipTaskbar: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.setAlwaysOnTop(true, 'screen-saver');
  win.loadFile(path.join(__dirname, 'index.html'));
}

// 让小人沿着屏幕底部来回走
function startWalking() {
  stopWalking();
  walkTimer = setInterval(() => {
    if (!win || win.isDestroyed() || paused) return;
    const { workArea } = screen.getPrimaryDisplay();
    const [x, y] = win.getPosition();
    let nx = x + dir * 3;
    const minX = workArea.x + 4;
    const maxX = workArea.x + workArea.width - W - 4;
    if (nx <= minX) { nx = minX; dir = 1; send('face', 1); }
    if (nx >= maxX) { nx = maxX; dir = -1; send('face', -1); }
    win.setPosition(Math.round(nx), y);
  }, 40);
}
function stopWalking() { if (walkTimer) { clearInterval(walkTimer); walkTimer = null; } }
function send(ch, payload) { if (win && !win.isDestroyed()) win.webContents.send(ch, payload); }

function createTray() {
  try {
    const icon = nativeImage.createFromPath(path.join(__dirname, 'assets', 'pet.jpg'));
    tray = new Tray(icon.resize({ width: 16, height: 16 }));
    tray.setToolTip('周星星 · 行醒桌宠');
    tray.setContextMenu(Menu.buildFromTemplate([
      { label: '让它安静 / 继续走', click: () => { paused = !paused; if (!paused) startWalking(); else stopWalking(); } },
      { label: '回到屏幕中间', click: () => centerIt() },
      { type: 'separator' },
      { label: '退出', click: () => app.quit() }
    ]));
  } catch (e) { /* 托盘失败不影响使用 */ }
}

function centerIt() {
  if (!win || win.isDestroyed()) return;
  const { workArea } = screen.getPrimaryDisplay();
  win.setPosition(Math.round(workArea.x + workArea.width * 0.5 - W / 2), workArea.y + workArea.height - H - 6);
}

// 拖动窗口
ipcMain.on('drag-start', (e, { x, y }) => { ipcMain.dragStartX = x; ipcMain.dragStartY = y; });
ipcMain.on('drag-move', (e, { dx, dy }) => {
  if (!win || win.isDestroyed()) return;
  const [x, y] = win.getPosition();
  win.setPosition(x + dx, y + dy);
});
ipcMain.on('say', (e, text) => { if (win) win.setTitle(text); });

app.whenReady().then(() => {
  createWindow();
  createTray();
  startWalking();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { stopWalking(); app.quit(); });
