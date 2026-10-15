document.addEventListener("DOMContentLoaded", async () => {
    const lifetimeInput = document.getElementById("numberTimeMacTable");
    const nameInput = document.getElementById("deviceNameInput");
    document
        .getElementById("closeApp")
        .addEventListener("click", () =>
            window.electronAPI.closeCurrentWindow()
        );

    const [settings, name] = await Promise.all([
        window.electronAPI.fetchSettings(),
        window.electronAPI.getHostName()
    ]);
    if (settings) lifetimeInput.value = settings.newTime / 1000;
    if (name) nameInput.value = name;

    // The UI uses seconds; the existing API contract uses milliseconds.
    lifetimeInput.addEventListener("change", async () => {
        if (!lifetimeInput.reportValidity() || lifetimeInput.value === "")
            return;
        const result = await window.electronAPI.updateSettings(
            Number(lifetimeInput.value) * 1000
        );
        if (!result) alert("Failed to update the MAC entry lifetime.");
    });

    document
        .getElementById("confirmDeviceNameButton")
        .addEventListener("click", async () => {
            const name = nameInput.value.trim();
            if (!name) {
                alert("Please enter a device name.");
                return;
            }
            if (!(await window.electronAPI.setHostName(name)))
                alert("Failed to update the device name.");
        });

    for (const [buttonId, reset] of [
        ["resetButtonMacTable", () => window.electronAPI.resetMacTable()],
        ["resetButtonStatistics", () => window.electronAPI.resetStatistics()]
    ]) {
        document
            .getElementById(buttonId)
            .addEventListener("click", async () => {
                if (!(await reset()))
                    alert(
                        "Failed to reset the data. Make sure the server is running."
                    );
            });
    }
});
