import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const RESULTS_DIR = path.join(root, 'allure-results');
const REPORT_DIR = path.join(root, 'allure-report');
const HISTORY_SRC = path.join(REPORT_DIR, 'history');
const HISTORY_DST = path.join(RESULTS_DIR, 'history');

const shouldOpen = process.argv.includes('--open');

function fixBrokenStatuses() {
  if (!fs.existsSync(RESULTS_DIR)) {
    console.log('No allure-results folder found — skipping report generation.');
    return false;
  }

  const files = fs.readdirSync(RESULTS_DIR);
  let fixed = 0;

  for (const file of files) {
    if (!file.endsWith('-result.json')) continue;
    const filePath = path.join(RESULTS_DIR, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (content.status === 'broken') {
      content.status = 'failed';
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
      fixed++;
    }
  }

  if (fixed > 0) {
    console.log(`Fixed ${fixed} "broken" status(es) → "failed".`);
  }

  return files.some((f) => f.endsWith('-result.json'));
}

function copyHistory() {
  if (!fs.existsSync(HISTORY_SRC)) return;
  fs.mkdirSync(HISTORY_DST, { recursive: true });
  for (const file of fs.readdirSync(HISTORY_SRC)) {
    fs.copyFileSync(
      path.join(HISTORY_SRC, file),
      path.join(HISTORY_DST, file)
    );
  }
  console.log('Copied Allure history for trend charts.');
}

function writeEnvironment() {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  const env = {
    Node: process.version,
    OS: `${process.platform} ${process.arch}`,
    CI: process.env.CI ? 'true' : 'false',
    Date: new Date().toISOString(),
  };
  fs.writeFileSync(
    path.join(RESULTS_DIR, 'environment.properties'),
    Object.entries(env)
      .map(([k, v]) => `${k}=${v}`)
      .join('\n')
  );
}

function generateAllure() {
  execSync(
    `npx allure generate "${RESULTS_DIR}" --clean -o "${REPORT_DIR}"`,
    { cwd: root, stdio: 'inherit' }
  );
}

function openReport() {
  if (process.env.CI) return;
  try {
    execSync(`npx allure open "${REPORT_DIR}"`, { cwd: root, stdio: 'inherit' });
  } catch {
    console.log(`Open manually: ${path.join(REPORT_DIR, 'index.html')}`);
  }
}

const hasResults = fixBrokenStatuses();
if (!hasResults) process.exit(0);

writeEnvironment();
copyHistory();
generateAllure();

console.log(`\nAllure report generated: ${REPORT_DIR}`);
console.log('Do NOT open index.html directly in the browser (shows 404).');
console.log('Serve it instead:  npm run report:allure');

if (shouldOpen) {
  openReport();
}
