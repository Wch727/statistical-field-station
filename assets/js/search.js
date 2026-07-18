/* ═══════════════════════════════════════════════
   Statistical Field Station — Keyword Search
   ═══════════════════════════════════════════════
   Interactive search for the homepage.
   Filters chapter index as user types.

   Mounts into: #keyword-search
   ============================================== */

(function() {
  'use strict';

  // ── Search Index ──
  // Built from chapters.json — maps keywords to chapters
  const INDEX = [
    { kw: '均值 平均值 mean 中心趋势', ch: '§I', file: 'stats_01_descriptive.html', title: '描述性统计' },
    { kw: '方差 标准差 标准误 偏度 峰度 离散 Bessel 正态性 Shapiro-Wilk Q-Q图 Box-Cox MAD IQR 四分位数', ch: '§I', file: 'stats_01_descriptive.html', title: '描述性统计' },
    { kw: '直方图 箱线图 小提琴图 KDE 散点图 热力图 可视化 画图 绘图 Anscombe 柱状图 饼图', ch: '§II', file: 'stats_02_visualization.html', title: '数据可视化' },
    { kw: '相关 Pearson Spearman Kendall 偏相关 距离相关 Cramér 相关系数 典型相关 CCA 相关矩阵 散点图矩阵', ch: '§III', file: 'stats_03_correlation.html', title: '相关分析' },
    { kw: 't检验 卡方检验 Mann-Whitney 非参数 假设检验 p值 显著性 配对检验 效应量 Cohen Hedges Levene 方差齐性 Bootstrap 置换检验 统计功效 多重校正', ch: '§IV', file: 'stats_04_hypothesis.html', title: '假设检验' },
    { kw: 'ANOVA 方差分析 单因素 双因素 交互效应 ANCOVA 协方差 MANOVA 多元方差 Kruskal-Wallis 事后检验 Tukey HSD 效应量 η²', ch: '§V', file: 'stats_05_anova.html', title: '方差分析' },
    { kw: '回归 线性回归 OLS 多元回归 LASSO Ridge 弹性网络 逐步回归 AIC BIC VIF 多重共线性 残差诊断 异方差 WLS 加权最小二乘 分位数回归 交互项 多项式', ch: '§VI', file: 'stats_06_regression.html', title: '线性回归' },
    { kw: '逻辑回归 logistic Logit Odds OR 优势比 二分类 多分类 有序 ROC AUC 混淆矩阵 Hosmer-Lemeshow 校准曲线 类别不平衡 GLM', ch: '§VII', file: 'stats_07_logistic.html', title: '逻辑回归' },
    { kw: '分类 决策树 随机森林 XGBoost LightGBM SVM 支持向量机 KNN 朴素贝叶斯 核技巧 剪枝 基尼 熵 SMOTE 类别不平衡 集成学习 Bagging Boosting', ch: '§VIII', file: 'stats_08_classification.html', title: '分类方法' },
    { kw: '聚类 K-Means KMeans 层次聚类 DBSCAN GMM 高斯混合 肘部法则 轮廓系数 树状图 密度聚类 EM算法 无监督', ch: '§IX', file: 'stats_09_clustering.html', title: '聚类分析' },
    { kw: '评估 交叉验证 混淆矩阵 精确率 召回率 F1 AUC PCA 主成分 降维 特征选择 偏差方差 数据标准化 归一化 PLS 偏最小二乘', ch: '§X', file: 'stats_10_evaluation.html', title: '模型评估与降维' },
    { kw: '时间序列 ARIMA SARIMA ACF PACF 平稳性 ADF 季节分解 趋势 Holt-Winters 指数平滑 ETS AICc', ch: '§XI', file: 'stats_11_timeseries.html', title: '时间序列分析' },
    { kw: '预测 RMSE MAE MAPE 预测区间 灰色预测 GM(1,1) 小样本 数据泄漏 过拟合 模型比较 集成预测', ch: '§XII', file: 'stats_12_prediction.html', title: '预测问题专论' },
    { kw: '优化 线性规划 整数规划 0-1规划 动态规划 多目标 Pareto 对偶 影子价格 灵敏度 背包 TSP VRP 选址 单纯形 KKT 非线性规划', ch: '§XIII', file: 'stats_13_optimization.html', title: '优化与决策' },
    { kw: '评价 排名 排序 综合指标 熵权法 TOPSIS AHP 层次分析 模糊综合评价 灰色关联 因子分析 指标体系 灵敏度分析', ch: '§XIV', file: 'stats_14_evaluation.html', title: '综合评价与排序' },
    { kw: '微分方程 ODE 差分方程 Logistic SIR 传染病 捕食者 猎物 Lotka-Volterra 机理 数值求解 参数估计 扩散', ch: '§XV', file: 'stats_15_mechanism.html', title: '机理建模' },
    { kw: '图论 最短路径 Dijkstra Floyd 最小生成树 Prim Kruskal 中心性 网络 蒙特卡洛 排队论 元胞自动机 随机模拟 仿真', ch: '§XVI', file: 'stats_16_graph.html', title: '图论与仿真' },
    { kw: 'Pandas NumPy Matplotlib 数据处理 数据清洗 缺失值 异常值 标准化 归一化 模型验证 敏感性分析 鲁棒性 论文 写作', ch: '§0', file: 'stats_00_toolkit.html', title: '数模实战工具箱' }
  ];

  // ── Init ──
  function init() {
    const container = document.getElementById('keyword-search');
    if (!container) return;

    // Replace static content with interactive search
    container.innerHTML = `
      <h2>题目关键词 → 对应方法</h2>
      <div class="search-input-wrap">
        <input type="search" id="search-input" class="search-input" placeholder="输入题目关键词… 例如：分类、预测、最优方案" autocomplete="off">
        <span class="search-icon">🔍</span>
      </div>
      <div id="search-results" class="search-results"></div>
      <div id="search-default" class="keyword-grid">
        ${renderDefaultGrid()}
      </div>
    `;

    // Bind search
    const input = document.getElementById('search-input');
    const results = document.getElementById('search-results');
    const defaultGrid = document.getElementById('search-default');

    input.addEventListener('input', function() {
      const query = this.value.trim().toLowerCase();
      if (query.length < 1) {
        results.innerHTML = '';
        results.style.display = 'none';
        defaultGrid.style.display = '';
        return;
      }

      // Search: case-insensitive substring match on keywords
      const matches = INDEX.filter(entry =>
        entry.kw.toLowerCase().includes(query) ||
        entry.title.toLowerCase().includes(query) ||
        entry.ch.toLowerCase().includes(query)
      );

      if (matches.length === 0) {
        results.innerHTML = '<p class="search-empty">没有直接匹配的方法。试试用不同的关键词，或使用上方的决策树找到合适的方法。</p>';
        results.style.display = '';
        defaultGrid.style.display = 'none';
      } else {
        results.innerHTML = matches.map(m =>
          `<a href="${m.file}" class="search-result-item">
            <span class="sr-num">${m.ch}</span>
            <span class="sr-title">${m.title}</span>
            <span class="sr-kw">${m.kw.split(' ').slice(0, 5).join(' · ')}</span>
          </a>`
        ).join('');
        results.style.display = '';
        defaultGrid.style.display = 'none';
      }
    });

    // Clear search on Escape
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') { this.value = ''; this.dispatchEvent(new Event('input')); this.blur(); }
    });
  }

  function renderDefaultGrid() {
    const items = [
      ['"是否有关"', '→ §III 相关分析 / §IV 卡方检验'],
      ['"是否有显著差异"', '→ §IV 假设检验'],
      ['"影响有多大"', '→ §V ANOVA / §VI 回归'],
      ['"属于哪一类"', '→ §VII 逻辑回归 / §VIII 分类'],
      ['"分成几组"', '→ §IX 聚类'],
      ['"预测未来"', '→ §XI 时间序列 / §XII 预测'],
      ['"成本最低 / 最优方案"', '→ §XIII 优化'],
      ['"哪个最好 / 排名"', '→ §XIV 综合评价'],
      ['"系统演化 / 传播"', '→ §XV 机理建模'],
      ['"最短路径 / 随机模拟"', '→ §XVI 图论与仿真'],
      ['"模型好不好"', '→ §X 模型评估 / §0 工具箱'],
      ['"数据怎么处理"', '→ §0 工具箱 / §I 描述统计']
    ];
    return items.map(([kw, dest]) =>
      `<div><span class="kw">${kw}</span> <span class="kw-dest">${dest}</span></div>`
    ).join('');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
