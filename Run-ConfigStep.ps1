param(
    [Parameter(Mandatory = $true)]
    [string]$Step,

    [Parameter(Mandatory = $false)]
    [string]$OrigDir,

    [Parameter(Mandatory = $false)]
    [string]$login_name,

    [Parameter(Mandatory = $false)]
    [string]$AmlFile
)


# Restore original working directory if passed
if ($OrigDir) {
    Set-Location $OrigDir
    # unblock DLL files ConsoleUpgrade, we trust Aras
    $dlls = @(
    "$OrigDir\tools\ConsoleUpgrade\IOM.dll",
    "$OrigDir\tools\ConsoleUpgrade\Libs.dll"
    )
    foreach ($dll in $dlls) {
        if (Test-Path "$file:Zone.Identifier") {
            Write-Host "Unblocking $file"
            Unblock-File $file
        }
    }
}

# === Logging ===
$log = if ($OrigDir) {
    Join-Path $OrigDir "RunConfigStep.log"
} else {
    "$env:TEMP\RunConfigStep.log"
}


# === Check if running as Administrator ===
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# === Elevate if needed ===
if ($Step -eq "1" -and -not (Test-Administrator)) {
    Write-Host "Elevation required for Step 1. Relaunching with Administrator privileges..."

    $scriptPath = $MyInvocation.MyCommand.Path
    $origDir = (Get-Location).Path

    $argString = "-ExecutionPolicy Bypass -File `"$scriptPath`" -Step $Step -OrigDir `"$origDir`""

    Start-Process powershell -ArgumentList $argString -WorkingDirectory $origDir -Verb RunAs -Wait

    "[$(Get-Date)] Relaunched elevated. Step=$Step. OrigDir=$origDir" | Out-File -Append $log
    exit
}

# === Log current working dir ===
"[$(Get-Date)] Running in $(Get-Location)" | Out-File -Append $log

# === Load Module ===
$repos_folder = Resolve-Path '..'
$module_location = Join-Path $repos_folder.Path 'InnovConfigCE/InnovConfig/InnovConfig.psm1'
if (Get-Module InnovConfigCE) { Remove-Module -Name InnovConfigCE -Force }
Import-Module $module_location

# === Read Config ===
Read-MasterConfig .\Master_Config.xml

# === Execute Requested Step ===
switch ($Step) {
    "1" {
        Write-Host -ForegroundColor Cyan "Database will be overwritten"
        Connect-Innov 'root'
        Restore-Database
        Import-Packages
    }
    "2" {
        Export-ConfigReport
    }
    "3" {
        Connect-Innov 'root'
        Export-Changes
    }
        '4' {
        Write-Host "Executing Step 4: Submit AML file $AmlFile"
        
        if (-not (Test-Path $AmlFile)) {
            Write-Error "AML file not found: $AmlFile"
            exit 1
        }
        # Read the AML XML from the specified file
        $amlXml = Get-Content -Path $AmlFile -Raw
        # Send AML via the existing function in InnovConfig.psm1
        Write-Host "Login and send AML ..."
        $res = Get-AMLResult -login_name $login_name -aml $amlXml
        
        $outputFile = [System.IO.Path]::ChangeExtension($AmlFile, '.result.xml')
        $res | Out-File -FilePath $outputFile -Encoding utf8
        Write-Host "Result saved to $outputFile"
    }
    default {
        Write-Host "Invalid or missing step. Use 1 to 4."
    }
}
Pause
