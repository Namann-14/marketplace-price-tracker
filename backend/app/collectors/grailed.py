"""Collector for Grailed marketplace data."""
from app.collectors.base import BaseCollector, NormalizedProduct


class GrailedCollector(BaseCollector):
    source = "grailed"

    def parse(self, raw: dict) -> NormalizedProduct:
        """
        Map a raw Grailed JSON record to a NormalizedProduct.

        Field mappings (verified against real data):
          external_id → last path segment of product_url  (e.g. "83672676")
          brand       → raw["brand"]
          title       → raw["model"]
          price       → raw["price"]
          currency    → "USD"
          category    → raw["metadata"]["style"]
          size        → raw["size"]  (may be null)
          condition   → None  (not present in Grailed data)
          color       → raw["metadata"]["color"]
          is_sold     → raw["metadata"]["is_sold"]
          image_url   → raw["image_url"] if present, else main_images[0]["url"]
          product_url → raw["product_url"]
        """
        product_url: str = raw["product_url"]
        external_id = product_url.rstrip("/").split("/")[-1]
        metadata: dict = raw.get("metadata", {})

        # Prefer top-level image_url; fall back to first main_image url
        image_url: str | None = raw.get("image_url")
        main_images = raw.get("main_images", [])
        if not image_url:
            image_url = main_images[0]["url"] if main_images else None
            
        images = [img["url"] for img in main_images] if main_images else None

        return NormalizedProduct(
            source=self.source,
            external_id=external_id,
            brand=raw.get("brand"),
            title=raw["model"],
            price=float(raw["price"]),
            currency="USD",
            category=metadata.get("style"),
            size=raw.get("size"),
            condition=None,
            color=metadata.get("color"),
            is_sold=bool(metadata.get("is_sold", False)),
            image_url=image_url,
            images=images,
            product_url=product_url,
        )
