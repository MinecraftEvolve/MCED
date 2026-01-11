#!/usr/bin/env node

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Minecraft Config Editor - Release Creator\n');

// Get current version from package.json
const packageJson = require('../package.json');
const currentVersion = packageJson.version;

console.log(`Current version: v${currentVersion}\n`);

rl.question('Enter new version (e.g., 1.0.1): ', (newVersion) => {
  if (!newVersion) {
    console.log('❌ Version is required');
    rl.close();
    return;
  }

  // Validate version format
  if (!/^\d+\.\d+\.\d+$/.test(newVersion)) {
    console.log('❌ Invalid version format. Use x.y.z (e.g., 1.0.1)');
    rl.close();
    return;
  }

  console.log(`\n📝 Creating release v${newVersion}...\n`);

  try {
    // Update package.json version
    console.log('1️⃣ Updating package.json...');
    execSync(`npm version ${newVersion} --no-git-tag-version`, { stdio: 'inherit' });

    // Stage changes
    console.log('2️⃣ Staging changes...');
    execSync('git add package.json package-lock.json', { stdio: 'inherit' });

    // Commit
    console.log('3️⃣ Committing changes...');
    execSync(`git commit -m "chore: bump version to ${newVersion}"`, { stdio: 'inherit' });

    // Create tag
    console.log('4️⃣ Creating git tag...');
    execSync(`git tag v${newVersion}`, { stdio: 'inherit' });

    // Push
    console.log('5️⃣ Pushing to GitHub...');
    execSync('git push', { stdio: 'inherit' });
    execSync('git push --tags', { stdio: 'inherit' });

    console.log(`\n✅ Release v${newVersion} created successfully!`);
    console.log(`\n🔗 GitHub Actions will now build the release for all platforms.`);
    console.log(`   View progress at: https://github.com/YOUR_USERNAME/MCED/actions\n`);

  } catch (error) {
    console.error('\n❌ Error creating release:', error.message);
    process.exit(1);
  }

  rl.close();
});
