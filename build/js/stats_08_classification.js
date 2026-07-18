// ============ INSTRUMENT No.8A: KNN Decision Boundary ============
(function() {
  const W = 700, H = 500, margin = {top:10, right:10, bottom:10, left:10};
  const pw = W - margin.left - margin.right;
  const ph = H - margin.top - margin.bottom;
  const xScale = d3.scaleLinear().domain([0,1]).range([margin.left, margin.left + pw]);
  const yScale = d3.scaleLinear().domain([0,1]).range([margin.top + ph, margin.top]);

  const svg = d3.select('#knn-chart').append('svg').attr('width',W).attr('height',H)
    .attr('viewBox',`0 0 ${W} ${H}`);

  // Background grid
  svg.append('rect').attr('x',margin.left).attr('y',margin.top)
    .attr('width',pw).attr('height',ph)
    .attr('fill','#FAF8F3').attr('stroke', 'var(--stone)').attr('stroke-width',1);

  // Grid lines
  for (let i = 0; i <= 10; i++) {
    svg.append('line').attr('x1',margin.left).attr('x2',margin.left+pw)
      .attr('y1',yScale(i/10)).attr('y2',yScale(i/10))
      .attr('stroke','var(--stone)').attr('stroke-width',0.5).attr('stroke-dasharray','2,2');
    svg.append('line').attr('y1',margin.top).attr('y2',margin.top+ph)
      .attr('x1',xScale(i/10)).attr('x2',xScale(i/10))
      .attr('stroke','var(--stone)').attr('stroke-width',0.5).attr('stroke-dasharray','2,2');
  }

  let points = [];
  let currentClass = 0; // 0=A (red), 1=B (blue)
  let K = 3;

  const boundaryGroup = svg.append('g');
  const pointsGroup = svg.append('g');

  function drawBoundary() {
    boundaryGroup.selectAll('*').remove();
    if (points.length === 0) return;

    const gridSize = 100;
    const grid = [];
    for (let i = 0; i <= gridSize; i++) {
      for (let j = 0; j <= gridSize; j++) {
        const x = i / gridSize, y = j / gridSize;
        // Find K nearest neighbors
        const dists = points.map((p, idx) => ({
          idx, cls: p.cls,
          d: Math.sqrt((p.x-x)**2 + (p.y-y)**2)
        })).sort((a,b) => a.d - b.d).slice(0, K);
        const votes = d3.rollup(dists, v => v.length, d => d.cls);
        const pred = [...votes.entries()].sort((a,b) => b[1]-a[1])[0][0];
        grid.push({x, y, pred});
      }
    }

    // Draw Voronoi-like regions as small rects
    const cellW = pw / gridSize, cellH = ph / gridSize;
    grid.forEach(g => {
      boundaryGroup.append('rect')
        .attr('x', xScale(g.x) - cellW/2).attr('y', yScale(g.y) - cellH/2)
        .attr('width', cellW+0.5).attr('height', cellH+0.5)
        .attr('fill', g.pred === 0 ? 'rgba(199,81,70,0.12)' : 'rgba(45,107,160,0.12)')
        .attr('stroke','none');
      });
    }

  function drawPoints() {
    pointsGroup.selectAll('*').remove();
    pointsGroup.selectAll('circle').data(points).join('circle')
      .attr('cx', d => xScale(d.x)).attr('cy', d => yScale(d.y))
      .attr('r', 5).attr('fill', d => d.cls === 0 ? '#C75146' : '#2D6BA0')
      .attr('stroke', '#fff').attr('stroke-width', 1.5)
      .attr('opacity', 0.9);
  }

  function redraw() {
    drawBoundary();
    drawPoints();
  }

  // Click handler
  svg.on('click', function(event) {
    const [mx, my] = d3.pointer(event);
    const x = Math.max(0, Math.min(1, (mx - margin.left) / pw));
    const y = Math.max(0, Math.min(1, (margin.top + ph - my) / ph));
    const cls = d3.event && d3.event.shiftKey ? 1 : currentClass;
    points.push({x, y, cls});
    redraw();
  });

  svg.on('mousedown', function(event) {
    if (event.shiftKey) {
      d3.select('#knn-current-class').text('Class B (蓝)').style('color','#2D6BA0');
    }
  });

  svg.on('mouseup', function() {
    d3.select('#knn-current-class').text('Class A (红)').style('color','var(--terracotta)');
  });

  d3.select('#knn-k').on('input', function() {
    K = +this.value;
    d3.select('#knn-k-val').text(K);
    redraw();
  });

  d3.select('#knn-rand').on('click', function() {
    points = [];
    const rng = d3.randomUniform(0.15, 0.85);
    for (let i = 0; i < 30; i++) {
      const cls = Math.random() < 0.5 ? 0 : 1;
      const cx = cls === 0 ? 0.3 : 0.7, cy = cls === 0 ? 0.3 : 0.7;
      points.push({
        x: Math.max(0.02, Math.min(0.98, cx + (Math.random()-0.5)*0.5)),
        y: Math.max(0.02, Math.min(0.98, cy + (Math.random()-0.5)*0.5)),
        cls
      });
    }
    redraw();
  });

  d3.select('#knn-clear').on('click', function() {
    points = [];
    redraw();
  });

  d3.select('#knn-toggle-class').on('click', function() {
    currentClass = 1 - currentClass;
    d3.select('#knn-current-class')
      .text(currentClass === 0 ? 'Class A (红)' : 'Class B (蓝)')
      .style('color', currentClass === 0 ? 'var(--terracotta)' : '#2D6BA0');
  });

  d3.select('#knn-rand').dispatch('click');
})();

// ============ INSTRUMENT No.8B: Decision Tree Split ============
(function() {
  const W = 700, H = 350, margin = {top:20, right:30, bottom:40, left:50};
  const pw = W - margin.left - margin.right;
  const ph = H - margin.top - margin.bottom;
  const xScale = d3.scaleLinear().domain([0,1]).range([margin.left, margin.left+pw]);
  const yScale = d3.scaleLinear().domain([-0.1, 1.1]).range([margin.top+ph, margin.top]);

  const svg = d3.select('#dt-chart').append('svg').attr('width',W).attr('height',H)
    .attr('viewBox',`0 0 ${W} ${H}`);

  // Axes
  svg.append('g').attr('transform',`translate(0,${margin.top+ph})`).call(d3.axisBottom(xScale));
  svg.append('g').attr('transform',`translate(${margin.left},0)`).call(d3.axisLeft(yScale).ticks(5));
  svg.append('text').attr('x',W/2).attr('y',H-4).attr('text-anchor','middle')
    .style('font-family','var(--mono)').style('font-size','0.7rem').style('fill','var(--slate)').text('Feature X');
  svg.append('text').attr('x',-H/2).attr('y',14).attr('transform','rotate(-90)').attr('text-anchor','middle')
    .style('font-family','var(--mono)').style('font-size','0.7rem').style('fill','var(--slate)').text('Class (0/1)');

  let data = [];

  function generateData() {
    data = [];
    for (let i = 0; i < 80; i++) {
      const x = Math.random();
      // Class 0 mostly on left, class 1 mostly on right, with overlap
      const p1 = 1 / (1 + Math.exp(-8*(x - 0.5))); // sigmoid
      const cls = Math.random() < p1 ? 1 : 0;
      data.push({x, cls, y: cls + (Math.random()-0.5)*0.15});
    }
  }

  function entropy(vals) {
    if (vals.length === 0) return 0;
    const p1 = d3.sum(vals) / vals.length;
    const p0 = 1 - p1;
    let h = 0;
    if (p0 > 0) h -= p0 * Math.log2(p0);
    if (p1 > 0) h -= p1 * Math.log2(p1);
    return h;
  }

  function update(split) {
    const left = data.filter(d => d.x < split);
    const right = data.filter(d => d.x >= split);
    const H_parent = entropy(data.map(d => d.cls));
    const H_left = entropy(left.map(d => d.cls));
    const H_right = entropy(right.map(d => d.cls));
    const wL = left.length / data.length, wR = right.length / data.length;
    const H_children = wL * H_left + wR * H_right;
    const gain = H_parent - H_children;

    d3.select('#dt-stats').html(`
      <div class="stat-card"><div class="lbl">父节点熵 H(t)</div><div class="val">${H_parent.toFixed(3)}</div></div>
      <div class="stat-card"><div class="lbl">左子节点熵 H(L)</div><div class="val">${H_left.toFixed(3)}</div></div>
      <div class="stat-card"><div class="lbl">右子节点熵 H(R)</div><div class="val">${H_right.toFixed(3)}</div></div>
      <div class="stat-card"><div class="lbl">加权子节点熵</div><div class="val">${H_children.toFixed(3)}</div></div>
      <div class="stat-card"><div class="lbl">信息增益 IG</div><div class="val" style="color:${gain > 0.05 ? 'var(--terracotta)' : 'var(--slate)'}">${gain.toFixed(3)}</div></div>
      <div class="stat-card"><div class="lbl">左:右 样本数</div><div class="val">${left.length}:${right.length}</div></div>
    `);

    // Redraw
    svg.selectAll('.dot').remove();
    svg.selectAll('.split-line').remove();
    svg.selectAll('.shade').remove();

    // Shade regions
    svg.append('rect').attr('class','shade').attr('x',xScale(0)).attr('y',margin.top)
      .attr('width',xScale(split)-xScale(0)).attr('height',ph)
      .attr('fill','rgba(199,81,70,0.06)');
    svg.append('rect').attr('class','shade').attr('x',xScale(split)).attr('y',margin.top)
      .attr('width',xScale(1)-xScale(split)).attr('height',ph)
      .attr('fill','rgba(45,107,160,0.06)');

    // Split line
    svg.append('line').attr('class','split-line')
      .attr('x1',xScale(split)).attr('x2',xScale(split))
      .attr('y1',margin.top).attr('y2',margin.top+ph)
      .attr('stroke','var(--gold)').attr('stroke-width',2).attr('stroke-dasharray','6,3');

    // Data points
    svg.selectAll('.dot').data(data).join('circle').attr('class','dot')
      .attr('cx', d => xScale(d.x)).attr('cy', d => yScale(d.y))
      .attr('r', 4).attr('fill', d => d.cls === 0 ? '#C75146' : '#2D6BA0')
      .attr('stroke', '#fff').attr('stroke-width', 1).attr('opacity', 0.8);

    // Mean lines in each region
    const left0 = left.filter(d => d.cls===0), left1 = left.filter(d => d.cls===1);
    const right0 = right.filter(d => d.cls===0), right1 = right.filter(d => d.cls===1);
    if (left.length > 0) {
      svg.append('text').attr('class','split-line')
        .attr('x', xScale(split/2)).attr('y', margin.top + 14)
        .attr('text-anchor','middle').style('font-family','var(--mono)').style('font-size','0.65rem')
        .style('fill','var(--slate)').text(`0:${left0.length} 1:${left1.length}`);
    }
    if (right.length > 0) {
      svg.append('text').attr('class','split-line')
        .attr('x', xScale((split+1)/2)).attr('y', margin.top + 14)
        .attr('text-anchor','middle').style('font-family','var(--mono)').style('font-size','0.65rem')
        .style('fill','var(--slate)').text(`0:${right0.length} 1:${right1.length}`);
    }
  }

  const slider = d3.select('#dt-split');
  slider.on('input', function() {
    const v = +this.value;
    d3.select('#dt-split-val').text(v.toFixed(2));
    if (data.length > 0) update(v);
  });

  d3.select('#dt-best').on('click', function() {
    let bestSplit = 0.5, bestGain = 0;
    for (let s = 0.05; s <= 0.95; s += 0.01) {
      const left = data.filter(d => d.x < s), right = data.filter(d => d.x >= s);
      if (left.length < 3 || right.length < 3) continue;
      const Hp = entropy(data.map(d=>d.cls));
      const h = (left.length/data.length)*entropy(left.map(d=>d.cls)) + (right.length/data.length)*entropy(right.map(d=>d.cls));
      const gain = Hp - h;
      if (gain > bestGain) { bestGain = gain; bestSplit = s; }
    }
    slider.property('value', bestSplit);
    d3.select('#dt-split-val').text(bestSplit.toFixed(2));
    update(bestSplit);
  });

  d3.select('#dt-reshuffle').on('click', function() {
    generateData();
    const s = +slider.property('value');
    update(s);
  });

  generateData();
  update(0.5);
})();
