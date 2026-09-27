const fs = require('fs');
const path = require('path');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'lint.json'), 'utf8'));
const byFile = {};
const byRule = {};
let total = 0;
for (const f of data) {
  if (!f.messages.length) continue;
  const rel = f.filePath.split(/[\\/]backend[\\/]/).pop();
  byFile[rel] = byFile[rel] || { count: 0, rules: {} };
  for (const m of f.messages) {
    total++;
    byFile[rel].count++;
    byFile[rel].rules[m.ruleId] = (byFile[rel].rules[m.ruleId] || 0) + 1;
    byRule[m.ruleId] = (byRule[m.ruleId] || 0) + 1;
  }
}
console.log('TOTAL', total);
console.log('\n== BY RULE ==');
Object.entries(byRule).sort((a,b)=>b[1]-a[1]).forEach(([r,c])=>console.log(String(c).padStart(4), r));
console.log('\n== BY FILE ==');
Object.entries(byFile).sort((a,b)=>b[1].count-a[1].count).forEach(([f,v])=>{
  console.log(String(v.count).padStart(4), f);
});
