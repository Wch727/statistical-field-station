# 统计教程审阅与修正记录

本轮范围：17 个章节（含 §0 工具箱）、目录页的方法选择说明、统计术语表、各章交互 JavaScript 与共享概率函数。审阅对象是仓库中的正文、公式、代码示例和交互计算；回归测试直接执行实际源函数或实际页面。

## 逐章检查范围

| 章节 | 检查与修正重点 |
| --- | --- |
| §0 工具箱 | 索引对齐、样本方差、训练折内预处理、时间/分组划分、验证指标解释 |
| §I 描述统计 | 偏度峰度定义、分位数、CV、异常值和缺失处理条件、常量输入 |
| §II 可视化 | 直方图与KDE密度尺度、实际观测箱须、图形解读边界 |
| §III 相关 | 秩与并列值、相关与因果、偏相关与回归、CCA、总体与样本性质 |
| §IV 假设检验 | 采样独立性、尾概率、功效、置换条件、效应量、交互面板初始化 |
| §V 方差分析 | 正确F分布尾概率、效应量、ANCOVA模型比较、非参数检验与重复测量条件 |
| §VI 回归 | OLS条件、模型参数计数、正则化与截距、退化数据和推断条件 |
| §VII 逻辑回归 | 概率与优势比、关联与因果、拟合优度检验、分离与边界情况 |
| §VIII 分类 | 算法条件、AdaBoost公式、类别不平衡与验证、D3交互事件 |
| §IX 聚类 | K-Means样本不足、DBSCAN边界与噪声、模型假设和评价边界 |
| §X 评估与降维 | 精确经验ROC/AUC及同分、真实对称特征分解、数据泄漏与模型选择 |
| §XI 时间序列 | 平稳性检验零假设、分解示意、季节模型与验证条件 |
| §XII 预测 | 预测区间、GM参数估计、误差指标及时间顺序评估 |
| §XIII 优化 | 可行性、对偶与影子价格、整数约束、动态规划和路线问题条件 |
| §XIV 综合评价 | AHP特征计算与一致性、赋权和排序解释、方法前提 |
| §XV 机理 | SIR人口归一化、初始条件、有限时刻与最终规模、数值解和参数解释 |
| §XVI 图论与仿真 | 最短路前提与邻接结构、随机模拟误差、排队稳定性、交通更新规则 |

共享数值函数增加参数域、无穷值与稳定生存函数处理，避免通过 `1-CDF` 计算极小尾概率时相消为零。术语表由 JSON 单一源生成离线 JS，并检查两份数据一致。

## 验证入口

- `npm run build`：生成章节页面与离线术语数据。
- `npm test`：共享统计函数、三组章节数值回归、链接和资源一致性。
- `npm run test:all`：再检查桌面/手机页面、相关面板回归和 KaTeX 渲染。
- `python -m pytest tests/python -q`：使用 SciPy 交叉验证概率分布及相关系数。
- CI 的构建一致性检查要求生成页面与源文件保持一致。

数值回归覆盖有参考值、数学不变量和已知错误的输入；真实数据分析仍需结合具体抽样设计与模型诊断。Python片段中的外部数据与第三方环境没有被当作完整数据集实验结果。

## 核验资料

- [SciPy 统计函数](https://docs.scipy.org/doc/scipy/reference/stats.html)
- [SciPy skew](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.skew.html)
- [SciPy t 生存函数](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.t.html)
- [SciPy 卡方分布](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.chi2.html)
- [SciPy Wilcoxon](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.wilcoxon.html)
- [NIST 正态概率图](https://www.itl.nist.gov/div898/handbook/eda/section3/normprpl.htm)
- [Matplotlib 箱线图定义](https://matplotlib.org/stable/api/_as_gen/matplotlib.pyplot.boxplot.html)
- [scikit-learn 数据泄漏](https://scikit-learn.org/stable/common_pitfalls.html)
- [scikit-learn 评估指标](https://scikit-learn.org/stable/modules/model_evaluation.html)
- [statsmodels ADF](https://www.statsmodels.org/stable/generated/statsmodels.tsa.stattools.adfuller.html)

## 本地验收结果

- 共享统计函数：38 项通过。
- 章节专项回归：基础章节 11 项、回归与机器学习 7 组，以及时间序列、预测、优化、综合评价、机理和图论仿真专项检查全部通过。
- SciPy 对照：72 项通过。
- 页面与交互：23/23 通过，包含桌面与手机视口、KaTeX 渲染、并列秩、常量输入、零斜率逻辑回归、Shift 点击分类、聚类样本不足和 PCA 旋转不变性。
- 链接、静态资源与术语数据一致性检查通过。
