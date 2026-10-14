/* LOGIN PAGE (login.html)*/
var users = getUsers();
document.getElementById("loginForm").addEventListener("submit", function (event) {
    event.preventDefault(); // stop the page from reloading

    var email = document.getElementById("email").value.trim();
    var password = document.getElementById("password").value;

    hideError("loginError");

    if (email === "" || password === "") {
        showError("loginError", "Please fill in both your email and password.");
        return;
    }

    var match = getUsers().find(function (u) {
        return u.email.toLowerCase() === email.toLowerCase() && u.password === password;
    });

    if (!match) {
        showError("loginError", "Incorrect email or password. Don't have an account? Sign up below.");
        return;
    }

    // success: remember who is logged in and open the app
    localStorage.setItem("spotifyCloneCurrentUser", match.email);
    window.location.href = "index.html";
});
