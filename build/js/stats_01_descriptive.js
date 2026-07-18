const mean = arr => arr.reduce((a,b)=>a+b,0)/arr.length;
const std = arr => { const m=mean(arr); return Math.sqrt(arr.reduce((s,x)=>s+(x-m)**2,0)/(arr.length-1)); };
const median = arr => { const s=[...arr].sort((a,b)=>a-b), n=s.length; return n%2?s[(n-1)/2]:(s[n/2-1]+s[n/2])/2; };
const quartile = (arr, q) => { const s=[...arr].sort((a,b)=>a-b), n=s.length, idx=q*(n-1), lo=Math.floor(idx), hi=Math.ceil(idx); return lo===hi?s[lo]:s[lo]+(s[hi]-s[lo])*(idx-lo); };
function randn_bm() { let u=0,v=0; while(u===0)u=Math.random(); while(v===0)v=Math.random(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); }

let descData = [12,15,18,22,23,25,28,30,31,33,35,38,42,45,55];
let descGroups = ['A','A','A','A','B','B','B','B','B','C','C','C','C','C','C'];

function renderDescTable() {
  document.getElementById('desc-tbody').innerHTML = descData.map((v,i) =>
    `<tr><td style="color:var(--slate);">${i+1}</td><td contenteditable="true" onblur="updateDescCell(${i},this.textContent)">${v}</td><td contenteditable="true" onblur="updateGroupCell(${i},this.textContent)">${descGroups[i]||''}</td></tr>`
  ).join('');
}
function updateDescCell(i, val) { const v=parseFloat(val); if(!isNaN(v)){descData[i]=v; updateDescStats();} }
function updateGroupCell(i, val) { descGroups[i]=val.trim(); updateDescStats(); }
function addDescRow() { descData.push(Math.round(mean(descData)+randn_bm()*std(descData))); descGroups.push(''); renderDescTable(); updateDescStats(); }
function resetDescData() { descData=[12,15,18,22,23,25,28,30,31,33,35,38,42,45,55]; descGroups=['A','A','A','A','B','B','B','B','B','C','C','C','C','C','C']; renderDescTable(); updateDescStats(); }

function updateDescStats() {
  const d = descData.filter(v => !isNaN(v));
  if (d.length===0) return;
  const m=mean(d), s=std(d), med=median(d), q1=quartile(d,0.25), q3=quartile(d,0.75);
  const mn=Math.min(...d), mx=Math.max(...d), iqr=q3-q1, n=d.length;
  const skew = d.reduce((sum,x)=>sum+((x-m)/s)**3,0)/n;
  const kurt = d.reduce((sum,x)=>sum+((x-m)/s)**4,0)/n - 3;
  const mad = median(d.map(x=>Math.abs(x-med)));
  const stats = [
    {l:'n', v:n}, {l:'Mean', v:m.toFixed(2)}, {l:'Std', v:s.toFixed(2)},
    {l:'SEM', v:(s/Math.sqrt(n)).toFixed(3)}, {l:'Median', v:med.toFixed(2)},
    {l:'Min', v:mn}, {l:'Max', v:mx}, {l:'Q1', v:q1.toFixed(2)}, {l:'Q3', v:q3.toFixed(2)},
    {l:'IQR', v:iqr.toFixed(2)}, {l:'MAD', v:mad.toFixed(2)},
    {l:'Skew', v:skew.toFixed(3)}, {l:'Kurt', v:kurt.toFixed(3)},
    {l:'CV', v:(m!==0?(s/m*100).toFixed(1)+'%':'N/A')}
  ];
  document.getElementById('desc-stats').innerHTML = '<div class="stat-cards">'+stats.map(s=>`<div class="stat-card"><div class="lbl">${s.l}</div><div class="val">${s.v}</div></div>`).join('')+'</div>';
}

renderDescTable(); updateDescStats();
