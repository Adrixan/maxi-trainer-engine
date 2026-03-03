---
applyTo: 
  - "**/*.py"
---
<python_standards>

## Python (FastAPI / Django / Flask)

- **Python 3.12+** with mandatory type hints on all functions/methods
- **`type` statement** for type aliases (Python 3.12+): `type UserId = int`
- **`@override` decorator** from `typing` for explicit method overrides
- **Protocol classes** for dependency interfaces (duck typing with contracts)
- **Frozen dataclasses** or **`NamedTuple`** for DTOs
- **Testing:** Pytest with pytest-cov
- **Linting:** Ruff (replaces Black + isort + flake8) + mypy
- **SAST:** Semgrep or Bandit in CI

**Type Safety:** `strict: true` in mypy config.
All functions must have return type annotations.
Use `TypeGuard` and `TypeIs` for type narrowing.

```python
# ❌ NEVER (SQL Injection)
query = f"SELECT * FROM users WHERE username = '{username}'"

# ✅ ALWAYS (Prepared statements)
query = "SELECT * FROM users WHERE username = %s"
cursor.execute(query, (username,))
```

**Observability:** Use OpenTelemetry SDK for traces/metrics. Structured logging via `structlog` or `python-json-logger`.

See [examples/backend/python/](../examples/backend/python/) for UserService and test patterns.
See [examples/production/](../examples/production/) for Alembic migration patterns.
</python_standards>
