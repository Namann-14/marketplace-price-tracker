"""Base collector interface shared by all marketplace collectors."""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from pathlib import Path


@dataclass
class NormalizedProduct:
    source: str
    external_id: str
    brand: str | None
    title: str
    price: float
    currency: str
    category: str | None
    size: str | None
    condition: str | None
    color: str | None
    is_sold: bool
    image_url: str | None
    images: list[str] | None
    product_url: str


class BaseCollector(ABC):
    """Abstract base class for all marketplace collectors."""

    source: str  # must be overridden by subclasses

    @abstractmethod
    def parse(self, raw: dict) -> NormalizedProduct:
        """Parse a single raw JSON record into a NormalizedProduct."""
        ...

    async def fetch_all(self, data_dir: Path) -> list[NormalizedProduct]:
        """
        Read all JSON files matching ``{source}_*.json`` from *data_dir*,
        parse each item in the top-level list, and return the combined results.
        """
        import json

        products: list[NormalizedProduct] = []
        pattern = f"{self.source}_*.json"
        for json_file in sorted(data_dir.glob(pattern)):
            with json_file.open(encoding="utf-8") as f:
                records = json.load(f)
            if not isinstance(records, list):
                records = [records]
            for record in records:
                try:
                    products.append(self.parse(record))
                except Exception as exc:  # noqa: BLE001
                    # Log and continue so one bad record doesn't abort the batch
                    print(f"[{self.source}] Failed to parse record: {exc}")
        return products
