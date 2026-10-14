/* AUTH GUARD (used by index.html)
   If nobody is logged in, send them to the login page. */

if (!localStorage.getItem("spotifyCloneCurrentUser")) {
    window.location.href = "login.html";
}
