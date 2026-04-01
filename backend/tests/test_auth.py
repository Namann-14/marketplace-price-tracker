"""Tests for API key authentication."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_missing_api_key(client: AsyncClient):
    # Remove the key header for this request
    response = await client.get("/products", headers={"X-API-Key": "invalid-key-xyz"})
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_valid_api_key(client: AsyncClient):
    response = await client.get("/products")
    assert response.status_code == 200
