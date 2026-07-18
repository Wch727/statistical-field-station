/* ═══════════════════════════════════════════════
   Statistical Field Station — Decision Tree
   ═══════════════════════════════════════════════
   Interactive decision tree for the homepage.
   Helps students find the right statistical method
   based on their data type and research question.

   Mounts into: #decision-tree
   ============================================== */

(function() {
  'use strict';

  // ── Tree Data ──
  const TREE = {
    question: '你的数据有明确的目标变量（Y）吗？',
    help: '目标变量就是你想预测或解释的那个量。比如"房价"是目标变量，"面积、地段"是解释变量。',
    options: [
      {
        label: '有目标变量',
        icon: '🎯',
        desc: '我想解释/预测某个量',
        question: '目标变量是什么类型？',
        help: '连续数值可以取任意实数值（如价格、温度）；分类标签是离散的类别（如是/否、高/中/低）。',
        options: [
          {
            label: '连续数值',
            icon: '📊',
            desc: '价格、温度、浓度等',
            question: '你的分析目标是什么？',
            options: [
              {
                label: '找出影响因素',
                icon: '🔍',
                result: {
                  title: '相关分析 + 回归分析',
                  chapters: [
                    { num: '§III', file: 'stats_03_correlation.html', title: '相关分析', why: '先看哪些变量与目标相关（Pearson/Spearman/偏相关）' },
                    { num: '§VI', file: 'stats_06_regression.html', title: '线性回归', why: '建模变量与目标的定量关系（OLS/LASSO/Ridge）' }
                  ],
                  desc: '先用相关分析筛选变量，再用回归建模。注意：相关≠因果，回归系数也不等于因果效应。'
                }
              },
              {
                label: '比较组间差异',
                icon: '⚖️',
                result: {
                  title: '假设检验 + 方差分析',
                  chapters: [
                    { num: '§IV', file: 'stats_04_hypothesis.html', title: '假设检验', why: '两组比较用t检验/Mann-Whitney，多组比较用ANOVA' },
                    { num: '§V', file: 'stats_05_anova.html', title: '方差分析', why: '单因素/双因素/ANCOVA，含效应量和事后检验' }
                  ],
                  desc: '两组用t检验，多组用ANOVA。注意检查方差齐性和正态性假设。'
                }
              },
              {
                label: '预测未来数值',
                icon: '📈',
                result: {
                  title: '回归预测 + 时间序列',
                  chapters: [
                    { num: '§VI', file: 'stats_06_regression.html', title: '线性回归', why: '横截面数据的预测基线' },
                    { num: '§XI', file: 'stats_11_timeseries.html', title: '时间序列分析', why: '有时间维度的数据用ARIMA/SARIMA' },
                    { num: '§XII', file: 'stats_12_prediction.html', title: '预测问题专论', why: '预测评估、预测区间、GM(1,1)小样本预测' }
                  ],
                  desc: '有时间戳用时间序列，没有用回归。预测时一定要区分预测区间和置信区间。'
                }
              }
            ]
          },
          {
            label: '分类/离散标签',
            icon: '🏷️',
            desc: '是/否、高/中/低、类别名',
            question: '你的目标是什么？',
            options: [
              {
                label: '判别样本类别',
                icon: '🏗️',
                result: {
                  title: '分类方法',
                  chapters: [
                    { num: '§VII', file: 'stats_07_logistic.html', title: '逻辑回归', why: '二分类问题的经典方法，输出概率和OR' },
                    { num: '§VIII', file: 'stats_08_classification.html', title: '分类方法', why: '决策树/随机森林/XGBoost/SVM/KNN，多方法比较' }
                  ],
                  desc: '先试逻辑回归（可解释性强），再用树模型提升精度。注意类别不平衡问题。'
                }
              },
              {
                label: '估计类别概率',
                icon: '🎲',
                result: {
                  title: '逻辑回归',
                  chapters: [
                    { num: '§VII', file: 'stats_07_logistic.html', title: '逻辑回归', why: '输出概率而非硬分类，适合需要概率估计的场景' }
                  ],
                  desc: '逻辑回归天然输出概率。注意校准曲线评估概率质量。'
                }
              }
            ]
          }
        ]
      },
      {
        label: '没有目标变量',
        icon: '🔮',
        desc: '我想探索数据结构',
        question: '你的分析目标是什么？',
        help: '没有目标变量时，分析重点是发现数据内部的结构、模式或关系。',
        options: [
          {
            label: '发现自然分组',
            icon: '🧩',
            result: {
              title: '聚类分析',
              chapters: [
                { num: '§IX', file: 'stats_09_clustering.html', title: '聚类分析', why: 'K-Means/层次聚类/DBSCAN/GMM，无监督发现数据分组' }
              ],
              desc: 'K-Means是最常用的起点，DBSCAN能处理非球形簇。用轮廓系数评估聚类质量。'
            }
          },
          {
            label: '降维/简化数据',
            icon: '📐',
            result: {
              title: '模型评估与降维',
              chapters: [
                { num: '§X', file: 'stats_10_evaluation.html', title: '模型评估与降维', why: 'PCA/PLS/特征选择，减少维度同时保留信息' }
              ],
              desc: 'PCA是最常用的线性降维方法。用累积方差解释率选择主成分数量。'
            }
          },
          {
            label: '综合排名/评价',
            icon: '🏆',
            result: {
              title: '综合评价与排序',
              chapters: [
                { num: '§XIV', file: 'stats_14_evaluation.html', title: '综合评价与排序', why: '熵权法/TOPSIS/AHP/模糊综合评价，多指标综合排名' }
              ],
              desc: '先确定指标体系，再选择赋权方法（主观AHP或客观熵权），最后用TOPSIS排序。'
            }
          },
          {
            label: '最优方案/资源分配',
            icon: '⚡',
            result: {
              title: '优化与决策',
              chapters: [
                { num: '§XIII', file: 'stats_13_optimization.html', title: '优化与决策', why: '线性规划/整数规划/动态规划，找最优解' }
              ],
              desc: '把自然语言翻译成约束条件和目标函数。线性规划是基础，整数规划处理离散决策。'
            }
          },
          {
            label: '系统演化/传播规律',
            icon: '🔄',
            result: {
              title: '机理建模',
              chapters: [
                { num: '§XV', file: 'stats_15_mechanism.html', title: '机理建模与微分方程', why: '微分方程/Logistic/SIR，描述系统动态' }
              ],
              desc: '从第一性原理推导方程。Logistic增长、SIR传染病、捕食者-猎物是三大经典模型。'
            }
          },
          {
            label: '网络/路径/随机模拟',
            icon: '🕸️',
            result: {
              title: '图论与仿真',
              chapters: [
                { num: '§XVI', file: 'stats_16_graph.html', title: '图论、网络与仿真', why: '最短路径/中心性/蒙特卡洛/排队论' }
              ],
              desc: '路径问题用Dijkstra/Floyd，关键节点用中心性指标，随机系统用蒙特卡洛模拟。'
            }
          }
        ]
      }
    ]
  };

  // ── State ──
  let path = []; // [{question, answerLabel}]

  // ── Render ──
  function render() {
    const container = document.getElementById('decision-tree');
    if (!container) return;

    // Find current node based on path
    let node = TREE;
    for (const step of path) {
      const opt = node.options.find(o => o.label === step.answerLabel);
      if (!opt) { node = null; break; }
      node = opt;
    }

    let html = '';

    // Breadcrumb
    if (path.length > 0) {
      html += '<div class="dt-breadcrumb">';
      html += '<span class="dt-bc-item">开始</span>';
      for (const step of path) {
        html += ` <span class="dt-bc-arrow">→</span> <span class="dt-bc-item">${step.answerLabel}</span>`;
      }
      html += '</div>';
    }

    // Current question or result
    if (!node) {
      html += '<p style="color:var(--slate)">出错了，请重新开始。</p>';
    } else if (node.result) {
      // Leaf: show result
      html += renderResult(node.result);
    } else if (node.question) {
      // Question: show options
      html += `<h3 class="dt-question">${node.question}</h3>`;
      if (node.help) {
        html += `<p class="dt-help">${node.help}</p>`;
      }
      html += '<div class="dt-options">';
      for (const opt of node.options) {
        html += `
          <button class="dt-option" data-label="${opt.label.replace(/"/g, '&quot;')}">
            <span class="dt-opt-icon">${opt.icon}</span>
            <span class="dt-opt-label">${opt.label}</span>
            ${opt.desc ? `<span class="dt-opt-desc">${opt.desc}</span>` : ''}
          </button>`;
      }
      html += '</div>';
    }

    // Reset button (always visible after first selection)
    if (path.length > 0) {
      html += '<div class="dt-actions"><button class="btn dt-reset">↺ 重新开始</button>';
      if (path.length > 0) {
        html += ' <button class="btn dt-back">← 返回上一步</button>';
      }
      html += '</div>';
    }

    container.innerHTML = html;

    // Bind events
    container.querySelectorAll('.dt-option').forEach(btn => {
      btn.addEventListener('click', function() {
        const label = this.dataset.label;
        path.push({ answerLabel: label });
        render();
        // Scroll to top of tree
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    const resetBtn = container.querySelector('.dt-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => { path = []; render(); });
    }

    const backBtn = container.querySelector('.dt-back');
    if (backBtn) {
      backBtn.addEventListener('click', () => { path.pop(); render(); });
    }
  }

  function renderResult(result) {
    let html = '<div class="dt-result">';
    html += `<h3 class="dt-result-title">📋 推荐方法：${result.title}</h3>`;
    html += `<p class="dt-result-desc">${result.desc}</p>`;
    html += '<div class="dt-result-chapters">';
    for (const ch of result.chapters) {
      html += `
        <a href="${ch.file}" class="dt-chapter-card">
          <span class="dt-ch-num">${ch.num}</span>
          <span class="dt-ch-title">${ch.title}</span>
          <span class="dt-ch-why">${ch.why}</span>
        </a>`;
    }
    html += '</div>';
    html += '</div>';
    return html;
  }

  // ── Init ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
