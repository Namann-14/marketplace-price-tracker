"""SSE events router: GET /events"""
import asyncio
import json

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse

from app.database import get_db
from app.models import PriceChangeEvent
from app.services import notification

router = APIRouter()


@router.get("")
async def stream_events(db: AsyncSession = Depends(get_db)):
    """
    SSE endpoint. On connect, replays last 20 undelivered events,
    then streams live price-change events from the notification queue.
    """

    async def event_generator():
        # Replay last 20 undelivered events
        result = await db.execute(
            select(PriceChangeEvent)
            .where(PriceChangeEvent.delivered == False)  # noqa: E712
            .order_by(PriceChangeEvent.detected_at.desc())
            .limit(20)
        )
        undelivered = result.scalars().all()
        for event in reversed(undelivered):
            payload = {
                "id": event.id,
                "product_id": event.product_id,
                "old_price": event.old_price,
                "new_price": event.new_price,
                "source": event.source,
                "detected_at": event.detected_at.isoformat(),
            }
            yield {"data": json.dumps(payload)}

        # Stream live events
        queue = notification.subscribe()
        try:
            while True:
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=30)
                    yield {"data": json.dumps(event)}
                except asyncio.TimeoutError:
                    yield {"data": "ping"}
        finally:
            notification.unsubscribe(queue)

    return EventSourceResponse(event_generator())
