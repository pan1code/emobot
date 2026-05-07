const video = document.getElementById("camera");
const cameraStatus = document.getElementById("cameraStatus");
const themeButtons = [...document.querySelectorAll(".theme-button")];

const emotionMap = {
    sad: {
        label: document.querySelector('[data-emotion="sad"] span'),
        score: document.getElementById("sadScore"),
        bar: document.getElementById("sadBar"),
        names: ["sad", "sadness"]
    },
    happy: {
        label: document.querySelector('[data-emotion="happy"] span'),
        score: document.getElementById("happyScore"),
        bar: document.getElementById("happyBar"),
        names: ["happy", "joy"]
    },
    angry: {
        label: document.querySelector('[data-emotion="angry"] span'),
        score: document.getElementById("angryScore"),
        bar: document.getElementById("angryBar"),
        names: ["angry", "anger"]
    },
    calm: {
        label: document.querySelector('[data-emotion="calm"] span'),
        score: document.getElementById("calmScore"),
        bar: document.getElementById("calmBar"),
        names: ["neutral", "calm", "relaxed"]
    }
};

const emotionBars = [...document.querySelectorAll(".emotion-bar")];
let human;
let analyzing = false;

async function loadPythonConfig() {
    try {
        const response = await fetch("/api/config");
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
        await startEmotionModel();

    } catch (error) {

        console.log("Ошибка камеры:", error);
        cameraStatus.textContent = "камера недоступна";

    }

}

async function startEmotionModel() {
    if (!window.Human) {
        cameraStatus.textContent = "модель эмоций не загрузилась";
        updateEmotionPanel({ calm: 1 });
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

    cameraStatus.textContent = "загружаю модель эмоций";

    try {
        await human.load();
        await human.warmup();
        cameraStatus.textContent = "анализирую лицо";
        analyzeEmotion();
    } catch (error) {
        console.log("Ошибка модели эмоций:", error);
        cameraStatus.textContent = "модель недоступна, показываю спокойное";
        updateEmotionPanel({ calm: 1 });
    }
}

async function analyzeEmotion() {
    if (!human || analyzing) return;

    analyzing = true;

    try {
        const result = await human.detect(video);
        const face = result.face && result.face[0];

        if (!face) {
            cameraStatus.textContent = "лицо не найдено";
            updateEmotionPanel({ calm: 1 });
        } else {
            cameraStatus.textContent = "анализирую лицо";
            updateEmotionPanel(readEmotions(face.emotion));
        }
    } catch (error) {
        console.log("Ошибка анализа эмоций:", error);
        cameraStatus.textContent = "ошибка анализа";
    } finally {
        analyzing = false;
        setTimeout(analyzeEmotion, 550);
    }
}

function readEmotions(rawEmotions = []) {
    const scores = {
        sad: 0,
        happy: 0,
        angry: 0,
        calm: 0
    };

    rawEmotions.forEach((emotion) => {
        const label = String(emotion.emotion || emotion.name || "").toLowerCase();
        const score = Number(emotion.score || emotion.probability || 0);

        Object.entries(emotionMap).forEach(([key, config]) => {
            if (config.names.includes(label)) {
                scores[key] = Math.max(scores[key], score);
            }
        });
    });

    scores.calm = Math.max(scores.calm, 1 - scores.sad - scores.happy - scores.angry);
    return scores;
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
    const themes = ["apple", "web20", "emo"];
    const nextTheme = themes.includes(themeName) ? themeName : "apple";

    document.body.classList.toggle("theme-web20", nextTheme === "web20");
    document.body.classList.toggle("theme-emo", nextTheme === "emo");
    themeButtons.forEach((button) => {
        button.classList.toggle("is-active", button.dataset.theme === nextTheme);
    });
    localStorage.setItem("emoBotTheme", nextTheme);
}

themeButtons.forEach((button) => {
    button.addEventListener("click", () => {
        setTheme(button.dataset.theme);
    });
});

setTheme(localStorage.getItem("emoBotTheme"));
updateEmotionPanel({ calm: 1 });
loadPythonConfig();
startCamera();
