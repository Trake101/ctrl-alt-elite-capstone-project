"""add users column to project_templates

Revision ID: g4b9c3d2e5f6
Revises: f3a8b2c1d4e5
Create Date: 2025-01-25 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'g4b9c3d2e5f6'
down_revision: Union[str, None] = 'f3a8b2c1d4e5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('project_templates', sa.Column('users', postgresql.JSONB(astext_type=sa.Text()), nullable=True))


def downgrade() -> None:
    op.drop_column('project_templates', 'users')
