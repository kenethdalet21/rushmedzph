# 🎯 APK Generation Pre-Flight Checklist

## ✅ Configuration Verification

Before running builds, use this checklist to ensure everything is ready.

### User App (RushMedz User_Customer)
```
□ app.json exists and contains:
  □ Bundle ID: com.rushmedz.user
  □ Scheme: rushmedz-user
  □ Android permissions configured
  
□ eas.json exists with profiles:
  □ user-development
  □ user-preview
  □ user-production
  
□ app-configs/ directory exists with:
  □ app.user.json
  □ app.doctor.json
  □ app.driver.json
  □ app.merchant.json
  
□ .env.ecosystem exists with:
  □ API_BASE_URL configured
  □ WebSocket URL configured
```

### Doctor App (RushMedz Doctor)
```
□ app.json exists and contains:
  □ Bundle ID: com.rushmedz.doctor
  □ Scheme: rushmedz-doctor
  □ Android permissions configured (including microphone)
  
□ eas.json exists with profiles:
  □ doctor-development
  □ doctor-preview
  □ doctor-production
  
□ app-configs/ directory exists with:
  □ app.doctor.json
  □ app.user.json
  □ app.driver.json
  □ app.merchant.json
  
□ .env.ecosystem exists with:
  □ API_BASE_URL configured
  □ WebSocket URL configured
```

### Driver App (RushMedz Driver)
```
□ app.json exists and contains:
  □ Bundle ID: com.rushmedz.driver
  □ Scheme: rushmedz-driver
  □ Location permissions configured (background location)
  □ Foreground service permissions
  
□ eas.json exists with profiles:
  □ driver-development
  □ driver-preview
  □ driver-production
  
□ app-configs/ directory exists with:
  □ app.driver.json
  □ app.user.json
  □ app.doctor.json
  □ app.merchant.json
  
□ .env.ecosystem exists with:
  □ API_BASE_URL configured
  □ WebSocket URL configured
  □ Driver-specific settings (earnings, bonuses)
```

### Merchant App (RushMedz Merchant)
```
□ app.json exists and contains:
  □ Bundle ID: com.rushmedz.merchant
  □ Scheme: rushmedz-merchant
  □ Camera & gallery permissions configured
  
□ eas.json exists with profiles:
  □ merchant-development
  □ merchant-preview
  □ merchant-production
  
□ app-configs/ directory exists with:
  □ app.merchant.json
  □ app.user.json
  □ app.doctor.json
  □ app.driver.json
  
□ .env.ecosystem exists with:
  □ API_BASE_URL configured
  □ WebSocket URL configured
  □ Merchant-specific settings (payout threshold, inventory)
```

---

## 📋 System Requirements

### Your Machine
```
□ Windows PowerShell (or PowerShell Core 7+)
□ Node.js v18+ installed
□ npm package manager working
```

### Check with:
```powershell
node --version
npm --version
```

### Optional (for APK testing)
```
□ Android SDK (adb command available)
□ Android device OR emulator
□ USB debugging enabled on device
□ Sufficient storage (600MB+ for 4 APKs)
```

### Check with:
```powershell
adb version
adb devices
```

---

## 🔧 Pre-Build Setup

### 1. Expo Account ✅
```
□ Sign up at https://expo.dev (FREE)
□ Verify email
□ Know your email & password
```

### 2. EAS CLI ✅
```powershell
# Install EAS CLI globally
npm install -g eas-cli

# Verify installation
eas --version
```

### 3. EAS Login ✅
```powershell
# Login to Expo
eas login
# Enter credentials when prompted
```

### Verify Login:
```powershell
eas whoami
# Should show your Expo account email
```

---

## 📂 Directory Structure Check

```powershell
# Open PowerShell and check that all these paths exist:

Test-Path "d:\RushMedz App_Final\RushMedz User_Customer\app.json"
Test-Path "d:\RushMedz App_Final\RushMedz User_Customer\eas.json"

Test-Path "d:\RushMedz App_Final\RushMedz Doctor\app.json"
Test-Path "d:\RushMedz App_Final\RushMedz Doctor\eas.json"

Test-Path "d:\RushMedz App_Final\RushMedz Driver\app.json"
Test-Path "d:\RushMedz App_Final\RushMedz Driver\eas.json"

Test-Path "d:\RushMedz App_Final\RushMedz Merchant\app.json"
Test-Path "d:\RushMedz App_Final\RushMedz Merchant\eas.json"

Test-Path "d:\RushMedz App_Final\build-apks.ps1"

# All should return: True
```

---

## 🚀 Ready to Build?

### Pre-Flight Checklist
- [ ] All configuration files exist (app.json, eas.json, .env.ecosystem)
- [ ] All directories configured correctly (app-configs/)
- [ ] Expo account created
- [ ] EAS CLI installed
- [ ] Logged in with `eas login`
- [ ] `eas whoami` returns your email
- [ ] build-apks.ps1 script exists

### Go/No-Go Decision

**If all items checked above:**
```
Status: ✅ READY TO BUILD

Run this command:
  cd "d:\RushMedz App_Final"
  .\build-apks.ps1
```

**If any items NOT checked:**
```
Status: ❌ NOT READY

Complete missing items before running build script.
See APK_GENERATION_QUICKSTART.md for details.
```

---

## 🔄 Build Process Overview

When you run the script:

1. **Login Verification** (5 sec)
   - Script checks if you're logged into EAS
   - Fails if not logged in

2. **For Each App** (5-10 min each, sequential):
   - File validation (app.json, eas.json exist)
   - Config file setup
   - EAS build submission
   - Cloud build starts

3. **Monitoring** (5-10 min per app):
   - You monitor at https://expo.dev/builds
   - Builds compile on EAS servers
   - APKs generated automatically

4. **Download** (1-5 min):
   - Go to EAS dashboard
   - Download each APK when ready

5. **Testing**:
   - Install on device: `adb install file.apk`
   - Test deep linking
   - Verify inter-app communication

---

## 📞 Support

If something doesn't work:

1. **Check EAS Dashboard**: https://expo.dev/builds
   - Click on your failed build
   - Read error log at bottom

2. **Re-verify Configuration**:
   - Run tests above
   - Check .env.ecosystem files
   - Ensure bundle IDs are unique

3. **Check Internet**:
   - EAS requires internet connection
   - Build servers need to download dependencies

4. **Try Single App**:
   ```powershell
   .\build-apks.ps1 -AppName user
   ```

5. **See Detailed Guides**:
   - [APK_GENERATION_QUICKSTART.md](./APK_GENERATION_QUICKSTART.md)
   - [APK_BUILD_GUIDE.md](./APK_BUILD_GUIDE.md)

---

## ✨ Next Steps After APKs

1. ✅ Download APKs from EAS
2. ✅ Install on Android device
3. ✅ Test app functionality
4. ✅ Test deep linking between apps
5. ✅ Start backend API
6. ✅ Full end-to-end testing
7. 📦 Prepare for Play Store release

---

**You're all set! Ready to generate APKs?** 🎉
