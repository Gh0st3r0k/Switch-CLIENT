//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Init

var macCount = 0;

MacTableIsEmpty();

function MacTableIsEmpty() {
    
    const tableBody = document.querySelector(".table-container tbody");

    const newRow = document.createElement("tr");

    newRow.innerHTML = `<td>Empty</td>`;

    tableBody.appendChild(newRow);
    
}





//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Main func

function changeStatusSwitchColor(status) {
    let color = "red";
    if (status === "on") {
        color = "green";
    }
    const indicator = document.getElementById("statusSwitch");
    if (indicator) {
        indicator.style.backgroundColor = color;

        let shadowColor = `rgba(${hexToRgb(color)}, 0.9)`;

        indicator.style.boxShadow = `0px 0px 15px ${shadowColor}`;
    }

}

document.addEventListener("DOMContentLoaded", () => {
    const closeBtn = document.getElementById("closeApp");

    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            window.electronAPI.closeWindow();
        });
    } else {
        console.error("Button closed-window dont find!");
    }



    const settingButton = document.getElementById("settingButton");

    if (settingButton) {
        settingButton.addEventListener("click", () => {
            window.electronAPI.openSetting();
        });
    } else {
        console.error("Button settingButton dont find!");
    }
});


//////////////////////////////////////////////////
// Ports

function addPort(port, status) {
    const portsContainer = document.querySelector(".ports-container");
    const portNumber = port.number;

    if (!portsContainer) {
        console.error("Error: `ports-container` not found.");
    }

    const portButton = document.createElement("button");
    portButton.classList.add("port-button");

    const portLabel = document.createElement("span");
    portLabel.textContent = `Port #${portNumber}`;

    const statusIndicator = document.createElement("div");
    statusIndicator.classList.add("status", status);

    let color = getStatusColor(status);
    statusIndicator.style.backgroundColor = color;
    let shadowColor = `rgba(${hexToRgb(color)}, 0.9)`;
    statusIndicator.style.boxShadow = `0px 0px 15px ${shadowColor}`;

    portButton.appendChild(portLabel);
    portButton.appendChild(statusIndicator);

    // TODO: Добавить открытие нового окна (статистики порта)
    portButton.addEventListener("click", () => {
        console.log(`Открыть статистику порта #${portNumber}`);
        window.electronAPI.openPortStat(port);
    });

    portsContainer.appendChild(portButton);
}

function updatePorts(ports) {
    deleteAllPorts();

    for (let port of ports) {
        // let status = "red";
        // if (port.status === "up") {
        //     status = "green";
        // }
        addPort(port, "green");
    }
}

function deleteAllPorts() {
    const portsContainer = document.querySelector(".ports-container");

    if (!portsContainer) {
        console.error("Error: `ports-container` not found.");
        return;
    }

    portsContainer.replaceChildren();
}



//////////////////////////////////////////////////
// Mac-table

var timeMacTable = 5000;

document.addEventListener("DOMContentLoaded", () => {
    updateMacTableFromServer()
    setInterval(updateMacTableFromServer, 100); // 🔄 Обновление каждую секунду
});




//////////////////////////////////////////////////////////////////////////////


// async function updateMacTableFromServer() {
//     try {

//         //updateMacTableTTL();

//         const macTable = await window.electronAPI.GetMacTable(); // 🔥 Получаем MAC-таблицу

//         if (!macTable || macTable.length === 0) {
//             console.log("⚠️ MAC-таблица пуста.");
//             return;
//         }

//         macTable.forEach(entry => {
//             const port = entry.portNumber;
//             const mac = entry.macAddress;
//             const expirationDate = new Date(entry.expiration); // 🕒 Преобразуем `expiration` в объект Date
        
//             const formattedTime = expirationDate.toLocaleString("en-US", {
//                 "year": "numeric",
//                 "month": "short",
//                 "day": "2-digit",
//                 "hour": "2-digit",
//                 "minute": "2-digit",
//                 "second": "2-digit",
//                 hour12: false
//             }) + `.${expirationDate.getMilliseconds().toString().padStart(3, "0")}`; // 🔥 Добавляем миллисекунды
        
//             addRowToMacTable(port, mac, formattedTime); // 🔹 Передаем форматированную дату
//         });

//     } catch (error) {
//         console.error("❌ Ошибка обновления MAC-таблицы:", error);
//     }
// }

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

let mainMacTable = new Map();
let newMacTable = new Map();

async function updateMacTableFromServer() {
    try {
        //updateMacTableTTL();

        var macTable = await window.electronAPI.GetMacTable();
        var serverMainTable = macTable.mainMacs;
        var serverNewTable = macTable.newMacs;

        if ((!serverMainTable || serverMainTable.length === 0) && (!serverNewTable || serverNewTable.length === 0)) {
            console.log("⚠️ MAC-таблица пуста.");
            return;
        }

        // ✅ Обновляем `mainMacTable` и `newMacTable`
        processMacTables(serverMainTable, serverNewTable);

    } catch (error) {
        console.error("❌ Ошибка обновления MAC-таблицы:", error);
    }
}

function processMacTables(serverMainTable, serverNewTable) {

    mainMacTable.clear();
    // 🔥 Обновляем `mainMacTable`
    serverMainTable.forEach(entry => {
        const mac = entry.macAddress;
        const data = {
            portNumber: entry.portNumber,
            expiration: new Date(entry.expiration) // 🕒 Преобразуем `expiration` в объект Date
        };

        mainMacTable.set(mac, data); // ✅ Перезаписываем данные в `mainMacTable`
    });

    // 🔥 Обрабатываем `newMacTable`
    serverNewTable.forEach(entry => {
        const mac = entry.macAddress;
        const data = {
            portNumber: entry.portNumber,
            expiration: new Date(entry.expiration)
        };

        newMacTable.set(mac, data); // ✅ Записываем данные в `newMacTable`

        // ✅ Если MAC-адреса нет в `mainMacTable`, добавляем его
        if (!mainMacTable.has(mac)) {
            mainMacTable.set(mac, data);
        }

        // 🔥 Добавляем данные в UI
        addRowToMacTable(entry.portNumber, mac, formatExpirationTime(data.expiration));
    });

    console.log("📥 Обновленный `mainMacTable`:", mainMacTable);
    console.log("📥 Обновленный `newMacTable`:", newMacTable);

    // ✅ Очистка `newMacTable` после обработки
    newMacTable.clear();
}

function formatExpirationTime(expirationDate) {
    return expirationDate.toLocaleString("en-US", {
        "year": "numeric",
        "month": "short",
        "day": "2-digit",
        "hour": "2-digit",
        "minute": "2-digit",
        "second": "2-digit",
        hour12: false
    }) + `.${expirationDate.getMilliseconds().toString().padStart(3, "0")}`;
}

function findMacInMain(macAddress) {
    return mainMacTable.get(macAddress) || null; // 🔹 Вернёт `null`, если MAC-адреса нет
}

// async function updateMacTableTTL() {
//     try {
//         const settings = await window.electronAPI.fetchSettings();
//         timeMacTable = settings.newTime;
//     } catch (error) {
//         console.error("❌ Ошибка обновления TTL:", error);
//     }
// }

function addRowToMacTable(port, mac, time) {
    
    const tableBody = document.querySelector(".table-container tbody");

    if (!tableBody) {
        console.error("Ошибка: Не найден `tbody` в `.table-container`");
        return;
    }

    const newRow = document.createElement("tr");

    newRow.innerHTML = `
        <td class="column1" id="port-column">${port}</td>
        <td class="column2">${mac}</td>
        <td class="column3" id="time-column">${time}</td>
    `;

    if (macCount == 0) {
        tableBody.replaceChildren();
    }

    tableBody.appendChild(newRow);
    macCount++;

    adjustTableHeaderWidth();

    trackMacInTable(newRow, mac);
}

function trackMacInTable(row, mac) {
    const updateInterval = 100; // 🔥 Проверяем каждые 100 мс

    const checkInterval = setInterval(() => {
        const macData = findMacInMain(mac);

        if (macData) {
            // ✅ MAC-адрес найден → обновляем время
            const timeCell = row.querySelector("#time-column");
            timeCell.textContent = formatExpirationTime(macData.expiration);
            const portCell = row.querySelector("#port-column");
            portCell.textContent = macData.portNumber;
        } 
        
        if (!macData) {
            // ❌ MAC-адреса нет в `mainMacTable` или истёк `timeMacTable`
            clearInterval(checkInterval);
            row.remove();
            macCount--;
            adjustTableHeaderWidth();
            checkMacTableIsEmpty();
        }
    }, updateInterval);
}


function updateMacTable(macTable) {
    deleteAllMacTable();

    for (let mac of macTable) {
        addRowToMacTable(mac.port, mac.mac, mac.time);
    }
}

function deleteAllMacTable() {
    const tableBody = document.querySelector(".table-container tbody");

    if (!tableBody) {
        console.error("Error: `table-body` not found.");
    }

    tableBody.replaceChildren();
    macCount = 0;

    checkMacTableIsEmpty();
}

function checkMacTableIsEmpty() {
    if (macCount == 0) {
        MacTableIsEmpty();
    }
}





//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Sub func

function adjustTableHeaderWidth() {
    const tableHeader = document.querySelector(".table-header"); 
    const tableContainer = document.querySelector(".table-container");
    const tableBody = document.querySelector(".table-container table");

    if (!tableHeader || !tableContainer || !tableBody) {
        console.error("Error: `table-header`, `table-container` or `table-body` dont found.");
        return;
    }

    const tbodyWidth = tableBody.offsetWidth;
    tableHeader.style.width = `${tbodyWidth}px`;
}

function hexToRgb(hex) {
    hex = hex.replace("#", "");
    let bigint = parseInt(hex, 16);
    let r = (bigint >> 16) & 255;
    let g = (bigint >> 8) & 255;
    let b = bigint & 255;
    return `${r}, ${g}, ${b}`;
}


function getStatusColor(status) {
    switch (status) {
        case "green":
            return "#00FF00";
        case "yellow":
            return "#FFFF00";
        case "red":
            return "#FF0000";
        default:
            return "#A0A0A0"; 
    }
}

function getScrollbarWidth() {
    return window.innerWidth - document.documentElement.clientWidth;
}



//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Comunication with api

var portsList = [];

async function updateTableFromApi() {
    portsList = await window.electronAPI.fetchPorts();
    if (!portsList) return;

    updatePorts(portsList);
    
    //const tableData = convertPacketsStatsToData(firstPort.packetsStats);
    
}

document.addEventListener("DOMContentLoaded", () => {
    updateTableFromApi();
//    setInterval(updateTableFromApi, 5000);
});
 


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Creat test data

// setTimeout(() => {
//     window.electronAPI.print();
//     addRowToMacTable(2, "BB:BB:BB:BB:BB:BB", "2024-02-26 15:45:12.456");
//     addRowToMacTable(3, "CC:CC:CC:CC:CC:CC", "2024-02-26 15:45:12.789");
//     addRowToMacTable(2, "BB:BB:BB:BB:BB:BB", "2024-02-26 15:45:12.456");
//     addRowToMacTable(3, "CC:CC:CC:CC:CC:CC", "2024-02-26 15:45:12.789");
//     addRowToMacTable(2, "BB:BB:BB:BB:BB:BB", "2024-02-26 15:45:12.456");
//     addRowToMacTable(3, "CC:CC:CC:CC:CC:CC", "2024-02-26 15:45:12.789");
//     addRowToMacTable(2, "BB:BB:BB:BB:BB:BB", "2024-02-26 15:45:12.456");
//     addRowToMacTable(3, "CC:CC:CC:CC:CC:CC", "2024-02-26 15:45:12.789");
//     addRowToMacTable(2, "BB:BB:BB:BB:BB:BB", "2024-02-26 15:45:12.456");
//     addRowToMacTable(3, "CC:CC:CC:CC:CC:CC", "2024-02-26 15:45:12.789");
//     addRowToMacTable(2, "BB:BB:BB:BB:BB:BB", "2024-02-26 15:45:12.456");
//     addRowToMacTable(3, "CC:CC:CC:CC:CC:CC", "2024-02-26 15:45:12.789");
// }, 5000);



// ✅ Добавляем 10 портов для теста
// for (let i = 1; i <= 6; i++) {
//     let randomStatus = ["green", "yellow", "red"][Math.floor(Math.random() * 3)];
//     addPort(i, randomStatus);
// }



// setTimeout(() => changeStatusSwitchColor("off"), 3000);
