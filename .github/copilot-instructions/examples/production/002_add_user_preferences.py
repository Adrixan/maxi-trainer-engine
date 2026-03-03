"""
Alembic migration: Add user preferences table.

Revision ID: 002
Revises: 001
Create Date: 2026-02-05

Demonstrates:
- Foreign key relationships
- JSON column types
- Data migration
- Transaction safety
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import json

revision = '002_add_user_preferences'
down_revision = '001_create_users_table'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add user preferences table with foreign key."""
    
    # Create user_preferences table
    op.create_table(
        'user_preferences',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('theme', sa.String(length=20), server_default='light'),
        sa.Column('language', sa.String(length=10), server_default='en'),
        sa.Column('notifications_enabled', sa.Boolean(), server_default=sa.text('true')),
        sa.Column('preferences_json', postgresql.JSONB(), nullable=True, comment='Additional preferences as JSON'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(
            ['user_id'],
            ['users.id'],
            name='fk_user_preferences_user_id',
            ondelete='CASCADE'  # Delete preferences when user is deleted
        ),
        sa.UniqueConstraint('user_id', name='uq_user_preferences_user_id'),
        comment='User preferences and settings'
    )

    # Create indexes
    op.create_index('ix_user_preferences_user_id', 'user_preferences', ['user_id'])

    # Data migration: Create default preferences for existingusers
    op.execute("""
        INSERT INTO user_preferences (user_id, preferences_json)
        SELECT id, '{}'::jsonb
        FROM users
        WHERE NOT EXISTS (
            SELECT 1 FROM user_preferences WHERE user_preferences.user_id = users.id
        );
    """)


def downgrade() -> None:
    """Remove user preferences table."""
    op.drop_index('ix_user_preferences_user_id', table_name='user_preferences')
    op.drop_table('user_preferences')
