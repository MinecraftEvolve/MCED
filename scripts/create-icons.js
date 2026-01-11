const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const INPUT_LOGO = path.join(__dirname, '..', 'assets', 'logo.png');
const BUILD_DIR = path.join(__dirname, '..', 'build');
const ICONS_DIR = path.join(BUILD_DIR, 'icons');

// Ensure directories exist
if (!fs.existsSync(BUILD_DIR)) fs.mkdirSync(BUILD_DIR);
if (!fs.existsSync(ICONS_DIR)) fs.mkdirSync(ICONS_DIR);

async function createIcons() {
  console.log('Creating application icons from logo.png...');

  // Create icon.png (512x512)
  await sharp(INPUT_LOGO)
    .resize(512, 512)
    .png()
    .toFile(path.join(BUILD_DIR, 'icon.png'));
  console.log('✓ Created build/icon.png (512x512)');

  // Create Linux icons
  const linuxSizes = [16, 32, 48, 64, 128, 256, 512];
  for (const size of linuxSizes) {
    await sharp(INPUT_LOGO)
      .resize(size, size)
      .png()
      .toFile(path.join(ICONS_DIR, `${size}x${size}.png`));
    console.log(`✓ Created build/icons/${size}x${size}.png`);
  }

  // Create installer icons
  await sharp(INPUT_LOGO)
    .resize(256, 256)
    .png()
    .toFile(path.join(BUILD_DIR, 'installerIcon.png'));
  console.log('✓ Created build/installerIcon.png (256x256)');

  await sharp(INPUT_LOGO)
    .resize(150, 150)
    .png()
    .toFile(path.join(BUILD_DIR, 'installerSidebar.png'));
  console.log('✓ Created build/installerSidebar.png (150x150)');

  console.log('\nNow creating .ico and .icns files...');
  console.log('Please install:');
  console.log('  npm install -g png2icons');
  console.log('Then run:');
  console.log('  png2icons "build/icon.png" "build"');
  console.log('\nThis will create:');
  console.log('  - build/icon.ico (Windows)');
  console.log('  - build/icon.icns (macOS)');
}

createIcons().catch(console.error);
