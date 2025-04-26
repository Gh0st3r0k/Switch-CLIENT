const { app, BrowserWindow, ipcMain, session } = require("electron");
const path = require("path");

let mainWindow;

///////////////////////////////////////////////////////////////////////////////////////////////////////////
// Application Lifecycle and Window Management

// Setup Content Security Policy before creating any windows
function setupCSP() {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                "Content-Security-Policy": "default-src 'self'; script-src 'self'; connect-src 'self' http://localhost:5215"
            }
        });
    });
}

// Create and show login window
function openLogIn() {
    const logInPage = new BrowserWindow({
        width: 270,
        height: 200,
        frame: false,
        resizable: false,
        fullscreenable: false,
        maximizable: false,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            enableRemoteModule: false
        }
    });

    logInPage.loadFile(path.join(__dirname, "logIn/logIn.html"));
    // logInPage.webContents.openDevTools(); // Debugging only
}

// Create and show main application window
function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 980,
        height: 650,
        frame: false,
        resizable: false,
        fullscreenable: false,
        maximizable: false,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            enableRemoteModule: false
        }
    });

    mainWindow.loadFile(path.join(__dirname, "mainPage/mainPage.html"));
}

// Generic window creator for other pages
function createWindow(filePath, title) {
    const win = new BrowserWindow({
        width: 400,
        height: 300,
        title: title,
        frame: false,
        resizable: false,
        fullscreenable: false,
        maximizable: false,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            enableRemoteModule: false,
            nodeIntegration: false
        }
    });

    win.loadFile(path.join(__dirname, filePath));
    return win;
}

function createSettingWindow() {
    const win = new BrowserWindow({
        width: 400,
        height: 350,
        title: "Settings",
        frame: false,
        resizable: false,
        fullscreenable: false,
        maximizable: false,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            enableRemoteModule: false
        }
    });

    win.loadFile(path.join(__dirname, "settingPage/settingPage.html"));
}

// App ready
app.whenReady().then(() => {
    setupCSP();
    openLogIn();
});

///////////////////////////////////////////////////////////////////////////////////////////////////////////
// IPC Handlers: Window Management and Basic Actions

ipcMain.on("close-window", () => {
    console.log("[DEBUG] Closing application...");
    app.quit();
});

ipcMain.on("close-current-window", () => {
    console.log("[DEBUG] Closing current window...");
    const window = BrowserWindow.getFocusedWindow();
    if (window) window.close();
});

ipcMain.on("open-main-window", () => {
    console.log("[DEBUG] Opening main window after login...");
    const window = BrowserWindow.getFocusedWindow();
    if (window) window.close();
    createMainWindow();
});

ipcMain.on("open-port-stats", (event, port) => {
    const statsWindow = createWindow("statisticPage/statisticPage.html", `Statistics for Port #${port.Number}`);
    statsWindow.webContents.once("did-finish-load", () => {
        statsWindow.webContents.send("port-data", port);
    });
});

ipcMain.on("open-setting", () => {
    createSettingWindow();
});

// Debugging and console logs
ipcMain.on("print", () => console.log("[DEBUG] Print triggered."));
ipcMain.on("print-api", () => console.log("[DEBUG] API fetch triggered."));
ipcMain.on("print-text", (event, text) => console.log(text));

///////////////////////////////////////////////////////////////////////////////////////////////////////////
// IPC Handlers: Authentication and Ports API

// Handle login request
ipcMain.handle("send-login", async (_event, username, password) => {
    try {
        const response = await fetch('http://localhost:5215/api/auth/login', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            console.error("[ERROR] Server returned error:", response.status);
            return "no";
        }
        return "ok";
    } catch (error) {
        console.error("[ERROR] Login error:", error);
        return "no";
    }
});

// Fetch list of ports
ipcMain.handle("fetch-ports", async () => {
    try {
        const response = await fetch("http://localhost:5215/api/ports");
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("[ERROR] Fetch ports failed:", error);
        return null;
    }
});

// Fetch statistics for a specific port
ipcMain.handle("fetch-port-statistics", async (_event, portNumber) => {
    try {
        const response = await fetch(`http://localhost:5215/api/ports/statistics/${portNumber}`);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`[ERROR] Fetch port statistics failed (port ${portNumber}):`, error);
        return null;
    }
});

// Get status of a specific port
ipcMain.handle("get-port-status", async (_event, portNumber) => {
    try {
        const response = await fetch(`http://localhost:5215/api/ports/${portNumber}/status`);
        if (!response.ok) throw new Error("Failed to get port status");

        const data = await response.json();
        return data.isEnabled;
    } catch (error) {
        console.error("[ERROR] Get port status failed:", error);
        return null;
    }
});

// Get name of a specific port
ipcMain.handle("get-port-name", async (_event, portNumber) => {
    try {
        const response = await fetch(`http://localhost:5215/api/ports/${portNumber}/name`);
        if (!response.ok) throw new Error("Failed to get port name");

        const data = await response.json();
        return data.name || null;
    } catch (error) {
        console.error("[ERROR] Get port name failed:", error);
        return null;
    }
});

///////////////////////////////////////////////////////////////////////////////////////////////////////////
// IPC Handlers: Settings and MAC Table API

const API_SETTINGS_URL = "http://localhost:5215/api/settings";

ipcMain.handle("fetch-settings", async () => {
    try {
        const response = await fetch(`${API_SETTINGS_URL}/mac-table/time`);
        if (!response.ok) throw new Error("Failed to fetch settings");
        return await response.json();
    } catch (error) {
        console.error("[ERROR] Fetch settings failed:", error);
        return null;
    }
});

ipcMain.handle("update-settings", async (_event, newTTL) => {
    try {
        const response = await fetch(`${API_SETTINGS_URL}/mac-table/newTime`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ newTime: newTTL })
        });
        if (!response.ok) throw new Error("Failed to update settings");
        return await response.text();
    } catch (error) {
        console.error("[ERROR] Update settings failed:", error);
        return null;
    }
});

let resetMacTable = 0;

// Reset MAC Table
ipcMain.handle("reset-mac-table", async () => {
    try {
        resetMacTable = 1;
        const response = await fetch(`${API_SETTINGS_URL}/mac-table/reset`, { method: "POST" });
        if (!response.ok) throw new Error("Failed to reset MAC table");
        return await response.text();
    } catch (error) {
        console.error("[ERROR] Reset MAC table failed:", error);
        return null;
    }
});

// Check if MAC Table should be reset
ipcMain.handle("check-reset-macTable", () => {
    if (resetMacTable === 1) {
        resetMacTable = 0;
        return true;
    }
    return false;
});

// Reset statistics
ipcMain.handle("reset-statistics", async () => {
    try {
        const response = await fetch(`${API_SETTINGS_URL}/statistics/reset`, { method: "POST" });
        if (!response.ok) throw new Error("Failed to reset statistics");
        return await response.text();
    } catch (error) {
        console.error("[ERROR] Reset statistics failed:", error);
        return null;
    }
});

// Fetch MAC Table
ipcMain.handle("fetch-mac-table", async () => {
    try {
        const response = await fetch("http://localhost:5215/api/mac-table");
        if (!response.ok) throw new Error("Failed to fetch MAC table");
        return await response.json();
    } catch (error) {
        console.error("[ERROR] Fetch MAC table failed:", error);
        return [];
    }
});

// Get and set host name
ipcMain.handle("get-host-name", async () => {
    try {
        const response = await fetch(`${API_SETTINGS_URL}/host-name`);
        if (!response.ok) throw new Error("Failed to get host name");
        const data = await response.json();
        return data.hostName;
    } catch (error) {
        console.error("[ERROR] Get host name failed:", error);
        return null;
    }
});

ipcMain.handle("set-host-name", async (_event, hostName) => {
    try {
        const response = await fetch(`${API_SETTINGS_URL}/host-name`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ hostName })
        });
        if (!response.ok) throw new Error("Failed to set host name");
        return await response.text();
    } catch (error) {
        console.error("[ERROR] Set host name failed:", error);
        return null;
    }
});
