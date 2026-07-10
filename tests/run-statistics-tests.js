/* ═══════════════════════════════════════════════
   Statistical Field Station — Node Test Runner
   ═══════════════════════════════════════════════
   Loads statistics.js and statistics.test.js
   via vm.runInThisContext for CI / headless use.
   ============================================== */

const fs = require('fs');
const vm = require('vm');

// Minimal DOM stub needed by statistics.js
global.document = {};

vm.runInThisContext(
  fs.readFileSync('assets/js/statistics.js', 'utf8')
);

const testResult = vm.runInThisContext(
  fs.readFileSync('tests/statistics.test.js', 'utf8')
);

if (!testResult || typeof testResult.failed !== 'number') {
  console.error('Test suite did not return a valid result.');
  process.exitCode = 1;
} else if (testResult.failed > 0) {
  process.exitCode = 1;
}