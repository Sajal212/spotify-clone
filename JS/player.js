/* MUSIC PLAYER (index.html)

   1) reads every song card on the page and makes a list of songs
   2) plays them with one <audio> tag (audio files are in the SONGS folder)
   3) connects the player bar buttons at the bottom

   Real copyrighted mp3s can't be bundled with a college project, so the
   SONGS folder holds short generated demo tones - still real audio files. */

var audioPlayer = document.getElementById("audioPlayer");

// 9 demo audio files, the songs take turns using them
var SONG_FILES = [
    "../SONGS/song1.wav", "../SONGS/song2.wav", "../SONGS/song3.wav",
    "../SONGS/song4.wav", "../SONGS/song5.wav", "../SONGS/song6.wav",
    "../SONGS/song7.wav", "../SONGS/song8.wav", "../SONGS/song9.wav"
];

var DEFAULT_ART = "../IMAGES/nowplaying.jpg";

var songs = [];               // every song found on the page
var currentSongIndex = 0;     // which song is loaded in the player
var isShuffled = false;
var isRepeating = false;
var likesKey = "spotifyCloneLikes_" + localStorage.getItem("spotifyCloneCurrentUser");
var likedSongs = JSON.parse(localStorage.getItem(likesKey) || "[]");   // titles of liked songs


/* ---------- 1. BUILD THE SONG LIST FROM THE CARDS ---------- */

var cards = document.querySelectorAll(".cards .card, .quick-tile:not(.liked-tile)");

cards.forEach(function (card, index) {
    // every kind of card keeps its title in a different place
    var titleElement = card.querySelector("h4") || card.querySelector(".station-name") || card.querySelector("span");
    var subTextElement = card.querySelector("p");
    var imageElement = card.querySelector("img");

    songs.push({
        title: titleElement ? titleElement.textContent.trim() : "Unknown Track",
        artist: subTextElement ? subTextElement.textContent.trim() : "Spotify",
        art: imageElement ? imageElement.getAttribute("src") : DEFAULT_ART,
        file: SONG_FILES[index % SONG_FILES.length],
        card: card,                                              // the card on the page
        icon: card.querySelector(".play-btn i, .quick-play i")   // its little play/pause icon
    });

    // clicking the card (or the play button inside it) plays the song
    card.addEventListener("click", function () {
        playSong(index);
    });
});


/* ---------- 2. LOAD AND PLAY SONGS ---------- */

// put a song's info into the player bar + right sidebar and load its audio file
function loadSong(index) {
    var song = songs[index];
    currentSongIndex = index;

    document.getElementById("playerArt").src = song.art;
    document.getElementById("playerSongName").textContent = song.title;
    document.getElementById("playerArtist").textContent = song.artist;

    document.getElementById("npArt").src = song.art;
    document.getElementById("npTitle").textContent = song.title;
    document.getElementById("npArtist").textContent = song.artist;

    audioPlayer.src = song.file;
    updateLikeIcons();
}

function playSong(index) {
    // clicking the song that is already loaded just pauses / resumes it
    if (index === currentSongIndex) {
        togglePlay();
        return;
    }
    loadSong(index);
    audioPlayer.play();
}

function togglePlay() {
    if (audioPlayer.paused) {
        audioPlayer.play();
    } else {
        audioPlayer.pause();
    }
}

function nextSong() {
    if (isShuffled) {
        playSong(Math.floor(Math.random() * songs.length));
    } else {
        playSong((currentSongIndex + 1) % songs.length);
    }
}

function prevSong() {
    playSong((currentSongIndex - 1 + songs.length) % songs.length);
}


/* ---------- 3. KEEP THE SCREEN IN SYNC WITH THE AUDIO ---------- */

// runs whenever the audio starts or pauses
function updatePlayingState() {
    var isPlaying = !audioPlayer.paused;

    // big play/pause button in the player bar
    document.querySelector("#playPauseBtn i").className =
        isPlaying ? "fa-solid fa-pause" : "fa-solid fa-play";

    // song cards: the current card's button turns green and shows pause / play
    songs.forEach(function (song, index) {
        var isCurrent = (index === currentSongIndex);

        song.card.classList.toggle("playing", isCurrent);

        if (song.icon) {
            song.icon.className = (isCurrent && isPlaying) ? "fa-solid fa-pause" : "fa-solid fa-play";
        }
    });
}

audioPlayer.addEventListener("play", updatePlayingState);
audioPlayer.addEventListener("pause", updatePlayingState);

// when a song finishes: repeat it, or go to the next one
audioPlayer.addEventListener("ended", function () {
    if (isRepeating) {
        audioPlayer.currentTime = 0;
        audioPlayer.play();
    } else {
        nextSong();
    }
});


/* ---------- 4. PROGRESS BAR ---------- */

// "75" seconds -> "1:15"
function formatTime(totalSeconds) {
    var minutes = Math.floor(totalSeconds / 60);
    var seconds = Math.floor(totalSeconds % 60);
    return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
}

// move the bar while the song plays
audioPlayer.addEventListener("timeupdate", function () {
    var percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    document.getElementById("progressFill").style.width = percent + "%";
    document.getElementById("currentTimeText").textContent = formatTime(audioPlayer.currentTime);
});

// show the total length once the browser knows it
audioPlayer.addEventListener("loadedmetadata", function () {
    document.getElementById("totalTimeText").textContent = formatTime(audioPlayer.duration);
});

// where (0 to 1) did the person click on a bar?
function clickPosition(event, bar) {
    var box = bar.getBoundingClientRect();
    var position = (event.clientX - box.left) / box.width;
    return Math.max(0, Math.min(1, position));
}

document.getElementById("progressBar").addEventListener("click", function (event) {
    audioPlayer.currentTime = clickPosition(event, this) * audioPlayer.duration;
});


/* ---------- 5. VOLUME ---------- */

audioPlayer.volume = 0.5;   // start at half volume

document.getElementById("volumeBar").addEventListener("click", function (event) {
    var volume = clickPosition(event, this);

    audioPlayer.volume = volume;
    audioPlayer.muted = false;
    document.getElementById("volumeFill").style.width = (volume * 100) + "%";
    document.getElementById("volumeIcon").className = "fa-solid fa-volume-high icon-btn small";
});

document.getElementById("volumeIcon").addEventListener("click", function () {
    audioPlayer.muted = !audioPlayer.muted;
    this.className = (audioPlayer.muted ? "fa-solid fa-volume-xmark" : "fa-solid fa-volume-high") + " icon-btn small";
});


/* ---------- 6. SHUFFLE, REPEAT AND LIKE ---------- */

document.getElementById("shuffleBtn").addEventListener("click", function () {
    isShuffled = !isShuffled;
    this.classList.toggle("control-active", isShuffled);
});

document.getElementById("repeatBtn").addEventListener("click", function () {
    isRepeating = !isRepeating;
    this.classList.toggle("control-active", isRepeating);
});

// the check icons are green when the song is liked, grey when not
function updateLikeIcons() {
    var isLiked = likedSongs.includes(songs[currentSongIndex].title);

    document.getElementById("playerLike").classList.toggle("not-liked", !isLiked);
    document.getElementById("npLike").classList.toggle("not-liked", !isLiked);
}

function toggleLike() {
    var title = songs[currentSongIndex].title;

    if (likedSongs.includes(title)) {
        likedSongs.splice(likedSongs.indexOf(title), 1);   // remove it
    } else {
        likedSongs.push(title);                            // add it
    }
    localStorage.setItem(likesKey, JSON.stringify(likedSongs));   // save
    updateLikeIcons();

    if (window.onLikesChanged) {
        onLikesChanged();    // defined in buttons.js (updates the Liked Songs page)
    }
}

document.getElementById("playerLike").addEventListener("click", toggleLike);
document.getElementById("npLike").addEventListener("click", toggleLike);


/* ---------- 7. PLAYER BAR BUTTONS ---------- */

document.getElementById("playPauseBtn").addEventListener("click", togglePlay);
document.getElementById("nextBtn").addEventListener("click", nextSong);
document.getElementById("prevBtn").addEventListener("click", prevSong);


/* ---------- 8. START UP + LOG OUT ---------- */

// show the first song in the bar (loaded but not playing)
loadSong(0);

// top-right avatar icon
function logout() {
    localStorage.removeItem("spotifyCloneCurrentUser");
    window.location.href = "before.html";
}
