/* ═══════════════════════════════════════════════
   Statistical Field Station — Content Extractor
   ═══════════════════════════════════════════════
   ONE-TIME migration: reads existing stats_*.html
   files and extracts per-chapter CSS, content, and
   JS into build/css/, build/content/, build/js/.

   Run once: node build/extract.js
   ============================================== */

const fs = require('fs');
const path = require('path');

const ROOT = '.';
const BUILD = 'build';

// Ensure output directories exist
['build/content', 'build/css', 'build/js'].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// ── Find all chapter HTML files ──
const chapters = fs.readdirSync(ROOT)
  .filter(f => /^stats_\d{2}_.*\.html$/.test(f))
  .sort();

console.log(`Found ${chapters.length} chapter files.`);

for (const file of chapters) {
  const html = fs.readFileSync(file, 'utf8');
  const slug = file.replace('.html', '').replace('stats_', '');
  // e.g. "00_toolkit", "01_descriptive", ...

  console.log(`\n── ${file} → ${slug} ──`);

  // ── 1. Extract <style> block ──
  const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
  let css = '';
  if (styleMatch) {
    css = styleMatch[1].trim();
    // Remove leading/trailing blank lines
    css = css.replace(/^\n+/, '').replace(/\n+$/, '');
    fs.writeFileSync(path.join(BUILD, 'css', `stats_${slug}.css`), css + '\n');
    console.log(`  CSS: ${css.split('\n').length} lines → build/css/stats_${slug}.css`);
  }

  // ── 2. Extract body content (between </header> and <footer> or </div> end) ──
  // Find the closing </header> tag
  const headerEnd = html.indexOf('</header>');
  if (headerEnd === -1) {
    console.error(`  ERROR: No </header> found in ${file}`);
    continue;
  }

  // Find the content end — look for <footer> or the closing </div> before </body>
  let contentEnd = html.indexOf('<footer>', headerEnd);
  if (contentEnd === -1) {
    // No footer — content ends at </div> before </body>
    contentEnd = html.lastIndexOf('</div>');
  }
  if (contentEnd === -1) {
    console.error(`  ERROR: No content end found in ${file}`);
    continue;
  }

  let content = html.slice(headerEnd + '</header>'.length, contentEnd).trim();
  // Remove leading/trailing blank lines
  content = content.replace(/^\n+/, '').replace(/\n+$/, '');
  fs.writeFileSync(path.join(BUILD, 'content', `stats_${slug}.html`), content + '\n');
  console.log(`  Content: ${content.split('\n').length} lines → build/content/stats_${slug}.html`);

  // ── 3. Extract page-specific JS ──
  // Find the LAST <script> block (not a src-based vendor script)
  const scriptMatches = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
  let pageJs = '';

  for (let i = scriptMatches.length - 1; i >= 0; i--) {
    const attrs = scriptMatches[i][1];
    const body = scriptMatches[i][2].trim();
    // Skip vendor scripts (they have src=)
    if (attrs.includes('src=')) continue;
    // This is the page script
    pageJs = body;
    break;
  }

  if (pageJs) {
    // Remove the KaTeX render call (with optional guard)
    pageJs = pageJs.replace(
      /\/\/\s*=+\s*KaTeX Auto-Render\s*=+[\s\S]*?renderMathInElement\([^)]+\)\s*;?\s*/g,
      ''
    );
    // Remove CDN guard opening
    pageJs = pageJs.replace(
      /\/\/\s*=+\s*Dependency Load Guard\s*=+\s*\nif\s*\(typeof d3[^)]+\)\s*\{[\s\S]*?else\s*\{?\s*/g,
      ''
    );
    // Remove CDN guard closing
    pageJs = pageJs.replace(/\}\s*\/\/\s*End CDN guard\s*/g, '');
    // Remove standalone KaTeX render calls (no guard)
    pageJs = pageJs.replace(
      /if\s*\(\s*typeof\s+renderMathInElement\s*[^)]*\)\s*\{?\s*renderMathInElement\s*\([^)]+\)\s*;?\s*\}?\s*;?\s*/g,
      ''
    );
    // Remove bare renderMathInElement calls
    pageJs = pageJs.replace(
      /renderMathInElement\s*\(\s*document\.body\s*,\s*\{[\s\S]*?\}\s*\)\s*;?\s*/g,
      ''
    );
    // Clean up: remove leading/trailing whitespace, collapse multiple blank lines
    pageJs = pageJs.replace(/^\n+/, '').replace(/\n+$/, '');
    pageJs = pageJs.replace(/\n{3,}/g, '\n\n');
  }

  if (pageJs.trim()) {
    fs.writeFileSync(path.join(BUILD, 'js', `stats_${slug}.js`), pageJs.trim() + '\n');
    console.log(`  JS: ${pageJs.split('\n').length} lines → build/js/stats_${slug}.js`);
  } else {
    console.log(`  JS: (none — KaTeX-only page)`);
  }
}

// ── Also extract stats_tutorial.html ──
console.log('\n── stats_tutorial.html → home ──');
const tutHtml = fs.readFileSync('stats_tutorial.html', 'utf8');

// Extract <style> block
const tutStyleMatch = tutHtml.match(/<style>([\s\S]*?)<\/style>/);
if (tutStyleMatch) {
  let tutCss = tutStyleMatch[1].trim();
  tutCss = tutCss.replace(/^\n+/, '').replace(/\n+$/, '');
  fs.writeFileSync(path.join(BUILD, 'css', 'home.css'), tutCss + '\n');
  console.log(`  CSS: ${tutCss.split('\n').length} lines → build/css/home.css`);
}

// Extract body content — everything inside <div class="page">
const tutPageStart = tutHtml.indexOf('<div class="page">');
// Find </div> before </body> (handle both CRLF and LF)
const tutPageEndMatch = tutHtml.match(/<\/div>\r?\n<\/body>/);
const tutPageEnd = tutPageEndMatch ? tutPageEndMatch.index : -1;
if (tutPageStart !== -1 && tutPageEnd !== -1) {
  let tutContent = tutHtml.slice(
    tutPageStart + '<div class="page">'.length,
    tutPageEnd
  ).trim();
  tutContent = tutContent.replace(/^\r?\n+/, '').replace(/\r?\n+$/, '');
  fs.writeFileSync(path.join(BUILD, 'content', 'home.html'), tutContent + '\n');
  console.log(`  Content: ${tutContent.split('\n').length} lines → build/content/home.html`);
} else {
  console.error(`  ERROR: Could not extract home content (start=${tutPageStart}, end=${tutPageEnd})`);
}

console.log('\n✅ Extraction complete. Review build/content/*, build/css/*, build/js/*');
console.log('   Next: node build/build.js');
