import { spawnSync } from 'node:child_process';
import process from 'node:process';

const defaultArgs = ['detect', '--source', '.', '--no-git', '--redact', '-v'];
const args = process.argv.slice(2).length > 0 ? process.argv.slice(2) : defaultArgs;

function hasCommand(name) {
  const result = spawnSync(name, ['--version'], { stdio: 'ignore' });
  return result.status === 0;
}

function run(command, commandArgs) {
  const result = spawnSync(command, commandArgs, { stdio: 'inherit' });
  return result.status ?? 1;
}

if (hasCommand('gitleaks')) {
  process.exit(run('gitleaks', args));
}

if (hasCommand('docker')) {
  process.exit(
    run('docker', [
      'run',
      '--rm',
      '-v',
      `${process.cwd()}:/repo`,
      '-w',
      '/repo',
      'ghcr.io/gitleaks/gitleaks:latest',
      ...args,
    ]),
  );
}

console.error(`Secret scanning failed: neither gitleaks nor Docker is available.

Install gitleaks and re-run npm run security:secrets before pushing.

Do not commit real Google API keys, Firebase service-account files, or .env files.`);
process.exit(1);
