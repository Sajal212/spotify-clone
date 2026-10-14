/* SIGN UP PAGE (signup.html)
   Needs users.js loaded first. */

// when the form is submitted...
document.getElementById("signupForm").addEventListener("submit", function (event) {
    event.preventDefault(); // stop the page from reloading

    var email = document.getElementById("email").value.trim();
    var password = document.getElementById("password").value;
    var confirmPassword = document.getElementById("confirmPassword").value;

    hideError("signupError");

    if (email === "" || password === "" || confirmPassword === "") {
        showError("signupError", "Please fill in every field.");
        return;
    }

    // simple email check: something@something.something
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError("signupError", "That doesn't look like a valid email address.");
        return;
    }

    if (password.length < 6) {
        showError("signupError", "Your password needs to be at least 6 characters.");
        return;
    }

    if (password !== confirmPassword) {
        showError("signupError", "Those passwords don't match.");
        return;
    }

    var users = getUsers();
    var emailTaken = users.some(function (u) {
        return u.email.toLowerCase() === email.toLowerCase();
    });

    if (emailTaken) {
        showError("signupError", "An account with that email already exists. Try logging in instead.");
        return;
    }

    // success: save the account, log them in, open the app
    users.push({ email: email, password: password });
    saveUsers(users);
    localStorage.setItem("spotifyCloneCurrentUser", email);
    window.location.href = "index.html";
});
