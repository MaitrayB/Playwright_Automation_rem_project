import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 40 * 2000,
  use: {
    headless: process.env.CI ? true : false,
    browserName: 'chromium',
    launchOptions: {
      args: ['--start-maximized'],
      slowMo: process.env.CI ? 0 : 1000
    },
    viewport: null, // ensure maximized window takes effect
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure'
  },
  outputDir: 'test-results/',
  reporter: [
    ['html', { outputFolder: 'reports/html' }],
    ['allure-playwright']
  ]
});