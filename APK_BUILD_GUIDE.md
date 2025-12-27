# RushMedz APK Build & Configuration Guide

## System Overview

The RushMedz ecosystem consists of 4 interconnected mobile applications:
- **User App** - Customer-facing pharmacy ordering app
- **Doctor App** - Telemedicine consultation platform  
- **Driver App** - Delivery management & tracking
- **Merchant App** - Pharmacy/Merchant business management

All apps are configured to work as a unified ecosystem with shared:
- Deep linking schemes (rushmedz-user, rushmedz-doctor, rushmedz-driver, rushmedz-merchant)
- Backend API endpoints (http://localhost:8086 for development)
- WebSocket real-time event system
- Shared authentication and payment processing

## Configuration Status

### 1. App Configuration ✅ COMPLETED
- All apps configured with proper bundle identifiers:
  - User: `com.rushmedz.user`
  - Doctor: `com.rushmedz.doctor`
  - Driver: `com.rushmedz.driver`
  - Merchant: `com.rushmedz.merchant`

- Deep linking schemes properly set:
  - User: `rushmedz-user://`
  - Doctor: `rushmedz-doctor://`
  - Driver: `rushmedz-driver://`
  - Merchant: `rushmedz-merchant://`

### 2. Environment Configuration ✅ COMPLETED
All apps have `.env.ecosystem` files with:
- Unified API base URL: `http://localhost:8086`
- WebSocket URL: `ws://localhost:8086/ws/events`
- App-specific URLs for deep linking
- Payment gateway configurations
- Feature flags

### 3. EAS Configuration ✅ COMPLETED
Each app has configured `eas.json` with build profiles:
- `{app}-development` - Development client builds
- `{app}-preview` - Preview APK builds
- `{app}-production` - Store release builds

### 4. Android Permissions ✅ COMPLETED
Each app has appropriate Android permissions configured:

**User App:**
- CAMERA, READ_EXTERNAL_STORAGE, WRITE_EXTERNAL_STORAGE
- ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION
- INTERNET, VIBRATE

**Doctor App:**
- CAMERA, RECORD_AUDIO
- READ_EXTERNAL_STORAGE, WRITE_EXTERNAL_STORAGE
- INTERNET, MODIFY_AUDIO_SETTINGS

**Driver App:**
- CAMERA, ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION
- ACCESS_BACKGROUND_LOCATION
- FOREGROUND_SERVICE, FOREGROUND_SERVICE_LOCATION
- INTERNET, WAKE_LOCK

**Merchant App:**
- CAMERA, READ_EXTERNAL_STORAGE, WRITE_EXTERNAL_STORAGE
- ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION
- INTERNET, RECEIVE_BOOT_COMPLETED

## Building APKs

### Prerequisites
1. Node.js and npm installed
2. EAS CLI installed globally: `npm install -g eas-cli`
3. Expo CLI installed: `npm install -g expo-cli`
4. Android SDK (for development builds)
5. Expo account and logged in: `eas login`

### Build Methods

#### Method 1: Using EAS Cloud Build (Recommended)
The easiest way - uses Expo's cloud infrastructure:

```powershell
# Set environment variable
$env:APP_CONFIG="./app-configs/app.{appType}.json"

# Build preview APK
eas build --platform android --profile {appType}-preview

# Build production APK  
eas build --platform android --profile {appType}-production
```

Replace `{appType}` with: `user`, `doctor`, `driver`, or `merchant`

**Example:**
```powershell
cd "d:\RushMedz App_Final\RushMedz User_Customer"
$env:APP_CONFIG="./app-configs/app.user.json"
eas build --platform android --profile user-preview
```

#### Method 2: Local Android Build
Build directly on your machine:

```powershell
cd "d:\RushMedz App_Final\RushMedz {AppFolder}"
expo prebuild --clean
eas build --platform android --local
```

#### Method 3: Using NPM Scripts
The package.json files have pre-configured build scripts:

```powershell
# In PowerShell, set environment variable first:
$env:APP_CONFIG="./app-configs/app.user.json"
npm run build:user:preview

# Or for other apps:
npm run build:doctor:preview
npm run build:driver:preview
npm run build:merchant:preview
```

### Build Status

After running the build command, you'll see:
```
✓ Build request submitted  
EAS Build ID: xxxxx
Waiting for build to complete...
```

The build will be compiled on EAS servers. Once complete, download the APK file.

## APK Installation & Testing

### Prerequisites
- Android device or emulator
- USB debugging enabled (for physical devices)

### Installation

**Method 1: ADB (Android Debug Bridge)**
```powershell
# Connect device via USB
adb devices

# Install APK
adb install path/to/rushmedz-{app}-name.apk
```

**Method 2: Direct Download**
From the EAS Build dashboard, download APK directly to your device and install.

**Method 3: Using QR Code**
EAS provides a QR code that can be scanned on your Android device to install directly.

### Testing Inter-App Navigation

Once all 4 APKs are installed on your device:

1. **User App** → Navigate to any service that requires Doctor or Driver interaction
2. **Doctor App** → Use deep link: `adb shell am start -W -a android.intent.action.VIEW -d "rushmedz-doctor://consultations"`
3. **Driver App** → Use deep link: `adb shell am start -W -a android.intent.action.VIEW -d "rushmedz-driver://deliveries"`
4. **Merchant App** → Use deep link: `adb shell am start -W -a android.intent.action.VIEW -d "rushmedz-merchant://inventory"`

### Example Deep Link Tests
```powershell
# Open specific screens within apps
adb shell am start -W -a android.intent.action.VIEW -d "rushmedz-user://prescriptions"
adb shell am start -W -a android.intent.action.VIEW -d "rushmedz-doctor://patients"
adb shell am start -W -a android.intent.action.VIEW -d "rushmedz-driver://earnings"
adb shell am start -W -a android.intent.action.VIEW -d "rushmedz-merchant://orders"
```

## Troubleshooting

### Build Fails with "Not logged in"
```powershell
eas login
# Enter Expo account email and password
eas whoami
```

### "APP_CONFIG not recognized"
In PowerShell, environment variables must be set before the command:
```powershell
$env:APP_CONFIG="./app-configs/app.user.json"
eas build --platform android --profile user-preview
```

### Build Queue Timeout
- Check EAS Build status: `eas build --status`
- Build with verbose output: `eas build --platform android --profile user-preview --verbose`

### APK Installation Fails
- Verify bundle ID matches app package configuration
- Check Android version compatibility (minimum API 21)
- Clear app cache: `adb shell pm clear com.rushmedz.user`

### Deep Linking Not Working
1. Verify scheme is set in app.json: `"scheme": "rushmedz-user"`
2. Check if deep linking plugins are installed: `expo-linking`
3. Test with: `adb shell am start -W -a android.intent.action.VIEW -d "rushmedz-user://home"`

## Environment Configuration Details

### API Connectivity
- **Development:** `http://localhost:8086` or `http://10.0.2.2:8086` (Android emulator)
- **Production:** `https://api.rushmedz.com`

To change the API endpoint:
1. Edit `.env.ecosystem` files in each app
2. Update `EXPO_PUBLIC_API_BASE_URL`
3. Rebuild the APK

### WebSocket Real-time Events
- Development: `ws://localhost:8086/ws/events`
- Production: `wss://api.rushmedz.com/ws/events`

Channels configured:
- `orders` - Order updates
- `products` - Product inventory changes
- `deliveries` - Driver location & status
- `notifications` - Push notifications

## Security Notes

### For Production Builds
1. Update JWT_SECRET in .env.ecosystem
2. Use HTTPS/WSS for API endpoints
3. Generate proper signing keys (keystore)
4. Enable certificate pinning
5. Update privacy and terms URLs

### Signing APKs
```powershell
# Create keystore (one time)
keytool -genkey -v -keystore rushmedz-release.keystore `
  -keyalg RSA -keysize 2048 -validity 10000 `
  -alias rushmedz

# Configure in eas.json under android.buildProfile
```

## Deployment Checklist

- [ ] All 4 apps configured with correct bundle IDs
- [ ] Deep linking schemes set correctly
- [ ] Environment variables updated for target environment
- [ ] Backend API is running and accessible
- [ ] WebSocket server is configured
- [ ] All APKs built successfully
- [ ] APKs tested on physical/emulator devices
- [ ] Inter-app navigation tested
- [ ] Payment gateways configured (if needed)
- [ ] Push notifications tested
- [ ] GPS/Location services tested
- [ ] Camera permissions tested

## Quick Build Commands

```powershell
# Build all preview APKs
cd "d:\RushMedz App_Final"

# User App
cd "RushMedz User_Customer"
$env:APP_CONFIG="./app-configs/app.user.json"
eas build --platform android --profile user-preview

# Doctor App
cd "../RushMedz Doctor"
$env:APP_CONFIG="./app-configs/app.doctor.json"
eas build --platform android --profile doctor-preview

# Driver App
cd "../RushMedz Driver"
$env:APP_CONFIG="./app-configs/app.driver.json"
eas build --platform android --profile driver-preview

# Merchant App
cd "../RushMedz Merchant"
$env:APP_CONFIG="./app-configs/app.merchant.json"
eas build --platform android --profile merchant-preview
```

## Support & Further Configuration

For additional configuration options, see:
- `app.json` - Expo app configuration
- `eas.json` - Build and submission configuration
- `app-configs/app.*.json` - App-specific environment overrides
- `.env.ecosystem` - Ecosystem-wide settings
- `package.json` - Build scripts and dependencies

Each app maintains backward compatibility with the original configuration while supporting the new unified ecosystem approach.
