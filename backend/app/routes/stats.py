from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.services.statistics_service import get_summary

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("")
def stats(db: Session = Depends(get_db)) -> dict:
    return get_summary(db)
