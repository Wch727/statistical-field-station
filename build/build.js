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

// ── Build quiz HTML ──
function buildQuiz(ch) {
  if (!ch.quiz || !ch.quiz.length) return { section: '', script: '' };
  const quizData = JSON.stringify(ch.quiz);
  const quizTitle = `${ch.num} ${ch.short} — 自测题`;
  return {
    section: `<div id="quiz-widget" class="quiz-widget"></div>`,
    script: `<script>window.__QUIZ_DATA__=${quizData};window.__QUIZ_TITLE__="${quizTitle}";</script>\n<script src="assets/js/quiz.js"></script>`
  };
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

  // Build case study box
  let caseStudyHtml = '';
  if (ch.caseStudy) {
    caseStudyHtml = `<div class="case-box">
  <h4>🔬 ${ch.caseStudy.title}</h4>
  <p>${ch.caseStudy.body}</p>
  <a href="stats_glossary.html">→ 案例总览</a>
</div>`;
  }

  // Build quiz
  const quiz = buildQuiz(ch);

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
    .replace('{{CASE_STUDY}}', caseStudyHtml)
    .replace('{{QUIZ_SECTION}}', quiz.section)
    .replace('{{QUIZ_SCRIPT}}', quiz.script)
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
  .replace('{{HOME_CONTENT}}', homeContent);

fs.writeFileSync(path.join(ROOT, 'stats_tutorial.html'), homeHtml);
console.log(`  stats_tutorial.html (${homeHtml.length} bytes)`);
built++;

console.log(`\n✅ ${built} pages built.`);
