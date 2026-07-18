/* ═══════════════════════════════════════════════
   Statistical Field Station — Asset Checker
   ═══════════════════════════════════════════════
   Verifies that vendor scripts, fonts, and other
   assets referenced in CSS/HTML actually exist.
   ============================================== */

const fs = require('fs');
const path = require('path');

let errors = 0;

function mustExist(relPath, label) {
  if (!fs.existsSync(relPath)) {
    console.error(`MISSING ${label}: ${relPath}`);
    errors++;
  }
}

// ── Vendor scripts ──
const vendorDir = 'assets/vendor';
const vendorFiles = fs.readdirSync(vendorDir);
console.log(`Vendor files: ${vendorFiles.length}`);

// Required vendor files
['katex.min.css', 'katex.min.js', 'auto-render.min.js', 'd3.v7.min.js', 'google-fonts.css']
  .forEach(f => mustExist(`${vendorDir}/${f}`, 'vendor'));

// ── Font files referenced in CSS ──
const fontExts = new Set(['.woff2', '.woff', '.ttf', '.otf']);
const cssFiles = ['google-fonts.css', 'katex.min.css'];
for (const cssFile of cssFiles) {
  const css = fs.readFileSync(`${vendorDir}/${cssFile}`, 'utf8');
  const urls = css.matchAll(/url\(['"]?([^'")]+)['"]?\)/g);
  for (const m of urls) {
    const fontPath = path.resolve(vendorDir, m[1]);
    if (!fs.existsSync(fontPath)) {
      console.error(`MISSING FONT: ${m[1]} (referenced in ${cssFile})`);
      errors++;
      continue;
    }
    // Defend against error-text files saved as fonts (min 1 KB for any real font)
    const stat = fs.statSync(fontPath);
    if (fontExts.has(path.extname(fontPath).toLowerCase()) && stat.size < 1000) {
      console.error(`SUSPICIOUS FONT: ${m[1]} is only ${stat.size} bytes — may be a text error page`);
      errors++;
    }
  }
}

// ── Core site assets ──
mustExist('assets/css/site.css', 'CSS');
mustExist('assets/js/statistics.js', 'JS');

// ── Scan all HTML for CDN guards, verify local fallbacks ──
const htmlFiles = fs.readdirSync('.').filter(f => f.endsWith('.html'));
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');

  // Check that KaTeX CSS is loaded before JS
  const katexCssIdx = html.indexOf('katex.min.css');
  const katexJsIdx = html.indexOf('katex.min.js');
  if (katexCssIdx !== -1 && katexJsIdx !== -1 && katexCssIdx > katexJsIdx) {
    console.error(`ORDER: KaTeX CSS should load before JS in ${file}`);
    errors++;
  }
}

if (errors === 0) {
  console.log('✅ All assets present and correctly ordered.');
} else {
  console.error(`❌ ${errors} asset issue(s) found.`);
  process.exitCode = 1;
}