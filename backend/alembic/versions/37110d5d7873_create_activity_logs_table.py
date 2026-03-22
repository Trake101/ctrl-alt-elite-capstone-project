"""create activity logs table

Revision ID: 37110d5d7873
Revises: 674e91b4a7ab
Create Date: 2026-02-11 20:46:36.127842

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB


# revision identifiers, used by Alembic.
revision: str = '37110d5d7873'
down_revision: Union[str, None] = '674e91b4a7ab'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if 'activity_logs' not in inspector.get_table_names():
        op.create_table(
            'activity_logs',
            sa.Column('activity_log_id', UUID(as_uuid=True), primary_key=True, index=True),
            sa.Column('object_type', sa.String(255), nullable=False),
            sa.Column('object_id', UUID(as_uuid=True), nullable=False, index=True),
            sa.Column('action', sa.String(255), nullable=False),
            sa.Column('description', sa.Text(), nullable=False),
            sa.Column('metadata', JSONB, nullable=True),
            sa.Column('action_by', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        )


def downgrade() -> None:
    op.drop_table('activity_logs')
