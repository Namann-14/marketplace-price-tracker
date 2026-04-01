"""Collector for 1stDibs marketplace data."""
import re
from app.collectors.base import BaseCollector, NormalizedProduct


class FirstDibsCollector(BaseCollector):
    source = "1stdibs"

    def parse(self, raw: dict) -> NormalizedProduct:
        """
        Map a raw 1stDibs JSON record to a NormalizedProduct.

        Field mappings:
          external_id → segment after "id-" in product_url (e.g. "v_3093883")
          brand       → raw["brand"]
          title       → raw["model"]
          price       → raw["price"]
          currency    → "USD"
          category    → raw["metadata"]["garment_type"] if present, else None
          size        → raw["size"]
          condition   → raw["metadata"]["condition"] if present, else None
          color       → None
          is_sold     → False
          image_url   → raw["main_images"][0]["url"] if main_images else None
          product_url → raw["product_url"]
        """
        # TODO: implement field extraction
        product_url: str = raw["product_url"]
        match = re.search(r"id-([^/]+)", product_url)
        external_id = match.group(1) if match else product_url.rstrip("/").split("/")[-1]
        metadata: dict = raw.get("metadata", {})

        main_images = raw.get("main_images", [])
        image_url = main_images[0]["url"] if main_images else None

        return NormalizedProduct(
            source=self.source,
            external_id=external_id,
            brand=raw.get("brand"),
            title=raw["model"],
            price=float(raw["price"]),
            currency="USD",
            category=metadata.get("garment_type"),
            size=raw.get("size"),
            condition=metadata.get("condition"),
            color=None,
            is_sold=False,
            image_url=image_url,
            product_url=product_url,
        )
