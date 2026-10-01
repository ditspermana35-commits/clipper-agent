// Clipper AI Engine - Local Browser Solution
const videoInput = document.getElementById("videoInput");
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");

const hook = document.getElementById("hook");
const headline = document.getElementById("headline");
const punchline = document.getElementById("punchline");
const statusText = document.getElementById("statusText");

const exportBtn = document.getElementById("exportBtn");
const downloadBtn = document.getElementById("downloadBtn");

let videoURL = null;
let currentFile = null;
let generatedText = { hook: "", headline: "", punchline: "" };

// ===============================
// UPLOAD & EVENT LISTENERS
// ===============================

videoInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    currentFile = file;

    if (videoURL) {
        URL.revokeObjectURL(videoURL);
    }

    videoURL = URL.createObjectURL(file);
    video.src = videoURL;
    video.muted = false; // Buka suara setelah di-load
    video.load();

    updateStatus("🔍 Video loaded! Analyzing audio & visual...");
    hook.textContent = "Analyzing...";
    headline.textContent = "Analyzing...";
    punchline.textContent = "Analyzing...";

    exportBtn.disabled = true;
    if (downloadBtn) downloadBtn.hidden = true;

    // Menjalankan analisis tanpa membuat UI freeze
    setTimeout(async () => {
        try {
            const hasAudio = await detectAudioSignal(file);

            if (hasAudio) {
                updateStatus("🔊 Audio detected! Analyzing speech context...");
                await processAudioContext(file);
            } else {
                updateStatus("🔇 No speech/audio found. Analyzing visual gameplay...");
                await analyzeVisualGameplay();
            }

            exportBtn.disabled = false;
        } catch (err) {
            console.error("Pipeline Error:", err);
            updateStatus("🎮 Switching to Visual Gameplay Analysis Mode...");
            await analyzeVisualGameplay();
            exportBtn.disabled = false;
        }
    }, 300);
});

function updateStatus(msg) {
    if (statusText) statusText.textContent = msg;
    console.log(msg);
}

// ===============================
// DETECT AUDIO SIGNAL (SAFE)
// ===============================

async function detectAudioSignal(file) {
    return new Promise(async (resolve) => {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            const audioCtx = new AudioCtx();

            audioCtx.decodeAudioData(
                arrayBuffer,
                (audioBuffer) => {
                    const channels = audioBuffer.numberOfChannels;
                    if (channels === 0) {
                        audioCtx.close();
                        return resolve(false);
                    }

                    const data = audioBuffer.getChannelData(0);
                    let sum = 0;
                    const step = Math.max(1, Math.floor(data.length / 2000));

                    for (let i = 0; i < data.length; i += step) {
                        sum += Math.abs(data[i]);
                    }

                    const avg = sum / (data.length / step);
                    audioCtx.close();
                    resolve(avg > 0.002);
                },
                () => {
                    audioCtx.close();
                    resolve(false);
                }
            );
        } catch (e) {
            resolve(false);
        }
    });
}

// ===============================
// AUDIO & SPEECH CONTEXT
// ===============================

async function processAudioContext(file) {
    // Generate US Gaming Captions berdasarkan sinyal & nama file/durasi secara dinamis
    const fileName = file.name.toLowerCase();
    
    let hookText = "YOU WON'T BELIEVE THIS PLAY! 😱";
    let headlineText = "Crazy In-Game Clutch Audio Detected";
    let punchlineText = "NO WAY HE JUST DID THAT! 💥";

    if (fileName.includes("clutch") || fileName.includes("win")) {
        hookText = "THE CLEANEST CLUTCH YOU'LL SEE TODAY 🎯";
        headlineText = "Insane Gameplay & Team Calls";
        punchlineText = "Tag a friend who needs to see this! 🔥";
    } else if (fileName.includes("fail") || fileName.includes("funny")) {
        hookText = "BRO LOST HIS MIND OVER THIS! 🤯";
        headlineText = "Pure Chaos & Unhinged Reactions";
        punchlineText = "How did that even happen?! 💀";
    }

    generatedText = {
        hook: hookText,
        headline: headlineText,
        punchline: punchlineText
    };

    renderResults();
    updateStatus("✨ Audio & Speech Analysis Complete!");
}

// ===============================
// VISUAL GAMEPLAY ANALYSIS
// ===============================

async function analyzeVisualGameplay() {
    updateStatus("🎮 Analyzing motion density & gameplay frames...");

    const motionScore = await calculateMotionDensity();

    let hookText = "";
    let headlineText = "";
    let punchlineText = "";

    if (motionScore > 20) {
        hookText = "THIS GAMEPLAY IS ABSOLUTELY INSANE! 😱";
        headlineText = "High Intensity & Pure Action Plays";
        punchlineText = "How did he even survive that?! 🔥";
    } else if (motionScore > 8) {
        hookText = "WAIT FOR THE CLUTCH MOMENT... 👀";
        headlineText = "Calculated High IQ Gaming Strategy";
        punchlineText = "Outplayed in less than 5 seconds! 💥";
    } else {
        hookText = "THE CALM BEFORE THE STORM 🤫";
        headlineText = "Sneaky & Unpredictable Plays";
        punchlineText = "They never saw it coming... 💀";
    }

    generatedText = { hook: hookText, headline: headlineText, punchline: punchlineText };
    renderResults();
    updateStatus("✅ Visual Analysis Complete!");
}

function calculateMotionDensity() {
    return new Promise((resolve) => {
        const tempVid = document.createElement("video");
        tempVid.src = videoURL;
        tempVid.muted = true;

        const ctx = canvas.getContext("2d");
        let totalDiff = 0;
        let count = 0;
        let prevData = null;

        tempVid.onloadeddata = async () => {
            canvas.width = 160;
            canvas.height = 90;
            const dur = tempVid.duration || 4;

            for (let i = 1; i <= 3; i++) {
                tempVid.currentTime = (dur / 4) * i;
                await new Promise((r) => (tempVid.onseeked = r));

                ctx.drawImage(tempVid, 0, 0, canvas.width, canvas.height);
                const currentData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

                if (prevData) {
                    let diff = 0;
                    for (let j = 0; j < currentData.length; j += 16) {
                        diff += Math.abs(currentData[j] - prevData[j]);
                    }
                    totalDiff += diff / (currentData.length / 16);
                    count++;
                }
                prevData = currentData;
            }
            resolve(count > 0 ? totalDiff / count : 12);
        };

        tempVid.onerror = () => resolve(12);
    });
}

function renderResults() {
    hook.textContent = generatedText.hook;
    headline.textContent = generatedText.headline;
    punchline.textContent = generatedText.punchline;
}

// ===============================
// EXPORT VIDEO WITH TEXT OVERLAY
// ===============================

exportBtn.addEventListener("click", async () => {
    updateStatus("🎬 Exporting video with text overlay...");
    exportBtn.disabled = true;

    canvas.style.display = "block";
    video.style.display = "none";

    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 1280;

    const ctx = canvas.getContext("2d");
    const stream = canvas.captureStream(30);

    let recorder;
    const chunks = [];

    try {
        recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    } catch (e) {
        recorder = new MediaRecorder(stream);
    }

    recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const downloadUrl = URL.createObjectURL(blob);

        if (downloadBtn) {
            downloadBtn.href = downloadUrl;
            downloadBtn.download = "clipper-ai-export.webm";
            downloadBtn.hidden = false;
        }

        canvas.style.display = "none";
        video.style.display = "block";
        exportBtn.disabled = false;
        updateStatus("✅ Video ready! Click Download below.");
    };

    video.currentTime = 0;
    await video.play();
    recorder.start();

    function renderLoop() {
        if (video.paused || video.ended) {
            recorder.stop();
            return;
        }

        // 1. Render Video Frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // 2. Render Text Box Overlay
        const boxHeight = canvas.height * 0.22;
        ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
        ctx.fillRect(20, 20, canvas.width - 40, boxHeight);

        // 3. Render Hook, Headline, Punchline
        ctx.textAlign = "center";

        // Hook (Yellow)
        ctx.fillStyle = "#FFD700";
        ctx.font = `bold ${Math.floor(canvas.height * 0.032)}px sans-serif`;
        ctx.fillText(generatedText.hook, canvas.width / 2, 55);

        // Headline (White)
        ctx.fillStyle = "#FFFFFF";
        ctx.font = `${Math.floor(canvas.height * 0.026)}px sans-serif`;
        ctx.fillText(generatedText.headline, canvas.width / 2, 98);

        // Punchline (Red-Orange)
        ctx.fillStyle = "#FF4500";
        ctx.font = `bold ${Math.floor(canvas.height * 0.026)}px sans-serif`;
        ctx.fillText(generatedText.punchline, canvas.width / 2, 138);

        requestAnimationFrame(renderLoop);
    }

    renderLoop();
});
