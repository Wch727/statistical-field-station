// ============ INSTRUMENT No.10A: Confusion Matrix ============
(function() {
  const W = 520, H = 280, margin = {top:20, right:30, bottom:35, left:40};
  const pw = W - margin.left - margin.right;
  const ph = H - margin.top - margin.bottom;

  const svg = d3.select('#cm-dist-chart').append('svg').attr('width',W).attr('height',H)
    .attr('viewBox',`0 0 ${W} ${H}`);

  let scoresNeg = [], scoresPos = [];

  function generateScores(ratio) {
    const nPos = Math.floor(200 * ratio);
    const nNeg = 200 - nPos;
    scoresPos = [];
    scoresNeg = [];
    // Positive class: scores centered around 0.65
    for (let i = 0; i < nPos; i++) {
      scoresPos.push(Math.max(0, Math.min(1, 0.65 + (Math.random()+Math.random()+Math.random())/3*0.5 - 0.25)));
    }
    // Negative class: scores centered around 0.35
    for (let i = 0; i < nNeg; i++) {
      scoresNeg.push(Math.max(0, Math.min(1, 0.35 + (Math.random()+Math.random()+Math.random())/3*0.5 - 0.25)));
    }
  }

  function computeMetrics(thresh) {
    const tp = scoresPos.filter(s => s >= thresh).length;
    const fn = scoresPos.filter(s => s < thresh).length;
    const fp = scoresNeg.filter(s => s >= thresh).length;
    const tn = scoresNeg.filter(s => s < thresh).length;
    const acc = (tp+tn)/(tp+tn+fp+fn);
    const prec = tp/(tp+fp) || 0;
    const rec = tp/(tp+fn) || 0;
    const f1 = (prec+rec > 0) ? 2*prec*rec/(prec+rec) : 0;
    return {tp, fn, fp, tn, acc, prec, rec, f1};
  }

  function computeROCPoints() {
    const points = [];
    for (let t = 0; t <= 1.01; t += 0.02) {
      const tp = scoresPos.filter(s => s >= t).length;
      const fn = scoresPos.length - tp;
      const fp = scoresNeg.filter(s => s >= t).length;
      const tn = scoresNeg.length - fp;
      const tpr = tp/(tp+fn) || 0;
      const fpr = fp/(fp+tn) || 0;
      points.push({fpr, tpr, thresh: t});
    }
    return points;
  }

  function computeAUC() {
    const pts = computeROCPoints().sort((a, b) => a.fpr - b.fpr);
    let auc = 0;
    for (let i = 1; i < pts.length; i++) {
      auc += (pts[i].fpr - pts[i-1].fpr) * (pts[i].tpr + pts[i-1].tpr) / 2;
    }
    return auc;
  }

  function update() {
    const thresh = +d3.select('#cm-thresh').property('value');
    const ratio = +d3.select('#cm-ratio').property('value');
    d3.select('#cm-thresh-val').text(thresh.toFixed(2));
    d3.select('#cm-ratio-val').text(ratio.toFixed(2));

    const m = computeMetrics(thresh);
    const auc = computeAUC();
    const rocPts = computeROCPoints();

    // Distribution chart
    svg.selectAll('*').remove();
    const xScale = d3.scaleLinear().domain([0,1]).range([margin.left, margin.left+pw]);

    // KDE histograms
    const bins = d3.bin().domain([0,1]).thresholds(40);
    const histNeg = bins(scoresNeg);
    const histPos = bins(scoresPos);
    const maxH = d3.max([...histNeg, ...histPos], d => d.length) || 1;
    const yScale = d3.scaleLinear().domain([0, maxH*1.15]).range([margin.top+ph, margin.top]);

    // Axes
    svg.append('g').attr('transform',`translate(0,${margin.top+ph})`).call(d3.axisBottom(xScale).ticks(5));
    svg.append('g').attr('transform',`translate(${margin.left},0)`).call(d3.axisLeft(yScale).ticks(4));
    svg.append('text').attr('x',W/2).attr('y',H-4).attr('text-anchor','middle')
      .style('font-family','var(--mono)').style('font-size','0.65rem').style('fill','var(--slate)').text('Score');
    svg.append('text').attr('x',-H/2).attr('y',12).attr('transform','rotate(-90)').attr('text-anchor','middle')
      .style('font-family','var(--mono)').style('font-size','0.65rem').style('fill','var(--slate)').text('Count');

    // Histograms
    histNeg.forEach(d => {
      svg.append('rect').attr('x', xScale(d.x0)).attr('y', yScale(d.length))
        .attr('width', Math.max(1, xScale(d.x1)-xScale(d.x0)-1))
        .attr('height', yScale(0)-yScale(d.length))
        .attr('fill', '#2D6BA0').attr('opacity', 0.5);    histPos.forEach(d => {
      svg.append('rect').attr('x', xScale(d.x0)).attr('y', yScale(d.length))
        .attr('width', Math.max(1, xScale(d.x1)-xScale(d.x0)-1))
        .attr('height', yScale(0)-yScale(d.length))
        .attr('fill', '#C75146').attr('opacity', 0.5);    // Threshold line
    svg.append('line').attr('x1',xScale(thresh)).attr('x2',xScale(thresh))
      .attr('y1',margin.top).attr('y2',margin.top+ph)
      .attr('stroke','var(--gold)').attr('stroke-width',2).attr('stroke-dasharray','6,3');

    // Legend
    svg.append('rect').attr('x',margin.left+8).attr('y',margin.top+4).attr('width',10).attr('height',10).attr('fill','#C75146').attr('opacity',0.5);
    svg.append('text').attr('x',margin.left+22).attr('y',margin.top+13).text('正类').style('font-size','0.7rem').style('fill','var(--slate)');
    svg.append('rect').attr('x',margin.left+68).attr('y',margin.top+4).attr('width',10).attr('height',10).attr('fill','#2D6BA0').attr('opacity',0.5);
    svg.append('text').attr('x',margin.left+82).attr('y',margin.top+13).text('负类').style('font-size','0.7rem').style('fill','var(--slate)');

    // Confusion matrix display
    d3.select('#cm-matrix').html(`
      <div class="cm-header"></div><div class="cm-header">预测正</div><div class="cm-header">预测负</div>
      <div class="cm-header">真实正</div><div class="cm-cell tp">${m.tp}</div><div class="cm-cell fn">${m.fn}</div>
      <div class="cm-header">真实负</div><div class="cm-cell fp">${m.fp}</div><div class="cm-cell tn">${m.tn}</div>
    `);

    // Stats
    d3.select('#cm-stats').html(`
      <div class="stat-card"><div class="lbl">准确率 Acc</div><div class="val">${(m.acc*100).toFixed(1)}%</div></div>
      <div class="stat-card"><div class="lbl">精确率 Prec</div><div class="val" style="color:#2D6BA0">${(m.prec*100).toFixed(1)}%</div></div>
      <div class="stat-card"><div class="lbl">召回率 Rec</div><div class="val" style="color:var(--terracotta)">${(m.rec*100).toFixed(1)}%</div></div>
      <div class="stat-card"><div class="lbl">F1 分数</div><div class="val" style="color:var(--forest)">${(m.f1*100).toFixed(1)}%</div></div>
      <div class="stat-card"><div class="lbl">AUC</div><div class="val" style="color:var(--gold)">${auc.toFixed(3)}</div></div>
    `);

    // ROC curve
    const rocSvg = d3.select('#cm-roc-chart');
    rocSvg.selectAll('*').remove();
    const rW = 320, rH = 280, rM = {top:20, right:20, bottom:35, left:40};
    const rPw = rW - rM.left - rM.right, rPh = rH - rM.top - rM.bottom;
    const rSvg = rocSvg.append('svg').attr('width',rW).attr('height',rH).attr('viewBox',`0 0 ${rW} ${rH}`);

    const rx = d3.scaleLinear().domain([0,1]).range([rM.left, rM.left+rPw]);
    const ry = d3.scaleLinear().domain([0,1]).range([rM.top+rPh, rM.top]);

    rSvg.append('g').attr('transform',`translate(0,${rM.top+rPh})`).call(d3.axisBottom(rx).ticks(4));
    rSvg.append('g').attr('transform',`translate(${rM.left},0)`).call(d3.axisLeft(ry).ticks(4));
    rSvg.append('text').attr('x',rW/2).attr('y',rH-4).attr('text-anchor','middle')
      .style('font-family','var(--mono)').style('font-size','0.6rem').style('fill','var(--slate)').text('FPR');
    rSvg.append('text').attr('x',-rH/2).attr('y',10).attr('transform','rotate(-90)').attr('text-anchor','middle')
      .style('font-family','var(--mono)').style('font-size','0.6rem').style('fill','var(--slate)').text('TPR');

    // Diagonal
    rSvg.append('line').attr('x1',rx(0)).attr('x2',rx(1)).attr('y1',ry(0)).attr('y2',ry(1))
      .attr('stroke','var(--stone)').attr('stroke-width',1).attr('stroke-dasharray','4,4');

    // ROC curve
    const line = d3.line().x(d => rx(d.fpr)).y(d => ry(d.tpr));
    rSvg.append('path').datum(rocPts).attr('d',line)
      .attr('fill','none').attr('stroke','var(--terracotta)').attr('stroke-width',2);

    // AUC fill
    const areaPts = [...rocPts, {fpr:1,tpr:0}];
    const area = d3.area().x(d => rx(d.fpr)).y0(ry(0)).y1(d => ry(d.tpr));
    rSvg.append('path').datum(areaPts).attr('d',area)
      .attr('fill','rgba(199,81,70,0.1)');

    rSvg.append('text').attr('x',rx(0.6)).attr('y',ry(0.2))
      .style('font-family','var(--mono)').style('font-size','0.7rem').style('fill','var(--terracotta)')
      .text(`AUC = ${auc.toFixed(3)}`);
  }

  d3.select('#cm-thresh').on('input', update);
  d3.select('#cm-ratio').on('input', function() {
    generateScores(+this.value);
    update();  d3.select('#cm-reshuffle').on('click', function() {
    generateScores(+d3.select('#cm-ratio').property('value'));
    update();  generateScores(0.3);
  update();
})();

// ============ INSTRUMENT No.10B: PCA ============
(function() {
  const W = 480, H = 380, margin = {top:20, right:20, bottom:40, left:45};
  const pw = W - margin.left - margin.right;
  const ph = H - margin.top - margin.bottom;

  const scatterSvg = d3.select('#pca-scatter-chart').append('svg').attr('width',W).attr('height',H)
    .attr('viewBox',`0 0 ${W} ${H}`);
  const screeSvg = d3.select('#pca-scree-chart').append('svg').attr('width',W).attr('height',H)
    .attr('viewBox',`0 0 ${W} ${H}`);

  let data3D = []; // {x1, x2, x3}
  let pc1 = [], pc2 = [];
  let evals = []; // eigenvalues

  function generateData() {
    data3D = [];
    // Generate correlated 3D data
    for (let i = 0; i < 120; i++) {
      const a = Math.random()*4 - 2; // latent factor 1
      const b = Math.random()*3 - 1.5; // latent factor 2
      const noise = (Math.random()-0.5)*0.5;
      data3D.push({
        x1: 0.8*a + 0.2*b + noise,
        x2: 0.6*a - 0.4*b + (Math.random()-0.5)*0.5,
        x3: 0.4*a + 0.6*b + (Math.random()-0.5)*0.5    }
  }

  function computePCA() {
    if (data3D.length === 0) return;
    const n = data3D.length;
    // Compute means
    const mx1 = d3.mean(data3D, d => d.x1), mx2 = d3.mean(data3D, d => d.x2), mx3 = d3.mean(data3D, d => d.x3);
    // Center
    const X = data3D.map(d => [d.x1-mx1, d.x2-mx2, d.x3-mx3]);
    // Covariance matrix (3x3)
    const cov = [[0,0,0],[0,0,0],[0,0,0]];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        let s = 0;
        for (let k = 0; k < n; k++) s += X[k][i] * X[k][j];
        cov[i][j] = s / (n-1);
      }
    }
    // Power iteration for eigenvalues/vectors (simplified for 3x3)
    // Use characteristic polynomial for 3x3
    const a = cov[0][0], b = cov[0][1], c = cov[0][2];
    const d = cov[1][0], e = cov[1][1], f = cov[1][2];
    const g = cov[2][0], h = cov[2][1], i = cov[2][2];

    // Trace, determinant, and sum of principal minors
    const tr = a + e + i;
    const det = a*(e*i-f*h) - b*(d*i-f*g) + c*(d*h-e*g);
    const m2 = (a*e-b*d) + (a*i-c*g) + (e*i-f*h);

    // Characteristic: λ³ - tr·λ² + m2·λ - det = 0
    // Use numerical approach for eigenvalues
    function charPoly(lam) { return lam*lam*lam - tr*lam*lam + m2*lam - det; }
    // Find roots via simple search
    const roots = [];
    for (let lam = -5; lam <= 5; lam += 0.001) {
      const v = charPoly(lam);
      if (Math.abs(v) < 0.01 && (roots.length === 0 || Math.abs(lam - roots[roots.length-1]) > 0.05)) {
        roots.push(lam);
      }
    }
    evals = roots.sort((a,b) => b-a).slice(0,3);
    if (evals.length < 3) evals = [1, 0.5, 0.2]; // fallback

    // Compute eigenvectors (simplified: use inverse iteration)
    // For simplicity, approximate PC1, PC2 by projecting
    // Actually, let's compute eigenvectors properly
    function computeEigenvector(lambda) {
      const M = [[a-lambda, b, c], [d, e-lambda, f], [g, h, i-lambda]];
      // Solve M·v = 0 using cross product of two rows
      // Pick two independent rows
      let v = [0,0,0];
      // Cross product of row 0 and row 1
      v[0] = M[0][1]*M[1][2] - M[0][2]*M[1][1];
      v[1] = M[0][2]*M[1][0] - M[0][0]*M[1][2];
      v[2] = M[0][0]*M[1][1] - M[0][1]*M[1][0];
      const norm = Math.sqrt(v[0]*v[0]+v[1]*v[1]+v[2]*v[2]);
      if (norm < 1e-10) {
        // Use row 0 and row 2
        v[0] = M[0][1]*M[2][2] - M[0][2]*M[2][1];
        v[1] = M[0][2]*M[2][0] - M[0][0]*M[2][2];
        v[2] = M[0][0]*M[2][1] - M[0][1]*M[2][0];
        const n2 = Math.sqrt(v[0]*v[0]+v[1]*v[1]+v[2]*v[2]);
        if (n2 < 1e-10) return [1,0,0];
        return [v[0]/n2, v[1]/n2, v[2]/n2];
      }
      return [v[0]/norm, v[1]/norm, v[2]/norm];
    }

    const ev1 = computeEigenvector(evals[0]);
    const ev2 = computeEigenvector(evals[1]);

    // Project to PC1, PC2
    pc1 = X.map(x => x[0]*ev1[0] + x[1]*ev1[1] + x[2]*ev1[2]);
    pc2 = X.map(x => x[0]*ev2[0] + x[1]*ev2[1] + x[2]*ev2[2]);
  }

  function update() {
    computePCA();

    // Scatter plot
    scatterSvg.selectAll('*').remove();
    if (pc1.length === 0) return;

    const xExt = d3.extent(pc1), yExt = d3.extent(pc2);
    const xPad = (xExt[1]-xExt[0])*0.1 || 0.5;
    const yPad = (yExt[1]-yExt[0])*0.1 || 0.5;
    const xScale = d3.scaleLinear().domain([xExt[0]-xPad, xExt[1]+xPad]).range([margin.left, margin.left+pw]);
    const yScale = d3.scaleLinear().domain([yExt[0]-yPad, yExt[1]+yPad]).range([margin.top+ph, margin.top]);

    scatterSvg.append('g').attr('transform',`translate(0,${margin.top+ph})`).call(d3.axisBottom(xScale).ticks(5));
    scatterSvg.append('g').attr('transform',`translate(${margin.left},0)`).call(d3.axisLeft(yScale).ticks(5));
    scatterSvg.append('text').attr('x',W/2).attr('y',H-6).attr('text-anchor','middle')
      .style('font-family','var(--mono)').style('font-size','0.65rem').style('fill','var(--slate)').text('PC1');
    scatterSvg.append('text').attr('x',-H/2).attr('y',12).attr('transform','rotate(-90)').attr('text-anchor','middle')
      .style('font-family','var(--mono)').style('font-size','0.65rem').style('fill','var(--slate)').text('PC2');

    // Origin lines
    scatterSvg.append('line').attr('x1',xScale(0)).attr('x2',xScale(0))
      .attr('y1',margin.top).attr('y2',margin.top+ph)
      .attr('stroke','var(--stone)').attr('stroke-width',0.5).attr('stroke-dasharray','3,3');
    scatterSvg.append('line').attr('y1',yScale(0)).attr('y2',yScale(0))
      .attr('x1',margin.left).attr('x2',margin.left+pw)
      .attr('stroke','var(--stone)').attr('stroke-width',0.5).attr('stroke-dasharray','3,3');

    // Points colored by PC1 value
    const colorScale = d3.scaleSequential(d3.interpolateRdYlBu).domain([xExt[1], xExt[0]]);
    scatterSvg.selectAll('.pca-point').data(pc1).join('circle').attr('class','pca-point')
      .attr('cx', (d,i) => xScale(pc1[i])).attr('cy', (d,i) => yScale(pc2[i]))
      .attr('r', 4).attr('fill', (d,i) => colorScale(pc1[i]))
      .attr('stroke','#fff').attr('stroke-width',1).attr('opacity', 0.8);

    // Scree plot
    screeSvg.selectAll('*').remove();
    const sW = W, sH = H, sM = {top:20, right:30, bottom:40, left:50};
    const sPw = sW - sM.left - sM.right, sPh = sH - sM.top - sM.bottom;

    const totalVar = d3.sum(evals);
    const explained = evals.map(e => e/totalVar);
    const cumulative = explained.map((_,i) => d3.sum(explained.slice(0,i+1)));

    const barX = d3.scaleBand().domain(['PC1','PC2','PC3']).range([sM.left, sM.left+sPw]).padding(0.4);
    const barY = d3.scaleLinear().domain([0, Math.max(1, d3.max(explained)*1.15)]).range([sM.top+sPh, sM.top]);
    const lineY = d3.scaleLinear().domain([0,1]).range([sM.top+sPh, sM.top]);

    screeSvg.append('g').attr('transform',`translate(0,${sM.top+sPh})`).call(d3.axisBottom(barX));
    screeSvg.append('g').attr('transform',`translate(${sM.left},0)`).call(d3.axisLeft(barY).ticks(4).tickFormat(d3.format('.0%')));
    screeSvg.append('g').attr('transform',`translate(${sM.left+sPw},0)`).call(d3.axisRight(lineY).ticks(5).tickFormat(d3.format('.0%')));

    screeSvg.append('text').attr('x',sW/2).attr('y',sH-6).attr('text-anchor','middle')
      .style('font-family','var(--mono)').style('font-size','0.65rem').style('fill','var(--slate)').text('Principal Component');

    // Bars
    screeSvg.selectAll('.bar').data(explained).join('rect').attr('class','bar')
      .attr('x', (d,i) => barX(['PC1','PC2','PC3'][i]))
      .attr('y', d => barY(d)).attr('width', barX.bandwidth())
      .attr('height', d => barY(0)-barY(d))
      .attr('fill', (d,i) => ['#C75146','#2D6BA0','#5B8C3E'][i]).attr('opacity',0.7);

    // Cumulative line
    const cumLine = d3.line().x((d,i) => barX(['PC1','PC2','PC3'][i]) + barX.bandwidth()/2).y(d => lineY(d));
    screeSvg.append('path').datum(cumulative).attr('d',cumLine)
      .attr('fill','none').attr('stroke','var(--gold)').attr('stroke-width',2.5);

    screeSvg.selectAll('.cum-dot').data(cumulative).join('circle').attr('class','cum-dot')
      .attr('cx', (d,i) => barX(['PC1','PC2','PC3'][i]) + barX.bandwidth()/2)
      .attr('cy', d => lineY(d)).attr('r', 4).attr('fill','var(--gold)');

    // Stats
    d3.select('#pca-stats').html(`
      <div class="stat-card"><div class="lbl">PC1 方差解释率</div><div class="val" style="color:#C75146">${(explained[0]*100).toFixed(1)}%</div></div>
      <div class="stat-card"><div class="lbl">PC2 方差解释率</div><div class="val" style="color:#2D6BA0">${(explained[1]*100).toFixed(1)}%</div></div>
      <div class="stat-card"><div class="lbl">PC3 方差解释率</div><div class="val" style="color:#5B8C3E">${(explained[2]*100).toFixed(1)}%</div></div>
      <div class="stat-card"><div class="lbl">累积 (PC1+PC2)</div><div class="val" style="color:var(--forest)">${(cumulative[1]*100).toFixed(1)}%</div></div>
      <div class="stat-card"><div class="lbl">特征值 PC1</div><div class="val">${evals[0].toFixed(3)}</div></div>
      <div class="stat-card"><div class="lbl">特征值 PC2</div><div class="val">${evals[1].toFixed(3)}</div></div>
    `);
  }

  d3.select('#pca-reshuffle').on('click', () => { generateData(); update(); });
  d3.select('#pca-rotate').on('click', () => { generateData(); update(); });

  generateData();
  update();
})();
