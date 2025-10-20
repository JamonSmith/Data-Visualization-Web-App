const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
	saveFile: (content) => ipcRenderer.send("save-file", content),
	openFile: () => ipcRenderer.send("open-file"),
	onFileOpened: (callback) => ipcRenderer.on("file-opened", (event, data) => callback(data)),
	onSaveSuccess: (callback) => ipcRenderer.on("save-success", (event, path) => callback(path)),
	onSetContent: (callback) => ipcRenderer.on("set-content", (event, content) => callback(content))
});

console.log("Preload loaded");