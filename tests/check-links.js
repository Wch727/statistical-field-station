/* ═══════════════════════════════════════════════
   Statistical Field Station — Link Checker
   ═══════════════════════════════════════════════
   Scans all HTML files for broken internal links,
   missing stylesheets, scripts, and images.
   ============================================== */

const fs = require('fs');
const path = require('path');

const HTML_FILES = fs.readdirSync('.')
  .filter(f => f.endsWith('.html'));

let errors = 0;

function checkExists(refPath, sourceFile, type) {
  // Skip external / CDN URLs
  if (refPath.startsWith('http://') || refPath.startsWith('https://') ||
      refPath.startsWith('//') || refPath.startsWith('#')) return;
  // Skip mailto/tel
  if (refPath.startsWith('mailto:') || refPath.startsWith('tel:')) return;
  // Skip fragment-only links
  if (refPath.startsWith('#')) return;

  const resolved = path.resolve(refPath);
  if (!fs.existsSync(resolved)) {
    console.error(`BROKEN ${type}: ${refPath} in ${sourceFile}`);
    errors++;
  }
}

for (const file of HTML_FILES) {
  const html = fs.readFileSync(file, 'utf8');

  // <link href="...">
  const links = html.matchAll(/<link\s[^>]*href=["']([^"']+)["']/gi);
  for (const m of links) checkExists(m[1], file, 'LINK');

  // <script src="...">
  const scripts = html.matchAll(/<script\s[^>]*src=["']([^"']+)["']/gi);
  for (const m of scripts) checkExists(m[1], file, 'SCRIPT');

  // <img src="...">
  const imgs = html.matchAll(/<img\s[^>]*src=["']([^"']+)["']/gi);
  for (const m of imgs) checkExists(m[1], file, 'IMG');

  // <a href="..."> (only internal links to other HTML files)
  const anchors = html.matchAll(/<a\s[^>]*href=["']([^"']+)["']/gi);
  for (const m of anchors) {
    const href = m[1];
    if (href.startsWith('#') && href.length > 1) {
      // Check fragment targets exist in the same file
      const id = href.slice(1);
      if (!html.includes(`id="${id}"`) && !html.includes(`id='${id}'`)) {
        console.error(`BROKEN ANCHOR: ${href} not found in ${file}`);
        errors++;
      }
    }
    // Skip external links for href
    if (href.startsWith('http') || href.startsWith('//')) continue;
    if (href.startsWith('#')) continue;
    // Check internal page links
    if (href.endsWith('.html')) checkExists(href, file, 'ANCHOR');
  }
}

if (errors === 0) {
  console.log(`✅ All links valid across ${HTML_FILES.length} HTML files.`);
} else {
  console.error(`❌ ${errors} broken link(s) found.`);
  process.exitCode = 1;
}