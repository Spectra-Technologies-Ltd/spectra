const { spawnSync } = require('node:child_process');
const path = require('node:path');

const binExtension = process.platform === 'win32' ? '.cmd' : '';

function runBinary(name, args) {
  const command = path.join(__dirname, '..', 'node_modules', '.bin', `${name}${binExtension}`);
  const isWindows = process.platform === 'win32';
  const result = spawnSync(isWindows ? [command, ...args].join(' ') : command, isWindows ? [] : args, {
    cwd: path.join(__dirname, '..'),
    stdio: ['ignore', 'ignore', 'inherit'],
    shell: isWindows,
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

runBinary('prisma', ['generate']);
runBinary('nest', ['build']);
