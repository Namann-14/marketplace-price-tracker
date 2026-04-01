"""Analytics router: GET /analytics"""
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_api_key
from app.database import get_db
from app.models import ApiKey, PriceChangeEvent, Product
from app.schemas import AnalyticsResponse, BrandStat, CategoryStat, SourceStat

router = APIRouter()


@router.get("", response_model=AnalyticsResponse)
async def get_analytics(
    db: AsyncSession = Depends(get_db),
    _api_key: ApiKey = Depends(get_api_key),
) -> AnalyticsResponse:
    """Return aggregated analytics across all products."""
    # TODO: implement full analytic queries
    by_source_result = await db.execute(
        select(Product.source, func.count(Product.id), func.avg(Product.current_price))
        .group_by(Product.source)
    )
    by_source = [
        SourceStat(source=row[0], count=row[1], avg_price=row[2])
        for row in by_source_result.all()
    ]

    by_category_result = await db.execute(
        select(Product.category, func.count(Product.id), func.avg(Product.current_price))
        .group_by(Product.category)
    )
    by_category = [
        CategoryStat(category=row[0], count=row[1], avg_price=row[2])
        for row in by_category_result.all()
    ]

    by_brand_result = await db.execute(
        select(Product.brand, func.count(Product.id))
        .group_by(Product.brand)
        .order_by(func.count(Product.id).desc())
        .limit(10)
    )
    by_brand = [BrandStat(brand=row[0], count=row[1]) for row in by_brand_result.all()]

    total_products = (await db.execute(select(func.count()).select_from(Product))).scalar_one()
    total_price_changes = (
        await db.execute(select(func.count()).select_from(PriceChangeEvent))
    ).scalar_one()

    return AnalyticsResponse(
        by_source=by_source,
        by_category=by_category,
        by_brand=by_brand,
        total_products=total_products,
        total_price_changes=total_price_changes,
    )
