"""Add ephemeral community stories and view-once tracking.

Revision ID: f3b9c7a2d610
Revises: e8a41c9d7b20
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "f3b9c7a2d610"
down_revision = "e8a41c9d7b20"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "community_stories",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("author_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("media_type", sa.String(length=10), nullable=False),
        sa.Column("media_url", sa.String(length=1000), nullable=True),
        sa.Column("caption", sa.String(length=500), nullable=False, server_default=""),
        sa.Column("audience", sa.String(length=12), nullable=False, server_default="all"),
        sa.Column("view_once", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_community_stories_author_id", "community_stories", ["author_id"])
    op.create_index("ix_community_stories_expires_at", "community_stories", ["expires_at"])
    op.create_table(
        "community_story_views",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("story_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("community_stories.id", ondelete="CASCADE"), nullable=False),
        sa.Column("viewer_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("viewed_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("story_id", "viewer_id", name="uq_story_viewer"),
    )
    op.create_index("ix_community_story_views_story_id", "community_story_views", ["story_id"])


def downgrade() -> None:
    op.drop_index("ix_community_story_views_story_id", table_name="community_story_views")
    op.drop_table("community_story_views")
    op.drop_index("ix_community_stories_expires_at", table_name="community_stories")
    op.drop_index("ix_community_stories_author_id", table_name="community_stories")
    op.drop_table("community_stories")
