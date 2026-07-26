# emobot

`emobot` — учебный проект для распознавания эмоций с камеры.

![Описание картинки](maxresdefault.jpg)

Бот распознавания эмоций с видеопотока в режиме реального времени.

## Структура

```text
frontend/          интерфейс: HTML, CSS, немного JavaScript
backend/           FastAPI backend на Python
database-data/     SQLite-база при Docker-запуске
docs/              схемы и материалы
docker-compose.yml запуск frontend и backend через Docker
maxresdefault.jpg  изображение для README
```

## Как работает

```text
камера пользователя
        ↓
frontend
        ↓
backend: API + легкая Python-модель + статистика
        ↓
frontend показывает результат
```

## Локальный запуск без Docker

Backend запускается одним Python-процессом.

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Открыть сайт:

```text
http://127.0.0.1:8000
```

## Запуск через Docker

Сначала проверьте, что Docker установлен:

```bash
docker --version
docker compose version
```

На macOS обычно нужно установить Docker Desktop, открыть его и дождаться статуса `Docker Desktop is running`.
Подробная инструкция лежит в `docs/docker.md`.

```bash
docker compose up --build
```

Сайт:

```text
http://127.0.0.1:3000
```

Backend API:

```text
http://127.0.0.1:8000/api/health
http://127.0.0.1:8000/api/stats
```

Статистика хранится в SQLite-файле `database-data/emobot.db`.

## Где менять модель

Сейчас основной анализ делает браузерная Human.js модель, потому что она заметно лучше простой Python-заглушки. Backend принимает результат, сохраняет статистику и отдает API.

`backend/app/services/model.py` содержит простую Python-модель по цветам кадра. Это запасной вариант и место для будущей настоящей нейросети. Когда будет готовая модель, замените функцию `EmotionModel.predict()`, а frontend трогать не придется.

## Скорость обновления

В `frontend/public/scripts.js` стоят настройки:

```js
const HUMAN_INTERVAL_MS = 650;
const PYTHON_INTERVAL_MS = 1400;
```

Human.js обновляет эмоции примерно раз в `650 ms` плюс время обработки кадра. Python fallback обновляется медленнее — примерно раз в `1400 ms` плюс время запроса к backend.
