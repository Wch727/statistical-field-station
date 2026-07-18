let logisticSeed=42;
function updateLogistic(){
  const b0=+document.getElementById('log-b0').value,b1=+document.getElementById('log-b1').value;
  document.getElementById('log-b0-val').textContent=b0.toFixed(1);
  document.getElementById('log-b1-val').textContent=b1.toFixed(1);
  const boundary=b1===0?0:-b0/b1;
  document.getElementById('log-boundary').textContent=boundary.toFixed(2);
  document.getElementById('log-odds').textContent=Math.exp(b1).toFixed(3);
  document.getElementById('log-p0').textContent=(1/(1+Math.exp(-b0))).toFixed(3);

  const container=document.getElementById('logistic-plot');
  const W=520,H=380,M={t:20,r:30,b:50,l:50};
  const pts=[];let s=logisticSeed;
  function sr(){const x=Math.sin(s++)*10000;return x-Math.floor(x);}
  for(let i=0;i<60;i++){const x=sr()*100;const prob=1/(1+Math.exp(-(b0+b1*x)));pts.push({x,y:sr()<prob?1:0});}
  logisticSeed++;

  const xExt=[-5,105],yExt=[-0.1,1.1];
  const xScale=d3.scaleLinear().domain(xExt).range([M.l,W-M.r]);
  const yScale=d3.scaleLinear().domain(yExt).range([H-M.b,M.t]);

  container.innerHTML='';
  const svg=d3.select(container).append('svg').attr('viewBox',`0 0 ${W} ${H}`).attr('width',W).attr('height',H);

  const curveData=Array.from({length:300},(_,i)=>{const x=-5+110*i/299;return{x,y:1/(1+Math.exp(-(b0+b1*x)))};});
  const line=d3.line().x(d=>xScale(d.x)).y(d=>yScale(d.y)).curve(d3.curveBasis);
  svg.append('path').datum(curveData).attr('d',line).attr('fill','none').attr('stroke','var(--terracotta)').attr('stroke-width',2.5);

  svg.append('line').attr('x1',xScale(boundary)).attr('x2',xScale(boundary)).attr('y1',yScale(0)).attr('y2',yScale(1)).attr('stroke','var(--gold)').attr('stroke-width',1.5).attr('stroke-dasharray','6,4');
  svg.append('text').attr('x',xScale(boundary)+5).attr('y',M.t+12).attr('font-family','var(--mono)').attr('font-size','0.65rem').attr('fill','var(--gold)').text('p=0.5');

  svg.selectAll('circle').data(pts).join('circle').attr('cx',d=>xScale(d.x)).attr('cy',d=>yScale(d.y)).attr('r',4).attr('fill',d=>d.y===1?'var(--terracotta)':'var(--forest)').attr('opacity',0.7);

  svg.append('g').attr('transform',`translate(0,${H-M.b})`).call(d3.axisBottom(xScale).ticks(6));
  svg.append('g').attr('transform',`translate(${M.l},0)`).call(d3.axisLeft(yScale).ticks(5));
  svg.selectAll('.axis text').attr('font-family','var(--mono)').attr('font-size','0.7rem').attr('fill','var(--slate)');
  svg.selectAll('.axis line,.axis path').attr('stroke','var(--stone)');
}

updateLogistic();
window.addEventListener('resize',()=>{clearTimeout(window._rt);window._rt=setTimeout(updateLogistic,250)});