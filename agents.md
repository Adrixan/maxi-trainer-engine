# agents.md — GLM-5 Project Configuration

This file configures GLM-5 behavior for this project. Place in project root.

## Project Context

<!-- Describe your project here -->
- **Type**: Web Application / API / CLI / Library
- **Stack**: <!-- e.g., Python/FastAPI, Node/Express, Java/Spring -->
- **Deployment**: <!-- e.g., Docker, Kubernetes, Serverless -->

## Coding Standards

### Language-Specific

<!-- Uncomment and fill in as needed -->

<!--
#### Python
- Version: 3.12+
- Linter: Ruff
- Type hints: mandatory
- Testing: pytest

#### TypeScript
- Version: 5.6+
- Strict mode: enabled
- Testing: Vitest

#### Java
- Version: 21 LTS
- Framework: Spring Boot 3.3+
- Testing: JUnit 5 + AssertJ

#### PHP
- Version: 8.3+
- Framework: Laravel 11 / Symfony 7
- Strict types: `declare(strict_types=1);`
-->

### General

- Max function length: 50 lines
- Max class length: 300 lines
- Documentation: Public APIs must have docstrings
- Commits: Conventional format (`feat:`, `fix:`, `docs:`, `refactor:`)

## File Organization

```
src/
├── api/           # API endpoints/routes
├── services/      # Business logic
├── models/        # Data models/entities
├── repositories/  # Data access
└── utils/         # Shared utilities

tests/
├── unit/          # Fast, isolated tests
├── integration/   # Database/external services
└── e2e/           # End-to-end flows
```

## Output Storage

Large outputs (>1KB estimated) should be written to files instead of displayed:

```
.kilocode/
├── outputs/       # Generated tool outputs
│   ├── analysis/  # Analysis results
│   ├── reports/   # Generated reports
│   └── api/       # API response dumps
└── templates/     # Project-specific templates
```

### Naming Convention

- Use kebab-case: `analysis-user-auth-2024-01-15.md`
- Include date for time-sensitive outputs
- Use descriptive prefixes: `report-`, `analysis-`, `response-`

### Output Summary Format

When writing large outputs to files, report:

- File path and size
- Key findings summary
- Location for full content

## Context Optimization

Follow the rules in [`rules/context-optimization.md`](rules/context-optimization.md) for:

- **Stable Prefixes**: Keep static content at document start
- **Append-Only Pattern**: Never modify earlier context
- **U-Shaped Attention**: Critical content at top/bottom, examples in middle
- **Response Budgets**: Match response size to task type

## Templates

Use templates from `.kilocode/templates/` for consistent outputs:

| Template | Purpose |
|----------|---------|
| [`code-template.md`](templates/code-template.md) | Code implementation structure |
| [`analysis-template.md`](templates/analysis-template.md) | Analysis and review format |
| [`document-template.md`](templates/document-template.md) | Documentation structure |
| [`test-template.md`](templates/test-template.md) | Test case format |
| [`api-response-template.md`](templates/api-response-template.md) | API response summaries |
| [`subagent-task-template.md`](templates/subagent-task-template.md) | Delegated task format |
| [`project-state.md`](templates/project-state.md) | Project state tracking |

### Template Usage Rules

1. Copy template structure exactly
2. Fill placeholders only (marked as `[placeholder]`)
3. Don't regenerate template content
4. Prefer project templates over defaults

## Security Rules

### Restricted Files

GLM-5 MUST NOT read or modify:

```
.env
.env.*
credentials.json
*.pem
*.key
secrets.*
```

### Required Checks

- [ ] All inputs validated before processing
- [ ] Parameterized queries for all database operations
- [ ] No hardcoded secrets
- [ ] Dependencies scanned for CVEs
- [ ] Error messages sanitized for users

## Testing Requirements

- **Coverage**: 80% minimum for business logic
- **Critical paths**: 100% (auth, payments, data mutations)
- **Framework**: Project-specific (pytest, Jest, JUnit, PHPUnit)

## Documentation

- API endpoints: OpenAPI/Swagger spec
- Complex logic: Inline comments explaining "why"
- README: Setup, usage, deployment instructions

## Deployment

<!-- Customize for your deployment target -->

### Docker

- Base image: Use specific version tags (not `:latest`)
- User: Non-root (e.g., `USER app`)
- Health check: Required

### Kubernetes

- Resource limits: Required for all containers
- Readiness/liveness probes: Required
- Secrets: From Kubernetes Secrets or External Secrets Operator

## Project-Specific Rules

<!-- Add custom rules below -->

1.
2.
3.

---

*This file is loaded automatically by Kilo Code when present in project root.*
