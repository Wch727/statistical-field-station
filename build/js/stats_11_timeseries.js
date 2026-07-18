// ============ INSTRUMENT No.11: Time Series ============
(function() {
  const W = 520, H = 240, margin = {top:15, right:15, bottom:30, left:40};
  const pw = W - margin.left - margin.right;
  const ph = H - margin.top - margin.bottom;

  function makeSvg(sel) {
    const svg = d3.select(sel).append('svg').attr('width',W).attr('height',H).attr('viewBox',`0 0 ${W} ${H}`);
    svg.append('rect').attr('x',margin.left).attr('y',margin.top).attr('width',pw).attr('height',ph)
      .attr('fill','#FAF8F3').attr('stroke','var(--stone)').attr('stroke-width',0.5);
    return svg;
  }

  const seriesSvg = makeSvg('#ts-series-chart');
  const decompSvg = makeSvg('#ts-decomp-chart');
  const acfSvg = makeSvg('#ts-acf-chart');
  const pacfSvg = makeSvg('#ts-pacf-chart');

  let tsData = [], trend = [], seasonal = [], residual = [];
  let n = 200;

  function generateTrendSeasonal() {
    tsData = []; trend = []; seasonal = [];
    for (let t = 0; t < n; t++) {
      const tr = 0.02 * t + 0.005 * Math.sin(t/30);
      const s = 0.3 * Math.sin(2*Math.PI*t/24);
      const r = (Math.random()-0.5)*0.3;
      trend.push(tr);
      seasonal.push(s);
      residual.push(r);
      tsData.push(tr + s + r);
    }
  }

  function generateRandomWalk() {
    tsData = []; trend = []; seasonal = []; residual = [];
    let y = 0;
    for (let t = 0; t < n; t++) {
      y += (Math.random()-0.5)*0.3;
      tsData.push(y);
      trend.push(0); seasonal.push(0); residual.push(0);
    }
  }

  function generateAR2() {
    tsData = []; trend = []; seasonal = []; residual = [];
    let y1 = 0, y2 = 0;
    for (let t = 0; t < n; t++) {
      const y = 0.7*y1 - 0.3*y2 + (Math.random()-0.5)*0.5;
      tsData.push(y);
      trend.push(0); seasonal.push(0); residual.push(0);
      y2 = y1; y1 = y;
    }
  }

  function generateMA2() {
    tsData = []; trend = []; seasonal = []; residual = [];
    let e1 = 0, e2 = 0;
    for (let t = 0; t < n; t++) {
      const e = (Math.random()-0.5)*0.5;
      const y = e + 0.6*e1 + 0.3*e2;
      tsData.push(y);
      trend.push(0); seasonal.push(0); residual.push(0);
      e2 = e1; e1 = e;
    }
  }

  function acf(data, maxLag) {
    const mean = d3.mean(data);
    const denom = d3.sum(data, d => (d-mean)**2);
    const acfVals = [];
    for (let k = 0; k <= maxLag; k++) {
      let num = 0;
      for (let t = k; t < data.length; t++) num += (data[t]-mean)*(data[t-k]-mean);
      acfVals.push(num/denom);
    }
    return acfVals;
  }

  function pacfFromACF(acfVals) {
    // Durbin-Levinson recursion
    const p = acfVals.length - 1;
    const phi = Array.from({length: p+1}, () => new Array(p+1).fill(0));
    const pacfVals = [1];
    for (let k = 1; k <= p; k++) {
      let num = acfVals[k], denom = 1;
      for (let j = 1; j < k; j++) { num -= phi[k-1][j] * acfVals[k-j]; denom -= phi[k-1][j] * acfVals[j]; }
      phi[k][k] = num / (denom || 1e-10);
      pacfVals.push(phi[k][k]);
      for (let j = 1; j < k; j++) phi[k][j] = phi[k-1][j] - phi[k][k] * phi[k-1][k-j];
    }
    return pacfVals;
  }

  function drawLineChart(svg, data, color, yLabel) {
    svg.selectAll('*').remove();
    svg.append('rect').attr('x',margin.left).attr('y',margin.top).attr('width',pw).attr('height',ph)
      .attr('fill','#FAF8F3').attr('stroke','var(--stone)').attr('stroke-width',0.5);
    const xExt = [0, data.length-1];
    const yExt = d3.extent(data);
    const yPad = (yExt[1]-yExt[0])*0.1 || 0.5;
    const xScale = d3.scaleLinear().domain(xExt).range([margin.left, margin.left+pw]);
    const yScale = d3.scaleLinear().domain([yExt[0]-yPad, yExt[1]+yPad]).range([margin.top+ph, margin.top]);

    svg.append('g').attr('transform',`translate(0,${margin.top+ph})`).call(d3.axisBottom(xScale).ticks(4));
    svg.append('g').attr('transform',`translate(${margin.left},0)`).call(d3.axisLeft(yScale).ticks(4).tickFormat(d3.format('.1f')));
    if (yLabel) {
      svg.append('text').attr('x',-H/2).attr('y',10).attr('transform','rotate(-90)').attr('text-anchor','middle')
        .style('font-family','var(--mono)').style('font-size','0.55rem').style('fill','var(--slate)').text(yLabel);
    }

    const line = d3.line().x((d,i) => xScale(i)).y(d => yScale(d));
    svg.append('path').datum(data).attr('d',line).attr('fill','none').attr('stroke',color).attr('stroke-width',1.5);
    svg.append('line').attr('x1',margin.left).attr('x2',margin.left+pw).attr('y1',yScale(0)).attr('y2',yScale(0))
      .attr('stroke','var(--stone)').attr('stroke-width',0.5).attr('stroke-dasharray','3,3');
  }

  function drawCorrelogram(svg, values, color, yLabel, confBound) {
    svg.selectAll('*').remove();
    svg.append('rect').attr('x',margin.left).attr('y',margin.top).attr('width',pw).attr('height',ph)
      .attr('fill','#FAF8F3').attr('stroke','var(--stone)').attr('stroke-width',0.5);
    const maxLag = values.length - 1;
    const xScale = d3.scaleLinear().domain([0, maxLag]).range([margin.left, margin.left+pw]);
    const yScale = d3.scaleLinear().domain([-1, 1]).range([margin.top+ph, margin.top]);

    svg.append('g').attr('transform',`translate(0,${margin.top+ph})`).call(d3.axisBottom(xScale).ticks(Math.min(maxLag,10)));
    svg.append('g').attr('transform',`translate(${margin.left},0)`).call(d3.axisLeft(yScale).ticks(5));
    if (yLabel) {
      svg.append('text').attr('x',-H/2).attr('y',10).attr('transform','rotate(-90)').attr('text-anchor','middle')
        .style('font-family','var(--mono)').style('font-size','0.55rem').style('fill','var(--slate)').text(yLabel);
    }

    // Confidence bounds
    if (confBound) {
      svg.append('line').attr('x1',margin.left).attr('x2',margin.left+pw).attr('y1',yScale(confBound)).attr('y2',yScale(confBound))
        .attr('stroke','var(--terracotta)').attr('stroke-width',0.8).attr('stroke-dasharray','4,4').attr('opacity',0.5);
      svg.append('line').attr('x1',margin.left).attr('x2',margin.left+pw).attr('y1',yScale(-confBound)).attr('y2',yScale(-confBound))
        .attr('stroke','var(--terracotta)').attr('stroke-width',0.8).attr('stroke-dasharray','4,4').attr('opacity',0.5);
    }

    // Bars
    const barW = Math.max(2, pw / (maxLag+1) * 0.6);
    for (let k = 0; k <= maxLag; k++) {
      svg.append('rect').attr('x', xScale(k)-barW/2).attr('y', yScale(Math.max(0, values[k])))
        .attr('width', barW).attr('height', Math.abs(yScale(values[k])-yScale(0)))
        .attr('fill', k === 0 ? 'var(--slate)' : color).attr('opacity', 0.8);
    }
  }

  function update() {
    const acfVals = acf(tsData, 30);
    const pacfVals = pacfFromACF(acfVals);
    const conf = 1.96 / Math.sqrt(n);

    drawLineChart(seriesSvg, tsData, 'var(--forest)', '原始序列');
    // Decomposition: trend + seasonal + residual
    drawLineChart(decompSvg, tsData, 'var(--slate)', '分解');
    drawCorrelogram(acfSvg, acfVals, '#2D6BA0', 'ACF', conf);
    drawCorrelogram(pacfSvg, pacfVals, '#C75146', 'PACF', conf);

    // Stats
    const adfApprox = Math.abs(acfVals[1]) < 0.3 ? '可能平稳' : (acfVals[1] > 0.8 ? '可能非平稳' : '不确定');
    d3.select('#ts-stats').html(`
      <div class="stat-card"><div class="lbl">样本数</div><div class="val">${n}</div></div>
      <div class="stat-card"><div class="lbl">均值</div><div class="val">${d3.mean(tsData).toFixed(3)}</div></div>
      <div class="stat-card"><div class="lbl">方差</div><div class="val">${d3.variance(tsData).toFixed(3)}</div></div>
      <div class="stat-card"><div class="lbl">ρ₁ (lag-1 ACF)</div><div class="val">${acfVals[1].toFixed(3)}</div></div>
      <div class="stat-card"><div class="lbl">平稳性判断</div><div class="val" style="font-size:0.9rem;color:${adfApprox.includes('平稳')?'var(--forest)':'var(--terracotta)'}">${adfApprox}</div></div>
    `);
  }

  function setActive(btn) {
    d3.selectAll('#ts-trend-seas,#ts-random-walk,#ts-ar2,#ts-ma2').classed('active', false);
    d3.select(btn).classed('active', true);
  }

  d3.select('#ts-trend-seas').on('click', () => { setActive('#ts-trend-seas'); generateTrendSeasonal(); update(); });
  d3.select('#ts-random-walk').on('click', () => { setActive('#ts-random-walk'); generateRandomWalk(); update(); });
  d3.select('#ts-ar2').on('click', () => { setActive('#ts-ar2'); generateAR2(); update(); });
  d3.select('#ts-ma2').on('click', () => { setActive('#ts-ma2'); generateMA2(); update(); });
  d3.select('#ts-reshuffle').on('click', update);

  generateTrendSeasonal();
  update();
})();
