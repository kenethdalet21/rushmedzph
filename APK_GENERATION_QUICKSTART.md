# 🚀 APK Generation Quick Start Guide

## Prerequisites

Before you can generate APK files, you need:

1. **Expo CLI** - Already installed in your projects ✅
2. **EAS CLI** - Install globally if not already:
   ```powershell
   npm install -g eas-cli
   ```

3. **Expo Account** - Create one at https://expo.dev (FREE)

4. **Android SDK** - For testing (optional if you're just building)

## Step-by-Step APK Generation

### Step 1: Login to Expo

Open PowerShell and run:

```powershell
eas login
```

This will prompt you to:
- Enter your Expo account email
- Enter your password
- Or sign up if you don't have an account yet

**Note:** You must be logged in before running the build script!

### Step 2: Run the Build Script

Navigate to the workspace root and execute:

```powershell
cd "d:\RushMedz App_Final"
.\build-apks.ps1
```

Or to build a specific app:

```powershell
.\build-apks.ps1 -AppName doctor
.\build-apks.ps1 -AppName driver
.\build-apks.ps1 -AppName merchant
.\build-apks.ps1 -AppName user
```

### Step 3: Monitor Build Progress

The script will display:
- ✅ Checking for required files
- 📲 Submitting each app to EAS cloud service
- 📊 Link to monitor: https://expo.dev/builds

**Each build takes 5-10 minutes.** You can monitor them on the EAS dashboard while they run.

### Step 4: Download APK Files

When builds complete on https://expo.dev/builds:

1. Go to https://expo.dev/builds
2. Find your completed builds
3. Download the `.apk` files for each app:
   - `rushmedz-user.apk`
   - `rushmedz-doctor.apk`
   - `rushmedz-driver.apk`
   - `rushmedz-merchant.apk`

4. Save them in a dedicated folder, e.g., `d:\RushMedz App_Final\apks\`

## Testing on Android Device

### Option A: Using Physical Device

```powershell
# Connect device via USB, enable USB debugging
adb devices  # Should show your device

# Install APKs
adb install "d:\RushMedz App_Final\apks\rushmedz-user.apk"
adb install "d:\RushMedz App_Final\apks\rushmedz-doctor.apk"
adb install "d:\RushMedz App_Final\apks\rushmedz-driver.apk"
adb install "d:\RushMedz App_Final\apks\rushmedz-merchant.apk"
```

### Option B: Using Android Emulator

```powershell
# List available emulators
emulator -list-avds

# Start emulator
emulator -avd Pixel_4_API_31

# Wait for boot, then install
adb install "d:\RushMedz App_Final\apks\rushmedz-user.apk"
```

## Testing Inter-App Deep Linking

After installing on device, test that apps can link to each other:

```powershell
# Open User app home
adb shell am start -W -a android.intent.action.VIEW -d "rushmedz-user://home"

# Open Doctor consultations
adb shell am start -W -a android.intent.action.VIEW -d "rushmedz-doctor://consultations"

# Open Driver deliveries
adb shell am start -W -a android.intent.action.VIEW -d "rushmedz-driver://deliveries"

# Open Merchant inventory
adb shell am start -W -a android.intent.action.VIEW -d "rushmedz-merchant://inventory"
```

## Build Profiles Explained

The script builds with **preview** profile by default, which is ideal for:
- Testing on physical devices
- APK distribution to team members
- Pre-production validation

### Available Profiles:

- **development**: Internal build for rapid testing
- **preview**: Optimized APK for device testing (RECOMMENDED)
- **production**: Signed for Play Store release (after testing)

To use different profiles:

```powershell
.\build-apks.ps1 -ProfileType development
.\build-apks.ps1 -ProfileType preview      # Default
.\build-apks.ps1 -ProfileType production   # For Play Store
```

## Troubleshooting

### ❌ "Not logged into EAS"

```powershell
eas login
# Enter your credentials
.\build-apks.ps1
```

### ❌ "eas.json not found"

This shouldn't happen as all apps have been configured. Check:
```powershell
# For Doctor app
ls "d:\RushMedz App_Final\RushMedz Doctor\eas.json"
ls "d:\RushMedz App_Final\RushMedz Doctor\app.json"
ls "d:\RushMedz App_Final\RushMedz Doctor\app-configs\"
```

### ❌ "Build submission failed"

Check your Expo account limits:
1. Go to https://expo.dev
2. Check project settings
3. Free tier allows 30 free builds/month (plenty for development)

### ❌ "Build failed on EAS"

View detailed logs on https://expo.dev/builds - click on failed build to see error details.

## Configuration Files Reference

Each app has been configured with:

| File | Purpose |
|------|---------|
| `app.json` | Main app config (bundle ID, permissions, plugins) |
| `eas.json` | EAS build profiles (development/preview/production) |
| `.env.ecosystem` | Unified backend API configuration |
| `app-configs/app.{type}.json` | Per-app variant configs |

## What's Next After APKs?

1. ✅ **Install on device** - Verify apps work
2. ✅ **Test deep linking** - Verify inter-app navigation
3. ✅ **Run backend** - Start Node.js API at http://localhost:8086
4. ✅ **Test user workflows** - Full end-to-end testing
5. ✅ **Fix any issues** - Iterate if needed
6. 📦 **Prepare for Play Store** - Use production builds when ready

## Important Notes

- **Build times**: 5-10 minutes per app on EAS cloud
- **Simultaneous builds**: 4 builds running means ~10-40 minute total wait
- **APK size**: Each APK is ~100-150 MB
- **Storage**: Download all 4 APKs = ~600 MB total
- **Device storage**: ~200 MB per app on Android device

## Support Files

For detailed information, see:
- [APK_BUILD_GUIDE.md](./APK_BUILD_GUIDE.md) - Comprehensive build guide
- [DETAILED_APK_BUILD_INSTRUCTIONS.md](./DETAILED_APK_BUILD_INSTRUCTIONS.md) - Step-by-step instructions
- [ECOSYSTEM_CONFIGURATION_SUMMARY.md](./ECOSYSTEM_CONFIGURATION_SUMMARY.md) - Configuration details
- [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md) - All documentation

---

**Ready to generate APKs?** Start with Step 1 above! 🎉
