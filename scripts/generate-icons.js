const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const INPUT_IMAGE = 'C:\\Users\\Luke\\Downloads\\LogoConfigEditor.png';
const OUTPUT_DIR = path.join(__dirname, '../assets');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Icon sizes needed
const sizes = [
  // Windows icons
  { name: 'icon.ico', sizes: [16, 24, 32, 48, 64, 128, 256], format: 'ico' },
  
  // macOS icons
  { name: 'icon.icns', sizes: [16, 32, 64, 128, 256, 512, 1024], format: 'icns' },
  
  // Linux and web icons
  { name: 'icon_16x16.png', size: 16, format: 'png' },
  { name: 'icon_24x24.png', size: 24, format: 'png' },
  { name: 'icon_32x32.png', size: 32, format: 'png' },
  { name: 'icon_48x48.png', size: 48, format: 'png' },
  { name: 'icon_64x64.png', size: 64, format: 'png' },
  { name: 'icon_96x96.png', size: 96, format: 'png' },
  { name: 'icon_128x128.png', size: 128, format: 'png' },
  { name: 'icon_256x256.png', size: 256, format: 'png' },
  { name: 'icon_512x512.png', size: 512, format: 'png' },
  { name: 'icon_1024x1024.png', size: 1024, format: 'png' },
  
  // Main icon
  { name: 'icon.png', size: 512, format: 'png' },
  
  // Installer graphics
  { name: 'installerIcon.ico', sizes: [256], format: 'ico' },
  { name: 'installerHeaderIcon.ico', sizes: [256], format: 'ico' },
];

async function generateIcons() {
  console.log('🎨 Starting icon generation...\n');

  // Check if input file exists
  if (!fs.existsSync(INPUT_IMAGE)) {
    console.error(`❌ Input image not found: ${INPUT_IMAGE}`);
    console.log('Please place your logo at C:\\Users\\Luke\\Downloads\\LogoConfigEditor.png');
    process.exit(1);
  }

  for (const config of sizes) {
    try {
      const outputPath = path.join(OUTPUT_DIR, config.name);

      if (config.format === 'ico') {
        // For ICO files, we need to use png2icons or similar
        // For now, create the largest size as PNG
        const largestSize = Math.max(...config.sizes);
        await sharp(INPUT_IMAGE)
          .resize(largestSize, largestSize, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .png()
          .toFile(outputPath.replace('.ico', '.png'));
        console.log(`✅ Created ${config.name.replace('.ico', '.png')} (${largestSize}x${largestSize})`);
      } else if (config.format === 'icns') {
        // For ICNS, create PNG versions
        // macOS will need these converted properly
        const largestSize = Math.max(...config.sizes);
        await sharp(INPUT_IMAGE)
          .resize(largestSize, largestSize, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .png()
          .toFile(outputPath.replace('.icns', '.png'));
        console.log(`✅ Created ${config.name.replace('.icns', '.png')} (${largestSize}x${largestSize})`);
      } else {
        // PNG files
        await sharp(INPUT_IMAGE)
          .resize(config.size, config.size, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .png()
          .toFile(outputPath);
        console.log(`✅ Created ${config.name} (${config.size}x${config.size})`);
      }
    } catch (error) {
      console.error(`❌ Error creating ${config.name}:`, error.message);
    }
  }

  console.log('\n✨ Icon generation complete!');
  console.log('\n📝 Note: For ICO and ICNS files, you may need to use specialized tools:');
  console.log('   - ICO: Use png2icons or electron-icon-builder');
  console.log('   - ICNS: Use iconutil on macOS or png2icons');
}

generateIcons().catch(console.error);
