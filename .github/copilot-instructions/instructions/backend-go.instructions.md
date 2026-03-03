---
applyTo: 
  - "**/*.go"
  - "**/go.mod"
  - "**/go.sum"
---
<go_standards>

## Go

- **Go 1.22+** with modules (`go.mod`) — never use GOPATH mode
- **Standard library first:** Prefer `net/http`, `encoding/json`, `log/slog` over third-party when sufficient
- **Structured logging:** `log/slog` (stdlib) for structured JSON logs
- **Error handling:** Always check errors.
  Wrap with `fmt.Errorf("context: %w", err)` for stack context.
  Use `errors.Is`/`errors.As` for matching.
- **Concurrency:** Prefer channels and `sync` primitives.
  Use `context.Context` for cancellation and timeouts on all I/O operations.
- **Testing:** `testing` package + `testify` for assertions. Table-driven tests as default pattern.
- **Linting:** `golangci-lint` with `govet`, `staticcheck`, `errcheck`, `gosec` enabled
- **SAST:** `gosec` or Semgrep in CI

**Frameworks:**

- HTTP: `net/http` (stdlib) or Chi/Echo for routing. Gin for high-throughput APIs.
- gRPC: `google.golang.org/grpc` with protobuf definitions.
- ORM: `sqlc` (compile-time type-safe SQL) preferred over `gorm` for new projects.

**Key Rules:**

- No `panic` in library code — return errors. `panic` only in `main` for unrecoverable states.
- Use `context.Context` as first parameter in functions that do I/O or may be cancelled.
- Define interfaces at the consumer site, not the implementation site (accept interfaces, return structs).
- Keep packages small and focused. Avoid circular dependencies.
- Use `go generate` for code generation (mocks, protobuf, sqlc).

**Type Safety:**

- Use generics (Go 1.18+) for type-safe collections and utilities. Avoid `interface{}` / `any` where generics apply.
- Define custom types for domain concepts: `type UserID int64` for type safety.
- Use struct embedding for composition, not inheritance patterns.

**Performance:**

- Profile before optimizing: `pprof` for CPU/memory, `trace` for goroutine analysis.
- Use `sync.Pool` for frequently allocated objects.
- Prefer `strings.Builder` for string concatenation.
- Set `GOMAXPROCS` appropriately in containers (use `automaxprocs`).

**Pitfalls:**

1. ❌ Ignoring errors with `_` → ✅ Always handle or explicitly document why ignored.
2. ❌ Goroutine leaks → ✅ Use `context.Context` for cancellation, `errgroup` for coordination.
3. ❌ Data races → ✅ Use `-race` flag in tests. Protect shared state with `sync.Mutex` or channels.
4. ❌ `init()` functions → ✅ Avoid `init()` — use explicit initialization for testability.
5. ❌ Large interfaces → ✅ Keep interfaces small (1-3 methods). Compose via embedding.
</go_standards>
