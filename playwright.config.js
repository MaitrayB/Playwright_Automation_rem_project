import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.PLAYWRIGHT_BROWSERS_PATH = process.env.PLAYWRIGHT_BROWSERS_PATH || path.join(__dirname, '.browsers');

export default defineConfig({
  testDir: './tests',
  timeout: 40 * 2000,
  use: {
    headless: process.env.CI ? true : false,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure'
  },
  outputDir: 'test-results/',
  reporter: [
    ['html', { outputFolder: 'reports/html' }],
    ['allure-playwright']
  ],
  projects: [
    {
      name: 'Desktop Chrome',
      use: {
        browserName: 'chromium',
        launchOptions: {
          args: ['--start-maximized'],
          slowMo: process.env.CI ? 0 : 1000
        },
        viewport: null,
      },
    },
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 7'],
        launchOptions: {
          slowMo: process.env.CI ? 0 : 1000
        },
      },
    },
    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 14'],
        launchOptions: {
          slowMo: process.env.CI ? 0 : 1000
        },
      },
    },
  ],
});