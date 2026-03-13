
let player
let currentIndex = 0
let reels=[];
let isPlaying = false

let isUnmuted = false
let startY = 0
let lastGestureTime = 0
const GESTURE_LOCK = 250
let autoPlayPending = false

let overlay = document.getElementById("playerContainer")
let centerControl = document.getElementById("centerControl")

/* ---------------- API CONFIG ---------------- */

const API_URL = "https://growonlinked.in/reels/feeds"
let categoryId = "";
const LIMIT = 5

let cursorId = null
let loading = false

const AUTH_TOKEN ="Bearer "+"eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiI5ODI2MTI5NDYxIiwiaWF0IjoxNzczMzE3MTQzLCJleHAiOjE3NzM0MzcxNDN9.2VsBbzj9I8McZrSM9h4aA4AwrW1eOcR9EwfK-puYzo4Jxdi6PFZEp6UTAw3T9jldy_0Qx6G5LITkPuxMdrbCHQ"

/* ---------------- API CALL ---------------- */

async function fetchReels(){
    if(loading)
        return

    loading = true
    let url = `${API_URL}?categoryId=${categoryId}&limit=${LIMIT}`

    if(cursorId){
        url += `&cursorId=${cursorId}`
    }

    try{
        const res = await fetch(url,{
            headers:{
                "Authorization":AUTH_TOKEN
            }
        })

        const json = await res.json()
        const newReels = json.data.reels
        reels.push(...newReels);
        cursorId = json.data.cursorId
        console.log("Loaded reels:", reels.length)

    }catch(e){
        console.error("API error", e)
    }
    loading = false
}

/* ---------------- INITIAL LOAD ---------------- */

async function initFeed(){
    buildCategories();
    await fetchReels()
    //onYouTubeIframeAPIReady()
    if(reels.length === 0){
        console.error("No videos returned from API")
        return
    }
    if(window.YT && YT.Player){
        createPlayer()
    }
}

/* -------------- CREATE PLAYER --------------------*/

function createPlayer(){
    player = new YT.Player('player',{
        videoId: reels[currentIndex].videoId,
        playerVars: {
            autoplay:1,
            mute:1,
            controls:0,
            modestbranding:1,
            rel:0,
            playsinline:1,
            showinfo:0,
            iv_load_policy:3,
            fs:0,
            disablekb:1
        },
        events:{
            onReady:function(e){
                player = e.target
                updateReelInfo()
                setTimeout(()=>{
                    try{
                        player.mute()        // start muted (required for autoplay on mobile/webview)
                        player.playVideo()   // start first video
                    }catch(err){
                        console.log("Autoplay blocked")
                    }
                },300)
            },
            onStateChange:function(e){
                if(e.data === YT.PlayerState.PLAYING ){
                    centerControl.style.display = "none"
                }
                if(e.data === YT.PlayerState.ENDED){
                    nextVideo()
                }
                if(e.data === YT.PlayerState.CUED){
                    player.playVideo()
                    centerControl.style.display = "none"
                }

                /*if(e.data === YT.PlayerState.CUED && autoPlayPending){

                    autoPlayPending = false

                    try{

                        player.playVideo()

                        if(isUnmuted){
                            player.unMute()
                            player.setVolume(100)
                        }else{
                            player.mute()
                        }

                    }catch(err){}

                }*/
            }
        }
    })
}

/* ---------------- YOUTUBE PLAYER ---------------- */

function onYouTubeIframeAPIReady(){
    if(reels.length > 0){
        createPlayer()
    }
}

/* ---------------- VIDEO NAVIGATION ---------------- */

function nextVideo(){

    if(currentIndex < reels.length - 1){

        currentIndex++

        centerControl.style.display = "none"

        try{
            player.stopVideo()   // reset internal player state
        }catch(e){}

        try{
            updateReelInfo()
            player.mute()
            player.cueVideoById({
                videoId: reels[currentIndex].videoId,
                startSeconds: 0,
                suggestedQuality: "large"
            })

            //player.cueVideoById(reels[currentIndex].videoId)
        }catch(e){}

        setTimeout(()=>{
            try{
                player.playVideo()
            }catch(e){}
        },250)

        if(isUnmuted){
            player.unMute()
            player.setVolume(100)
        }else{
            player.mute()
        }

        if(!loading && reels.length - currentIndex <= 3){
            fetchReels()
        }
    }
}

function prevVideo(){

    if(currentIndex > 0){

        currentIndex--

        centerControl.style.display = "none"

        try{
            player.stopVideo()
        }catch(e){}

        try{
            updateReelInfo()
            player.mute()
            player.cueVideoById({
                videoId: reels[currentIndex].videoId,
                startSeconds: 0,
                suggestedQuality: "large"
            })

            //player.cueVideoById(reels[currentIndex].videoId)
        }catch(e){}

        setTimeout(()=>{
            try{
                player.playVideo()
            }catch(e){}
        },250)

        if(isUnmuted){
            player.unMute()
            player.setVolume(100)
        }else{
            player.mute()
        }
    }
}

/* ---------------- ICON UI ---------------- */

function showPlayIcon(){

    centerControl.innerHTML = `
                <svg viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"></path>
                </svg>`
    centerControl.style.display="flex"
}

function showPauseIcon(){

    centerControl.innerHTML = `
                <svg viewBox="0 0 24 24">
                <path d="M6 5h4v14H6zm8 0h4v14h-4z"></path>
                </svg>`
    centerControl.style.display="flex"
}

/* ---------------- TAP LOGIC ---------------- */
function handleTap(){

    if(!isUnmuted){
        player.unMute()
        player.setVolume(100)

        isUnmuted = true
        document.getElementById("tapSound").style.display="none"

        if(player.getPlayerState() === YT.PlayerState.PAUSED){
            player.playVideo()
        }

        return
    }

    let state = player.getPlayerState()

    if(state === YT.PlayerState.PLAYING){
        player.pauseVideo()
        showPlayIcon()
    }else{


        try{
            let state = player.getPlayerState()
            player.playVideo()

            // WebView wake-up fix
            setTimeout(()=>{
                try{
                    if(player.getPlayerState() !== YT.PlayerState.PLAYING){
                        player.seekTo(player.getCurrentTime() + 0.01, true)
                        player.playVideo()
                        state = player.getPlayerState()
                    }
                }catch(e){}
            },200)

            showPauseIcon()

        }catch(e){}
        setTimeout(()=>{
            centerControl.style.display="none"
        },800)
    }
}

/* ---------------- TOUCH EVENTS ---------------- */

const isTouchDevice = 'ontouchstart' in window;

if(isTouchDevice){

    overlay.addEventListener("touchstart", function(e){
        startY = e.touches[0].clientY
    })

    overlay.addEventListener("touchend", function(e){
        let endY = e.changedTouches[0].clientY
        handleGesture(startY,endY)
    })

}else{

    overlay.addEventListener("click", function(){
        handleTap()
    })

    overlay.addEventListener("wheel", function(e){
        if(e.deltaY > 0){
            nextVideo()
        }else{
            prevVideo()
        }
    })

}



/*overlay.addEventListener("touchstart",function(e){
    startY = e.touches[0].clientY
})

overlay.addEventListener("touchend",function(e){
    let now = Date.now()
    if(now - lastGestureTime < GESTURE_LOCK) return
    lastGestureTime = now

    let endY = e.changedTouches[0].clientY
    handleGesture(startY,endY)
})*/

/* ---------------- CLICK DESKTOP ---------------- */

/*overlay.addEventListener("click",function(){
    let now = Date.now()
    if(now - lastGestureTime < GESTURE_LOCK) return
    lastGestureTime = now

    handleTap()

})

/!* ---------------- SCROLL DESKTOP ---------------- *!/

overlay.addEventListener("wheel",function(e){
    if(e.deltaY > 0){
        nextVideo()
    }else{
        prevVideo()
    }
})*/
/* ---------------- START APP ---------------- */
initFeed()

/*   document.body.addEventListener("click",function(){

       if(player){
           try{
               player.playVideo()
           }catch(e){}
       }

   },{once:true})*/

function handleGesture(start,end){

    let diff = start - end

    if(Math.abs(diff) > 90){

        if(diff > 0){
            nextVideo()
        }else{
            prevVideo()
        }

        return
    }

    handleTap()
}


function unlockPlayer(){
    try{
        player.mute();
        player.playVideo();
    }catch(e){
        console.log("unlock failed");
    }
}

async function reloadFeed(){
    // reset feed state
    reels=[];
    cursorId = null
    currentIndex = 0
    loading = false


    centerControl.style.display = "none"
    await fetchReels()

    if(reels.length === 0){
        console.error("No reels for category")
        return
    }

    updateReelInfo()
    // if player already exists -> load new first video
    if(player){
        try{
            player.stopVideo()
            player.loadVideoById(reels[0].videoId)
            player.playVideo()

            if(isUnmuted){
                player.unMute()
                player.setVolume(100)
            }else{
                player.mute()
            }

        }catch(e){
            console.log("Player reload error",e)
        }
    }else{
        createPlayer()
    }
}

function updateReelInfo(){
    if(!reels[currentIndex])
        return

    const reel = reels[currentIndex]

    document.getElementById("channelName").innerText = reel.channel.name || "Unknown Channel"
    document.getElementById("reelTitle").innerText = reel.title || ""
}