let currentSong = new Audio();
let songs = [];
let currFolder;

async function getSongs(folder) {
    try {
        currFolder = folder;     
        let response = await fetch(`http://127.0.0.1:3000/${folder}/`);
        let text = await response.text();
        let div = document.createElement("div");
        div.innerHTML = text;
        let as = div.getElementsByTagName("a");
        songs = [];
        for (let index = 0; index < as.length; index++) {
            const element = as[index];
            if (element.href.endsWith(".mp3")) {
                songs.push(decodeURIComponent(element.href.split(`/${folder}/`)[1]));
            }
        }

        let songUL = document.querySelector(".songList ol");
        songUL.innerHTML = "";
        for (const song of songs) {
            songUL.innerHTML += `<li>
                <img class="invert" src="/img/music.svg" alt="music">
                <div class="songInfo">
                    <div>${song}</div>
                    <div>Sumil</div>
                </div>
                <div class="playnow">
                    <span>Play Now</span>
                    <img class="invert" src="/img/play.svg" alt="play">
                </div>
            </li>`;
        }

        Array.from(document.querySelectorAll(".songList li")).forEach(e => {
            e.addEventListener("click", element => {
                let track = e.querySelector(".songInfo").firstElementChild.innerHTML;
                playMusic(track);
            });
        });
    } catch (error) {
        console.error("Error fetching songs:", error);
    }
}

function secondsToMinSec(totalSeconds) {
    if (isNaN(totalSeconds)) {
        return "00:00";
    } 
    let seconds = Math.floor(totalSeconds);
    let minutes = Math.floor(seconds / 60);
    let remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

const playMusic = (track, pause = false) => {
    currentSong.src = `/${currFolder}/` + track;
    if (!pause) {
        currentSong.play();
        document.querySelector("#play").src = "/img/pause.svg";
    }
    document.querySelector(".songinfo").innerHTML = track;
    document.querySelector(".songtime").innerHTML = "00:00/00:00";
}

async function displayAlbums() {
    try {
        let response = await fetch(`http://127.0.0.1:3000/songs/`);
        let text = await response.text();
        let div = document.createElement("div");
        div.innerHTML = text;
        let anchors = div.getElementsByTagName("a");

        let cardContainer = document.querySelector(".cardContainer");
        let array = Array.from(anchors);
        for (let index = 0; index < array.length; index++) {
            const e = array[index];
            if (e.href.includes("/songs")) {
                let folder = e.href.split("/").slice(-2)[0];
                try {
                    let jsonResponse = await fetch(`http://127.0.0.1:3000/songs/${folder}/info.json`);
                    if (!jsonResponse.ok) {
                        throw new Error(`JSON file not found for folder: ${folder}`);
                    }
                    let response = await jsonResponse.json();
                    cardContainer.innerHTML += `
                        <div data-folder="${folder}" class="card">
                            <div class="play"><i class="fa-solid fa-play" style="color: #000000;"></i></div>
                            <img src="/songs/${folder}/cover.jpg" alt="Playlist Cover">
                            <h2>${response.title}</h2>
                            <p>${response.description}</p>
                        </div>`;
                } catch (jsonError) {
                    console.error(`Error fetching JSON for folder ${folder}:`, jsonError);
                }
            }
        }

        Array.from(document.querySelectorAll(".card")).forEach(e => {
            e.addEventListener("click", async item => {
                await getSongs(`songs/${item.currentTarget.dataset.folder}`);
                playMusic(songs[0], true);
            });
        });
    } catch (error) {
        console.error("Error fetching albums:", error);
    }
}

async function main() {
    try {
        await getSongs("songs/Garba");
        playMusic(songs[0], true);
        displayAlbums();

        const play = document.querySelector("#play"); // Assuming play button has id="play"
        play.addEventListener("click", () => {
            if (currentSong.paused) {
                currentSong.play();
                play.src = "/img/pause.svg";
            } else {
                currentSong.pause();
                play.src = "/img/play.svg";
            }
        });

        currentSong.addEventListener("timeupdate", () => {
            document.querySelector(".songtime").innerHTML = `${secondsToMinSec(currentSong.currentTime)} / ${secondsToMinSec(currentSong.duration)}`;
            document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
        });

        document.querySelector(".seekbar").addEventListener("click", e => {
            let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
            document.querySelector(".circle").style.left = percent + "%";
            currentSong.currentTime = (currentSong.duration * percent) / 100;
        });

        document.querySelector(".hamburger").addEventListener("click", () => {
            document.querySelector(".left").style.left = 0;
        });

        document.querySelector(".close").addEventListener("click", () => {
            document.querySelector(".left").style.left = "-120%";
        });

        const previous = document.querySelector("#previous"); // Assuming previous button has id="previous"
        previous.addEventListener("click", () => {
            let index = songs.indexOf(decodeURIComponent(currentSong.src.split("/").pop()));
            if ((index - 1) >= 0) {
                playMusic(songs[index - 1]);
            }
        });

        const next = document.querySelector("#next"); // Assuming next button has id="next"
        next.addEventListener("click", () => {
            let index = songs.indexOf(decodeURIComponent(currentSong.src.split("/").pop()));
            if ((index + 1) < songs.length) {
                playMusic(songs[index + 1]);
            }
        });

        document.querySelector(".range input").addEventListener("change", e => {
            currentSong.volume = parseInt(e.target.value) / 100;
        });

        document.querySelector(".volume > img").addEventListener("click", e => {
            if (e.target.src.includes("volume.svg")) {
                e.target.src = e.target.src.replace("volume.svg", "mute.svg");
                currentSong.volume = 0;
                document.querySelector(".range input").value = 0;
            } else {
                e.target.src = e.target.src.replace("mute.svg", "volume.svg");
                currentSong.volume = 1;
                document.querySelector(".range input").value = 100;
            }
        });

    } catch (error) {
        console.error("Error initializing application:", error);
    }
}

main();
