# Copy shared configuration files to all RushMedz apps
# Run this script from the RushMedz Admin directory

$sourceDir = "D:\RushMedz App_Final\RushMedz Admin\shared"
$apps = @(
    "D:\RushMedz App_Final\RushMedz Doctor",
    "D:\RushMedz App_Final\RushMedz Driver",
    "D:\RushMedz App_Final\RushMedz Merchant",
    "D:\RushMedz App_Final\RushMedz User_Customer"
)

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  RushMedz Cross-App Configuration Installer" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

foreach ($app in $apps) {
    $appName = Split-Path $app -Leaf
    Write-Host "Processing: $appName" -ForegroundColor Yellow
    
    # Check if app directory exists
    if (Test-Path $app) {
        # Create shared directory in target app if it doesn't exist
        $targetDir = Join-Path $app "shared"
        if (-not (Test-Path $targetDir)) {
            New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
            Write-Host "  Created shared directory" -ForegroundColor Green
        }
        
        # Copy all files from source shared directory
        Get-ChildItem -Path $sourceDir -File | ForEach-Object {
            $targetFile = Join-Path $targetDir $_.Name
            Copy-Item -Path $_.FullName -Destination $targetFile -Force
            Write-Host "  Copied: $($_.Name)" -ForegroundColor Green
        }
        
        # Also copy to services directory if it exists
        $servicesDir = Join-Path $app "services"
        if (Test-Path $servicesDir) {
            Get-ChildItem -Path $sourceDir -File | ForEach-Object {
                $targetFile = Join-Path $servicesDir $_.Name
                Copy-Item -Path $_.FullName -Destination $targetFile -Force
                Write-Host "  Copied to services: $($_.Name)" -ForegroundColor Green
            }
        }
        
        Write-Host "  Done!" -ForegroundColor Green
    } else {
        Write-Host "  Directory not found: $app" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Installation Complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Import the shared modules in each app's entry point"
Write-Host "2. Initialize the event bus with the correct app type"
Write-Host "3. Set up environment variables for API URLs"
Write-Host ""
Write-Host "See CROSS_APP_LINKING_GUIDE.md for detailed instructions"
