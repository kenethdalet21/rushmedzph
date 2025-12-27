# 📱 Standalone App Build Guide

## Overview

This guide explains how to build and publish each app (User, Merchant, Driver, Doctor, Admin) as **individual standalone applications** for iOS and Android.

---

## 🎯 Prerequisites

### Required Tools

1. **Node.js** (v18+)
2. **Expo CLI** (installed globally)
   ```bash
   npm install -g expo-cli
   ```
3. **EAS CLI** (for cloud builds)
   ```bash
   npm install -g eas-cli
   ```
4. **For Android Local Builds:**
   - Android Studio
   - Java JDK 17+
   - Android SDK

5. **For iOS Builds:**
   - macOS computer
   - Xcode 14+
   - Apple Developer Account

### EAS Account Setup

1. Create an Expo account at https://expo.dev
2. Login to EAS:
   ```bash
   eas login
   ```
3. Configure each app project:
   ```bash
   eas init
   ```

---

## 📦 App Configurations

Each app has its own configuration file in `app-configs/`:

- `app.user.json` - Epharma User (Blue theme)
- `app.merchant.json` - Epharma Merchant (Green theme)
- `app.driver.json` - Epharma Driver (Purple theme)
- `app.doctor.json` - Epharma Doctor (Red theme)
- `app.admin.json` - Epharma Admin (Orange theme)

### Bundle Identifiers

- **User:** `com.epharma.user`
- **Merchant:** `com.epharma.merchant`
- **Driver:** `com.epharma.driver`
- **Doctor:** `com.epharma.doctor`
- **Admin:** `com.epharma.admin`

---

## 🚀 Build Methods

### Method 1: Using NPM Scripts (Recommended)

#### Development Builds (for testing)

```bash
# Start individual app in development
npm run start:user
npm run start:merchant
npm run start:driver
npm run start:doctor
npm run start:admin
```

#### Preview Builds (APK for testing)

```bash
# Build preview APK for distribution to testers
npm run build:user:preview
npm run build:merchant:preview
npm run build:driver:preview
npm run build:doctor:preview
npm run build:admin:preview
```

#### Production Builds (for app stores)

**Android:**
```bash
npm run build:user:android
npm run build:merchant:android
npm run build:driver:android
npm run build:doctor:android
npm run build:admin:android
```

**iOS:**
```bash
npm run build:user:ios
npm run build:merchant:ios
npm run build:driver:ios
npm run build:doctor:ios
npm run build:admin:ios
```

**Build All Apps:**
```bash
# Build all Android apps
npm run build:all:android

# Build all iOS apps
npm run build:all:ios
```

---

### Method 2: Using Custom Scripts

#### Using EAS Build Script

```bash
# Production builds
node scripts/build-app.js user android
node scripts/build-app.js merchant ios
node scripts/build-app.js driver android

# Preview builds
node scripts/build-app.js user android preview
node scripts/build-app.js doctor ios preview
```

#### Local Android Build

```bash
# Build APK locally (faster, no EAS required)
node scripts/build-local-android.js user
node scripts/build-local-android.js merchant
node scripts/build-local-android.js driver
node scripts/build-local-android.js doctor
node scripts/build-local-android.js admin
```

**Local builds output to:** `./builds/<app-type>/<app-type>-app.apk`

---

### Method 3: Direct EAS Commands

```bash
# Set environment variable and build
APP_CONFIG=./app-configs/app.user.json eas build --platform android --profile user-production

APP_CONFIG=./app-configs/app.merchant.json eas build --platform ios --profile merchant-production
```

---

## 🎨 App Assets

Each app needs unique assets. Generate them using:

```bash
npm run generate:assets
```

### Required Assets per App

```
assets/images/
├── icon-user.png           (1024x1024)
├── icon-merchant.png       (1024x1024)
├── icon-driver.png         (1024x1024)
├── icon-doctor.png         (1024x1024)
├── icon-admin.png          (1024x1024)
├── splash-user.png         (1284x2778)
├── splash-merchant.png     (1284x2778)
├── splash-driver.png       (1284x2778)
├── splash-doctor.png       (1284x2778)
├── splash-admin.png        (1284x2778)
├── adaptive-icon-user.png  (1024x1024)
├── adaptive-icon-merchant.png
├── adaptive-icon-driver.png
├── adaptive-icon-doctor.png
└── adaptive-icon-admin.png
```

### Asset Color Themes

- **User:** #45B7D1 (Blue)
- **Merchant:** #27AE60 (Green)
- **Driver:** #9B59B6 (Purple)
- **Doctor:** #E74C3C (Red)
- **Admin:** #F39C12 (Orange)

---

## 🔐 Code Signing

### Android Signing

1. **Generate Keystore for each app:**

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore user-release.keystore -alias user-key -keyalg RSA -keysize 2048 -validity 10000

keytool -genkeypair -v -storetype PKCS12 -keystore merchant-release.keystore -alias merchant-key -keyalg RSA -keysize 2048 -validity 10000

keytool -genkeypair -v -storetype PKCS12 -keystore driver-release.keystore -alias driver-key -keyalg RSA -keysize 2048 -validity 10000

keytool -genkeypair -v -storetype PKCS12 -keystore doctor-release.keystore -alias doctor-key -keyalg RSA -keysize 2048 -validity 10000

keytool -genkeypair -v -storetype PKCS12 -keystore admin-release.keystore -alias admin-key -keyalg RSA -keysize 2048 -validity 10000
```

2. **Store keystores securely:**
   - Place in `./secrets/` directory
   - Add to `.gitignore`
   - Upload to EAS with:
   ```bash
   eas credentials
   ```

### iOS Signing

1. **Create App IDs** in Apple Developer Portal:
   - com.epharma.user
   - com.epharma.merchant
   - com.epharma.driver
   - com.epharma.doctor
   - com.epharma.admin

2. **Create Provisioning Profiles** for each app

3. **EAS will handle certificates automatically** or you can upload manually:
   ```bash
   eas credentials
   ```

---

## 📲 Publishing to App Stores

### Google Play Store (Android)

#### 1. Create Separate App Listings

Create 5 separate app listings in Google Play Console:
- Epharma User
- Epharma Merchant
- Epharma Driver
- Epharma Doctor
- Epharma Admin

#### 2. Prepare Store Listings

For each app, provide:
- App name and description
- Screenshots (phone & tablet)
- Feature graphic
- Privacy policy URL
- Category selection
- Content rating

#### 3. Upload AAB Files

```bash
# Build production AABs
npm run build:user:android
npm run build:merchant:android
npm run build:driver:android
npm run build:doctor:android
npm run build:admin:android
```

Download the AAB files from EAS and upload to Play Console.

#### 4. Using EAS Submit (Automated)

```bash
eas submit --platform android --profile user
eas submit --platform android --profile merchant
eas submit --platform android --profile driver
eas submit --platform android --profile doctor
eas submit --platform android --profile admin
```

---

### Apple App Store (iOS)

#### 1. Create App Store Connect Apps

Create 5 separate apps in App Store Connect:
- Epharma User
- Epharma Merchant
- Epharma Driver
- Epharma Doctor
- Epharma Admin

#### 2. Prepare Store Listings

For each app, provide:
- App name, subtitle, description
- Keywords
- Screenshots (all device sizes)
- App preview videos (optional)
- Privacy policy URL
- Category selection

#### 3. Upload IPA Files

```bash
# Build production IPAs
npm run build:user:ios
npm run build:merchant:ios
npm run build:driver:ios
npm run build:doctor:ios
npm run build:admin:ios
```

#### 4. Using EAS Submit (Automated)

```bash
eas submit --platform ios --profile user
eas submit --platform ios --profile merchant
eas submit --platform ios --profile driver
eas submit --platform ios --profile doctor
eas submit --platform ios --profile admin
```

---

## 🔄 Update Strategy

### OTA Updates (Over-The-Air)

For JavaScript changes without native code modifications:

```bash
# Publish update for specific app
eas update --branch user-production --message "Bug fixes"
eas update --branch merchant-production --message "New features"
eas update --branch driver-production --message "UI improvements"
eas update --branch doctor-production --message "Performance boost"
eas update --branch admin-production --message "Security updates"
```

### Full App Updates

For native code changes, version bumps required:

1. Update version in app config:
   ```json
   {
     "expo": {
       "version": "1.1.0",
       "android": { "versionCode": 2 },
       "ios": { "buildNumber": "1.1.0" }
     }
   }
   ```

2. Build new version
3. Submit to stores

---

## 🧪 Testing Builds

### Internal Testing

#### Android (APK Distribution)

```bash
# Build preview APK
npm run build:user:preview

# Download from EAS dashboard
# Share APK link with testers
```

#### iOS (TestFlight)

```bash
# Build and submit to TestFlight
npm run build:user:ios
eas submit --platform ios --profile user

# Add testers in App Store Connect
```

### Testing Checklist

For each app:
- [ ] App launches successfully
- [ ] Login/Signup works
- [ ] All tabs navigate correctly
- [ ] Event bus communication works
- [ ] API calls succeed
- [ ] Images load properly
- [ ] Push notifications work
- [ ] Permissions requested correctly
- [ ] No crashes or errors
- [ ] Performance is acceptable

---

## 📊 Build Profiles

### Development Profile
- **Purpose:** Testing on physical devices
- **Distribution:** Internal
- **Build Time:** ~5-10 minutes
- **Output:** APK/IPA for direct installation

### Preview Profile
- **Purpose:** Beta testing, QA
- **Distribution:** Internal
- **Build Time:** ~10-15 minutes
- **Output:** APK for Android, IPA for iOS

### Production Profile
- **Purpose:** App Store submission
- **Distribution:** Store
- **Build Time:** ~15-20 minutes
- **Output:** AAB for Play Store, IPA for App Store

---

## 🛠️ Troubleshooting

### Common Issues

#### 1. Build Fails with "Duplicate Resources"

**Solution:** Ensure each app config has unique bundle identifier

#### 2. "Provisioning Profile Doesn't Match"

**Solution:** Run `eas credentials` and regenerate profiles

#### 3. "INSTALL_FAILED_UPDATE_INCOMPATIBLE"

**Solution:** Uninstall existing app with same package name

#### 4. Assets Not Found

**Solution:** Run `npm run generate:assets` before building

#### 5. OTA Update Not Applied

**Solution:** Check branch name matches build profile

### Getting Help

- EAS Documentation: https://docs.expo.dev/eas/
- Expo Forums: https://forums.expo.dev/
- Discord: https://chat.expo.dev/

---

## 📋 Build Checklist

Before submitting to stores:

### Pre-Build
- [ ] Update version numbers
- [ ] Generate all app assets
- [ ] Update app descriptions
- [ ] Test on physical devices
- [ ] Review permissions
- [ ] Update privacy policy

### During Build
- [ ] Monitor EAS dashboard for errors
- [ ] Check build logs for warnings
- [ ] Verify bundle identifiers

### Post-Build
- [ ] Download and test builds
- [ ] Verify app metadata
- [ ] Check file sizes
- [ ] Test on multiple devices
- [ ] Run security scan

### Store Submission
- [ ] Prepare screenshots
- [ ] Write release notes
- [ ] Set pricing (free/paid)
- [ ] Configure in-app purchases (if any)
- [ ] Submit for review

---

## 🎯 Quick Reference

### Build Commands Summary

```bash
# Development
npm run start:user
npm run start:merchant
npm run start:driver

# Preview (APK)
npm run build:user:preview
npm run build:merchant:preview
npm run build:driver:preview

# Production (Android)
npm run build:user:android
npm run build:merchant:android
npm run build:driver:android

# Production (iOS)
npm run build:user:ios
npm run build:merchant:ios
npm run build:driver:ios

# Local Android Build
node scripts/build-local-android.js user
node scripts/build-local-android.js merchant

# Build All
npm run build:all:android
npm run build:all:ios
```

---

## 🔒 Security Considerations

1. **Keystores:** Never commit to Git
2. **API Keys:** Use environment variables
3. **Secrets:** Store in EAS Secrets
4. **Service Accounts:** Keep in secure location
5. **Code Obfuscation:** Enable for production builds

---

## 📈 Analytics & Monitoring

Consider integrating:
- Firebase Analytics
- Sentry for crash reporting
- App Center for distribution
- Amplitude for user behavior

---

## ✅ Success Criteria

Each standalone app should:
- ✅ Install and run independently
- ✅ Have unique bundle identifier
- ✅ Use app-specific branding
- ✅ Function without other apps
- ✅ Communicate via event bus when together
- ✅ Have proper app store listings
- ✅ Pass app store review
- ✅ Support OTA updates
- ✅ Handle offline scenarios
- ✅ Meet performance benchmarks

---

**Document Version:** 1.0  
**Last Updated:** December 26, 2025  
**Maintained By:** Epharma Development Team
