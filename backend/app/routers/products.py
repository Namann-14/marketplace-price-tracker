"""Products router: GET /products, GET /products/{id}"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import get_api_key
from app.database import get_db
from app.models import ApiKey, Product
from app.schemas import ProductBase, ProductDetail, ProductListResponse

router = APIRouter()


@router.get("", response_model=ProductListResponse)
async def list_products(
    source: str | None = Query(None),
    category: str | None = Query(None),
    brand: str | None = Query(None),
    min_price: float | None = Query(None),
    max_price: float | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _api_key: ApiKey = Depends(get_api_key),
) -> ProductListResponse:
    """Return a paginated list of products with optional filters."""
    # TODO: implement filtering and pagination logic
    stmt = select(Product)
    count_stmt = select(func.count()).select_from(Product)

    if source:
        stmt = stmt.where(Product.source == source)
        count_stmt = count_stmt.where(Product.source == source)
    if category:
        stmt = stmt.where(Product.category == category)
        count_stmt = count_stmt.where(Product.category == category)
    if brand:
        stmt = stmt.where(Product.brand == brand)
        count_stmt = count_stmt.where(Product.brand == brand)
    if min_price is not None:
        stmt = stmt.where(Product.current_price >= min_price)
        count_stmt = count_stmt.where(Product.current_price >= min_price)
    if max_price is not None:
        stmt = stmt.where(Product.current_price <= max_price)
        count_stmt = count_stmt.where(Product.current_price <= max_price)

    total_result = await db.execute(count_stmt)
    total = total_result.scalar_one()

    stmt = stmt.offset((page - 1) * limit).limit(limit)
    result = await db.execute(stmt)
    products = result.scalars().all()

    return ProductListResponse(
        items=[ProductBase.model_validate(p) for p in products],
        total=total,
        page=page,
        limit=limit,
    )


@router.get("/{product_id}", response_model=ProductDetail)
async def get_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    _api_key: ApiKey = Depends(get_api_key),
) -> ProductDetail:
    """Return a single product with its last 100 price history entries."""
    # TODO: implement full logic with 404 handling
    stmt = (
        select(Product)
        .options(selectinload(Product.price_history))
        .where(Product.id == product_id)
    )
    result = await db.execute(stmt)
    product = result.scalar_one_or_none()

    if product is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Product not found")

    return ProductDetail.model_validate(product)
