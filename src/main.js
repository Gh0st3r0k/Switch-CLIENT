const { app, BrowserWindow, ipcMain, session } = require("electron");
const path = require("node:path");
const { createApiClient } = require("./api");

const api = createApiClient();

function createWindow(
    page,
    { width = 400, height = 300, title = "Switch" } = {}
) {
    const window = new BrowserWindow({
        width,
        height,
        title,
        frame: false,
        resizable: false,
        fullscreenable: false,
        maximizable: false,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false
        }
    });
    window.loadFile(path.join(__dirname, page));
    return window;
}

function openLoginWindow() {
    return createWindow("logIn/logIn.html", {
        width: 270,
        height: 200,
        title: "Login"
    });
}

app.whenReady().then(() => {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                "Content-Security-Policy": [
                    "default-src 'self'; script-src 'self'; connect-src 'self' http://localhost:5215"
                ]
            }
        });
    });
    openLoginWindow();
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});
app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) openLoginWindow();
});

ipcMain.on("close-window", () => app.quit());
ipcMain.on("close-current-window", (event) =>
    BrowserWindow.fromWebContents(event.sender)?.close()
);
ipcMain.on("open-main-window", (event) => {
    // Create the dashboard before closing login so window-all-closed cannot quit the app.
    createWindow("mainPage/mainPage.html", { width: 980, height: 650 });
    BrowserWindow.fromWebContents(event.sender)?.close();
});
ipcMain.on("open-setting", () => {
    createWindow("settingPage/settingPage.html", {
        height: 350,
        title: "Settings"
    });
});
ipcMain.on("open-port-stats", (_event, port) => {
    const window = createWindow("statisticPage/statisticPage.html", {
        title: `Statistics for Port #${port.number}`
    });
    window.webContents.once("did-finish-load", () =>
        window.webContents.send("port-data", port)
    );
});

// Keep channel names explicit so the preload bridge remains the renderer's API contract.
const handlers = {
    "send-login": api.login,
    "fetch-ports": api.fetchPorts,
    "fetch-port-statistics": api.fetchPortStatistics,
    "get-port-status": api.getPortStatus,
    "get-port-name": api.getPortName,
    "fetch-settings": api.fetchSettings,
    "update-settings": api.updateSettings,
    "reset-mac-table": api.resetMacTable,
    "reset-statistics": api.resetStatistics,
    "fetch-mac-table": api.fetchMacTable,
    "get-host-name": api.getHostName,
    "set-host-name": api.setHostName
};

for (const [channel, handler] of Object.entries(handlers)) {
    ipcMain.handle(channel, (_event, ...args) => handler(...args));
}
