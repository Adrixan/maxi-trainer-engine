---
applyTo: 
  - "**/*.php"
  - "**/*.py"
  - "**/*.java"
  - "**/*.go"
  - "**/*.sql"
---
<agent_profile>
Role: Backend System Engineer
Focus: TDD, Security, Modularity
</agent_profile>

<quick_reference>
Critical Rules (TL;DR):

- TDD: Red → Green → Refactor (see orchestrator workflow_mandates)
- No SQL Injection: Prepared statements ONLY, never string concatenation
- Migrations: Schema changes ONLY via migration files
- Dependency Injection: Constructor injection preferred
- Code Size: Functions <50 lines, classes <300 lines
- Security: Input validation, output encoding, least privilege
- Testing: Minimum 80% coverage for business logic, 100% for critical paths
- API Versioning: URL path (`/v1/`) or `Accept` header — choose one, be consistent
</quick_reference>

<testing_protocol>
Coverage Requirements:

- Business logic: 80% minimum
- Controllers/Routes: basic integration tests
- Repositories: test with real database (Testcontainers)
- Critical paths (auth, payments): 100%

Test Organization:

```text
tests/
├── unit/           # Fast, isolated tests
├── integration/    # Tests with database/external services
└── e2e/           # End-to-end API tests
```

Integration Testing Examples:

- Python:
  [examples/integration-tests/test_user_service_integration.py](../examples/integration-tests/test_user_service_integration.py)
- Java:
  [examples/integration-tests/UserServiceIntegrationTest.java](../examples/integration-tests/UserServiceIntegrationTest.java)
</testing_protocol>

<security_standards>
Governing Standards: OWASP Top 10 (2021+), OWASP API Security Top 10 (2023),
SLSA framework for supply chain integrity.
All backend code MUST be reviewed against these checklists.

OWASP Top 10:

- A01 Broken Access Control: Enforce least privilege, deny by default, RBAC on every endpoint.
- A02 Cryptographic Failures: TLS everywhere, Argon2/Bcrypt for passwords, no sensitive data in logs or URLs.
- A03 Injection: Prepared statements / parameterized queries ONLY. Validate all inputs with schema types.
- A04 Insecure Design: Threat model critical flows (auth, payments). Use abuse-case testing.
- A05 Security Misconfiguration: No default credentials,
  disable debug in production, minimal error detail in responses.
- A06 Vulnerable Components: `pip-audit`, `mvn dependency:check`, `composer audit` in CI. Block merge on known CVEs.
- A07 Auth Failures: JWT with short expiry (15 min access, 7 day refresh).
  MFA for admins. Account lockout after failed attempts.
- A08 Data Integrity Failures: Verify signatures on updates/serialized data. Use SRI for external resources.
- A09 Logging & Monitoring: Structured JSON logs for auth events,
  access control failures, input validation failures. Alert on anomalies.
- A10 SSRF: Validate and allowlist outbound URLs. Block internal/metadata endpoints (169.254.169.254).

OWASP API Security Top 10 (additional for APIs):

- Broken Object Level Authorization (BOLA): verify object ownership on every request.
- Broken Authentication: rate-limit auth endpoints, use strong tokens.
- Unrestricted Resource Consumption: paginate, rate-limit, set max request sizes.
- Mass Assignment: use explicit DTOs/allowlists — never bind request body directly to models.

Supply Chain (SLSA):

- Track provenance of all dependencies. Use lockfiles (`poetry.lock`, `pom.xml` with hashes, `composer.lock`).
- Verify dependency signatures where available. Pin exact versions in production.
- Run SAST (Semgrep, CodeQL) and SCA (Dependabot, Snyk) in CI. Block merge on findings.

Implementation Checklist:

1. Input Validation: Use schema validation (Pydantic, Bean Validation, PHP attributes). Validate at API boundary.
2. Authentication: Bcrypt/Argon2 for passwords. JWT with short expiry.
   RBAC with least privilege. MFA for admins.
   See [examples/production/jwt_auth_fastapi.py](../examples/production/jwt_auth_fastapi.py).
3. SQL Injection: Prepared statements only. Never concatenate user input into queries.
4. Secrets: Environment variables for dev/test, Vault/Secrets Manager
   for production. Never commit `.env` or credentials.
5. API Security: Rate limiting, CORS whitelist, HTTPS only, security headers (CSP, HSTS, X-Frame-Options).
6. SAST/DAST: Semgrep or CodeQL for static analysis, OWASP ZAP for dynamic testing in CI.
</security_standards>

<api_versioning>
Choose one strategy per project and apply consistently:

- URL path versioning: `/api/v1/users` — simplest, most common, best for public APIs.
- Accept header: `Accept: application/vnd.myapp.v1+json` — cleaner URLs, harder to test in browser.
- Query parameter: `?version=1` — discouraged, easy to miss.

Rules: Never break existing versions. Deprecate with `Sunset` header
and minimum 6-month notice. Document all versions in OpenAPI spec.
</api_versioning>

<observability>
Use OpenTelemetry as the standard for traces, metrics, and logs:

- Auto-instrument HTTP frameworks (FastAPI, Spring Boot, Laravel).
- Custom spans for business-critical operations (auth, payments, external API calls).
- Export to Jaeger, Grafana Tempo, or cloud-native backends.
- Structured JSON logs with trace/span IDs for correlation.
- Metrics: request rate, error rate, latency histograms (P50/P95/P99).

See [examples/production/prometheus.yml](../examples/production/prometheus.yml) for metrics collection.
</observability>

<performance_guidelines>

1. Database: Connection pooling (HikariCP, SQLAlchemy pool),
   indexes on query columns, Redis for hot data,
   read replicas for read-heavy workloads.
2. API: Paginate all list endpoints, async I/O for I/O-bound operations, gzip responses >1KB.
3. Monitoring: Structured JSON logs, OpenTelemetry APM, metrics (latency, error rate, throughput).
</performance_guidelines>

<common_pitfalls>

1. ❌ N+1 Queries → ✅ Use eager loading / `joinedload` / batch fetching — never lazy-load in loops.
2. ❌ Missing Input Validation → ✅ Always validate at the API boundary with schema types, not inside business logic.
3. ❌ Leaking Entities → ✅ Return DTOs from API endpoints, never database entities.
4. ❌ No Transactions → ✅ Wrap multi-step mutations in transactions for atomicity.
5. ❌ Field Injection → ✅ Use constructor injection for testability — no `@Autowired` on fields.
6. ❌ No API versioning → ✅ Version from day one. Breaking changes require a new version.
</common_pitfalls>

<modularity_architecture>
Layered Architecture: Controllers → Services → Repositories → Database.
DTOs at boundaries, domain entities internally.

- Dependency Injection: Constructor injection, depend on abstractions (interfaces/protocols)
- Single Responsibility: One reason to change per class
- Microservices threshold: >10,000 LOC or distinct bounded context → extract service
- Communication: REST/gRPC (sync), message queues (async); each service owns its database
</modularity_architecture>
