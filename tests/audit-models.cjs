// Run: node tests/audit-models.cjs [repository root]
// Executes actual chapter functions without loading D3's DOM renderer.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=process.argv[2]||path.resolve(__dirname,'..');
const dir=fs.existsSync(path.join(root,'build','js'))?path.join(root,'build','js'):path.join(root,'js');
const source=name=>fs.readFileSync(path.join(dir,name),'utf8');
function extract(text,name){
  const start=text.indexOf(`function ${name}(`); assert(start>=0,`Missing ${name}`);
  const body=text.indexOf('{',start); let depth=1,i=body+1;
  for(;depth && i<text.length;i++){if(text[i]==='{')depth++;if(text[i]==='}')depth--;}
  return text.slice(start,i);
}
function near(a,b,tol=1e-10){assert(Math.abs(a-b)<=tol,`${a} != ${b}`);}
let groups=0;

// PCA must solve the actual covariance, including repeated/zero eigenvalues.
const evaluation=source('stats_10_evaluation.js');
const eigenCtx=vm.createContext({});vm.runInContext(extract(evaluation,'symmetricEigen3'),eigenCtx);
const eig=a=>eigenCtx.symmetricEigen3(a);
for(const a of [ [[4,1,0],[1,3,0],[0,0,2]], [[1,1,1],[1,1,1],[1,1,1]], [[2,0,0],[0,2,0],[0,0,2]], [[0,0,0],[0,0,0],[0,0,0]], [[1e8,2e4,0],[2e4,8,0],[0,0,1e-6]] ]){
  const {values,vectors}=eig(a),scale=Math.max(1,...a.flat().map(Math.abs));
  near(values.reduce((s,x)=>s+x,0),a[0][0]+a[1][1]+a[2][2],scale*1e-12);
  for(let j=0;j<3;j++){
    assert(values[j]>=-scale*1e-12);
    for(let i=0;i<3;i++)near(a[i].reduce((s,x,k)=>s+x*vectors[j][k],0),values[j]*vectors[j][i],scale*1e-12);
    for(let k=0;k<3;k++)near(vectors[j].reduce((s,x,i)=>s+x*vectors[k][i],0),j===k?1:0);
  }
}
const known=eig([[4,1,0],[1,3,0],[0,0,2]]).values;
near(known[0],(7+Math.sqrt(5))/2);near(known[1],(7-Math.sqrt(5))/2);near(known[2],2);groups++;

// AUC uses all distinct scores, counts ties as half, preserves vertical ROC legs.
const rocCtx=vm.createContext({scoresPos:[],scoresNeg:[]});
vm.runInContext(extract(evaluation,'computeROCPoints')+'\n'+extract(evaluation,'computeAUC'),rocCtx);
for(const [pos,neg,expected] of [[[.9,.8],[.2,.1],1],[[.1,.2],[.8,.9],0],[[.5,.5],[.5,.5],.5],[[.4,.8],[.2,.6],.75],[[.501,.509],[.505,.507],.5],[[1,0],[1,0],.5]]){
  rocCtx.scoresPos=pos;rocCtx.scoresNeg=neg;near(rocCtx.computeAUC(),expected);
  const pts=rocCtx.computeROCPoints();near(pts[0].fpr,0);near(pts[0].tpr,0);near(pts.at(-1).fpr,1);near(pts.at(-1).tpr,1);
}
rocCtx.scoresPos=[];assert(Number.isNaN(rocCtx.computeAUC()));groups++;

// Regression must not report a fictitious identified slope or defined R².
const reg=source('stats_06_regression.js');
const els={};const document={getElementById:id=>els[id]||(els[id]={})};
const rc=vm.createContext({document,regData:[]});
const regBody=extract(reg,'updateRegression');
vm.runInContext('const mean=arr=>arr.reduce((a,b)=>a+b,0)/arr.length;const sum=arr=>arr.reduce((a,b)=>a+b,0);'+regBody.slice(0,regBody.indexOf('  const W='))+'}',rc);
rc.regData=[{x:1,y:3},{x:2,y:5},{x:3,y:7}];rc.updateRegression();near(+els['reg-b1'].textContent,2);near(+els['reg-r2'].textContent,1);
rc.regData=[{x:1,y:3},{x:2,y:3}];rc.updateRegression();assert.match(els['reg-r2'].textContent,/未定义/);
rc.regData=[{x:1,y:3},{x:1,y:4}];rc.updateRegression();assert.match(els['reg-b1'].textContent,/不可唯一/);groups++;

// β1=0 has either no 0.5 crossing or all X at 0.5, never a fabricated X=0.
const lc=vm.createContext({document});const logBody=extract(source('stats_07_logistic.js'),'updateLogistic');
vm.runInContext(logBody.slice(0,logBody.indexOf('  const container='))+'}',lc);
document.getElementById('log-b0').value=2;document.getElementById('log-b1').value=0;lc.updateLogistic();assert.equal(els['log-boundary'].textContent,'无交点');
document.getElementById('log-b0').value=0;lc.updateLogistic();assert.match(els['log-boundary'].textContent,/所有 X/);
document.getElementById('log-b0').value=2;document.getElementById('log-b1').value=-2;lc.updateLogistic();near(+els['log-boundary'].textContent,1);groups++;

const clustering=source('stats_09_clustering.js');
const d3={sum:xs=>xs.reduce((a,b)=>a+b,0),mean:(xs,f)=>xs.reduce((a,x)=>a+f(x),0)/xs.length};
// DBSCAN uses a closed epsilon neighbourhood, and noise can later become border.
const dc=vm.createContext({data:[],d3});vm.runInContext(extract(clustering,'dbscan'),dc);
dc.data=[{x:0,y:0},{x:1,y:0}];assert.equal(dc.dbscan(1,2).nClusters,1);
dc.data=[{x:0,y:0},{x:.9,y:0},{x:1,y:.1},{x:1,y:-.1}];const db=dc.dbscan(.91,4);assert.equal(db.nClusters,1);assert.equal(db.labels[0],0);groups++;

// K-means starts safely with fewer than K points, and Lloyd decreases its objective.
const kc=vm.createContext({points:[],K:3,centroids:[],assignments:[],converged:false,d3,redraw(){},updateStats(){}});
vm.runInContext(['initCentroids','assignPoints','updateCentroids','wcss','doStep'].map(n=>extract(clustering,n)).join('\n'),kc);
kc.points=[{x:0,y:0}];kc.initCentroids();assert.equal(kc.centroids.length,0);near(kc.wcss(),0);
kc.K=2;kc.points=[{x:0,y:0},{x:.1,y:.1},{x:.9,y:.9},{x:1,y:1}];kc.initCentroids();let previous=kc.wcss();
for(let i=0;i<5;i++){kc.doStep();const current=kc.wcss();assert(current<=previous+1e-12);previous=current;}
assert.equal(kc.assignments.length,kc.points.length);groups++;

// The shift modifier is read from the D3 v6+ event argument.
const classification=source('stats_08_classification.js');assert.match(classification,/event\.shiftKey \? 1 : currentClass/);assert(!classification.includes('d3.event'));
assert(!evaluation.includes('evals = [1, 0.5, 0.2]'));groups++;
console.log(`Model chapters audit: ${groups} regression groups passed.`);
