const pngToIco = require('png-to-ico');
const fs = require('fs');
const path = require('path');

async function createIcon() {
  try {
    const inputPath = path.join(__dirname, '../build/icon.png');
    const outputPath = path.join(__dirname, '../build/icon.ico');

    console.log('Creating ICO file from PNG...');
    const icoBuffer = await pngToIco(inputPath);
    
    fs.writeFileSync(outputPath, icoBuffer);
    console.log('✓ ICO file created successfully at:', outputPath);
  } catch (error) {
    console.error('Error creating ICO file:', error);
    process.exit(1);
  }
}

createIcon();
