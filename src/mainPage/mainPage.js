import { poll, updateStatusIndicator } from "../shared/ui.js";

const ports = new Map();
const macRows = new Map();

function renderPorts(serverPorts) {
    const container = document.querySelector(".ports-container");
    const activeNumbers = new Set(serverPorts.map((port) => port.number));
    for (const [number, entry] of ports) {
        if (!activeNumbers.has(number)) {
            entry.button.remove();
            ports.delete(number);
        }
    }

    for (const port of serverPorts) {
        if (!ports.has(port.number)) {
            const button = document.createElement("button");
            button.className = "port-button";
            button.dataset.port = port.number;
            const label = document.createElement("span");
            label.textContent = `Port #${port.number}`;
            const indicator = document.createElement("div");
            indicator.className = "status";
            button.append(label, indicator);
            button.addEventListener("click", () =>
                window.electronAPI.openPortStat(ports.get(port.number).port)
            );
            container.append(button);
            ports.set(port.number, { button, indicator, port });
        }
        ports.get(port.number).port = port;
    }
}

async function refreshPorts() {
    const serverPorts = await window.electronAPI.fetchPorts();
    updateStatusIndicator(
        document.getElementById("statusSwitch"),
        serverPorts ? 1 : null
    );
    if (!serverPorts) return;
    renderPorts(serverPorts);
    await Promise.all(
        [...ports.values()].map(async (entry) => {
            const status = await window.electronAPI.getPortStatus(
                entry.port.number
            );
            updateStatusIndicator(entry.indicator, status);
        })
    );
}

function formatLastSeen(timestamp) {
    const date = new Date(timestamp);
    return (
        date.toLocaleString("en-US", {
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        }) + `.${date.getMilliseconds().toString().padStart(3, "0")}`
    );
}

function renderMacTable(entries) {
    const body = document.querySelector(".table-container tbody");
    const currentMacs = new Set(entries.map((entry) => entry.macAddress));
    body.querySelector(".empty-row")?.remove();

    for (const [mac, row] of macRows) {
        if (!currentMacs.has(mac)) {
            row.remove();
            macRows.delete(mac);
        }
    }

    for (const entry of entries) {
        if (!macRows.has(entry.macAddress)) {
            const row = document.createElement("tr");
            for (const className of ["column1", "column2", "column3"]) {
                const cell = document.createElement("td");
                cell.className = className;
                row.append(cell);
            }
            body.append(row);
            macRows.set(entry.macAddress, row);
        }
        const cells = macRows.get(entry.macAddress).cells;
        cells[0].textContent = entry.portNumber;
        cells[1].textContent = entry.macAddress;
        // The API's legacy "expiration" field records when the address was last seen.
        cells[2].textContent = formatLastSeen(entry.expiration);
    }

    if (entries.length === 0) {
        const row = document.createElement("tr");
        row.className = "empty-row";
        const cell = document.createElement("td");
        cell.colSpan = 3;
        cell.textContent = "No learned MAC addresses";
        row.append(cell);
        body.append(row);
    }

    document.querySelector(".table-header").style.width =
        `${body.closest("table").offsetWidth}px`;
}

async function refreshMacTable() {
    const table = await window.electronAPI.fetchMacTable();
    if (!table) return;
    // Merge the snapshot and newly delivered entries before removing stale rows.
    const entries = new Map(
        [...table.mainMacs, ...table.newMacs].map((entry) => [
            entry.macAddress,
            entry
        ])
    );
    renderMacTable([...entries.values()]);
}

document.addEventListener("DOMContentLoaded", () => {
    document
        .getElementById("closeApp")
        .addEventListener("click", () => window.electronAPI.closeWindow());
    document
        .getElementById("settingButton")
        .addEventListener("click", () => window.electronAPI.openSetting());
    renderMacTable([]);
    poll(refreshPorts, 2000);
    poll(refreshMacTable, 500);
    poll(async () => {
        const name = await window.electronAPI.getHostName();
        if (name) document.getElementById("nameApp").textContent = name;
    }, 1000);
});
