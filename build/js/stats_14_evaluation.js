// ============ INSTRUMENT No.14A: TOPSIS ============
(function() {
  const W = 460, H = 400, margin = {top:25, right:25, bottom:40, left:45};
  const pw = W - margin.left - margin.right;
  const ph = H - margin.top - margin.bottom;

  const svg = d3.select('#topsis-chart').append('svg').attr('width',W).attr('height',H).attr('viewBox',`0 0 ${W} ${H}`);

  // 6 alternatives, 2 criteria (both already benefit-type, need normalization)
  const rawData = [
    {name: 'A₁', c1: 0.85, c2: 0.60},
    {name: 'A₂', c1: 0.70, c2: 0.90},
    {name: 'A₃', c1: 0.50, c2: 0.45},
    {name: 'A₄', c1: 0.90, c2: 0.35},
    {name: 'A₅', c1: 0.40, c2: 0.80},
    {name: 'A₆', c1: 0.65, c2: 0.55},
  ];

  function topsis(data, w1, w2) {
    // Vector normalization
    const ss1 = Math.sqrt(data.reduce((s,d) => s + d.c1*d.c1, 0));
    const ss2 = Math.sqrt(data.reduce((s,d) => s + d.c2*d.c2, 0));
    const norm = data.map(d => ({name: d.name, r1: d.c1/ss1, r2: d.c2/ss2}));

    // Weighted normalized
    const wnorm = norm.map(d => ({name: d.name, v1: w1*d.r1, v2: w2*d.r2}));

    // Ideal & anti-ideal
    const ideal = {v1: Math.max(...wnorm.map(d=>d.v1)), v2: Math.max(...wnorm.map(d=>d.v2))};
    const anti = {v1: Math.min(...wnorm.map(d=>d.v1)), v2: Math.min(...wnorm.map(d=>d.v2))};

    // Distances
    const result = wnorm.map(d => {
      const sp = Math.sqrt((d.v1-ideal.v1)**2 + (d.v2-ideal.v2)**2);
      const sm = Math.sqrt((d.v1-anti.v1)**2 + (d.v2-anti.v2)**2);
      const c = sm / (sp + sm);
      return {name: d.name, v1: d.v1, v2: d.v2, sp, sm, c};
    });
    result.sort((a,b) => b.c - a.c);
    return {result, ideal, anti};
  }

  function update() {
    const w1 = +d3.select('#ts-w1').property('value');
    const w2 = +d3.select('#ts-w2').property('value');
    d3.select('#ts-w1-val').text(w1.toFixed(2));
    d3.select('#ts-w2-val').text(w2.toFixed(2));

    const {result, ideal, anti} = topsis(rawData, w1, w2);

    const xScale = d3.scaleLinear().domain([0, d3.max(result, d=>Math.max(d.v1, ideal.v1))*1.15]).range([margin.left, margin.left+pw]);
    const yScale = d3.scaleLinear().domain([0, d3.max(result, d=>Math.max(d.v2, ideal.v2))*1.15]).range([margin.top+ph, margin.top]);

    svg.selectAll('*').remove();

    // Axes
    svg.append('g').attr('transform',`translate(0,${margin.top+ph})`).call(d3.axisBottom(xScale).ticks(5));
    svg.append('g').attr('transform',`translate(${margin.left},0)`).call(d3.axisLeft(yScale).ticks(5));
    svg.selectAll('.axis text').attr('font-family','var(--mono)').attr('font-size','0.7rem').attr('fill','var(--slate)');
    svg.selectAll('.axis line,.axis path').attr('stroke','var(--stone)');
    svg.append('text').attr('x',W/2).attr('y',H-6).attr('text-anchor','middle').style('font-family','var(--mono)').style('font-size','0.7rem').style('fill','var(--slate)').text('指标 1（加权标准化值）');
    svg.append('text').attr('x',-H/2).attr('y',10).attr('transform','rotate(-90)').attr('text-anchor','middle').style('font-family','var(--mono)').style('font-size','0.7rem').style('fill','var(--slate)').text('指标 2（加权标准化值）');

    // Ideal & anti-ideal
    svg.append('text').attr('x',xScale(ideal.v1)).attr('y',yScale(ideal.v2)-10).text('★ A⁺').style('fill','#2D6BA0').style('font-family','var(--mono)').style('font-size','0.75rem').style('font-weight','700').style('text-anchor','middle');
    svg.append('circle').attr('cx',xScale(ideal.v1)).attr('cy',yScale(ideal.v2)).attr('r',6).attr('fill','#2D6BA0').attr('stroke','#fff').attr('stroke-width',2);

    svg.append('text').attr('x',xScale(anti.v1)).attr('y',yScale(anti.v2)+16).text('A⁻').style('fill','var(--terracotta)').style('font-family','var(--mono)').style('font-size','0.75rem').style('font-weight','700').style('text-anchor','middle');
    svg.append('circle').attr('cx',xScale(anti.v1)).attr('cy',yScale(anti.v2)).attr('r',6).attr('fill','var(--terracotta)').attr('stroke','#fff').attr('stroke-width',2);

    // Points + lines
    result.forEach(d => {
      // Line to ideal (dashed)
      svg.append('line').attr('x1',xScale(d.v1)).attr('y1',yScale(d.v2)).attr('x2',xScale(ideal.v1)).attr('y2',yScale(ideal.v2)).attr('stroke','#2D6BA0').attr('stroke-width',1).attr('stroke-dasharray','4,4').attr('opacity',0.4);
      // Line to anti-ideal (solid faint)
      svg.append('line').attr('x1',xScale(d.v1)).attr('y1',yScale(d.v2)).attr('x2',xScale(anti.v1)).attr('y2',yScale(anti.v2)).attr('stroke','var(--terracotta)').attr('stroke-width',1).attr('stroke-dasharray','2,3').attr('opacity',0.4);
      // Point
      svg.append('circle').attr('cx',xScale(d.v1)).attr('cy',yScale(d.v2)).attr('r',5).attr('fill','var(--forest)').attr('stroke','#fff').attr('stroke-width',1.5);
      svg.append('text').attr('x',xScale(d.v1)+8).attr('y',yScale(d.v2)-6).text(d.name).style('font-family','var(--mono)').style('font-size','0.7rem').style('fill','var(--forest)').style('font-weight','600');
    });

    // Ranking table
    const colors = ['var(--terracotta)','var(--gold)','var(--forest)','var(--slate)','var(--slate)','var(--slate)'];
    d3.select('#topsis-rank').html(`
      <p style="font-family:var(--mono);font-size:0.72rem;color:var(--slate);margin-bottom:8px">排名（相对贴近度 Cᵢ）：</p>
      <table class="compact-table" style="font-size:0.8rem">
        <thead><tr><th>排名</th><th>方案</th><th>S⁺</th><th>S⁻</th><th>Cᵢ</th></tr></thead>
        <tbody>
          ${result.map((d,i) => `
            <tr>
              <td style="color:${colors[i]};font-weight:700">${i+1}</td>
              <td style="font-weight:600">${d.name}</td>
              <td>${d.sp.toFixed(3)}</td>
              <td>${d.sm.toFixed(3)}</td>
              <td style="color:${colors[i]};font-weight:700">${d.c.toFixed(4)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `);
  }

  d3.select('#ts-w1').on('input', update);
  d3.select('#ts-w2').on('input', update);
  d3.select('#ts-preset1').on('click', () => { d3.select('#ts-w1').property('value',0.5); d3.select('#ts-w2').property('value',0.5); update(); });
  d3.select('#ts-preset2').on('click', () => { d3.select('#ts-w1').property('value',0.85); d3.select('#ts-w2').property('value',0.15); update(); });
  d3.select('#ts-preset3').on('click', () => { d3.select('#ts-w1').property('value',0.15); d3.select('#ts-w2').property('value',0.85); update(); });
  update();
})();

// ============ INSTRUMENT No.14B: AHP ============
(function() {
  const criteria = ['教学水平', '科研实力', '就业前景', '校园环境'];
  const n = criteria.length;
  const RI = [0,0,0,0.58,0.90,1.12,1.24,1.32,1.41,1.45,1.49,1.51,1.54,1.56,1.58];

  // Default pairwise comparisons (upper triangle, row-major)
  // a12, a13, a14, a23, a24, a34
  const defaultPairs = [3, 5, 7, 2, 4, 3];
  const scales = [1/9,1/8,1/7,1/6,1/5,1/4,1/3,1/2,1,2,3,4,5,6,7,8,9];
  const pairLabels = [
    '教学水平 vs 科研实力',
    '教学水平 vs 就业前景',
    '教学水平 vs 校园环境',
    '科研实力 vs 就业前景',
    '科研实力 vs 校园环境',
    '就业前景 vs 校园环境'
  ];

  // Build slider HTML
  const slidersDiv = d3.select('#ahp-sliders');
  pairLabels.forEach((label, idx) => {
    const row = slidersDiv.append('div').style('display','flex').style('align-items','center').style('gap','8px').style('margin-bottom','6px');
    row.append('span').style('font-family','var(--mono)').style('font-size','0.7rem').style('color','var(--slate)').style('min-width','140px').text(label);
    row.append('input').attr('type','range').attr('id',`ahp-p${idx}`).attr('min',0).attr('max',16).attr('value',scales.indexOf(defaultPairs[idx])).style('flex','1').style('accent-color','var(--terracotta)');
    row.append('span').attr('id',`ahp-v${idx}`).style('font-family','var(--mono)').style('font-size','0.78rem').style('font-weight','600').style('color','var(--terracotta)').style('min-width','36px').style('text-align','right');
  });
  const wSvg = d3.select('#ahp-weight-chart').append('svg').attr('width',380).attr('height',160).attr('viewBox','0 0 380 160');

  function update() {
    // Get values
    const pairs = pairLabels.map((_,i) => {
      const idx = +d3.select(`#ahp-p${i}`).property('value');
      return scales[idx];
    });
    pairs.forEach((v,i) => d3.select(`#ahp-v${i}`).text(v < 1 ? v.toFixed(2) : v.toFixed(0)));

    // Build full matrix
    const A = Array.from({length: n}, () => new Array(n).fill(1));
    A[0][1] = pairs[0]; A[0][2] = pairs[1]; A[0][3] = pairs[2];
    A[1][2] = pairs[3]; A[1][3] = pairs[4];
    A[2][3] = pairs[5];
    for (let i = 0; i < n; i++)
      for (let j = i+1; j < n; j++)
        A[j][i] = 1 / A[i][j];

    // Geometric mean weights
    const gm = A.map(row => Math.pow(row.reduce((p,v)=>p*v,1), 1/n));
    const gmSum = gm.reduce((s,v)=>s+v,0);
    const w = gm.map(v => v / gmSum);

    // lambda_max
    const Aw = A.map(row => row.reduce((s,v,j)=>s+v*w[j], 0));
    const lambdaMax = Aw.reduce((s,v,i) => s + v/w[i], 0) / n;

    // Consistency
    const CI = (lambdaMax - n) / (n - 1);
    const CR = CI / RI[n];

    // Stats
    d3.select('#ahp-stats').html(`
      <div class="stat-card"><div class="lbl">λ_max</div><div class="val">${lambdaMax.toFixed(4)}</div></div>
      <div class="stat-card"><div class="lbl">CI</div><div class="val">${CI.toFixed(4)}</div></div>
      <div class="stat-card"><div class="lbl">CR</div><div class="val" style="color:${CR < 0.1 ? 'var(--forest)' : 'var(--terracotta)'}">${CR.toFixed(4)}</div></div>
      <div class="stat-card"><div class="lbl">RI(n)</div><div class="val">${RI[n].toFixed(2)}</div></div>
    `);

    const verdict = CR < 0.1
      ? '<span style="color:var(--forest)">✓ CR < 0.1，判断矩阵通过一致性检验。权重结果可信。</span>'
      : '<span style="color:var(--terracotta)">✗ CR ≥ 0.1，判断矩阵不一致！请调整两两比较，减少矛盾判断。</span>';
    d3.select('#ahp-verdict').html(verdict);

    // Weight bar chart
    wSvg.selectAll('*').remove();
    const barH = 28, gap = 8, totalH = n * (barH + gap);
    const yScale = d3.scaleBand().domain(d3.range(n)).range([10, 10+totalH]).padding(0.2);
    const xScale = d3.scaleLinear().domain([0, Math.max(...w)*1.2]).range([80, 360]);

    wSvg.selectAll('rect').data(w).join('rect')
      .attr('x', 80).attr('y', (d,i) => yScale(i))
      .attr('width', d => xScale(d) - 80).attr('height', yScale.bandwidth())
      .attr('fill', (d,i) => ['var(--terracotta)','var(--gold)','var(--forest)','var(--slate)'][i])
      .attr('opacity', 0.85);

    wSvg.selectAll('text.label').data(w).join('text')
      .attr('x', 76).attr('y', (d,i) => yScale(i) + yScale.bandwidth()/2 + 4)
      .attr('text-anchor','end').style('font-family','var(--mono)').style('font-size','0.7rem')
      .style('fill','var(--slate)').text((d,i) => criteria[i]);

    wSvg.selectAll('text.val').data(w).join('text')
      .attr('x', d => xScale(d) + 4).attr('y', (d,i) => yScale(i) + yScale.bandwidth()/2 + 4)
      .style('font-family','var(--mono)').style('font-size','0.72rem').style('font-weight','600')
      .style('fill','var(--forest)').text(d => d.toFixed(3));
  }

  pairLabels.forEach((_, i) => d3.select(`#ahp-p${i}`).on('input', update));
  update();
})();
