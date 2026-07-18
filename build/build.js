/* ═══════════════════════════════════════════════
   Statistical Field Station — Build Script
   ═══════════════════════════════════════════════
   Reads templates + chapters.json + content/css/js
   from build/ and assembles final HTML at root.

   Usage: node build/build.js
   ============================================== */

const fs = require('fs');
const path = require('path');

const BUILD = 'build';
const ROOT = '.';

// ── Read templates ──
const chapterTemplate = fs.readFileSync(path.join(BUILD, 'template.html'), 'utf8');
const homeTemplate = fs.readFileSync(path.join(BUILD, 'home-template.html'), 'utf8');

// ── Read chapter metadata ──
const chapters = JSON.parse(fs.readFileSync(path.join(BUILD, 'chapters.json'), 'utf8'));

// ── Helper: read file, return '' if missing ──
function readIfExists(filePath) {
  try { return fs.readFileSync(filePath, 'utf8').trim(); }
  catch { return ''; }
}

// ── Build chapter link HTML ──
function prevLink(ch) {
  if (!ch.prev) return '';
  const prev = chapters.find(c => c.slug === ch.prev);
  if (!prev) return '';
  return `<a href="${prev.file}">← ${prev.num} ${prev.short}</a> &nbsp;|&nbsp; `;
}

function nextLink(ch) {
  if (!ch.next) return '';
  const next = chapters.find(c => c.slug === ch.next);
  if (!next) return '';
  return ` &nbsp;|&nbsp; 下一章：<a href="${next.file}">${next.num} ${next.short} →</a>`;
}

// ── Build all chapter pages ──
console.log('Building chapter pages...');
let built = 0;

for (const ch of chapters) {
  const slug = ch.slug;
  const cssContent = readIfExists(path.join(BUILD, 'css', `stats_${slug}.css`));
  const bodyContent = readIfExists(path.join(BUILD, 'content', `stats_${slug}.html`));
  const jsContent = readIfExists(path.join(BUILD, 'js', `stats_${slug}.js`));

  // Build CSS block
  const pageCss = cssContent ? `<style>\n${cssContent}\n</style>` : '';

  // Build JS block (inside CDN guard)
  const pageJs = jsContent ? `\n${jsContent}\n` : '';

  // Build prev/next links
  const prev = prevLink(ch);
  const next = nextLink(ch);

  // Substitute placeholders
  let html = chapterTemplate
    .replace('{{TITLE}}', `${ch.num} ${ch.title}`)
    .replace('{{CHAPTER_NUM}}', ch.num)
    .replace('{{CHAPTER_SHORT}}', ch.short)
    .replace('{{CHAPTER_TITLE}}', ch.title)
    .replace('{{DECK}}', ch.deck)
    .replace('{{PAGE_CSS}}', pageCss)
    .replace('{{PAGE_JS}}', pageJs)
    .replace('{{CONTENT}}', bodyContent)
    .replace('{{PREV_LINK}}', prev)
    .replace('{{NEXT_LINK}}', next);

  // Write output
  fs.writeFileSync(path.join(ROOT, ch.file), html);
  console.log(`  ${ch.file} (${html.length} bytes)`);
  built++;
}

// ── Build home page ──
console.log('Building home page...');
const homeCss = readIfExists(path.join(BUILD, 'css', 'home.css'));
const homeContent = readIfExists(path.join(BUILD, 'content', 'home.html'));
const homeJs = ''; // JS modules will be added in Phase 3

let homeHtml = homeTemplate
  .replace('{{HOME_CSS}}', homeCss)
  .replace('{{HOME_CONTENT}}', homeContent)
  .replace('{{HOME_JS}}', homeJs);

fs.writeFileSync(path.join(ROOT, 'stats_tutorial.html'), homeHtml);
console.log(`  stats_tutorial.html (${homeHtml.length} bytes)`);
built++;

console.log(`\n✅ ${built} pages built.`);
