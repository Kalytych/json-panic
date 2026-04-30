let bgMusic = null;
let currentTrack = null;
let soundEnabled = localStorage.getItem("soundEnabled") !== "false";
let lastClickSound = 0;

const clickSound = new Audio("sounds/click.mp3");
clickSound.volume = 0.65;
clickSound.preload = "auto";

function playMusic(src) {
  currentTrack = src;

  if (!soundEnabled) return;

  if (bgMusic && bgMusic.src.includes(src)) {
    bgMusic.play().catch(() => {});
    return;
  }

  if (bgMusic) {
    bgMusic.pause();
  }

  bgMusic = new Audio("sounds/" + src);
  bgMusic.loop = true;
  bgMusic.volume = 0.35;
  bgMusic.preload = "auto";

  bgMusic.play().catch(() => {
    console.log("Music will start after first interaction");
  });
}

function playSound(src) {
  if (!soundEnabled) return;

  const sound = new Audio("sounds/" + src);
  sound.volume = 0.65;
  sound.preload = "auto";
  sound.play().catch(() => {});
}

function playClickSound() {
  if (!soundEnabled) return;

  const now = Date.now();
  if (now - lastClickSound < 120) return;

  lastClickSound = now;

  clickSound.currentTime = 0;
  clickSound.play().catch(() => {});
}

function enableSoundAfterFirstClick() {
  document.addEventListener("pointerdown", () => {
    if (currentTrack) {
      playMusic(currentTrack);
    }
  }, { once: true });
}

function addClickSounds() {
  document.addEventListener("click", (event) => {
    const clickable = event.target.closest("button, a, .server-card, .level-node");

    if (clickable) {
      playClickSound();
    }
  }, true);
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  localStorage.setItem("soundEnabled", soundEnabled ? "true" : "false");

  if (!soundEnabled) {
    if (bgMusic) bgMusic.pause();
  } else {
    if (currentTrack) playMusic(currentTrack);
    playClickSound();
  }

  updateSoundButton();
}

function updateSoundButton() {
  const btn = document.getElementById("soundToggle");

  if (!btn) return;

  btn.innerText = soundEnabled ? "🔊 Звук" : "🔇 Звук";
}

enableSoundAfterFirstClick();
addClickSounds();

document.addEventListener("DOMContentLoaded", updateSoundButton);