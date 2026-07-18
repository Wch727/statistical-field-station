const mean=arr=>arr.reduce((a,b)=>a+b,0)/arr.length;
const sum=arr=>arr.reduce((a,b)=>a+b,0);

let corrData=[];
function initCorrData(){corrData=[];for(let i=0;i<18;i++)corrData.push({x:10+Math.random()*80,y:10+Math.random()*80});}
initCorrData();

function updateCorrelation(){
  const W=520,H=400,M={t:30,r:30,b:50,l:50};
  const xs=corrData.map(d=>d.x),ys=corrData.map(d=>d.y);
  const xExt=[d3.min(xs)-5,d3.max(xs)+5],yExt=[d3.min(ys)-5,d3.max(ys)+5];
  const xScale=d3.scaleLinear().domain(xExt).range([M.l,W-M.r]);
  const yScale=d3.scaleLinear().domain(yExt).range([H-M.b,M.t]);

  const mx=mean(xs),my=mean(ys);
  const num=sum(xs.map((x,i)=>(x-mx)*(ys[i]-my)));
  const den=Math.sqrt(sum(xs.map(x=>(x-mx)**2))*sum(ys.map(y=>(y-my)**2)));
  const r=den===0?0:num/den;
  document.getElementById('pearson-r').textContent=r.toFixed(4);

  function rank(arr){const sorted=[...arr].map((v,i)=>({v,i})).sort((a,b)=>a.v-b.v);const ranks=Array(arr.length);sorted.forEach((s,i)=>{ranks[s.i]=i+1});return ranks;}
  const rx=rank(xs),ry=rank(ys);
  const mrx=mean(rx),mry=mean(ry);
  const numR=sum(rx.map((r_,i)=>(r_-mrx)*(ry[i]-mry)));
  const denR=Math.sqrt(sum(rx.map(r_=>(r_-mrx)**2))*sum(ry.map(r_=>(r_-mry)**2)));
  const rho=denR===0?0:numR/denR;
  document.getElementById('spearman-rho').textContent=rho.toFixed(4);
  document.getElementById('r-squared').textContent=(r*r).toFixed(4);

  const container=document.getElementById('scatter-container');
  container.innerHTML='';
  const svg=d3.select(container).append('svg').attr('viewBox',`0 0 ${W} ${H}`).attr('width',W).attr('height',H);

  if(den!==0){const b1=num/sum(xs.map(x=>(x-mx)**2)),b0=my-b1*mx;
    svg.append('line').attr('x1',xScale(xExt[0])).attr('x2',xScale(xExt[1])).attr('y1',yScale(b0+b1*xExt[0])).attr('y2',yScale(b0+b1*xExt[1])).attr('stroke','var(--terracotta)').attr('stroke-width',1.5).attr('stroke-dasharray','6,3').attr('opacity',0.6);}

  const drag=d3.drag().on('drag',function(event,d){
    d.x=xScale.invert(event.x);d.y=yScale.invert(event.y);
    d.x=Math.max(xExt[0],Math.min(xExt[1],d.x));d.y=Math.max(yExt[0],Math.min(yExt[1],d.y));
    d3.select(this).attr('cx',xScale(d.x)).attr('cy',yScale(d.y));updateCorrelation();});

  svg.selectAll('circle').data(corrData).join('circle').attr('cx',d=>xScale(d.x)).attr('cy',d=>yScale(d.y)).attr('r',6).attr('fill','var(--terracotta)').attr('opacity',0.7).attr('cursor','grab').call(drag);
  svg.append('g').attr('transform',`translate(0,${H-M.b})`).call(d3.axisBottom(xScale).ticks(6));
  svg.append('g').attr('transform',`translate(${M.l},0)`).call(d3.axisLeft(yScale).ticks(6));
  svg.selectAll('.axis text').attr('font-family','var(--mono)').attr('font-size','0.7rem').attr('fill','var(--slate)');
  svg.selectAll('.axis line,.axis path').attr('stroke','var(--stone)');
}
function resetCorrData(){initCorrData();updateCorrelation();}
function addCorrPoint(){corrData.push({x:20+Math.random()*60,y:20+Math.random()*60});updateCorrelation();}

updateCorrelation();
window.addEventListener('resize',()=>{clearTimeout(window._rt);window._rt=setTimeout(updateCorrelation,250)});