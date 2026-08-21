import { spawnSync } from 'node:child_process';
import process from 'node:process';
import fs from 'node:fs';
import path from 'node:path';

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
  const daemonCheck = spawnSync('docker', ['info'], { stdio: 'ignore' });
  if (daemonCheck.status === 0) {
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
  console.error('Docker daemon unreachable — falling back to the local pattern scan.');
}

console.error(`Secret scanning failed: neither gitleaks nor Docker is available.

Install gitleaks and re-run npm run security:secrets before pushing.

Do not commit real Google API keys, JWT/bearer tokens, Firebase service-account files, or .env files.`);

const fallbackLocalScan = () => {
  const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', 'coverage', 'backups', 'release']);
  const CONTENT_PATTERNS = [
    [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'private key material'],
    [/AIza[0-9A-Za-z_-]{30,}/, 'Google API key'],
    [/AKIA[0-9A-Z]{16}/, 'AWS access key'],
    [/firebase-adminsdk|serviceAccountKey/i, 'Firebase service account'],
    [/\bsk-[A-Za-z0-9]{24,}/, 'OpenAI-style secret key'],
    // Compact JWT (header.payload.signature) — catches tracked bearer/refresh tokens.
    [/eyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/, 'JWT / bearer token'],
  ];
  const NAME_PATTERNS = [
    [/^\.env(?!\.(example|template)$)/, 'committed local env file'],
    [/\.pem$/, 'private key file'],
    [/service[-_]?account/i, 'service account file'],
    [/\.(token|jwt)$/i, 'tracked token file'],
  ];
  const shouldScanContent = (name) =>
    /\.(ts|tsx|js|mjs|json|yml|yaml|example|txt)$/.test(name) ||
    name === '.env.example' ||
    name === '.env.template';
  const failures = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) walk(full);
        continue;
      }
      if (entry.name === 'secret-scan.mjs') continue;
      // Skip files git already ignores (e.g. local .env) so the scan focuses
      // on committable/tracked source, matching gitleaks' default behaviour.
      try {
        if (spawnSync('git', ['check-ignore', '-q', full]).status === 0) continue;
      } catch {
        /* git unavailable — scan everything */
      }
      const rel = path.relative(process.cwd(), full);
      for (const [pattern, label] of NAME_PATTERNS) {
        if (pattern.test(entry.name)) failures.push(`${rel} — ${label}`);
      }
      if (!shouldScanContent(entry.name)) continue;
      let source;
      try {
        source = fs.readFileSync(full, 'utf8');
      } catch {
        continue;
      }
      for (const [pattern, label] of CONTENT_PATTERNS) {
        if (pattern.test(source)) failures.push(`${rel} — ${label}`);
      }
    }
  };
  walk(process.cwd());
  if (failures.length > 0) {
    console.error('Local secret scan found potential secrets:');
    for (const failure of failures) console.error(`- ${failure}`);
    console.error('Re-run with gitleaks (or a working Docker daemon) to verify.');
    process.exit(1);
  }
  console.log('Local secret scan OK (gitleaks/Docker unavailable; pattern scan only).');
};

fallbackLocalScan();
