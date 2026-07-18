/* ═══════════════════════════════════════════════
   Statistical Field Station — Progress Tracker
   ═══════════════════════════════════════════════
   localStorage-based chapter completion tracking.
   Each chapter page marks itself as complete on
   load. The homepage reads progress and shows a
   progress bar + checkmarks on completed chapters.

   Storage key: sfs-progress
   ============================================== */

(function() {
  'use strict';

  const STORAGE_KEY = 'sfs-progress';

  // ── Chapter ID from URL ──
  function getChapterId() {
    const m = location.pathname.match(/stats_(\d+_[a-z]+)\.html/);
    return m ? m[1] : null;
  }

  // ── Mark current chapter as complete ──
  function markComplete() {
    const id = getChapterId();
    if (!id) return;
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      data[id] = { completed: true, date: new Date().toISOString().slice(0, 10) };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch(e) { /* localStorage not available */ }
  }

  // ── Get all completed chapters ──
  function getCompleted() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch(e) { return {}; }
  }

  // ── Render progress on homepage ──
  function renderHomeProgress() {
    const bar = document.getElementById('progress-bar');
    if (!bar) return;

    const completed = getCompleted();
    const total = 18; // 17 chapters + glossary (future)
    const done = Object.keys(completed).filter(k => completed[k].completed).length;

    bar.innerHTML = `
      <div class="progress-text">已完成 ${done}/18 章</div>
      <div class="progress-track">
        <div class="progress-fill" style="width:${(done/total*100).toFixed(0)}%"></div>
      </div>
    `;

    // Mark TOC items with completion check
    document.querySelectorAll('.toc-item').forEach(item => {
      const href = item.getAttribute('href');
      if (!href) return;
      const m = href.match(/stats_(\d+_[a-z]+)\.html/);
      if (!m) return;
      const id = m[1];
      if (completed[id] && completed[id].completed) {
        item.classList.add('toc-done');
        // Add checkmark if not already present
        if (!item.querySelector('.toc-check')) {
          const check = document.createElement('span');
          check.className = 'toc-check';
          check.textContent = ' ✓';
          check.style.cssText = 'color:#2D7A4E;font-weight:700;margin-left:6px';
          item.querySelector('.title').appendChild(check);
        }
      }
    });
  }

  // ── Init ──
  // On chapter pages: mark as complete
  if (getChapterId()) {
    markComplete();
  }

  // On homepage: render progress
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderHomeProgress);
  } else {
    renderHomeProgress();
  }

  // Expose for build script
  window.__SFS_PROGRESS__ = { getCompleted, markComplete };
})();
