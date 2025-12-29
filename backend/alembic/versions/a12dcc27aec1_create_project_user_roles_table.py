"""create_project_user_roles_table

Revision ID: a12dcc27aec1
Revises: d95119c8eb0f
Create Date: 2025-12-28 23:06:36.965623

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'a12dcc27aec1'
down_revision: Union[str, None] = 'd95119c8eb0f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'project_user_roles',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('role', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['project_id'], ['projects.project_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_project_user_roles_id'), 'project_user_roles', ['id'], unique=False)
    op.create_index(op.f('ix_project_user_roles_project_id'), 'project_user_roles', ['project_id'], unique=False)
    op.create_index(op.f('ix_project_user_roles_user_id'), 'project_user_roles', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_project_user_roles_user_id'), table_name='project_user_roles')
    op.drop_index(op.f('ix_project_user_roles_project_id'), table_name='project_user_roles')
    op.drop_index(op.f('ix_project_user_roles_id'), table_name='project_user_roles')
    op.drop_table('project_user_roles')
