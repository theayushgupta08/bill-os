# reset_db.ps1 - PowerShell shortcut to reset billOS database
param (
    [switch]$Force
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$pythonExe = Join-Path $projectRoot "ai-service\.venv\Scripts\python.exe"
$pyScript = Join-Path $scriptDir "reset_db.py"

if (-not (Test-Path $pythonExe)) {
    Write-Error "Could not find python in ai-service\.venv\Scripts\python.exe."
    exit 1
}

$argsList = @($pyScript)
if ($Force) {
    $argsList += "--force"
}

& $pythonExe @argsList
