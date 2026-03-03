<#
.SYNOPSIS
    Example PowerShell backup script with best practices.

.DESCRIPTION
    Demonstrates:
    - Proper error handling with ErrorAction
    - Parameter validation
    - Logging
    - Idempotency
    - Progress reporting
    - Rollback capabilities

.PARAMETER Source
    Source directory to backup (mandatory)

.PARAMETER Destination
    Destination directory for backups (mandatory)

.PARAMETER RetentionDays
    Number of days to retain backups (default: 30)

.PARAMETER Compress
    Whether to compress the backup (default: true)

.PARAMETER DryRun
    Perform a dry run without making changes

.EXAMPLE
    .\backup.ps1 -Source "C:\Data" -Destination "D:\Backups"

.EXAMPLE
    .\backup.ps1 -Source "C:\Data" -Destination "D:\Backups" -RetentionDays 7 -DryRun

.NOTES
    Author: DevOps Team
    Version: 1.0.0
    Requires: PowerShell 7.0+
#>

#Requires -Version 7.0

[CmdletBinding(SupportsShouldProcess)]
param(
    [Parameter(Mandatory = $true, HelpMessage = "Source directory to backup")]
    [ValidateScript({ Test-Path $_ -PathType Container })]
    [string]$Source,

    [Parameter(Mandatory = $true, HelpMessage = "Destination for backups")]
    [string]$Destination,

    [Parameter(HelpMessage = "Number of days to retain backups")]
    [ValidateRange(1, 365)]
    [int]$RetentionDays = 30,

    [Parameter(HelpMessage = "Compress backup")]
    [bool]$Compress = $true,

    [Parameter(HelpMessage = "Perform dry run")]
    [switch]$DryRun
)

# Strict mode for better error detection
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

#region Configuration

$script:Config = @{
    LogFile          = Join-Path $PSScriptRoot "backup_$(Get-Date -Format 'yyyyMMdd').log"
    BackupDateFormat = 'yyyyMMdd_HHmmss'
    MaxParallelJobs  = 4
    ChunkSizeMB      = 100
}

#endregion

#region Logging Functions

function Write-Log {
    <#
    .SYNOPSIS
        Write message to log file and console
    #>
    param(
        [Parameter(Mandatory)]
        [string]$Message,

        [ValidateSet('Info', 'Warning', 'Error', 'Success')]
        [string]$Level = 'Info'
    )

    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $logMessage = "[$timestamp] [$Level] $Message"

    # Console output with colors
    $color = switch ($Level) {
        'Info' { 'White' }
        'Warning' { 'Yellow' }
        'Error' { 'Red' }
        'Success' { 'Green' }
    }

    Write-Host $logMessage -ForegroundColor $color

    # File output
    try {
        Add-Content -Path $script:Config.LogFile -Value $logMessage -ErrorAction Stop
    }
    catch {
        Write-Warning "Failed to write to log file: $_"
    }
}

#endregion

#region Validation Functions

function Test-Prerequisites {
    <#
    .SYNOPSIS
        Verify all prerequisites are met
    #>
    Write-Log "Checking prerequisites..."

    # Check PowerShell version
    if ($PSVersionTable.PSVersion.Major -lt 7) {
        throw "PowerShell 7.0 or higher is required"
    }

    # Check source exists
    if (-not (Test-Path $Source)) {
        throw "Source directory does not exist: $Source"
    }

    # Check destination parent exists
    $destParent = Split-Path $Destination -Parent
    if ($destParent -and -not (Test-Path $destParent)) {
        throw "Destination parent directory does not exist: $destParent"
    }

    # Check available disk space
    $sourceSize = Get-ChildItem $Source -Recurse -File |
        Measure-Object -Property Length -Sum |
        Select-Object -ExpandProperty Sum

    $destDrive = (Get-Item $Destination -ErrorAction SilentlyContinue).Root.Name
    if (-not $destDrive) {
        $destDrive = (Split-Path $Destination -Qualifier)
    }

    $freeSpace = (Get-PSDrive $destDrive[0]).Free

    if ($Compress) {
        $requiredSpace = $sourceSize * 0.5  # Assume 50% compression
    }
    else {
        $requiredSpace = $sourceSize
    }

    if ($freeSpace -lt $requiredSpace) {
        $freeSpaceGB = [math]::Round($freeSpace / 1GB, 2)
        $requiredSpaceGB = [math]::Round($requiredSpace / 1GB, 2)
        throw "Insufficient disk space. Available: ${freeSpaceGB}GB, Required: ${requiredSpaceGB}GB"
    }

    Write-Log "Prerequisites check passed" -Level Success
}

#endregion

#region Backup Functions

function New-BackupDirectory {
    <#
    .SYNOPSIS
        Create backup directory with timestamp
    #>
    $timestamp = Get-Date -Format $script:Config.BackupDateFormat
    $backupDir = Join-Path $Destination "backup_$timestamp"

    if ($DryRun) {
        Write-Log "[DRY RUN] Would create directory: $backupDir"
        return $backupDir
    }

    if (-not (Test-Path $backupDir)) {
        try {
            New-Item -Path $backupDir -ItemType Directory -Force | Out-Null
            Write-Log "Created backup directory: $backupDir" -Level Success
        }
        catch {
            Write-Log "Failed to create backup directory: $_" -Level Error
            throw
        }
    }

    return $backupDir
}

function Copy-FilesWithProgress {
    <#
    .SYNOPSIS
        Copy files with progress reporting
    #>
    param(
        [string]$SourcePath,
        [string]$DestinationPath
    )

    Write-Log "Copying files from $SourcePath to $DestinationPath..."

    $files = Get-ChildItem $SourcePath -Recurse -File
    $totalFiles = $files.Count
    $totalSize = ($files | Measure-Object -Property Length -Sum).Sum
    $copiedFiles = 0
    $copiedSize = 0

    Write-Log "Found $totalFiles files ($(Format-FileSize $totalSize))"

    foreach ($file in $files) {
        $relativePath = $file.FullName.Substring($SourcePath.Length)
        $targetPath = Join-Path $DestinationPath $relativePath
        $targetDir = Split-Path $targetPath -Parent

        # Create directory if needed
        if (-not (Test-Path $targetDir)) {
            if (-not $DryRun) {
                New-Item -Path $targetDir -ItemType Directory -Force | Out-Null
            }
        }

        # Copy file
        if ($DryRun) {
            # Just simulate
            $copiedFiles++
            $copiedSize += $file.Length
        }
        else {
            try {
                Copy-Item -Path $file.FullName -Destination $targetPath -Force
                $copiedFiles++
                $copiedSize += $file.Length
            }
            catch {
                Write-Log "Failed to copy $($file.FullName): $_" -Level Warning
                continue
            }
        }

        # Progress reporting
        $percentComplete = [math]::Round(($copiedFiles / $totalFiles) * 100, 2)
        $status = "Copied $copiedFiles/$totalFiles files ($(Format-FileSize $copiedSize) / $(Format-FileSize $totalSize))"

        Write-Progress -Activity "Backing up files" -Status $status -PercentComplete $percentComplete
    }

    Write-Progress -Activity "Backing up files" -Completed

    Write-Log "Copied $copiedFiles files successfully" -Level Success
}

function Compress-Backup {
    <#
    .SYNOPSIS
        Compress backup directory
    #>
    param(
        [string]$BackupPath
    )

    Write-Log "Compressing backup..."

    $archivePath = "$BackupPath.zip"

    if ($DryRun) {
        Write-Log "[DRY RUN] Would compress to: $archivePath"
        return $archivePath
    }

    try {
        Compress-Archive -Path "$BackupPath\*" -DestinationPath $archivePath -CompressionLevel Optimal -Force

        # Verify archive
        $archive = [System.IO.Compression.ZipFile]::OpenRead($archivePath)
        $entryCount = $archive.Entries.Count
        $archive.Dispose()

        Write-Log "Created archive with $entryCount entries" -Level Success

        # Remove uncompressed backup
        Remove-Item -Path $BackupPath -Recurse -Force
        Write-Log "Removed uncompressed backup directory"

        return $archivePath
    }
    catch {
        Write-Log "Failed to compress backup: $_" -Level Error
        throw
    }
}

function Remove-OldBackups {
    <#
    .SYNOPSIS
        Remove backups older than retention period
    #>
    Write-Log "Removing backups older than $RetentionDays days..."

    $cutoffDate = (Get-Date).AddDays(-$RetentionDays)

    $oldBackups = Get-ChildItem $Destination -Directory -Filter "backup_*" |
        Where-Object { $_.CreationTime -lt $cutoffDate }

    $oldArchives = Get-ChildItem $Destination -File -Filter "backup_*.zip" |
        Where-Object { $_.CreationTime -lt $cutoffDate }

    $itemsToRemove = $oldBackups + $oldArchives

    if ($itemsToRemove.Count -eq 0) {
        Write-Log "No old backups to remove"
        return
    }

    Write-Log "Found $($itemsToRemove.Count) old backup(s) to remove"

    foreach ($item in $itemsToRemove) {
        if ($DryRun) {
            Write-Log "[DRY RUN] Would remove: $($item.FullName)"
        }
        else {
            try {
                Remove-Item -Path $item.FullName -Recurse -Force
                Write-Log "Removed old backup: $($item.Name)"
            }
            catch {
                Write-Log "Failed to remove $($item.Name): $_" -Level Warning
            }
        }
    }

    Write-Log "Cleanup completed" -Level Success
}

function Test-BackupIntegrity {
    <#
    .SYNOPSIS
        Verify backup integrity
    #>
    param(
        [string]$BackupPath
    )

    Write-Log "Verifying backup integrity..."

    if ($BackupPath.EndsWith('.zip')) {
        # Verify ZIP archive
        try {
            $archive = [System.IO.Compression.ZipFile]::OpenRead($BackupPath)
            $entryCount = $archive.Entries.Count
            $archive.Dispose()

            Write-Log "Archive contains $entryCount entries" -Level Success
            return $true
        }
        catch {
            Write-Log "Archive integrity check failed: $_" -Level Error
            return $false
        }
    }
    else {
        # Verify directory
        $sourceFileCount = (Get-ChildItem $Source -Recurse -File).Count
        $backupFileCount = (Get-ChildItem $BackupPath -Recurse -File).Count

        if ($sourceFileCount -eq $backupFileCount) {
            Write-Log "File count matched: $sourceFileCount files" -Level Success
            return $true
        }
        else {
            Write-Log "File count mismatch! Source: $sourceFileCount, Backup: $backupFileCount" -Level Error
            return $false
        }
    }
}

#endregion

#region Helper Functions

function Format-FileSize {
    <#
    .SYNOPSIS
        Format bytes to human-readable size
    #>
    param([long]$Size)

    $units = @('B', 'KB', 'MB', 'GB', 'TB')
    $unitIndex = 0

    while ($Size -ge 1024 -and $unitIndex -lt $units.Count - 1) {
        $Size = $Size / 1024
        $unitIndex++
    }

    return "{0:N2} {1}" -f $Size, $units[$unitIndex]
}

function Get-BackupSummary {
    <#
    .SYNOPSIS
        Generate backup summary report
    #>
    param(
        [string]$BackupPath,
        [DateTime]$StartTime,
        [DateTime]$EndTime
    )

    $duration = $EndTime - $StartTime
    $backupSize = if (Test-Path $BackupPath) {
        if ($BackupPath.EndsWith('.zip')) {
            (Get-Item $BackupPath).Length
        }
        else {
            (Get-ChildItem $BackupPath -Recurse -File | Measure-Object -Property Length -Sum).Sum
        }
    }
    else {
        0
    }

    $summary = @"

========================================
Backup Summary
========================================
Source:       $Source
Destination:  $BackupPath
Start Time:   $($StartTime.ToString('yyyy-MM-dd HH:mm:ss'))
End Time:     $($EndTime.ToString('yyyy-MM-dd HH:mm:ss'))
Duration:     $($duration.ToString('hh\:mm\:ss'))
Backup Size:  $(Format-FileSize $backupSize)
Compressed:   $Compress
Dry Run:      $DryRun
========================================
"@

    Write-Log $summary -Level Info
}

#endregion

#region Main Execution

function Invoke-Backup {
    <#
    .SYNOPSIS
        Main backup execution function
    #>
    $startTime = Get-Date

    try {
        Write-Log "========================================" -Level Info
        Write-Log "Starting backup process" -Level Info
        Write-Log "========================================" -Level Info

        if ($DryRun) {
            Write-Log "DRY RUN MODE - No changes will be made" -Level Warning
        }

        # Validate prerequisites
        Test-Prerequisites

        # Create backup directory
        $backupPath = New-BackupDirectory

        # Copy files
        Copy-FilesWithProgress -SourcePath $Source -DestinationPath $backupPath

        # Compress if requested
        if ($Compress) {
            $backupPath = Compress-Backup -BackupPath $backupPath
        }

        # Verify integrity
        if (-not $DryRun) {
            $isValid = Test-BackupIntegrity -BackupPath $backupPath
            if (-not $isValid) {
                throw "Backup integrity verification failed"
            }
        }

        # Cleanup old backups
        Remove-OldBackups

        # Generate summary
        $endTime = Get-Date
        Get-BackupSummary -BackupPath $backupPath -StartTime $startTime -EndTime $endTime

        Write-Log "========================================" -Level Success
        Write-Log "Backup completed successfully! 🎉" -Level Success
        Write-Log "========================================" -Level Success

        exit 0
    }
    catch {
        Write-Log "Backup failed: $_" -Level Error
        Write-Log "Stack trace: $($_.ScriptStackTrace)" -Level Error

        # Cleanup partial backup on failure
        if ($backupPath -and (Test-Path $backupPath) -and -not $DryRun) {
            Write-Log "Cleaning up partial backup..." -Level Warning
            Remove-Item -Path $backupPath -Recurse -Force -ErrorAction SilentlyContinue
        }

        exit 1
    }
}

# Execute backup
Invoke-Backup

#endregion
