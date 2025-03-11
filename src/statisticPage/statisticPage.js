var portNumber = null;

document.addEventListener("DOMContentLoaded", () => {
    if (window.electronAPI) {
        window.electronAPI.receiveData((port) => {
            document.getElementById("nameApp").textContent = `Port #${port.number}`;
            portNumber = port.number;
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