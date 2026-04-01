"""Notification service: Webhook Delivery with Retry Queue."""
import asyncio
import httpx
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models import PriceChangeEvent, WebhookSubscription

_worker_task: asyncio.Task | None = None
_stop_event = asyncio.Event()


async def broadcast(event_dict: dict) -> None:
    """Deprecated: The webhook loop will pick up events automatically from DB."""
    pass


async def _delivery_loop():
    """Poll the database for undelivered events and POST them to all hooks."""
    while not _stop_event.is_set():
        try:
            async with AsyncSessionLocal() as db:
                # 1. Fetch un-delivered events
                result = await db.execute(
                    select(PriceChangeEvent)
                    .where(PriceChangeEvent.delivered == False)
                    .limit(50)
                )
                events = result.scalars().all()

                if not events:
                    # Sleep before polling again
                    try:
                        await asyncio.wait_for(_stop_event.wait(), timeout=5.0)
                    except asyncio.TimeoutError:
                        pass
                    continue

                # 2. Fetch all active webhooks
                webhook_res = await db.execute(
                    select(WebhookSubscription).where(WebhookSubscription.is_active == True)
                )
                webhooks = webhook_res.scalars().all()

                if not webhooks:
                    # Sleep and wait
                    try:
                        await asyncio.wait_for(_stop_event.wait(), timeout=5.0)
                    except asyncio.TimeoutError:
                        pass
                    continue

                # 3. Deliver
                async with httpx.AsyncClient(timeout=10.0) as client:
                    for event in events:
                        payload = {
                            "event_id": event.id,
                            "product_id": event.product_id,
                            "old_price": event.old_price,
                            "new_price": event.new_price,
                            "source": event.source,
                            "detected_at": event.detected_at.isoformat(),
                        }
                        
                        all_success = True
                        for wh in webhooks:
                            try:
                                resp = await client.post(wh.url, json=payload)
                                if resp.status_code >= 400:
                                    print(f"[Webhook] {wh.url} failed with {resp.status_code}")
                                    all_success = False
                            except Exception as e:
                                print(f"[Webhook] {wh.url} error: {e}")
                                all_success = False

                        # Basic strategy: if we processed it, mark it delivered. 
                        # In a multi-webhook system, usually we track per-webhook via `webhook_deliveries` table.
                        # For this assignment's single `delivered` boolean, we mark True immediately to avoid infinite loops,
                        # OR mark True only if all succeeded. Let's mark True only if all_success so it retries on failure.
                        if all_success:
                            event.delivered = True
                        
                await db.commit()

        except Exception as e:
            print(f"Webhook delivery loop error: {e}")
            await asyncio.sleep(5)
        
        await asyncio.sleep(1) # sleep briefly before next batch

def start_webhook_worker():
    global _worker_task
    _stop_event.clear()
    _worker_task = asyncio.create_task(_delivery_loop())

def stop_webhook_worker():
    _stop_event.set()
    if _worker_task:
        _worker_task.cancel()
