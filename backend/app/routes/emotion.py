from pydantic import BaseModel
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.services.emotion_service import EMOTIONS, THEMES, analyze_emotion, save_emotion_scores

router = APIRouter(prefix="/api", tags=["emotion"])


class AnalyzeRequest(BaseModel):
    image: str


class RecordRequest(BaseModel):
    scores: dict[str, float]


@router.get("/config")
def config() -> dict:
    return {"emotions": EMOTIONS, "themes": THEMES}


@router.post("/emotion/analyze")
async def analyze(payload: AnalyzeRequest, db: Session = Depends(get_db)) -> dict:
    return await analyze_emotion(payload.image, db)


@router.post("/emotion/record")
def record(payload: RecordRequest, db: Session = Depends(get_db)) -> dict:
    return save_emotion_scores(payload.scores, db)
