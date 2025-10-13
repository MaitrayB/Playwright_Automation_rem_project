import { test } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { OrderPage } from '../pages/OrderPage.js';
import { DashboardPage } from '../pages/DashboardPage.js';
import { TestData, PostCode } from '../Data/testData.js';


test('Place Order End-to-End', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const orderPage = new OrderPage(page);
  const dashboardPage = new DashboardPage(page);

  await test.step('Login to application', async () => {
    await loginPage.goto();
    await loginPage.login(TestData.credentials.username, TestData.credentials.password);
  });

  //enter postcode
  await test.step('Enter postcode', async () => {
    await orderPage.enterPostcode(TestData.postcodes[0]);
  });

  //select waste type options
  await test.step('Select waste type', async () => {
    await orderPage.selectWaste(TestData.WasteType[0]);
    await orderPage.selectWaste(TestData.WasteType[1]);
    await orderPage.selectWaste(TestData.WasteType[2]);
    await orderPage.selectWaste(TestData.WasteType[3]);
  });

  //select heavy waste & plasterboard options
  await test.step('Continue waste type', async () => {
    await orderPage.continueWaste(TestData.HeavyWaste[0], TestData.PlasterBoard[0]);
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
