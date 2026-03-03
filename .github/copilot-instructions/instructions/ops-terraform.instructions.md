---
applyTo: 
  - "**/*.tf"
  - "**/*.tfvars"
  - "**/*.hcl"
---
<terraform_standards>

## Terraform / OpenTofu

Cloud CIS Controls: IAM least privilege, MFA on root/admin,
encryption at rest and in transit, VPC/network segmentation,
logging to central SIEM, no public S3/storage buckets by default.

- **Terraform 1.7+** or **OpenTofu 1.7+** (open-source alternative, fully compatible)
- Remote state (S3+DynamoDB, Azure Blob, TF Cloud) with locking and encryption.
- Never commit `.tfvars` with secrets — use `TF_VAR_*` env vars or Vault. Mark sensitive outputs.
- Run `checkov`, `tfsec`, or `terrascan` before committing.
- **`import` blocks** for adopting existing infrastructure into state (replaces `terraform import` CLI).
- **`removed` blocks** for safely removing resources from state without destroying them.
- **`terraform test`** framework for module validation with `.tftest.hcl` files.

Module Structure: `main.tf`, `variables.tf`, `outputs.tf`, `versions.tf`. Split at >200 lines.

- State Isolation: Separate state files per environment (dev/stage/prod).
- Pin Everything: `required_version` and `required_providers` with version constraints.
- Protect Stateful Resources: `lifecycle { prevent_destroy = true }` on databases, storage, KMS keys.
- Prefer `for_each` over `count` for resource collections (stable on removal).
- Use `locals {}` to simplify complex expressions. Export useful values in `outputs.tf`.

Performance: `-parallelism=N` for large infra. `-target` during dev. Smaller, focused state files.

Pitfalls:

1. ❌ No `prevent_destroy` on stateful resources → ✅ Always protect databases, storage, KMS keys.
2. ❌ `count` for resource collections → ✅ `for_each` for stable identity on removal.
3. ❌ Hardcoded AMI IDs / AZs → ✅ Use `data` sources for dynamic values.
4. ❌ Modifying released state → ✅ Use `moved` blocks for refactoring, never manual state surgery.

Validation: `terraform fmt -check && terraform validate`, `tflint`.
CI Pipeline: Lint → Plan → Test → Scan → Manual Approval → Apply.
See [examples/ci/terraform-pipeline.yml](../examples/ci/terraform-pipeline.yml).
Integration Testing: `terraform test` for modules, Terratest for critical paths (networking, security groups, IAM).

See [examples/terraform/secure-config.md](../examples/terraform/secure-config.md).
</terraform_standards>
