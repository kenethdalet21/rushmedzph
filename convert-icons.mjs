// SVG to PNG Icon Converter for RushMedz Apps
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const sharp = require('sharp');
import { readFile } from 'fs/promises';
import { join, basename } from 'path';

const apps = ['User_Customer', 'Doctor', 'Driver', 'Merchant'];

const iconSizes = {
  'icon.svg': { width: 1024, height: 1024 },
  'adaptive-icon.svg': { width: 1024, height: 1024 },
  'favicon.svg': { width: 48, height: 48 },
  'splash.svg': { width: 1284, height: 2778 },
  'splash-icon.svg': { width: 200, height: 200 },
};

async function convertSvgToPng(svgPath, pngPath, width, height) {
  try {
    const svgBuffer = await readFile(svgPath);
    await sharp(svgBuffer)
      .resize(width, height, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(pngPath);
    console.log(`  ✓ ${basename(pngPath)}`);
    return true;
  } catch (error) {
    console.error(`  ✗ ${basename(pngPath)}: ${error.message}`);
    return false;
  }
}

async function processApp(appName) {
  console.log(`\n📱 Processing ${appName}...`);
  const assetsDir = join(process.cwd(), `RushMedz ${appName}`, 'assets');
  
  let converted = 0;
  for (const [svgName, size] of Object.entries(iconSizes)) {
    const svgPath = join(assetsDir, svgName);
    const pngPath = join(assetsDir, svgName.replace('.svg', '.png'));
    
    try {
      await readFile(svgPath);
      if (await convertSvgToPng(svgPath, pngPath, size.width, size.height)) {
        converted++;
      }
    } catch {
      console.log(`  - Skipped ${svgName} (not found)`);
    }
  }
  return converted;
}

console.log('🎨 RushMedz SVG to PNG Icon Converter');
console.log('=====================================');

let totalConverted = 0;
for (const app of apps) {
  totalConverted += await processApp(app);
}

console.log(`\n✅ Converted ${totalConverted} icons total`);
