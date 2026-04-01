"""Pytest configuration and shared fixtures."""
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database import Base, get_db
from app.main import app
from app.models import ApiKey

TEST_DB_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(TEST_DB_URL, echo=False)
TestSessionLocal = async_sessionmaker(bind=test_engine, class_=AsyncSession, expire_on_commit=False)


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_test_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def db_session():
    async with TestSessionLocal() as session:
        yield session


@pytest_asyncio.fixture
async def api_key(db_session: AsyncSession) -> str:
    """Insert a hashed demo key and return the raw key string."""
    import bcrypt, secrets
    raw = secrets.token_urlsafe(16)
    hashed = bcrypt.hashpw(raw.encode(), bcrypt.gensalt()).decode()
    db_session.add(ApiKey(key_hash=hashed, label="test"))
    await db_session.commit()
    return raw


@pytest_asyncio.fixture
async def client(db_session: AsyncSession, api_key: str):
    """Async test client with DB session override."""
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        c.headers["X-API-Key"] = api_key
        yield c
    app.dependency_overrides.clear()
