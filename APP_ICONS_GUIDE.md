# 🎨 RushMedz App Icons Update Guide

## Quick Start

### Method 1: Use the Icon Generator (Recommended)

1. **Open the icon generator** in your browser:
   ```
   icon-generator.html
   ```

2. **Click "Download All Icons"** for each app:
   - User App (Green - #10B981)
   - Doctor App (Blue - #3B82F6)
   - Driver App (Amber - #F59E0B)
   - Merchant App (Purple - #8B5CF6)

3. **Rename and copy the downloaded files** to each app's assets folder

### Method 2: Manual Icon Creation

Use design tools like Figma, Canva, or Adobe XD to create custom icons.

---

## 📱 Icon Specifications

| Icon Type | Size | Purpose | File Name |
|-----------|------|---------|-----------|
| **App Icon** | 1024×1024 | Main app icon for stores | `icon.png` |
| **Adaptive Icon** | 1024×1024 | Android adaptive icon foreground | `adaptive-icon.png` |
| **Splash Screen** | 2048×2048 | App loading screen | `splash.png` |
| **Favicon** | 48×48 | Web browser tab icon | `favicon.png` |

---

## 🎨 App Color Scheme

| App | Primary Color | Secondary Color | Description |
|-----|---------------|-----------------|-------------|
| **User** | `#10B981` (Emerald) | `#059669` | Customer ordering app |
| **Doctor** | `#3B82F6` (Blue) | `#2563EB` | Doctor consultation app |
| **Driver** | `#F59E0B` (Amber) | `#D97706` | Delivery driver app |
| **Merchant** | `#8B5CF6` (Purple) | `#7C3AED` | Pharmacy merchant app |

---

## 📁 File Locations

Copy the generated icons to these locations:

```
RushMedz App_Final/
├── RushMedz User_Customer/
│   └── assets/
│       ├── icon.png           ← User App icon
│       ├── adaptive-icon.png  ← Android adaptive
│       ├── splash.png         ← Splash screen
│       └── favicon.png        ← Web favicon
│
├── RushMedz Doctor/
│   └── assets/
│       ├── icon.png           ← Doctor App icon
│       ├── adaptive-icon.png
│       ├── splash.png
│       └── favicon.png
│
├── RushMedz Driver/
│   └── assets/
│       ├── icon.png           ← Driver App icon
│       ├── adaptive-icon.png
│       ├── splash.png
│       └── favicon.png
│
└── RushMedz Merchant/
    └── assets/
        ├── icon.png           ← Merchant App icon
        ├── adaptive-icon.png
        ├── splash.png
        └── favicon.png
```

---

## ⚙️ app.json Configuration

Each app's `app.json` should reference these icons:

```json
{
  "expo": {
    "icon": "./assets/icon.png",
    "favicon": "./assets/favicon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#FFFFFF"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      }
    }
  }
}
```

---

## 🔧 After Updating Icons

### 1. Clear Build Cache
```powershell
# For each app directory
npx expo prebuild --clean
```

### 2. Rebuild the APK
```powershell
# Development build
eas build --platform android --profile development

# Production build
eas build --platform android --profile production
```

### 3. Verify Icons
- Check the APK icon in your file manager
- Install and verify the app icon on device
- Verify splash screen displays correctly

---

## 🎯 Icon Design Guidelines

### Do's ✅
- Use high contrast for visibility
- Keep design simple and recognizable
- Include the RushMedz brand elements
- Use the medical cross symbol
- Test on different backgrounds

### Don'ts ❌
- Don't use thin lines (won't be visible at small sizes)
- Don't add too much detail
- Don't use gradients that blend into backgrounds
- Don't use text that's too small to read

---

## 📐 Android Adaptive Icon Notes

Android adaptive icons use a **foreground** and **background** layer:

- **Foreground**: Your icon design (adaptive-icon.png)
- **Background**: Solid color (set in app.json)

The system may crop the icon into different shapes (circle, square, rounded square, etc.)

**Safe zone**: Keep important content within the center **66%** of the icon

```
┌─────────────────────┐
│                     │
│   ┌───────────┐     │
│   │           │     │
│   │  SAFE     │     │ ← Keep content here
│   │  ZONE     │     │
│   │           │     │
│   └───────────┘     │
│                     │
└─────────────────────┘
```

---

## 🚀 Quick Copy Commands

After downloading icons from the generator, use these commands:

```powershell
# Copy User App icons
Copy-Item "User_Customer-icon.png" "RushMedz User_Customer\assets\icon.png"
Copy-Item "User_Customer-adaptive-icon.png" "RushMedz User_Customer\assets\adaptive-icon.png"
Copy-Item "User_Customer-splash.png" "RushMedz User_Customer\assets\splash.png"
Copy-Item "User_Customer-favicon.png" "RushMedz User_Customer\assets\favicon.png"

# Copy Doctor App icons
Copy-Item "Doctor-icon.png" "RushMedz Doctor\assets\icon.png"
Copy-Item "Doctor-adaptive-icon.png" "RushMedz Doctor\assets\adaptive-icon.png"
Copy-Item "Doctor-splash.png" "RushMedz Doctor\assets\splash.png"
Copy-Item "Doctor-favicon.png" "RushMedz Doctor\assets\favicon.png"

# Copy Driver App icons
Copy-Item "Driver-icon.png" "RushMedz Driver\assets\icon.png"
Copy-Item "Driver-adaptive-icon.png" "RushMedz Driver\assets\adaptive-icon.png"
Copy-Item "Driver-splash.png" "RushMedz Driver\assets\splash.png"
Copy-Item "Driver-favicon.png" "RushMedz Driver\assets\favicon.png"

# Copy Merchant App icons
Copy-Item "Merchant-icon.png" "RushMedz Merchant\assets\icon.png"
Copy-Item "Merchant-adaptive-icon.png" "RushMedz Merchant\assets\adaptive-icon.png"
Copy-Item "Merchant-splash.png" "RushMedz Merchant\assets\splash.png"
Copy-Item "Merchant-favicon.png" "RushMedz Merchant\assets\favicon.png"
```

---

## 📝 Files Created

| File | Purpose |
|------|---------|
| `icon-generator.html` | Interactive icon generator - open in browser |
| `generate-icons.ps1` | PowerShell script to generate SVG icons |
| `app-icons/` | Directory containing generated SVG files |
| `APP_ICONS_GUIDE.md` | This documentation file |

---

## Need Help?

1. **Icons not updating?** → Run `npx expo prebuild --clean`
2. **Wrong colors?** → Check the gradient in icon-generator.html
3. **Blurry icons?** → Ensure source files are 1024×1024 or larger
4. **Adaptive icon cropped wrong?** → Keep content in the center 66%
