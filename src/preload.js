const { contextBridge, ipcRenderer } = require("electron");

// Expose a secure API for the renderer process
contextBridge.exposeInMainWorld("electronAPI", {
    // Window controls
    sendLoginRequest: (username, password) => ipcRenderer.invoke("send-login", username, password),
    openMainWindow: () => ipcRenderer.send("open-main-window"),
    closeWindow: () => ipcRenderer.send("close-window"),
    closeCurrentWindow: () => ipcRenderer.send("close-current-window"),
    openSetting: () => ipcRenderer.send("open-setting"),

    // Communication utilities
    print: () => ipcRenderer.send("print"),
    printApi: () => ipcRenderer.send("print-api"),
    printText: (text) => ipcRenderer.send("print-text", text),

    // Port windows and statistics
    openPortStat: (port) => ipcRenderer.send("open-port-stats", port),
    receiveData: (callback) => ipcRenderer.on("port-data", (event, data) => callback(data)),

    // Fetch ports and statistics
    fetchPorts: () => ipcRenderer.invoke("fetch-ports"),
    fetchPortStatistics: (portNumber) => ipcRenderer.invoke("fetch-port-statistics", portNumber),
    getPortStatus: (portNumber) => ipcRenderer.invoke("get-port-status", portNumber),
    getPortName: (portNumber) => ipcRenderer.invoke("get-port-name", portNumber),

    // Settings and MAC table
    fetchSettings: () => ipcRenderer.invoke("fetch-settings"),
    updateSettings: (newTTL) => ipcRenderer.invoke("update-settings", newTTL),
    resetMacTable: () => ipcRenderer.invoke("reset-mac-table"),
    checkResetMacTable: () => ipcRenderer.invoke("check-reset-macTable"),
    resetStatistics: () => ipcRenderer.invoke("reset-statistics"),
    GetMacTable: () => ipcRenderer.invoke("fetch-mac-table"),

    // Device information
    getHostName: () => ipcRenderer.invoke("get-host-name"),
    setHostName: (hostName) => ipcRenderer.invoke("set-host-name", hostName)
});