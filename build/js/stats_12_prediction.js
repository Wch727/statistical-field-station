// ============ INSTRUMENT No.12A: Regression Prediction Dashboard ============
(function() {
  const W = 700, H = 380, margin = {top:20, right:40, bottom:40, left:50};
  const pw = W - margin.left - margin.right;
  const ph = H - margin.top - margin.bottom;

  const svg = d3.select('#pred-main-chart').append('svg').attr('width',W).attr('height',H)
    .attr('viewBox',`0 0 ${W} ${H}`);

  let predData = [];
  let noise = 8, nPts = 30;

  function generateData() {
    predData = [];
    for (let i = 0; i < nPts; i++) {
      const x = 10 + Math.random() * 80;
      const y = 0.7 * x + 5 + (Math.random() + Math.random() + Math.random())/3 * noise * 2 - noise;
      predData.push({x, y});
    }
  }

  function fitOLS() {
    const xs = predData.map(d => d.x), ys = predData.map(d => d.y);
    const mx = d3.mean(xs), my = d3.mean(ys);
    let num = 0, den = 0;
    for (let i = 0; i < xs.length; i++) {
      num += (xs[i] - mx) * (ys[i] - my);
      den += (xs[i] - mx) ** 2;
    }
    const b1 = den === 0 ? 0 : num / den;
    const b0 = my - b1 * mx;
    // Residual variance
    let rss = 0;
    for (let i = 0; i < xs.length; i++) {
      rss += (ys[i] - (b0 + b1 * xs[i])) ** 2;
    }
    const sigma2 = rss / (xs.length - 2);
    const sigma = Math.sqrt(sigma2);
    const Sxx = den;
    return {b0, b1, sigma, sigma2, mx, Sxx, xs, ys};
  }

  function update() {
    const ols = fitOLS();
    const {b0, b1, sigma, mx, Sxx, xs, ys} = ols;
    const n = xs.length;

    // Compute metrics
    let mae = 0, mape = 0, rmse = 0, ssRes = 0, ssTot = 0;
    const my = d3.mean(ys);
    for (let i = 0; i < n; i++) {
      const yHat = b0 + b1 * xs[i];
      const err = Math.abs(ys[i] - yHat);
      mae += err;
      mape += ys[i] !== 0 ? err / Math.abs(ys[i]) : 0;
      ssRes += (ys[i] - yHat) ** 2;
      ssTot += (ys[i] - my) ** 2;
    }
    mae /= n;
    mape = mape / n * 100;
    rmse = Math.sqrt(ssRes / n);
    const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

    // Chart
    svg.selectAll('*').remove();

    const xExt = [d3.min(xs) - 5, d3.max(xs) + 5];
    const xAll = d3.range(Math.floor(xExt[0]), Math.ceil(xExt[1]) + 1, 0.5);
    const yHats = xAll.map(x => b0 + b1 * x);

    const yMin = d3.min(ys) - 10, yMax = d3.max(ys) + 10;
    const xScale = d3.scaleLinear().domain(xExt).range([margin.left, margin.left + pw]);
    const yScale = d3.scaleLinear().domain([yMin, yMax]).range([margin.top + ph, margin.top]);

    // Prediction interval band
    const tVal = 1.96; // approximate t_{n-2, 0.975} for n >= 30
    const piUpper = xAll.map((x, i) => {
      const se = sigma * Math.sqrt(1 + 1/n + (x - mx)**2 / Sxx);
      return yHats[i] + tVal * se;
    });
    const piLower = xAll.map((x, i) => {
      const se = sigma * Math.sqrt(1 + 1/n + (x - mx)**2 / Sxx);
      return yHats[i] - tVal * se;
    });
    // PI band
    const area = d3.area()
      .x((d, i) => xScale(xAll[i]))
      .y0((d, i) => yScale(piLower[i]))
      .y1((d, i) => yScale(piUpper[i]));
    svg.append('path').datum(piUpper).attr('d', area)
      .attr('fill', 'rgba(199,81,70,0.12)').attr('stroke','none');

    // Confidence interval band (narrower)
    const ciUpper = xAll.map((x, i) => {
      const se = sigma * Math.sqrt(1/n + (x - mx)**2 / Sxx);
      return yHats[i] + tVal * se;
    });
    const ciLower = xAll.map((x, i) => {
      const se = sigma * Math.sqrt(1/n + (x - mx)**2 / Sxx);
      return yHats[i] - tVal * se;
    });
    const ciArea = d3.area()
      .x((d, i) => xScale(xAll[i]))
      .y0((d, i) => yScale(ciLower[i]))
      .y1((d, i) => yScale(ciUpper[i]));
    svg.append('path').datum(ciUpper).attr('d', ciArea)
      .attr('fill', 'rgba(45,107,160,0.15)').attr('stroke','none');

    // Regression line
    const line = d3.line().x(d => xScale(d[0])).y(d => yScale(d[1]));
    const linePts = xAll.map((x, i) => [x, yHats[i]]);
    svg.append('path').datum(linePts).attr('d', line)
      .attr('fill','none').attr('stroke','var(--terracotta)').attr('stroke-width',2.5);

    // PI boundary lines
    const piUpLine = d3.line().x((d,i) => xScale(xAll[i])).y((d,i) => yScale(piUpper[i]));
    const piLoLine = d3.line().x((d,i) => xScale(xAll[i])).y((d,i) => yScale(piLower[i]));
    svg.append('path').datum(piUpper).attr('d', piUpLine)
      .attr('fill','none').attr('stroke','var(--terracotta)').attr('stroke-width',1).attr('stroke-dasharray','6,3').attr('opacity',0.5);
    svg.append('path').datum(piLower).attr('d', piLoLine)
      .attr('fill','none').attr('stroke','var(--terracotta)').attr('stroke-width',1).attr('stroke-dasharray','6,3').attr('opacity',0.5);

    // Data points
    svg.selectAll('.data-pt').data(predData).join('circle').attr('class','data-pt')
      .attr('cx', d => xScale(d.x)).attr('cy', d => yScale(d.y))
      .attr('r', 4.5).attr('fill','var(--forest)').attr('opacity',0.7).attr('stroke','#fff').attr('stroke-width',1);

    // Axes
    svg.append('g').attr('transform',`translate(0,${margin.top+ph})`).call(d3.axisBottom(xScale).ticks(6));
    svg.append('g').attr('transform',`translate(${margin.left},0)`).call(d3.axisLeft(yScale).ticks(6));
    svg.selectAll('.axis text').attr('font-family','var(--mono)').attr('font-size','0.7rem').attr('fill','var(--slate)');
    svg.selectAll('.axis line,.axis path').attr('stroke','var(--stone)');

    // Legend
    const lx = margin.left + 8, ly = margin.top + 4;
    svg.append('rect').attr('x',lx).attr('y',ly).attr('width',12).attr('height',12).attr('fill','var(--terracotta)').attr('opacity',0.3);
    svg.append('text').attr('x',lx+16).attr('y',ly+10).text('95% 预测区间').style('font-size','0.65rem').style('fill','var(--slate)').style('font-family','var(--mono)');
    svg.append('rect').attr('x',lx+110).attr('y',ly).attr('width',12).attr('height',12).attr('fill','rgba(45,107,160,0.3)');
    svg.append('text').attr('x',lx+126).attr('y',ly+10).text('95% 置信区间').style('font-size','0.65rem').style('fill','var(--slate)').style('font-family','var(--mono)');

    // Metrics
    d3.select('#pred-metrics').html(`
      <div class="stat-card"><div class="lbl">RMSE</div><div class="val" style="color:var(--terracotta)">${rmse.toFixed(3)}</div></div>
      <div class="stat-card"><div class="lbl">MAE</div><div class="val">${mae.toFixed(3)}</div></div>
      <div class="stat-card"><div class="lbl">MAPE</div><div class="val">${mape.toFixed(1)}%</div></div>
      <div class="stat-card"><div class="lbl">R²</div><div class="val" style="color:var(--gold)">${r2.toFixed(4)}</div></div>
      <div class="stat-card"><div class="lbl">β₁ (斜率)</div><div class="val">${b1.toFixed(3)}</div></div>
      <div class="stat-card"><div class="lbl">σ̂ (残差SE)</div><div class="val">${sigma.toFixed(3)}</div></div>
    `);
  }

  d3.select('#pred-noise').on('input', function() {
    noise = +this.value;
    d3.select('#pred-noise-val').text(noise.toFixed(1));
    generateData();
    update();
  });
  d3.select('#pred-n').on('input', function() {
    nPts = +this.value;
    d3.select('#pred-n-val').text(nPts);
    generateData();
    update();
  });
  d3.select('#pred-reshuffle').on('click', () => { generateData(); update(); });

  generateData();
  update();
})();

// ============ INSTRUMENT No.12B: GM(1,1) Grey Prediction ============
(function() {
  const W = 480, H = 280, margin = {top:15, right:20, bottom:35, left:45};
  const pw = W - margin.left - margin.right;
  const ph = H - margin.top - margin.bottom;

  const origSvg = d3.select('#gm-original-chart').append('svg').attr('width',W).attr('height',H).attr('viewBox',`0 0 ${W} ${H}`);
  const agoSvg = d3.select('#gm-ago-chart').append('svg').attr('width',W).attr('height',H).attr('viewBox',`0 0 ${W} ${H}`);

  let gmData = [];
  const nHist = 10;
  let forecastSteps = 3;

  function generateGMData() {
    gmData = [];
    // Generate data with an underlying exponential trend + noise
    const base = 20 + Math.random() * 30;
    const growth = 0.08 + Math.random() * 0.12;
    for (let i = 0; i < nHist; i++) {
      const trend = base * Math.exp(growth * i);
      const noise = (Math.random() - 0.5) * trend * 0.08;
      gmData.push(Math.max(1, trend + noise));
    }
  }

  function gm11(data, steps) {
    const n = data.length;
    // Step 1: 1-AGO
    const ago = [];
    let sum = 0;
    for (let i = 0; i < n; i++) { sum += data[i]; ago.push(sum); }

    // Step 2: Background values Z
    const Z = [];
    for (let k = 1; k < n; k++) {
      Z.push(0.5 * (ago[k] + ago[k-1]));
    }

    // Step 3: Build B and Y
    // B = [-Z(k), 1], Y = [x^(0)(k)], k=2..n
    let BtB00 = 0, BtB01 = 0, BtB11 = 0;
    let BtY0 = 0, BtY1 = 0;
    for (let k = 1; k < n; k++) {
      const z = Z[k-1];
      const y = data[k];
      BtB00 += z * z;
      BtB01 += -z;
      BtB11 += 1;
      BtY0 += -z * y;
      BtY1 += y;
    }
    BtB01 = BtB01; // sum of -z
    // Actually B = [[-z1, 1], [-z2, 1], ...]
    // B^T B = [[sum(z^2), -sum(z)], [-sum(z), n-1]]
    const BtB00v = BtB00;
    const BtB01v = -BtB01; // -sum(z)
    const BtB10v = BtB01v;
    const BtB11v = n - 1;

    const det = BtB00v * BtB11v - BtB01v * BtB10v;
    if (Math.abs(det) < 1e-12) return null;

    // Invert 2x2
    const inv00 = BtB11v / det;
    const inv01 = -BtB01v / det;
    const inv10 = -BtB10v / det;
    const inv11 = BtB00v / det;

    const BtY0v = BtY0;
    const BtY1v = BtY1;

    const a = inv00 * BtY0v + inv01 * BtY1v;
    const b = inv10 * BtY0v + inv11 * BtY1v;

    if (Math.abs(a) < 1e-12) return null;

    // Step 4: Time response
    const x0_1 = data[0];
    const x0Term = x0_1 - b / a;

    const fittedAgo = [];
    const fittedOrig = [x0_1];
    for (let k = 0; k < n + steps; k++) {
      const agoVal = x0Term * Math.exp(-a * k) + b / a;
      fittedAgo.push(agoVal);
      if (k > 0) {
        fittedOrig.push(agoVal - fittedAgo[k-1]);
      }
    }

    // Compute residuals and precision
    const residuals = [];
    let relErrSum = 0;
    for (let i = 0; i < n; i++) {
      const err = data[i] - fittedOrig[i];
      residuals.push(err);
      relErrSum += Math.abs(err) / data[i];
    }
    const mape = relErrSum / n * 100;

    const meanOrig = d3.mean(data);
    const S1 = Math.sqrt(d3.sum(data, d => (d - meanOrig)**2) / (n - 1));
    const meanRes = d3.mean(residuals);
    const S2 = Math.sqrt(d3.sum(residuals, r => (r - meanRes)**2) / (n - 1));
    const C = S1 > 0 ? S2 / S1 : 0;

    const threshold = 0.6745 * S1;
    let pCount = 0;
    for (let i = 0; i < n; i++) {
      if (Math.abs(residuals[i] - meanRes) < threshold) pCount++;
    }
    const P = pCount / n;

    let grade = '一级（好）';
    if (mape > 10 || C > 0.65 || P < 0.70) grade = '四级（不合格）';
    else if (mape > 5 || C > 0.50 || P < 0.80) grade = '三级（勉强）';
    else if (mape > 1 || C > 0.35 || P < 0.95) grade = '二级（合格）';

    return {a, b, ago, fittedAgo, fittedOrig, residuals, mape, C, P, grade, n};
  }

  function updateGM() {
    const result = gm11(gmData, forecastSteps);
    if (!result) { d3.select('#gm-stats').html('<div class="stat-card"><div class="lbl">错误</div><div class="val" style="color:var(--terracotta)">模型不可拟合</div></div>'); return; }
    const {a, b, ago, fittedAgo, fittedOrig, mape, C, P, grade, n} = result;

    // Original chart
    origSvg.selectAll('*').remove();
    const xExt = [0, n + forecastSteps - 1];
    const yExt = d3.extent([...gmData, ...fittedOrig.slice(0, n + forecastSteps)]);
    const yPad = (yExt[1] - yExt[0]) * 0.15 || 5;
    const xScale = d3.scaleLinear().domain(xExt).range([margin.left, margin.left + pw]);
    const yScale = d3.scaleLinear().domain([yExt[0] - yPad, yExt[1] + yPad]).range([margin.top + ph, margin.top]);

    origSvg.append('g').attr('transform',`translate(0,${margin.top+ph})`).call(d3.axisBottom(xScale).ticks(Math.min(10, n+forecastSteps)).tickFormat(d3.format('d')));
    origSvg.append('g').attr('transform',`translate(${margin.left},0)`).call(d3.axisLeft(yScale).ticks(5).tickFormat(d3.format('.1f')));
    origSvg.selectAll('.axis text').attr('font-family','var(--mono)').attr('font-size','0.7rem').attr('fill','var(--slate)');
    origSvg.selectAll('.axis line,.axis path').attr('stroke','var(--stone)');

    // Forecast divider
    const divX = xScale(n - 0.5);
    origSvg.append('line').attr('x1',divX).attr('x2',divX)
      .attr('y1',margin.top).attr('y2',margin.top+ph)
      .attr('stroke','var(--gold)').attr('stroke-width',1.5).attr('stroke-dasharray','6,4');

    // Fitted + forecast line
    const fitLine = d3.line().x((d,i) => xScale(i)).y(d => yScale(d));
    origSvg.append('path').datum(fittedOrig).attr('d',fitLine)
      .attr('fill','none').attr('stroke','var(--terracotta)').attr('stroke-width',2);

    // Fitted part (historical) - solid
    origSvg.append('path').datum(fittedOrig.slice(0, n)).attr('d',fitLine)
      .attr('fill','none').attr('stroke','var(--terracotta)').attr('stroke-width',2.5);

    // Forecast part - dashed
    origSvg.append('path').datum(fittedOrig.slice(n-1)).attr('d',fitLine)
      .attr('fill','none').attr('stroke','var(--terracotta)').attr('stroke-width',2.5).attr('stroke-dasharray','5,4');

    // Original data points
    origSvg.selectAll('.gm-pt').data(gmData).join('circle').attr('class','gm-pt')
      .attr('cx', (d,i) => xScale(i)).attr('cy', d => yScale(d))
      .attr('r', 4.5).attr('fill','var(--forest)').attr('stroke','#fff').attr('stroke-width',1);

    // Forecast points
    for (let i = n; i < n + forecastSteps; i++) {
      origSvg.append('circle')
        .attr('cx', xScale(i)).attr('cy', yScale(fittedOrig[i]))
        .attr('r', 4.5).attr('fill','none').attr('stroke','var(--terracotta)').attr('stroke-width',2);
    }

    // Labels
    origSvg.append('text').attr('x',xScale(n/2)).attr('y',margin.top+14)
      .text('训练期').style('font-family','var(--mono)').style('font-size','0.6rem').style('fill','var(--forest)').style('text-anchor','middle');
    origSvg.append('text').attr('x',xScale(n + forecastSteps/2 - 0.5)).attr('y',margin.top+14)
      .text('预测期').style('font-family','var(--mono)').style('font-size','0.6rem').style('fill','var(--terracotta)').style('text-anchor','middle');

    // AGO chart
    agoSvg.selectAll('*').remove();
    const agoExt = [0, n + forecastSteps - 1];
    const agoYExt = d3.extent(fittedAgo);
    const agoYPad = (agoYExt[1] - agoYExt[0]) * 0.1 || 5;
    const agoXScale = d3.scaleLinear().domain(agoExt).range([margin.left, margin.left + pw]);
    const agoYScale = d3.scaleLinear().domain([agoYExt[0] - agoYPad, agoYExt[1] + agoYPad]).range([margin.top + ph, margin.top]);

    agoSvg.append('g').attr('transform',`translate(0,${margin.top+ph})`).call(d3.axisBottom(agoXScale).ticks(Math.min(10, n+forecastSteps)).tickFormat(d3.format('d')));
    agoSvg.append('g').attr('transform',`translate(${margin.left},0)`).call(d3.axisLeft(agoYScale).ticks(5).tickFormat(d3.format('.1f')));
    agoSvg.selectAll('.axis text').attr('font-family','var(--mono)').attr('font-size','0.7rem').attr('fill','var(--slate)');
    agoSvg.selectAll('.axis line,.axis path').attr('stroke','var(--stone)');

    // AGO fitted line
    const agoLine = d3.line().x((d,i) => agoXScale(i)).y(d => agoYScale(d));
    agoSvg.append('path').datum(fittedAgo).attr('d',agoLine)
      .attr('fill','none').attr('stroke','#2D6BA0').attr('stroke-width',2);

    // AGO actual points
    agoSvg.selectAll('.ago-pt').data(ago).join('circle').attr('class','ago-pt')
      .attr('cx', (d,i) => agoXScale(i)).attr('cy', d => agoYScale(d))
      .attr('r', 4.5).attr('fill','#2D6BA0').attr('stroke','#fff').attr('stroke-width',1);

    // Stats
    const gradeColor = grade.includes('一') ? 'var(--forest)' : (grade.includes('二') ? '#2D6BA0' : (grade.includes('三') ? 'var(--gold)' : 'var(--terracotta)'));
    d3.select('#gm-stats').html(`
      <div class="stat-card"><div class="lbl">发展系数 â</div><div class="val">${a.toFixed(4)}</div></div>
      <div class="stat-card"><div class="lbl">灰色作用量 b̂</div><div class="val">${b.toFixed(3)}</div></div>
      <div class="stat-card"><div class="lbl">MAPE</div><div class="val">${mape.toFixed(2)}%</div></div>
      <div class="stat-card"><div class="lbl">后验差比 C</div><div class="val">${C.toFixed(3)}</div></div>
      <div class="stat-card"><div class="lbl">小误差概率 P</div><div class="val">${P.toFixed(3)}</div></div>
      <div class="stat-card"><div class="lbl">精度等级</div><div class="val" style="font-size:0.9rem;color:${gradeColor}">${grade}</div></div>
    `);
  }

  d3.select('#gm-steps').on('input', function() {
    forecastSteps = +this.value;
    d3.select('#gm-steps-val').text(forecastSteps);
    updateGM();
  });
  d3.select('#gm-reshuffle').on('click', () => { generateGMData(); updateGM(); });
  d3.select('#gm-add-noise').on('click', () => {
    for (let i = 0; i < gmData.length; i++) {
      gmData[i] += (Math.random() - 0.5) * gmData[i] * 0.12;
      gmData[i] = Math.max(1, gmData[i]);
    }
    updateGM();  generateGMData();
  updateGM();
})();
});
