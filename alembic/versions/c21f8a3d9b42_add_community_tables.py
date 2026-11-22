"""Add KHILAFAH Connect community tables.

Revision ID: c21f8a3d9b42
Revises: a76905e81aab
"""
from alembic import op
import sqlalchemy as sa

revision = "c21f8a3d9b42"
down_revision = "a76905e81aab"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "community_posts",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("author_id", sa.UUID(), nullable=False),
        sa.Column("body", sa.String(length=2000), nullable=False),
        sa.Column("topic", sa.String(length=40), nullable=False, server_default="General"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["author_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_community_posts_author_id", "community_posts", ["author_id"])
    op.create_index("ix_community_posts_topic", "community_posts", ["topic"])
    op.create_index("ix_community_posts_created_at", "community_posts", ["created_at"])

    op.create_table(
        "community_comments",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("post_id", sa.UUID(), nullable=False),
        sa.Column("author_id", sa.UUID(), nullable=False),
        sa.Column("body", sa.String(length=1000), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["post_id"], ["community_posts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["author_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_community_comments_post_id", "community_comments", ["post_id"])

    op.create_table(
        "community_likes",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("post_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(["post_id"], ["community_posts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("post_id", "user_id", name="uq_community_like_user_post"),
    )

    op.create_table(
        "community_follows",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("follower_id", sa.UUID(), nullable=False),
        sa.Column("followed_id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["follower_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["followed_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("follower_id", "followed_id", name="uq_community_follow_pair"),
    )
    op.create_index("ix_community_followed", "community_follows", ["followed_id"])

    op.create_table(
        "community_reports",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("reporter_id", sa.UUID(), nullable=False),
        sa.Column("post_id", sa.UUID(), nullable=False),
        sa.Column("reason", sa.String(length=500), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["reporter_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["post_id"], ["community_posts.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("community_reports")
    op.drop_index("ix_community_followed", table_name="community_follows")
    op.drop_table("community_follows")
    op.drop_table("community_likes")
    op.drop_index("ix_community_comments_post_id", table_name="community_comments")
    op.drop_table("community_comments")
    op.drop_index("ix_community_posts_created_at", table_name="community_posts")
    op.drop_index("ix_community_posts_topic", table_name="community_posts")
    op.drop_index("ix_community_posts_author_id", table_name="community_posts")
    op.drop_table("community_posts")
