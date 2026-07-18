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
  return '<a href="' + prev.file + '">← ' + prev.num + ' ' + prev.short + '</a> &nbsp;|&nbsp; ';
}

function nextLink(ch) {
  if (!ch.next) return '';
  const next = chapters.find(c => c.slug === ch.next);
  if (!next) return '';
  return ' &nbsp;|&nbsp; 下一章：<a href="' + next.file + '">' + next.num + ' ' + next.short + ' →</a>';
}

// ── Build quiz HTML ──
function buildQuiz(ch) {
  if (!ch.quiz || !ch.quiz.length) return { section: '', script: '' };
  const quizData = JSON.stringify(ch.quiz);
  const quizTitle = ch.num + ' ' + ch.short + ' — 自测题';
  return {
    section: '<div id="quiz-widget" class="quiz-widget"></div>',
    script: '<script>window.__QUIZ_DATA__=' + quizData + ';window.__QUIZ_TITLE__="' + quizTitle + '";</script>\n<script src="assets/js/quiz.js"></script>'
  };
}

// ── Build all chapter pages ──
console.log('Building chapter pages...');
let built = 0;

for (const ch of chapters) {
  const slug = ch.slug;
  const cssContent = readIfExists(path.join(BUILD, 'css', 'stats_' + slug + '.css'));
  const bodyContent = readIfExists(path.join(BUILD, 'content', 'stats_' + slug + '.html'));
  const jsContent = readIfExists(path.join(BUILD, 'js', 'stats_' + slug + '.js'));

  // Build CSS block
  const pageCss = cssContent ? '<style>\n' + cssContent + '\n</style>' : '';

  // Build JS block (inside CDN guard)
  const pageJs = jsContent ? '\n' + jsContent + '\n' : '';

  // Build prev/next links
  const prev = prevLink(ch);
  const next = nextLink(ch);

  // Build case study box
  let caseStudyHtml = '';
  if (ch.caseStudy) {
    caseStudyHtml = '<div class="case-box">\n  <h4>🔬 ' + ch.caseStudy.title + '</h4>\n  <p>' + ch.caseStudy.body + '</p>\n  <a href="stats_case_glass.html">→ 案例总览</a>\n</div>';
  }

  // Build quiz
  const quiz = buildQuiz(ch);

  // Substitute placeholders (replaceAll for multi-occurrence markers like {{CHAPTER_NUM}})
  const replacements = {
    '{{TITLE}}': ch.num + ' ' + ch.title,
    '{{CHAPTER_NUM}}': ch.num,
    '{{CHAPTER_SHORT}}': ch.short,
    '{{CHAPTER_TITLE}}': ch.title,
    '{{DECK}}': ch.deck,
    '{{PAGE_CSS}}': pageCss,
    '{{PAGE_JS}}': pageJs,
    '{{CONTENT}}': bodyContent,
    '{{CASE_STUDY}}': caseStudyHtml,
    '{{QUIZ_SECTION}}': quiz.section,
    '{{QUIZ_SCRIPT}}': quiz.script,
    '{{PREV_LINK}}': prev,
    '{{NEXT_LINK}}': next,
  };

  let html = chapterTemplate;
  for (const [placeholder, value] of Object.entries(replacements)) {
    html = html.replaceAll(placeholder, value);
  }

  // Validate: no unresolved placeholders remain
  if (html.includes('{{')) {
    const unresolved = html.match(/\{\{[A-Z_]+\}\}/g);
    throw new Error('Unresolved template placeholder(s) in ' + ch.file + ': ' + unresolved.join(', '));
  }

  // Write output
  fs.writeFileSync(path.join(ROOT, ch.file), html);
  console.log('  ' + ch.file + ' (' + html.length + ' bytes)');
  built++;
}

// ── Build home page ──
console.log('Building home page...');
const homeCss = readIfExists(path.join(BUILD, 'css', 'home.css'));
const homeContent = readIfExists(path.join(BUILD, 'content', 'home.html'));

// Inject chapter metadata for TOC enhancement
const chapterMeta = '<script>window.__CHAPTER_META__=' + JSON.stringify(chapters) + ';<' + '/script>';

let homeHtml = homeTemplate
  .replaceAll('{{HOME_CSS}}', homeCss)
  .replaceAll('{{HOME_CONTENT}}', homeContent)
  .replaceAll('{{CHAPTER_META}}', chapterMeta);

// Validate no unresolved placeholders in home page
if (homeHtml.includes('{{')) {
  const unresolved = homeHtml.match(/\{\{[A-Z_]+\}\}/g);
  throw new Error('Unresolved placeholder(s) in home page: ' + unresolved.join(', '));
}

fs.writeFileSync(path.join(ROOT, 'stats_tutorial.html'), homeHtml);
console.log('  stats_tutorial.html (' + homeHtml.length + ' bytes)');
built++;

console.log('\n✅ ' + built + ' pages built.');
