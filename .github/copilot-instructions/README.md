# GitHub Copilot Instructions Collection

A comprehensive set of best practice instructions and examples to efficiently
and securely develop across various architectures using GitHub Copilot.
Optimized for Claude Opus 4.6.

## Overview

Domain-specific instruction files that guide GitHub Copilot to generate secure, maintainable,
and high-quality code. Each file targets specific technologies with security guidelines,
testing standards, and common pitfalls.

## Instruction Files

Located in [`instructions/`](instructions/). Files are split by language/tool
so only relevant instructions are loaded per file type, minimizing context window usage:

| File | Domain | applyTo |
| ------ | -------- | --------- |
| [backend-shared](instructions/backend-shared.instructions.md) | Backend (all) | `*.py`, `*.java`, `*.go`, `*.php`, `*.sql` |
| [backend-python](instructions/backend-python.instructions.md) | Python 3.12+ | `*.py` |
| [backend-java](instructions/backend-java.instructions.md) | Java 21 / Spring Boot 3.3+ | `*.java` |
| [backend-go](instructions/backend-go.instructions.md) | Go 1.22+ | `*.go`, `go.mod`, `go.sum` |
| [backend-php](instructions/backend-php.instructions.md) | PHP 8.3+ / Laravel 11 / Symfony 7 | `*.php` |
| [backend-sql](instructions/backend-sql.instructions.md) | SQL | `*.sql` |
| [ai-integration](instructions/ai-integration.instructions.md) | AI/ML Integration | `*.py`, `*.ts`, `*.js`, `*.java` |
| [ops-shared](instructions/ops-shared.instructions.md) | DevOps (all) | Dockerfiles, infra YAML, `*.tf`, `*.hcl` |
| [ops-docker](instructions/ops-docker.instructions.md) | Docker / Podman | `Dockerfile*`, `Containerfile*`, `docker-compose*` |
| [ops-kubernetes](instructions/ops-kubernetes.instructions.md) | Kubernetes | `k8s/**`, `kubernetes/**`, `helm/**` |
| [ops-terraform](instructions/ops-terraform.instructions.md) | Terraform 1.7+ / OpenTofu | `*.tf`, `*.tfvars`, `*.hcl` |
| [ops-ansible](instructions/ops-ansible.instructions.md) | Ansible | `ansible/**`, `playbooks/**` |
| [scripting-shared](instructions/scripting-shared.instructions.md) | Scripting (all) | `*.sh`, `*.ps1` |
| [scripting-bash](instructions/scripting-bash.instructions.md) | Bash | `*.sh` |
| [scripting-powershell](instructions/scripting-powershell.instructions.md) | PowerShell | `*.ps1` |
| [web](instructions/web.instructions.md) | Frontend (React 19 / Next.js 15 / TS 5.6+) | `*.html`, `*.css`, `*.js`, `*.ts`, `*.jsx`, `*.tsx` |

## Working Examples

Located in [`examples/`](examples/):

| Category | Files |
| ---------- | ------- |
| **Backend** | [Python](examples/backend/python/), [Java](examples/backend/java/), [PHP](examples/backend/php/) — UserService + tests |
| **Integration Tests** | [Python + Testcontainers](examples/integration-tests/test_user_service_integration.py), [Spring Boot + Testcontainers](examples/integration-tests/UserServiceIntegrationTest.java) |
| **Production Patterns** | [Alembic migrations](examples/production/), [JWT auth](examples/production/jwt_auth_fastapi.py), [Prometheus](examples/production/prometheus.yml) |
| **Frontend** | [React components](examples/web/react/) — UserCard, useAsync hook, CSS modules, tests |
| **DevOps** | [Docker](examples/docker/), [Terraform](examples/terraform/), [Kubernetes](examples/kubernetes/), [Ansible](examples/ansible/), [CI/CD](examples/ci/) |
| **Scripting** | [Bash deploy](examples/scripting/deploy.sh) + [BATS tests](examples/scripting/test_deploy.bats), [PowerShell backup](examples/scripting/backup.ps1) + [Pester tests](examples/scripting/backup.Tests.ps1) |

## Quick Start

### Option A: Git Submodule (Recommended)

```bash
cd /path/to/your/project
git submodule add https://github.com/Adrixan/copilot-instructions.git .github/copilot-instructions
ln -s copilot-instructions/copilot-instructions.md .github/copilot-instructions.md
git add .gitmodules .github/
git commit -m "Add Copilot instructions as submodule"
```

**See [SUBMODULE_GUIDE.md](SUBMODULE_GUIDE.md) for team workflows, CI/CD integration, updating, and troubleshooting.**

### Option B: Direct Copy

```bash
cp copilot-instructions.md /your/project/.github/
cp -r instructions /your/project/.github/
cp -r examples /your/project/.github/
```

### How It Works

GitHub Copilot automatically loads `.github/copilot-instructions.md`.
The orchestrator detects file types via `applyTo` patterns
and loads domain-specific guidelines.
All paths are relative for submodule compatibility.

### Customize for Your Project

Edit `copilot-instructions.md` to add project-specific conventions,
internal library references, team standards, and architectural decisions.

## Key Features

- **Security by Default:** OWASP Top 10, CIS benchmarks, SLSA supply chain,
  SAST/DAST in CI, no hardcoded secrets, input validation, CSP
- **TDD Workflow:** Test-first for business logic, linting/validation for infrastructure
- **Type Safety:** TypeScript 5.6+ strict mode, Python 3.12+ type hints,
  Java 21 records, PHP 8.3+ strict types, Go generics
- **Accessibility:** WCAG 2.1 AA, semantic HTML, ARIA, keyboard navigation
- **Observability:** OpenTelemetry for traces/metrics/logs, structured JSON logging, Prometheus/Grafana
- **i18n:** Mandatory translation keys, locale-aware formatting
- **AI Safety:** Prompt injection prevention, output sanitization, cost controls
- **Priority System:** Security > Correctness > Accessibility > Performance > Maintainability > Style
- **Common Pitfalls:** Anti-patterns with corrections (❌/✅ format) in every instruction file

## What Changed in the Opus 4.6 Overhaul

### Orchestrator

- Removed nested backtick fences — clean YAML frontmatter + XML structure
- Removed Claude Code `#subAgents` dependency — works with standard GitHub Copilot
- Added `<priority_order>` for conflict resolution (security > correctness > ...)
- Added `<reasoning_protocol>` for complex architectural decisions
- Added `<output_templates>` for structured requirements and decision logs
- Added SAST scan requirement in `<quality_gates>`
- Added OpenTelemetry in `<workflow_mandates>` observability

### Technology Updates

- Python 3.11+ → **3.12+** (type statement, @override, Ruff replaces Black+isort)
- Java 17 → **21 LTS** (virtual threads, pattern matching, sequenced collections)
- PHP 8.2+ → **8.3+** (typed class constants, #[\Override], json_validate)
- Spring Boot 3.x → **3.3+** (virtual threads, GraalVM native image)
- React → **React 19** (Compiler, Actions, use() hook)
- Next.js → **Next.js 15** (Turbopack, Partial Prerendering)
- TypeScript → **5.6+** (isolatedDeclarations, noUncheckedSideEffectImports)
- Terraform >= 1.5 → **1.7+** (import blocks, removed blocks, terraform test)
- FID <100ms → **INP <200ms** (Core Web Vitals updated March 2024)

### New Domains

- **Go** (`backend-go.instructions.md`) — Go 1.22+, error handling, concurrency, sqlc
- **AI/ML Integration** (`ai-integration.instructions.md`) — prompt injection, output safety, cost controls
- **OpenTofu** — added as Terraform alternative
- **Podman/Containerfile** — added to Docker instruction patterns

### Security Enhancements

- SLSA framework for supply chain integrity across all ops instructions
- SAST/DAST pipeline guidance (Semgrep, CodeQL, OWASP ZAP, Trivy, gosec)
- Secrets detection (gitleaks, trufflehog) in pre-commit hooks
- AI output sanitization rules in web and AI integration instructions

### Quality Improvements

- Consistent ❌/✅ pitfall format across all domain files
- API versioning guidance in backend-shared
- OpenTelemetry observability guidance in backend-shared and ops-shared
- Cross-references between shared and domain-specific instruction files
- `kubeconform` replaces deprecated `kubeval`

## Repository Structure

```text
copilot-instructions/
├── copilot-instructions.md        # Main orchestrator
├── instructions/
│   ├── backend-shared.instructions.md    # Backend: shared security, testing, architecture
│   ├── backend-python.instructions.md    # Python 3.12+ standards
│   ├── backend-java.instructions.md      # Java 21 / Spring Boot 3.3+ standards
│   ├── backend-go.instructions.md        # Go 1.22+ standards (NEW)
│   ├── backend-php.instructions.md       # PHP 8.3+ standards
│   ├── backend-sql.instructions.md       # SQL standards
│   ├── ai-integration.instructions.md    # AI/ML integration security (NEW)
│   ├── ops-shared.instructions.md        # DevOps: shared security, architecture
│   ├── ops-docker.instructions.md        # Docker / Podman standards
│   ├── ops-kubernetes.instructions.md    # Kubernetes standards
│   ├── ops-terraform.instructions.md     # Terraform / OpenTofu standards
│   ├── ops-ansible.instructions.md       # Ansible standards
│   ├── scripting-shared.instructions.md  # Scripting: shared security, validation
│   ├── scripting-bash.instructions.md    # Bash standards
│   ├── scripting-powershell.instructions.md # PowerShell standards
│   └── web.instructions.md               # React 19 / Next.js 15 / TS 5.6+
├── examples/                      # Working code demonstrations
│   ├── backend/                   # Java, PHP, Python
│   ├── web/react/                 # React components + tests
│   ├── docker/                    # Secure Dockerfiles
│   ├── terraform/                 # State & secrets management
│   ├── kubernetes/                # RBAC, NetworkPolicy
│   ├── ansible/                   # Vault, idempotency
│   ├── ci/                        # GitHub Actions pipelines
│   ├── production/                # Migrations, auth, monitoring
│   ├── scripting/                 # Bash + PowerShell + tests
│   └── ops/                       # Cross-domain pitfalls
├── SUBMODULE_GUIDE.md             # Git submodule integration
├── README.md
└── LICENSE
```

## Contributing

1. Fork → feature branch → add example with comments and tests → update instruction file → PR
2. Keep all paths relative (submodule compatibility)
3. Follow existing patterns: security-first, tested, documented, ❌/✅ pitfall format

**For organizations:** Fork, customize, tag releases, add as submodule to team projects.
Sync upstream with `git fetch upstream && git merge upstream/main`.

## License

GNU Affero General Public License v3 — see [LICENSE](LICENSE).

## Resources

- [GitHub Copilot Documentation](https://docs.github.com/en/copilot)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [SLSA Framework](https://slsa.dev/)
- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [CIS Benchmarks](https://www.cisecurity.org/cis-benchmarks)
