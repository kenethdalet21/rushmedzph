# App Assets

This directory contains icons and splash screens for each app.

## Generated Assets

- **Icons** (1024x1024): App launcher icons
- **Splash Screens** (1284x2778): Launch screen images
- **Adaptive Icons** (1024x1024): Android adaptive icons

## Apps

1. **User App** - Blue (#45B7D1)
2. **Merchant App** - Green (#27AE60)
3. **Driver App** - Purple (#9B59B6)
4. **Doctor App** - Red (#E74C3C)
5. **Admin App** - Orange (#F39C12)

## Customization

Replace these placeholder SVG files with your custom designs:
- Use the same filenames
- Maintain the specified dimensions
- Export as PNG for production builds

## Converting to PNG

Use this command to convert SVG to PNG:

```bash
# For icons (1024x1024)
npx sharp-cli -i icon-user.svg -o icon-user.png --width 1024 --height 1024

# For splash screens (1284x2778)
npx sharp-cli -i splash-user.svg -o splash-user.png --width 1284 --height 2778
```

Or use online tools like:
- https://convertio.co/svg-png/
- https://cloudconvert.com/svg-to-png
