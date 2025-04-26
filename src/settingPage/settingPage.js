///////////////////////////////////////////////////////////////////////////////////////////////////////////
// Initialization

document.addEventListener("DOMContentLoaded", () => {
    initializeTTLSettings();
    initializeResetButtons();
    initializeDeviceNameInput();
    initializeCloseButton();
    initializeMacTableInput();
});

// Load and set current MAC table TTL on page load
async function initializeTTLSettings() {
    try {
        const settings = await window.electronAPI.fetchSettings();
        if (settings) {
            const numberInput = document.getElementById("numberTimeMacTable");
            if (numberInput) {
                const timeInSeconds = settings.newTime / 1000;
                if (!isNaN(timeInSeconds)) {
                    numberInput.value = timeInSeconds;
                    window.electronAPI.printText("[DEBUG] TTL value initialized.");
                } else {
                    window.electronAPI.printText("[ERROR] Received TTL is not a number.");
                }
            }
        }
    } catch (error) {
        window.electronAPI.printText("[ERROR] Failed to fetch TTL:", error);
    }
}

// Setup reset buttons for MAC table and statistics
function initializeResetButtons() {
    const resetMacTableButton = document.getElementById("resetButtonMacTable");
    const resetStatisticsButton = document.getElementById("resetButtonStatistics");

    if (resetMacTableButton) {
        resetMacTableButton.addEventListener("click", () => {
            window.electronAPI.resetMacTable();
        });
    }

    if (resetStatisticsButton) {
        resetStatisticsButton.addEventListener("click", () => {
            window.electronAPI.resetStatistics();
        });
    }
}

// Setup device name input and button
function initializeDeviceNameInput() {
    const input = document.getElementById("deviceNameInput");
    const button = document.getElementById("confirmDeviceNameButton");

    if (!input || !button) {
        window.electronAPI.printText("[ERROR] Device name input or confirm button not found.");
        return;
    }

    button.addEventListener("click", async () => {
        const name = input.value.trim();
        if (!name) {
            alert("Please enter a device name.");
            return;
        }

        const result = await window.electronAPI.setHostName(name);
        if (result) {
            window.electronAPI.printText("[DEBUG] Hostname updated successfully.");
        } else {
            alert("Failed to update hostname.");
        }
    });

    // Optionally pre-fill current hostname
    window.electronAPI.getHostName().then((name) => {
        if (name) {
            input.value = name;
        }
    });
}

// Setup close button functionality
function initializeCloseButton() {
    const closeBtn = document.getElementById("closeApp");

    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            window.electronAPI.closeCurrentWindow();
        });
    } else {
        window.electronAPI.printText("[ERROR] Close button not found.");
    }
}

// Handle TTL input changes
function initializeMacTableInput() {
    const numberInput = document.getElementById("numberTimeMacTable");

    if (numberInput) {
        numberInput.addEventListener("input", () => {
            const newTime = numberInput.value * 1000;
            window.electronAPI.printText("[DEBUG] New TTL value:", newTime);
            window.electronAPI.updateSettings(newTime);
        });
    } else {
        window.electronAPI.printText("[ERROR] MAC table time input field not found.");
    }
}
