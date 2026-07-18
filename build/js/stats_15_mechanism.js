// ============ INSTRUMENT No.15A: Logistic Growth ============
(function() {
  const W = 500, H = 360, margin = {top:20, right:25, bottom:40, left:55};
  const pw = W - margin.left - margin.right;
  const ph = H - margin.top - margin.bottom;

  const svg = d3.select('#logistic-chart').append('svg').attr('width',W).attr('height',H).attr('viewBox',`0 0 ${W} ${H}`);

  function logistic(t, N0, K, r) {
    return K / (1 + ((K - N0) / N0) * Math.exp(-r * t));
  }

  function update() {
    const r = +d3.select('#log-r').property('value');
    const K = +d3.select('#log-K').property('value');
    const N0 = +d3.select('#log-N0').property('value');
    d3.select('#log-r-val').text(r.toFixed(2));
    d3.select('#log-K-val').text(K);
    d3.select('#log-N0-val').text(N0);

    // Three regimes: growth (N₀<K), decay (N₀>K), constant (N₀=K)
    const direction = N0 < K ? 'growth' : N0 > K ? 'decay' : 'constant';
    const tMax = Math.max(30 / Math.max(r, 0.05), 50);
    const yMax = Math.max(K, N0) * 1.1;
    // Inflection only exists for growth regime (N₀ < K)
    const tInf = direction === 'growth' ? Math.log((K - N0) / N0) / r : -1;
    const NInf = K / 2;

    const xScale = d3.scaleLinear().domain([0, tMax]).range([margin.left, margin.left+pw]);
    const yScale = d3.scaleLinear().domain([0, yMax]).range([margin.top+ph, margin.top]);

    svg.selectAll('*').remove();

    // Axes
    svg.append('g').attr('transform',`translate(0,${margin.top+ph})`).call(d3.axisBottom(xScale).ticks(6));
    svg.append('g').attr('transform',`translate(${margin.left},0)`).call(d3.axisLeft(yScale).ticks(6));
    svg.selectAll('.axis text').attr('font-family','var(--mono)').attr('font-size','0.7rem').attr('fill','var(--slate)');
    svg.selectAll('.axis line,.axis path').attr('stroke','var(--stone)');
    svg.append('text').attr('x',W/2).attr('y',H-6).attr('text-anchor','middle').style('font-family','var(--mono)').style('font-size','0.7rem').style('fill','var(--slate)').text('时间 t');
    svg.append('text').attr('x',-H/2).attr('y',12).attr('transform','rotate(-90)').attr('text-anchor','middle').style('font-family','var(--mono)').style('font-size','0.7rem').style('fill','var(--slate)').text('种群 N(t)');

    // K line
    svg.append('line').attr('x1',margin.left).attr('x2',margin.left+pw).attr('y1',yScale(K)).attr('y2',yScale(K)).attr('stroke','var(--gold)').attr('stroke-width',1).attr('stroke-dasharray','6,3');
    svg.append('text').attr('x',margin.left+4).attr('y',yScale(K)-6).text('K').style('font-family','var(--mono)').style('font-size','0.7rem').style('fill','var(--gold)');

    // Inflection point
    if (tInf > 0 && tInf < tMax) {
      svg.append('line').attr('x1',xScale(tInf)).attr('x2',xScale(tInf)).attr('y1',yScale(NInf)).attr('y2',yScale(0)).attr('stroke','var(--terracotta)').attr('stroke-width',1).attr('stroke-dasharray','4,4');
      svg.append('circle').attr('cx',xScale(tInf)).attr('cy',yScale(NInf)).attr('r',4).attr('fill','var(--terracotta)');
      svg.append('text').attr('x',xScale(tInf)+6).attr('y',yScale(NInf)-8).text('拐点').style('font-family','var(--mono)').style('font-size','0.65rem').style('fill','var(--terracotta)');
    }

    // Logistic curve
    const pts = [];
    const steps = 200;
    for (let i = 0; i <= steps; i++) {
      const t = tMax * i / steps;
      pts.push([t, logistic(t, N0, K, r)]);
    }

    const line = d3.line().x(d => xScale(d[0])).y(d => yScale(d[1]));
    svg.append('path').datum(pts).attr('d', line).attr('fill','none').attr('stroke','var(--forest)').attr('stroke-width',2.5);

    // Stats
    d3.select('#logistic-stats').html(`
      <div class="stat-card"><div class="lbl">阶段</div><div class="val">${direction==='growth'?'增长':direction==='decay'?'衰减':'恒定'}</div></div>
      <div class="stat-card"><div class="lbl">拐点时间 t*</div><div class="val">${tInf > 0 ? tInf.toFixed(2) : '—'}</div></div>
      <div class="stat-card"><div class="lbl">拐点 N</div><div class="val">${tInf > 0 ? NInf.toFixed(0) : '—'}</div></div>
      <div class="stat-card"><div class="lbl">终值 N(∞)</div><div class="val">${K}</div></div>
    `);
  }

  d3.select('#log-r').on('input', update);
  d3.select('#log-K').on('input', update);
  d3.select('#log-N0').on('input', update);
  update();
})();

// ============ INSTRUMENT No.15B: SIR Model ============
(function() {
  const W = 500, H = 360, margin = {top:20, right:25, bottom:40, left:55};
  const pw = W - margin.left - margin.right;
  const ph = H - margin.top - margin.bottom;

  const svg = d3.select('#sir-chart').append('svg').attr('width',W).attr('height',H).attr('viewBox',`0 0 ${W} ${H}`);

  function sirEuler(beta, gamma, N, I0, days, dt) {
    const steps = Math.floor(days / dt);
    let S = N - I0, I = I0, R = 0;
    const data = [];
    for (let i = 0; i <= steps; i++) {
      const t = i * dt;
      data.push({t, S, I, R});
      const dS = -beta * S * I / N;
      const dI = beta * S * I / N - gamma * I;
      const dR = gamma * I;
      S += dS * dt; I += dI * dt; R += dR * dt;
      if (S < 0) S = 0; if (I < 0) I = 0;
    }
    return data;
  }

  function update() {
    const beta = +d3.select('#sir-beta').property('value');
    const gamma = +d3.select('#sir-gamma').property('value');
    d3.select('#sir-beta-val').text(beta.toFixed(2));
    d3.select('#sir-gamma-val').text(gamma.toFixed(2));

    const N = 1000, I0 = 5, days = 80, dt = 0.2;
    const data = sirEuler(beta, gamma, N, I0, days, dt);
    const R0 = beta / gamma;

    const xScale = d3.scaleLinear().domain([0, days]).range([margin.left, margin.left+pw]);
    const yScale = d3.scaleLinear().domain([0, N*1.05]).range([margin.top+ph, margin.top]);

    svg.selectAll('*').remove();

    // Axes
    svg.append('g').attr('transform',`translate(0,${margin.top+ph})`).call(d3.axisBottom(xScale).ticks(6));
    svg.append('g').attr('transform',`translate(${margin.left},0)`).call(d3.axisLeft(yScale).ticks(6));
    svg.selectAll('.axis text').attr('font-family','var(--mono)').attr('font-size','0.7rem').attr('fill','var(--slate)');
    svg.selectAll('.axis line,.axis path').attr('stroke','var(--stone)');
    svg.append('text').attr('x',W/2).attr('y',H-6).attr('text-anchor','middle').style('font-family','var(--mono)').style('font-size','0.7rem').style('fill','var(--slate)').text('时间（天）');
    svg.append('text').attr('x',-H/2).attr('y',12).attr('transform','rotate(-90)').attr('text-anchor','middle').style('font-family','var(--mono)').style('font-size','0.7rem').style('fill','var(--slate)').text('人数');

    // Curves
    const lineS = d3.line().x(d => xScale(d.t)).y(d => yScale(d.S));
    const lineI = d3.line().x(d => xScale(d.t)).y(d => yScale(d.I));
    const lineR = d3.line().x(d => xScale(d.t)).y(d => yScale(d.R));

    svg.append('path').datum(data).attr('d', lineS).attr('fill','none').attr('stroke','#2D6BA0').attr('stroke-width',2);
    svg.append('path').datum(data).attr('d', lineI).attr('fill','none').attr('stroke','var(--terracotta)').attr('stroke-width',2);
    svg.append('path').datum(data).attr('d', lineR).attr('fill','none').attr('stroke','#5B8C3E').attr('stroke-width',2);

    // Legend
    const lx = margin.left + pw - 120, ly = margin.top + 10;
    [['S 易感','#2D6BA0'],['I 感染','var(--terracotta)'],['R 康复','#5B8C3E']].forEach(([lbl,clr],i) => {
      svg.append('line').attr('x1',lx).attr('x2',lx+20).attr('y1',ly+i*18).attr('y2',ly+i*18).attr('stroke',clr).attr('stroke-width',2);
      svg.append('text').attr('x',lx+24).attr('y',ly+i*18+4).text(lbl).style('font-family','var(--mono)').style('font-size','0.65rem').style('fill','var(--slate)');    // Peak
    const peakI = d3.max(data, d => d.I);
    const peakT = data.find(d => d.I === peakI)?.t || 0;
    const finalR = data[data.length-1].R;

    d3.select('#sir-stats').html(`
      <div class="stat-card"><div class="lbl">R₀ = β/γ</div><div class="val" style="color:${R0>1?'var(--terracotta)':'var(--forest)'}">${R0.toFixed(2)}</div></div>
      <div class="stat-card"><div class="lbl">峰值感染</div><div class="val">${Math.round(peakI)} 人</div></div>
      <div class="stat-card"><div class="lbl">峰值时间</div><div class="val">第 ${peakT.toFixed(0)} 天</div></div>
      <div class="stat-card"><div class="lbl">最终感染</div><div class="val">${Math.round(finalR)} 人 (${(finalR/N*100).toFixed(1)}%)</div></div>
    `);
  }

  d3.select('#sir-beta').on('input', update);
  d3.select('#sir-gamma').on('input', update);
  d3.select('#sir-preset1').on('click', () => { d3.select('#sir-beta').property('value',0.3); d3.select('#sir-gamma').property('value',0.1); update(); });
  d3.select('#sir-preset2').on('click', () => { d3.select('#sir-beta').property('value',0.15); d3.select('#sir-gamma').property('value',0.1); update(); });
  d3.select('#sir-preset3').on('click', () => { d3.select('#sir-beta').property('value',0.5); d3.select('#sir-gamma').property('value',0.4); update(); });
  update();
})();
