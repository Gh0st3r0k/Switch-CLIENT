///////////////////////////////////////////////////////////////////////////////////////////////////////////
// Initialization

// Wait until the document is fully loaded
document.addEventListener("DOMContentLoaded", () => {
    setupCloseButton();
    setupSettingButton();
    setupHostNameMonitor();
    updateTableFromApi();
    updateMacTableFromServer();
    setInterval(updateMacTableFromServer, 500); // Refresh MAC table every 0.5 seconds
});

// Global variables
var macCount = 0;
var timeMacTable = 60000;
var cleatMacTable = false;
var portsList = [];

let oldMacTable = new Map();
let mainMacTable = new Map();
let newMacTable = new Map();

// Setup the close button functionality
function setupCloseButton() {
    const closeBtn = document.getElementById("closeApp");
    if (closeBtn) {
        closeBtn.addEventListener("click", () => window.electronAPI.closeWindow());
    } else {
        window.electronAPI.printText("[ERROR] Close button not found.");
    }
}

// Setup the settings button functionality
function setupSettingButton() {
    const settingButton = document.getElementById("settingButton");
    if (settingButton) {
        settingButton.addEventListener("click", () => window.electronAPI.openSetting());
    } else {
        window.electronAPI.printText("[ERROR] Setting button not found.");
    }
}

// Setup periodic check for hostname changes
function setupHostNameMonitor() {
    const nameHeader = document.getElementById("nameApp");
    let currentName = nameHeader.textContent;

    async function checkAndUpdateHostName() {
        try {
            const newName = await window.electronAPI.getHostName();
            if (newName && newName !== currentName) {
                currentName = newName;
                nameHeader.textContent = newName;
            }
        } catch (error) {
            window.electronAPI.printText("[ERROR] Failed to fetch hostname:", error);
        }
    }

    setInterval(checkAndUpdateHostName, 1000);
}

// Show "Empty" in the MAC table if no entries exist
function MacTableIsEmpty() {
    const tableBody = document.querySelector(".table-container tbody");
    const newRow = document.createElement("tr");
    newRow.innerHTML = `<td>Empty</td>`;
    tableBody.appendChild(newRow);
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////
// Ports management

// Add a port element to the UI
function addPort(port, status) {
    const portsContainer = document.querySelector(".ports-container");
    const portNumber = port.number;

    if (!portsContainer) {
        window.electronAPI.printText("[ERROR] Ports container not found.");
        return;
    }

    const portButton = document.createElement("button");
    portButton.classList.add("port-button");

    const portLabel = document.createElement("span");
    portLabel.textContent = `Port #${portNumber}`;

    const statusIndicator = document.createElement("div");
    statusIndicator.classList.add("status", status);

    const color = getStatusColor(status);
    statusIndicator.style.backgroundColor = color;
    statusIndicator.style.boxShadow = `0px 0px 15px rgba(${hexToRgb(color)}, 0.9)`;

    portButton.appendChild(portLabel);
    portButton.appendChild(statusIndicator);
    portButton.setAttribute("data-port", portNumber);

    portButton.addEventListener("click", () => {
        window.electronAPI.printText(`[DEBUG] Opening port statistics for #${portNumber}`);
        window.electronAPI.openPortStat(port);
    });

    portsContainer.appendChild(portButton);

    monitorPortStatus(port);
}

// Monitor status changes for a given port
function monitorPortStatus(port) {
    const statusIndicator = document.querySelector(`.port-button[data-port="${port.number}"] .status`);
    if (!statusIndicator) return;

    let currentStatus = statusIndicator.classList.contains("green") ? "green" : "red";

    setInterval(async () => {
        const status = await window.electronAPI.getPortStatus(port.number);
        const newStatus = (status === 1) ? "green" : "red";

        if (newStatus !== currentStatus) {
            currentStatus = newStatus;
            const color = getStatusColor(newStatus);

            statusIndicator.className = "status " + newStatus;
            statusIndicator.style.backgroundColor = color;
            statusIndicator.style.boxShadow = `0px 0px 15px rgba(${hexToRgb(color)}, 0.9)`;

            window.electronAPI.printText(`[DEBUG] Port ${port.number} changed status to ${newStatus}`);
        }
    }, 2000);
}

// Update the list of ports displayed
async function updatePorts(ports) {
    deleteAllPorts();

    for (const port of ports) {
        const statusNumber = await window.electronAPI.getPortStatus(port.number);
        const status = (statusNumber === 1) ? "green" : "red";
        addPort(port, status);
    }
}

// Remove all ports from the UI
function deleteAllPorts() {
    const portsContainer = document.querySelector(".ports-container");

    if (!portsContainer) {
        window.electronAPI.printText("[ERROR] Ports container not found.");
        return;
    }

    portsContainer.replaceChildren();
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////
// MAC Table management

// Fetch and update MAC table from the server
async function updateMacTableFromServer() {
    try {
        const macTable = await window.electronAPI.GetMacTable();
        const serverMainTable = macTable.mainMacs;
        const serverNewTable = macTable.newMacs;

        if ((!serverMainTable || serverMainTable.length === 0) && (!serverNewTable || serverNewTable.length === 0)) {
            if (document.querySelector(".table-container tbody").children.length === 0) {
                deleteAllMacTable();
            }
            return;
        }

        processMacTables(serverMainTable, serverNewTable);
    } catch (error) {
        window.electronAPI.printText("[ERROR] Failed to update MAC table:", error);
    }
}

// Merge MAC table entries received from the server
function processMacTables(serverMainTable, serverNewTable) {
    oldMacTable = new Map(mainMacTable);
    mainMacTable.clear();

    serverMainTable.forEach(entry => {
        const mac = entry.macAddress;
        const data = { portNumber: entry.portNumber, expiration: new Date(entry.expiration) };

        if (!mainMacTable.has(mac) && !oldMacTable.has(mac)) {
            mainMacTable.set(mac, data);
            addRowToMacTable(entry.portNumber, mac, formatExpirationTime(data.expiration));
        }

        mainMacTable.set(mac, data);
    });

    serverNewTable.forEach(entry => {
        const mac = entry.macAddress;
        const data = { portNumber: entry.portNumber, expiration: new Date(entry.expiration) };

        newMacTable.set(mac, data);

        if (!mainMacTable.has(mac) && !oldMacTable.has(mac)) {
            mainMacTable.set(mac, data);
            addRowToMacTable(entry.portNumber, mac, formatExpirationTime(data.expiration));
        }
    });

    newMacTable.clear();
}

// Add a MAC address row to the table
function addRowToMacTable(port, mac, time) {
    const tableBody = document.querySelector(".table-container tbody");

    if (!tableBody) {
        window.electronAPI.printText("[ERROR] Table body not found.");
        return;
    }

    const newRow = document.createElement("tr");
    newRow.innerHTML = `
        <td class="column1" id="port-column">${port}</td>
        <td class="column2">${mac}</td>
        <td class="column3" id="time-column">${time}</td>
    `;

    if (macCount === 0) {
        tableBody.replaceChildren();
    }

    tableBody.appendChild(newRow);
    macCount++;

    adjustTableHeaderWidth();
    trackMacInTable(newRow, mac);
}

// Track and update expiration time for a MAC entry
function trackMacInTable(row, mac) {
    const updateInterval = 500;

    const checkInterval = setInterval(() => {
        const macData = mainMacTable.get(mac);

        if (macData) {
            const timeCell = row.querySelector("#time-column");
            const portCell = row.querySelector("#port-column");

            timeCell.textContent = formatExpirationTime(macData.expiration);
            portCell.textContent = macData.portNumber;
        }

        if (!macData || cleatMacTable) {
            clearInterval(checkInterval);
            row.remove();
            macCount--;
            adjustTableHeaderWidth();
            checkMacTableIsEmpty();
            mainMacTable.delete(mac);
            oldMacTable.delete(mac);
        }
    }, updateInterval);
}

// Clear all MAC table entries from UI and memory
function deleteAllMacTable() {
    const tableBody = document.querySelector(".table-container tbody");

    if (!tableBody) {
        console.error("[ERROR] Table body not found.");
        return;
    }

    tableBody.replaceChildren();
    macCount = 0;
    mainMacTable.clear();
    oldMacTable.clear();
    newMacTable.clear();

    checkMacTableIsEmpty();
}

// Check if MAC table is empty and display placeholder
function checkMacTableIsEmpty() {
    if (macCount === 0) {
        cleatMacTable = false;
        MacTableIsEmpty();
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////
// Helper Functions

function adjustTableHeaderWidth() {
    const tableHeader = document.querySelector(".table-header");
    const tableBody = document.querySelector(".table-container table");

    if (!tableHeader || !tableBody) {
        console.error("[ERROR] Table header or body not found.");
        return;
    }

    const tbodyWidth = tableBody.offsetWidth;
    tableHeader.style.width = `${tbodyWidth}px`;
}

function formatExpirationTime(expirationDate) {
    return expirationDate.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    }) + `.${expirationDate.getMilliseconds().toString().padStart(3, "0")}`;
}

function hexToRgb(hex) {
    hex = hex.replace("#", "");
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `${r}, ${g}, ${b}`;
}

function getStatusColor(status) {
    switch (status) {
        case "green": return "#00FF00";
        case "yellow": return "#FFFF00";
        case "red": return "#FF0000";
        default: return "#A0A0A0";
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////
// Communication with API

// Fetch and update ports list from server
async function updateTableFromApi() {
    portsList = await window.electronAPI.fetchPorts();
    if (!portsList) return;
    updatePorts(portsList);
}
