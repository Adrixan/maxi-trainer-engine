# Docker Security Best Practices - Examples

# Secure Dockerfile Examples

## Multi-Stage Build with Non-Root User

### ❌ Bad Example (Insecure)

```dockerfile
FROM node:latest

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

# Running as root!
# Using :latest tag (unpredictable, can break in production)
# Including dev dependencies in final image

CMD ["node", "server.js"]
```

**Problems:**

- Uses `:latest` tag (unpredictable, can break in production)
- Runs as root user (security risk)
- Includes all build dependencies in final image (large size, more attack surface)
- No vulnerability scanning

---

### ✅ Good Example (Secure)

```dockerfile
# Build stage
FROM node:20.11.0-alpine3.19 AS builder

# Create app user
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

WORKDIR /build

# Copy dependency files first (better layer caching)
COPY --chown=appuser:appgroup package*.json ./

# Install dependencies (including dev deps for build)
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application code
COPY --chown=appuser:appgroup . .

# Build if needed (e.g., TypeScript compilation)
# RUN npm run build

# Runtime stage
FROM node:20.11.0-alpine3.19

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user (same UID/GID as build stage)
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder --chown=appuser:appgroup /build/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /build/*.js ./
COPY --from=builder --chown=appuser:appgroup /build/package.json ./

# Switch to non-root user
USER appuser

# Use specific port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
```

**Improvements:**

- ✅ Pinned version (`20.11.0-alpine3.19`)
- ✅ Multi-stage build (smaller final image: ~50MB vs ~200MB)
- ✅ Non-root user with explicit UID/GID
- ✅ Proper signal handling with dumb-init
- ✅ Health check included
- ✅ Layer caching optimized
- ✅ Only production dependencies in final image

---

## Dockerfile for Python Application

### ✅ Best Practice Example

```dockerfile
# Build stage
FROM python:3.11.7-slim AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

# Copy requirements first for better caching
COPY requirements.txt .

# Create virtual environment and install dependencies
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir -r requirements.txt

# Runtime stage
FROM python:3.11.7-slim

# Install runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser -u 1001 appuser

WORKDIR /app

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv

# Copy application code
COPY --chown=appuser:appuser . .

# Set environment variables
ENV PATH="/opt/venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s \
  CMD python -c "import requests; requests.get('http://localhost:8000/health')" || exit 1

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "4", "app:app"]
```

---

## Handling Build Secrets Securely

### ❌ Bad Example

```dockerfile
FROM ubuntu:22.04

# NEVER DO THIS - commits secrets to layer history!
ARG GITHUB_TOKEN
RUN git clone https://$GITHUB_TOKEN@github.com/org/private-repo.git
```

### ✅ Good Example (BuildKit Secrets)

```dockerfile
# syntax=docker/dockerfile:1.4

FROM ubuntu:22.04

# Use BuildKit mount secrets
RUN --mount=type=secret,id=github_token \
    git clone https://$(cat /run/secrets/github_token)@github.com/org/private-repo.git && \
    rm -rf /run/secrets/github_token
```

**Build command:**

```bash
export GITHUB_TOKEN="your-token"
DOCKER_BUILDKIT=1 docker build --secret id=github_token,env=GITHUB_TOKEN -t myapp .
```

---

## Security Scanning

### Recommended Workflow

```bash
# Build image
docker build -t myapp:1.0.0 .

# Scan with Trivy
trivy image myapp:1.0.0

# Scan with Snyk (requires authentication)
snyk container test myapp:1.0.0

# Only push if scans pass
docker push myapp:1.0.0
```

### Example .trivyignore File

```text
# Ignore specific CVE (with justification)
CVE-2023-12345  # False positive - not applicable to our use case

# Ignore low severity for now
SEVERITY:LOW
```

---

## Layer Optimization

### ❌ Bad (Many Layers)

```dockerfile
RUN apt-get update
RUN apt-get install -y curl
RUN apt-get install -y vim
RUN apt-get clean
```

### ✅ Good (Single Layer)

```dockerfile
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        curl \
        vim \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*
```

**Why:** Reduces image size and improves build cache efficiency.

---

## ✅ Good Example: Secure Multi-Stage Python Application

```dockerfile
# Build stage
FROM python:3.11.7-slim AS builder

# Create non-root user
RUN groupadd -r app && useradd -r -g app app

# Install build dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /build

# Copy and install dependencies (layer caching optimization)
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Copy application code
COPY --chown=app:app . .

# Runtime stage
FROM python:3.11.7-slim

# Create non-root user (same UID/GID as build stage)
RUN groupadd -r app && useradd -r -g app app

# Install runtime dependencies only
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libpq5 && \
    rm -rf /var/lib/apt/lists/*

# Copy Python packages from builder
COPY --from=builder /root/.local /home/app/.local

# Set environment
ENV PATH=/home/app/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# Copy application with correct ownership
COPY --from=builder --chown=app:app /build /app

# Switch to non-root user
USER app

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')"

EXPOSE 8000

CMD ["python", "app.py"]
```

**Why this is good:**

- ✅ Pinned base image version (`3.11.7-slim`, not `latest`)
- ✅ Multi-stage build (build dependencies excluded from final image)
- ✅ Non-root user (`USER app`)
- ✅ Minimal base image (`slim` variant)
- ✅ Layer caching optimization (requirements before code)
- ✅ No package manager cache (`--no-cache-dir`, `rm -rf /var/lib/apt/lists/*`)
- ✅ Health check defined
- ✅ Immutable environment variables

---

## ❌ Bad Example: Insecure Dockerfile

```dockerfile
FROM python:latest

WORKDIR /app

COPY . .

RUN pip install -r requirements.txt

EXPOSE 8000

CMD ["python", "app.py"]
```

**Why this is bad:**

- ❌ Uses `latest` tag (unpredictable, breaks reproducibility)
- ❌ Runs as root user (security risk)
- ❌ No multi-stage build (large image size)
- ❌ Copies everything before installing deps (breaks layer caching)
- ❌ No health check
- ❌ Includes package manager cache (bloat)

---

## BuildKit Secrets Example

Using secrets securely during build without embedding them in layers:

```dockerfile
# syntax=docker/dockerfile:1.4

FROM node:20.11-alpine AS builder

WORKDIR /build

# Mount secret at build time (never stored in image)
RUN --mount=type=secret,id=npm_token \
    echo "//registry.npmjs.org/:_authToken=$(cat /run/secrets/npm_token)" > .npmrc && \
    npm install && \
    rm .npmrc

COPY . .
RUN npm run build

# Runtime stage without secrets
FROM node:20.11-alpine

RUN addgroup -S app && adduser -S app -G app

WORKDIR /app

COPY --from=builder --chown=app:app /build/dist ./dist
COPY --from=builder --chown=app:app /build/node_modules ./node_modules

USER app

CMD ["node", "dist/server.js"]
```

**Build command:**

```bash
docker build --secret id=npm_token,src=.npm_token -t myapp:latest .
```

**Key benefits:**

- Secrets never appear in image layers or history
- Can be used during builds for private registries
- Automatically cleaned up after build step

---

## Distroless Example for Maximum Security

```dockerfile
FROM golang:1.22-alpine AS builder

WORKDIR /build

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o app .

# Distroless base (no shell, no package manager)
FROM gcr.io/distroless/static-debian12:nonroot

WORKDIR /app

# Copy binary only
COPY --from=builder /build/app .

# Automatically runs as non-root (uid 65532)
USER nonroot:nonroot

EXPOSE 8080

ENTRYPOINT ["/app/app"]
```

**Advantages of distroless:**

- No shell or package manager (minimal attack surface)
- Smallest possible image size
- Pre-configured non-root user
- Only contains application and runtime dependencies
- Cannot execute arbitrary commands (prevents shell injection)

---

## Security Scanning Integration

### Trivy Scan

```bash
# Scan local image
trivy image myapp:latest

# Fail build on HIGH/CRITICAL vulnerabilities
trivy image --exit-code 1 --severity HIGH,CRITICAL myapp:latest

# Generate report
trivy image --format json --output report.json myapp:latest
```

### Snyk Scan

```bash
# Scan Dockerfile
snyk container test myapp:latest --file=Dockerfile

# Monitor for new vulnerabilities
snyk container monitor myapp:latest
```

### Integration in CI/CD

```yaml
# .github/workflows/docker-security.yml
- name: Build image
  run: docker build -t myapp:${{ github.sha }} .

- name: Run Trivy security scan
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: myapp:${{ github.sha }}
    format: 'sarif'
    output: 'trivy-results.sarif'
    severity: 'CRITICAL,HIGH'
    exit-code: '1'
```

---

## Best Practices Checklist

- [ ] Use specific version tags (not `latest`)
- [ ] Multi-stage builds to reduce final image size
- [ ] Run as non-root user
- [ ] Use minimal base images (alpine, slim, distroless)
- [ ] .dockerignore file to exclude unnecessary files
- [ ] Health checks defined
- [ ] Security scanning integrated in CI/CD
- [ ] Secrets managed via BuildKit secrets or environment variables (not in layers)
- [ ] Dependencies installed before copying application code
- [ ] Package manager caches cleaned up
