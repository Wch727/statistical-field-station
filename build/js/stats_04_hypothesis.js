function updateTTest(){
  const m1=+document.getElementById('ttest-m1').value,s1=+document.getElementById('ttest-s1').value,n1=+document.getElementById('ttest-n1').value;
  const m2=+document.getElementById('ttest-m2').value,s2=+document.getElementById('ttest-s2').value,n2=+document.getElementById('ttest-n2').value;
  document.getElementById('ttest-m1-val').textContent=m1;document.getElementById('ttest-s1-val').textContent=s1;document.getElementById('ttest-n1-val').textContent=n1;
  document.getElementById('ttest-m2-val').textContent=m2;document.getElementById('ttest-s2-val').textContent=s2;document.getElementById('ttest-n2-val').textContent=n2;

  const se=Math.sqrt(s1*s1/n1+s2*s2/n2),t=(m1-m2)/se;
  const df_num=(s1*s1/n1+s2*s2/n2)**2,df_den=(s1*s1/n1)**2/(n1-1)+(s2*s2/n2)**2/(n2-1);
  const df=df_den===0?1:df_num/df_den,p=2*(1-tCDF(Math.abs(t),df));
  const sp=Math.sqrt(((n1-1)*s1*s1+(n2-1)*s2*s2)/(n1+n2-2)),d=(m1-m2)/sp;

  document.getElementById('ttest-results').innerHTML='<div class="stat-cards">'+[
    {l:'t',v:t.toFixed(4)},{l:'df',v:df.toFixed(1)},{l:'p',v:p.toFixed(4)},
    {l:"Cohen's d (pooled SD)",v:d.toFixed(3)},{l:'Significant',v:p<0.05?'YES (p<0.05)':'NO'}
  ].map(s=>`<div class="stat-card"><div class="lbl">${s.l}</div><div class="val" style="color:${s.l==='Significant'&&p<0.05?'var(--terracotta)':'var(--forest)'}">${s.v}</div></div>`).join('')+'</div>'+
  `<p style="font-size:0.7rem;color:var(--slate);margin-top:4px;">本面板采用 Welch t 检验；效应量展示 pooled Cohen's d。小样本时可使用 Hedges' g 进行偏差修正；方差明显不齐且存在明确对照组时，可考虑 Glass's Δ。</p>`;

  const container=document.getElementById('ttest-plot');
  const W=container.clientWidth||500,H=220,MM={t:20,r:30,b:40,l:30};
  const xMin=Math.min(m1-4*s1,m2-4*s2),xMax=Math.max(m1+4*s1,m2+4*s2);
  const xScale=d3.scaleLinear().domain([xMin,xMax]).range([MM.l,W-MM.r]);
  const yMax=Math.max(1/(s1*Math.sqrt(2*Math.PI)),1/(s2*Math.sqrt(2*Math.PI)));
  const yScale=d3.scaleLinear().domain([0,yMax*1.2]).range([H-MM.b,MM.t]);

  container.innerHTML='';
  const svg=d3.select(container).append('svg').attr('viewBox',`0 0 ${W} ${H}`).attr('width',W).attr('height',H);
  function normalPDF(x,m,s){return Math.exp(-(((x-m)**2))/(2*s*s))/(s*Math.sqrt(2*Math.PI));}
  const pts=200;
  [{m:m1,s:s1,color:'var(--terracotta)',label:'A'},{m:m2,s:s2,color:'var(--forest)',label:'B'}].forEach(g=>{
    const line=d3.line().x(d=>xScale(d.x)).y(d=>yScale(d.y)).curve(d3.curveBasis);
    const data=Array.from({length:pts},(_,i)=>{const x=xMin+(xMax-xMin)*i/pts;return{x,y:normalPDF(x,g.m,g.s)};});
    svg.append('path').datum(data).attr('d',line).attr('fill',g.color).attr('opacity',0.2).attr('stroke',g.color).attr('stroke-width',2);
    svg.append('text').attr('x',xScale(g.m)).attr('y',MM.t+10).attr('text-anchor','middle').attr('font-family','var(--mono)').attr('font-size','0.7rem').attr('fill',g.color).text(g.label);
  });
  svg.append('g').attr('transform',`translate(0,${H-MM.b})`).call(d3.axisBottom(xScale).ticks(5));
  svg.selectAll('.axis text').attr('font-family','var(--mono)').attr('font-size','0.7rem').attr('fill','var(--slate)');
  svg.selectAll('.axis line,.axis path').attr('stroke','var(--stone)');
}

// ═══════════ Chi-Square ═══════════
function updateChiSquare(){
  const rawO11=document.getElementById('chi-o11').textContent.trim();
  const rawO12=document.getElementById('chi-o12').textContent.trim();
  const rawO21=document.getElementById('chi-o21').textContent.trim();
  const rawO22=document.getElementById('chi-o22').textContent.trim();
  const raws=[rawO11,rawO12,rawO21,rawO22];

  // Validate: no empty cells (Number('') → 0, misleading)
  if(raws.some(v=>v==='')){
    document.getElementById('chi-results').innerHTML='<p style="color:var(--terracotta);">⚠ 频数不能为空；需要表示零时请输入 0</p>';
    document.getElementById('chi-plot').innerHTML='';
    return;
  }

  const o11=Number(rawO11),o12=Number(rawO12),o21=Number(rawO21),o22=Number(rawO22);
  const obs=[o11,o12,o21,o22];

  // Validate: non-negative integers only
  if(obs.some(v=>!Number.isFinite(v)||v<0||!Number.isInteger(v))){
    document.getElementById('chi-results').innerHTML='<p style="color:var(--terracotta);">⚠ 请输入非负整数频数</p>';
    document.getElementById('chi-plot').innerHTML='';
    return;
  }

  const r1=o11+o12,r2=o21+o22,c1=o11+o21,c2=o12+o22,N=r1+r2;
  document.getElementById('chi-r1').textContent=r1;document.getElementById('chi-r2').textContent=r2;
  document.getElementById('chi-c1').textContent=c1;document.getElementById('chi-c2').textContent=c2;
  document.getElementById('chi-N').textContent=N;

  // Validate: every row and column must have positive totals
  if([r1,r2,c1,c2].some(v=>v===0)){
    document.getElementById('chi-results').innerHTML='<p style="color:var(--terracotta);">⚠ 每行、每列合计都必须大于 0</p>';
    document.getElementById('chi-plot').innerHTML='';
    return;
  }

  const e11=r1*c1/N,e12=r1*c2/N,e21=r2*c1/N,e22=r2*c2/N;
  const expected=[e11,e12,e21,e22];
  const chi2 = (o11-e11)**2/e11 + (o12-e12)**2/e12 + (o21-e21)**2/e21 + (o22-e22)**2/e22;
  const df=1,p=1-chiCDF(chi2,df);
  const cramersV=Math.sqrt(chi2/(N*1));

  // Fisher warning when expected frequencies are small
  const smallCount=expected.filter(e=>e<5).length;
  const fisherNote=smallCount>0
    ?`<p style="font-size:0.8rem;color:var(--gold);margin-top:4px;">⚠ ${smallCount} 个单元格期望频数 &lt; 5，建议使用 Fisher 精确检验</p>`
    :'<p style="font-size:0.8rem;color:var(--forest);margin-top:4px;">✓ 期望频数条件满足</p>';

  const significance = smallCount > 0
    ? 'CHECK FISHER'
    : p < 0.05
      ? 'YES (p<0.05)'
      : 'NO';

  const cardColor = s => {
    if (s.l !== 'Significant') return 'var(--forest)';
    if (smallCount > 0) return 'var(--gold)';
    return p < 0.05 ? 'var(--terracotta)' : 'var(--forest)';
  };

  document.getElementById('chi-results').innerHTML='<div class="stat-cards">'+[
    {l:'χ²',v:chi2.toFixed(4)},{l:'df',v:df},{l:'p',v:p.toFixed(4)},
    {l:"Cramér's V",v:cramersV.toFixed(4)},
    {l:'Significant',v:significance}
  ].map(s=>`<div class="stat-card"><div class="lbl">${s.l}</div><div class="val" style="color:${cardColor(s)}">${s.v}</div></div>`).join('')+'</div>'+
  `<p style="font-size:0.85rem;color:var(--slate);margin-top:8px;">期望频数: E₁₁=${e11.toFixed(1)}, E₁₂=${e12.toFixed(1)}, E₂₁=${e21.toFixed(1)}, E₂₂=${e22.toFixed(1)}</p>`+
  fisherNote;

  const container=document.getElementById('chi-plot');
  const W=container.clientWidth||500,H=250,MM={t:30,r:30,b:50,l:50};

  container.innerHTML='';
  const svg=d3.select(container).append('svg').attr('viewBox',`0 0 ${W} ${H}`).attr('width',W).attr('height',H);

  const groups=['行1/列1','行1/列2','行2/列1','行2/列2'];
  const exp=[e11,e12,e21,e22];
  const xScale=d3.scaleBand().domain(groups).range([MM.l,W-MM.r]).padding(0.2);
  const yMax=d3.max([...obs,...exp])*1.2;
  const yScale=d3.scaleLinear().domain([0,yMax]).range([H-MM.b,MM.t]);

  const xSub=d3.scaleBand().domain(['Observed','Expected']).range([0,xScale.bandwidth()]).padding(0.1);

  svg.append('g').attr('transform',`translate(0,${H-MM.b})`).call(d3.axisBottom(xScale));
  svg.append('g').attr('transform',`translate(${MM.l},0)`).call(d3.axisLeft(yScale).ticks(5));
  svg.selectAll('.axis text').attr('font-family','var(--mono)').attr('font-size','0.7rem').attr('fill','var(--slate)');
  svg.selectAll('.axis line,.axis path').attr('stroke','var(--stone)');

  const legend=svg.append('g').attr('transform',`translate(${MM.l},${MM.t-8})`);
  legend.append('rect').attr('x',0).attr('y',0).attr('width',10).attr('height',10).attr('fill','var(--terracotta)').attr('opacity',0.7);
  legend.append('text').attr('x',14).attr('y',9).attr('font-family','var(--mono)').attr('font-size','0.6rem').attr('fill','var(--slate)').text('Observed');
  legend.append('rect').attr('x',80).attr('y',0).attr('width',10).attr('height',10).attr('fill','var(--forest)').attr('opacity',0.5);
  legend.append('text').attr('x',94).attr('y',9).attr('font-family','var(--mono)').attr('font-size','0.6rem').attr('fill','var(--slate)').text('Expected');

  groups.forEach((g,i)=>{
    svg.append('rect').attr('x',xScale(g)+xSub('Observed')).attr('y',yScale(obs[i])).attr('width',xSub.bandwidth()).attr('height',H-MM.b-yScale(obs[i])).attr('fill','var(--terracotta)').attr('opacity',0.7);
    svg.append('rect').attr('x',xScale(g)+xSub('Expected')).attr('y',yScale(exp[i])).attr('width',xSub.bandwidth()).attr('height',H-MM.b-yScale(exp[i])).attr('fill','var(--forest)').attr('opacity',0.5);
    });

function resetChiSquare(){
  document.getElementById('chi-o11').textContent='38';document.getElementById('chi-o12').textContent='12';
  document.getElementById('chi-o21').textContent='22';document.getElementById('chi-o22').textContent='28';
  updateChiSquare();
}
function randomChiSquare(){
  document.getElementById('chi-o11').textContent=Math.floor(Math.random()*50+20);
  document.getElementById('chi-o12').textContent=Math.floor(Math.random()*50+20);
  document.getElementById('chi-o21').textContent=Math.floor(Math.random()*50+20);
  document.getElementById('chi-o22').textContent=Math.floor(Math.random()*50+20);
  updateChiSquare();
}

// ═══════════ Init ═══════════
updateTTest();updateChiSquare();
window.addEventListener('resize',()=>{clearTimeout(window._rt);window._rt=setTimeout(()=>{updateTTest();updateChiSquare();},250)});}
