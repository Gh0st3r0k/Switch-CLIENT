var portNumber = null;

document.addEventListener("DOMContentLoaded", () => {
    if (window.electronAPI) {
        window.electronAPI.receiveData(async (port) => {
            const name = await window.electronAPI.getPortName(port.number);
            document.getElementById("nameApp").textContent = `${name} - Port #${port.number}`;
            portNumber = port.number;
            startPortStatusMonitor(port.number);
            fillTable(convertPacketsStatsToData(port.packetsStats));
        });
    } else {
        console.error("❌ window.electronAPI не определен!");
    }
});

document.addEventListener("DOMContentLoaded", () => {
    console.log("Statistic page loaded");
    const closeBtn = document.getElementById("closeApp");

    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            window.electronAPI.closeCurrentWindow();
        });
    } else {
        console.error("Button closed-window dont find!");
    }
});

function fillTable(data) {
    console.log(data);
    const tableBody = document.querySelector(".stat-table tbody");

    if (!tableBody) {
        console.error("Ошибка: `tbody` не найден.");
        return;
    }

    tableBody.replaceChildren();

    data.forEach(row => {
        const newRow = document.createElement("tr");

        newRow.innerHTML = `
            <td class="protocol">${row[0]}</td>  <!-- Название протокола -->
            <td class="number">${row[1]}</td>  <!-- Входящие (in) -->
            <td class="number">${row[2]}</td>  <!-- Исходящие (out) -->
        `;

        tableBody.appendChild(newRow);
    });
}

function resetTable() {

    let resetData = [
        ["Ethernet 2", 0, 0],
        ["ARP", 0, 0],
        ["IP", 0, 0],
        ["TCP", 0, 0],
        ["UDP", 0, 0],
        ["ICMP", 0, 0],
        ["HTTP", 0, 0]
    ];

    fillTable(resetData);

}

function convertPacketsStatsToData(packetsStats) {
    return Object.entries(packetsStats).map(([protocol, stats]) => [
        protocol,
        parseInt(stats.in, 10),
        parseInt(stats.out, 10)
    ]);
}








async function updatePortStatistics() {
    if (!portNumber) return;
    const statistics = await window.electronAPI.fetchPortStatistics(portNumber);
    if (!statistics) return;

    fillTable(convertPacketsStatsToData(statistics.packetsStats));
}


document.addEventListener("DOMContentLoaded", () => {
    setInterval(updatePortStatistics, 100);
});










function startPortStatusMonitor(portNumber) {
    const interval = 500; // 🔁 Интервал проверки в миллисекундах

    async function checkStatus() {
        const status = await window.electronAPI.getPortStatus(portNumber);
        updatePortStatusIndicator(status);
    }

    // ✅ Запускаем проверку каждые 2 секунды
    checkStatus(); // сразу первая проверка
    setInterval(checkStatus, interval);
}

function updatePortStatusIndicator(status) {
    const indicator = document.getElementById("statusPort");
    if (!indicator) {
        console.error("❌ Не найден элемент с id='statusPort'");
        return;
    }

    let color = "red";
    if (status === 1) {
        color = "green";
    }

    indicator.style.backgroundColor = getStatusColor(color);
    indicator.style.boxShadow = `0 0 15px rgba(${hexToRgb(color)}, 0.9)`;
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

function hexToRgb(hex) {
    hex = hex.replace("#", "");
    let bigint = parseInt(hex, 16);
    let r = (bigint >> 16) & 255;
    let g = (bigint >> 8) & 255;
    let b = bigint & 255;
    return `${r}, ${g}, ${b}`;
}
