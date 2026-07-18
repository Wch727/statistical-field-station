// ============ INSTRUMENT No.16A: Dijkstra ============
(function() {
  const W = 500, H = 400;
  const nodes = [
    {id:0, x:80, y:200}, {id:1, x:200, y:80}, {id:2, x:200, y:320},
    {id:3, x:320, y:160}, {id:4, x:320, y:280}, {id:5, x:440, y:200}
  ];
  const edges = [
    {from:0, to:1, w:4}, {from:0, to:2, w:2}, {from:1, to:2, w:1},
    {from:1, to:3, w:5}, {from:2, to:4, w:3}, {from:3, to:4, w:2},
    {from:3, to:5, w:3}, {from:4, to:5, w:4}, {from:1, to:4, w:6}
  ];
  // Build adjacency
  const adj = {};
  nodes.forEach(n => adj[n.id] = []);
  edges.forEach(e => {
    adj[e.from].push({to:e.to, w:e.w});
    adj[e.to].push({to:e.from, w:e.w});  let selectedStart = null, selectedEnd = null;

  const svg = d3.select('#sp-chart').append('svg').attr('width',W).attr('height',H).attr('viewBox',`0 0 ${W} ${H}`);

  function dijkstra(start, end) {
    const dist = {}, prev = {}, visited = {};
    nodes.forEach(n => { dist[n.id] = Infinity; visited[n.id] = false; prev[n.id] = null; });
    dist[start] = 0;
    const pq = [[start, 0]];
    while (pq.length) {
      pq.sort((a,b) => a[1] - b[1]);
      const [u] = pq.shift();
      if (visited[u]) continue;
      visited[u] = true;
      if (u === end) break;
      adj[u].forEach(({to, w}) => {
        if (!visited[to] && dist[u] + w < dist[to]) {
          dist[to] = dist[u] + w;
          prev[to] = u;
          pq.push([to, dist[to]]);
        }    }
    // Reconstruct path
    const path = [];
    let cur = end;
    while (cur !== null) { path.unshift(cur); cur = prev[cur]; }
    return {dist: dist[end], path: path[0] === start ? path : []};
  }

  function draw() {
    svg.selectAll('*').remove();

    let result = null;
    if (selectedStart !== null && selectedEnd !== null && selectedStart !== selectedEnd) {
      result = dijkstra(selectedStart, selectedEnd);
    }

    // Edges
    edges.forEach(e => {
      const inPath = result && result.path.length > 0 &&
        ((result.path.includes(e.from) && result.path.includes(e.to) &&
          Math.abs(result.path.indexOf(e.from) - result.path.indexOf(e.to)) === 1));
      svg.append('line')
        .attr('x1', nodes.find(n=>n.id===e.from).x).attr('y1', nodes.find(n=>n.id===e.from).y)
        .attr('x2', nodes.find(n=>n.id===e.to).x).attr('y2', nodes.find(n=>n.id===e.to).y)
        .attr('stroke', inPath ? 'var(--terracotta)' : 'var(--stone)')
        .attr('stroke-width', inPath ? 3 : 1.5);
      // Weight label
      const mx = (nodes.find(n=>n.id===e.from).x + nodes.find(n=>n.id===e.to).x) / 2;
      const my = (nodes.find(n=>n.id===e.from).y + nodes.find(n=>n.id===e.to).y) / 2;
      svg.append('text').attr('x',mx).attr('y',my-8)
        .text(e.w).style('font-family','var(--mono)').style('font-size','0.7rem')
        .style('fill', inPath ? 'var(--terracotta)' : 'var(--slate)').style('text-anchor','middle')
        .style('font-weight', inPath ? '700' : '400');    // Nodes
    nodes.forEach(n => {
      const isStart = n.id === selectedStart;
      const isEnd = n.id === selectedEnd;
      let fill = 'var(--surface)';
      let stroke = 'var(--forest)';
      let sw = 1.5;
      if (isStart) { fill = '#2D6BA0'; stroke = '#2D6BA0'; sw = 2.5; }
      if (isEnd) { fill = 'var(--terracotta)'; stroke = 'var(--terracotta)'; sw = 2.5; }
      if (isStart && isEnd) { fill = 'var(--gold)'; stroke = 'var(--gold)'; }

      svg.append('circle').attr('cx',n.x).attr('cy',n.y).attr('r',18)
        .attr('fill', fill).attr('stroke', stroke).attr('stroke-width', sw)
        .style('cursor','pointer').on('click', () => {
          if (selectedStart === null) { selectedStart = n.id; selectedEnd = null; }
          else if (selectedEnd === null && n.id !== selectedStart) { selectedEnd = n.id; }
          else { selectedStart = n.id; selectedEnd = null; }
          draw();      svg.append('text').attr('x',n.x).attr('y',n.y+5)
        .text(n.id).style('font-family','var(--mono)').style('font-size','0.75rem')
        .style('fill', (isStart || isEnd) ? '#fff' : 'var(--forest)')
        .style('text-anchor','middle').style('font-weight','700')
        .style('cursor','pointer').on('click', () => {
          if (selectedStart === null) { selectedStart = n.id; selectedEnd = null; }
          else if (selectedEnd === null && n.id !== selectedStart) { selectedEnd = n.id; }
          else { selectedStart = n.id; selectedEnd = null; }
          draw();    // Stats
    if (result && result.path.length > 0) {
      d3.select('#sp-stats').html(`
        <div class="stat-card"><div class="lbl">最短距离</div><div class="val" style="color:var(--terracotta)">${result.dist}</div></div>
        <div class="stat-card"><div class="lbl">路径长度</div><div class="val">${result.path.length} 节点</div></div>
        <div class="stat-card"><div class="lbl">起点</div><div class="val">${selectedStart}</div></div>
        <div class="stat-card"><div class="lbl">终点</div><div class="val">${selectedEnd}</div></div>
      `);
      d3.select('#sp-path-info').html(`路径：${result.path.join(' → ')}<br>距离：${result.dist}`);
    } else if (selectedStart !== null && selectedEnd === null) {
      d3.select('#sp-stats').html(`<div class="stat-card"><div class="lbl">状态</div><div class="val" style="font-size:1rem">请选择终点</div></div>`);
      d3.select('#sp-path-info').text('');
    } else {
      d3.select('#sp-stats').html(`<div class="stat-card"><div class="lbl">状态</div><div class="val" style="font-size:1rem">点击节点选择起点</div></div>`);
      d3.select('#sp-path-info').text('');
    }
  }

  d3.select('#sp-reset').on('click', () => { selectedStart = null; selectedEnd = null; draw(); });
  d3.select('#sp-preset').on('click', () => { selectedStart = 0; selectedEnd = 5; draw(); });
  draw();
})();

// ============ INSTRUMENT No.16B: Monte Carlo π ============
(function() {
  const W = 450, H = 450, margin = 40;
  const size = W - 2*margin;

  const svg = d3.select('#mc-chart').append('svg').attr('width',W).attr('height',H).attr('viewBox',`0 0 ${W} ${H}`);

  let total = 0, inside = 0;

  // Square and circle
  svg.append('rect').attr('x',margin).attr('y',margin).attr('width',size).attr('height',size)
    .attr('fill','none').attr('stroke','var(--stone)').attr('stroke-width',1);
  // Unit circle (centered at square center, radius = size/2)
  const circleArc = d3.arc().innerRadius(0).outerRadius(size/2).startAngle(0).endAngle(2*Math.PI);
  svg.append('path').attr('d', circleArc)
    .attr('transform',`translate(${margin+size/2},${margin+size/2})`)
    .attr('fill','rgba(45,107,160,0.08)').attr('stroke','#2D6BA0').attr('stroke-width',1.5);

  // Axes labels
  svg.append('text').attr('x',margin+size/2).attr('y',margin+size+20).text('x').style('font-family','var(--mono)').style('font-size','0.7rem').style('fill','var(--slate)').style('text-anchor','middle');
  svg.append('text').attr('x',margin-15).attr('y',margin+size/2).attr('transform',`rotate(-90,${margin-15},${margin+size/2})`).text('y').style('font-family','var(--mono)').style('font-size','0.7rem').style('fill','var(--slate)').style('text-anchor','middle');

  function toX(x) { return margin + (x + 1) / 2 * size; }
  function toY(y) { return margin + (1 - y) / 2 * size; }

  function addPoints(count) {
    for (let i = 0; i < count; i++) {
      const x = Math.random() * 2 - 1;
      const y = Math.random() * 2 - 1;
      const inCircle = x*x + y*y <= 1;
      total++;
      if (inCircle) inside++;
      let alpha;
      if (total > 5000) alpha = 0.15;
      else if (total > 1000) alpha = 0.3;
      else alpha = 0.6;
      const dotR = total > 5000 ? 0.8 : 1.2;
      svg.append('circle')
        .attr('cx', toX(x)).attr('cy', toY(y)).attr('r', dotR)
        .attr('fill', inCircle ? '#2D6BA0' : 'var(--stone)')
        .attr('opacity', alpha);
    }
    updateStats();
  }

  function updateStats() {
    const piEst = total > 0 ? 4 * inside / total : 0;
    const err = total > 0 ? Math.abs(piEst - Math.PI) : 0;
    d3.select('#mc-stats').html(`
      <div class="stat-card"><div class="lbl">总点数</div><div class="val">${total}</div></div>
      <div class="stat-card"><div class="lbl">圆内点数</div><div class="val">${inside}</div></div>
      <div class="stat-card"><div class="lbl">π 估计值</div><div class="val" style="color:var(--terracotta)">${piEst.toFixed(6)}</div></div>
      <div class="stat-card"><div class="lbl">误差</div><div class="val">${err.toFixed(6)}</div></div>
      <div class="stat-card"><div class="lbl">真值 π</div><div class="val">${Math.PI.toFixed(6)}</div></div>
    `);
  }

  d3.select('#mc-add100').on('click', () => addPoints(100));
  d3.select('#mc-add1000').on('click', () => addPoints(1000));
  d3.select('#mc-add5000').on('click', () => addPoints(5000));
  d3.select('#mc-reset').on('click', () => {
    total = 0; inside = 0;
    svg.selectAll('circle').remove();
    updateStats();  addPoints(200);
})();
