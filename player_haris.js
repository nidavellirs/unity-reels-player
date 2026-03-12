/* ── CONFIG ── */
const API = "https://growonlinked.in/reels/feeds";
const TOKEN =
  "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiI5ODI2MTI5NDYxIiwiaWF0IjoxNzczMjQzNjg3LCJleHAiOjE3NzMzNjM2ODd9.eey7ApBMsBUcQYF9kFz64hsGEMxfnR4L_O0CM56UQdE9YXAZUrhFty1jk927mTp3osKkXdZ-NL8HtVqfcYDt2Q";

/* ── ICONS — exact match from screenshots ── */
const ICONS = {
  darshan: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 21V11L6 8V6H8V8L12 5L16 8V6H18V8L21 11V21" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M9 21V16H15V21" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 5V3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M3 21H21" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
        <rect x="9.5" y="11.5" width="2" height="2.5" rx="0.3" stroke="currentColor" stroke-width="1.4"/>
        <rect x="12.5" y="11.5" width="2" height="2.5" rx="0.3" stroke="currentColor" stroke-width="1.4"/>
    </svg>`,

  pravachan: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89317 18.7122 8.75608 18.1676 9.45768C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,

  bhajan: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 18V5L21 3V16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="6" cy="18" r="3" stroke="currentColor" stroke-width="1.8"/>
        <circle cx="18" cy="16" r="3" stroke="currentColor" stroke-width="1.8"/>
    </svg>`,

  stories: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 6C2 4.89543 2.89543 4 4 4H20C21.1046 4 22 4.89543 22 6V18C22 19.1046 21.1046 20 20 20H4C2.89543 20 2 19.1046 2 18V6Z" stroke="currentColor" stroke-width="1.8"/>
        <path d="M12 4V20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M2 12H22" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-dasharray="2 2"/>
    </svg>`,

  mixed: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 12C5 12 5 8 9 8C13 8 11 16 15 16C19 16 19 12 19 12C19 12 19 8 15 8C11 8 13 16 9 16C5 16 5 12 5 12Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
};

/* ── CATEGORIES ── */
const CATEGORIES = [
  { id: "darshan", label: "Darshan", categoryId: "69a4542b74128f436f701916" },
  { id: "pravachan", label: "Pravachan", categoryId: "PRAVACHAN_CATEGORY_ID" },
  { id: "bhajan", label: "Bhajan", categoryId: "BHAJAN_CATEGORY_ID" },
  { id: "stories", label: "Stories", categoryId: "STORIES_CATEGORY_ID" },
  { id: "mixed", label: "Mixed", categoryId: "MIXED_CATEGORY_ID" },
];

/* ── STATE ── */
let reels = [];
let cursorId = null;
let currentIndex = 0;
let player;
let activeCategory = CATEGORIES[0];
let isUnmuted = false;
let startY = 0;
let lastGestureTime = 0;
const GESTURE_LOCK = 250;

const uiOverlay = document.getElementById("uiOverlay");
const playIcon = document.getElementById("playIcon");

/* ── BUILD CATEGORIES ── */
function buildCategories() {
  const container = document.getElementById("categories");
  container.innerHTML = "";
  CATEGORIES.forEach((cat) => {
    const item = document.createElement("div");
    item.className =
      "category-item" + (cat.id === activeCategory.id ? " selected" : "");
    item.dataset.id = cat.id;
    item.innerHTML = `
            <div class="cat-icon-wrap">${ICONS[cat.id]}</div>
            <div class="cat-label">${cat.label}</div>
        `;
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      selectCategory(cat);
    });
    container.appendChild(item);
  });
}

/* ── SELECT CATEGORY ── */
function selectCategory(cat) {
  if (cat.id === activeCategory.id) return;
  activeCategory = cat;
  document.querySelectorAll(".category-item").forEach((el) => {
    el.classList.toggle("selected", el.dataset.id === cat.id);
  });
  alert("Category selected: " + cat.label);
  reels = [];
  cursorId = null;
  currentIndex = 0;
  loadReels().then(() => {
    if (reels.length > 0 && player) playReel(0);
  });
}

/* ── FETCH REELS ── */
async function loadReels() {
  let url = `${API}?categoryId=${activeCategory.categoryId}&limit=5`;
  if (cursorId) url += `&cursorId=${cursorId}`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: "Bearer " + TOKEN },
    });
    const json = await res.json();
    cursorId = json.data.cursorId;
    reels = reels.concat(json.data.reels);
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

/* ── PLAY REEL ── */
function playReel(index) {
  if (index < 0 || index >= reels.length) return;
  currentIndex = index;
  const reel = reels[index];
  try {
    player.loadVideoById(reel.videoId);
  } catch (e) {}
  if (isUnmuted) {
    try {
      player.unMute();
      player.setVolume(100);
    } catch (e) {}
  } else {
    try {
      player.mute();
    } catch (e) {}
  }
  document.getElementById("channelName").innerText = reel.channel.name;
  document.getElementById("reelTitle").innerText = reel.title;
  playIcon.style.opacity = 0;
  if (index >= reels.length - 2) loadReels();
}

/* ── CREATE PLAYER ── */
function createPlayer() {
  player = new YT.Player("player", {
    videoId: reels[0].videoId,
    playerVars: {
      autoplay: 1,
      mute: 1,
      controls: 0,
      modestbranding: 1,
      rel: 0,
      playsinline: 1,
      showinfo: 0,
      iv_load_policy: 3,
      fs: 0,
    },
    events: {
      onReady: function (e) {
        player = e.target;
        player.mute();
        player.playVideo();
        document.getElementById("channelName").innerText =
          reels[0].channel.name;
        document.getElementById("reelTitle").innerText = reels[0].title;
      },
      onStateChange: function (e) {
        if (e.data === YT.PlayerState.ENDED) playReel(currentIndex + 1);
      },
    },
  });
}

/* ── YOUTUBE READY ── */
function onYouTubeIframeAPIReady() {
  if (reels.length > 0) createPlayer();
}

/* ── GESTURE ── */
function handleGesture(startYVal, endYVal) {
  const diff = startYVal - endYVal;
  if (Math.abs(diff) > 80) {
    if (diff > 0) playReel(currentIndex + 1);
    else playReel(currentIndex - 1);
    return;
  }
  handleTap();
}

function handleTap() {
  if (!isUnmuted) {
    try {
      player.unMute();
      player.setVolume(100);
      isUnmuted = true;
      const tapBanner = document.getElementById("tapSound");
      if (tapBanner) tapBanner.style.opacity = 0;
    } catch (e) {}
    return;
  }
  try {
    const state = player.getPlayerState();
    if (state === YT.PlayerState.PLAYING) {
      player.pauseVideo();
      playIcon.style.opacity = 1;
    } else {
      player.playVideo();
      setTimeout(() => {
        playIcon.style.opacity = 0;
      }, 400);
    }
  } catch (e) {}
}

/* ── TOUCH ── */
uiOverlay.addEventListener("touchstart", (e) => {
  startY = e.touches[0].clientY;
});
uiOverlay.addEventListener("touchend", (e) => {
  const now = Date.now();
  if (now - lastGestureTime < GESTURE_LOCK) return;
  lastGestureTime = now;
  handleGesture(startY, e.changedTouches[0].clientY);
});

/* ── CLICK desktop ── */
uiOverlay.addEventListener("click", () => {
  const now = Date.now();
  if (now - lastGestureTime < GESTURE_LOCK) return;
  lastGestureTime = now;
  handleTap();
});

/* ── SCROLL desktop ── */
uiOverlay.addEventListener("wheel", (e) => {
  if (e.deltaY > 0) playReel(currentIndex + 1);
  else playReel(currentIndex - 1);
});

/* ── SHARE ── */
function shareReel() {
  const reel = reels[currentIndex];
  if (!reel) return;
  const url = `https://www.youtube.com/watch?v=${reel.videoId}`;
  if (navigator.share) {
    navigator
      .share({
        title: reel.title || "Durlabh Darshan",
        text: reel.channelName || "Durlabh Darshan",
        url: url,
      })
      .catch(() => {});
  } else {
    navigator.clipboard
      .writeText(url)
      .then(() => {
        alert("Link copied: " + url);
      })
      .catch(() => {
        alert("Share: " + url);
      });
  }
}

/* ── INIT ── */
async function init() {
  buildCategories();
  await loadReels();
  if (reels.length === 0) {
    console.error("No reels!");
    return;
  }
  if (window.YT && YT.Player) createPlayer();
}

init();
