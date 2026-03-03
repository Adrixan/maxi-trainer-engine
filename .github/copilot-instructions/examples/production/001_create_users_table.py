"""
Alembic migration: Create users table.

Revision ID: 001
Revises: None
Create Date: 2026-02-05

This migration demonstrates:
- Table creation
- Column definitions with constraints
- Indexes for performance
- Comments for documentation
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# Revision identifiers
revision = '001_create_users_table'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Upgrade database schema.
    
    Best practices:
    - Reversible operations
    - No data loss
    - Performance considerations
    - Clear comments
    """
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False, comment='Primary key'),
        sa.Column('username', sa.String(length=30), nullable=False, comment='Unique username'),
        sa.Column('email', sa.String(length=255), nullable=False, comment='User email address'),
        sa.Column('password_hash', sa.String(length=255), nullable=False, comment='Hashed password'),
        sa.Column('role', sa.String(length=20), nullable=False, server_default='user', comment='User role'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true'), comment='Account active status'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False, comment='Creation timestamp'),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False, comment='Last update timestamp'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('username', name='uq_users_username'),
        sa.UniqueConstraint('email', name='uq_users_email'),
        sa.CheckConstraint("role IN ('admin', 'user', 'guest')", name='ck_users_role'),
        comment='User accounts table'
    )

    # Create indexes for performance
    op.create_index('ix_users_email', 'users', ['email'])
    op.create_index('ix_users_username', 'users', ['username'])
    op.create_index('ix_users_created_at', 'users', ['created_at'])

    # Create trigger for updated_at timestamp (PostgreSQL specific)
    op.execute("""
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)

    op.execute("""
        CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    """)


def downgrade() -> None:
    """
    Downgrade database schema.
    
    Always provide down migration:
    - Enables rollback
    - Safer deployments
    - Easier testing
    """
    # Drop trigger first
    op.execute("DROP TRIGGER IF EXISTS update_users_updated_at ON users")
    op.execute("DROP FUNCTION IF EXISTS update_updated_at_column()")

    # Drop indexes
    op.drop_index('ix_users_created_at', table_name='users')
    op.drop_index('ix_users_username', table_name='users')
    op.drop_index('ix_users_email', table_name='users')

    # Drop table
    op.drop_table('users')
