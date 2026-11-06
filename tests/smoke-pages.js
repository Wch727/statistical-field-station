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

      const mathErrors = await page.locator('.katex-error').evaluateAll(nodes => nodes.map(node => node.getAttribute('title') || node.textContent));
      for (const message of mathErrors) errors.push('MATH RENDER: ' + message);

      // Page-specific smoke assertions
      const hasHero = await page.$('.hero h1');
      if (!hasHero) errors.push('MISSING: .hero h1');

      if (pageFile === 'stats_tutorial.html') {
        // Homepage uses .entry-grid instead of .top-nav
        if (!await page.$('.entry-grid')) errors.push('MISSING: .entry-grid');
      } else {
        if (!await page.$('.top-nav')) errors.push('MISSING: .top-nav');
      }

      if (pageFile === 'stats_07_logistic.html') {
        await page.locator('#log-b1').evaluate(node => { node.value='0'; node.dispatchEvent(new Event('input',{bubbles:true})); });
        if (!(await page.locator('#log-boundary').textContent()).includes('所有')) errors.push('REGRESSION: zero logistic slope at intercept 0');
        await page.locator('#log-b0').evaluate(node => { node.value='1'; node.dispatchEvent(new Event('input',{bubbles:true})); });
        if (!(await page.locator('#log-boundary').textContent()).includes('无交点')) errors.push('REGRESSION: zero logistic slope at nonzero intercept');
      }
      if (pageFile === 'stats_08_classification.html') {
        await page.locator('#knn-clear').click();
        await page.locator('#knn-chart svg').evaluate(node => {
          const box=node.getBoundingClientRect();
          node.dispatchEvent(new MouseEvent('click',{clientX:box.left+150,clientY:box.top+100,shiftKey:true,bubbles:true}));
        });
        const blue = await page.locator('#knn-chart circle').evaluateAll(nodes => nodes.length===1 && nodes[0].__data__.cls===1);
        if (!blue) errors.push('REGRESSION: KNN Shift-click did not add class B');
      }
      if (pageFile === 'stats_09_clustering.html') {
        await page.locator('#km-clear').click();
        await page.locator('#km-k').evaluate(node => { node.value='6'; node.dispatchEvent(new Event('input',{bubbles:true})); });
        await page.locator('#km-chart svg').evaluate(node => {
          const box=node.getBoundingClientRect();
          node.dispatchEvent(new MouseEvent('click',{clientX:box.left+150,clientY:box.top+100,bubbles:true}));
        });
        await page.locator('#km-step').click();
        if (await page.locator('#km-chart .km-point').count() !== 1) errors.push('REGRESSION: KMeans fewer points than K');
      }
      if (pageFile === 'stats_10_evaluation.html') {
        const rates = () => page.locator('#pca-stats .val').evaluateAll(nodes => nodes.slice(0,4).map(node => parseFloat(node.textContent)));
        const before = await rates();
        await page.locator('#pca-rotate').click();
        const after = await rates();
        if (before.length !== 4 || after.some((value,i) => !Number.isFinite(value) || Math.abs(value-before[i])>0.001)) errors.push('REGRESSION: PCA explained variance changed under orthogonal rotation');
      }

      if (pageFile === 'stats_03_correlation.html') {
        const correlationCheck = await page.evaluate(async () => {
          const points = [...document.querySelectorAll('#scatter-container circle')].map(node => node.__data__);
          const original = points.map(point => ({...point}));
          const redraw = async () => {
            window.dispatchEvent(new Event('resize'));
            await new Promise(resolve => setTimeout(resolve, 400));
          };
          try {
            points.forEach((point, i) => { point.x = i % 3 === 2 ? 2 : 1; point.y = i % 3 + 1; });
            await redraw();
            const tied = document.getElementById('spearman-rho').textContent;
            points.forEach(point => { point.x = 2; });
            await redraw();
            const pearson = document.getElementById('pearson-r').textContent;
            const spearman = document.getElementById('spearman-rho').textContent;
            return tied === '0.8660' && pearson.includes('未定义') && spearman.includes('未定义');
          } finally {
            points.forEach((point, i) => Object.assign(point, original[i]));
            await redraw();
          }
        });
        if (!correlationCheck) errors.push('REGRESSION: tied ranks or constant correlation display');
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

  // ── Mobile viewport check (5 representative pages) ──
  console.log('\n── Mobile viewport check (375×812) ──');
  const mobilePages = [
    'stats_tutorial.html',      // homepage: decision tree + search + TOC
    'stats_01_descriptive.html', // dense KaTeX formulas
    'stats_10_evaluation.html',  // interactive D3 charts (confusion matrix, PCA, ROC)
    'stats_13_optimization.html',// largest page, complex tables
    'stats_glossary.html',       // standalone page with search/filter
  ];
  const mobileContext = await browser.newContext({ viewport: { width: 375, height: 812 } });
  for (const pageFile of mobilePages) {
    if (!fs.existsSync(pageFile)) {
      console.error(`MISSING: ${pageFile} — skipping mobile check`);
      failures++;
      continue;
    }
    const url = `http://localhost:${PORT}/${pageFile}`;
    try {
      const page = await mobileContext.newPage();
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(1000);

      const hasOverflow = await page.evaluate(() =>
        document.documentElement.scrollWidth > window.innerWidth + 5
      );
      if (hasOverflow) {
        console.error(`MOBILE OVERFLOW: ${pageFile}`);
        failures++;
      } else {
        console.log(`OK   ${pageFile} (mobile)`);
      }
      await page.close();
    } catch (err) {
      console.error(`MOBILE FATAL: ${pageFile} — ${err.message}`);
      failures++;
    }
  }
  await mobileContext.close();

  await browser.close();
  server.close();

  const totalChecks = pages.length + mobilePages.length;
  console.log(`\n${totalChecks - failures}/${totalChecks} checks OK, ${failures} failed.`);
  if (failures > 0) process.exitCode = 1;
}

main().catch(err => {
  console.error(err);
  server.close();
  process.exit(1);
});