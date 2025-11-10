import { test } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { OrderPage } from '../pages/OrderPage.js';
import { DashboardPage } from '../pages/DashboardPage.js';
import { SignUpPage } from '../pages/SignUpPage.js';
import { OrderDeliveryDetailsPage } from '../pages/OrderDeliveryDetailsPage.js';
import { getRandomRow } from '../utils/getRandomRow.js';

const csvPath = './Data/testData.csv';

test.describe('Start order as guest and logs in with existing account', () => {
  test.setTimeout(180000); // 3 minutes
  let orderPage, dashboardPage, orderDeliverDetailsPage;

  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    orderPage = new OrderPage(page);
    dashboardPage = new DashboardPage(page);
    orderDeliverDetailsPage = new OrderDeliveryDetailsPage(page);

    test.context = context;
    test.page = page;
  });

  test('Start order as guest and logs in with existing account', async () => {
    const page = test.page;
    const orderPage = new OrderPage(page);
    const dashboardPage = new DashboardPage(page);
    const loginPage = new LoginPage(page);
    const signUpPage = new SignUpPage(page);
    const orderDeliverDetailsPage = new OrderDeliveryDetailsPage(page);

    // ✅ Get random CSV row at runtime
    const randomRow = getRandomRow(csvPath);
    


    console.log(`🧾 Running Guest flow for:  ${randomRow.Postcodes}, ${randomRow.WasteType}, Heavywaste -${randomRow.HeavyWaste}, Plasterboard -${randomRow.PlasterBoard}, Skipsize-${randomRow.SkipSize}, ${randomRow.Placement}`);

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
      await signUpPage.fillSignUpFormExistingUser();
      await orderPage.completePayment();
    });

    await test.step('Navigate to dashboard', async () => {
      await dashboardPage.gotoSuccessPage();
    });

    await test.step('Verify Order Delivery Details', async () => {
      await dashboardPage.navigateToViewOrderDetails();
      await orderDeliverDetailsPage.verifyOrderDeliveryDetails();
    });
  });
});

test.describe('Place an order as Guest User', () => {
  test.setTimeout(180000); // 3 minutes
  let orderPage, dashboardPage, orderDeliverDetailsPage;

  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    orderPage = new OrderPage(page);
    dashboardPage = new DashboardPage(page);
    orderDeliverDetailsPage = new OrderDeliveryDetailsPage(page);

    test.context = context;
    test.page = page;
  });

  test('Guest User Placing an order', async () => {
    const page = test.page;
    const orderPage = new OrderPage(page);
    const dashboardPage = new DashboardPage(page);
    const loginPage = new LoginPage(page);
    const signUpPage = new SignUpPage(page);
    const orderDeliverDetailsPage = new OrderDeliveryDetailsPage(page);

    // ✅ Get random CSV row at runtime
    const randomRow = getRandomRow(csvPath);
    


    console.log(`🧾 Running Guest flow for:  ${randomRow.Postcodes}, ${randomRow.WasteType}, Heavywaste -${randomRow.HeavyWaste}, Plasterboard -${randomRow.PlasterBoard}, Skipsize-${randomRow.SkipSize}, ${randomRow.Placement}`);

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

    await test.step('Guest user password creation', async () => {
      await signUpPage.guest_CreateNewPassword();
    });

    await test.step('Verify Order Delivery Details', async () => {
      await dashboardPage.navigateToViewOrderDetails();
      await orderDeliverDetailsPage.verifyOrderDeliveryDetails();
    });
  });
});


test.describe('Place an order as Logged-in User', () => {
  test.setTimeout(180000); // 3 minutes
  let orderPage, dashboardPage, orderDeliverDetailsPage;

  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    orderPage = new OrderPage(page);
    dashboardPage = new DashboardPage(page);
    orderDeliverDetailsPage = new OrderDeliveryDetailsPage(page);

    test.context = context;
    test.page = page;
  });

  test('Logged-in User Placing an order', async () => {
    const page = test.page;
    const orderPage = new OrderPage(page);
    const dashboardPage = new DashboardPage(page);
    const loginPage = new LoginPage(page);
    const signUpPage = new SignUpPage(page);
    const orderDeliverDetailsPage = new OrderDeliveryDetailsPage(page);

    // ✅ Get random CSV row at runtime
    const randomRow = getRandomRow(csvPath);

    await test.step('Sign up new user', async () => {
      await loginPage.goto();
      await signUpPage.navigateToSignUpPage();
      await signUpPage.fillSignUpForm();
      await signUpPage.verifyRegistrationSuccess();
    });

    await test.step('Login to application', async () => {
      await loginPage.login(signUpPage.emailAddress, signUpPage.randomPassword);
      console.log(`🧾 Running Logged-in flow for: ${randomRow.Postcodes}, ${randomRow.WasteType}, Heavywaste -${randomRow.HeavyWaste}, Plasterboard -${randomRow.PlasterBoard}, Skipsize-${randomRow.SkipSize}, ${randomRow.Placement}`);
    });

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

    await test.step('Verify dashboard', async () => {
      await dashboardPage.gotoSuccessPage();
      await dashboardPage.verifyDashboard();
    });

    await test.step('Verify Order Delivery Details', async () => {
      await dashboardPage.navigateToViewOrderDetails();
      await orderDeliverDetailsPage.verifyOrderDeliveryDetails();
    });
  });
});

test.afterEach(async () => {
  await test.page?.context()?.close();
});
