const fs = require('fs');
const path = require('path');
const data = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'lint.json'), 'utf8'),
);
for (const f of data) {
  if (!f.messages.length) continue;
  const rel = f.filePath.split(/[\\/]backend[\\/]/).pop();
  console.log('### ' + rel);
  for (const m of f.messages) {
    console.log(
      '  ' + m.line + ':' + m.column + '  ' + m.ruleId + '  ' + m.message,
    );
  }
  console.log('');
}
