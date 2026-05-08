# emobot


![Описание картинки](maxresdefault.jpg)

Бот распознавания эмоций с видеопотока в режиме реального времени.

Browser camera page that shows a live emotion chart 

## Run

```bash
python3 server.py
```

Open:

```text
http://127.0.0.1:8000/general.html
```

The emotion model is loaded in the browser from the Human JavaScript package. The Python server serves the page and exposes `/api/config` for emotion labels and theme names.
