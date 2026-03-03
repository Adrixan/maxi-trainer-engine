---
applyTo: 
  - "Dockerfile"
  - "Containerfile"
  - "**/Dockerfile*"
  - "**/Containerfile*"
  - "**/.dockerignore"
  - "**/docker-compose*.yml"
  - "**/docker-compose*.yaml"
---
<docker_standards>

## Docker / Podman

CIS Benchmark Key Controls: Non-root user, read-only root filesystem,
no privileged containers, content trust enabled,
resource limits, health checks defined.

- `USER app` mandatory (never root). Minimal base images (alpine, distroless).
  Pin specific versions by SHA digest in production.
- `trivy image` or `snyk container test` before pushing. Multi-stage builds.
- Build secrets via `--mount=type=secret`. Never store secrets in ENV or layers.
- Generate SBOM with `trivy` or `syft` for every production image.

Performance: Order layers least→most frequently changed. Multi-stage builds reduce image size 50-90%. Enable BuildKit.

Pitfalls:

1. ❌ Separate `apt-get update` and `install` → ✅ Combine in one RUN layer: `apt-get update && apt-get install -y`.
2. ❌ Secrets in ENV or build args → ✅ Use `--mount=type=secret` for build-time secrets.
3. ❌ Running as root → ✅ `USER app` with non-root UID (e.g., 1001).
4. ❌ No health check → ✅ `HEALTHCHECK CMD curl -f http://localhost/ || exit 1`.

Validation: `hadolint` for Dockerfiles. `docker compose config` for compose files.

See [examples/docker/secure-dockerfile.md](../examples/docker/secure-dockerfile.md).
</docker_standards>
