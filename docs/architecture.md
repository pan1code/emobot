# Архитектура emobot

```text
Камера пользователя
        ↓
frontend/public
HTML + CSS + немного JavaScript
        ↓
backend/app
FastAPI API на Python
        ↓
ml-service
отдельный Python-сервис распознавания эмоций
        ↓
backend/app/database
сохранение статистики
        ↓
frontend/public
показ результата
```

## Кто за что отвечает

- `frontend` — интерфейс: камера, кнопки тем, график эмоций.
- `backend` — основной Python API: принимает кадры, вызывает модель, пишет статистику.
- `ml-service` — место для нейросети: сейчас там простая заменяемая модель, позже можно подключить настоящую.
- `database-data` — данные Postgres при запуске через Docker.
- `docker-compose.yml` — запуск всего проекта одной командой.
