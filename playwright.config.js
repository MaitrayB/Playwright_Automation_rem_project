import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.PLAYWRIGHT_BROWSERS_PATH = process.env.PLAYWRIGHT_BROWSERS_PATH || path.join(__dirname, '.browsers');

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  timeout: 40 * 2000,
  use: {
    headless: isCI,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  outputDir: 'test-results/',
  reporter: [
    ['list'],
    ['./reporters/summaryReporter.js'],
    ['html', {
      outputFolder: 'reports/html',
      open: isCI ? 'never' : 'on-failure',
    }],
    ['junit', { outputFile: 'reports/junit/results.xml' }],
    ['allure-playwright', {
      resultsDir: 'allure-results',
      detail: true,
      suiteTitle: true,
      environmentInfo: {
        node_version: process.version,
        os: process.platform,
      },
    }],
  ],
  projects: [
    {
      name: 'Desktop Chrome',
      use: {
        browserName: 'chromium',
        launchOptions: {
          args: ['--start-maximized'],
          slowMo: isCI ? 0 : 1000,
        },
        viewport: null,
      },
    },
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 7'],
        launchOptions: {
          slowMo: isCI ? 0 : 1000,
        },
      },
    },
    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 14'],
        launchOptions: {
          slowMo: isCI ? 0 : 1000,
        },
      },
    },
  ],
});
