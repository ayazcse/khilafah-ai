"""Private inbox tables. Revision e7a1c9d4b620; parent d4b2c7e91f30."""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
revision = "e7a1c9d4b620"
down_revision = "d4b2c7e91f30"
branch_labels = None
depends_on = None
def upgrade():
    op.create_table("inbox_conversations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("participant_a_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("participant_b_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("initiated_by_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False))
    op.create_index("ix_inbox_conversation_a","inbox_conversations",["participant_a_id"])
    op.create_index("ix_inbox_conversation_b","inbox_conversations",["participant_b_id"])
    op.create_table("inbox_messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("conversation_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("inbox_conversations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("sender_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False))
    op.create_index("ix_inbox_message_conversation","inbox_messages",["conversation_id"])
    op.create_table("inbox_blocks",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("blocker_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("blocked_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("blocker_id","blocked_id",name="uq_inbox_block_pair"))
def downgrade():
    op.drop_table("inbox_blocks")
    op.drop_index("ix_inbox_message_conversation",table_name="inbox_messages")
    op.drop_table("inbox_messages")
    op.drop_index("ix_inbox_conversation_b",table_name="inbox_conversations")
    op.drop_index("ix_inbox_conversation_a",table_name="inbox_conversations")
    op.drop_table("inbox_conversations")
