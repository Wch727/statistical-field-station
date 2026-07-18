// === Instrument 0A: Cross-Validation Visualizer ===
(function() {
  if (typeof d3 === 'undefined') return;

  const container = d3.select('#cv-chart');
  const W = 720, H = 320;
  const margin = {top: 30, right: 30, bottom: 40, left: 50};
  const pw = W - margin.left - margin.right;
  const ph = H - margin.top - margin.bottom;

  const svg = container.append('svg').attr('viewBox', `0 0 ${W} ${H}`).style('max-width','100%');
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  // Generate synthetic data: y = 2x + 1 + noise
  const N = 30;
  let data = [];
  let currentFold = 0;
  let K = 5;

  function generateData() {
    data = [];
    for (let i = 0; i < N; i++) {
      const x = Math.random() * 10;
      const y = 2 * x + 1 + (Math.random() - 0.5) * 4;
      data.push({x, y, idx: i});
    }
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function getFolds() {
    const shuffled = shuffle(data);
    const folds = [];
    const foldSize = Math.floor(N / K);
    const remainder = N % K;
    let start = 0;
    for (let i = 0; i < K; i++) {
      const size = foldSize + (i < remainder ? 1 : 0);
      folds.push(shuffled.slice(start, start + size));
      start += size;
    }
    return folds;
  }

  let folds = [];

  function linearRegression(points) {
    const n = points.length;
    if (n < 2) return {slope: 0, intercept: 0, mse: 0};
    const sx = points.reduce((s, d) => s + d.x, 0);
    const sy = points.reduce((s, d) => s + d.y, 0);
    const sxx = points.reduce((s, d) => s + d.x * d.x, 0);
    const sxy = points.reduce((s, d) => s + d.x * d.y, 0);
    const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx);
    const intercept = (sy - slope * sx) / n;
    const mse = points.reduce((s, d) => {
      const err = d.y - (slope * d.x + intercept);
      return s + err * err;
    }, 0) / n;
    return {slope, intercept, mse};
  }

  function draw() {
    g.selectAll('*').remove();

    const xExt = d3.extent(data, d => d.x);
    const yExt = d3.extent(data, d => d.y);
    const xPad = (xExt[1] - xExt[0]) * 0.1;
    const yPad = (yExt[1] - yExt[0]) * 0.1;
    const xScale = d3.scaleLinear().domain([xExt[0] - xPad, xExt[1] + xPad]).range([0, pw]);
    const yScale = d3.scaleLinear().domain([yExt[0] - yPad, yExt[1] + yPad]).range([ph, 0]);

    // Axes
    const xAxis = d3.axisBottom(xScale).ticks(6);
    const yAxis = d3.axisLeft(yScale).ticks(5);
    g.append('g').attr('transform', `translate(0,${ph})`).call(xAxis)
      .selectAll('text').attr('font-family','var(--mono)').attr('font-size','0.7rem').attr('fill','var(--slate)');
    g.selectAll('.axis line,.axis path').attr('stroke','var(--stone)');
    g.append('g').call(yAxis)
      .selectAll('text').attr('font-family','var(--mono)').attr('font-size','0.7rem').attr('fill','var(--slate)');

    // Axis labels
    g.append('text').attr('x', pw/2).attr('y', ph + 32).attr('text-anchor','middle')
      .style('font-family','var(--mono)').style('font-size','0.7rem').style('fill','var(--slate)').text('x');
    g.append('text').attr('x', -ph/2).attr('y', -38).attr('transform','rotate(-90)')
      .attr('text-anchor','middle').style('font-family','var(--mono)')
      .style('font-size','0.7rem').style('fill','var(--slate)').text('y');

    if (folds.length === 0) return;

    const testSet = folds[currentFold];
    const testIdx = new Set(testSet.map(d => d.idx));
    const trainSet = [];
    for (let i = 0; i < K; i++) {
      if (i !== currentFold) trainSet.push(...folds[i]);
    }

    // Train points
    g.selectAll('.train-pt').data(trainSet).join('circle')
      .attr('cx', d => xScale(d.x)).attr('cy', d => yScale(d.y))
      .attr('r', 5).attr('fill', 'var(--forest)').attr('fill-opacity', 0.7)
      .attr('stroke', 'var(--forest)').attr('stroke-width', 1);

    // Test points
    g.selectAll('.test-pt').data(testSet).join('circle')
      .attr('cx', d => xScale(d.x)).attr('cy', d => yScale(d.y))
      .attr('r', 6).attr('fill', 'var(--terracotta)').attr('fill-opacity', 0.85)
      .attr('stroke', 'var(--terracotta)').attr('stroke-width', 2);

    // Regression line (fitted on training data)
    const lr = linearRegression(trainSet);
    const x0 = xExt[0] - xPad;
    const x1 = xExt[1] + xPad;
    g.append('line')
      .attr('x1', xScale(x0)).attr('y1', yScale(lr.slope * x0 + lr.intercept))
      .attr('x2', xScale(x1)).attr('y2', yScale(lr.slope * x1 + lr.intercept))
      .attr('stroke', 'var(--gold)').attr('stroke-width', 2).attr('stroke-dasharray', '6,3')
      .attr('stroke-opacity', 0.6);

    // Test MSE
    const testMSE = testSet.reduce((s, d) => {
      const err = d.y - (lr.slope * d.x + lr.intercept);
      return s + err * err;
    }, 0) / testSet.length;

    // Update stats
    d3.select('#cv-fold-num').text(`${currentFold + 1}/${K}`);
    d3.select('#cv-train-n').text(trainSet.length);
    d3.select('#cv-test-n').text(testSet.length);
    d3.select('#cv-train-mse').text(lr.mse.toFixed(3));
    d3.select('#cv-test-mse').text(testMSE.toFixed(3));
  }

  function init() {
    generateData();
    folds = getFolds();
    currentFold = 0;
    draw();
    updateFoldDisplay();
  }

  function updateFoldDisplay() {
    d3.select('#cv-fold-num').text(`${currentFold + 1}/${K}`);
  }

  d3.select('#cv-k').on('input', function() {
    K = +this.value;
    d3.select('#cv-k-val').text(K);
    currentFold = 0;
    folds = getFolds();
    draw();
    updateFoldDisplay();
  });
  d3.select('#cv-next').on('click', () => {
    currentFold = (currentFold + 1) % K;
    draw();
    updateFoldDisplay();
  });
  d3.select('#cv-prev').on('click', () => {
    currentFold = (currentFold - 1 + K) % K;
    draw();
    updateFoldDisplay();
  });
  d3.select('#cv-shuffle').on('click', () => {
    generateData();
    currentFold = 0;
    folds = getFolds();
    draw();
    updateFoldDisplay();
  });
  init();
})();
