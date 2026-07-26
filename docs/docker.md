# Docker для emobot

## Проверка

```bash
docker --version
docker compose version
```

Если команды не находятся, Docker Desktop не установлен или не запущен.

## Установка на macOS

В обычном терминале macOS выполните:

```bash
brew install --cask docker
```

Если система попросит пароль, введите пароль от Mac. После установки откройте Docker Desktop:

```bash
open -a Docker
```

Дождитесь, пока Docker Desktop покажет, что он запущен.

## Запуск проекта

Из папки проекта:

```bash
cd /Users/Arina/uni/uni/emobot
docker compose up --build
```

После запуска:

```text
frontend: http://127.0.0.1:3000
backend:  http://127.0.0.1:8000
```

Статистика сохраняется в SQLite:

```text
database-data/emobot.db
```

## Остановка

```bash
docker compose down
```

Если нужно удалить локальную статистику:

```bash
docker compose down
rm -rf database-data
```
