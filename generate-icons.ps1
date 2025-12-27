# RushMedz App Icons Generator
# This script creates placeholder icons for each app
# For production, replace with professionally designed icons

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   RushMedz App Icons Generator" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if ImageMagick is available (for PNG generation)
$hasImageMagick = Get-Command "magick" -ErrorAction SilentlyContinue

if (-not $hasImageMagick) {
    Write-Host "Note: ImageMagick not found. SVG files will be created." -ForegroundColor Yellow
    Write-Host "Install ImageMagick to auto-convert SVG to PNG." -ForegroundColor Yellow
    Write-Host ""
}

# Create icons directory if not exists
$iconsDir = ".\app-icons"
if (-not (Test-Path $iconsDir)) {
    New-Item -ItemType Directory -Path $iconsDir | Out-Null
}

# App configurations with colors and icons
$apps = @(
    @{
        Name = "User_Customer"
        DisplayName = "User"
        Color = "#10B981"  # Emerald green
        DarkColor = "#059669"
        Icon = "shopping-bag"
        Letter = "U"
    },
    @{
        Name = "Doctor"
        DisplayName = "Doctor"
        Color = "#3B82F6"  # Blue
        DarkColor = "#2563EB"
        Icon = "stethoscope"
        Letter = "D"
    },
    @{
        Name = "Driver"
        DisplayName = "Driver"
        Color = "#F59E0B"  # Amber
        DarkColor = "#D97706"
        Icon = "truck"
        Letter = "R"
    },
    @{
        Name = "Merchant"
        DisplayName = "Merchant"
        Color = "#8B5CF6"  # Purple
        DarkColor = "#7C3AED"
        Icon = "store"
        Letter = "M"
    }
)

foreach ($app in $apps) {
    Write-Host "Creating icons for RushMedz $($app.DisplayName)..." -ForegroundColor Green
    
    $appIconsDir = "$iconsDir\$($app.Name)"
    if (-not (Test-Path $appIconsDir)) {
        New-Item -ItemType Directory -Path $appIconsDir | Out-Null
    }
    
    # Create main icon SVG (1024x1024 for app stores)
    $iconSvg = @"
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg-$($app.Name)" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:$($app.Color);stop-opacity:1" />
      <stop offset="100%" style="stop-color:$($app.DarkColor);stop-opacity:1" />
    </linearGradient>
    <filter id="shadow-$($app.Name)" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="20" flood-color="#000000" flood-opacity="0.3"/>
    </filter>
  </defs>
  
  <!-- Background with rounded corners -->
  <rect x="0" y="0" width="1024" height="1024" rx="220" ry="220" fill="url(#bg-$($app.Name))"/>
  
  <!-- Inner shadow effect -->
  <rect x="40" y="40" width="944" height="944" rx="190" ry="190" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
  
  <!-- Medical cross symbol -->
  <g filter="url(#shadow-$($app.Name))">
    <rect x="452" y="200" width="120" height="320" rx="20" fill="white" opacity="0.95"/>
    <rect x="352" y="300" width="320" height="120" rx="20" fill="white" opacity="0.95"/>
  </g>
  
  <!-- RushMedz text -->
  <text x="512" y="620" font-family="Arial, Helvetica, sans-serif" font-size="100" font-weight="bold" fill="white" text-anchor="middle" opacity="0.95">RushMedz</text>
  
  <!-- App type indicator -->
  <text x="512" y="720" font-family="Arial, Helvetica, sans-serif" font-size="70" font-weight="600" fill="white" text-anchor="middle" opacity="0.85">$($app.DisplayName)</text>
  
  <!-- Pill/capsule icon at bottom -->
  <g transform="translate(512, 850)" opacity="0.9">
    <ellipse cx="-60" cy="0" rx="50" ry="25" fill="white"/>
    <ellipse cx="60" cy="0" rx="50" ry="25" fill="rgba(255,255,255,0.7)"/>
    <rect x="-60" y="-25" width="120" height="50" fill="white"/>
    <rect x="0" y="-25" width="60" height="50" fill="rgba(255,255,255,0.7)"/>
  </g>
</svg>
"@
    
    $iconSvg | Out-File -FilePath "$appIconsDir\icon.svg" -Encoding UTF8
    
    # Create adaptive icon foreground (Android)
    $adaptiveSvg = @"
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <!-- Transparent background for adaptive icon -->
  <rect x="0" y="0" width="1024" height="1024" fill="transparent"/>
  
  <!-- Medical cross symbol centered -->
  <g transform="translate(0, -50)">
    <rect x="452" y="280" width="120" height="320" rx="20" fill="$($app.Color)"/>
    <rect x="352" y="380" width="320" height="120" rx="20" fill="$($app.Color)"/>
  </g>
  
  <!-- RushMedz text -->
  <text x="512" y="700" font-family="Arial, Helvetica, sans-serif" font-size="90" font-weight="bold" fill="$($app.Color)" text-anchor="middle">RushMedz</text>
  
  <!-- App type -->
  <text x="512" y="790" font-family="Arial, Helvetica, sans-serif" font-size="60" font-weight="600" fill="$($app.DarkColor)" text-anchor="middle">$($app.DisplayName)</text>
</svg>
"@
    
    $adaptiveSvg | Out-File -FilePath "$appIconsDir\adaptive-icon.svg" -Encoding UTF8
    
    # Create splash screen icon
    $splashSvg = @"
<svg xmlns="http://www.w3.org/2000/svg" width="2048" height="2048" viewBox="0 0 2048 2048">
  <!-- White/light background -->
  <rect x="0" y="0" width="2048" height="2048" fill="#FFFFFF"/>
  
  <!-- Medical cross symbol -->
  <g transform="translate(1024, 800)">
    <rect x="-60" y="-160" width="120" height="320" rx="20" fill="$($app.Color)"/>
    <rect x="-160" y="-60" width="320" height="120" rx="20" fill="$($app.Color)"/>
  </g>
  
  <!-- RushMedz branding -->
  <text x="1024" y="1200" font-family="Arial, Helvetica, sans-serif" font-size="120" font-weight="bold" fill="$($app.Color)" text-anchor="middle">RushMedz</text>
  
  <!-- App name -->
  <text x="1024" y="1320" font-family="Arial, Helvetica, sans-serif" font-size="80" font-weight="600" fill="$($app.DarkColor)" text-anchor="middle">$($app.DisplayName) App</text>
  
  <!-- Tagline -->
  <text x="1024" y="1420" font-family="Arial, Helvetica, sans-serif" font-size="50" fill="#666666" text-anchor="middle">Your Health, Delivered</text>
</svg>
"@
    
    $splashSvg | Out-File -FilePath "$appIconsDir\splash.svg" -Encoding UTF8
    
    # Create favicon
    $faviconSvg = @"
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <defs>
    <linearGradient id="fav-$($app.Name)" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:$($app.Color);stop-opacity:1" />
      <stop offset="100%" style="stop-color:$($app.DarkColor);stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="48" height="48" rx="10" fill="url(#fav-$($app.Name))"/>
  <rect x="21" y="10" width="6" height="16" rx="2" fill="white"/>
  <rect x="16" y="15" width="16" height="6" rx="2" fill="white"/>
  <text x="24" y="40" font-family="Arial" font-size="10" font-weight="bold" fill="white" text-anchor="middle">$($app.Letter)</text>
</svg>
"@
    
    $faviconSvg | Out-File -FilePath "$appIconsDir\favicon.svg" -Encoding UTF8
    
    Write-Host "  Created SVG icons in $appIconsDir" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Icon Generation Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Convert SVG files to PNG using one of these methods:" -ForegroundColor White
Write-Host "   - Online: https://cloudconvert.com/svg-to-png" -ForegroundColor Gray
Write-Host "   - Online: https://svgtopng.com/" -ForegroundColor Gray
Write-Host "   - Figma/Canva: Import SVG and export as PNG" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Required PNG sizes:" -ForegroundColor White
Write-Host "   - icon.png: 1024x1024 (app store icon)" -ForegroundColor Gray
Write-Host "   - adaptive-icon.png: 1024x1024 (Android adaptive)" -ForegroundColor Gray
Write-Host "   - splash.png: 2048x2048 (splash screen)" -ForegroundColor Gray
Write-Host "   - favicon.png: 48x48 (web favicon)" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Copy PNGs to each app's assets folder:" -ForegroundColor White
Write-Host "   - RushMedz User_Customer/assets/" -ForegroundColor Gray
Write-Host "   - RushMedz Doctor/assets/" -ForegroundColor Gray
Write-Host "   - RushMedz Driver/assets/" -ForegroundColor Gray
Write-Host "   - RushMedz Merchant/assets/" -ForegroundColor Gray
Write-Host ""
