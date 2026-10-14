/* PREVIEW PAGE (before.html)
   Play buttons ask you to log in first, sign up buttons go to sign up. */

document.querySelectorAll(".play-btn, .play-circle-lg").forEach(function (button) {
    button.addEventListener("click", function (event) {
        event.stopPropagation();
        window.location.href = "login.html";
    });
});

document.querySelectorAll(".promo-cta, .signup-free-btn").forEach(function (button) {
    button.addEventListener("click", function () {
        window.location.href = "signup.html";
    });
});
