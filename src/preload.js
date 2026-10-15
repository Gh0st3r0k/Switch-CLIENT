const { contextBridge, ipcRenderer } = require("electron");

// Expose named operations instead of giving renderers unrestricted IPC access.
contextBridge.exposeInMainWorld("electronAPI", {
    sendLoginRequest: (username, password) =>
        ipcRenderer.invoke("send-login", username, password),
    openMainWindow: () => ipcRenderer.send("open-main-window"),
    closeWindow: () => ipcRenderer.send("close-window"),
    closeCurrentWindow: () => ipcRenderer.send("close-current-window"),
    openSetting: () => ipcRenderer.send("open-setting"),
    openPortStat: (port) => ipcRenderer.send("open-port-stats", port),
    receiveData: (callback) =>
        ipcRenderer.on("port-data", (_event, data) => callback(data)),
    fetchPorts: () => ipcRenderer.invoke("fetch-ports"),
    fetchPortStatistics: (port) =>
        ipcRenderer.invoke("fetch-port-statistics", port),
    getPortStatus: (port) => ipcRenderer.invoke("get-port-status", port),
    getPortName: (port) => ipcRenderer.invoke("get-port-name", port),
    fetchSettings: () => ipcRenderer.invoke("fetch-settings"),
    updateSettings: (lifetime) =>
        ipcRenderer.invoke("update-settings", lifetime),
    resetMacTable: () => ipcRenderer.invoke("reset-mac-table"),
    resetStatistics: () => ipcRenderer.invoke("reset-statistics"),
    fetchMacTable: () => ipcRenderer.invoke("fetch-mac-table"),
    getHostName: () => ipcRenderer.invoke("get-host-name"),
    setHostName: (name) => ipcRenderer.invoke("set-host-name", name)
});
