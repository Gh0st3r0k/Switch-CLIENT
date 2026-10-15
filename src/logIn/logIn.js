document.addEventListener("DOMContentLoaded", () => {
    const username = document.getElementById("username");
    const password = document.getElementById("password");
    const loginButton = document.getElementById("login-button");
    const toggle = document.querySelector(".toggle-password");

    document
        .getElementById("closeApp")
        .addEventListener("click", () => window.electronAPI.closeWindow());
    toggle.addEventListener("click", () => {
        const showPassword = password.type === "password";
        password.type = showPassword ? "text" : "password";
        toggle.textContent = showPassword ? "Hide" : "Show";
        toggle.setAttribute("aria-pressed", String(showPassword));
    });

    async function login() {
        if (loginButton.disabled) return;
        if (!username.value.trim() || !password.value) {
            alert("Please enter your username and password.");
            return;
        }

        // Prevent duplicate submissions while the main process waits for the API.
        loginButton.disabled = true;
        try {
            const status = await window.electronAPI.sendLoginRequest(
                username.value.trim(),
                password.value
            );
            if (status === "ok") {
                window.electronAPI.openMainWindow();
            } else {
                alert(
                    "Login failed. Check your credentials and make sure the server is running."
                );
            }
        } catch (error) {
            console.error("Login failed:", error);
            alert("The server is unavailable. Please try again.");
        } finally {
            loginButton.disabled = false;
        }
    }

    loginButton.addEventListener("click", login);
    for (const input of [username, password]) {
        input.addEventListener("keydown", (event) => {
            if (event.key === "Enter") login();
        });
    }
});
