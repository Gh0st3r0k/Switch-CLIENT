///////////////////////////////////////////////////////////////////////////////////////////////////////////
// Initialization

let portNumber = null;

document.addEventListener("DOMContentLoaded", () => {
    setupWindowControls();
    setupPortDataReceiver();
    startStatisticsUpdater();
});

// Setup the close button functionality
function setupWindowControls() {
    const closeBtn = document.getElementById("closeApp");

    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            window.electronAPI.closeCurrentWindow();
        });
    } else {
        window.electronAPI.printText("[ERROR] Close button not found!");
    }
}

// Receive data about the selected port and initialize page
function setupPortDataReceiver() {
    if (!window.electronAPI) {
        window.electronAPI.printText("[ERROR] window.electronAPI is not defined!");
        return;
    }

    window.electronAPI.receiveData(async (port) => {
        const name = await window.electronAPI.getPortName(port.number);
        document.getElementById("nameApp").textContent = `${name} - Port #${port.number}`;
        portNumber = port.number;
        startPortStatusMonitor(port.number);
        fillTable(convertPacketsStatsToData(port.packetsStats));
    });
}

// Start periodic statistics update
function startStatisticsUpdater() {
    setInterval(updatePortStatistics, 100);
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////
// Port statistics handling

// Update the table with new port statistics
async function updatePortStatistics() {
    if (!portNumber) return;

    const statistics = await window.electronAPI.fetchPortStatistics(portNumber);
    if (!statistics) return;

    fillTable(convertPacketsStatsToData(statistics.packetsStats));
}

// Convert packets statistics object to array format
function convertPacketsStatsToData(packetsStats) {
    return Object.entries(packetsStats).map(([protocol, stats]) => [
        protocol,
        parseInt(stats.in, 10),
        parseInt(stats.out, 10)
    ]);
}

// Fill the table with statistics data
function fillTable(data) {
    const tableBody = document.querySelector(".stat-table tbody");

    if (!tableBody) {
        window.electronAPI.printText("[ERROR] Table body not found.");
        return;
    }

    tableBody.replaceChildren();

    data.forEach(row => {
        const newRow = document.createElement("tr");

        newRow.innerHTML = `
            <td class="protocol">${row[0]}</td>  <!-- Protocol name -->
            <td class="number">${row[1]}</td>    <!-- Incoming packets -->
            <td class="number">${row[2]}</td>    <!-- Outgoing packets -->
        `;

        tableBody.appendChild(newRow);
    });
}

// Reset the table to default zero values
function resetTable() {
    const defaultData = [
        ["Ethernet II", 0, 0],
        ["ARP", 0, 0],
        ["IP", 0, 0],
        ["TCP", 0, 0],
        ["UDP", 0, 0],
        ["ICMP", 0, 0],
        ["HTTP", 0, 0]
    ];

    fillTable(defaultData);
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////
// Port status monitoring

// Start monitoring the status of the selected port
function startPortStatusMonitor(portNumber) {
    const interval = 2000; // Check every 2 seconds

    async function checkStatus() {
        const status = await window.electronAPI.getPortStatus(portNumber);
        updatePortStatusIndicator(status);
    }

    checkStatus(); // Immediate first check
    setInterval(checkStatus, interval);
}

// Update the color indicator based on port status
function updatePortStatusIndicator(status) {
    const indicator = document.getElementById("statusPort");
    if (!indicator) {
        window.electronAPI.printText("[ERROR] Element with id='statusPort' not found.");
        return;
    }

    let color = "red";
    if (status === 1) {
        color = "green";
    }

    indicator.style.backgroundColor = getStatusColor(color);
    indicator.style.boxShadow = `0 0 15px rgba(${hexToRgb(color)}, 0.9)`;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////
// Utility functions

// Get the color code based on status
function getStatusColor(status) {
    switch (status) {
        case "green": return "#00FF00";
        case "yellow": return "#FFFF00";
        case "red": return "#FF0000";
        default: return "#A0A0A0";
    }
}

// Convert hex color to RGB format
function hexToRgb(hex) {
    hex = hex.replace("#", "");
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `${r}, ${g}, ${b}`;
}
