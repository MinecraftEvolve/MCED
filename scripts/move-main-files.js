const fs = require('fs');
const path = require('path');

// Move files from dist/main/main to dist/main
const sourceDir = path.join(__dirname, '..', 'dist', 'main', 'main');
const targetDir = path.join(__dirname, '..', 'dist', 'main');

if (fs.existsSync(sourceDir)) {
  const files = fs.readdirSync(sourceDir);
  
  files.forEach(file => {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);
    
    // Move file
    fs.renameSync(sourcePath, targetPath);
  });
  
  // Remove empty main directory
  fs.rmdirSync(sourceDir);
  
  // Remove renderer directory if it exists (types aren't needed in dist)
  const rendererDir = path.join(targetDir, 'renderer');
  if (fs.existsSync(rendererDir)) {
    fs.rmSync(rendererDir, { recursive: true, force: true });
  }
  
  console.log('✅ Main files moved to dist/main/');
} else {
  console.log('⚠️  No main folder found in dist/main/');
}
