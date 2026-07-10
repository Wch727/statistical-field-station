/* ═══════════════════════════════════════════════
   Statistical Field Station — Statistics Functions
   ═══════════════════════════════════════════════
   Provides: lgamma, regularizedIncompleteBeta, tCDF, normalCDF,
   regularizedLowerIncompleteGamma, regularizedUpperIncompleteGamma, chiCDF

   Verified against known values:
     |t|=0, df=10 → two-sided p=1.000
     |t|=2.228, df=10 → two-sided p≈0.050
     χ²=0, df=1 → p=1.000
     χ²=3.841, df=1 → p≈0.050
   ============================================== */

// Log-Gamma function (Stirling / Lanczos approximation)
function lgamma(x) {
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7
  ];
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x);
  x -= 1;
  let a = c[0], t = x + g + 0.5;
  for (let i = 1; i < c.length; i++) a += c[i] / (x + i);
  return Math.log(Math.sqrt(2 * Math.PI)) + Math.log(a) - t + Math.log(t) * (x + 0.5);
}

// Regularized incomplete beta I_x(a,b) — Lentz continued fraction + symmetry transform
function regularizedIncompleteBeta(x, a, b) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  // Symmetry: if x is too close to 1, use the complement for numerical stability
  if (x > (a + 1) / (a + b + 2)) return 1 - regularizedIncompleteBeta(1 - x, b, a);
  const TINY = 1e-30, MAXIT = 200;
  const logBeta = lgamma(a) + lgamma(b) - lgamma(a + b);
  const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - logBeta) / a;
  let f = 1, c = 1, d = 1 - (a + b) * x / (a + 1);
  if (Math.abs(d) < TINY) d = TINY;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    const e1 = m * (b - m) * x / ((a + m2 - 1) * (a + m2));
    d = 1 + e1 * d; if (Math.abs(d) < TINY) d = TINY;
    c = 1 + e1 / c; if (Math.abs(c) < TINY) c = TINY;
    d = 1 / d; h *= d * c;
    const e2 = -(a + m) * (a + b + m) * x / ((a + m2) * (a + m2 + 1));
    d = 1 + e2 * d; if (Math.abs(d) < TINY) d = TINY;
    c = 1 + e2 / c; if (Math.abs(c) < TINY) c = TINY;
    d = 1 / d;
    const del = d * c; h *= del;
    if (Math.abs(del - 1) < 1e-15) break;
  }
  return front * h;
}

// t CDF: P(T ≤ t).  Uses symmetry of the t-distribution for negative t.
// tCDF(-t, df) = 1 - tCDF(t, df)  →  tail = 0.5·I_x(df/2, 1/2)
function tCDF(t, df) {
  if (!Number.isFinite(t) || df <= 0) return NaN;
  if (t === 0) return 0.5;
  const x = df / (df + t * t);
  const tail = 0.5 * regularizedIncompleteBeta(x, df / 2, 0.5);
  return t > 0 ? 1 - tail : tail;
}

// Normal CDF (Abramowitz & Stegun approximation)
function normalCDF(x) {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741,
        a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);
  const t = 1 / (1 + p * x);
  return 0.5 * (1 + sign * (1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)));
}

// Regularized lower incomplete gamma P(a,x) = γ(a,x)/Γ(a) — series expansion
function regularizedLowerIncompleteGamma(a, x) {
  if (x < 0) return NaN;
  if (x === 0) return 0;
  if (a <= 0) return NaN;
  if (x > a + 1) return 1 - regularizedUpperIncompleteGamma(a, x);
  let ap = a, del = 1 / a, sum = del;
  for (let n = 1; n <= 200; n++) {
    ap += 1; del *= x / ap; sum += del;
    if (Math.abs(del) < Math.abs(sum) * 1e-15) break;
  }
  return sum * Math.exp(-x + a * Math.log(x) - lgamma(a));
}

// Regularized upper incomplete gamma Q(a,x) = Γ(a,x)/Γ(a) — continued fraction
function regularizedUpperIncompleteGamma(a, x) {
  if (x <= 0) return 1;
  const TINY = 1e-30;
  let b = x + 1 - a, c = 1 / TINY, d = 1 / b, h = d;
  for (let i = 1; i <= 200; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b; if (Math.abs(d) < TINY) d = TINY;
    c = b + an / c; if (Math.abs(c) < TINY) c = TINY;
    d = 1 / d;
    const del = d * c; h *= del;
    if (Math.abs(del - 1) < 1e-15) break;
  }
  return Math.exp(-x + a * Math.log(x) - lgamma(a)) * h;
}

// Chi-square CDF: P(χ² ≤ x) = γ(df/2, x/2) / Γ(df/2)
function chiCDF(x, df) {
  if (x <= 0) return 0;
  return regularizedLowerIncompleteGamma(df / 2, x / 2);
}

// Two-sided p-value from Welch's t-test
function tTestPValue(t, df) {
  return 2 * (1 - tCDF(Math.abs(t), df));
}

// Chi-square test p-value
function chiSquarePValue(chi2, df) {
  return 1 - chiCDF(chi2, df);
}