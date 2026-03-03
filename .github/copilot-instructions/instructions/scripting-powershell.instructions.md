---
applyTo: 
  - "**/*.ps1"
---
<powershell_standards>

## PowerShell

### Preamble (MANDATORY)

```powershell
<#
.SYNOPSIS
    Brief description
.PARAMETER InputPath
    Description of parameter
.EXAMPLE
    .\script.ps1 -InputPath "C:\data\input.txt"
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)]
    [ValidateScript({Test-Path $_})]
    [string]$InputPath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
```

### Key Rules

- Verb-Noun naming: `Get-UserData`, `Set-Configuration` (approved verbs only)
- `[CmdletBinding()]` on all functions for `-Verbose`, `-WhatIf` support
- Parameter validation: `[ValidateNotNullOrEmpty()]`, `[ValidateSet()]`, `[ValidateScript()]`
- Try-Catch with specific exception types, `-ErrorAction Stop` on cmdlets
- Return objects (PSCustomObject), not strings — enables piping and formatting
- Test-Path before file operations
- SupportsShouldProcess for destructive operations (`-WhatIf` / `-Confirm`)
- Cross-platform: Use `$IsWindows`/`$IsLinux`/`$IsMacOS` and `Join-Path` for paths

### Pitfalls

1. ❌ Missing `-ErrorAction Stop` → ✅ Non-terminating errors silently continue. Always add `-ErrorAction Stop`.
2. ❌ Using `==` for comparison → ✅ PowerShell uses `-eq`, `-gt`, `-like`, `-match` operators.
3. ❌ No `SupportsShouldProcess` on destructive functions → ✅ Add it to enable safe `-WhatIf` testing.

### Testing

- Pester — `Describe/It/Should` pattern
- Static Analysis: PSScriptAnalyzer

See [examples/scripting/backup.ps1](../examples/scripting/backup.ps1) and [examples/scripting/backup.Tests.ps1](../examples/scripting/backup.Tests.ps1).
</powershell_standards>
