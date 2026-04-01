"""Refresh router: POST /refresh"""
from fastapi import APIRouter, BackgroundTasks, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_api_key
from app.database import get_db
from app.models import ApiKey
from app.schemas import RefreshResponse

router = APIRouter()


async def _run_ingestion_bg(db: AsyncSession) -> None:
    """Background task wrapper for ingestion."""
    from app.services.ingestion import run_ingestion
    await run_ingestion(db)


@router.post("", response_model=RefreshResponse)
async def trigger_refresh(
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    _api_key: ApiKey = Depends(get_api_key),
) -> RefreshResponse:
    """Trigger a data ingestion refresh as a background task."""
    background_tasks.add_task(_run_ingestion_bg, db)
    return RefreshResponse(status="refresh started")
