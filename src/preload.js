const { contextBridge, ipcRenderer } = require("electron");
// const fetchPorts = require(path.join(__dirname, "api.js")).fetchPorts;


// Allow the frontend to send events to the main process
contextBridge.exposeInMainWorld("electronAPI", {
    sendLoginRequest: (username, password) => ipcRenderer.invoke("send-login", username, password),
    openMainWindow: () => ipcRenderer.send("open-main-window"),
    closeWindow: () => ipcRenderer.send("close-window"),
    closeCurrentWindow: () => ipcRenderer.send("close-current-window"),
    print: () => ipcRenderer.send("print"),
    printApi: () => ipcRenderer.send("print-api"),
    printText: (text) => ipcRenderer.send("print-text", text),
    openPortStat: (port) => ipcRenderer.send("open-port-stats", port),
    openSetting: () => ipcRenderer.send("open-setting"),

    receiveData: (callback) => ipcRenderer.on("port-data", (event, data) => callback(data)),
    
    fetchPorts: () => ipcRenderer.invoke("fetch-ports"),
    fetchPortStatistics: (portNumber) => ipcRenderer.invoke("fetch-port-statistics", portNumber),

    fetchSettings: () => ipcRenderer.invoke("fetch-settings"),
    updateSettings: (newTTL) => ipcRenderer.invoke("update-settings", newTTL),
    resetMacTable: () => ipcRenderer.invoke("reset-mac-table"),
    resetStatistics: () => ipcRenderer.invoke("reset-statistics"),

    GetMacTable: () => ipcRenderer.invoke("fetch-mac-table")

    // fetchPorts
});