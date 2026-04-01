"""APScheduler periodic ingestion job (every 30 minutes)."""
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

scheduler = AsyncIOScheduler()


async def _scheduled_ingestion() -> None:
    """Wrapper that creates a DB session and runs ingestion."""
    from app.database import AsyncSessionLocal
    from app.services.ingestion import run_ingestion

    async with AsyncSessionLocal() as db:
        await run_ingestion(db)


def start_scheduler() -> None:
    """Register the ingestion job and start the scheduler."""
    scheduler.add_job(
        _scheduled_ingestion,
        trigger=IntervalTrigger(minutes=30),
        id="ingestion_job",
        replace_existing=True,
    )
    scheduler.start()


def stop_scheduler() -> None:
    """Gracefully shut down the scheduler."""
    scheduler.shutdown(wait=False)
