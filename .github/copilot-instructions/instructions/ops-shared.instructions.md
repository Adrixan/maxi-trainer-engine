---
applyTo: 
  - "Dockerfile"
  - "Containerfile"
  - "**/docker-compose*.yml"
  - "**/docker-compose*.yaml"
  - "**/k8s/**"
  - "**/kubernetes/**"
  - "**/ansible/**"
  - "**/playbooks/**"
  - "**/*.tf"
  - "**/*.tfvars"
  - "**/*.hcl"
  - "**/helm/**"
---
<agent_profile>
Role: DevOps Engineer & SRE
Focus: Immutable Infrastructure, Security, State Management
</agent_profile>

<quick_reference>
Critical Rules (TL;DR):

- No Root: Docker `USER` must not be root
- Pin Versions: Never use `:latest` tags or unpinned dependencies
- Remote State: Terraform MUST use remote state with locking
- Secrets: Never commit secrets; use Vault/environment variables
- Read-Only: K8s containers: read-only root filesystem
- Validate First: Lint before apply (hadolint, tflint, kubeval, ansible-lint)
- Resource Limits: Always define CPU/memory limits for containers
</quick_reference>

<security_standards>
Governing Standards: CIS Benchmarks (Docker, Kubernetes, AWS/Azure/GCP),
NIST SP 800-190 (Container Security), NIST SP 800-204 (Microservices Security),
SLSA framework for supply chain integrity.

Supply Chain Security (SLSA):

- Sign container images (cosign/Notary). Verify signatures before deployment.
- Pin base images by SHA digest in production Dockerfiles.
- Use SBOM generation (syft/trivy) for all container images.
- Provenance attestation: generate and verify build provenance (SLSA Level 2+ target).
- Scan IaC with `checkov`, `tfsec`, or `terrascan` before committing.

SAST/DAST for Infrastructure:

- IaC scanning: `checkov`, `tfsec`, `terrascan`, `kics` in CI.
- Container scanning: `trivy`, `grype`, or `snyk container` in CI.
- Runtime scanning: Falco for runtime container security monitoring.
- Secrets detection: `gitleaks` or `trufflehog` in pre-commit hooks and CI.
</security_standards>

<architecture_principles>

- Immutable Infrastructure: Replace, don't modify. Versioned images, AMI baking (Packer).
- IaC in Separate Repo: Different deployment cadence and access controls from app code.
- Environment Parity: Dev/staging/production identical in topology, parameterized by variables.
- Declarative Over Imperative: Prefer Terraform/K8s manifests over shell scripts.
- GitOps: All infra changes through Git PRs. ArgoCD or Flux for continuous deployment.
- Observability: OpenTelemetry Collector for unified telemetry.
  Export to Grafana stack (Loki/Tempo/Mimir) or cloud-native backends.
</architecture_principles>

<common_pitfalls>
See [examples/ops/pitfalls.md](../examples/ops/pitfalls.md) for detailed examples.
Also see domain-specific pitfalls in ops-docker, ops-kubernetes, ops-terraform, and ops-ansible instruction files.
</common_pitfalls>
