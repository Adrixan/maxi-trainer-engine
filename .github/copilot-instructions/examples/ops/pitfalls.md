# Common DevOps Pitfalls and Solutions

A comprehensive guide to frequent mistakes in DevOps practices and how to avoid them.

---

## Docker Pitfalls

### 1. Running Containers as Root

#### ❌ Problem

```dockerfile
FROM ubuntu:22.04
# No USER specified - runs as root by default
CMD ["/app/server"]
```

#### ✅ Solution

```dockerfile
FROM ubuntu:22.04

RUN groupadd -r appuser && useradd -r -g appuser -u 1001 appuser
USER appuser

CMD ["/app/server"]
```

**Why it matters:** Root containers can escape to host, access sensitive files, and compromise cluster security.

---

### 2. Using :latest Tags

#### ❌ Problem

```yaml
# Kubernetes deployment
spec:
  containers:
  - name: app
    image: myapp:latest
```

**Issues:**

- Unpredictable behavior (latest changes over time)
- Rollback is impossible (what was "latest" last week?)
- Cache invalidation issues
- Security vulnerabilities may be introduced silently

#### ✅ Solution

```yaml
spec:
  containers:
  - name: app
    image: myapp:1.2.3@sha256:abc123def456...
    imagePullPolicy: IfNotPresent
```

---

### 3. Poor Layer Caching

#### ❌ Problem

```dockerfile
FROM node:20

WORKDIR /app

# Copies everything first
COPY . .

# Install deps after code copy
RUN npm install

CMD ["node", "server.js"]
```

**Issue:** Any code change invalidates npm install cache.

#### ✅ Solution

```dockerfile
FROM node:20

WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies (cached unless package.json changes)
RUN npm ci --only=production

# Copy code last
COPY . .

CMD ["node", "server.js"]
```

---

## Terraform Pitfalls

### 1. Local State in Team Environment

#### ❌ Problem

```hcl
# No backend configuration
terraform {
  required_version = ">= 1.5.0"
}
```

**Issues:**

- State conflicts when multiple people apply
- No state locking
- State loss if developer's machine fails
- No audit trail

#### ✅ Solution

```hcl
terraform {
  required_version = ">= 1.5.0"
  
  backend "s3" {
    bucket         = "company-terraform-state"
    key            = "prod/main.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}
```

---

### 2. Using count Instead of for_each

#### ❌ Problem

```hcl
variable "users" {
  default = ["alice", "bob", "charlie"]
}

resource "aws_iam_user" "users" {
  count = length(var.users)
  name  = var.users[count.index]
}
```

**Issue:** Removing "bob" destroys and recreates "charlie" (index shift).

```text
Plan:
  - aws_iam_user.users[1] (bob) -> destroy
  - aws_iam_user.users[2] (charlie) -> destroy
  + aws_iam_user.users[1] (charlie) -> create
```

#### ✅ Solution

```hcl
variable "users" {
  default = toset(["alice", "bob", "charlie"])
}

resource "aws_iam_user" "users" {
  for_each = var.users
  name     = each.value
}
```

Now removing "bob" only affects that one resource:

```text
Plan:
  - aws_iam_user.users["bob"] -> destroy
```

---

### 3. Hardcoding Values Instead of Data Sources

#### ❌ Problem

```hcl
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"  # Outdated, region-specific
  instance_type = "t3.micro"
  subnet_id     = "subnet-abc123"  # Hardcoded
}
```

#### ✅ Solution

```hcl
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]
  
  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

data "aws_subnets" "private" {
  filter {
    name   = "tag:Tier"
    values = ["Private"]
  }
}

resource "aws_instance" "web" {
  ami           = data.aws_ami.amazon_linux.id
  instance_type = "t3.micro"
  subnet_id     = data.aws_subnets.private.ids[0]
}
```

---

### 4. Not Protecting Stateful Resources

#### ❌ Problem

```hcl
resource "aws_db_instance" "production" {
  identifier = "prod-db"
  engine     = "postgres"
  # ... more config
}

# Someone runs: terraform destroy -target aws_db_instance.production
# Data GONE!
```

#### ✅ Solution

```hcl
resource "aws_db_instance" "production" {
  identifier          = "prod-db"
  engine             = "postgres"
  deletion_protection = true  # AWS-level protection
  
  lifecycle {
    prevent_destroy = true  # Terraform-level protection
  }
}
```

---

## Kubernetes Pitfalls

### 1. No Resource Limits

#### ❌ Problem

```yaml
spec:
  containers:
  - name: app
    image: myapp:1.0.0
    # No resources defined
```

**Issues:**

- Pod can consume all node resources → node crash
- No fair scheduling
- OOMKilled without clear cause

#### ✅ Solution

```yaml
spec:
  containers:
  - name: app
    image: myapp:1.0.0
    resources:
      requests:  # What scheduler uses for placement
        memory: "128Mi"
        cpu: "100m"
      limits:    # Hard limits
        memory: "256Mi"
        cpu: "500m"
```

**How to determine values:**

```bash
# Check actual usage
kubectl top pod <pod-name>

# Use Vertical Pod Autoscaler recommendations
kubectl describe vpa <vpa-name>
```

---

### 2. Secrets in ConfigMaps

#### ❌ Problem

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  DATABASE_URL: "postgresql://user:password@db:5432/prod"
  API_KEY: "sk-abc123def456"
```

**Issues:**

- Secrets visible in plain text
- Can be read by anyone with ConfigMap read access
- Exposed in `kubectl describe`

#### ✅ Solution (Minimum)

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
stringData:  # or data: with base64
  DATABASE_URL: "postgresql://user:password@db:5432/prod"
  API_KEY: "sk-abc123def456"
```

#### ✅ Better Solution (Sealed Secrets / External Secrets)

See [kubernetes/secure-deployment.md](../kubernetes/secure-deployment.md#secrets-management)

---

### 3. Missing Health Checks

#### ❌ Problem

```yaml
spec:
  containers:
  - name: app
    image: myapp:1.0.0
    # No probes
```

**Issues:**

- Kubernetes sends traffic to pods before they're ready
- Crashing pods aren't restarted promptly
- Rolling deployments may break traffic

#### ✅ Solution

```yaml
spec:
  containers:
  - name: app
    image: myapp:1.0.0
    
    # Checks if container should be restarted
    livenessProbe:
      httpGet:
        path: /healthz
        port: 8080
      initialDelaySeconds: 10
      periodSeconds: 10
      failureThreshold: 3
    
    # Checks if container should receive traffic
    readinessProbe:
      httpGet:
        path: /ready
        port: 8080
      initialDelaySeconds: 5
      periodSeconds: 5
      failureThreshold: 2
    
    # Checks if container started successfully (K8s 1.18+)
    startupProbe:
      httpGet:
        path: /healthz
        port: 8080
      failureThreshold: 30
      periodSeconds: 10
```

---

## Ansible Pitfalls

### 1. Non-Idempotent Tasks

#### ❌ Problem

```yaml
- name: Add line to config
  shell: echo "export PATH=$PATH:/opt/bin" >> ~/.bashrc
```

**Issue:** Running twice adds duplicate lines.

#### ✅ Solution

```yaml
- name: Add /opt/bin to PATH
  lineinfile:
    path: ~/.bashrc
    line: 'export PATH=$PATH:/opt/bin'
    create: yes
```

---

### 2. Secrets in Plain Text

#### ❌ Problem

```yaml
# In playbook.yml (committed to Git!)
- name: Create user
  mysql_user:
    name: admin
    password: "SuperSecret123!"
```

#### ✅ Solution

```yaml
# In playbook.yml
- name: Create user
  mysql_user:
    name: admin
    password: "{{ vault_mysql_password }}"
  no_log: true

# In vault.yml (encrypted with ansible-vault)
vault_mysql_password: !vault |
  $ANSIBLE_VAULT;1.1;AES256
  66386439653765386461316465353839...
```

**Encrypt:**

```bash
ansible-vault encrypt_string 'SuperSecret123!' --name 'vault_mysql_password'
```

---

### 3. Using shell When Module Exists

#### ❌ Problem

```yaml
- name: Install package
  shell: apt-get install -y nginx
  
- name: Copy file
  shell: cp /tmp/config /etc/myapp/config
```

**Issues:**

- Not idempotent
- No error handling
- Platform-specific

#### ✅ Solution

```yaml
- name: Install package
  apt:
    name: nginx
    state: present
    update_cache: yes

- name: Copy file
  copy:
    src: /tmp/config
    dest: /etc/myapp/config
    mode: '0644'
```

---

## CI/CD Pitfalls

### 1. Building on Main Branch Only

#### ❌ Problem

```yaml
name: Build
on:
  push:
    branches: [main]
```

**Issue:** Bugs discovered after merge, breaking main.

#### ✅ Solution

```yaml
name: Build and Test
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run tests
        run: npm test
      
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Trivy scan
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
```

---

### 2. Not Pinning CI Tool Versions

#### ❌ Problem

```yaml
- uses: actions/checkout@v3  # Major version only
- uses: docker/build-push-action@latest  # Even worse!
```

**Issue:** Workflow breaks when action updates.

#### ✅ Solution

```yaml
- uses: actions/checkout@v4.1.1
- uses: docker/build-push-action@v5.1.0
```

Or with commit SHA (most secure):

```yaml
- uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11  # v4.1.1
```

---

## Monitoring and Observability Pitfalls

### 1. No Logging Strategy

#### ❌ Problem

- Logs only in container stdout (lost when pod dies)
- No centralized logging
- No retention policy

#### ✅ Solution

- **Structured logging:** Use JSON format
- **Centralized aggregation:** ELK, Loki, CloudWatch
- **Retention:** 30-90 days for production
- **Log levels:** DEBUG (dev), INFO (prod), ERROR (alerts)

**Example structured logging:**

```python
import logging
import json_logging

json_logging.init_non_web(enable_json=True)
logger = logging.getLogger("app")

logger.info("User logged in", extra={"user_id": user.id, "ip": request.ip})
```

---

### 2. No Metrics/Alerting

#### ❌ Problem

- Only discovering issues when users complain
- No visibility into resource usage
- No SLO tracking

#### ✅ Solution

```yaml
# Service Monitor (Prometheus)
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: webapp-metrics
spec:
  selector:
    matchLabels:
      app: webapp
  endpoints:
  - port: metrics
    path: /metrics
    interval: 30s
```

**Key metrics to track:**

- Request rate, latency, error rate (RED method)
- CPU, memory, disk, network (USE method)
- Business metrics (signups, orders, etc.)

---

## Summary Checklist

### Docker

- [ ] Non-root user (USER directive)
- [ ] Pinned versions (no :latest)
- [ ] Multi-stage builds
- [ ] Security scanning (Trivy/Snyk)
- [ ] Health checks

### Terraform

- [ ] Remote state with locking
- [ ] Secrets via environment/Vault (not .tfvars)
- [ ] for_each instead of count
- [ ] Data sources for dynamic values
- [ ] prevent_destroy for stateful resources

### Kubernetes

- [ ] Resource limits and requests
- [ ] Secrets (not ConfigMaps)
- [ ] Health checks (liveness + readiness)
- [ ] Non-root containers
- [ ] Network policies

### Ansible

- [ ] Idempotent tasks
- [ ] Ansible Vault for secrets
- [ ] Native modules over shell
- [ ] --check before apply

### CI/CD

- [ ] Run on PRs (not just main)
- [ ] Pin action versions
- [ ] Security scanning
- [ ] Automated testing
