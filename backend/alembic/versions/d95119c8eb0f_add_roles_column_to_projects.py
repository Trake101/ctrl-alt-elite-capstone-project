"""add_roles_column_to_projects

Revision ID: d95119c8eb0f
Revises: 8c2589e6cb21
Create Date: 2025-12-28 23:04:01.299082

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'd95119c8eb0f'
down_revision: Union[str, None] = '8c2589e6cb21'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('projects', sa.Column('roles', postgresql.JSONB(astext_type=sa.Text()), nullable=True))


def downgrade() -> None:
    op.drop_column('projects', 'roles')
