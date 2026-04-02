"""Add missing product columns for grouping and image arrays.

Revision ID: 0002_add_products_group_hash_and_images
Revises: 0001_initial
Create Date: 2026-04-02

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0002_add_products_group_hash_and_images"
down_revision: Union[str, None] = "0001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("products") as batch_op:
        batch_op.add_column(sa.Column("group_hash", sa.String(), nullable=True))
        batch_op.add_column(sa.Column("images", sa.JSON(), nullable=True))
        batch_op.create_index("ix_products_group_hash", ["group_hash"], unique=False)


def downgrade() -> None:
    with op.batch_alter_table("products") as batch_op:
        batch_op.drop_index("ix_products_group_hash")
        batch_op.drop_column("images")
        batch_op.drop_column("group_hash")
