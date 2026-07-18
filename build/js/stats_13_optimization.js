// ============ INSTRUMENT No.13A: LP Visualization ============
(function() {
  const W = 460, H = 400, margin = {top:25, right:25, bottom:40, left:45};
  const pw = W - margin.left - margin.right;
  const ph = H - margin.top - margin.bottom;

  const svg = d3.select('#lp-chart').append('svg').attr('width',W).attr('height',H).attr('viewBox',`0 0 ${W} ${H}`);

  // Default constraints: x1 >= 0, x2 >= 0, x1 + x2 <= 8, 2x1 + x2 <= 12, x1 + 2x2 <= 12
  // Feasible region vertices
  const constraints = [
    {name: 'x₁ + x₂ ≤ 8',  a:1, b:1, c:8,  color:'#2D6BA0'},
    {name: '2x₁ + x₂ ≤ 12', a:2, b:1, c:12, color:'#5B8C3E'},
    {name: 'x₁ + 2x₂ ≤ 12', a:1, b:2, c:12, color:'#8B6914'},
  ];

  function getVertices() {
    // Collect all intersection points + axes intersections
    const pts = [];
    // x1=0, x2=0
    pts.push([0,0]);
    // Intersections with axes
    constraints.forEach(con => {
      if (con.c / con.a > 0) pts.push([con.c / con.a, 0]);
      if (con.c / con.b > 0) pts.push([0, con.c / con.b]);    // Intersections between pairs of constraints
    for (let i = 0; i < constraints.length; i++) {
      for (let j = i+1; j < constraints.length; j++) {
        const det = constraints[i].a * constraints[j].b - constraints[i].b * constraints[j].a;
        if (Math.abs(det) < 1e-10) continue;
        const x1 = (constraints[i].c * constraints[j].b - constraints[i].b * constraints[j].c) / det;
        const x2 = (constraints[i].a * constraints[j].c - constraints[i].c * constraints[j].a) / det;
        if (x1 >= -1e-9 && x2 >= -1e-9) pts.push([x1, x2]);
      }
    }
    // Filter: keep only points that satisfy all constraints
    const feasible = pts.filter(([x1,x2]) => {
      if (x1 < -1e-9 || x2 < -1e-9) return false;
      return constraints.every(c => c.a*x1 + c.b*x2 <= c.c + 1e-9);    // Remove duplicates
    const uniq = [];
    feasible.forEach(p => {
      if (!uniq.some(q => Math.abs(p[0]-q[0])<1e-8 && Math.abs(p[1]-q[1])<1e-8)) uniq.push(p);    // Sort by polar angle around centroid
    const cx = uniq.reduce((s,p)=>s+p[0],0)/uniq.length;
    const cy = uniq.reduce((s,p)=>s+p[1],0)/uniq.length;
    uniq.sort((a,b) => Math.atan2(a[1]-cy, a[0]-cx) - Math.atan2(b[1]-cy, b[0]-cx));
    return uniq;
  }

  function update() {
    const c1 = +d3.select('#lp-c1').property('value');
    const c2 = +d3.select('#lp-c2').property('value');
    d3.select('#lp-c1-val').text(c1.toFixed(1));
    d3.select('#lp-c2-val').text(c2.toFixed(1));

    const vertices = getVertices();
    const xMax = d3.max(vertices, d => d[0]) * 1.4 || 10;
    const yMax = d3.max(vertices, d => d[1]) * 1.4 || 10;
    const xScale = d3.scaleLinear().domain([0, xMax]).range([margin.left, margin.left+pw]);
    const yScale = d3.scaleLinear().domain([0, yMax]).range([margin.top+ph, margin.top]);

    svg.selectAll('*').remove();

    // Axes
    svg.append('g').attr('transform',`translate(0,${margin.top+ph})`).call(d3.axisBottom(xScale).ticks(6));
    svg.append('g').attr('transform',`translate(${margin.left},0)`).call(d3.axisLeft(yScale).ticks(6));
    svg.selectAll('.axis text').attr('font-family','var(--mono)').attr('font-size','0.7rem').attr('fill','var(--slate)');
    svg.selectAll('.axis line,.axis path').attr('stroke','var(--stone)');
    svg.append('text').attr('x',W/2).attr('y',H-6).attr('text-anchor','middle')
      .style('font-family','var(--mono)').style('font-size','0.7rem').style('fill','var(--slate)').text('x₁');
    svg.append('text').attr('x',-H/2).attr('y',10).attr('transform','rotate(-90)').attr('text-anchor','middle')
      .style('font-family','var(--mono)').style('font-size','0.7rem').style('fill','var(--slate)').text('x₂');

    // Feasible region
    if (vertices.length >= 3) {
      const areaGen = d3.area().x(d => xScale(d[0])).y0(yScale(0)).y1(d => yScale(d[1]));
      svg.append('path').datum(vertices).attr('d', areaGen)
        .attr('fill','rgba(45,107,160,0.15)').attr('stroke','#2D6BA0').attr('stroke-width',1.5);
    }

    // Constraint lines
    constraints.forEach(con => {
      const x1End = con.a !== 0 ? con.c / con.a : xMax;
      const x2End = con.b !== 0 ? con.c / con.b : yMax;
      let x1A, x2A, x1B, x2B;
      if (con.a !== 0 && con.b !== 0) {
        x1A = 0; x2A = con.c / con.b;
        x1B = con.c / con.a; x2B = 0;
      } else if (con.a === 0) {
        x1A = 0; x2A = con.c / con.b; x1B = xMax; x2B = con.c / con.b;
      } else {
        x1A = con.c / con.a; x2A = 0; x1B = con.c / con.a; x2B = yMax;
      }
      svg.append('line').attr('x1',xScale(x1A)).attr('x2',xScale(x1B))
        .attr('y1',yScale(x2A)).attr('y2',yScale(x2B))
        .attr('stroke',con.color).attr('stroke-width',1.5).attr('stroke-dasharray','6,3');
      // Label near midpoint
      const mx = (x1A + x1B) / 2, my = (x2A + x2B) / 2;
      svg.append('text').attr('x',xScale(mx)).attr('y',yScale(my)-6)
        .text(con.name).style('font-family','var(--mono)').style('font-size','0.6rem')
        .style('fill',con.color).style('text-anchor','middle');    // Find optimal vertex (minimize c1*x1 + c2*x2)
    let bestVal = Infinity, bestPt = null;
    vertices.forEach(([x1,x2]) => {
      const val = c1 * x1 + c2 * x2;
      if (val < bestVal) { bestVal = val; bestPt = [x1, x2]; }    // Objective contours
    if (bestPt && Math.abs(c1)+Math.abs(c2) > 0.01) {
      const objVal = c1 * bestPt[0] + c2 * bestPt[1];
      // Draw 3 contour lines
      for (let k = -1; k <= 2; k++) {
        const v = objVal + k * (objVal !== 0 ? Math.abs(objVal) * 0.3 : 1);
        // Line: c1*x1 + c2*x2 = v
        // x2 = (v - c1*x1) / c2
        if (Math.abs(c2) > 1e-10) {
          const x2At0 = v / c2;
          const x2AtMax = (v - c1 * xMax) / c2;
          svg.append('line').attr('x1',xScale(0)).attr('x2',xScale(xMax))
            .attr('y1',yScale(x2At0)).attr('y2',yScale(x2AtMax))
            .attr('stroke','var(--terracotta)').attr('stroke-width',1).attr('stroke-dasharray','3,3').attr('opacity',0.5);
        } else if (Math.abs(c1) > 1e-10) {
          const x1AtV = v / c1;
          svg.append('line').attr('x1',xScale(x1AtV)).attr('x2',xScale(x1AtV))
            .attr('y1',yScale(0)).attr('y2',yScale(yMax))
            .attr('stroke','var(--terracotta)').attr('stroke-width',1).attr('stroke-dasharray','3,3').attr('opacity',0.5);
        }
      }
    }

    // Optimal point
    if (bestPt) {
      svg.append('circle').attr('cx',xScale(bestPt[0])).attr('cy',yScale(bestPt[1]))
        .attr('r',7).attr('fill','var(--terracotta)').attr('stroke','#fff').attr('stroke-width',2);
      svg.append('text').attr('x',xScale(bestPt[0])+10).attr('y',yScale(bestPt[1])-10)
        .text(`(${bestPt[0].toFixed(2)}, ${bestPt[1].toFixed(2)})`)
        .style('font-family','var(--mono)').style('font-size','0.7rem').style('fill','var(--terracotta)');
    }

    // Info
    const isMin = true; // always min in this viz
    d3.select('#lp-info').html(`
      <div class="stat-card"><div class="lbl">最优解 x₁*</div><div class="val">${bestPt ? bestPt[0].toFixed(2) : '—'}</div></div>
      <div class="stat-card"><div class="lbl">最优解 x₂*</div><div class="val">${bestPt ? bestPt[1].toFixed(2) : '—'}</div></div>
      <div class="stat-card"><div class="lbl">最优值 Z*</div><div class="val" style="color:var(--terracotta)">${bestPt ? (c1*bestPt[0]+c2*bestPt[1]).toFixed(2) : '—'}</div></div>
      <div class="stat-card"><div class="lbl">顶点数</div><div class="val">${vertices.length}</div></div>
    `);
    d3.select('#lp-constraints-text').html(`
      min Z = ${c1.toFixed(1)}x₁ + ${c2.toFixed(1)}x₂<br>
      s.t. x₁ ≥ 0, x₂ ≥ 0<br>
      ${constraints.map(c => c.name).join('<br>')}
    `);
  }

  d3.select('#lp-c1').on('input', update);
  d3.select('#lp-c2').on('input', update);
  d3.select('#lp-preset1').on('click', () => {
    d3.select('#lp-c1').property('value', -3);
    d3.select('#lp-c2').property('value', -2);
    update();  d3.select('#lp-preset2').on('click', () => {
    d3.select('#lp-c1').property('value', 2);
    d3.select('#lp-c2').property('value', 3);
    update();  update();
})();

// ============ INSTRUMENT No.13B: Knapsack DP ============
(function() {
  const W = 460, H = 320, margin = {top:20, right:20, bottom:35, left:40};
  const pw = W - margin.left - margin.right;
  const ph = H - margin.top - margin.bottom;

  const kpSvg = d3.select('#kp-chart').append('svg').attr('width',W).attr('height',H).attr('viewBox',`0 0 ${W} ${H}`);
  const dpSvg = d3.select('#kp-dp-chart').append('svg').attr('width',W).attr('height',H).attr('viewBox',`0 0 ${W} ${H}`);

  let items = [];
  const nItems = 8;

  function generateItems() {
    items = [];
    for (let i = 0; i < nItems; i++) {
      items.push({
        name: `物品${i+1}`,
        weight: Math.floor(Math.random() * 8) + 2,
        value: Math.floor(Math.random() * 15) + 5    }
  }

  function solveKnapsack(capacity) {
    const n = items.length;
    const dp = Array.from({length: n+1}, () => new Array(capacity+1).fill(0));
    const keep = Array.from({length: n+1}, () => new Array(capacity+1).fill(false));

    for (let i = 1; i <= n; i++) {
      const w = items[i-1].weight, v = items[i-1].value;
      for (let j = 0; j <= capacity; j++) {
        dp[i][j] = dp[i-1][j];
        keep[i][j] = false;
        if (j >= w && dp[i-1][j-w] + v > dp[i][j]) {
          dp[i][j] = dp[i-1][j-w] + v;
          keep[i][j] = true;
        }
      }
    }

    // Backtrack
    const selected = [];
    let j = capacity;
    for (let i = n; i >= 1; i--) {
      if (keep[i][j]) {
        selected.push(i-1);
        j -= items[i-1].weight;
      }
    }
    selected.reverse();

    const totalWeight = selected.reduce((s,i) => s + items[i].weight, 0);
    const totalValue = dp[n][capacity];

    return {dp, keep, selected, totalWeight, totalValue};
  }

  function update() {
    const capacity = +d3.select('#kp-cap').property('value');
    d3.select('#kp-cap-val').text(capacity);
    const result = solveKnapsack(capacity);
    const {dp, keep, selected, totalWeight, totalValue} = result;

    // Items chart (bar chart)
    kpSvg.selectAll('*').remove();
    const barH = Math.min(30, (ph - 20) / nItems);
    const yScale = d3.scaleBand().domain(d3.range(nItems)).range([margin.top, margin.top + nItems * barH]).padding(0.2);
    const xMax = d3.max(items, d => Math.max(d.weight, d.value)) * 1.3;
    const xScale = d3.scaleLinear().domain([0, xMax]).range([margin.left, margin.left + pw]);

    kpSvg.append('g').attr('transform',`translate(0,${margin.top + nItems * barH})`).call(d3.axisBottom(xScale).ticks(5));
    kpSvg.selectAll('.axis text').attr('font-family','var(--mono)').attr('font-size','0.65rem').attr('fill','var(--slate)');
    kpSvg.selectAll('.axis line,.axis path').attr('stroke','var(--stone)');

    items.forEach((item, i) => {
      const y = yScale(i);
      const isSel = selected.includes(i);
      // Weight bar
      kpSvg.append('rect').attr('x', margin.left).attr('y', y)
        .attr('width', xScale(item.weight) - margin.left)
        .attr('height', yScale.bandwidth()/2 - 1)
        .attr('fill', isSel ? '#2D6BA0' : 'var(--stone)').attr('opacity', 0.8);
      // Value bar
      kpSvg.append('rect').attr('x', margin.left).attr('y', y + yScale.bandwidth()/2)
        .attr('width', xScale(item.value) - margin.left)
        .attr('height', yScale.bandwidth()/2 - 1)
        .attr('fill', isSel ? 'var(--terracotta)' : 'var(--stone)').attr('opacity', 0.8);
      // Label
      kpSvg.append('text').attr('x', margin.left - 4).attr('y', y + yScale.bandwidth()/2 + 4)
        .text(item.name).style('font-family','var(--mono)').style('font-size','0.6rem')
        .style('fill', isSel ? 'var(--forest)' : 'var(--slate)').style('text-anchor','end');
      // Weight & value text
      kpSvg.append('text').attr('x', xScale(item.weight) + 4).attr('y', y + yScale.bandwidth()/4 + 4)
        .text(`w=${item.weight}`).style('font-family','var(--mono)').style('font-size','0.55rem').style('fill','var(--slate)');
      kpSvg.append('text').attr('x', xScale(item.value) + 4).attr('y', y + 3*yScale.bandwidth()/4 + 4)
        .text(`v=${item.value}`).style('font-family','var(--mono)').style('font-size','0.55rem').style('fill','var(--slate)');    // Legend
    kpSvg.append('rect').attr('x',margin.left).attr('y',margin.top + nItems * barH + 8).attr('width',10).attr('height',6).attr('fill','var(--stone)').attr('opacity',0.8);
    kpSvg.append('text').attr('x',margin.left+14).attr('y',margin.top + nItems * barH + 15).text('重量').style('font-size','0.6rem').style('fill','var(--slate)');
    kpSvg.append('rect').attr('x',margin.left+50).attr('y',margin.top + nItems * barH + 8).attr('width',10).attr('height',6).attr('fill','var(--stone)').attr('opacity',0.8);
    kpSvg.append('text').attr('x',margin.left+64).attr('y',margin.top + nItems * barH + 15).text('价值').style('font-size','0.6rem').style('fill','var(--slate)');

    // DP table visualization (simplified: show the last row)
    dpSvg.selectAll('*').remove();
    const dpW = W, dpH = H, dpM = {top:15, right:15, bottom:35, left:45};
    const dpPw = dpW - dpM.left - dpM.right;
    const dpPh = dpH - dpM.top - dpM.bottom;

    // Show DP values as a heatmap (every few rows)
    const step = Math.max(1, Math.floor(nItems / 6));
    const rowsToShow = [];
    for (let i = 0; i <= nItems; i += step) rowsToShow.push(i);
    if (rowsToShow[rowsToShow.length-1] !== nItems) rowsToShow.push(nItems);

    const cellW = dpPw / (capacity + 1);
    const cellH = dpPh / rowsToShow.length;
    const maxVal = dp[nItems][capacity] || 1;

    const colorScale = d3.scaleSequential(d3.interpolateBlues).domain([0, maxVal]);

    rowsToShow.forEach((i, ri) => {
      for (let j = 0; j <= capacity; j++) {
        const alpha = dp[i][j] / maxVal;
        dpSvg.append('rect')
          .attr('x', dpM.left + j * cellW).attr('y', dpM.top + ri * cellH)
          .attr('width', cellW).attr('height', cellH)
          .attr('fill', colorScale(dp[i][j])).attr('stroke','#fff').attr('stroke-width',0.5);
        if (cellW > 18 && cellH > 12) {
          dpSvg.append('text')
            .attr('x', dpM.left + j * cellW + cellW/2).attr('y', dpM.top + ri * cellH + cellH/2 + 3)
            .attr('text-anchor','middle').style('font-family','var(--mono)').style('font-size','0.5rem')
            .style('fill', alpha > 0.5 ? '#fff' : 'var(--forest)').text(dp[i][j]);
        }
      }
      // Row label
      dpSvg.append('text').attr('x', dpM.left - 4).attr('y', dpM.top + ri * cellH + cellH/2 + 4)
        .text(`i=${i}`).style('font-family','var(--mono)').style('font-size','0.55rem')
        .style('fill','var(--slate)').style('text-anchor','end');    // Column labels (every few)
    for (let j = 0; j <= capacity; j += Math.max(1, Math.floor(capacity/8))) {
      dpSvg.append('text').attr('x', dpM.left + j * cellW + cellW/2).attr('y', dpM.top + rowsToShow.length * cellH + 12)
        .text(`w=${j}`).style('font-family','var(--mono)').style('font-size','0.5rem')
        .style('fill','var(--slate)').style('text-anchor','middle');
    }

    // Stats
    const selItems = selected.map(i => items[i]);
    d3.select('#kp-stats').html(`
      <div class="stat-card"><div class="lbl">最大价值</div><div class="val" style="color:var(--terracotta)">${totalValue}</div></div>
      <div class="stat-card"><div class="lbl">总重量</div><div class="val">${totalWeight} / ${capacity}</div></div>
      <div class="stat-card"><div class="lbl">选中物品</div><div class="val" style="font-size:0.9rem">${selItems.map(it => it.name).join(', ') || '—'}</div></div>
      <div class="stat-card"><div class="lbl">DP 子问题数</div><div class="val">${(nItems+1)*(capacity+1)}</div></div>
    `);
  }

  d3.select('#kp-cap').on('input', update);
  d3.select('#kp-reshuffle').on('click', () => { generateItems(); update(); });

  generateItems();
  update();
})();
