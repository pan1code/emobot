from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database.models import EmotionRecord


def get_summary(db: Session) -> dict:
    total = db.scalar(select(func.count(EmotionRecord.id))) or 0
    rows = db.execute(
        select(EmotionRecord.emotion, func.count(EmotionRecord.id))
        .group_by(EmotionRecord.emotion)
        .order_by(func.count(EmotionRecord.id).desc())
    ).all()

    average_scores = db.execute(
        select(
            func.avg(EmotionRecord.sad),
            func.avg(EmotionRecord.happy),
            func.avg(EmotionRecord.angry),
            func.avg(EmotionRecord.calm),
        )
    ).one()

    return {
        "total": total,
        "by_emotion": {emotion: count for emotion, count in rows},
        "average_scores": {
            "sad": float(average_scores[0] or 0),
            "happy": float(average_scores[1] or 0),
            "angry": float(average_scores[2] or 0),
            "calm": float(average_scores[3] or 0),
        },
    }
