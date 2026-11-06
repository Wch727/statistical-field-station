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
function updateDescCell(i, val) { const v=Number(val.trim()); if(val.trim()!=='' && Number.isFinite(v)){descData[i]=v;} renderDescTable(); updateDescStats(); }
function updateGroupCell(i, val) { descGroups[i]=val.trim(); updateDescStats(); }
function addDescRow() { descData.push(Math.round(mean(descData)+randn_bm()*std(descData))); descGroups.push(''); renderDescTable(); updateDescStats(); }
function resetDescData() { descData=[12,15,18,22,23,25,28,30,31,33,35,38,42,45,55]; descGroups=['A','A','A','A','B','B','B','B','B','C','C','C','C','C','C']; renderDescTable(); updateDescStats(); }

function updateDescStats() {
  const d = descData.filter(Number.isFinite);
  if (d.length===0) return;
  const m=mean(d), s=std(d), med=median(d), q1=quartile(d,0.25), q3=quartile(d,0.75);
  const mn=Math.min(...d), mx=Math.max(...d), iqr=q3-q1, n=d.length;
  // Moment definitions g1/g2 use the n-denominator second moment, not sample SD.
  const momentSD = Math.sqrt(d.reduce((sum,x)=>sum+(x-m)**2,0)/n);
  const skew = momentSD>0 ? d.reduce((sum,x)=>sum+((x-m)/momentSD)**3,0)/n : NaN;
  const kurt = momentSD>0 ? d.reduce((sum,x)=>sum+((x-m)/momentSD)**4,0)/n - 3 : NaN;
  const fmt = (x, digits) => Number.isFinite(x) ? x.toFixed(digits) : '未定义';
  const mad = median(d.map(x=>Math.abs(x-med)));
  const stats = [
    {l:'n', v:n}, {l:'Mean', v:m.toFixed(2)}, {l:'Std', v:fmt(s,2)},
    {l:'SEM', v:fmt(s/Math.sqrt(n),3)}, {l:'Median', v:med.toFixed(2)},
    {l:'Min', v:mn}, {l:'Max', v:mx}, {l:'Q1', v:q1.toFixed(2)}, {l:'Q3', v:q3.toFixed(2)},
    {l:'IQR', v:iqr.toFixed(2)}, {l:'MAD', v:mad.toFixed(2)},
    {l:'Skew', v:fmt(skew,3)}, {l:'Kurt', v:fmt(kurt,3)},
    {l:'CV', v:(m>0 && d.every(x=>x>=0)?fmt(s/m*100,1)+'%':'不适用')}
  ];
  document.getElementById('desc-stats').innerHTML = '<div class="stat-cards">'+stats.map(s=>`<div class="stat-card"><div class="lbl">${s.l}</div><div class="val">${s.v}</div></div>`).join('')+'</div>';
}

renderDescTable(); updateDescStats();
