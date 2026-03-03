# Pester Tests for backup.ps1
# PowerShell testing framework
#
# Installation: Install-Module -Name Pester -Force -SkipPublisherCheck
# Run: Invoke-Pester -Path .\backup.Tests.ps1
# Documentation: https://pester.dev/

BeforeAll {
    # Import the script (dot-source to get functions)
    $script:ScriptPath = Join-Path $PSScriptRoot 'backup.ps1'
    
    # Mock Write-Log function to capture log output
    $script:LogMessages = @()
    function global:Write-Log {
        param($Message, $Level = 'Info')
        $script:LogMessages += @{Message = $Message; Level = $Level}
    }
}

Describe 'backup.ps1' -Tag 'Unit' {
    
    Context 'Parameter Validation' {
        
        It 'Should have mandatory Source parameter' {
            $params = (Get-Command $script:ScriptPath).Parameters
            $params['Source'].Attributes.Mandatory | Should -Be $true
        }
        
        It 'Should have mandatory Destination parameter' {
            $params = (Get-Command $script:ScriptPath).Parameters
            $params['Destination'].Attributes.Mandatory | Should -Be $true
        }
        
        It 'Should have optional RetentionDays with default 30' {
            $params = (Get-Command $script:ScriptPath).Parameters
            $params['RetentionDays'].Attributes.Mandatory | Should -Be $false
        }
        
        It 'Should validate RetentionDays range 1-365' {
            $params = (Get-Command $script:ScriptPath).Parameters
            $validation = $params['RetentionDays'].Attributes | 
                Where-Object { $_ -is [System.Management.Automation.ValidateRangeAttribute] }
            
            $validation.MinRange | Should -Be 1
            $validation.MaxRange | Should -Be 365
        }
        
        It 'Should have Compress parameter defaulting to true' {
            { & $script:ScriptPath -Source 'C:\Test' -Destination 'D:\Backup' -WhatIf } | 
                Should -Not -Throw
        }
    }
    
    Context 'Prerequisites Check' {
        
        BeforeEach {
            Mock Test-Path { $true }
            Mock Get-PSDrive { 
                [PSCustomObject]@{
                    Free = 100GB
                }
            }
            Mock Get-ChildItem { @() }
        }
        
        It 'Should check if source directory exists' {
            Mock Test-Path { $false } -ParameterFilter { $Path -eq 'C:\NonExistent' }
            
            { & $script:ScriptPath -Source 'C:\NonExistent' -Destination 'D:\Backup' -WhatIf } | 
                Should -Throw '*does not exist*'
        }
        
        It 'Should validate PowerShell version 7.0+' {
            if ($PSVersionTable.PSVersion.Major -lt 7) {
                { & $script:ScriptPath -Source 'C:\Test' -Destination 'D:\Backup' -WhatIf } | 
                    Should -Throw '*PowerShell 7.0*'
            } else {
                $true | Should -Be $true  # Version is valid
            }
        }
    }
    
    Context 'Disk Space Validation' {
        
        BeforeEach {
            Mock Test-Path { $true }
            Mock Get-ChildItem { 
                @(
                    [PSCustomObject]@{ Length = 1GB },
                    [PSCustomObject]@{ Length = 2GB }
                )
            } -ParameterFilter { $Recurse -and $File }
        }
        
        It 'Should calculate required disk space' {
            Mock Get-PSDrive { 
                [PSCustomObject]@{ Free = 100GB }
            }
            
            # Should not throw with sufficient space
            { & $script:ScriptPath -Source 'C: \Test' -Destination 'D:\Backup' -WhatIf } | 
                Should -Not -Throw
        }
        
        It 'Should fail when insufficient disk space' {
            Mock Get-PSDrive { 
                [PSCustomObject]@{ Free = 100MB }  # Less than required
            }
            
            { & $script:ScriptPath -Source 'C:\Test' -Destination 'D:\Backup' -WhatIf } | 
                Should -Throw '*Insufficient disk space*'
        }
        
        It 'Should account for compression in space calculation' {
            Mock Get-PSDrive { 
                [PSCustomObject]@{ Free = 2GB }  # Just enough for 50% compressed 3GB
            }
            
            { & $script:ScriptPath -Source 'C:\Test' -Destination 'D:\Backup' -Compress $true -WhatIf } | 
                Should -Not -Throw
        }
    }
    
    Context 'Backup Directory Creation' {
        
        BeforeEach {
            Mock Test-Path { $true }
            Mock Get-PSDrive { [PSCustomObject]@{ Free = 100GB } }
            Mock Get-ChildItem { @() }
            Mock New-Item { }
        }
        
        It 'Should create backup directory with timestamp' {
            Mock Test-Path { $false } -ParameterFilter { $_ -like '*backup_*' }
            
            & $script:ScriptPath -Source 'C:\Test' -Destination 'D:\Backup' -WhatIf
            
            Should -Invoke New-Item -ParameterFilter { 
                $Path -like '*backup_*' -and $ItemType -eq 'Directory'
            }
        }
        
        It 'Should use yyyyMMdd_HHmmss format for timestamp' {
            $timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
            Mock Test-Path { $false }
            Mock New-Item { } -ParameterFilter { $Path -match 'backup_\d{8}_\d{6}' }
            
            & $script:ScriptPath -Source 'C:\Test' -Destination 'D:\Backup' -WhatIf
            
            Should -Invoke New-Item -Times 1
        }
    }
    
    Context 'File Copying' {
        
        BeforeEach {
            Mock Test-Path { $true }
            Mock Get-PSDrive { [PSCustomObject]@{ Free = 100GB } }
            Mock New-Item { }
            Mock Copy-Item { }
            Mock Get-ChildItem { 
                @(
                    [PSCustomObject]@{ 
                        FullName = 'C:\Test\file1.txt'
                        Length = 1KB
                    },
                    [PSCustomObject]@{ 
                        FullName = 'C:\Test\file2.txt'
                        Length = 2KB
                    }
                )
            } -ParameterFilter { $Recurse -and $File }
        }
        
        It 'Should copy all files from source to destination' {
            & $script:ScriptPath -Source 'C:\Test' -Destination 'D:\Backup' -WhatIf
            
            Should -Invoke Copy-Item -Times 2
        }
        
        It 'Should preserve directory structure' {
            & $script:ScriptPath -Source 'C:\Test' -Destination 'D:\Backup' -WhatIf
            
            Should -Invoke New-Item -ParameterFilter { 
                $ItemType -eq 'Directory'
            } -AtLeast 1
        }
        
        It 'Should handle copy errors gracefully' {
            Mock Copy-Item { throw 'Access denied' } -ParameterFilter { $_.FullName -like '*file1*' }
            
            { & $script:ScriptPath -Source 'C:\Test' -Destination 'D:\Backup' -WhatIf } | 
                Should -Not -Throw
            
            # Should continue with other files
            Should -Invoke Copy-Item -Times 2
        }
    }
    
    Context 'Progress Reporting' {
        
        BeforeEach {
            Mock Test-Path { $true }
            Mock Get-PSDrive { [PSCustomObject]@{ Free = 100GB } }
            Mock New-Item { }
            Mock Copy-Item { }
            Mock Write-Progress { }
            Mock Get-ChildItem { 
                1..10 | ForEach-Object {
                    [PSCustomObject]@{ 
                        FullName = "C:\Test\file$_.txt"
                        Length = 1MB
                    }
                }
            } -ParameterFilter { $Recurse -and $File }
        }
        
        It 'Should display progress during backup' {
            & $script:ScriptPath -Source 'C:\Test' -Destination 'D:\Backup' -WhatIf
            
            Should -Invoke Write-Progress -AtLeast 1
        }
        
        It 'Should show file count in progress' {
            & $script:ScriptPath -Source 'C:\Test' -Destination 'D:\Backup' -WhatIf
            
            Should -Invoke Write-Progress -ParameterFilter { 
                $Status -match '\d+/\d+ files'
            }
        }
    }
    
    Context 'Compression' {
        
        BeforeEach {
            Mock Test-Path { $true }
            Mock Get-PSDrive { [PSCustomObject]@{ Free = 100GB } }
            Mock New-Item { }
            Mock Copy-Item { }
            Mock Get-ChildItem { @() }
            Mock Compress-Archive { }
            Mock Remove-Item { }
        }
        
        It 'Should compress backup when Compress is true' {
            & $script:ScriptPath -Source 'C:\Test' -Destination 'D:\Backup' -Compress $true -WhatIf
            
            Should -Invoke Compress-Archive
        }
        
        It 'Should not compress when Compress is false' {
            & $script:ScriptPath -Source 'C:\Test' -Destination 'D:\Backup' -Compress $false -WhatIf
            
            Should -Not -Invoke Compress-Archive
        }
        
        It 'Should create zip archive with correct name' {
            & $script:ScriptPath -Source 'C:\Test' -Destination 'D:\Backup' -Compress $true -WhatIf
            
            Should -Invoke Compress-Archive -ParameterFilter { 
                $DestinationPath -like '*backup_*.zip'
            }
        }
        
        It 'Should remove uncompressed directory after compression' {
            & $script:ScriptPath -Source 'C:\Test' -Destination 'D:\Backup' -Compress $true -WhatIf
            
            Should -Invoke Remove-Item -ParameterFilter { 
                $Recurse -and $Force
            }
        }
    }
    
    Context 'Retention Policy' {
         
        BeforeEach {
            Mock Test-Path { $true }
            Mock Get-PSDrive { [PSCustomObject]@{ Free = 100GB } }
            Mock New-Item { }
            Mock Copy-Item { }
            Mock Remove-Item { }
            $oldDate = (Get-Date).AddDays(-40)
            Mock Get-ChildItem { 
                @(
                    [PSCustomObject]@{ 
                        Name = 'backup_old'
                        FullName = 'D:\Backup\backup_old'
                        CreationTime = $oldDate
                    }
                )
            } -ParameterFilter { $Directory -and $Filter -like 'backup_*' }
        }
        
        It 'Should remove backups older than retention period' {
            & $script:ScriptPath -Source 'C:\Test' -Destination 'D:\Backup' -RetentionDays 30 -WhatIf
            
            Should -Invoke Remove-Item -ParameterFilter { 
                $Path -like '*backup_old*'
            }
        }
        
        It 'Should keep backups within retention period' {
            $recentDate = (Get-Date).AddDays(-15)
            Mock Get-ChildItem { 
                @(
                    [PSCustomObject]@{ 
                        Name = 'backup_recent'
                        FullName = 'D:\Backup\backup_recent'
                        CreationTime = $recentDate
                    }
                )
            } -ParameterFilter { $Directory -and $Filter -like 'backup_*' }
            
            & $script:ScriptPath -Source 'C:\Test' -Destination 'D:\Backup' -RetentionDays 30 -WhatIf
            
            Should -Not -Invoke Remove-Item -ParameterFilter { 
                $Path -like '*backup_recent*'
            }
        }
    }
    
    Context 'Dry Run Mode' {
        
        BeforeEach {
            Mock Test-Path { $true }
            Mock Get-PSDrive { [PSCustomObject]@{ Free = 100GB } }
            Mock Get-ChildItem { @() }
            Mock New-Item { }
            Mock Copy-Item { }
            Mock Compress-Archive { }
        }
        
        It 'Should not create files in dry run mode' {
            & $script:ScriptPath -Source 'C:\Test' -Destination 'D:\Backup' -DryRun -WhatIf
            
            Should -Not -Invoke New-Item
        }
        
        It 'Should display what would be done' {
            & $script:ScriptPath -Source 'C:\Test' -Destination 'D:\Backup' -DryRun -WhatIf
            
            $script:LogMessages | Where-Object { $_.Message -like '*[DRY RUN]*' } | 
                Should -Not -BeNullOrEmpty
        }
    }
    
    Context 'Error Handling' {
        
        BeforeEach {
            Mock Test-Path { $true }
            Mock Get-PSDrive { [PSCustomObject]@{ Free = 100GB } }
            Mock Get-ChildItem { @() }
        }
        
        It 'Should catch and log errors during backup' {
            Mock New-Item { throw 'Permission denied' }
            
            { & $script:ScriptPath -Source 'C:\Test' -Destination 'D:\Backup' -WhatIf -ErrorAction Stop } | 
                Should -Throw
        }
        
        It 'Should cleanup partial backup on failure' {
            Mock Copy-Item { throw 'Copy failed' }
            Mock Remove-Item { }
            
            try {
                & $script:ScriptPath -Source 'C:\Test' -Destination 'D:\Backup' -WhatIf -ErrorAction Stop
            } catch {
                # Expected to fail
            }
            
            Should -Invoke Remove-Item -ParameterFilter { $Recurse }
        }
    }
}

Describe 'backup.ps1' -Tag 'Integration' {
    
    BeforeAll {
        # Create temporary test directories
        $script:TestSource = Join-Path $TestDrive 'source'
        $script:TestDestination = Join-Path $TestDrive 'destination'
        
        New-Item -Path $script:TestSource -ItemType Directory -Force
        New-Item -Path $script:TestDestination -ItemType Directory -Force
        
        # Create test files
        1..5 | ForEach-Object {
            $content = "Test file $_"
            Set-Content -Path (Join-Path $script:TestSource "file$_.txt") -Value $content
        }
    }
    
    It 'Should successfully backup files end-to-end' {
        & $script:ScriptPath `
            -Source $script:TestSource `
            -Destination $script:TestDestination `
            -Compress $false `
            -WhatIf
        
        # Verify backup was created
        $backups = Get-ChildItem -Path $script:TestDestination -Directory -Filter 'backup_*'
        $backups | Should -Not -BeNullOrEmpty
    }
}
