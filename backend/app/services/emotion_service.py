from typing import Any

import httpx
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database.models import EmotionRecord


EMOTIONS = {
    "sad": {"title": "sad", "color": "#5e7ce2"},
    "happy": {"title": "happy", "color": "#34c759"},
    "angry": {"title": "angry", "color": "#ff3b30"},
    "calm": {"title": "calm", "color": "#00a7c8"},
}

THEMES = {
    "apple": "Apple",
    "web20": "Web 2.0",
    "emo": "Emo",
}


async def analyze_emotion(image: str, db: Session) -> dict[str, Any]:
    settings = get_settings()
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.post(f"{settings.ml_service_url}/predict", json={"image": image})
        response.raise_for_status()
        prediction = response.json()

    return save_emotion_scores(prediction.get("scores", {}), db)


def save_emotion_scores(scores: dict[str, Any], db: Session) -> dict[str, Any]:
    scores = normalize_scores(scores)
    emotion = max(scores, key=scores.get)

    record = EmotionRecord(
        emotion=emotion,
        sad=scores["sad"],
        happy=scores["happy"],
        angry=scores["angry"],
        calm=scores["calm"],
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return {
        "id": record.id,
        "emotion": emotion,
        "scores": scores,
        "created_at": record.created_at.isoformat(),
    }


def normalize_scores(scores: dict[str, Any]) -> dict[str, float]:
    cleaned = {
        "sad": max(0.0, float(scores.get("sad", 0))),
        "happy": max(0.0, float(scores.get("happy", 0))),
        "angry": max(0.0, float(scores.get("angry", 0))),
        "calm": max(0.0, float(scores.get("calm", 0))),
    }
    total = sum(cleaned.values()) or 1.0
    return {key: value / total for key, value in cleaned.items()}
