"""merge heads

Revision ID: a1b2c3d4e5f6
Revises: g4b9c3d2e5f6, 37110d5d7873, 8d7846e8bf18
Create Date: 2026-02-26 00:00:00.000000

"""
from typing import Sequence, Union


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str]] = ('g4b9c3d2e5f6', '37110d5d7873', '8d7846e8bf18')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
