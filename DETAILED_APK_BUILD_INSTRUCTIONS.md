# RushMedz APK Build - Step-by-Step Guide

## Quick Start (5 minutes)

### Step 1: Install Required Tools
```powershell
# Install Node.js (if not already installed)
# Download from https://nodejs.org

# Install EAS CLI globally
npm install -g eas-cli

# Verify installation
eas --version
```

### Step 2: Create Expo Account
1. Visit https://expo.dev
2. Sign up with email
3. Verify email
4. Login locally:
   ```powershell
   eas login
   ```
   Enter your email and password

### Step 3: Build Each App

Navigate to each app directory and run:

```powershell
# User App
cd "d:\RushMedz App_Final\RushMedz User_Customer"
$env:APP_CONFIG="./app-configs/app.user.json"
eas build --platform android --profile user-preview

# Doctor App
cd "..\RushMedz Doctor"
$env:APP_CONFIG="./app-configs/app.doctor.json"
eas build --platform android --profile doctor-preview

# Driver App
cd "..\RushMedz Driver"
$env:APP_CONFIG="./app-configs/app.driver.json"
eas build --platform android --profile driver-preview

# Merchant App
cd "..\RushMedz Merchant"
$env:APP_CONFIG="./app-configs/app.merchant.json"
eas build --platform android --profile merchant-preview
```

### Step 4: Download APK Files
After each build completes, you'll see a download link:
```
✓ Build ID: xxxxxxxxxxxxxxxx
✓ Download: https://expo.dev/builds/...
```

Click the link or use the EAS dashboard to download the APK files.

### Step 5: Install on Device
```powershell
# Connect Android device via USB
adb devices

# Install each APK
adb install "C:\path\to\rushmedz-user.apk"
adb install "C:\path\to\rushmedz-doctor.apk"
adb install "C:\path\to\rushmedz-driver.apk"
adb install "C:\path\to\rushmedz-merchant.apk"
```

## Detailed Build Instructions

### Build Configuration Explanation

Each app is configured with three build profiles in `eas.json`:

**1. Development Profile (`{app}-development`)**
- Full debugging support
- Development client enabled
- For local testing with Expo Go
- Command: `eas build --platform android --profile {app}-development`

**2. Preview Profile (`{app}-preview`)**
- APK format for testing
- Optimized but with debugging info
- Best for QA testing before production
- Command: `eas build --platform android --profile {app}-preview`

**3. Production Profile (`{app}-production`)**
- App Bundle format for Google Play Store
- Optimized and signed for release
- Command: `eas build --platform android --profile {app}-production`

### Batch Build Script

Create a file named `build-all-apks.ps1`:

```powershell
#!/usr/bin/env powershell

$BasePath = "d:\RushMedz App_Final"
$Apps = @(
    @{ Name = "User_Customer"; AppType = "user" },
    @{ Name = "Doctor"; AppType = "doctor" },
    @{ Name = "Driver"; AppType = "driver" },
    @{ Name = "Merchant"; AppType = "merchant" }
)

foreach ($app in $Apps) {
    Write-Host "Building $($app.Name) App..." -ForegroundColor Cyan
    
    $appPath = Join-Path $BasePath "RushMedz $($app.Name)"
    Set-Location $appPath
    
    $env:APP_CONFIG="./app-configs/app.$($app.AppType).json"
    
    Write-Host "Running: eas build --platform android --profile $($app.AppType)-preview" -ForegroundColor Yellow
    & eas build --platform android --profile "$($app.AppType)-preview"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "$($app.Name) build successful!" -ForegroundColor Green
    } else {
        Write-Host "$($app.Name) build failed!" -ForegroundColor Red
    }
    
    Write-Host "---" -ForegroundColor Gray
}

Write-Host "All builds completed!" -ForegroundColor Green
```

Run with:
```powershell
.\build-all-apks.ps1
```

## Troubleshooting

### Error: "Not logged in"
```powershell
eas login
eas whoami  # Verify you're logged in
```

### Error: "APP_CONFIG not recognized"
Make sure to set the environment variable before running the build:
```powershell
# Wrong - won't work
eas build --platform android --profile user-preview

# Correct - set variable first
$env:APP_CONFIG="./app-configs/app.user.json"
eas build --platform android --profile user-preview
```

### Error: "Build failed on server"
Check the build logs in EAS dashboard and verify:
1. Node.js version compatibility
2. All dependencies installed: `npm install`
3. No syntax errors in code
4. Environment variables are correct

### Error: "APK too large"
Common for debug builds. Use preview or production builds instead.

## APK Testing

### Prerequisites
- Android device or emulator
- USB debugging enabled (Settings > Developer Options > USB Debugging)
- ADB installed (part of Android SDK)

### Test Installation
```powershell
# List connected devices
adb devices

# Install APK
adb install "C:\Downloads\rushmedz-user.apk"

# Uninstall if needed
adb uninstall com.rushmedz.user
```

### Test Deep Linking
```powershell
# Open app with deep link
adb shell am start -W -a android.intent.action.VIEW -d "rushmedz-user://home"
adb shell am start -W -a android.intent.action.VIEW -d "rushmedz-doctor://consultations"
adb shell am start -W -a android.intent.action.VIEW -d "rushmedz-driver://deliveries"
adb shell am start -W -a android.intent.action.VIEW -d "rushmedz-merchant://inventory"
```

### View Logs
```powershell
# Real-time logs
adb logcat -s RushMedz

# Filter by app package
adb logcat --pid=$(adb shell pidof com.rushmedz.user)

# Clear logs
adb logcat -c
```

## Production Build for Google Play

### Prerequisites
1. Google Play Developer Account ($25 one-time)
2. Signed keystore file
3. App privacy policy URL
4. Screenshots and descriptions

### Generate Keystore (One Time)
```powershell
keytool -genkey -v -keystore rushmedz-release.keystore `
  -keyalg RSA -keysize 2048 -validity 10000 -alias rushmedz
```

### Update eas.json with Signing
```json
{
  "build": {
    "user-production": {
      "android": {
        "buildType": "app-bundle",
        "gradleCommand": ":app:bundleRelease"
      },
      "env": {
        "APP_CONFIG": "./app-configs/app.user.json"
      }
    }
  },
  "submit": {
    "user": {
      "android": {
        "serviceAccountKeyPath": "./secrets/user-playstore-service-account.json"
      }
    }
  }
}
```

### Build Production
```powershell
$env:APP_CONFIG="./app-configs/app.user.json"
eas build --platform android --profile user-production

# Submit to Play Store
eas submit --platform android --latest
```

## Troubleshooting Deep Linking

If deep links don't work after installation:

1. **Verify scheme in app.json:**
   ```json
   {
     "expo": {
       "scheme": "rushmedz-user"
     }
   }
   ```

2. **Check bundle identifier matches:**
   ```json
   {
     "android": {
       "package": "com.rushmedz.user"
     }
   }
   ```

3. **Test with ADB:**
   ```powershell
   adb shell am start -W -a android.intent.action.VIEW -d "rushmedz-user://test"
   ```

4. **Check manifest file:**
   ```powershell
   adb shell dumpsys package com.rushmedz.user | grep "scheme:"
   ```

## Performance Optimization

### Reduce APK Size
```powershell
# Build with optimizations
$env:APP_CONFIG="./app-configs/app.user.json"
eas build --platform android --profile user-preview --clear-cache
```

### Enable ProGuard (Release Builds)
```json
{
  "expo": {
    "plugins": [
      ["expo-gradle-ext-vars", { "enableProguard": true }]
    ]
  }
}
```

## Local Build (No Cloud)

If you prefer to build locally without cloud services:

```powershell
# Install Android SDK
# Set up environment variables
$env:ANDROID_HOME = "C:\Users\YourUser\AppData\Local\Android\sdk"

# Run local build
eas build --platform android --local --profile user-preview

# This requires:
# - Java JDK installed
# - Android SDK installed
# - Gradle configured
# - All environment variables set correctly
```

## API Endpoint Configuration

### Development (Local Backend)
When testing locally, ensure your backend is running:
```powershell
# Terminal 1 - Backend server
cd "d:\RushMedz App_Final\RushMedz User_Customer\backend"
npm install
npm start  # Runs on http://localhost:8086
```

### Emulator Network Access
If using Android emulator:
```powershell
# Replace localhost with emulator host IP
# In .env.ecosystem:
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8086
```

### Physical Device Network Access
```powershell
# Use your computer's IP address
# In .env.ecosystem:
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:8086
```

## Security Considerations

### Never Commit Secrets
```powershell
# Add to .gitignore
*.keystore
./secrets/
.env.local
.env.production
```

### Rotate Keys Periodically
- Change JWT_SECRET every 90 days
- Update API keys
- Regenerate payment gateway tokens

### SSL/TLS for Production
```
EXPO_PUBLIC_API_BASE_URL=https://api.rushmedz.com
EXPO_PUBLIC_WS_URL=wss://api.rushmedz.com/ws/events
```

## Support Resources

- **EAS Documentation:** https://docs.expo.dev/eas
- **Expo CLI Reference:** https://docs.expo.dev/cli
- **Android Development:** https://developer.android.com
- **Expo Community:** https://forums.expo.dev

## Build Status Commands

```powershell
# Check build status
eas build --status

# View recent builds
eas build --status --limit 10

# Monitor active build
eas build --status --monitor

# Get build details
eas build --status --build-id=xxxxx
```

---

**Last Updated:** December 27, 2025
**Status:** All Apps Configured - Ready for APK Build
