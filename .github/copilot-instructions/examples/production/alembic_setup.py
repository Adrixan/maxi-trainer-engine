"""
Alembic migration example - Database schema versioning.

Demonstrates:
- Alembic migration setup
- Version control for database schema
- Up/down migrations
- Data migrations
- Multi-environment support

Setup:
    pip install alembic psycopg2-binary
    alembic init alembic
    Configure alembic.ini with your database URL
"""

# alembic/env.py - Configuration for Alembic
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
import os

# Import your SQLAlchemy models
from myapp.models import Base

# Alembic Config object
config = context.config

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set target metadata for autogenerate
target_metadata = Base.metadata

# Support for multiple environments
def get_url():
    """Get database URL from environment or config."""
    return os.getenv("DATABASE_URL") or config.get_main_option("sqlalchemy.url")


def run_migrations_offline() -> None:
    """
    Run migrations in 'offline' mode.
    
    Generates SQL scripts without database connection.
    Useful for review or manual execution.
    """
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,  # Detect column type changes
        compare_server_default=True,  # Detect default value changes
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """
    Run migrations in 'online' mode.
    
    Executes migrations directly against database.
    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,  # Don't pool connections for migrations
        url=get_url(),
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
