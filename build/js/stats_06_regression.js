const mean=arr=>arr.reduce((a,b)=>a+b,0)/arr.length;
const sum=arr=>arr.reduce((a,b)=>a+b,0);
function randn_bm(){let u=0,v=0;while(u===0)u=Math.random();while(v===0)v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}

let regData=[];
function initRegData(){regData=[];for(let i=0;i<15;i++){const x=10+Math.random()*80;regData.push({x,y:0.7*x+5+randn_bm()*10});}}
initRegData();

function updateRegression(){
  const xs=regData.map(d=>d.x),ys=regData.map(d=>d.y);
  const mx=mean(xs),my=mean(ys);
  const num=sum(xs.map((x,i)=>(x-mx)*(ys[i]-my)));
  const den=sum(xs.map(x=>(x-mx)**2));
  const b1=den===0?0:num/den,b0=my-b1*mx;
  const yHat=xs.map(x=>b0+b1*x);
  const ssRes=sum(ys.map((y,i)=>(y-yHat[i])**2));
  const ssTot=sum(ys.map(y=>(y-my)**2));
  const r2=ssTot===0?0:1-ssRes/ssTot;

  document.getElementById('reg-b0').textContent=b0.toFixed(3);
  document.getElementById('reg-b1').textContent=b1.toFixed(3);
  document.getElementById('reg-r2').textContent=r2.toFixed(4);

  const W=520,H=350,M={t:20,r:30,b:50,l:50};
  const xExt=[d3.min(xs)-5,d3.max(xs)+5],yExt=[d3.min(ys)-5,d3.max(ys)+5];
  const xScale=d3.scaleLinear().domain(xExt).range([M.l,W-M.r]);
  const yScale=d3.scaleLinear().domain(yExt).range([H-M.b,M.t]);

  const c1=document.getElementById('reg-scatter');
  c1.innerHTML='';
  const svg1=d3.select(c1).append('svg').attr('viewBox',`0 0 ${W} ${H}`).attr('width',W).attr('height',H);
  svg1.append('line').attr('x1',xScale(xExt[0])).attr('x2',xScale(xExt[1])).attr('y1',yScale(b0+b1*xExt[0])).attr('y2',yScale(b0+b1*xExt[1])).attr('stroke','var(--terracotta)').attr('stroke-width',2);

  const drag=d3.drag().on('drag',function(event,d){
    d.x=xScale.invert(event.x);d.y=yScale.invert(event.y);
    d.x=Math.max(xExt[0],Math.min(xExt[1],d.x));d.y=Math.max(yExt[0],Math.min(yExt[1],d.y));
    d3.select(this).attr('cx',xScale(d.x)).attr('cy',yScale(d.y));updateRegression();});

  svg1.selectAll('circle').data(regData).join('circle').attr('cx',d=>xScale(d.x)).attr('cy',d=>yScale(d.y)).attr('r',5).attr('fill','var(--terracotta)').attr('opacity',0.7).attr('cursor','grab').call(drag);
  svg1.append('g').attr('transform',`translate(0,${H-M.b})`).call(d3.axisBottom(xScale).ticks(6));
  svg1.append('g').attr('transform',`translate(${M.l},0)`).call(d3.axisLeft(yScale).ticks(6));
  svg1.selectAll('.axis text').attr('font-family','var(--mono)').attr('font-size','0.7rem').attr('fill','var(--slate)');
  svg1.selectAll('.axis line,.axis path').attr('stroke','var(--stone)');

  const H2=180,M2={t:20,r:30,b:40,l:50};
  const resids=ys.map((y,i)=>y-yHat[i]);
  const rExt=[d3.min(resids)-2,d3.max(resids)+2];
  const rScale=d3.scaleLinear().domain(rExt).range([H2-M2.b,M2.t]);

  const c2=document.getElementById('reg-residuals');
  c2.innerHTML='';
  const svg2=d3.select(c2).append('svg').attr('viewBox',`0 0 ${W} ${H2}`).attr('width',W).attr('height',H2);
  svg2.append('line').attr('x1',M2.l).attr('x2',W-M2.r).attr('y1',rScale(0)).attr('y2',rScale(0)).attr('stroke','var(--stone)').attr('stroke-width',1).attr('stroke-dasharray','4,4');
  svg2.selectAll('circle').data(resids).join('circle').attr('cx',(d,i)=>xScale(xs[i])).attr('cy',d=>rScale(d)).attr('r',4).attr('fill','var(--forest)').attr('opacity',0.6);
  svg2.append('g').attr('transform',`translate(0,${H2-M2.b})`).call(d3.axisBottom(xScale).ticks(6));
  svg2.append('g').attr('transform',`translate(${M2.l},0)`).call(d3.axisLeft(rScale).ticks(4));
  svg2.selectAll('.axis text').attr('font-family','var(--mono)').attr('font-size','0.7rem').attr('fill','var(--slate)');
  svg2.selectAll('.axis line,.axis path').attr('stroke','var(--stone)');
}
function resetRegData(){initRegData();updateRegression();}
function addRegPoint(){regData.push({x:20+Math.random()*60,y:20+Math.random()*60});updateRegression();}

updateRegression();
window.addEventListener('resize',()=>{clearTimeout(window._rt);window._rt=setTimeout(updateRegression,250)});