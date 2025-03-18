/**
 * Script to completely reset the app state
 * Run this when you get stuck at loading: node reset-app.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧹 Resetting application state...');

// Directories to clean
const dirsToClean = [
  '.next',
  'node_modules/.cache'
];

// Clean directories
dirsToClean.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (fs.existsSync(fullPath)) {
    console.log(`  - Removing ${dir}...`);
    fs.rmSync(fullPath, { recursive: true, force: true });
  }
});

// Kill any running Next.js processes
try {
  console.log('  - Stopping any running Next.js processes...');
  
  if (process.platform === 'win32') {
    // Windows
    execSync('taskkill /f /im node.exe', { stdio: 'ignore' });
  } else {
    // Linux/Mac
    execSync('pkill -f "node.*next"', { stdio: 'ignore' });
  }
} catch (err) {
  // It's okay if this fails
  console.log('    (No processes needed to be stopped)');
}

// Create a clean start script
console.log('\n🚀 Creating a clean start script...');

try {
  const packageJsonPath = path.join(__dirname, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Add reset script if it doesn't exist
    packageJson.scripts = packageJson.scripts || {};
    packageJson.scripts['reset'] = 'node reset-app.js';
    packageJson.scripts['fresh'] = 'node reset-app.js && npm install && npm run dev';
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('  - Added "npm run reset" and "npm run fresh" commands to package.json');
  }
} catch (err) {
  console.error('  - Error updating package.json:', err);
}

console.log('\n✅ Reset complete!');
console.log('\nTo fix the loading issue:');
console.log('1. Run "npm install" to reinstall dependencies');
console.log('2. Run "npm run dev" to start the development server');
console.log('3. Open a new incognito browser window to test');
console.log('\nOr simply run "npm run fresh" to do all of the above at once');
