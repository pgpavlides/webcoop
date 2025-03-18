/**
 * Simple script to clear browser data for development
 * Run this with: node clear-data.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Clearing Next.js cache and browser data...');

// Clear Next.js cache
try {
  const nextCacheDirs = [
    '.next/cache',
    'node_modules/.cache'
  ];
  
  nextCacheDirs.forEach(dir => {
    const fullPath = path.join(__dirname, dir);
    if (fs.existsSync(fullPath)) {
      console.log(`Removing ${dir}...`);
      fs.rmSync(fullPath, { recursive: true, force: true });
    }
  });
  
  console.log('Next.js cache cleared successfully');
} catch (err) {
  console.error('Error clearing Next.js cache:', err);
}

// Suggest browser data clearing
console.log('\n-----------------------------------------');
console.log('To fully clear browser data:');
console.log('\n1. Chrome: Open DevTools (F12) → Application tab → Clear storage → Clear site data');
console.log('\n2. Or open a new incognito window for testing');
console.log('-----------------------------------------\n');

// Update package.json to include a clean-start script
try {
  const packageJsonPath = path.join(__dirname, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Add clean-start script if it doesn't exist
    if (!packageJson.scripts['clean-start']) {
      packageJson.scripts['clean-start'] = 'node clear-data.js && npm run dev';
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log('Added "clean-start" script to package.json');
      console.log('You can now run "npm run clean-start" to clear cache and start the app');
    }
  }
} catch (err) {
  console.error('Error updating package.json:', err);
}

console.log('Done! You can now run "npm run dev" with a clean environment.');
