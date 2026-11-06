/* ═══════════════════════════════════════════════
   Statistical Field Station — Statistics Test Suite
   ═══════════════════════════════════════════════
   Run this file in a browser console after loading
   assets/js/statistics.js, or via Node.js with a
   DOM-free test harness.

   Expected: all tests pass (no errors logged).
   ============================================== */

(function() {
  'use strict';

  const EPS = 0.01; // Relaxed tolerance for float approximations
  let passed = 0, failed = 0;

  function assert(description, actual, expected, tol) {
    tol = tol === undefined ? EPS : tol;
    const ok = Math.abs(actual - expected) <= tol;
    if (ok) {
      passed++;
    } else {
      failed++;
      console.error('FAIL: ' + description + ' — got ' + actual + ', expected ' + expected);
    }
  }

  // ─── t-Distribution Tests ───
  console.log('─── t-Distribution ───');

  // t=0, df=10 → two-sided p = 1.0
  let p = 2 * (1 - tCDF(0, 10));
  assert('t=0, df=10 → two-sided p=1.0', p, 1.0);

  // t=2.228, df=10 → two-sided p ≈ 0.05
  p = 2 * (1 - tCDF(2.228, 10));
  assert('t=2.228, df=10 → two-sided p≈0.05', p, 0.05);

  // tCDF with negative t: symmetry
  assert('tCDF(-1,10) ≈ 0.1704', tCDF(-1, 10), 0.1704);
  assert('tCDF symmetry: tCDF(-1,10)+tCDF(1,10)=1', tCDF(-1, 10) + tCDF(1, 10), 1.0);

  // t=1, df=10 → two-sided p ≈ 0.341
  p = 2 * (1 - tCDF(1, 10));
  assert('t=1, df=10 → two-sided p≈0.341', p, 0.341);

  // tCDF symmetry: tCDF(0, df) = 0.5 for any df
  assert('tCDF(0, 5)=0.5', tCDF(0, 5), 0.5);
  assert('tCDF(0, 30)=0.5', tCDF(0, 30), 0.5);

  // tCDF approaches 1 for large t
  assert('tCDF(10, 10) > 0.999', tCDF(10, 10) > 0.999, true, 0);

  // invalid df returns NaN
  assert('invalid df returns NaN', Number.isNaN(tCDF(1, 0)), true, 0);

  // ─── Chi-Square Tests ───
  console.log('─── Chi-Square ───');

  // χ²=0, df=1 → p=1.0
  p = 1 - chiCDF(0, 1);
  assert('χ²=0, df=1 → p=1.0', p, 1.0);

  // χ²=3.841, df=1 → p≈0.05
  p = 1 - chiCDF(3.841, 1);
  assert('χ²=3.841, df=1 → p≈0.05', p, 0.05);

  // χ² increases → p decreases
  const p1 = 1 - chiCDF(1, 1);
  const p2 = 1 - chiCDF(10, 1);
  assert('χ²=1 → χ²=10: p decreases', p1 > p2, true, 0);

  // ─── Normal CDF Tests ───
  console.log('─── Normal CDF ───');

  assert('Φ(0) = 0.5', normalCDF(0), 0.5);
  assert('Φ(1.96) ≈ 0.975', normalCDF(1.96), 0.975);
  assert('Φ(-1.96) ≈ 0.025', normalCDF(-1.96), 0.025);

  // ─── Edge Cases ───
  console.log('─── Edge Cases ───');

  // chiCDF with x=0
  assert('chiCDF(0, 3) = 0', chiCDF(0, 3), 0, 0);

  // regularizedIncompleteBeta edge cases
  assert('I_0(a,b) = 0', regularizedIncompleteBeta(0, 2, 3), 0, 0);
  assert('I_1(a,b) = 1', regularizedIncompleteBeta(1, 2, 3), 1, 0);

  // Correlation regression cases: ties, permutation, constant inputs and phi.
  assert('Spearman average ties', spearmanCorrelation([1,1,2],[1,2,3]), Math.sqrt(3)/2, 1e-12);
  assert('Spearman row permutation', spearmanCorrelation([2,1,1],[3,2,1]), Math.sqrt(3)/2, 1e-12);
  assert('Spearman reverse with ties', spearmanCorrelation([1,1,2,3],[3,3,2,1]), -1, 1e-12);
  assert('Pearson equals phi for binary variables', pearsonCorrelation([0,0,1,1],[0,1,1,1]), 1/Math.sqrt(3), 1e-12);
  assert('Constant Pearson undefined', Number.isNaN(pearsonCorrelation([2,2,2],[1,2,3])) ? 1 : 0, 1, 0);
  assert('Constant Spearman undefined', Number.isNaN(spearmanCorrelation([2,2,2],[1,2,3])) ? 1 : 0, 1, 0);
  assert('Single observation undefined', Number.isNaN(spearmanCorrelation([1],[2])) ? 1 : 0, 1, 0);
  assert('Mismatched lengths undefined', Number.isNaN(pearsonCorrelation([1,2],[1])) ? 1 : 0, 1, 0);
  assert('Nonfinite values undefined', Number.isNaN(spearmanCorrelation([1,Infinity],[1,2])) ? 1 : 0, 1, 0);

  assert('t CDF +infinity', tCDF(Infinity, 10), 1, 0);
  assert('t CDF -infinity', tCDF(-Infinity, 10), 0, 0);
  assert('Chi CDF infinity', chiCDF(Infinity, 5), 1, 0);
  assert('Chi invalid df at zero', Number.isNaN(chiCDF(0, 0)), true, 0);
  assert('Gamma invalid shape at zero', Number.isNaN(regularizedLowerIncompleteGamma(0, 0)), true, 0);
  assert('Gamma upper at infinity', regularizedUpperIncompleteGamma(2, Infinity), 0, 0);
  assert('Chi df2 small tail relative error', chiSquarePValue(100, 2) / Math.exp(-50), 1, 1e-12);
  assert('t df1 stable extreme tail', tTestPValue(1e10, 1) / (2 / (Math.PI * 1e10)), 1, 1e-12);
  assert('F critical value', fSurvival(3.8852938346523933, 2, 12), 0.05, 1e-12);
  assert('F zero', fSurvival(0, 2, 12), 1, 0);
  assert('F infinity', fSurvival(Infinity, 2, 12), 0, 0);

  // ─── Summary ───
  console.log('─── Results ───');
  console.log(passed + ' passed, ' + failed + ' failed, ' + (passed + failed) + ' total');
  if (failed === 0) {
    console.log('✅ All statistical function tests passed!');
  } else {
    console.error('❌ ' + failed + ' test(s) failed — review the errors above.');
  }

  return { passed, failed, total: passed + failed };
})();