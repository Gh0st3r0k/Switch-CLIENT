import { poll, updateStatusIndicator } from "../shared/ui.js";

let stopStatistics;
let stopStatus;

function renderStatistics(statistics) {
    const body = document.querySelector(".stat-table tbody");
    body.replaceChildren();
    for (const [protocol, counters] of Object.entries(statistics)) {
        const row = document.createElement("tr");
        for (const [index, value] of [
            protocol,
            counters.in,
            counters.out
        ].entries()) {
            const cell = document.createElement("td");
            cell.className = index === 0 ? "protocol" : "number";
            cell.textContent = value;
            row.append(cell);
        }
        body.append(row);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document
        .getElementById("closeApp")
        .addEventListener("click", () =>
            window.electronAPI.closeCurrentWindow()
        );
    window.electronAPI.receiveData(async (port) => {
        // Replacing a selected port must also replace its polling loops.
        stopStatistics?.();
        stopStatus?.();
        renderStatistics(port.packetsStats);
        const name = await window.electronAPI.getPortName(port.number);
        document.getElementById("nameApp").textContent =
            `${name ?? "Adapter"} - Port #${port.number}`;
        stopStatistics = poll(async () => {
            const result = await window.electronAPI.fetchPortStatistics(
                port.number
            );
            if (result) renderStatistics(result.packetsStats);
        }, 500);
        stopStatus = poll(async () => {
            const status = await window.electronAPI.getPortStatus(port.number);
            updateStatusIndicator(
                document.getElementById("statusPort"),
                status
            );
        }, 2000);
    });
});
