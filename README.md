# emobot

`emobot` — учебный веб-сервис для распознавания эмоций человека с камеры в режиме реального времени.

![Описание картинки](maxresdefault.jpg)

## Цель проекта

Проект демонстрирует простой цикл работы системы компьютерного зрения: получение изображения с камеры, определение эмоционального состояния, отображение результата пользователю и сохранение статистики.

## Возможности

- анализ видеопотока с камеры;
- определение одной из базовых эмоций: `sad`, `happy`, `angry`, `calm`;
- отображение результата в веб-интерфейсе;
- сохранение истории распознаваний;
- просмотр общей статистики через backend API.

## Архитектура

```text
камера пользователя
        ↓
frontend
        ↓
backend FastAPI
        ↓
SQLite
```

Frontend отвечает за интерфейс и работу с камерой. Backend принимает результаты анализа, сохраняет их в базу данных и предоставляет API для статистики. В backend также есть простая резервная эвристика анализа изображения по цветам кадра.

## Структура проекта

```text
frontend/          веб-интерфейс
backend/           FastAPI backend
database-data/     SQLite-база при Docker-запуске
docs/              дополнительная документация
docker-compose.yml запуск проекта через Docker
maxresdefault.jpg  изображение для README
```

## Запуск через Docker

```bash
docker compose up --build
```

После запуска:

```text
http://127.0.0.1:3000
```

## Локальный запуск backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Открыть приложение:

```text
http://127.0.0.1:8000
```

## API

```text
GET  /api/health
GET  /api/config
POST /api/emotion/analyze
POST /api/emotion/record
GET  /api/stats
```

## Технологии

- HTML, CSS, JavaScript;
- Human.js для анализа эмоций в браузере;
- Python, FastAPI;
- SQLite;
- Docker.
