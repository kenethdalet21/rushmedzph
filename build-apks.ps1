#!/usr/bin/env powershell
# RushMedz APK Build Script
# Builds APK files for Doctor, Driver, Merchant, and User apps

param(
    [string]$AppName = "all",
    [string]$ProfileType = "preview",
    [switch]$NoClean = $false
)

# Color output function
function Write-Log {
    param(
        [string]$Message,
        [ValidateSet("Info", "Success", "Error", "Warning")]
        [string]$Type = "Info"
    )
    
    $color = switch ($Type) {
        "Success" { "Green" }
        "Error" { "Red" }
        "Warning" { "Yellow" }
        default { "Cyan" }
    }
    
    Write-Host "[$Type] $Message" -ForegroundColor $color
}

# Base path
$BasePath = "d:\RushMedz App_Final"
$AppsTouild = @("User_Customer", "Doctor", "Driver", "Merchant")

# Validate app name
if ($AppName -ne "all") {
    if ($AppName -notmatch "user|doctor|driver|merchant") {
        Write-Log "Invalid app name: $AppName. Must be one of: user, doctor, driver, merchant, all" "Error"
        exit 1
    }
    $AppsTouild = @{
        "user" = "User_Customer"
        "doctor" = "Doctor"
        "driver" = "Driver"
        "merchant" = "Merchant"
    }[$AppName]
}

# Build function
function Build-App {
    param(
        [string]$AppType,
        [string]$AppPath,
        [string]$Profile
    )
    
    Write-Log "🔨 Building $AppType App (Profile: $Profile)..." "Info"
    
    Push-Location $AppPath
    
    try {
        # Check for required files
        Write-Log "Checking required files..." "Info"
        if (-not (Test-Path "app.json")) {
            Write-Log "❌ app.json not found" "Error"
            return $false
        }
        Write-Log "✅ app.json found" "Success"
        
        if (-not (Test-Path "eas.json")) {
            Write-Log "❌ eas.json not found" "Error"
            return $false
        }
        Write-Log "✅ eas.json found" "Success"
        
        if (-not (Test-Path "app-configs")) {
            Write-Log "⚠️  app-configs directory not found - continuing anyway" "Warning"
        } else {
            $configFile = "app-configs/app.${AppType}.json"
            if (Test-Path $configFile) {
                Write-Log "✅ Using config: $configFile" "Success"
                $env:APP_CONFIG = $configFile
            }
        }
        
        # Run the build command using EAS directly
        Write-Log "📲 Submitting to EAS cloud service..." "Info"
        Write-Log "   Command: eas build --platform android --profile ${AppType}-${Profile}" "Info"
        Write-Log "   Estimated wait: 5-10 minutes per app" "Warning"
        Write-Log "" "Info"
        
        & eas build --platform android --profile "${AppType}-${Profile}"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "" "Info"
            Write-Log "✅ $AppType app build submitted successfully!" "Success"
            Write-Log "📊 Monitor progress at: https://expo.dev/builds" "Info"
            return $true
        } else {
            Write-Log "❌ Build submission failed for $AppType app" "Error"
            Write-Log "   Exit code: $LASTEXITCODE" "Error"
            return $false
        }
    } catch {
        Write-Log "❌ Exception building $AppType app: $_" "Error"
        return $false
    } finally {
        Pop-Location
    }
}

# Main execution
Write-Log "========================================" "Info"
Write-Log "RushMedz APK Build Process Started" "Info"
Write-Log "========================================" "Info"
Write-Log "Profile: $ProfileType" "Info"
Write-Log "Apps to build: $AppsTouild" "Info"
Write-Log "========================================" "Info"
Write-Log "" "Info"

# Check if user is logged in before starting
Write-Log "Verifying EAS login..." "Warning"
$loginCheck = & eas whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Log "ERROR: Not logged into EAS" "Error"
    Write-Log "Please login first with: eas login" "Error"
    Write-Log "Then run this script again" "Error"
    exit 1
}

Write-Log "Logged in successfully" "Success"
Write-Log "" "Info"

foreach ($app in $AppsTouild) {
    $appPath = Join-Path $BasePath "RushMedz $app"
    $appType = if ($app -eq "User_Customer") { "user" } else { $app.ToLower() }
    
    if (-not (Test-Path $appPath)) {
        Write-Log "App path not found: $appPath" "Error"
        continue
    }
    
    Write-Log "========================================" "Info"
    Build-App -AppType $appType -AppPath $appPath -Profile $ProfileType
    Write-Log "========================================" "Info"
    Write-Log "" "Info"
}

Write-Log "========================================" "Success"
Write-Log "RushMedz APK Build Process Completed!" "Success"
Write-Log "========================================" "Success"
Write-Log "" "Success"
Write-Log "📱 NEXT STEPS:" "Info"
Write-Log "1. Check your builds at: https://expo.dev/builds" "Info"
Write-Log "2. Download the APK files when builds complete" "Info"
Write-Log "3. Install on your Android device with: adb install <apk-file>" "Info"
Write-Log "" "Info"
