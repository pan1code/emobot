from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database.db import init_db
from app.routes import emotion, health, stats


app = FastAPI(title="emobot backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(emotion.router)
app.include_router(stats.router)


@app.on_event("startup")
def on_startup() -> None:
    init_db()


frontend_dir = Path(__file__).resolve().parents[2] / "frontend" / "public"
if frontend_dir.exists():
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")
