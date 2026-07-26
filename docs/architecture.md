# Архитектура emobot

```text
Камера пользователя
        ↓
frontend/public
HTML + CSS + немного JavaScript
        ↓
backend/app
FastAPI API + легкая Python-модель
        ↓
backend/app/database
сохранение статистики
        ↓
frontend/public
показ результата
```

## Кто за что отвечает

- `frontend` — интерфейс: камера, кнопки тем, график эмоций.
- `backend` — Python API: принимает кадры, запускает простую модель, пишет статистику.
- `backend/app/services/model.py` — место для модели эмоций. Сейчас там простая заменяемая модель, позже можно подключить настоящую.
- `database-data` — SQLite-база при запуске через Docker.
- `docker-compose.yml` — запуск frontend и backend одной командой.
