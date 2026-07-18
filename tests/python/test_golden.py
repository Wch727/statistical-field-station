# ═══════════════════════════════════════════════
#  Statistical Field Station — Python Golden Tests
# ═══════════════════════════════════════════════
#  Cross-validates JS statistical functions against
#  scipy.stats as the reference implementation.
#
#  The JS functions are called via Node.js subprocess.
#  Each test compares JS output to scipy with absolute
#  tolerances matched to each function's numerical method:
#    tCDF / chiCDF — continued-fraction + series: 1e-10
#    normalCDF — Abramowitz & Stegun approximation: 1e-7
#    Known-value regression tests: 0.001
#
#  Run:  pytest tests/python/test_golden.py -v
# ═══════════════════════════════════════════════

import subprocess
import json
import math
import pytest
from scipy import stats
import numpy as np

# ── Helper: call JS function via Node ──
def js_eval(expr):
    """Evaluate a JS expression and return the result as a float."""
    script = f"""
    const fs = require('fs');
    const vm = require('vm');
    global.document = {{}};
    vm.runInThisContext(fs.readFileSync('assets/js/statistics.js', 'utf8'));
    console.log(JSON.stringify({{result: {expr}}}));
    """
    result = subprocess.run(['node', '-e', script], capture_output=True, text=True, cwd='.')
    data = json.loads(result.stdout.strip())
    val = data['result']
    if val is None or (isinstance(val, float) and math.isnan(val)):
        return float('nan')
    return float(val)

# ── tCDF tests ──
class TestTCDF:
    """Cross-validate tCDF(t, df) against scipy.stats.t.cdf"""

    @pytest.mark.parametrize("t,df", [
        (0, 1), (0, 5), (0, 10), (0, 30), (0, 100),
        (1, 10), (-1, 10), (2.228, 10), (-2.228, 10),
        (3, 5), (3, 30), (5, 3), (10, 10), (10, 100),
        (0.5, 2), (1.5, 7), (2.0, 15), (4.0, 20), (6.0, 50),
    ])
    def test_tcdf_against_scipy(self, t, df):
        js_val = js_eval(f'tCDF({t}, {df})')
        py_val = stats.t.cdf(t, df)
        assert abs(js_val - py_val) < 1e-10, f"tCDF({t},{df}): JS={js_val}, scipy={py_val}"

    def test_tcdf_symmetry(self):
        """tCDF(-t, df) + tCDF(t, df) = 1"""
        for t in [0.5, 1, 2, 3]:
            s = js_eval(f'tCDF({-t}, 10) + tCDF({t}, 10)')
            assert abs(s - 1.0) < 1e-10

    def test_tcdf_invalid_df(self):
        """tCDF with df <= 0 returns NaN"""
        val = js_eval('tCDF(1, 0)')
        assert math.isnan(val)

    def test_tcdf_large_t(self):
        """tCDF approaches 1 for large t"""
        val = js_eval('tCDF(20, 10)')
        assert val > 0.9999999


# ── normalCDF tests ──
class TestNormalCDF:
    """Cross-validate normalCDF(x) against scipy.stats.norm.cdf"""

    @pytest.mark.parametrize("x", [-3, -2, -1.96, -1, -0.5, 0, 0.5, 1, 1.96, 2, 3])
    def test_normcdf_against_scipy(self, x):
        js_val = js_eval(f'normalCDF({x})')
        py_val = stats.norm.cdf(x)
        # Abramowitz & Stegun approximation — absolute error ~1e-7
        assert abs(js_val - py_val) < 1e-7, f"normalCDF({x}): JS={js_val}, scipy={py_val}"

    def test_normcdf_zero(self):
        val = js_eval('normalCDF(0)')
        # normalCDF(0) = 0.5 exactly by symmetry in the algorithm
        assert abs(val - 0.5) < 1e-9


# ── chiCDF tests ──
class TestChiCDF:
    """Cross-validate chiCDF(x, df) against scipy.stats.chi2.cdf"""

    @pytest.mark.parametrize("x,df", [
        (0, 1), (3.841, 1), (0, 5), (5, 5), (10, 5),
        (1, 10), (5, 10), (15, 10), (20, 10),
        (10, 20), (20, 20), (30, 20), (40, 20),
    ])
    def test_chicdf_against_scipy(self, x, df):
        js_val = js_eval(f'chiCDF({x}, {df})')
        py_val = stats.chi2.cdf(x, df)
        assert abs(js_val - py_val) < 1e-10, f"chiCDF({x},{df}): JS={js_val}, scipy={py_val}"

    def test_chicdf_zero(self):
        val = js_eval('chiCDF(0, 5)')
        assert abs(val - 0.0) < 1e-10


# ── Known regression values ──
class TestRegression:
    """Verify known critical values don't regress."""

    def test_t_known_values(self):
        """t=2.228, df=10 → CDF ≈ 0.975 (two-sided p=0.05)"""
        cdf = js_eval('tCDF(2.228, 10)')
        assert abs(cdf - 0.975) < 0.001

    def test_chi_known_values(self):
        """χ²=3.841, df=1 → CDF ≈ 0.95 (p=0.05)"""
        cdf = js_eval('chiCDF(3.841, 1)')
        assert abs(cdf - 0.95) < 0.001

    def test_norm_known_values(self):
        """Φ(1.96) ≈ 0.975"""
        cdf = js_eval('normalCDF(1.96)')
        assert abs(cdf - 0.975) < 0.001
