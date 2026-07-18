const mean = arr => arr.reduce((a,b)=>a+b,0)/arr.length;
const median = arr => { const s=[...arr].sort((a,b)=>a-b), n=s.length; return n%2?s[(n-1)/2]:(s[n/2-1]+s[n/2])/2; };
const quartile = (arr, q) => { const s=[...arr].sort((a,b)=>a-b), n=s.length, idx=q*(n-1), lo=Math.floor(idx), hi=Math.ceil(idx); return lo===hi?s[lo]:s[lo]+(s[hi]-s[lo])*(idx-lo); };
function randn_bm() { let u=0,v=0; while(u===0)u=Math.random(); while(v===0)v=Math.random(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); }

const data = [];
for (let i=0;i<80;i++) data.push(25 + randn_bm()*6);
for (let i=0;i<80;i++) data.push(50 + randn_bm()*8);

function updateCharts() { updateHistogram(); updateBoxplot(); }

function updateHistogram() {
  const container = document.getElementById('histogram-container');
  const bins = +document.getElementById('hist-bins').value;
  document.getElementById('hist-bins-val').textContent = bins;
  const W=container.clientWidth||500, H=300, M={t:20,r:20,b:40,l:40};
  const xScale=d3.scaleLinear().domain([d3.min(data)*0.95,d3.max(data)*1.05]).range([M.l,W-M.r]);
  const histogram=d3.bin().domain(xScale.domain()).thresholds(bins);
  const bins_data=histogram(data);
  const yMax=d3.max(bins_data,d=>d.length);
  const yScale=d3.scaleLinear().domain([0,yMax*1.2]).range([H-M.b,M.t]);

  container.innerHTML='';
  const svg=d3.select(container).append('svg').attr('viewBox',`0 0 ${W} ${H}`).attr('width',W).attr('height',H);

  svg.selectAll('rect').data(bins_data).join('rect')
    .attr('x',d=>xScale(d.x0)+1).attr('y',d=>yScale(d.length))
    .attr('width',d=>Math.max(0,xScale(d.x1)-xScale(d.x0)-2))
    .attr('height',d=>H-M.b-yScale(d.length))
    .attr('fill','var(--terracotta)').attr('opacity',0.7);

  const bw = 0.9*Math.min(Math.sqrt(data.reduce((s,x)=>s+(x-mean(data))**2,0)/(data.length-1)), (quartile(data,0.75)-quartile(data,0.25))/1.34)*Math.pow(data.length,-0.2);
  function kde(x) { return data.reduce((s,xi)=>s+Math.exp(-(((x-xi)/bw)**2)/2),0)/(data.length*bw*Math.sqrt(2*Math.PI)); }
  const kdeData=[],pts=200;
  for(let i=0;i<=pts;i++){const x=xScale.domain()[0]+(xScale.domain()[1]-xScale.domain()[0])*i/pts; kdeData.push({x,y:kde(x)});}
  const kdeMax=d3.max(kdeData,d=>d.y);
  const yScaleKDE=d3.scaleLinear().domain([0,kdeMax]).range([H-M.b,M.t]);
  const line=d3.line().x(d=>xScale(d.x)).y(d=>yScaleKDE(d.y)).curve(d3.curveBasis);
  svg.append('path').datum(kdeData).attr('d',line).attr('fill','none').attr('stroke','var(--forest)').attr('stroke-width',2.5);

  svg.append('g').attr('transform',`translate(0,${H-M.b})`).call(d3.axisBottom(xScale).ticks(6));
  svg.append('g').attr('transform',`translate(${M.l},0)`).call(d3.axisLeft(yScale).ticks(4).tickFormat(d3.format('d')));
  svg.selectAll('.axis text').attr('font-family','var(--mono)').attr('font-size','0.7rem').attr('fill','var(--slate)');
  svg.selectAll('.axis line,.axis path').attr('stroke','var(--stone)');
}

function updateBoxplot() {
  const container=document.getElementById('boxplot-container');
  const W=container.clientWidth||400, H=280, M={t:30,r:30,b:40,l:30};
  const sorted=[...data].sort((a,b)=>a-b);
  const q1=quartile(data,0.25), med=median(data), q3=quartile(data,0.75);
  const iqr=q3-q1, lower=Math.max(d3.min(data),q1-1.5*iqr), upper=Math.min(d3.max(data),q3+1.5*iqr);
  const outliers=data.filter(x=>x<q1-1.5*iqr||x>q3+1.5*iqr);
  const xScale=d3.scaleLinear().domain([d3.min(data)-2,d3.max(data)+2]).range([M.l,W-M.r]);
  const boxW=50, cy=H/2;

  container.innerHTML='';
  const svg=d3.select(container).append('svg').attr('viewBox',`0 0 ${W} ${H}`).attr('width',W).attr('height',H);

  svg.append('line').attr('x1',xScale(lower)).attr('x2',xScale(upper)).attr('y1',cy).attr('y2',cy).attr('stroke','var(--forest)').attr('stroke-width',1.5);
  svg.append('rect').attr('x',xScale(q1)).attr('y',cy-boxW/2).attr('width',xScale(q3)-xScale(q1)).attr('height',boxW).attr('fill','var(--terracotta)').attr('opacity',0.25).attr('stroke','var(--forest)').attr('stroke-width',1.5);
  svg.append('line').attr('x1',xScale(med)).attr('x2',xScale(med)).attr('y1',cy-boxW/2).attr('y2',cy+boxW/2).attr('stroke','var(--forest)').attr('stroke-width',2);
  svg.append('line').attr('x1',xScale(lower)).attr('x2',xScale(lower)).attr('y1',cy-8).attr('y2',cy+8).attr('stroke','var(--forest)').attr('stroke-width',1.5);
  svg.append('line').attr('x1',xScale(upper)).attr('x2',xScale(upper)).attr('y1',cy-8).attr('y2',cy+8).attr('stroke','var(--forest)').attr('stroke-width',1.5);
  svg.selectAll('circle.outlier').data(outliers).join('circle').attr('class','outlier').attr('cx',d=>xScale(d)).attr('cy',cy).attr('r',3).attr('fill','var(--terracotta)').attr('opacity',0.8);

  svg.append('text').attr('x',xScale(q1)).attr('y',cy+boxW/2+18).attr('text-anchor','middle').attr('font-family','var(--mono)').attr('font-size','0.65rem').attr('fill','var(--slate)').text('Q1='+q1.toFixed(1));
  svg.append('text').attr('x',xScale(med)).attr('y',cy-boxW/2-10).attr('text-anchor','middle').attr('font-family','var(--mono)').attr('font-size','0.65rem').attr('fill','var(--forest)').text('Mdn='+med.toFixed(1));
  svg.append('text').attr('x',xScale(q3)).attr('y',cy+boxW/2+18).attr('text-anchor','middle').attr('font-family','var(--mono)').attr('font-size','0.65rem').attr('fill','var(--slate)').text('Q3='+q3.toFixed(1));

  svg.append('g').attr('transform',`translate(0,${H-M.b})`).call(d3.axisBottom(xScale).ticks(5));
  svg.selectAll('.axis text').attr('font-family','var(--mono)').attr('font-size','0.7rem').attr('fill','var(--slate)');
  svg.selectAll('.axis line,.axis path').attr('stroke','var(--stone)');
}

updateCharts();
window.addEventListener('resize',()=>{clearTimeout(window._rt);window._rt=setTimeout(updateCharts,250)});

',display:false}],throwOnError:false,strict:false});}
