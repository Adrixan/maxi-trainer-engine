---
applyTo: 
  - "**/*.sql"
---
<sql_standards>

## SQL

- **ANSI SQL** preferred for portability
- **Migrations ONLY** for schema changes (Flyway, Liquibase, Alembic)
- **Indexes** on Foreign Keys, WHERE/JOIN/ORDER BY columns automatically
- **Naming:** `snake_case` for all identifiers

```sql
-- ❌ NEVER (SQL Injection via string concatenation in app code)
-- ✅ ALWAYS use prepared statements / parameterized queries in app code
```

**Query Optimization:** Use EXPLAIN/ANALYZE for slow queries,
eager loading to prevent N+1,
cursor-based pagination (keyset) for large datasets.
Prefer `EXISTS` over `IN` for subqueries on large tables.

**Schema Versioning:** Every migration must be reversible (include `down` migration).
Test migrations against production-like data volumes.
Never modify a released migration — create a new one.

See [examples/production/](../examples/production/) for Alembic migration patterns.
</sql_standards>
