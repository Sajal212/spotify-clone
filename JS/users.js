/* USERS HELPER (used by login.html and signup.html)
   There is no real server, so accounts are saved in the
   browser's localStorage as a list under "spotifyCloneUsers". */

function getUsers() {
    var saved = localStorage.getItem("spotifyCloneUsers");
    return saved ? JSON.parse(saved) : [];
}

function saveUsers(users) {
    localStorage.setItem("spotifyCloneUsers", JSON.stringify(users));
}

// show a red message in the error box (login and signup both use this)
function showError(boxId, message) {
    var box = document.getElementById(boxId);
    box.textContent = message;
    box.classList.add("show");
}

function hideError(boxId) {
    document.getElementById(boxId).classList.remove("show");
}
