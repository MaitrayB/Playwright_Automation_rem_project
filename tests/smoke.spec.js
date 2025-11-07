import { test } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { OrderPage } from '../pages/OrderPage.js';
import { DashboardPage } from '../pages/DashboardPage.js';
import { TestData } from '../Data/TestData.js';
import { readCsv } from '../utils/readCsv.js';
import { SignUpPage } from '../pages/SignUpPage.js';
import { OrderDeliveryDetailsPage } from '../pages/OrderDeliveryDetailsPage.js';

const csvData = readCsv('./Data/testData.csv');

test.describe('Place an order', () => {
  test.setTimeout(180000); // 3 minutes
  let orderPage;
  let dashboardPage;
  let orderDeliverDetailsPage

  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    const signUpPage = new SignUpPage(page);
    //const loginPage = new LoginPage(page);

    // Initialize pages after login
    orderPage = new OrderPage(page);
    dashboardPage = new DashboardPage(page);
    orderDeliverDetailsPage = new OrderDeliveryDetailsPage(page);

    // Save context for reuse
    test.info().annotations.push({ type: 'context', description: 'Logged in context created' });
    test.context = context;
    test.page = page;
  });

  // --- Step 2: Determine random row index (consistent across test discovery + execution) ---
  const randomIndex = process.env.RANDOM_INDEX
    ? Number(process.env.RANDOM_INDEX)
    : Math.floor(Math.random() * csvData.length);

  const randomRow = csvData[randomIndex];
  console.log(`🎯 Selected row index: ${randomIndex}`);
  console.log(`📦 Postcode: ${randomRow.Postcodes}, WasteType: ${randomRow.WasteType}`);

  //for (const row of [randomRow]) { // Picks one random index directly
  // --- Logged In User ---
  test('Logged-In User Placing an order', async () => {
    const page = test.page; // reuse same page
    const orderPage = new OrderPage(page);
    const dashboardPage = new DashboardPage(page);
    const loginPage = new LoginPage(page);
    const signUpPage = new SignUpPage(page);
    const orderDeliverDetailsPage = new OrderDeliveryDetailsPage(page);

    // Sign up before all tests
    await test.step('Sign up before all tests)', async () => {
      await loginPage.goto();
      await signUpPage.navigateToSignUpPage();
      await signUpPage.fillSignUpForm();
      await signUpPage.verifyRegistrationSuccess();
    });

    // ✅ Login once before all tests
    await test.step('Login to application (before all tests)', async () => {
      await loginPage.login(signUpPage.emailAddress, signUpPage.randomPassword);
      console.log(`🧾 Running Logged-In flow for: ${randomRow.Postcodes}`);
    });

    await test.step('Enter postcode', async () => {
      // await loginPage.goto();
      await orderPage.enterPostcode(randomRow.Postcodes);
    });

    await test.step('Select waste type', async () => {
      await orderPage.selectWaste(randomRow.WasteType);
    });

    await test.step('Continue waste type', async () => {
      await orderPage.continueWaste(randomRow.HeavyWaste, randomRow.PlasterBoard);
    });

    await test.step('Select skip & property', async () => {
      await orderPage.selectSkip(randomRow.SkipSize, randomRow.PlasterBoard, randomRow.ToneBag, randomRow.SelfDispose);
    });

    await test.step('Permit check', async () => {
      await orderPage.permitCheck(randomRow.Placement);
    });

    await test.step('Choose date', async () => {
      await orderPage.chooseDate(randomRow.BookingDay);
    });

    await test.step('Complete payment', async () => {
      await orderPage.completePayment();
    });

    await test.step('Verify dashboard', async () => {
      await dashboardPage.gotoSuccessPage();
      await dashboardPage.verifyDashboard();
    });

    await test.step('Verify Order Delivery Details', async () => {
      await dashboardPage.navigateToViewOrderDetails();
      await orderDeliverDetailsPage.verifyOrderDeliveryDetails();
    });
  });

  // --- Guest User ---
  test('Guest User Placing an order', async () => {
    const page = test.page; // reuse same page
    const orderPage = new OrderPage(page);
    const dashboardPage = new DashboardPage(page);
    const loginPage = new LoginPage(page);
    const signUpPage = new SignUpPage(page);
    const orderDeliverDetailsPage = new OrderDeliveryDetailsPage(page);
    console.log(`🧾 Running Guest flow for: ${randomRow.Postcodes}`);
    await loginPage.goto();

    await test.step('Enter postcode', async () => {
      await orderPage.enterPostcode(randomRow.Postcodes);
    });

    await test.step('Select waste type', async () => {
      await orderPage.selectWaste(randomRow.WasteType);
    });

    await test.step('Continue waste type', async () => {
      await orderPage.continueWaste(randomRow.HeavyWaste, randomRow.PlasterBoard);
    });

    await test.step('Select skip & property', async () => {
      await orderPage.selectSkip(randomRow.SkipSize, randomRow.PlasterBoard, randomRow.ToneBag, randomRow.SelfDispose);
    });

    await test.step('Permit check', async () => {
      await orderPage.permitCheck(randomRow.Placement);
    });

    await test.step('Choose date', async () => {
      await orderPage.chooseDate(randomRow.BookingDay);
    });

    await test.step('Complete payment', async () => {
      await orderPage.completePayment();
    });

    await test.step('Guest registration', async () => {
      await signUpPage.fillSignUpForm();
    });

    await test.step('Navigate to dashboard', async () => {
      await dashboardPage.gotoSuccessPage();
    });

    await test.step(`Guest user's password creation`, async () => {
      await signUpPage.guest_CreateNewPassword();

    });

    await test.step('Verify Order Delivery Details', async () => {
      await dashboardPage.navigateToViewOrderDetails();
      await orderDeliverDetailsPage.verifyOrderDeliveryDetails();
    });
  });

  //}
});

test.afterEach(async () => {
  await test.page?.context()?.close();
});
