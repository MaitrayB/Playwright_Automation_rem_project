import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 40 * 2000,
  use: {
    headless: false,
    browserName: 'chromium',
    launchOptions: {
      args: ['--start-maximized'],
      slowMo: 1000, // 1s delay between steps
    },
    viewport: null, // ensure maximized window takes effect
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  reporter: [
    ['list'],
    ['allure-playwright']
  ],
  outputDir: 'test-results/',
  reporter: [
    ['html', { outputFolder: 'reports/html' }],
    ['allure-playwright', { outputFolder: 'reports/allure-results' }]
  ]
});