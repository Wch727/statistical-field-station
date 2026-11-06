function updateANOVA(){
  const m1=+document.getElementById('anova-m1').value,n1=+document.getElementById('anova-n1').value;
  const m2=+document.getElementById('anova-m2').value,n2=+document.getElementById('anova-n2').value;
  const m3=+document.getElementById('anova-m3').value,n3=+document.getElementById('anova-n3').value;
  const sigma=+document.getElementById('anova-sigma').value;
  document.getElementById('anova-m1-val').textContent=m1;document.getElementById('anova-n1-val').textContent=n1;
  document.getElementById('anova-m2-val').textContent=m2;document.getElementById('anova-n2-val').textContent=n2;
  document.getElementById('anova-m3-val').textContent=m3;document.getElementById('anova-n3-val').textContent=n3;
  document.getElementById('anova-sigma-val').textContent=sigma;

  const N=n1+n2+n3,grandMean=(n1*m1+n2*m2+n3*m3)/N;
  const SSB=n1*(m1-grandMean)**2+n2*(m2-grandMean)**2+n3*(m3-grandMean)**2;
  const SSW=(n1-1)*sigma*sigma+(n2-1)*sigma*sigma+(n3-1)*sigma*sigma;
  const dfB=2,dfW=N-3,MSB=SSB/dfB,MSW=SSW/dfW;
  const F=MSW>0?MSB/MSW:(MSB>0?Infinity:NaN),p=fSurvival(F,dfB,dfW);
  const etaSq=SSB/(SSB+SSW),omegaSq=(SSB-dfB*MSW)/(SSB+SSW+MSW);

  document.getElementById('anova-tbody').innerHTML=`
    <tr><td>组间 (Between)</td><td>${SSB.toFixed(2)}</td><td>${dfB}</td><td>${MSB.toFixed(2)}</td><td rowspan="2" style="font-weight:600;">${F.toFixed(3)}</td><td rowspan="2" class="${p<0.05?'sig':''}">${p>0 && p<0.0001?p.toExponential(3):p.toFixed(4)}</td></tr>
    <tr><td>组内 (Within)</td><td>${SSW.toFixed(2)}</td><td>${dfW}</td><td>${MSW.toFixed(2)}</td></tr>
    <tr style="border-top:2px solid var(--stone);"><td>总计 (Total)</td><td>${(SSB+SSW).toFixed(2)}</td><td>${N-1}</td><td></td><td></td><td></td></tr>
    <tr><td colspan="6" style="font-size:0.85rem;color:var(--slate);">η² = ${etaSq.toFixed(3)} &nbsp;|&nbsp; ω² = ${omegaSq.toFixed(3)} &nbsp;|&nbsp; Cohen's f = ${Math.sqrt(etaSq/(1-etaSq)).toFixed(3)}</td></tr>`;

  const container=document.getElementById('anova-plot');
  const W=container.clientWidth||600,H=220,MM={t:20,r:30,b:40,l:30};
  const xMin=Math.min(m1-4*sigma,m2-4*sigma,m3-4*sigma),xMax=Math.max(m1+4*sigma,m2+4*sigma,m3+4*sigma);
  const xScale=d3.scaleLinear().domain([xMin,xMax]).range([MM.l,W-MM.r]);
  const yMax=1/(sigma*Math.sqrt(2*Math.PI));
  const yScale=d3.scaleLinear().domain([0,yMax*1.3]).range([H-MM.b,MM.t]);

  container.innerHTML='';
  const svg=d3.select(container).append('svg').attr('viewBox',`0 0 ${W} ${H}`).attr('width',W).attr('height',H);
  const colors=['var(--terracotta)','var(--forest)','var(--gold)'];
  const means=[m1,m2,m3],labels=['A','B','C'],pts=200;

  labels.forEach((l,i)=>{
    const line=d3.line().x(d=>xScale(d.x)).y(d=>yScale(d.y)).curve(d3.curveBasis);
    const data=Array.from({length:pts},(_,j)=>{const x=xMin+(xMax-xMin)*j/pts;return{x,y:Math.exp(-(((x-means[i])**2))/(2*sigma*sigma))/(sigma*Math.sqrt(2*Math.PI))};});
    svg.append('path').datum(data).attr('d',line).attr('fill',colors[i]).attr('opacity',0.25).attr('stroke',colors[i]).attr('stroke-width',1.5);
    svg.append('text').attr('x',xScale(means[i])).attr('y',MM.t+8).attr('text-anchor','middle').attr('font-family','var(--mono)').attr('font-size','0.65rem').attr('fill',colors[i]).text(l);
    });
  svg.append('g').attr('transform',`translate(0,${H-MM.b})`).call(d3.axisBottom(xScale).ticks(5));
  svg.selectAll('.axis text').attr('font-family','var(--mono)').attr('font-size','0.7rem').attr('fill','var(--slate)');
  svg.selectAll('.axis line,.axis path').attr('stroke','var(--stone)');
}

updateANOVA();
window.addEventListener('resize',()=>{clearTimeout(window._rt);window._rt=setTimeout(updateANOVA,250)});