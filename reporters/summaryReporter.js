/** @implements {import('@playwright/test/reporter').Reporter} */
class SummaryReporter {
  constructor() {
    this.startTime = Date.now();
    /** @type {Map<string, { passed: number; failed: number; skipped: number; flaky: number; duration: number; failures: string[] }>} */
    this.byProject = new Map();
    this.total = { passed: 0, failed: 0, skipped: 0, flaky: 0, duration: 0 };
  }

  _bucket(projectName) {
    if (!this.byProject.has(projectName)) {
      this.byProject.set(projectName, {
        passed: 0,
        failed: 0,
        skipped: 0,
        flaky: 0,
        duration: 0,
        failures: [],
      });
    }
    return this.byProject.get(projectName);
  }

  onTestEnd(test, result) {
    const project = _getProjectName(test);
    const bucket = this._bucket(project);
    bucket.duration += result.duration;

    if (result.status === 'passed') {
      bucket.passed++;
      this.total.passed++;
    } else if (result.status === 'failed') {
      bucket.failed++;
      this.total.failed++;
      bucket.failures.push(`  ✗ ${test.title} (${_formatMs(result.duration)})`);
    } else if (result.status === 'skipped') {
      bucket.skipped++;
      this.total.skipped++;
    } else if (result.status === 'timedOut') {
      bucket.failed++;
      this.total.failed++;
      bucket.failures.push(`  ✗ ${test.title} (timed out)`);
    }

    if (result.retry > 0 && result.status === 'passed') {
      bucket.flaky++;
      this.total.flaky++;
    }

    this.total.duration += result.duration;
  }

  onEnd() {
    const wallClock = Date.now() - this.startTime;
    const totalTests =
      this.total.passed + this.total.failed + this.total.skipped;
    const line = '─'.repeat(62);

    console.log('\n' + line);
    console.log('  TEST RUN SUMMARY');
    console.log(line);
    console.log(
      `  Total: ${totalTests}  |  Passed: ${_green(String(this.total.passed))}  |  Failed: ${_red(String(this.total.failed))}  |  Skipped: ${this.total.skipped}`
    );
    if (this.total.flaky > 0) {
      console.log(`  Flaky (passed on retry): ${this.total.flaky}`);
    }
    console.log(
      `  Duration: ${_formatMs(this.total.duration)} (wall clock: ${_formatMs(wallClock)})`
    );
    console.log(line);

    for (const [project, stats] of this.byProject) {
      const projectTotal = stats.passed + stats.failed + stats.skipped;
      console.log(`\n  ${_bold(project)} (${projectTotal} tests)`);
      console.log(
        `    Passed: ${stats.passed}  Failed: ${stats.failed}  Skipped: ${stats.skipped}  |  ${_formatMs(stats.duration)}`
      );
      if (stats.failures.length > 0) {
        console.log('    Failures:');
        stats.failures.forEach((f) => console.log(`    ${f}`));
      }
    }

    console.log('\n' + line);
    console.log('  REPORTS');
    console.log(line);
    console.log('  Playwright HTML : npm run report');
    console.log('  Allure          : npm run report:allure  (do not open index.html directly)');
    console.log('  Traces/Videos   : test-results/  (on failure)');
    console.log(line + '\n');
  }
}

function _getProjectName(test) {
  let suite = test.parent;
  while (suite) {
    const project = suite.project?.();
    if (project) return project.name;
    suite = suite.parent;
  }
  return 'unknown';
}

function _formatMs(ms) {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const sec = ms / 1000;
  if (sec < 60) return `${sec.toFixed(1)}s`;
  const min = Math.floor(sec / 60);
  return `${min}m ${Math.round(sec % 60)}s`;
}

function _green(text) {
  return process.env.CI ? text : `\x1b[32m${text}\x1b[0m`;
}

function _red(text) {
  return process.env.CI ? text : `\x1b[31m${text}\x1b[0m`;
}

function _bold(text) {
  return process.env.CI ? text : `\x1b[1m${text}\x1b[0m`;
}

export default SummaryReporter;
