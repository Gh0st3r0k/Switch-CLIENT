// const { app, BrowserWindow, ipcMain, session } = require("electron");
// const path = require("path");

// app.on("ready", createMainWindow);







// let mainWindow;

// function createMainWindow() {
//     mainWindow = new BrowserWindow({
//         width: 980,
//         height: 650,
//         frame: false,
//         resizable: false,
//         fullscreenable: false,
//         maximizable: false,
//         webPreferences: {
//             preload: path.join(__dirname, "preload.js"),
//             contextIsolation: true,
//             enableRemoteModule: false
//         }
//     });

//     session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
//         callback({
//             responseHeaders: {
//                 ...details.responseHeaders,
//                 "Content-Security-Policy": "default-src * 'unsafe-inline' 'unsafe-eval'; connect-src *"
//             }
//         });
//     });

//     mainWindow.loadFile(path.join(__dirname, "mainPage/mainPage.html"));

//     mainWindow.webContents.openDevTools(); // Open DevTools(Terminal)

// }







// // Handling events from the renderer process

// ipcMain.on("close-window", () => {
//     console.log("Close app");
//     app.exit()
// });

// ipcMain.on("close-current-window", () => {
//     console.log("Close current window");
//     const window = BrowserWindow.getFocusedWindow();
//     if (window) {
//         window.close();
//     }
// });

// ipcMain.on("print", () => {
//     console.log("Table printed");
// });

// ipcMain.on("print-api", () => {
//     console.log("Fetch APi");
// });

// ipcMain.on("open-port-stats", (event, portNumber) => {

//     const statsWindow = new BrowserWindow({
//         width: 400,
//         height: 300,
//         title: `Statistics for port #${portNumber}`,
//         frame: false,
//         resizable: false,
//         fullscreenable: false,
//         maximizable: false,
//         webPreferences: {
//             preload: path.join(__dirname, "preload.js"),
//             contextIsolation: true,
//             enableRemoteModule: false,
//             nodeIntegration: false
//         }
//     });

//     statsWindow.loadFile(path.join(__dirname, "statisticPage/statisticPage.html"));
    
//     // statsWindow.webContents.openDevTools();

//     statsWindow.webContents.once("did-finish-load", () => {
//         statsWindow.webContents.send("port-data", portNumber);
//     });
// });

// ipcMain.on("open-setting", () => {

//     const settingWindow = new BrowserWindow({
//         width: 400,
//         height: 300,
//         title: `Settings`,
//         frame: false,
//         resizable: false,
//         fullscreenable: false,
//         maximizable: false,
//         webPreferences: {
//             preload: path.join(__dirname, "preload.js"),
//             contextIsolation: true,
//             enableRemoteModule: false,
//             nodeIntegration: false
//         }
//     });

//     settingWindow.loadFile(path.join(__dirname, "settingPage/settingPage.html"));
    
//     // settingWindow.webContents.openDevTools();

// });


const { app, BrowserWindow, ipcMain, session } = require("electron");
const path = require("path");

let mainWindow;


app.whenReady().then(() => {
    setupCSP();  // ✅ Настраиваем CSP ДО создания окон
    openLogIn();
});

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

function openLogIn() {
    var logInPage = new BrowserWindow({
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
    // logInPage.webContents.openDevTools(); // Open DevTools (Debug)
}

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
    mainWindow.webContents.openDevTools(); // Open DevTools (Debug)
}

// ✅ Универсальная функция для создания окон
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

// ✅ Обработчики событий рендер-процесса
ipcMain.on("close-window", () => {
    console.log("Closing app...");
    app.quit();
});

ipcMain.handle("send-login", async (_event, username, password) => {
    try {
        const response = await fetch('http://localhost:5215/api/auth/login', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }) // ✅ Передаём параметры в JSON
        });

        if (!response.ok) {
            console.error("❌ Сервер вернул ошибку:", response.status);
            return "no"; // Если ошибка, возвращаем { status: "no" }
        }
        return "ok";

    } catch (error) {
        console.error("❌ Login error:", error);
        _event.reply("login-response", "no"); // Ошибка → возвращаем "no"
    }
});

ipcMain.on("open-main-window", () => {
    console.log("Login In");
    const window = BrowserWindow.getFocusedWindow();
    if (window) window.close();
    createMainWindow();
});

ipcMain.on("close-current-window", () => {
    console.log("Closing current window...");
    const window = BrowserWindow.getFocusedWindow();
    if (window) window.close();
});

ipcMain.on("print", () => console.log("Table printed"));
ipcMain.on("print-api", () => console.log("Fetching API"));
ipcMain.on("print-text", async (event, text) => console.log(text));

ipcMain.on("open-port-stats", (event, port) => {
    const statsWindow = createWindow("statisticPage/statisticPage.html", `Statistics for port #${port.Number}`);

    // statsWindow.webContents.openDevTools(); // Open DevTools (Debug)

    statsWindow.webContents.once("did-finish-load", () => {
        statsWindow.webContents.send("port-data", port);
    });
});

ipcMain.on("open-setting", () => {
    createWindow("settingPage/settingPage.html", "Settings");
});










ipcMain.handle("fetch-ports", async () => {
    try {
        const response = await fetch("http://localhost:5215/api/ports", {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Ошибка загрузки данных:", error);
        return null;
    }
});

ipcMain.handle("fetch-port-statistics", async (event, portNumber) => {
    try {
        const response = await fetch(`http://localhost:5215/api/ports/statistics/${portNumber}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Ошибка загрузки статистики порта ${portNumber}:`, error);
        return null;
    }
});














const API_SETTINGS_URL = "http://localhost:5215/api/settings"; // ✅ Базовый URL сервиса настроек

// ✅ Получить настройки
ipcMain.handle("fetch-settings", async () => {
    try {
        const response = await fetch(`${API_SETTINGS_URL}/mac-table/time`);
        if (!response.ok) throw new Error("Ошибка при получении настроек");

        return await response.json();
    } catch (error) {
        console.error("❌ Ошибка загрузки настроек:", error);
        return null;
    }
});

// ✅ Обновить настройки
ipcMain.handle("update-settings", async (event, newTTL) => {
    try {
        const response = await fetch(`${API_SETTINGS_URL}/mac-table/newTime`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ newTime: newTTL })
        });

        if (!response.ok) throw new Error("Ошибка при обновлении настроек");

        return await response.text();
    } catch (error) {
        console.error("❌ Ошибка обновления настроек:", error);
        return null;
    }
});

// ✅ Сбросить MAC-таблицу
ipcMain.handle("reset-mac-table", async () => {
    try {
        const response = await fetch(`${API_SETTINGS_URL}/mac-table/reset`, { method: "POST" });
        if (!response.ok) throw new Error("Ошибка при сбросе MAC-таблицы");

        return await response.text();
    } catch (error) {
        console.error("❌ Ошибка сброса MAC-таблицы:", error);
        return null;
    }
});

// ✅ Сбросить статистику
ipcMain.handle("reset-statistics", async () => {
    try {
        const response = await fetch(`${API_SETTINGS_URL}/statistics/reset`, { method: "POST" });
        if (!response.ok) throw new Error("Ошибка при сбросе статистики");

        return await response.text();
    } catch (error) {
        console.error("❌ Ошибка сброса статистики:", error);
        return null;
    }
});


ipcMain.handle("fetch-mac-table", async () => {
    try {
        const response = await fetch(`http://localhost:5215/api/mac-table`, { method: "GET" });
        if (!response.ok) throw new Error("Ошибка при получении MAC-таблицы");

        return await response.json(); // ✅ Возвращаем JSON с MAC-таблицей
    } catch (error) {
        console.error("❌ Ошибка получения MAC-таблицы:", error);
        return [];
    }
});

