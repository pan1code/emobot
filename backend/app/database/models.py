from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.db import Base


class EmotionRecord(Base):
    __tablename__ = "emotion_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    emotion: Mapped[str] = mapped_column(String(32), index=True)
    sad: Mapped[float] = mapped_column(Float, default=0)
    happy: Mapped[float] = mapped_column(Float, default=0)
    angry: Mapped[float] = mapped_column(Float, default=0)
    calm: Mapped[float] = mapped_column(Float, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
