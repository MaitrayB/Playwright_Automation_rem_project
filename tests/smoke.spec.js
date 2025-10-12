import { test } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { OrderPage } from '../pages/OrderPage.js';
import { DashboardPage } from '../pages/DashboardPage.js';

test('Place Order End-to-End', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const orderPage = new OrderPage(page);
  const dashboardPage = new DashboardPage(page);

  await test.step('Login to application', async () => {
    await loginPage.goto();
    await loginPage.login('mattwo@yopmail.com', 'P@ssw0rd');
  });

  await test.step('Enter postcode', async () => {
    await orderPage.enterPostcode('LE10');
  });

  await test.step('Select waste type', async () => {
    await orderPage.selectWaste();
  });

  await test.step('Select skip & property', async () => {
    await orderPage.selectSkip();
  });

  await test.step('Choose date', async () => {
    await orderPage.chooseDate();
  });

  await test.step('Complete payment', async () => {
    await orderPage.completePayment();
  });

  await test.step('Verify dashboard', async () => {
    await dashboardPage.gotoSuccessPage();
    await dashboardPage.verifyDashboard();
  });
});
