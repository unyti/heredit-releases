const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  loadData:   ()         => ipcRenderer.invoke('data:load'),
  saveData:   (d)        => ipcRenderer.invoke('data:save', d),
  getVersion: ()         => ipcRenderer.invoke('app:version'),
  saveFile:   (name, content) => ipcRenderer.invoke('file:save', name, content),
  resetData:    ()              => ipcRenderer.invoke('app:reset'),
  fetchDividend: (ticker)       => ipcRenderer.invoke('dividend:fetch', ticker),

  // Mise à jour
  checkUpdate:          ()    => ipcRenderer.invoke('update:check'),
  getCachedUpdate:      ()    => ipcRenderer.invoke('update:get-cached'),
  downloadAndInstall:   ()    => ipcRenderer.invoke('update:download-install'),
  fetchMetalSpot:       (t)   => ipcRenderer.invoke('metal:spot', t),
  onUpdateAvailable:    (cb)  => ipcRenderer.on('update:available',  (_, info) => cb(info)),
  onUpdateProgress:     (cb)  => ipcRenderer.on('update:progress',   (_, pct)  => cb(pct)),
})
