/* ═══════════════════════════════════════════════
   Statistical Field Station — Quiz Widget
   ═══════════════════════════════════════════════
   Self-check quizzes at end of each chapter.
   Renders multiple-choice questions, checks answers,
   shows score and explanations.

   Data: window.__QUIZ_DATA__ (injected by build or inline)
   Mounts into: #quiz-widget
   ============================================== */

(function() {
  'use strict';

  function init() {
    const container = document.getElementById('quiz-widget');
    if (!container || !window.__QUIZ_DATA__ || !window.__QUIZ_DATA__.length) return;

    const quiz = window.__QUIZ_DATA__;
    let currentQ = 0;
    let score = 0;
    let answered = new Array(quiz.length).fill(false);
    let userAnswers = new Array(quiz.length).fill(-1);

    function render() {
      const q = quiz[currentQ];
      const isAnswered = answered[currentQ];

      let html = '<div class="quiz-panel">';
      html += '<div class="quiz-header">';
      html += `<span class="quiz-title">📝 自测：${window.__QUIZ_TITLE__ || '本章知识检查'}</span>`;
      html += `<span class="quiz-progress">${currentQ + 1}/${quiz.length}</span>`;
      html += '</div>';

      // Progress dots
      html += '<div class="quiz-dots">';
      for (let i = 0; i < quiz.length; i++) {
        const cls = answered[i] ? (userAnswers[i] === quiz[i].correct ? 'qd-correct' : 'qd-wrong') : 'qd-pending';
        html += `<span class="quiz-dot ${cls}"></span>`;
      }
      html += '</div>';

      // Question
      html += `<p class="quiz-question">${q.question}</p>`;

      // Options
      html += '<div class="quiz-options">';
      const labels = ['A', 'B', 'C', 'D'];
      for (let i = 0; i < q.options.length; i++) {
        let optClass = 'quiz-opt';
        if (isAnswered) {
          if (i === q.correct) optClass += ' qo-correct';
          else if (i === userAnswers[currentQ]) optClass += ' qo-wrong';
        }
        html += `<button class="${optClass}" data-index="${i}" ${isAnswered ? 'disabled' : ''}>`;
        html += `<span class="qo-label">${labels[i]}</span>`;
        html += `<span class="qo-text">${q.options[i]}</span>`;
        html += '</button>';
      }
      html += '</div>';

      // Feedback
      if (isAnswered) {
        if (userAnswers[currentQ] === q.correct) {
          html += '<div class="quiz-feedback qf-correct">✅ 正确！</div>';
        } else {
          html += `<div class="quiz-feedback qf-wrong">❌ 正确答案是 ${labels[q.correct]}</div>`;
        }
        if (q.explanation) {
          html += `<div class="quiz-explanation">${q.explanation}</div>`;
        }
      }

      // Navigation
      html += '<div class="quiz-nav">';
      if (currentQ > 0) {
        html += '<button class="btn quiz-prev">← 上一题</button>';
      } else {
        html += '<span></span>';
      }
      if (currentQ < quiz.length - 1) {
        html += '<button class="btn quiz-next" ' + (!isAnswered ? 'disabled' : '') + '>下一题 →</button>';
      } else if (isAnswered) {
        html += `<button class="btn quiz-finish">查看结果 (${score}/${quiz.length})</button>`;
      }
      html += '</div>';

      // Score summary (shown at end)
      if (isAnswered && currentQ === quiz.length - 1) {
        const pct = Math.round(score / quiz.length * 100);
        const msg = pct === 100 ? '🎉 全部正确！你对本章内容掌握得很好。' :
                    pct >= 60 ? '👍 不错！建议回顾答错的题目对应的章节内容。' :
                    '📖 建议重读本章关键部分，尤其是答错的题目涉及的知识点。';
        html += `<div class="quiz-score"><p><strong>得分：${score}/${quiz.length} (${pct}%)</strong></p><p>${msg}</p></div>`;
      }

      html += '</div>';
      container.innerHTML = html;

      // Bind events
      container.querySelectorAll('.quiz-opt:not([disabled])').forEach(btn => {
        btn.addEventListener('click', function() {
          const idx = parseInt(this.dataset.index);
          userAnswers[currentQ] = idx;
          answered[currentQ] = true;
          if (idx === quiz[currentQ].correct) score++;
          render();
        });
      });

      const prevBtn = container.querySelector('.quiz-prev');
      if (prevBtn) prevBtn.addEventListener('click', () => { currentQ--; render(); });

      const nextBtn = container.querySelector('.quiz-next');
      if (nextBtn && !nextBtn.disabled) nextBtn.addEventListener('click', () => { currentQ++; render(); });

      const finishBtn = container.querySelector('.quiz-finish');
      if (finishBtn) finishBtn.addEventListener('click', () => {
        currentQ = 0;
        score = 0;
        answered = new Array(quiz.length).fill(false);
        userAnswers = new Array(quiz.length).fill(-1);
        render();
      });
    }

    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
