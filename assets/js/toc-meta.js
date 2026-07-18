/* ═══════════════════════════════════════════════
   Statistical Field Station — TOC Metadata Enhancer
   ═══════════════════════════════════════════════
   Reads window.__CHAPTER_META__ (injected at build time)
   and adds difficulty badges, time estimates, and
   prerequisite links to homepage TOC items.
   ============================================== */

(function() {
  const meta = window.__CHAPTER_META__;
  if (!meta || !meta.length) return;

  const byFile = {};
  meta.forEach(function(ch) { byFile[ch.file] = ch; });

  var diffLabels = {
    beginner: '🟢 入门',
    intermediate: '🟡 中级',
    advanced: '🔴 进阶'
  };

  document.querySelectorAll('.toc-item').forEach(function(item) {
    var href = item.getAttribute('href');
    var ch = byFile[href];
    if (!ch) return;

    var metaRow = document.createElement('div');
    metaRow.className = 'toc-meta';

    // Difficulty badge
    if (ch.difficulty && diffLabels[ch.difficulty]) {
      var diff = document.createElement('span');
      diff.className = 'toc-meta-diff toc-diff-' + ch.difficulty;
      diff.textContent = diffLabels[ch.difficulty];
      metaRow.appendChild(diff);
    }

    // Time estimate
    if (ch.time) {
      var time = document.createElement('span');
      time.className = 'toc-meta-time';
      time.textContent = '⏱ 约 ' + ch.time + ' 分钟';
      metaRow.appendChild(time);
    }

    // Prerequisites
    if (ch.prereqs && ch.prereqs.length > 0) {
      var pre = document.createElement('span');
      pre.className = 'toc-meta-prereqs';
      pre.textContent = '前置: ' + ch.prereqs.join(', ');
      metaRow.appendChild(pre);
    }

    // Insert after the tags div
    var tags = item.querySelector('.tags');
    if (tags) {
      tags.parentNode.insertBefore(metaRow, tags.nextSibling);
    } else {
      item.appendChild(metaRow);
    }
  });
})();
