"""Ingestion service: load → normalize → upsert → detect price change."""
import asyncio
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from tenacity import retry, stop_after_attempt, wait_exponential

from app.collectors.base import NormalizedProduct
from app.collectors.fashionphile import FashionphileCollector
from app.collectors.firstdibs import FirstDibsCollector
from app.collectors.grailed import GrailedCollector
from app.models import PriceChangeEvent, PriceHistory, Product
from app.services import notification

DATA_DIR = Path(__file__).resolve().parents[3] / "data"


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=10))
async def _upsert_product(db: AsyncSession, np: NormalizedProduct) -> None:
    """Upsert a single NormalizedProduct, recording price history and events."""
    result = await db.execute(
        select(Product).where(
            Product.source == np.source,
            Product.external_id == np.external_id,
        )
    )
    existing: Product | None = result.scalar_one_or_none()
    now = datetime.now(timezone.utc)

    if existing is not None:
        if existing.current_price != np.price:
            # Price changed → record history and event
            history = PriceHistory(product_id=existing.id, price=np.price, recorded_at=now)
            db.add(history)

            event = PriceChangeEvent(
                product_id=existing.id,
                old_price=existing.current_price,
                new_price=np.price,
                source=np.source,
                detected_at=now,
                delivered=False,
            )
            db.add(event)
            await db.flush()

            event_dict = {
                "id": event.id,
                "product_id": existing.id,
                "old_price": existing.current_price,
                "new_price": np.price,
                "source": np.source,
                "detected_at": now.isoformat(),
            }
            await notification.broadcast(event_dict)

            existing.current_price = np.price

        existing.last_seen = now
        existing.is_sold = np.is_sold
    else:
        # New product
        product = Product(
            source=np.source,
            external_id=np.external_id,
            brand=np.brand,
            title=np.title,
            category=np.category,
            size=np.size,
            condition=np.condition,
            color=np.color,
            is_sold=np.is_sold,
            image_url=np.image_url,
            product_url=np.product_url,
            currency=np.currency,
            current_price=np.price,
            last_seen=now,
        )
        db.add(product)
        await db.flush()

        history = PriceHistory(product_id=product.id, price=np.price, recorded_at=now)
        db.add(history)

    await db.commit()


async def run_ingestion(db: AsyncSession) -> None:
    """
    Orchestrate a full ingestion cycle across all three collectors.

    Steps:
    1. Fetch all NormalizedProducts from each source concurrently.
    2. Upsert each product with price-change detection.
    """
    collectors = [GrailedCollector(), FashionphileCollector(), FirstDibsCollector()]

    results = await asyncio.gather(
        *[c.fetch_all(DATA_DIR) for c in collectors], return_exceptions=True
    )

    for collector, result in zip(collectors, results):
        if isinstance(result, Exception):
            print(f"[ingestion] Collector {collector.source} failed: {result}")
            continue
        for normalized_product in result:
            try:
                await _upsert_product(db, normalized_product)
            except Exception as exc:  # noqa: BLE001
                print(f"[ingestion] Failed to upsert {normalized_product}: {exc}")
