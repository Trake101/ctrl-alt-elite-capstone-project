"""create project_templates table

Revision ID: f3a8b2c1d4e5
Revises: 674e91b4a7ab
Create Date: 2025-01-25 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'f3a8b2c1d4e5'
down_revision: Union[str, None] = '674e91b4a7ab'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'project_templates',
        sa.Column('template_id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('owner_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('statuses', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('roles', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('tasks', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('template_id')
    )
    op.create_index(op.f('ix_project_templates_template_id'), 'project_templates', ['template_id'], unique=False)
    op.create_index(op.f('ix_project_templates_owner_id'), 'project_templates', ['owner_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_project_templates_owner_id'), table_name='project_templates')
    op.drop_index(op.f('ix_project_templates_template_id'), table_name='project_templates')
    op.drop_table('project_templates')
