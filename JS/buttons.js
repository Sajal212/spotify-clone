/* BUTTONS (index.html)
   Makes every button on the page do something.
   Needs player.js loaded first (it gives us songs, playSong, likedSongs...). */

var mainArea = document.querySelector(".main");
var sidebar = document.querySelector(".sidebar");
var rightSidebar = document.querySelector(".right-sidebar");
var collectionView = document.getElementById("collectionView");
var searchInput = document.getElementById("searchInput");
var playlistBox = document.querySelector(".playlists");

var currentView = "home";        // "home", or the title of the page being shown
var currentFilter = "all";       // main pills: all / music / podcasts
var libraryType = "all";         // sidebar chips: all / playlist / artist / podcast
var sortAZ = false;              // Recents button: false = recents, true = A-Z


/* ---------- 1. SMALL POP-UP MESSAGE ---------- */

var toastTimer = null;

function showToast(message) {
    var toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
        toast.classList.remove("show");
    }, 2200);
}

// "1 song" / "2 songs"
function songsText(count) {
    return count + (count === 1 ? " song" : " songs");
}

// create an element with a class and some text (used to build pages)
function makeEl(tag, className, text) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
}


/* ---------- 2. HOME PAGE vs SONG-LIST PAGE ---------- */

// the parts that make up the home page
var homeParts = document.querySelectorAll(".filter-row, .quick-grid, .main > .section");

function showHome() {
    currentView = "home";
    collectionView.classList.add("is-hidden");
    homeParts.forEach(function (part) { part.classList.remove("is-hidden"); });
    applyHomeFilter();
    markActiveLibraryItem(null);
    mainArea.scrollTop = 0;
}

// show a page with a title and a list of songs (song numbers from the songs list)
function showCollection(title, subtitle, songNumbers, isLikedPage) {
    currentView = title;
    homeParts.forEach(function (part) { part.classList.add("is-hidden"); });
    document.getElementById("noResults").classList.remove("show");
    collectionView.classList.remove("is-hidden");
    collectionView.innerHTML = "";

    // --- top part: picture, title, play button ---
    var head = makeEl("div", "collection-head");
    var art;
    if (isLikedPage || songNumbers.length === 0) {
        art = makeEl("div", "collection-art liked-art");
        art.innerHTML = '<i class="fa-solid fa-heart"></i>';
    } else {
        art = makeEl("img", "collection-art");
        art.src = songs[songNumbers[0]].art;
    }
    var info = makeEl("div");
    info.appendChild(makeEl("small", "", "Playlist"));
    info.appendChild(makeEl("h1", "", title));
    info.appendChild(makeEl("p", "", subtitle + " \u2022 " + songsText(songNumbers.length)));
    head.appendChild(art);
    head.appendChild(info);
    collectionView.appendChild(head);

    var playAll = makeEl("button", "collection-play");
    playAll.innerHTML = '<i class="fa-solid fa-play"></i>';
    playAll.addEventListener("click", function () {
        if (songNumbers.length > 0) {
            playSong(songNumbers[0]);
        } else {
            showToast("Nothing to play yet. Like some songs first!");
        }
    });
    collectionView.appendChild(playAll);

    // --- list of songs ---
    if (songNumbers.length === 0) {
        collectionView.appendChild(makeEl("p", "empty-message",
            "Nothing here yet. Click the check icon next to a song in the player to add it to Liked Songs."));
    }

    songNumbers.forEach(function (songNumber, position) {
        collectionView.appendChild(makeSongRow(songNumber, position));
    });

    highlightRows();
    mainArea.scrollTop = 0;
}

// one row in the song list
function makeSongRow(songNumber, position) {
    var song = songs[songNumber];
    var row = makeEl("div", "song-row");
    row.setAttribute("data-song-number", songNumber);

    var num = makeEl("div", "row-num", position + 1);

    var main = makeEl("div", "row-main");
    var pic = makeEl("img");
    pic.src = song.art;
    var text = makeEl("div");
    text.appendChild(makeEl("div", "row-title", song.title));
    text.appendChild(makeEl("div", "row-artist", song.artist));
    main.appendChild(pic);
    main.appendChild(text);

    var heart = makeEl("button", "row-heart");
    heart.innerHTML = '<i class="fa-solid fa-heart"></i>';
    if (likedSongs.includes(song.title)) {
        heart.classList.add("liked");
    }

    row.appendChild(num);
    row.appendChild(main);
    row.appendChild(heart);

    // click the row = play it
    row.addEventListener("click", function () {
        playSong(songNumber);
    });

    // click the heart = like / unlike (without playing)
    heart.addEventListener("click", function (event) {
        event.stopPropagation();
        toggleLikeFor(song.title);
    });

    return row;
}

// like or unlike a song by its title
function toggleLikeFor(title) {
    if (likedSongs.includes(title)) {
        likedSongs.splice(likedSongs.indexOf(title), 1);
    } else {
        likedSongs.push(title);
    }
    localStorage.setItem(likesKey, JSON.stringify(likedSongs));
    updateLikeIcons();
    onLikesChanged();
}

// the green title + pause icon on the row of the song that is playing
function highlightRows() {
    var isPlaying = !audioPlayer.paused;

    collectionView.querySelectorAll(".song-row").forEach(function (row, position) {
        var isCurrent = Number(row.getAttribute("data-song-number")) === currentSongIndex;
        var numBox = row.querySelector(".row-num");

        row.classList.toggle("playing", isCurrent);

        if (isCurrent && isPlaying) {
            numBox.innerHTML = '<i class="fa-solid fa-pause"></i>';
        } else {
            numBox.textContent = position + 1;
        }
    });
}

audioPlayer.addEventListener("play", highlightRows);
audioPlayer.addEventListener("pause", highlightRows);


/* ---------- 3. LIKED SONGS ---------- */

// song numbers of every liked song (each title only once)
function likedSongNumbers() {
    var numbers = [];
    var usedTitles = [];

    songs.forEach(function (song, number) {
        if (likedSongs.includes(song.title) && !usedTitles.includes(song.title)) {
            numbers.push(number);
            usedTitles.push(song.title);
        }
    });
    return numbers;
}

function showLikedSongs() {
    showCollection("Liked Songs", localStorage.getItem("spotifyCloneCurrentUser"), likedSongNumbers(), true);
    markActiveLibraryItem(document.querySelector(".playlist-item.pinned"));
}

// runs every time a song is liked / unliked (player.js calls this too)
function onLikesChanged() {
    var count = likedSongNumbers().length;

    // update "Playlist • N songs" under Liked Songs in the library
    var likedSub = document.querySelector(".playlist-item.pinned .pl-sub");
    likedSub.innerHTML = '<i class="fa-solid fa-thumbtack pin-ic"></i>Playlist \u2022 ' + songsText(count);

    // refresh the Liked Songs page if it is open
    if (currentView === "Liked Songs") {
        showLikedSongs();
    }

    // keep hearts in other lists in sync
    collectionView.querySelectorAll(".song-row").forEach(function (row) {
        var title = songs[row.getAttribute("data-song-number")].title;
        row.querySelector(".row-heart").classList.toggle("liked", likedSongs.includes(title));
    });
}
window.onLikesChanged = onLikesChanged;
onLikesChanged();

// the "Liked Songs" tile on the home page
var likedTile = document.querySelector(".liked-tile");

likedTile.addEventListener("click", function (event) {
    showLikedSongs();

    // the little green play button also starts the first liked song
    if (event.target.closest(".quick-play")) {
        var numbers = likedSongNumbers();
        if (numbers.length > 0) {
            playSong(numbers[0]);
        } else {
            showToast("You have no liked songs yet. Like a song first!");
        }
    }
});


/* ---------- 4. PLAYLIST / ARTIST / PODCAST ITEMS IN THE LIBRARY ---------- */

var libraryItems = Array.from(document.querySelectorAll(".playlist-item"));
var originalOrder = libraryItems.slice();     // remember the "recents" order

function itemName(item) {
    return item.querySelector(".pl-name").textContent;
}

// what kind of item is it? playlist, artist, podcast or album
function itemType(item) {
    var sub = item.querySelector(".pl-sub").textContent.toLowerCase();
    if (itemName(item) === "Your Episodes" || sub.includes("podcast")) return "podcast";
    if (sub.includes("artist")) return "artist";
    if (sub.includes("album")) return "album";
    return "playlist";
}

// pick 8 songs for an item (the same item always gets the same songs)
function songsForName(name) {
    var start = 0;
    for (var i = 0; i < name.length; i++) {
        start += name.charCodeAt(i);
    }

    var numbers = [];
    for (var k = 0; k < 8 && k < songs.length; k++) {
        numbers.push((start + k) % songs.length);
    }
    return numbers;
}

function markActiveLibraryItem(activeItem) {
    libraryItems.forEach(function (item) {
        item.classList.toggle("active", item === activeItem);
    });
}

function openLibraryItem(item) {
    var name = itemName(item);
    var type = itemType(item);

    if (name === "Liked Songs") {
        showLikedSongs();
        return;
    }

    var numbers;
    if (item.getAttribute("data-new") === "yes") {
        numbers = [];                                  // a playlist you just created is empty
    } else if (type === "podcast") {
        numbers = podcastSongNumbers();
    } else {
        numbers = songsForName(name);
    }

    var subtitle = item.querySelector(".pl-sub").textContent.trim();
    showCollection(name, subtitle, numbers, false);
    markActiveLibraryItem(item);
}

function addLibraryClick(item) {
    item.addEventListener("click", function () {
        openLibraryItem(item);
    });
}
libraryItems.forEach(addLibraryClick);

// --- chips: Playlists / Artists / Podcasts (click again to turn off) ---
var chips = document.querySelectorAll(".chip");

chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
        var type = chip.textContent.trim().toLowerCase().replace(/s$/, "");   // "Playlists" -> "playlist"
        var wasActive = chip.classList.contains("active");

        chips.forEach(function (c) { c.classList.remove("active"); });

        if (wasActive) {
            libraryType = "all";
        } else {
            chip.classList.add("active");
            libraryType = type;
        }
        applyLibraryFilter();
    });
});

// --- search box inside the library ---
var librarySearch = document.getElementById("librarySearch");

document.querySelector(".tool-search-btn").addEventListener("click", function () {
    librarySearch.classList.toggle("show");
    if (librarySearch.classList.contains("show")) {
        librarySearch.focus();
    } else {
        librarySearch.value = "";
        applyLibraryFilter();
    }
});

librarySearch.addEventListener("input", applyLibraryFilter);

// hide the library items that don't match the chip + search
function applyLibraryFilter() {
    var text = librarySearch.value.trim().toLowerCase();

    libraryItems.forEach(function (item) {
        var matchesType = (libraryType === "all") || (itemType(item) === libraryType);
        var matchesText = itemName(item).toLowerCase().includes(text);
        item.classList.toggle("is-hidden", !(matchesType && matchesText));
    });
}

// --- Recents button: switch between recents order and A-Z ---
var recentsButton = document.querySelector(".recents-btn");

recentsButton.addEventListener("click", function () {
    sortAZ = !sortAZ;
    recentsButton.querySelector("span").textContent = sortAZ ? "Alphabetical" : "Recents";

    var ordered = originalOrder.slice();
    if (sortAZ) {
        ordered.sort(function (a, b) {
            var aPinned = a.classList.contains("pinned") ? 0 : 1;   // pinned items stay on top
            var bPinned = b.classList.contains("pinned") ? 0 : 1;
            if (aPinned !== bPinned) return aPinned - bPinned;
            return itemName(a).localeCompare(itemName(b));
        });
    }
    ordered.forEach(function (item) { playlistBox.appendChild(item); });
});

// --- "+" button: create a new playlist ---
document.querySelector(".lib-add-btn").addEventListener("click", function () {
    var name = prompt("Name your new playlist:", "My Playlist");
    if (!name || name.trim() === "") {
        return;
    }

    var item = makeEl("div", "playlist-item");
    item.setAttribute("data-new", "yes");

    var icon = makeEl("img", "pl-icon");
    icon.src = "../IMAGES/playlist1.jpg";
    var text = makeEl("div", "pl-text");
    text.appendChild(makeEl("p", "pl-name", name.trim()));
    text.appendChild(makeEl("p", "pl-sub", "Playlist \u2022 You"));
    item.appendChild(icon);
    item.appendChild(text);

    // put it right after the two pinned items
    var firstNormal = playlistBox.querySelector(".playlist-item:not(.pinned)");
    playlistBox.insertBefore(item, firstNormal);

    libraryItems.push(item);
    originalOrder.splice(2, 0, item);
    addLibraryClick(item);

    showToast('Created playlist "' + name.trim() + '"');
    openLibraryItem(item);
});

// --- collapse and expand the library ---
document.querySelector(".collapse-btn").addEventListener("click", function () {
    sidebar.classList.remove("expanded");
    sidebar.classList.toggle("collapsed");
});

document.querySelector(".expand-btn").addEventListener("click", function () {
    sidebar.classList.remove("collapsed");
    sidebar.classList.toggle("expanded");
});


/* ---------- 5. HOME PAGE FILTERS (All / Music / Podcasts) AND SEARCH ---------- */

// words that tell us a card is a podcast
var PODCAST_WORDS = ["podcast", "stories", "meditation", "radio", "mystery", "episode"];

function isPodcastText(text) {
    text = text.toLowerCase();
    return PODCAST_WORDS.some(function (word) { return text.includes(word); });
}

function podcastSongNumbers() {
    var numbers = [];
    songs.forEach(function (song, number) {
        if (isPodcastText(song.title)) numbers.push(number);
    });
    return numbers;
}

var pills = document.querySelectorAll(".filter-pill");

pills.forEach(function (pill) {
    pill.addEventListener("click", function () {
        pills.forEach(function (p) { p.classList.remove("active"); });
        pill.classList.add("active");
        currentFilter = pill.textContent.trim().toLowerCase();    // all / music / podcasts

        if (currentView !== "home") showHome();
        applyHomeFilter();
    });
});

searchInput.addEventListener("input", function () {
    if (currentView !== "home") showHome();
    applyHomeFilter();
});

// hide every card that doesn't match the pill + search text
function applyHomeFilter() {
    if (currentView !== "home") return;

    var text = searchInput.value.trim().toLowerCase();
    var anythingVisible = false;

    songs.forEach(function (song) {
        var podcast = isPodcastText(song.title);
        var matchesType = (currentFilter === "all") ||
                          (currentFilter === "podcasts" && podcast) ||
                          (currentFilter === "music" && !podcast);
        var matchesText = (song.title + " " + song.artist).toLowerCase().includes(text);

        var show = matchesType && matchesText;
        song.card.classList.toggle("is-hidden", !show);
        if (show) anythingVisible = true;
    });

    // the Liked Songs tile is a music item
    var likedVisible = (currentFilter !== "podcasts") && ("liked songs".includes(text));
    likedTile.classList.toggle("is-hidden", !likedVisible);
    if (likedVisible) anythingVisible = true;

    // hide a whole row/section if all its cards are hidden
    document.querySelectorAll(".quick-grid, .main > .section").forEach(function (area) {
        var visibleCards = area.querySelectorAll(".card:not(.is-hidden), .quick-tile:not(.is-hidden)");
        area.classList.toggle("is-hidden", visibleCards.length === 0);
    });

    document.getElementById("noResults").classList.toggle("show", !anythingVisible);
}

// "Show all" links open a page with all songs of that row
document.querySelectorAll(".section-title a").forEach(function (link) {
    link.addEventListener("click", function (event) {
        event.preventDefault();
        var section = link.closest(".section");
        var title = section.querySelector("h2").textContent;

        var numbers = [];
        songs.forEach(function (song, number) {
            if (section.contains(song.card)) numbers.push(number);
        });
        showCollection(title, "Show all", numbers, false);
    });
});


/* ---------- 6. TOP BAR BUTTONS ---------- */

function goHome() {
    searchInput.value = "";
    pills.forEach(function (p) { p.classList.toggle("active", p.textContent.trim() === "All"); });
    currentFilter = "all";
    showHome();
}

document.querySelector(".pill-icon-btn").addEventListener("click", function (event) {
    event.preventDefault();
    goHome();
});

document.querySelector(".brand").addEventListener("click", function (event) {
    event.preventDefault();
    goHome();
});

// the "browse" icon in the search box: clear the search and show everything
document.querySelector(".browse-ic").addEventListener("click", function () {
    goHome();
    showToast("Showing everything");
});

document.querySelector(".premium-btn").addEventListener("click", function () {
    showToast("Premium is not available in this demo");
});

document.querySelector(".install-link").addEventListener("click", function (event) {
    event.preventDefault();
    showToast("Install App is not available in this demo");
});

var topIcons = document.querySelectorAll(".topbar-right .icon-btn");
topIcons[0].addEventListener("click", function () { showToast("You have no new notifications"); });
topIcons[1].addEventListener("click", function () { showToast("Friend Activity: no friends online right now"); });


/* ---------- 7. RIGHT PANEL (now playing) ---------- */

document.querySelector(".context-more").addEventListener("click", function () {
    showToast("More options are coming soon");
});

// enlarge / shrink the right panel
document.querySelector(".context-expand").addEventListener("click", function () {
    rightSidebar.classList.toggle("expanded");
});

// share = copy "song - artist" to the clipboard
document.querySelector(".np-share").addEventListener("click", function () {
    var song = songs[currentSongIndex];
    var text = song.title + " - " + song.artist;

    if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
    }
    showToast("Copied: " + text);
});

document.querySelector(".artist-link").addEventListener("click", function (event) {
    event.preventDefault();
    showCollection("Aeria", "Artist", songsForName("Aeria"), false);
});


/* ---------- 8. PLAYER BAR ICONS ---------- */

document.getElementById("lyricsBtn").addEventListener("click", function () {
    showToast("Lyrics are not available in this demo");
});

// queue = the songs that come next
document.getElementById("queueBtn").addEventListener("click", function () {
    var numbers = [];
    for (var k = 1; k <= 10 && k < songs.length; k++) {
        numbers.push((currentSongIndex + k) % songs.length);
    }
    showCollection("Queue", "Up next", numbers, false);
});

document.getElementById("deviceBtn").addEventListener("click", function () {
    showToast("No other devices found");
});

// show / hide the right "now playing" panel
document.getElementById("nowPlayingViewBtn").addEventListener("click", function () {
    var hidden = rightSidebar.classList.toggle("is-hidden");
    showToast(hidden ? "Now playing view hidden" : "Now playing view shown");
});

// full screen on / off
document.getElementById("fullscreenBtn").addEventListener("click", function () {
    if (document.fullscreenElement) {
        document.exitFullscreen();
    } else {
        document.documentElement.requestFullscreen();
    }
});


/* ---------- 9. FOOTER LINKS ---------- */

document.querySelectorAll(".site-footer a").forEach(function (link) {
    link.addEventListener("click", function (event) {
        event.preventDefault();
        showToast(link.textContent.trim() + " is not part of this demo");
    });
});

// social icons open the real pages in a new tab
var socialLinks = {
    "Instagram": "https://www.instagram.com/spotify",
    "X": "https://x.com/spotify",
    "Facebook": "https://www.facebook.com/Spotify"
};

document.querySelectorAll(".social-ic").forEach(function (button) {
    button.addEventListener("click", function () {
        window.open(socialLinks[button.getAttribute("aria-label")], "_blank");
    });
});
