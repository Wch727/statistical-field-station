// ============ Color palette for clusters ============
const clusterColors = ['#C75146','#2D6BA0','#5B8C3E','#8B6914','#9B59B6','#E67E22'];

// ============ INSTRUMENT No.9A: K-Means ============
(function() {
  const W = 680, H = 450, margin = {top:10, right:10, bottom:10, left:10};
  const pw = W - margin.left - margin.right;
  const ph = H - margin.top - margin.bottom;
  const xScale = d3.scaleLinear().domain([0,1]).range([margin.left, margin.left+pw]);
  const yScale = d3.scaleLinear().domain([0,1]).range([margin.top+ph, margin.top]);

  const svg = d3.select('#km-chart').append('svg').attr('width',W).attr('height',H)
    .attr('viewBox',`0 0 ${W} ${H}`);

  svg.append('rect').attr('x',margin.left).attr('y',margin.top)
    .attr('width',pw).attr('height',ph)
    .attr('fill','#FAF8F3').attr('stroke','var(--stone)').attr('stroke-width',1);

  let points = [], centroids = [], assignments = [];
  let K = 3, converged = false;

  function initCentroids() {
    if (points.length < K) return;
    // K-Means++ style initialization
    centroids = [points[Math.floor(Math.random()*points.length)]];
    for (let k = 1; k < K; k++) {
      const dists = points.map(p => {
        const minD = Math.min(...centroids.map(c => (p.x-c.x)**2 + (p.y-c.y)**2));
        return minD;
      });
      const total = d3.sum(dists);
      let r = Math.random() * total, cum = 0;
      let chosen = points[points.length-1];
      for (let i = 0; i < points.length; i++) {
        cum += dists[i];
        if (cum >= r) { chosen = points[i]; break; }
      }
      centroids.push({x: chosen.x, y: chosen.y});
    }
    assignPoints();
    converged = false;
  }

  function assignPoints() {
    const oldAssignments = [...assignments];
    assignments = points.map(p => {
      let best = 0, bestD = Infinity;
      centroids.forEach((c, i) => {
        const d = (p.x-c.x)**2 + (p.y-c.y)**2;
        if (d < bestD) { bestD = d; best = i; }
      });
      return best;
    });
    return oldAssignments.every((a,i) => a === assignments[i]);
  }

  function updateCentroids() {
    const newCentroids = [];
    for (let k = 0; k < K; k++) {
      const cluster = points.filter((_,i) => assignments[i] === k);
      if (cluster.length > 0) {
        newCentroids.push({
          x: d3.mean(cluster, d => d.x),
          y: d3.mean(cluster, d => d.y)
        });
      } else {
        // Empty cluster: reinitialize randomly
        newCentroids.push(points[Math.floor(Math.random()*points.length)]);
      }
    }
    centroids = newCentroids;
  }

  function wcss() {
    let sum = 0;
    points.forEach((p, i) => {
      const c = centroids[assignments[i]];
      sum += (p.x-c.x)**2 + (p.y-c.y)**2;
    });
    return sum;
  }

  function redraw() {
    svg.selectAll('.km-point,.km-centroid,.km-voronoi').remove();

    if (points.length === 0) return;

    // Voronoi-style background
    if (centroids.length > 0 && assignments.length > 0) {
      const grid = 80;
      for (let i = 0; i <= grid; i++) {
        for (let j = 0; j <= grid; j++) {
          const gx = i/grid, gy = j/grid;
          let best = 0, bestD = Infinity;
          centroids.forEach((c, ci) => {
            const d = (gx-c.x)**2 + (gy-c.y)**2;
            if (d < bestD) { bestD = d; best = ci; }
          });
          svg.append('rect').attr('class','km-voronoi')
            .attr('x', xScale(gx)-pw/grid/2).attr('y', yScale(gy)-ph/grid/2)
            .attr('width', pw/grid+0.5).attr('height', ph/grid+0.5)
            .attr('fill', clusterColors[best]+'15').attr('stroke','none');
        }
      }
    }

    // Points
    svg.selectAll('.km-point').data(points).join('circle').attr('class','km-point')
      .attr('cx', d => xScale(d.x)).attr('cy', d => yScale(d.y))
      .attr('r', 4.5).attr('fill', (d,i) => assignments[i] !== undefined ? clusterColors[assignments[i]] : '#888')
      .attr('stroke', '#fff').attr('stroke-width', 1.2).attr('opacity', 0.85);

    // Centroids
    svg.selectAll('.km-centroid').data(centroids).join('circle').attr('class','km-centroid')
      .attr('cx', d => xScale(d.x)).attr('cy', d => yScale(d.y))
      .attr('r', 8).attr('fill', 'none')
      .attr('stroke', (d,i) => clusterColors[i]).attr('stroke-width', 3)
      .attr('opacity', 0.9);
    svg.selectAll('.km-centroid-inner').data(centroids).join('circle').attr('class','km-centroid')
      .attr('cx', d => xScale(d.x)).attr('cy', d => yScale(d.y))
      .attr('r', 3).attr('fill', (d,i) => clusterColors[i]);
  }

  function updateStats() {
    const w = wcss();
    d3.select('#km-stats').html(`
      <div class="stat-card"><div class="lbl">样本数</div><div class="val">${points.length}</div></div>
      <div class="stat-card"><div class="lbl">WCSS</div><div class="val">${w.toFixed(4)}</div></div>
      <div class="stat-card"><div class="lbl">迭代状态</div><div class="val" style="font-size:0.9rem">${converged ? '已收敛 ✓' : '进行中'}</div></div>
      ${centroids.map((c,i) => `
        <div class="stat-card"><div class="lbl" style="color:${clusterColors[i]}">簇 ${i+1} 质心</div><div class="val" style="font-size:0.8rem">(${c.x.toFixed(2)},${c.y.toFixed(2)})</div></div>
      `).join('')}
    `);
  }

  function doStep() {
    if (points.length < K || converged) return;
    assignPoints();
    updateCentroids();
    const isConverged = assignPoints(); // re-assign after update
    if (isConverged) converged = true;
    updateCentroids();
    redraw();
    updateStats();
  }

  // Click to add points
  svg.on('click', function(event) {
    const [mx, my] = d3.pointer(event);
    if (mx < margin.left || mx > margin.left+pw || my < margin.top || my > margin.top+ph) return;
    const x = (mx - margin.left) / pw;
    const y = (margin.top + ph - my) / ph;
    points.push({x, y});
    converged = false;
    if (points.length >= K && centroids.length === 0) initCentroids();
    else { assignPoints(); updateCentroids(); assignPoints(); }
    redraw();
    updateStats();
  });

  d3.select('#km-k').on('input', function() {
    K = +this.value;
    d3.select('#km-k-val').text(K);
    converged = false;
    initCentroids();
    redraw();
    updateStats();
  });

  d3.select('#km-step').on('click', function() { doStep(); });

  d3.select('#km-reset').on('click', function() { converged = false; initCentroids(); redraw(); updateStats(); });

  let autoTimer = null;
  d3.select('#km-auto').on('click', function() {
    if (autoTimer) { clearInterval(autoTimer); autoTimer = null; d3.select(this).text('自动迭代 (Auto)'); return; }
    d3.select(this).text('停止');
    autoTimer = setInterval(function() {
      if (converged) { clearInterval(autoTimer); autoTimer = null; d3.select('#km-auto').text('自动迭代 (Auto)'); return; }
      doStep();
    }, 500);
  });

  d3.select('#km-random').on('click', function() {
    points = [];
    // Generate clustered data
    const centers = [];
    for (let k = 0; k < K; k++) {
      centers.push({x: 0.2 + Math.random()*0.6, y: 0.2 + Math.random()*0.6});
    }
    for (let i = 0; i < 80; i++) {
      const c = centers[Math.floor(Math.random()*K)];
      points.push({
        x: Math.max(0.02, Math.min(0.98, c.x + (Math.random()-0.5)*0.25)),
        y: Math.max(0.02, Math.min(0.98, c.y + (Math.random()-0.5)*0.25))
      });
    }
    converged = false;
    initCentroids();
    redraw();
    updateStats();
  });

  d3.select('#km-clear').on('click', function() {
    points = []; centroids = []; assignments = []; converged = false;
    redraw();
    updateStats();
  });

  d3.select('#km-random').dispatch('click');
})();

// ============ INSTRUMENT No.9B: DBSCAN ============
(function() {
  const W = 480, H = 400, margin = {top:10, right:10, bottom:10, left:10};
  const pw = W - margin.left - margin.right;
  const ph = H - margin.top - margin.bottom;
  const xScale = d3.scaleLinear().domain([0,1]).range([margin.left, margin.left+pw]);
  const yScale = d3.scaleLinear().domain([0,1]).range([margin.top+ph, margin.top]);

  function makeSvg(sel) {
    const svg = d3.select(sel).append('svg').attr('width',W).attr('height',H).attr('viewBox',`0 0 ${W} ${H}`);
    svg.append('rect').attr('x',margin.left).attr('y',margin.top)
      .attr('width',pw).attr('height',ph).attr('fill','#FAF8F3').attr('stroke','var(--stone)').attr('stroke-width',1);
    return svg;
  }

  const dbSvg = makeSvg('#db-chart');
  const kmSvg = makeSvg('#km-comp-chart');

  let data = [];

  function generateMoons() {
    data = [];
    const n = 150;
    for (let i = 0; i < n; i++) {
      const t = Math.PI * 0.8 * i / n;
      data.push({x: 0.35 + 0.2*Math.cos(t) + (Math.random()-0.5)*0.05, y: 0.5 + 0.25*Math.sin(t) + (Math.random()-0.5)*0.05});
    }
    for (let i = 0; i < n; i++) {
      const t = Math.PI * 0.8 * (1 - i/n);
      data.push({x: 0.65 + 0.2*Math.cos(t) + (Math.random()-0.5)*0.05, y: 0.5 - 0.25*Math.sin(t) + (Math.random()-0.5)*0.05});
    }
  }

  function generateCircles() {
    data = [];
    for (let i = 0; i < 120; i++) {
      const a = Math.random()*2*Math.PI;
      const r = 0.15 + (Math.random()-0.5)*0.05;
      data.push({x: 0.5 + r*Math.cos(a), y: 0.5 + r*Math.sin(a)});
    }
    for (let i = 0; i < 120; i++) {
      const a = Math.random()*2*Math.PI;
      const r = 0.3 + (Math.random()-0.5)*0.05;
      data.push({x: 0.5 + r*Math.cos(a), y: 0.5 + r*Math.sin(a)});
    }
  }

  function generateBlobs() {
    data = [];
    const centers = [[0.3,0.3],[0.7,0.3],[0.5,0.7]];
    centers.forEach(([cx,cy]) => {
      for (let i = 0; i < 80; i++) {
        data.push({x: cx + (Math.random()-0.5)*0.2, y: cy + (Math.random()-0.5)*0.2});
      }
    });
  }

  function dbscan(eps, minPts) {
    const labels = new Array(data.length).fill(-1); // -1 = unvisited/noise
    let clusterId = 0;

    for (let i = 0; i < data.length; i++) {
      if (labels[i] !== -1) continue;
      const neighbors = [];
      for (let j = 0; j < data.length; j++) {
        const d = Math.sqrt((data[i].x-data[j].x)**2 + (data[i].y-data[j].y)**2);
        if (d < eps) neighbors.push(j);
      }
      if (neighbors.length < minPts) {
        labels[i] = -2; // noise (temporary)
        continue;
      }
      // Core point: start new cluster
      labels[i] = clusterId;
      const seeds = [...neighbors];
      let idx = 0;
      while (idx < seeds.length) {
        const j = seeds[idx];
        if (labels[j] === -2) labels[j] = clusterId; // noise → border
        if (labels[j] !== -1) { idx++; continue; }
        labels[j] = clusterId;
        const nbrs = [];
        for (let k = 0; k < data.length; k++) {
          const d = Math.sqrt((data[j].x-data[k].x)**2 + (data[j].y-data[k].y)**2);
          if (d < eps) nbrs.push(k);
        }
        if (nbrs.length >= minPts) {
          for (const n of nbrs) {
            if (!seeds.includes(n)) seeds.push(n);
          }
        }
        idx++;
      }
      clusterId++;
    }
    // Convert temporary noise to actual noise
    for (let i = 0; i < labels.length; i++) {
      if (labels[i] === -2) labels[i] = -1;
    }
    return { labels, nClusters: clusterId };
  }

  function kmeans(data, K) {
    // Simple K-Means
    let centroids = [];
    const idx = Array.from({length: data.length}, (_,i) => i);
    for (let k = 0; k < K; k++) {
      const ri = idx.splice(Math.floor(Math.random()*idx.length),1)[0];
      centroids.push({x: data[ri].x, y: data[ri].y});
    }
    let labels = new Array(data.length).fill(0);
    for (let iter = 0; iter < 20; iter++) {
      let changed = false;
      for (let i = 0; i < data.length; i++) {
        let best = 0, bestD = Infinity;
        centroids.forEach((c, ci) => {
          const d = (data[i].x-c.x)**2 + (data[i].y-c.y)**2;
          if (d < bestD) { bestD = d; best = ci; }
        });
        if (labels[i] !== best) { labels[i] = best; changed = true; }
      }
      if (!changed) break;
      for (let k = 0; k < K; k++) {
        const cluster = data.filter((_,i) => labels[i] === k);
        if (cluster.length > 0) {
          centroids[k] = {x: d3.mean(cluster,d=>d.x), y: d3.mean(cluster,d=>d.y)};
        }
      }
    }
    return labels;
  }

  function drawPoints(svg, labels, nClusters) {
    svg.selectAll('.db-point').remove();
    svg.selectAll('.db-point').data(data).join('circle').attr('class','db-point')
      .attr('cx', d => xScale(d.x)).attr('cy', d => yScale(d.y))
      .attr('r', 3.5).attr('fill', (d,i) => {
        if (labels[i] === -1) return '#aaa';
        return clusterColors[labels[i] % clusterColors.length];
      }).attr('stroke', '#fff').attr('stroke-width', 0.8).attr('opacity', 0.85);
  }

  function update() {
    const eps = +d3.select('#db-eps').property('value');
    const minPts = +d3.select('#db-mp').property('value');
    d3.select('#db-eps-val').text(eps.toFixed(2));
    d3.select('#db-mp-val').text(minPts);

    const dbResult = dbscan(eps, minPts);
    const kmLabels = kmeans(data, 3);

    drawPoints(dbSvg, dbResult.labels, dbResult.nClusters);
    drawPoints(kmSvg, kmLabels, 3);

    const noiseCount = dbResult.labels.filter(l => l === -1).length;
    d3.select('#db-stats').html(`
      <div class="stat-card"><div class="lbl">DBSCAN 簇数</div><div class="val">${dbResult.nClusters}</div></div>
      <div class="stat-card"><div class="lbl">噪声点数</div><div class="val">${noiseCount}</div></div>
      <div class="stat-card"><div class="lbl">K-Means 簇数</div><div class="val">3</div></div>
      <div class="stat-card"><div class="lbl">总样本数</div><div class="val">${data.length}</div></div>
    `);
  }

  d3.select('#db-eps').on('input', update);
  d3.select('#db-mp').on('input', update);
  d3.select('#db-moons').on('click', () => { generateMoons(); update(); });
  d3.select('#db-circles').on('click', () => { generateCircles(); update(); });
  d3.select('#db-blobs').on('click', () => { generateBlobs(); update(); });

  generateMoons();
  update();
})();
