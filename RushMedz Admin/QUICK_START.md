# 🚀 Quick Start Guide - Standalone Apps

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Install EAS CLI

```bash
npm install -g eas-cli
```

### 3. Login to EAS

```bash
eas login
```

### 4. Generate App Assets

```bash
node scripts/generate-app-assets.js
```

---

## Development

### Run Individual Apps Locally

```bash
# User App
npm run start:user

# Merchant App
npm run start:merchant

# Driver App
npm run start:driver

# Doctor App
npm run start:doctor

# Admin App
npm run start:admin
```

Then press:
- `a` for Android
- `i` for iOS
- `w` for Web

---

## Building for Production

### Android APK (Local Build - Fast)

```bash
node scripts/build-local-android.js user
node scripts/build-local-android.js merchant
node scripts/build-local-android.js driver
node scripts/build-local-android.js doctor
node scripts/build-local-android.js admin
```

**Output:** `./builds/<app-type>/<app-type>-app.apk`

### Android AAB (Play Store)

```bash
npm run build:user:android
npm run build:merchant:android
npm run build:driver:android
npm run build:doctor:android
npm run build:admin:android
```

### iOS IPA (App Store)

```bash
npm run build:user:ios
npm run build:merchant:ios
npm run build:driver:ios
npm run build:doctor:ios
npm run build:admin:ios
```

### Build All Apps at Once

```bash
# All Android apps
npm run build:all:android

# All iOS apps
npm run build:all:ios
```

---

## Testing Builds

### Preview Builds (for internal testing)

```bash
npm run build:user:preview
npm run build:merchant:preview
npm run build:driver:preview
npm run build:doctor:preview
npm run build:admin:preview
```

---

## App Information

| App | Package ID | Color | Store Name |
|-----|-----------|-------|-----------|
| User | com.epharma.user | Blue #45B7D1 | Epharma User |
| Merchant | com.epharma.merchant | Green #27AE60 | Epharma Merchant |
| Driver | com.epharma.driver | Purple #9B59B6 | Epharma Driver |
| Doctor | com.epharma.doctor | Red #E74C3C | Epharma Doctor |
| Admin | com.epharma.admin | Orange #F39C12 | Epharma Admin |

---

## Publishing to Stores

### Google Play Store

1. Build production AAB:
   ```bash
   npm run build:user:android
   ```

2. Download from EAS Dashboard

3. Upload to Google Play Console

**OR** use automated submission:
```bash
eas submit --platform android --profile user
```

### Apple App Store

1. Build production IPA:
   ```bash
   npm run build:user:ios
   ```

2. Download from EAS Dashboard

3. Upload via Transporter or App Store Connect

**OR** use automated submission:
```bash
eas submit --platform ios --profile user
```

---

## Over-The-Air (OTA) Updates

For JavaScript-only changes (no native code):

```bash
eas update --branch user-production --message "Bug fixes"
eas update --branch merchant-production --message "New features"
eas update --branch driver-production --message "UI improvements"
```

---

## Troubleshooting

### Assets Not Found
```bash
node scripts/generate-app-assets.js
```

### Build Fails - Clear Cache
```bash
npm start -- --clear
```

### Android Gradle Issues
```bash
cd android
./gradlew clean
cd ..
```

### iOS Pod Issues
```bash
cd ios
pod install
cd ..
```

---

## Configuration Files

- **App Configs:** `./app-configs/app.<type>.json`
- **Build Profiles:** `./eas.json`
- **Build Scripts:** `./scripts/`
- **Assets:** `./assets/images/`

---

## Support

- Full Documentation: [BUILD_PUBLISH_GUIDE.md](./BUILD_PUBLISH_GUIDE.md)
- EAS Docs: https://docs.expo.dev/eas/
- Issues: Create a GitHub issue

---

## Checklist Before Publishing

- [ ] Update version numbers in all app configs
- [ ] Replace placeholder assets with custom designs
- [ ] Test on physical iOS device
- [ ] Test on physical Android device
- [ ] Update app descriptions and store listings
- [ ] Add screenshots for all screen sizes
- [ ] Set up privacy policy URL
- [ ] Configure in-app purchases (if needed)
- [ ] Set up crash reporting
- [ ] Set up analytics
- [ ] Review permissions
- [ ] Test on slow networks
- [ ] Test offline functionality
- [ ] Review app store guidelines

---

**Happy Building! 🎉**
