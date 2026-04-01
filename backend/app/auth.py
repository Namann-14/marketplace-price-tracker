"""API key authentication middleware and usage logger."""
import bcrypt
from fastapi import Depends, Header, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import ApiKey, ApiUsage


async def get_api_key(
    request: Request,
    x_api_key: str = Header(..., alias="X-API-Key"),
    db: AsyncSession = Depends(get_db),
) -> ApiKey:
    """Validate X-API-Key header against bcrypt hashes stored in the DB."""
    result = await db.execute(select(ApiKey).where(ApiKey.is_active == True))  # noqa: E712
    active_keys = result.scalars().all()

    matched_key: ApiKey | None = None
    for key_record in active_keys:
        if bcrypt.checkpw(x_api_key.encode(), key_record.key_hash.encode()):
            matched_key = key_record
            break

    if matched_key is None:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")

    # Log usage
    usage = ApiUsage(
        api_key_id=matched_key.id,
        endpoint=str(request.url.path),
        method=request.method,
        status_code=200,  # will be updated post-response in a full implementation
    )
    db.add(usage)
    await db.commit()

    return matched_key
