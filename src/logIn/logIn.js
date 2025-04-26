// Wait until the document is fully loaded
document.addEventListener("DOMContentLoaded", () => {
    setupCloseButton();
    setupPasswordToggle();
    setupLoginButton();
});

// Setup the button to close the application
function setupCloseButton() {
    const closeBtn = document.getElementById("closeApp");

    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            window.electronAPI.closeWindow();
        });
    } else {
        window.electronAPI.printText("[ERROR] Close button not found!");
    }
}

// Setup the button to toggle password visibility
function setupPasswordToggle() {
    const toggleButton = document.querySelector(".toggle-password");

    if (toggleButton) {
        toggleButton.addEventListener("click", togglePassword);
    }
}

// Setup the login button to send login request
function setupLoginButton() {
    const logInButton = document.getElementById("login-button");
    const username = document.getElementById("username");
    const password = document.getElementById("password");

    if (logInButton) {
        logInButton.addEventListener("click", () => login(username, password));
    } else {
        window.electronAPI.printText("[ERROR] Login button not found!");
    }
}

// Toggle password input between visible and hidden
function togglePassword() {
    const passwordInput = document.getElementById("password");
    const toggleButton = document.querySelector(".toggle-password");

    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        toggleButton.textContent = "🙈";
    } else {
        passwordInput.type = "password";
        toggleButton.textContent = "🥺";
    }
}

// Handle login process
async function login(usernameInput, passwordInput) {
    if (!usernameInput.value || !passwordInput.value) {
        alert("Please enter your username and password!");
        return;
    }

    try {
        const response = await window.electronAPI.sendLoginRequest(usernameInput.value, passwordInput.value);

        window.electronAPI.printText(`[DEBUG] Server response: ${response}`);
        if (response === "ok") {
            window.electronAPI.printText("[DEBUG] Login successful!");
            window.electronAPI.openMainWindow(); // Open main window after successful login
        } else {
            alert("Invalid username or password!");
        }
    } catch (error) {
        window.electronAPI.printText("[ERROR] Login failed:", error);
        alert("Server error. Please try again later.");
    }

    usernameInput.removeAttribute("disabled");
    passwordInput.removeAttribute("disabled");
    usernameInput.removeAttribute("readonly");
    passwordInput.removeAttribute("readonly");
}
