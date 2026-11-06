const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, 'build/js', name), 'utf8');
const files = ['stats_11_timeseries.js','stats_12_prediction.js','stats_13_optimization.js','stats_14_evaluation.js','stats_15_mechanism.js','stats_16_graph.js'];
for (const file of files) new vm.Script(read(file), {filename:file});
// Extract production numerical functions, not copies of their implementation.
function extract(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert(start >= 0, name);
  let depth = 0, begin = source.indexOf('{', start);
  for (let i = begin; i < source.length; i++) {
    if (source[i] === '{') depth++;
    if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  throw Error('unclosed '+name);
}
const d3 = {
  mean: a => a.reduce((s,v)=>s+v,0)/a.length,
  sum: (a,f = x=>x) => a.reduce((s,v)=>s+f(v),0)
};
function numerical(file, names, setup='') {
  const context = vm.createContext({d3, Math});
  vm.runInContext(setup + names.map(n => extract(read(file),n)).join('\n'), context);
  return context;
}
const near = (a,b,tol=1e-8) => assert(Math.abs(a-b)<=tol,`${a} != ${b}`);
// 11: regeneration must reset every component and preserve the generation identity.
const ts = numerical(files[0], ['generateTrendSeasonal','generateRandomWalk','generateAR2','generateMA2','acf','pacfFromACF'],
 'var tsData=[],trend=[],seasonal=[],residual=[],n=200;');
for (let run=0;run<3;run++) {
  vm.runInContext('generateTrendSeasonal()',ts);
  for (const a of ['tsData','trend','seasonal','residual']) assert.equal(ts[a].length,200);
  ts.tsData.forEach((y,i)=>near(y,ts.trend[i]+ts.seasonal[i]+ts.residual[i]));
}
const first = ts.tsData.slice(); vm.runInContext('generateTrendSeasonal()',ts);
assert(ts.tsData.some((y,i)=>y!==first[i]));
const rho=ts.acf([1,2,3,4],2);near(rho[0],1);near(rho[1],0.25);near(rho[2],-0.3);
const pacf=ts.pacfFromACF([1,0.5,0.25,0.125]);near(pacf[1],0.5);near(pacf[2],0);near(pacf[3],0);
// 12: signed normal equations, exponential shape, constant a=0 limit.
const gm = numerical(files[1], ['gm11']);
const geometric=Array.from({length:10},(_,i)=>20*1.1**i);
const g=gm.gm11(geometric,3);
assert(g && g.a<0 && g.b>0 && g.ratioOK);
near(g.a,-2*(1.1-1)/(1.1+1),1e-11);
assert(g.mape<1 && g.fittedOrig.length===13);
const constant=gm.gm11(Array(8).fill(20),2);
assert(constant);constant.fittedOrig.forEach(y=>near(y,20,1e-7));
assert.equal(gm.gm11([0,1,2,3],1),null);
assert.equal(gm.gm11([1,2,3],1),null);
// 13: actual vertex enumeration and dynamic programming vs exhaustive subsets.
const lp=numerical(files[2],['getVertices'], 'var constraints=[{a:1,b:1,c:8},{a:2,b:1,c:12},{a:1,b:2,c:12}];');
const vertices=lp.getVertices();assert.equal(vertices.length,4);
near(Math.min(...vertices.map(([x,y])=>-3*x-2*y)),-20);
const kp=numerical(files[2],['solveKnapsack'],'var items=[{weight:2,value:6},{weight:3,value:7},{weight:5,value:13},{weight:4,value:8}];');
for(let capacity=0;capacity<=15;capacity++) {
 let best=0;
 for(let mask=0;mask<16;mask++) {
  let weight=0,value=0;kp.items.forEach((item,i)=>{if(mask&(1<<i)){weight+=item.weight;value+=item.value;}});
  if(weight<=capacity)best=Math.max(best,value);
 }
 const result=kp.solveKnapsack(capacity);assert.equal(result.totalValue,best);assert(result.totalWeight<=capacity);
}
// 14: Perron residual and consistent reciprocal matrix, TOPSIS scale invariance.
const ahp=numerical(files[3],['ahpEigen','topsis']);
const weights=[0.4,0.3,0.2,0.1], A=weights.map(w=>weights.map(v=>w/v));
const eig=ahp.ahpEigen(A);eig.w.forEach((v,i)=>near(v,weights[i],1e-10));near(eig.lambdaMax,4);near(eig.CR,0);
const B=[[1,3,5,7],[1/3,1,2,4],[1/5,1/2,1,3],[1/7,1/4,1/3,1]];
const b=ahp.ahpEigen(B);
B.forEach((row,i)=>near(row.reduce((s,v,j)=>s+v*b.w[j],0),b.lambdaMax*b.w[i],1e-10));
const alternatives=[{name:'A',c1:1,c2:2},{name:'B',c1:2,c2:1}];
const t1=ahp.topsis(alternatives,0.5,0.5),t2=ahp.topsis(alternatives,2,2);
t1.result.forEach((r,i)=>near(r.c,t2.result[i].c));near(t1.result[0].c,0.5);
// 15: growth/decay equilibrium, RK4 conservation, no-growth preset, final-size invariant.
const ode=numerical(files[4],['logistic','sirRK4']);
near(ode.logistic(0,50,1000,0.3),50);near(ode.logistic(100,1000,1000,0.3),1000);
assert(ode.logistic(1,1500,1000,0.3)<1500);assert(ode.logistic(1,1500,1000,0.3)>1000);
for (const [beta,gamma] of [[0.3,0.1],[0.15,0.4],[0.8,0.02]]) {
 const data=ode.sirRK4(beta,gamma,1000,5,80,0.2);
 data.forEach(p=>{near(p.S+p.I+p.R,1000,1e-8);assert(p.S>=0&&p.I>=0&&p.R>=0);});
 if(beta<gamma)assert.equal(Math.max(...data.map(p=>p.I)),5);
 const last=data.at(-1);
 // At beta/gamma=40 the remaining S is tiny; log(S) amplifies absolute rounding.
 const invariantError=Math.abs(Math.log(last.S/995)+(beta/gamma)*last.R/1000);
 assert(invariantError<5e-5);
 const refined=ode.sirRK4(beta,gamma,1000,5,80,0.1).at(-1);
 const refinedError=Math.abs(Math.log(refined.S/995)+(beta/gamma)*refined.R/1000);
 assert(refinedError<=invariantError+1e-12);
}
// 16: shortest-path function must have a completed adjacency map before UI setup.
const graphSource=read(files[5]);assert(graphSource.includes('adj[e.to].push({to:e.from, w:e.w});\n  });'));
const graph=numerical(files[5],['dijkstra'],`var nodes=[0,1,2,3,4,5].map(id=>({id}));
var adj={0:[{to:1,w:4},{to:2,w:2}],1:[{to:0,w:4},{to:2,w:1},{to:3,w:5},{to:4,w:6}],2:[{to:0,w:2},{to:1,w:1},{to:4,w:3}],3:[{to:1,w:5},{to:4,w:2},{to:5,w:3}],4:[{to:2,w:3},{to:3,w:2},{to:5,w:4},{to:1,w:6}],5:[{to:3,w:3},{to:4,w:4}]};`);
assert.equal(graph.dijkstra(0,5).dist,9);assert.equal(graph.dijkstra(3,3).dist,0);
console.log('Modeling audit passed: source syntax, decomposition, ACF/PACF, GM, LP/knapsack, TOPSIS/AHP, Logistic/SIR, Dijkstra.');
