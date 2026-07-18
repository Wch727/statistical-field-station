# Statistical Field Station

**面向数学建模竞赛的交互式统计教程** — 18 个独立 HTML 页面，涵盖从描述统计到图论仿真的完整知识体系。

每个章节包含：完整的 KaTeX 公式推导 + D3.js 交互式可视化 + 建模工具箱 + 竞赛实战指南。所有计算在浏览器端完成，所有资源（KaTeX、D3.js、字体）已随仓库本地提供，**完全离线可用**。

## 快速开始

```bash
# 任意浏览器打开任意章节
open stats_tutorial.html        # macOS
start stats_tutorial.html       # Windows
xdg-open stats_tutorial.html    # Linux
```

从 `stats_tutorial.html`（目录页）开始，按需跳转到任意章节。推荐阅读顺序：**§0 → §I → §II → §III → §IV → §V → §X → §XII → §XIII → §XIV**，其余章节按兴趣选读。

## 文件结构

```
├── stats_tutorial.html          # 目录索引 · 竞赛路线图 · 快速决策流
├── stats_00_toolkit.html        # §0  数模实战工具箱（Pandas/NumPy/Matplotlib/验证/论文六问）
├── stats_01_descriptive.html    # §I  描述性统计（均值/方差/偏度/峰度/Bessel/Box-Cox）
├── stats_02_visualization.html  # §II 数据可视化（直方图/箱线图/小提琴图/KDE/Q-Q/热力图）
├── stats_03_correlation.html    # §III 相关分析（Pearson/Spearman/Kendall/偏相关/CCA/dCor）
├── stats_04_hypothesis.html     # §IV 假设检验（t检验/卡方/Mann-Whitney/Bootstrap/效应量/多重校正）
├── stats_05_anova.html          # §V  方差分析（ANOVA/ANCOVA/MANOVA/Kruskal-Wallis/事后检验）
├── stats_06_regression.html     # §VI 线性回归（OLS矩阵/WLS/分位数回归/LASSO/Ridge/VIF）
├── stats_07_logistic.html       # §VII 逻辑回归（Logit/MLE/ROC/AUC/校准曲线/HL检验/GLM）
├── stats_08_classification.html # §VIII 分类方法（决策树/随机森林/XGBoost/SVM/KNN/朴素贝叶斯/SMOTE）
├── stats_09_clustering.html     # §IX 聚类分析（K-Means/层次/DBSCAN/GMM/轮廓系数）
├── stats_10_evaluation.html     # §X  模型评估与降维（混淆矩阵/交叉验证/PCA/PLS/偏差-方差）
├── stats_11_timeseries.html     # §XI 时间序列（ARIMA/SARIMA/ACF/ADF/Holt-Winters/季节分解）
├── stats_12_prediction.html     # §XII 预测问题专论（RMSE/MAE/MAPE/GM(1,1)/预测区间/数据泄漏）
├── stats_13_optimization.html   # §XIII 优化与决策（LP/IP/DP/多目标/背包/选址/TSP/VRP/鲁棒性）
├── stats_14_evaluation.html     # §XIV 综合评价与排序（熵权法/TOPSIS/AHP/PCA/模糊综合评价/灰色关联）
├── stats_15_mechanism.html      # §XV 机理建模与微分方程（Logistic/SIR/捕食者-猎物/扩散/数值求解）
└── stats_16_graph.html          # §XVI 图论、网络与仿真（Dijkstra/MST/中心性/蒙特卡洛/排队/元胞自动机）
```

## 竞赛路线图

11 种竞赛核心问题类型 → 对应章节：

| 问题类型 | 关键问题 | 对应章节 |
|---------|---------|---------|
| Q1 | 哪些因素有关？ | §III 相关分析 |
| Q2 | 两组数据是否存在显著差异？ | §IV 假设检验 |
| Q3 | 某因素对结果有多大影响？ | §V ANOVA + §VI 回归 |
| Q4 | 数据中有什么规律？ | §I 描述统计 + §II 可视化 |
| Q5 | 这个样本属于哪一类？ | §VII 逻辑回归 + §VIII 分类 |
| Q6 | 数据能否划分亚类？ | §IX 聚类 + §X 评估 |
| Q7 | 未来趋势如何预测？ | §XI 时间序列 + §XII 预测 |
| Q8 | 如何安排最优方案？ | §XIII 优化与决策 |
| Q9 | 哪个方案/地区最好？ | §XIV 综合评价 |
| Q10 | 系统如何随时间演化？ | §XV 机理建模 |
| Q11 | 最短路径？随机模拟？ | §XVI 图论与仿真 |

## 设计系统

| 元素 | 值 |
|------|-----|
| 底色 | `#FDFBF5` 暖羊皮纸 |
| 主色 | `#2D4A3E` 深森林绿 |
| 强调 | `#C75146` 陶土红 |
| 装饰 | `#8B6914` 暗金 |
| 衬线 | `#E8E0D5` 石材 |
| 正文灰 | `#5B6E65` 板岩 |
| 标题字体 | Cormorant Garamond |
| 正文字体 | Inter |
| 代码/数据字体 | JetBrains Mono |
| 数学渲染 | KaTeX v0.16.21 (本地 vendored) |
| 交互图表 | D3.js v7 (本地 vendored) |

每个交互 demo 设计为「实验室仪器」风格 — 仪表盘质感、操作面板、实时反馈。

## 写作原则

- **推导优先**：每个公式都有完整的数学推导，不跳过步骤
- **代码可运行**：所有 Python 代码示例可直接复制使用
- **竞赛导向**：每个章节包含竞赛真题场景、常见陷阱、写作模板
- **六问框架**：每个模型必须回答「为什么用 / 输入输出 / 假设 / 变量含义 / 可信度 / 缺点」

## 相关资源

- [KaTeX 文档](https://katex.org/docs/supported.html) — 支持的 LaTeX 命令
- [D3.js 文档](https://d3js.org/) — 交互式可视化库
- [scikit-learn 文档](https://scikit-learn.org/) — Python 机器学习库
- [SciPy 文档](https://docs.scipy.org/) — 科学计算库（优化、统计、积分）

## 开发与测试

```bash
npm ci                       # 安装依赖（需 Node.js 22+）
npx playwright install chromium  # 安装冒烟测试浏览器

npm test                     # 统计函数 + 链接 + 资源检查
npm run test:all             # 包含全部页面的浏览器冒烟测试
```

CI 在 push / PR 时并行运行四个 job：统计计算、内部链接、本地资源完整性、Playwright 浏览器冒烟。

## 许可

MIT License — 自由使用、修改和分发。

---

**Statistical Field Station** · 2026 · 所有计算在浏览器端完成 · KaTeX + D3.js