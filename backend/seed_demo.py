"""Seed demo price-history data so charts have something to render.

Picks one product from each source and inserts 6 historical price_history
rows with dates spread over the last 30 days and prices that vary ±5–15%.
Run once after the DB is populated via POST /refresh or seed_keys.py.
"""
import asyncio
import sys
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import select
from app.database import AsyncSessionLocal, engine, Base
from app.models import PriceHistory, Product


async def seed():
    # Ensure tables exist (idempotent)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        sources = ["grailed", "fashionphile", "1stdibs"]
        chosen: list[Product] = []

        for source in sources:
            result = await db.execute(
                select(Product)
                .where(Product.source == source)
                .limit(1)
            )
            product = result.scalar_one_or_none()
            if product:
                chosen.append(product)
            else:
                print(f"[seed_demo] No products found for source '{source}'. Run POST /refresh first.")

        if not chosen:
            print("[seed_demo] No products in DB. Aborting.")
            return

        now = datetime.now(timezone.utc)
        inserted = 0

        for product in chosen:
            base_price = product.current_price or 500.0
            # Generate 6 data points spread evenly over the past 30 days
            for i in range(6):
                days_ago = 30 - (i * 5)  # 30, 25, 20, 15, 10, 5 days ago
                recorded_at = now - timedelta(days=days_ago)
                # Random variation ±5–15%
                variation_pct = random.uniform(-0.15, 0.15)
                price = round(base_price * (1 + variation_pct), 2)

                history = PriceHistory(
                    product_id=product.id,
                    price=price,
                    recorded_at=recorded_at,
                )
                db.add(history)
                inserted += 1

        await db.commit()
        print(f"[seed_demo] Inserted {inserted} demo price-history rows for {len(chosen)} products.")
        for p in chosen:
            print(f"  • [{p.source}] {p.title[:60]} (id={p.id})")


if __name__ == "__main__":
    asyncio.run(seed())
