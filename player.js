/* ---------------- CONFIG ---------------- */

const API_URL = "https://growonlinked.in"
const LIMIT = 5
let categoryId = "";
const params = new URLSearchParams(window.location.search)
const AUTH_TOKEN = params.get("token")

/* ---------------- STATE ---------------- */

let reels = []
let currentIndex = 0
let cursorId = null
let loading = false

let players = {}
let positions = ["p2","p1","current","n1","n2"]

let isUnmuted = false

/* ---------------- API ---------------- */

async function fetchReels(){

    if (AUTH_TOKEN===null){
        showSessionExpiredDialog();
        return;
    }

    if(loading) return

    loading = true

    let url = API_URL+"/reels/feeds?categoryId="+categoryId+"&limit="+LIMIT;
    if(cursorId){
        url += "&cursorId=" + cursorId
    }

    try{
        const res = await fetch(url,{
            headers:{
                "Authorization":"Bearer "+AUTH_TOKEN
            }
        })

        if(res.status === 401){
            showSessionExpiredDialog()
            loading = false
            return
        }

        const json = await res.json()

        reels.push(...(json.data.reels || []))
        cursorId = json.data.cursorId

        console.log("Reels:", reels.length)

    }catch(e){
        console.error(e)
        showSessionExpiredDialog()
    }

    loading = false
}

/* ---------------- INIT ---------------- */

async function initFeed(){
    buildCategories();
    await fetchReels()

    if(reels.length === 0){
        console.error("No reels")
        return
    }

    if(window.YT && YT.Player){
        initPlayers()
    }
}

function onYouTubeIframeAPIReady(){
    initFeed()
}

/* ---------------- HELPERS ---------------- */

function getVideoId(i){
    if(i < 0 || i >= reels.length) return ""
    return reels[i]?.videoId || ""
}

/* ---------------- PLAYER INIT ---------------- */

function initPlayers(){

    players.p2 = create("p2", null)
    players.p1 = create("p1", null)

    players.current = create("current", getVideoId(0), true)

    players.n1 = create("n1", getVideoId(1))
    players.n2 = create("n2", getVideoId(2))

    updatePositions()
}

function create(id, videoId, autoplay=false){

    return new YT.Player(id,{
        videoId: videoId || "",
        playerVars:{
            autoplay: autoplay ? 1 : 0,
            mute:1,
            controls:0,
            modestbranding:1,
            rel:0,
            playsinline:1,
            enablejsapi:1,
            origin: window.location.origin,
            widget_referrer: window.location.origin,
            fs:0,
            disablekb:1
        },
        events:{
            onReady:(e)=>{
                if(autoplay && videoId){

                    let p = e.target

                    p.mute() // always start muted

                    setTimeout(()=>{
                        p.playVideo()

                        // 🔥 FIX: reapply unmute if user already enabled
                        if(isUnmuted){
                            try{
                                p.unMute()
                                p.setVolume(100)
                            }catch(err){}
                        }

                    },100)


                    updateReelInfo()
                    //e.target.playVideo()
                    document.getElementById("loader").style.display = "none";
                    document.getElementById("container").style.display = "block";
                }
            },
            onStateChange:(e)=>{
                if(id === positions[2] && e.data === YT.PlayerState.PLAYING){
                    hideThumb()
                    centerControl.style.display = "none"
                    startWatchTracking()
                }
                if(id === positions[2] && e.data === YT.PlayerState.ENDED){
                    nextVideo()
                    stopWatchTracking()
                }
                if(e.data === YT.PlayerState.PAUSED){
                    stopWatchTracking()
                }
            },
            onError:(e)=>{
                document.getElementById("thumb").style.display = "none";
                sendWatchedEvent(reels[currentIndex].id);
            }
        }
    })
}

/* ---------------- POSITION ---------------- */

function updatePositions(){
    document.getElementById(positions[0]).style.transform = "translateY(-200%)"
    document.getElementById(positions[1]).style.transform = "translateY(-100%)"
    document.getElementById(positions[2]).style.transform = "translateY(0)"
    document.getElementById(positions[3]).style.transform = "translateY(100%)"
    document.getElementById(positions[4]).style.transform = "translateY(200%)"
}

/* ---------------- PLAY CONTROL ---------------- */

function playCurrent(){

    let currentPlayer = players[positions[2]]

    Object.values(players).forEach(p=>{
        try{
            p.pauseVideo()
            p.mute()
        }catch(e){}
    })

    setTimeout(()=>{
        try{
            currentPlayer.seekTo(0,true)
            currentPlayer.playVideo()

            if(isUnmuted){
                currentPlayer.unMute()
                currentPlayer.setVolume(100)
            }
        }catch(e){}
    },50)
}

/* ---------------- NAVIGATION ---------------- */

function nextVideo(){

    centerControl.style.display = "none"

    if(currentIndex >= reels.length - 1) return

    currentIndex++

    showThumb()

    let first = positions.shift()
    positions.push(first)
    updateReelInfo()
    updatePositions()

    let newVideo = getVideoId(currentIndex + 2)
    if(newVideo){
        players[positions[4]].loadVideoById(newVideo)
    }

    playCurrent()

    if(!loading && reels.length - currentIndex <= 3){
        fetchReels()
    }
}

function prevVideo(){

    centerControl.style.display = "none"

    if(currentIndex <= 0) return

    currentIndex--

    showThumb()

    let last = positions.pop()
    positions.unshift(last)
    updateReelInfo()
    updatePositions()

    let newVideo = getVideoId(currentIndex - 2)
    if(newVideo){
        players[positions[0]].loadVideoById(newVideo)
    }

    playCurrent()
}

/* ---------------- THUMB ---------------- */

function showThumb(){
    let id = reels[currentIndex]?.videoId
    if(!id) return

    let t = document.getElementById("thumb")
    t.src = `https://img.youtube.com/vi/${id}/maxresdefault.jpg`
    t.style.opacity = "1"
}

function hideThumb(){
    document.getElementById("thumb").style.opacity = "0"
}

/* ---------------- TAP ---------------- */

function handleTap(){

    let currentPlayer = players[positions[2]]

    if(!isUnmuted){
        isUnmuted = true
        document.getElementById("tap").style.display="none"

        currentPlayer.unMute()
        currentPlayer.setVolume(100)
        currentPlayer.playVideo()
        return
    }

    let state = currentPlayer.getPlayerState()

    if(state === YT.PlayerState.PLAYING){
        currentPlayer.pauseVideo()
        showPlayIcon()
    }else{
        currentPlayer.playVideo()
        showPauseIcon()

        setTimeout(()=>{
            centerControl.style.display="none"
        },800)
    }
}

/* ---------------- ICONS ---------------- */

function showPlayIcon(){
    centerControl.innerHTML = `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>`
    centerControl.style.display="flex"
}

function showPauseIcon(){
    centerControl.innerHTML = `<svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zm8 0h4v14h-4z"></path></svg>`
    centerControl.style.display="flex"
}

/* ---------------- SWIPE ---------------- */

let startY = 0
let lastGesture = 0

window.addEventListener("touchstart", e=>{
    startY = e.touches[0].clientY
})

window.addEventListener("touchend", e=>{

    let now = Date.now()
    if(now - lastGesture < 300) return
    lastGesture = now

    let endY = e.changedTouches[0].clientY
    let diff = startY - endY

    if(Math.abs(diff) > 80){
        if(diff > 0){
            nextVideo()
        }else{
            prevVideo()
        }
    }else{
        handleTap()
    }
})

/* desktop */
window.addEventListener("wheel", e=>{
    if(e.deltaY > 0){
        nextVideo()
    }else{
        prevVideo()
    }
})


function showSessionExpiredDialog(){
    document.getElementById("sessionDialog").style.display="flex"
    document.getElementById("loader").style.display = "none";
    document.getElementById("tap").style.display = "none";
}

function reLogin(){
    logout();
}
function logout(){
    window.location.href = "uniwebview://logout";
}

function updateReelInfo(){
    if(!reels[currentIndex])
        return

    const reel = reels[currentIndex]

    document.getElementById("channelName").innerText = reel.channel.name || "Unknown Channel"
    document.getElementById("reelTitle").innerText = reel.title || ""
}


async function reloadFeed(){

    /* ---------- RESET STATE ---------- */

    reels = []
    cursorId = null
    currentIndex = 0
    loading = false

    centerControl.style.display = "none"
    document.getElementById("thumb").style.opacity = "0"


    await fetchReels()

    if(reels.length === 0){
        console.error("No reels for category")
        return
    }

    Object.values(players).forEach(p=>{
        try{
            p.destroy()
        }catch(e){}
    })

    players = {}
    positions = ["p2","p1","current","n1","n2"]
    initPlayers()
    updateReelInfo?.() // safe call if exists
}

/* -------- WATCH TRACKING -------- */

let watchTimer = null
let viewSentForCurrentReel = false
const WATCH_THRESHOLD_PERCENT = 50
const WATCH_THRESHOLD_SECONDS = 5


function startWatchTracking(){

    stopWatchTracking()

    viewSentForCurrentReel = false

    watchTimer = setInterval(()=>{

        try{

            if(!players.current  || !reels[currentIndex]) return

            const currentTime = players.current.getCurrentTime()
            const duration = players.current.getDuration()

            if(!duration || duration === 0) return

            const percent = (currentTime / duration) * 100

            if(
                !viewSentForCurrentReel &&
                (
                    currentTime >= WATCH_THRESHOLD_SECONDS ||
                    percent >= WATCH_THRESHOLD_PERCENT
                )
            ){
                viewSentForCurrentReel = true

                sendWatchedEvent(reels[currentIndex].id)
            }

        }catch(e){
            console.log("watch tracking error",e)
        }

    },1000)

}

function stopWatchTracking(){
    if(watchTimer){
        clearInterval(watchTimer)
        watchTimer = null
    }
}

function sendWatchedEvent(reelId){

    if(!reelId) return

    fetch(API_URL+"/reels/watched",{
        method:"POST",
        headers:{
            "Content-Type":"application/json",
            "Authorization":"Bearer "+AUTH_TOKEN
        },
        body: JSON.stringify({
            data:{
                reelId: reelId
            }
        })
    })
        .then(res=>{
            if(!res.ok){
                console.log("watch API failed")
            }
        })
        .catch(err=>{
            console.log("watch API error",err)
        })

}