---
applyTo: 
  - "**/k8s/**"
  - "**/kubernetes/**"
  - "**/helm/**"
---
<kubernetes_standards>

## Kubernetes

CIS Benchmark Key Controls: Pod security standards (restricted),
RBAC least privilege, network policies deny-by-default,
etcd encryption, audit logging enabled,
admission controllers (OPA/Kyverno).

- Security context: `readOnlyRootFilesystem: true`,
  `allowPrivilegeEscalation: false`, `runAsNonRoot: true`,
  `capabilities.drop: ["ALL"]`.
- Always define `requests` and `limits`. Network policies with deny-by-default. Least-privilege RBAC.
- Secrets: Sealed Secrets, External Secrets Operator, or native K8s secrets — never in Git.

Performance: Set requests from actual metrics (VPA). HPA for variable workloads.
Pod Disruption Budgets. `imagePullPolicy: IfNotPresent`.

Pitfalls:

1. ❌ No resource limits → ✅ Always set `requests` and `limits` for CPU and memory.
2. ❌ `:latest` tag in production → ✅ Use SHA digests for immutable image references.
3. ❌ Secrets in ConfigMaps → ✅ Use Kubernetes Secrets or External Secrets Operator.
4. ❌ No network policy → ✅ Deny-by-default, allowlist required traffic.
5. ❌ No PDB → ✅ Pod Disruption Budgets for all production workloads.

Validation: `kubeconform` or `kubectl --dry-run=server`, `kubectl apply --dry-run=server`.

See [examples/kubernetes/secure-deployment.md](../examples/kubernetes/secure-deployment.md).
</kubernetes_standards>
