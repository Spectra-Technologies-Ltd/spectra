const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, 'src');

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.isFile() && p.endsWith('.ts')) out.push(p);
  }
  return out;
}

let changed = 0;
const report = [];
for (const file of walk(root)) {
  let src = fs.readFileSync(file, 'utf8');
  const before = src;
  if (!src.includes('@CurrentUser() user: any')) continue;

  src = src.split('@CurrentUser() user: any').join('@CurrentUser() user: AuthenticatedUser');

  const importRe =
    /import \{ CurrentUser \} from '([^']*current-user\.decorator)';/;
  if (importRe.test(src)) {
    src = src.replace(
      importRe,
      "import { CurrentUser, type AuthenticatedUser } from '$1';",
    );
  } else if (!/AuthenticatedUser/.test(src)) {
    report.push('NO IMPORT MATCH: ' + path.relative(root, file));
  }

  if (src !== before) {
    fs.writeFileSync(file, src);
    changed++;
    report.push('fixed: ' + path.relative(root, file));
  }
}
console.log(report.join('\n'));
console.log('files changed:', changed);
