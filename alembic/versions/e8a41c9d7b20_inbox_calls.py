"""Add short-lived WebRTC call signaling sessions.

Revision ID: e8a41c9d7b20
Revises: d4b2c7e91f30
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "e8a41c9d7b20"
down_revision = "d4b2c7e91f30"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "inbox_calls",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("conversation_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("inbox_conversations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("caller_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("callee_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("call_type", sa.String(10), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="ringing"),
        sa.Column("offer_json", sa.JSON(), nullable=False),
        sa.Column("answer_json", sa.JSON(), nullable=True),
        sa.Column("caller_candidates", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("callee_candidates", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_inbox_calls_conversation_id", "inbox_calls", ["conversation_id"])
    op.create_index("ix_inbox_calls_caller_id", "inbox_calls", ["caller_id"])
    op.create_index("ix_inbox_calls_callee_id", "inbox_calls", ["callee_id"])


def downgrade() -> None:
    op.drop_index("ix_inbox_calls_callee_id", table_name="inbox_calls")
    op.drop_index("ix_inbox_calls_caller_id", table_name="inbox_calls")
    op.drop_index("ix_inbox_calls_conversation_id", table_name="inbox_calls")
    op.drop_table("inbox_calls")
