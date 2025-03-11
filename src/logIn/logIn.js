document.addEventListener("DOMContentLoaded", () => {    
    const closeBtn = document.getElementById("closeApp");

    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            window.electronAPI.closeWindow();
        });
    } else {
        console.error("Button closed-window dont find!");
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const toggleButton = document.querySelector(".toggle-password");

    if (toggleButton) {
        toggleButton.addEventListener("click", togglePassword);
    }

    const logInButton = document.querySelector("#login-button");
    const username = document.getElementById("username");
    const password = document.getElementById("password");

    if (logInButton) {
        logInButton.addEventListener("click", () => login(username, password));
    }

});

function togglePassword() {
    let passwordInput = document.getElementById("password");
    let toggleButton = document.querySelector(".toggle-password");

    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        toggleButton.textContent = "🙈";
    } else {
        passwordInput.type = "password";
        toggleButton.textContent = "🥺";
    }
}


async function login(username, password) {
    if (!username.value || !password.value) {
        alert("⚠️ Please enter your username and password!");
        return;
    }

    // console.log(`✅ Logging in as: ${username.value}`);

    try {
        const response = await window.electronAPI.sendLoginRequest(username.value, password.value);

        window.electronAPI.printText("⌛⌛⌛ " + response);
        if (response === "ok") {
            console.log("✅ Login successful!");
            window.electronAPI.openMainWindow(); // 🔥 Открываем `mainWindow`
        } else {
            alert("❌ Invalid username or password!");
        }
    } catch (error) {
        console.error("❌ Error during login:", error);
        alert("⚠️ Server error. Please try again later.");
    }

    username.removeAttribute("disabled");
    password.removeAttribute("disabled");
    username.removeAttribute("readonly");
    password.removeAttribute("readonly");
}