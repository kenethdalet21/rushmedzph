# Branding Asset Specifications

Provide production-ready PNG assets at the following paths referenced by `app.json`:

- `assets/icon.png` (App Icon)
  - Size: 1024x1024 PNG (Expo will downscale automatically)
  - Transparent background recommended unless design requires full-bleed color.
  - Keep safe area padding ~10% around edges for rounded masks.

- `assets/adaptive-icon.png` (Android adaptive icon foreground)
  - Size: 1024x1024 PNG
  - Foreground graphic only (no background color fill); transparency around shape.
  - Avoid fine detail <6px for crisp rendering.

- Background color for adaptive icon: set in `app.json` (`#FFFFFF` currently). Adjust as needed.

- `assets/splash.png` (Splash Screen)
  - Recommended Size: 1280x1280 (will scale for various screens)
  - Centered logo on solid background or subtle gradient.
  - Keep key artwork within central 60% area.

- `assets/favicon.png` (Web Favicon)
  - Size: 512x512 PNG (will be downscaled for tab icons).
  - Simplified version of main icon with high contrast.

## Design Guidelines
- Primary Color: `#FF6B6B` (used in header) — consider incorporating.
- Secondary Neutral: `#FFFFFF` / `#F8F9FA` backgrounds.
- Accent: Use minimal gradients; flat color works well across platforms.
- Typography inside icons generally discouraged; prefer symbolic mark.

## Replacement Workflow
1. Add/replace PNG files at specified paths.
2. Run:
```powershell
$env:EXPO_PUBLIC_API_BASE_URL='http://localhost:8085'; npm start
```
3. Clear Metro cache if assets not updating:
```powershell
$env:EXPO_PUBLIC_API_BASE_URL='http://localhost:8085'; npx expo start -c
```

## Optional Future Enhancements
- Add dark-mode friendly splash variant using `plugins` or conditional theming.
- Provide SVG source in `assets/source/` for future editing and export.

## Verification Checklist
- Icon displays correctly in Expo Go.
- Splash shows centered logo without cropping.
- Android adaptive icon renders circular and squircle shapes cleanly.
- Favicon appears in browser tab when running web build.

Update the background/adaptive colors in `app.json` if the palette changes.
