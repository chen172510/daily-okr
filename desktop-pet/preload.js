const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('petAPI', {
  dragStart: (x, y) => ipcRenderer.send('drag-start', { x, y }),
  dragMove: (dx, dy) => ipcRenderer.send('drag-move', { dx, dy }),
  say: (text) => ipcRenderer.send('say', text),
  onFace: (cb) => ipcRenderer.on('face', (_e, d) => cb(d))
});
