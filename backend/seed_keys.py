"""Seed the database with a demo API key."""
import asyncio
import secrets
import bcrypt
from sqlalchemy.ext.asyncio import AsyncSession

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from app.database import AsyncSessionLocal, engine, Base
from app.models import ApiKey


async def seed():
    # Ensure tables exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    raw_key = "WiC5HbKag-DROSQ0Vxb_l01gFHqiYN6eOBdRTbmwKKc"
    key_hash = bcrypt.hashpw(raw_key.encode(), bcrypt.gensalt()).decode()

    async with AsyncSessionLocal() as db:
        db.add(ApiKey(key_hash=key_hash, label="demo"))
        await db.commit()

    print("=" * 50)
    print(f"Demo API Key:  {raw_key}")
    print("Store this key – it will NOT be shown again.")
    print("=" * 50)
    print("Example Usage:")
    print(f'curl -H "X-API-Key: {raw_key}" http://localhost:8000/products')
    print("=" * 50)

if __name__ == "__main__":
    asyncio.run(seed())
