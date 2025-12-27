# RushMedz APK Generation - Quick Reference

## 🚀 Start Here - 3 Simple Steps

### Step 1: Login (One-time setup)
```powershell
eas login
# Enter your Expo account credentials
```

### Step 2: Run the Build
```powershell
cd "d:\RushMedz App_Final"
.\build-apks.ps1
```

### Step 3: Monitor & Download
Visit https://expo.dev/builds to see progress and download APKs

---

## 📋 Current Configuration Status

### ✅ All 4 Apps Configured

| App | Bundle ID | Deep Link Scheme | Config Status |
|-----|-----------|------------------|----------------|
| User | com.rushmedz.user | rushmedz-user:// | ✅ Ready |
| Doctor | com.rushmedz.doctor | rushmedz-doctor:// | ✅ Ready |
| Driver | com.rushmedz.driver | rushmedz-driver:// | ✅ Ready |
| Merchant | com.rushmedz.merchant | rushmedz-merchant:// | ✅ Ready |

### Build Files Location

```
d:\RushMedz App_Final\
├── RushMedz User_Customer\
│   ├── app.json (✅)
│   ├── eas.json (✅)
│   ├── app-configs\ (✅)
│   └── .env.ecosystem (✅)
├── RushMedz Doctor\
│   ├── app.json (✅)
│   ├── eas.json (✅)
│   ├── app-configs\ (✅)
│   └── .env.ecosystem (✅)
├── RushMedz Driver\
│   ├── app.json (✅)
│   ├── eas.json (✅)
│   ├── app-configs\ (✅)
│   └── .env.ecosystem (✅)
├── RushMedz Merchant\
│   ├── app.json (✅)
│   ├── eas.json (✅)
│   ├── app-configs\ (✅)
│   └── .env.ecosystem (✅)
└── build-apks.ps1 (✅)
```

---

## 🎯 Build Options

### Default Build (All 4 Apps, Preview Profile)
```powershell
.\build-apks.ps1
```

### Single App Build
```powershell
# User App
.\build-apks.ps1 -AppName user

# Doctor App
.\build-apks.ps1 -AppName doctor

# Driver App
.\build-apks.ps1 -AppName driver

# Merchant App
.\build-apks.ps1 -AppName merchant
```

### Different Build Profiles
```powershell
# Development (rapid testing)
.\build-apks.ps1 -ProfileType development

# Preview (APK testing) - DEFAULT
.\build-apks.ps1 -ProfileType preview

# Production (Play Store ready)
.\build-apks.ps1 -ProfileType production
```

### Combine Options
```powershell
# Build Doctor app with development profile
.\build-apks.ps1 -AppName doctor -ProfileType development
```

---

## ⏱️ Expected Timeline

| Task | Duration | Notes |
|------|----------|-------|
| EAS Login | 1-2 min | One-time only |
| Build 1 app | 5-10 min | Cloud build on EAS |
| Build all 4 apps | 10-40 min | Sequential builds |
| APK Download | 1-5 min | Per APK file |

---

## 📱 Testing APKs

### Install on Device
```powershell
# First, connect device or start emulator
adb devices

# Install all APKs
adb install "d:\RushMedz App_Final\apks\rushmedz-user.apk"
adb install "d:\RushMedz App_Final\apks\rushmedz-doctor.apk"
adb install "d:\RushMedz App_Final\apks\rushmedz-driver.apk"
adb install "d:\RushMedz App_Final\apks\rushmedz-merchant.apk"
```

### Test Deep Linking
```powershell
# User app
adb shell am start -W -a android.intent.action.VIEW -d "rushmedz-user://home"

# Doctor app
adb shell am start -W -a android.intent.action.VIEW -d "rushmedz-doctor://consultations"

# Driver app
adb shell am start -W -a android.intent.action.VIEW -d "rushmedz-driver://deliveries"

# Merchant app
adb shell am start -W -a android.intent.action.VIEW -d "rushmedz-merchant://inventory"
```

---

## ❓ Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| "Not logged into EAS" | Run `eas login` first |
| Can't find eas.json | Files exist - they're already configured ✅ |
| Build failed on EAS | Check https://expo.dev/builds for error logs |
| Can't run script | Right-click PowerShell "Run as Administrator" |

---

## 📚 Detailed Documentation

- **[APK_GENERATION_QUICKSTART.md](./APK_GENERATION_QUICKSTART.md)** - Complete guide
- **[APK_BUILD_GUIDE.md](./APK_BUILD_GUIDE.md)** - Build prerequisites & troubleshooting
- **[ECOSYSTEM_CONFIGURATION_SUMMARY.md](./ECOSYSTEM_CONFIGURATION_SUMMARY.md)** - Technical details

---

## ✨ Summary

Your 4-app ecosystem is **fully configured and ready to build**. Just:
1. Run `eas login` (one-time)
2. Run `.\build-apks.ps1`
3. Download APKs from https://expo.dev/builds
4. Install & test on device

**Everything else has been pre-configured for you!** 🎉
