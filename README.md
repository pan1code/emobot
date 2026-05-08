# emobot

`emobot` — учебный проект для распознавания эмоций с камеры.

## Структура

```text
frontend/       интерфейс: HTML, CSS, немного JavaScript
backend/        FastAPI backend на Python
ml-service/     отдельный Python-сервис с моделью эмоций
database-data/  данные Postgres при Docker-запуске
docs/           схемы и материалы
```

## Как работает

```text
камера пользователя
        ↓
frontend
        ↓
backend
        ↓
ml-service
        ↓
backend сохраняет статистику
        ↓
frontend показывает результат
```

## Локальный запуск без Docker

Backend и ML-сервис запускаются в двух терминалах.

```bash
cd ml-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn predict:app --host 127.0.0.1 --port 9000
```

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

Postgres не публикуется на порт Mac, чтобы не конфликтовать с локальной базой. Backend подключается к нему внутри Docker по адресу `database:5432`.

## Где менять модель

Сейчас основной анализ делает браузерная Human.js модель, потому что она заметно лучше временной Python-заглушки. Backend всё равно остается на Python: он принимает результат, сохраняет статистику и отдает API.

`ml-service/model.py` содержит простую Python-модель по цветам кадра. Это запасной вариант и место для будущей настоящей нейросети. Когда будет готовая модель, замените функцию `EmotionModel.predict()`, а backend и frontend трогать почти не придется.

## Скорость обновления

В `frontend/public/scripts.js` стоят настройки:

```js
const HUMAN_INTERVAL_MS = 650;
const PYTHON_INTERVAL_MS = 1400;
```

Human.js обновляет эмоции примерно раз в `650 ms` плюс время обработки кадра. Python fallback обновляется медленнее — примерно раз в `1400 ms` плюс время HTTP-запроса.
