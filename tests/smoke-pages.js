/* ═══════════════════════════════════════════════
   Statistical Field Station — Browser Smoke Test
   ═══════════════════════════════════════════════
   Opens each chapter page in a headless browser and
   checks for JavaScript errors, failed resource loads,
   and page initialization problems.

   Requires: npx playwright install chromium
   Run:      node tests/smoke-pages.js
   ============================================== */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 18765; // Arbitrary unused port
const ROOT = '.';

// ── Collect chapter pages ──
const pages = fs.readdirSync(ROOT)
  .filter(f => f.match(/^stats_\d{2}_.*\.html$/) || f === 'stats_tutorial.html');

console.log(`Found ${pages.length} pages to smoke-test.`);

// ── Start local server ──
const mimeTypes = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
};

const server = http.createServer((req, res) => {
  let filePath = path.join(ROOT, req.url.replace(/^\/+/, ''));
  if (!path.extname(filePath)) filePath += '.html';
  if (!fs.existsSync(filePath)) { res.writeHead(404); return res.end('404'); }
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
  res.end(fs.readFileSync(filePath));
});

// ── Run tests ──
async function main() {
  let playwright;
  try { playwright = require('playwright'); } catch {
    console.error('Playwright not installed. Run: npm install playwright && npx playwright install chromium');
    process.exit(1);
  }

  server.listen(PORT);
  await new Promise(r => server.once('listening', r));
  console.log(`Server on http://localhost:${PORT}`);

  const browser = await playwright.chromium.launch({ headless: true });
  let failures = 0;

  for (const pageFile of pages) {
    const url = `http://localhost:${PORT}/${pageFile}`;
    const errors = [];

    try {
      const context = await browser.newContext();
      const page = await context.newPage();

      page.on('pageerror', err => errors.push(`PAGE ERROR: ${err.message}`));
      page.on('console', msg => {
        if (msg.type() === 'error') errors.push(`CONSOLE: ${msg.text()}`);
      });
      page.on('requestfailed', request => {
        errors.push(`REQUEST FAILED: ${request.url()} — ${request.failure()?.errorText || 'unknown'}`);
      });
      page.on('response', response => {
        if (response.status() >= 400) {
          errors.push(`HTTP ${response.status()}: ${response.url()}`);
        }
      });

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

      // Wait for KaTeX + D3 + page scripts to settle
      await page.waitForTimeout(2000);

      // Page-specific smoke assertions
      const hasHero = await page.$('.hero h1');
      if (!hasHero) errors.push('MISSING: .hero h1');

      if (pageFile === 'stats_tutorial.html') {
        // Homepage uses .entry-grid instead of .top-nav
        if (!await page.$('.entry-grid')) errors.push('MISSING: .entry-grid');
      } else {
        if (!await page.$('.top-nav')) errors.push('MISSING: .top-nav');
      }

      await context.close();
    } catch (err) {
      errors.push(`FATAL: ${err.message}`);
    }

    if (errors.length > 0) {
      console.error(`FAIL ${pageFile}`);
      errors.forEach(e => console.error(`  ${e}`));
      failures++;
    } else {
      console.log(`OK   ${pageFile}`);
    }
  }

  await browser.close();
  server.close();

  console.log(`\n${pages.length - failures}/${pages.length} pages OK, ${failures} failed.`);
  if (failures > 0) process.exitCode = 1;
}

main().catch(err => {
  console.error(err);
  server.close();
  process.exit(1);
});