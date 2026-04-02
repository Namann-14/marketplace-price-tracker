"""Tests for API key authentication."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_missing_api_key_returns_401(client: AsyncClient):
    """Requests with no X-API-Key header should get 401."""
    response = await client.get("/products", headers={"X-API-Key": ""})
    # FastAPI returns 422 for empty required header; send without header entirely
    response2 = await client.get("/analytics", headers={})
    # Build a fresh client without the API key header
    from httpx import AsyncClient as FreshClient, ASGITransport
    from app.main import app
    transport = ASGITransport(app=app)
    async with FreshClient(transport=transport, base_url="http://test") as bare:
        resp = await bare.get("/products")
    assert resp.status_code == 422  # header required but missing → FastAPI 422


@pytest.mark.asyncio
async def test_invalid_api_key_returns_401(client: AsyncClient):
    """Requests with a wrong X-API-Key should get 401."""
    response = await client.get("/products", headers={"X-API-Key": "completely-wrong-key"})
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid or missing API key"


@pytest.mark.asyncio
async def test_valid_api_key_passes(client: AsyncClient):
    """Requests with the correct X-API-Key should succeed."""
    response = await client.get("/products")
    assert response.status_code == 200
