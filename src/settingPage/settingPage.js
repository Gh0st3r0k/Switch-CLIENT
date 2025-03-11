async function updateMacTableTTL() {
    try {
        const settings = await window.electronAPI.fetchSettings();
        if (settings) {
            const numberInput = document.getElementById("numberTimeMacTable");
            if (numberInput) {
                var time = settings.newTime / 1000;
                // const macTableTTL = parseInt(settings.MacTableTTL, 10); // ✅ Преобразуем в int
                if (!isNaN(time)) {
                    numberInput.value = time; // ✅ Преобразуем обратно в строку для input
                    window.electronAPI.printText("✅ Установлено значение TTL:");
                } else {
                    window.electronAPI.printText("❌ Ошибка: `MacTableTTL` не является числом.");
                }
            }
        }
    } catch (error) {
        window.electronAPI.printText("❌ Ошибка обновления TTL:", error);
    }
}

// ✅ Запускаем при загрузке страницы
document.addEventListener("DOMContentLoaded", () => {
    updateMacTableTTL(); // 🔹 Устанавливаем начальное значение

    const resetMacTableButton = document.getElementById("resetButtonMacTable");
    const resetStatisticsButton = document.getElementById("resetButtonStatistics");


    resetMacTableButton.addEventListener("click", () => {
        window.electronAPI.resetMacTable();
    });
    
    // 📌 3️⃣ Сброс статистики
    resetStatisticsButton.addEventListener("click", () => {
        window.electronAPI.resetStatistics();
    });
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

document.addEventListener("DOMContentLoaded", () => {
    const numberInput = document.getElementById("numberTimeMacTable");

    if (numberInput) {
        numberInput.addEventListener("input", () => {
            var newTime = numberInput.value * 1000;
            console.log("Новое значение:", newTime);
            window.electronAPI.updateSettings(newTime);
        });
    } else {
        console.error("❌ Поле ввода `numberTimeMacTable` не найдено!");
    }
});

