const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const docsDir = path.join(rootDir, 'docs');

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  if (fs.existsSync(distDir)) {
    // 1. Ensure .nojekyll in dist
    fs.writeFileSync(path.join(distDir, '.nojekyll'), '');
    fs.writeFileSync(path.join(rootDir, '.nojekyll'), '');

    // 2. Ensure 404.html in dist for SPA routing on GitHub Pages
    const distIndexPath = path.join(distDir, 'index.html');
    if (fs.existsSync(distIndexPath)) {
      fs.copyFileSync(distIndexPath, path.join(distDir, '404.html'));
      fs.copyFileSync(distIndexPath, path.join(rootDir, '404.html'));
    }

    // 3. Populate docs/ directory for instant GitHub Pages (/docs) support
    if (fs.existsSync(docsDir)) {
      fs.rmSync(docsDir, { recursive: true, force: true });
    }
    copyDirRecursive(distDir, docsDir);
    fs.writeFileSync(path.join(docsDir, '.nojekyll'), '');

    // 4. Copy assets folder to root if needed
    const distAssets = path.join(distDir, 'assets');
    const rootAssets = path.join(rootDir, 'assets');
    if (fs.existsSync(distAssets)) {
      copyDirRecursive(distAssets, rootAssets);
    }

    // 5. Copy PWA and Service Worker files to root and docs
    const filesToSync = [
      'sw.js',
      'registerSW.js',
      'manifest.webmanifest',
      'favicon.ico',
      'icon.svg',
      'apple-touch-icon.png',
      'pwa-192x192.png',
      'pwa-512x512.png',
      'pwa-maskable-512x512.png',
    ];
    for (const f of filesToSync) {
      const srcF = path.join(distDir, f);
      if (fs.existsSync(srcF)) {
        fs.copyFileSync(srcF, path.join(rootDir, f));
        fs.copyFileSync(srcF, path.join(docsDir, f));
      }
    }

    // 6. Update root index.html with the compiled production assets for fallback
    try {
      const rootIndexFile = path.join(rootDir, 'index.html');
      if (fs.existsSync(rootIndexFile) && fs.existsSync(distAssets)) {
        const assetFiles = fs.readdirSync(distAssets);
        const jsBundle = assetFiles.find(f => f.startsWith('index-') && f.endsWith('.js'));
        const cssBundle = assetFiles.find(f => f.startsWith('index-') && f.endsWith('.css'));
        
        if (jsBundle && cssBundle) {
          let htmlContent = fs.readFileSync(rootIndexFile, 'utf8');
          htmlContent = htmlContent.replace(/var cssFile = "[^"]*";/, `var cssFile = "${cssBundle}";`);
          htmlContent = htmlContent.replace(/var jsFile = "[^"]*";/, `var jsFile = "${jsBundle}";`);
          fs.writeFileSync(rootIndexFile, htmlContent, 'utf8');
        }
      }
    } catch (e) {
      console.warn('Could not inject bundle hash to root index.html:', e.message);
    }

    console.log('✓ Successfully prepared GitHub Pages static build:');
    console.log('  - dist/ (with .nojekyll and 404.html for GitHub Actions / gh-pages)');
    console.log('  - docs/ (for direct branch deployment via main -> /docs)');
    console.log('  - 404.html & assets/ (root fallbacks)');
  }
} catch (err) {
  console.error('Error preparing GitHub Pages build:', err);
}
