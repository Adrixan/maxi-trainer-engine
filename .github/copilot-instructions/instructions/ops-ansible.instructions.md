---
applyTo: 
  - "**/ansible/**"
  - "**/playbooks/**"
---
<ansible_standards>

## Ansible

- All playbooks must be idempotent. Ansible Vault for sensitive variables. `become: yes` with documented justification.
- `--check --diff` before production runs.

Performance: `gather_facts: no` when unneeded. SSH pipelining for 2-5x speedup. Tune `forks`.

Pitfalls:

1. ❌ `shell`/`command` without `creates`/`changed_when` → ✅ Use native modules (apt, copy, template) for idempotency.
2. ❌ Undocumented `become: yes` → ✅ Comment why privilege escalation is needed on every task.
3. ❌ Secrets in plaintext vars → ✅ Use Ansible Vault or external secrets lookup.
4. ❌ No `--check` before apply → ✅ Always dry-run with `--check --diff` in CI.

Validation: `ansible-lint`, `ansible-playbook --check --diff`, `molecule` for role testing.

See [examples/ansible/secure-playbook.md](../examples/ansible/secure-playbook.md).
</ansible_standards>
