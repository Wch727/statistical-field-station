const {spawnSync} = require('node:child_process');
const suites = ['audit-foundations.cjs','audit-models.cjs','audit-modeling.cjs'];
for (const suite of suites) {
  const result = spawnSync(process.execPath, ['tests/' + suite], {stdio:'inherit'});
  if (result.error || result.status !== 0) { if(result.error) console.error(result.error); process.exit(result.status || 1); }
}
