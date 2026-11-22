"""Add editable community member profiles.

Revision ID: d4b2c7e91f30
Revises: c21f8a3d9b42
"""
from alembic import op
import sqlalchemy as sa

revision = "d4b2c7e91f30"
down_revision = "c21f8a3d9b42"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("bio", sa.String(length=240), nullable=True))
    op.add_column("users", sa.Column("avatar_url", sa.String(length=500), nullable=True))
    op.add_column("users", sa.Column("interests", sa.JSON(), nullable=False, server_default="[]"))


def downgrade() -> None:
    op.drop_column("users", "interests")
    op.drop_column("users", "avatar_url")
    op.drop_column("users", "bio")
