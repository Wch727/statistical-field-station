const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const shared = fs.readFileSync(path.join(root, 'assets/js/statistics.js'), 'utf8');
let cases = 0;
function check(label, fn) { fn(); cases++; console.log('PASS', label); }
function load(chapter, values={}) {
  const nodes = {}, marks=[];
  const document = {getElementById(id) { return nodes[id] ||= {value: String(values[id] ?? 0), textContent: String(values[id] ?? ''), innerHTML:'', clientWidth:600}; }};
  // A no-op drawing adapter keeps calculations and DOM initialization executable.
  function chain(type) {
    const mark={type,attrs:{}}; if(type) marks.push(mark);
    let proxy=new Proxy(function(){return proxy;}, {get(_t,k){
      if(k==='attr') return (name,value)=>{mark.attrs[name]=value;return proxy;};
      if(k==='append') return name=>chain(name);
      if(k==='bandwidth') return ()=>10;
      return ()=>proxy;
    }});return proxy;
  }
  function scale() {
    let domain=[0,1], range=[0,1];
    const f=x=>range[0]+(x-domain[0])/(domain[1]-domain[0])*(range[1]-range[0]);
    f.domain=v=>v?(domain=v,f):domain;f.range=v=>v?(range=v,f):range;return f;
  }
  const d3={min:a=>Math.min(...a),max:(a,f)=>Math.max(...a.map(f|| (x=>x))),scaleLinear:scale,scaleBand:()=>{const f=()=>0;f.domain=f.range=f.padding=()=>f;f.bandwidth=()=>10;return f;},select:()=>chain(),line:()=>chain(),axisBottom:()=>chain(),axisLeft:()=>chain(),curveBasis:null};
  const ctx=vm.createContext({document,d3,Math,Number,console,window:{addEventListener(){}},setTimeout(){},clearTimeout(){}});
  vm.runInContext(shared,ctx);
  let src=fs.readFileSync(path.join(root,'build/js',chapter+'.js'),'utf8');
  if(chapter==='stats_02_visualization')src=src.replace(/^updateCharts\(\);$/m,'');
  vm.runInContext(src,ctx);
  return {ctx,nodes,marks,run:code=>vm.runInContext(code,ctx)};
}
const desc=load('stats_01_descriptive');
check('descriptive g1/g2 match SciPy moment definitions',()=>{
  desc.run('descData=[1,2,3,8];updateDescStats()');
  assert.match(desc.nodes['desc-stats'].innerHTML,/Skew<\/div><div class="val">0\.922/);
  assert.match(desc.nodes['desc-stats'].innerHTML,/Kurt<\/div><div class="val">-0\.839/);
});
check('constant data do not display NaN as skew/kurtosis',()=>{
  desc.run('descData=[5,5,5];updateDescStats()');assert.doesNotMatch(desc.nodes['desc-stats'].innerHTML,/NaN|Infinity/);assert.match(desc.nodes['desc-stats'].innerHTML,/未定义/);
});
check('numeric editor rejects partial strings and infinite values',()=>{
  desc.run("descData=[1,2,3];updateDescCell(0,'12oops');updateDescCell(1,'Infinity');updateDescCell(2,' ')");assert.equal(desc.run('descData.join()'),'1,2,3');
});
check('negative-mean CV is marked inapplicable',()=>{
  desc.run('descData=[-1,-2,-3];updateDescStats()');assert.match(desc.nodes['desc-stats'].innerHTML,/CV<\/div><div class="val">不适用/);
});
const visual=load('stats_02_visualization');
check('boxplot whisker ends at observed inlier rather than fence',()=>{
  visual.run('data.length=0;data.push(0,1,2,3,4,100);updateBoxplot()');
  const line=visual.marks.find(m=>m.type==='line');
  // Domain [-2,102], range [30,570]; max inlier is 4 (fence is 7.5).
  assert.ok(Math.abs(line.attrs.x2-(30+6/104*540))<1e-9);
});
const hypothesis=load('stats_04_hypothesis',{'ttest-m1':50,'ttest-m2':55,'ttest-s1':10,'ttest-s2':12,'ttest-n1':30,'ttest-n2':30,'chi-o11':38,'chi-o12':12,'chi-o21':22,'chi-o22':28});
check('both hypothesis panels initialize and controls are globally callable',()=>{
  assert.match(hypothesis.nodes['ttest-results'].innerHTML,/0\.0850/);assert.match(hypothesis.nodes['chi-results'].innerHTML,/0\.0011/);assert.equal(hypothesis.run('typeof resetChiSquare'),'function');assert.equal(hypothesis.run('typeof randomChiSquare'),'function');
});
check('chi-square independence gives p=1',()=>{
  for(const id of ['chi-o11','chi-o12','chi-o21','chi-o22'])hypothesis.nodes[id].textContent='10';hypothesis.run('updateChiSquare()');assert.match(hypothesis.nodes['chi-results'].innerHTML,/1\.0000/);
});
check('chi-square rejects zero-margin and fractional frequencies',()=>{
  hypothesis.nodes['chi-o11'].textContent='0';hypothesis.nodes['chi-o12'].textContent='0';hypothesis.run('updateChiSquare()');assert.match(hypothesis.nodes['chi-results'].innerHTML,/合计都必须大于/);
  hypothesis.nodes['chi-o11'].textContent='1.5';hypothesis.run('updateChiSquare()');assert.match(hypothesis.nodes['chi-results'].innerHTML,/非负整数/);
});
const anova=load('stats_05_anova',{'anova-m1':45,'anova-m2':55,'anova-m3':50,'anova-n1':20,'anova-n2':20,'anova-n3':20,'anova-sigma':10});
check('ANOVA F=5, p=.009983929593 matches SciPy',()=>{assert.match(anova.nodes['anova-tbody'].innerHTML,/5\.000/);assert.match(anova.nodes['anova-tbody'].innerHTML,/0\.0100/);});
check('equal observed group means give F=0, p=1',()=>{anova.nodes['anova-m1'].value='50';anova.nodes['anova-m2'].value='50';anova.run('updateANOVA()');assert.match(anova.nodes['anova-tbody'].innerHTML,/1\.0000/);});
check('ANOVA does not override shared distribution functions',()=>{assert.ok(Math.abs(anova.run('fSurvival(5,2,57)')-0.009983929593052422)<1e-13);});
console.log(`${cases} foundations regression cases passed.`);
