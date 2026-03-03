---
applyTo: 
  - "**/*.sh"
  - "**/*.ps1"
---
<agent_profile>
Role: Automation Specialist
Focus: Cross-platform compatibility, Error Handling, Idempotency
</agent_profile>

<quick_reference>
Critical Rules (TL;DR):

- Error Handling: Check exit codes, provide meaningful errors to stderr
- Idempotency: Safe to run multiple times without side effects
- Logging: stderr for errors/diagnostics, stdout for output
- Documentation: Header comment with description, usage, and requirements
</quick_reference>

<security_standards>
Governing Standards: CWE/SANS Top 25 (relevant entries), CIS Benchmarks (OS hardening scripts).

Key Risks:

- CWE-78 OS Command Injection: Never pass unsanitized input to `eval`,
  `bash -c`, `Invoke-Expression`.
  Use arrays for command construction, not string interpolation.
- CWE-22 Path Traversal: Validate and canonicalize all file paths. Reject `..` sequences.
- CWE-377 Insecure Temp Files: Use `mktemp` (Bash) or
  `[System.IO.Path]::GetTempFileName()` (PowerShell). Clean up via trap/finally.
- CWE-269 Privilege Escalation: Document why elevated privileges are needed.
  Use `sudo` only for specific commands, drop privileges ASAP.
- CWE-312 Cleartext Storage: Never store secrets in script variables that get logged.
  Use `read -rs` / `Get-Credential`.

Checklist:

1. Validate all arguments. Allowlist, don't blocklist.
2. No `eval`/`Invoke-Expression`. If unavoidable, validate against strict allowlist.
3. Restrictive file permissions (`umask 077` / `icacls`).
4. Accept secrets via environment variables or stdin, never as CLI arguments (visible in `ps`).
5. Never log sensitive values. Redact credentials in error messages.
6. SAST: ShellCheck for Bash, PSScriptAnalyzer for PowerShell — run in CI.
</security_standards>

<validation_checklist>

- [ ] Strict mode enabled
- [ ] Variables quoted / parameters validated
- [ ] Exit codes checked / errors handled
- [ ] Help/usage function exists
- [ ] Script is idempotent
- [ ] Errors go to stderr
- [ ] Static analysis passes (ShellCheck / PSScriptAnalyzer)
</validation_checklist>

<examples>
- Bash: [examples/scripting/deploy.sh](../examples/scripting/deploy.sh) +
  [examples/scripting/test_deploy.bats](../examples/scripting/test_deploy.bats)
- PowerShell: [examples/scripting/backup.ps1](../examples/scripting/backup.ps1) +
  [examples/scripting/backup.Tests.ps1](../examples/scripting/backup.Tests.ps1)
</examples>
