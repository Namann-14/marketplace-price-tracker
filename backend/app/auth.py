"""API key authentication middleware and usage logger."""
import bcrypt
from fastapi import Depends, Header, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from cachetools import TTLCache

from app.database import get_db
from app.models import ApiKey

# Cache to store verified API key hashes temporarily to avoid slow bcrypt per request
# Key: x_api_key (raw), Value: ApiKey dictionary/object details
_verified_keys = TTLCache(maxsize=1000, ttl=300)

async def get_api_key(
    request: Request,
    x_api_key: str = Header(..., alias="X-API-Key"),
    db: AsyncSession = Depends(get_db),
) -> ApiKey:
    """Validate X-API-Key header against bcrypt hashes stored in the DB (optimised with cache)."""
    
    if x_api_key in _verified_keys:
        key_id = _verified_keys[x_api_key]
        # Store in request state for usage logging middleware
        request.state.api_key_id = key_id
        # We don't query the full DB model again to save time, unless needed. 
        # Returning a stub object or querying and throwing it if needed. 
        # But let's just query by ID which is very fast:
        result = await db.execute(select(ApiKey).where(ApiKey.id == key_id))
        return result.scalar_one()

    result = await db.execute(select(ApiKey).where(ApiKey.is_active == True))  # noqa: E712
    active_keys = result.scalars().all()

    matched_key: ApiKey | None = None
    for key_record in active_keys:
        if bcrypt.checkpw(x_api_key.encode(), key_record.key_hash.encode()):
            matched_key = key_record
            break

    if matched_key is None:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")

    # Save to Cache
    _verified_keys[x_api_key] = matched_key.id
    
    # Store ID in request.state so middleware can pick it up
    request.state.api_key_id = matched_key.id

    return matched_key
