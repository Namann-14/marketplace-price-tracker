"""Events router: GET /events — returns last 50 price-change events as JSON."""
from fastapi import APIRouter, Depends
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_api_key
from app.database import get_db
from app.models import ApiKey, PriceChangeEvent
from app.schemas import PriceChangeEventSchema

router = APIRouter()


@router.get("", response_model=dict)
async def get_events(
    db: AsyncSession = Depends(get_db),
    _api_key: ApiKey = Depends(get_api_key),
) -> dict:
    """Return the last 50 price-change events, mark them as delivered."""
    result = await db.execute(
        select(PriceChangeEvent)
        .order_by(PriceChangeEvent.detected_at.desc())
        .limit(50)
    )
    events = result.scalars().all()

    # Mark returned events as delivered
    event_ids = [e.id for e in events]
    if event_ids:
        await db.execute(
            update(PriceChangeEvent)
            .where(PriceChangeEvent.id.in_(event_ids))
            .values(delivered=True)
        )
        await db.commit()

    return {
        "events": [
            {
                "product_id": e.product_id,
                "old_price": e.old_price,
                "new_price": e.new_price,
                "source": e.source,
                "detected_at": e.detected_at.isoformat(),
            }
            for e in events
        ]
    }
