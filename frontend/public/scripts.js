const API_BASE = window.EMOBOT_API_BASE || getApiBase();
const HUMAN_INTERVAL_MS = 650;
const PYTHON_INTERVAL_MS = 1400;
const VIDEO_WAIT_MS = 800;

const video = document.getElementById("camera");
const snapshot = document.getElementById("snapshot");
const cameraStatus = document.getElementById("cameraStatus");
const themeMenu = document.getElementById("themeMenu");
const themeMenuButton = document.getElementById("themeMenuButton");
const themeButtons = [...document.querySelectorAll(".theme-button")];

const emotionMap = {
    sad: {
        label: document.querySelector('[data-emotion="sad"] span'),
        score: document.getElementById("sadScore"),
        bar: document.getElementById("sadBar")
    },
    happy: {
        label: document.querySelector('[data-emotion="happy"] span'),
        score: document.getElementById("happyScore"),
        bar: document.getElementById("happyBar")
    },
    angry: {
        label: document.querySelector('[data-emotion="angry"] span'),
        score: document.getElementById("angryScore"),
        bar: document.getElementById("angryBar")
    },
    calm: {
        label: document.querySelector('[data-emotion="calm"] span'),
        score: document.getElementById("calmScore"),
        bar: document.getElementById("calmBar")
    }
};

const emotionBars = [...document.querySelectorAll(".emotion-bar")];
let analyzing = false;
let human;
let useHumanModel = false;

function getApiBase() {
    if (["3000", "5173"].includes(window.location.port)) {
        return `${window.location.protocol}//${window.location.hostname}:8000`;
    }

    return window.location.origin;
}

async function loadPythonConfig() {
    try {
        const response = await fetch(`${API_BASE}/api/config`);
        if (!response.ok) return;

        const config = await response.json();
        applyPythonConfig(config);
    } catch (error) {
        console.log("Python config unavailable:", error);
    }
}

function applyPythonConfig(config) {
    Object.entries(config.emotions || {}).forEach(([emotion, settings]) => {
        const target = emotionMap[emotion];
        if (!target) return;

        if (settings.title) {
            target.label.textContent = settings.title;
        }

        if (settings.color) {
            document.documentElement.style.setProperty(`--${emotion}`, settings.color);
        }
    });

    Object.entries(config.themes || {}).forEach(([theme, title]) => {
        const button = themeButtons.find((item) => item.dataset.theme === theme);
        if (button && title) {
            button.textContent = title;
        }
    });
}

async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
        });

        video.srcObject = stream;
        cameraStatus.textContent = "камера включена";
        await video.play();
        await startHumanModel();
        analyzeEmotion();
    } catch (error) {
        console.log("Ошибка камеры:", error);
        cameraStatus.textContent = "камера недоступна";
    }
}

async function startHumanModel() {
    if (!window.Human) {
        cameraStatus.textContent = "модель в браузере недоступна";
        return;
    }

    human = new window.Human.Human({
        modelBasePath: "https://cdn.jsdelivr.net/npm/@vladmandic/human/models",
        cacheModels: true,
        backend: "webgl",
        face: {
            enabled: true,
            detector: { enabled: true, rotation: true },
            mesh: { enabled: true },
            emotion: { enabled: true },
            description: { enabled: false },
            antispoof: { enabled: false },
            liveness: { enabled: false }
        },
        body: { enabled: false },
        hand: { enabled: false },
        object: { enabled: false },
        gesture: { enabled: false }
    });

    try {
        cameraStatus.textContent = "загружаю модель эмоций";
        await human.load();
        await human.warmup();
        useHumanModel = true;
        cameraStatus.textContent = "анализирую лицо";
    } catch (error) {
        console.log("Ошибка Human.js:", error);
        cameraStatus.textContent = "браузерная модель недоступна, использую Python";
    }
}

async function analyzeEmotion() {
    if (analyzing || !video.videoWidth) {
        setTimeout(analyzeEmotion, VIDEO_WAIT_MS);
        return;
    }

    analyzing = true;

    try {
        const result = useHumanModel
            ? await analyzeWithHuman()
            : await analyzeWithPython();

        updateEmotionPanel(result.scores);
        cameraStatus.textContent = result.faceFound === false
            ? "лицо не найдено"
            : `эмоция: ${result.emotion}`;
    } catch (error) {
        console.log("Ошибка анализа эмоций:", error);
        cameraStatus.textContent = "backend недоступен";
        updateEmotionPanel({ calm: 1 });
    } finally {
        analyzing = false;
        setTimeout(analyzeEmotion, useHumanModel ? HUMAN_INTERVAL_MS : PYTHON_INTERVAL_MS);
    }
}

async function analyzeWithHuman() {
    const detection = await human.detect(video);
    const face = detection.face && detection.face[0];

    if (!face) {
        const scores = { calm: 1 };
        await saveScores(scores);
        return { emotion: "calm", scores, faceFound: false };
    }

    const scores = readHumanEmotions(face.emotion);
    return await saveScores(scores);
}

async function analyzeWithPython() {
    const image = captureFrame();
    const response = await fetch(`${API_BASE}/api/emotion/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image })
    });

    if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`);
    }

    return await response.json();
}

async function saveScores(scores) {
    const response = await fetch(`${API_BASE}/api/emotion/record`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scores })
    });

    if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`);
    }

    return await response.json();
}

function readHumanEmotions(rawEmotions = []) {
    const scores = {
        sad: 0,
        happy: 0,
        angry: 0,
        calm: 0
    };

    const aliases = {
        sad: ["sad", "sadness"],
        happy: ["happy", "joy"],
        angry: ["angry", "anger"],
        calm: ["neutral", "calm", "relaxed"]
    };

    rawEmotions.forEach((emotion) => {
        const label = String(emotion.emotion || emotion.name || "").toLowerCase();
        const score = Number(emotion.score || emotion.probability || 0);

        Object.entries(aliases).forEach(([key, names]) => {
            if (names.includes(label)) {
                scores[key] = Math.max(scores[key], score);
            }
        });
    });

    scores.calm = Math.max(scores.calm, 1 - scores.sad - scores.happy - scores.angry);
    return scores;
}

function captureFrame() {
    const width = 320;
    const height = Math.round(width * (video.videoHeight / video.videoWidth || 0.75));
    snapshot.width = width;
    snapshot.height = height;

    const context = snapshot.getContext("2d");
    context.drawImage(video, 0, 0, width, height);
    return snapshot.toDataURL("image/jpeg", 0.72);
}

function updateEmotionPanel(scores) {
    const normalized = normalizeScores(scores);
    const activeEmotion = Object.entries(normalized)
        .sort((first, second) => second[1] - first[1])[0][0];

    Object.entries(emotionMap).forEach(([emotion, config]) => {
        const percent = Math.round(normalized[emotion] * 100);

        config.score.textContent = `${percent}%`;
        config.bar.style.height = `${Math.max(4, percent)}%`;
    });

    emotionBars.forEach((bar) => {
        bar.classList.toggle("is-active", bar.dataset.emotion === activeEmotion);
    });
}

function normalizeScores(scores) {
    const safeScores = {
        sad: Math.max(0, scores.sad || 0),
        happy: Math.max(0, scores.happy || 0),
        angry: Math.max(0, scores.angry || 0),
        calm: Math.max(0, scores.calm || 0)
    };
    const total = Object.values(safeScores).reduce((sum, score) => sum + score, 0) || 1;

    return Object.fromEntries(
        Object.entries(safeScores).map(([emotion, score]) => [emotion, score / total])
    );
}

function setTheme(themeName) {
    const themes = ["apple", "web20", "emo", "macos"];
    const nextTheme = themes.includes(themeName) ? themeName : "apple";

    document.body.classList.toggle("theme-web20", nextTheme === "web20");
    document.body.classList.toggle("theme-emo", nextTheme === "emo");
    document.body.classList.toggle("theme-macos", nextTheme === "macos");
    themeButtons.forEach((button) => {
        button.classList.toggle("is-active", button.dataset.theme === nextTheme);
    });
    localStorage.setItem("emoBotTheme", nextTheme);
}

function setThemeMenu(open) {
    themeMenu.hidden = !open;
    themeMenuButton.setAttribute("aria-expanded", String(open));
}

themeMenuButton.addEventListener("click", () => {
    setThemeMenu(themeMenu.hidden);
});

themeButtons.forEach((button) => {
    button.addEventListener("click", () => {
        setTheme(button.dataset.theme);
        setThemeMenu(false);
    });
});

document.addEventListener("click", (event) => {
    if (
        themeMenu.hidden ||
        themeMenu.contains(event.target) ||
        themeMenuButton.contains(event.target)
    ) {
        return;
    }

    setThemeMenu(false);
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        setThemeMenu(false);
    }
});

setTheme(localStorage.getItem("emoBotTheme"));
updateEmotionPanel({ calm: 1 });
loadPythonConfig();
startCamera();
