---
applyTo: 
  - "**/*.sh"
---
<bash_standards>

## Bash

### Preamble (MANDATORY)

```bash
#!/usr/bin/env bash
# Description: Brief description
# Usage: ./script.sh [options] <required-arg>
# Requirements: curl, jq

set -euo pipefail
IFS=$'\n\t'

[[ "${DEBUG:-0}" == "1" ]] && set -x
```

### Key Rules

- Use `[[ ]]` over `[ ]` for conditionals (pattern matching, safer)
- Quote all variables: `"$var"`, `"${files[@]}"`
- Use arrays for file lists: `files=(*.txt); for f in "${files[@]}"` — never parse `ls` output
- Trap for cleanup: `trap 'rm -f "$tmpfile"' EXIT`
- Check commands: `command -v docker &>/dev/null || { echo "Error: docker required" >&2; exit 1; }`
- Idempotent operations: Check before creating (`[[ ! -d "$dir" ]] && mkdir -p "$dir"`)
- Functions: Use `local` for variables, return meaningful exit codes, send errors to stderr

### Argument Parsing

Use `while [[ $# -gt 0 ]]; case ... esac` pattern with `--help`, shift properly, validate required args after loop.

### Pitfalls

1. ❌ Unquoted variables → ✅ Always `"$var"` to prevent word splitting and glob expansion.
2. ❌ Bare `cd /dir` → ✅ `cd /dir || exit 1` or `cd /dir && rm -rf *` — always check success.
3. ❌ Parsing `ls` output → ✅ Use globs: `for f in *.txt` or `find ... -exec`.

### Testing

- BATS — `run my_function "arg"; [ "$status" -eq 0 ]`
- Static Analysis: ShellCheck

See [examples/scripting/deploy.sh](../examples/scripting/deploy.sh) and [examples/scripting/test_deploy.bats](../examples/scripting/test_deploy.bats).
</bash_standards>
