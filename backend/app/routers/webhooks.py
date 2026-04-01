"""Webhooks router: POST and GET /webhooks"""
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_api_key
from app.database import get_db
from app.models import ApiKey, WebhookSubscription
from app.schemas import WebhookSubscriptionCreate, WebhookSubscriptionSchema

router = APIRouter()


@router.post("", response_model=WebhookSubscriptionSchema)
async def create_webhook(
    hook: WebhookSubscriptionCreate,
    db: AsyncSession = Depends(get_db),
    _api_key: ApiKey = Depends(get_api_key),
) -> WebhookSubscriptionSchema:
    """Create a new webhook subscription."""
    new_hook = WebhookSubscription(url=hook.url, is_active=True)
    db.add(new_hook)
    await db.commit()
    await db.refresh(new_hook)
    return WebhookSubscriptionSchema.model_validate(new_hook)


@router.get("", response_model=list[WebhookSubscriptionSchema])
async def list_webhooks(
    db: AsyncSession = Depends(get_db),
    _api_key: ApiKey = Depends(get_api_key),
) -> list[WebhookSubscriptionSchema]:
    """List all webhook subscriptions."""
    result = await db.execute(select(WebhookSubscription))
    hooks = result.scalars().all()
    return [WebhookSubscriptionSchema.model_validate(h) for h in hooks]
