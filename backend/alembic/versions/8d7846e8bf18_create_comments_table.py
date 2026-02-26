"""create comments table

Revision ID: 8d7846e8bf18
Revises: 674e91b4a7ab
Create Date: 2026-02-11 20:31:38.663016

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision: str = '8d7846e8bf18'
down_revision: Union[str, None] = '674e91b4a7ab'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'comments',
        sa.Column('comment_id', UUID(as_uuid=True), primary_key=True, index=True),
        sa.Column('task_id', UUID(as_uuid=True), sa.ForeignKey('tasks.task_id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('created_by', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('comment', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_table('comments')
