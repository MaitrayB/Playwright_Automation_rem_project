import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { OrderPage } from '../pages/OrderPage.js';
import { DashboardPage } from '../pages/DashboardPage.js';
import { SignUpPage } from '../pages/SignUpPage.js';
import { OrderDeliveryDetailsPage } from '../pages/OrderDeliveryDetailsPage.js';
import { getRandomRow } from '../utils/getRandomRow.js';
import { TestData } from '../Data/TestData.js';
import { genericFunctions } from '../utils/genericFunctions.js';
import { ProfileSettingsPage } from '../pages/ProfileSettingsPage.js';
import { log } from 'console';

const csvPath = './Data/testData.csv';

test.describe('Confirm Delivery', () => {
  test.setTimeout(180000); // 3 minutes
  //let orderPage, dashboardPage, orderDeliverDetailsPage;

  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // orderPage = new OrderPage(page);
    // dashboardPage = new DashboardPage(page);
    // orderDeliverDetailsPage = new OrderDeliveryDetailsPage(page);

    test.context = context;
    test.page = page;
  });

  test(`Confirm Delivery for today's date`, async () => {
    const page = test.page;
    const orderPage = new OrderPage(page);
    const dashboardPage = new DashboardPage(page);
    const loginPage = new LoginPage(page);
    const orderDeliveryDetailsPage = new OrderDeliveryDetailsPage(page);


    console.log(`🧾 Running Guest flow for:  ${TestData.postcodes[1]}, ${TestData.WasteType[1]}, Heavywaste -${TestData.HeavyWaste[0]}, Plasterboard -${TestData.PlasterBoard[0]}, Skipsize-${TestData.SkipSize[1]}, ${TestData.Placement[0]}`);

    await loginPage.goto();
    await loginPage.login(TestData.credentials.username, TestData.credentials.password);

    await test.step('Enter postcode', async () => {
      await orderPage.enterPostcode(TestData.postcodes[1]);
    });

    await test.step('Select waste type', async () => {
      await orderPage.selectWaste(TestData.WasteType[1]);
    });

    await test.step('Continue waste type', async () => {
      await orderPage.continueWaste(TestData.HeavyWaste[0], TestData.PlasterBoard[0]);
    });

    await test.step('Select skip & property', async () => {
      await orderPage.selectSkip(TestData.SkipSize[1], TestData.PlasterBoard[0], "No", "No");
    });

    await test.step('Permit check', async () => {
      await orderPage.permitCheck(TestData.Placement[0]);
    });

    await test.step('Choose date', async () => {
      const dayNumber = new Date().getDate();
      console.log(`Today's day number is: ${dayNumber}`);
      await orderPage.chooseStaticDate(dayNumber);
    });

    await test.step('Complete payment', async () => {
      await orderPage.completePayment();
    });

    await test.step('Navigate and verify dashboard', async () => {
      await dashboardPage.gotoSuccessPage();
    });

    await test.step('Verify Order Delivery Details', async () => {
      await dashboardPage.navigateToViewOrderDetails();
    });

    await test.step(`Confirm and verify today's delivery`, async () => {
      await orderDeliveryDetailsPage.confirmTodaysDelivery();
    });

  });
});

test.describe('Request collection outside 3 days free limit and pay for difference', () => {
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

  test('Request collection outside 3 days free limit and pay for difference', async () => {
    const page = test.page;
    const orderPage = new OrderPage(page);
    const dashboardPage = new DashboardPage(page);
    const loginPage = new LoginPage(page);
    const orderDeliverDetailsPage = new OrderDeliveryDetailsPage(page);


    console.log(`🧾 Running Guest flow for:  ${TestData.postcodes[1]}, ${TestData.WasteType[1]}, Heavywaste -${TestData.HeavyWaste[0]}, Plasterboard -${TestData.PlasterBoard[0]}, Skipsize-${TestData.SkipSize[1]}, ${TestData.Placement[0]}`);

    await loginPage.goto();
    await loginPage.login(TestData.credentials.username, TestData.credentials.password);

    await test.step('Enter postcode', async () => {
      await orderPage.enterPostcode(TestData.postcodes[1]);
    });

    await test.step('Select waste type', async () => {
      await orderPage.selectWaste(TestData.WasteType[1]);
    });

    await test.step('Continue waste type', async () => {
      await orderPage.continueWaste(TestData.HeavyWaste[0], TestData.PlasterBoard[0]);
    });

    await test.step('Select skip & property', async () => {
      await orderPage.selectSkip(TestData.SkipSize[1], TestData.PlasterBoard[0], "No", "No");
    });

    await test.step('Permit check', async () => {
      await orderPage.permitCheck(TestData.Placement[0]);
    });

    await test.step('Choose date', async () => {
      const dayNumber = new Date().getDate();
      console.log(`Today's day number is: ${dayNumber}`);
      await orderPage.chooseStaticDate(dayNumber);
    });

    await test.step('Complete payment', async () => {
      await orderPage.completePayment();
    });

    await test.step('Navigate and verify dashboard', async () => {
      await dashboardPage.gotoSuccessPage();
    });

    await test.step('Verify Order Delivery Details', async () => {
      await dashboardPage.navigateToViewOrderDetails();
    });

    await test.step('Request collection', async () => {
      await orderDeliverDetailsPage.requestCollection({ freelimit: "no" });
    });

  });
});

test.describe('Request collection within 3 days free limit', () => {
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

  test('Request collection within 3 days free limit', async () => {
    const page = test.page;
    const orderPage = new OrderPage(page);
    const dashboardPage = new DashboardPage(page);
    const loginPage = new LoginPage(page);
    const orderDeliverDetailsPage = new OrderDeliveryDetailsPage(page);


    console.log(`🧾 Running Guest flow for:  ${TestData.postcodes[1]}, ${TestData.WasteType[1]}, Heavywaste -${TestData.HeavyWaste[0]}, Plasterboard -${TestData.PlasterBoard[0]}, Skipsize-${TestData.SkipSize[1]}, ${TestData.Placement[0]}`);

    await loginPage.goto();
    await loginPage.login(TestData.credentials.username, TestData.credentials.password);

    await test.step('Enter postcode', async () => {
      await orderPage.enterPostcode(TestData.postcodes[1]);
    });

    await test.step('Select waste type', async () => {
      await orderPage.selectWaste(TestData.WasteType[1]);
    });

    await test.step('Continue waste type', async () => {
      await orderPage.continueWaste(TestData.HeavyWaste[0], TestData.PlasterBoard[0]);
    });

    await test.step('Select skip & property', async () => {
      await orderPage.selectSkip(TestData.SkipSize[1], TestData.PlasterBoard[0], "No", "No");
    });

    await test.step('Permit check', async () => {
      await orderPage.permitCheck(TestData.Placement[0]);
    });

    await test.step('Choose date', async () => {
      const dayNumber = new Date().getDate();
      console.log(`Today's day number is: ${dayNumber}`);
      await orderPage.chooseStaticDate(dayNumber);
    });

    await test.step('Complete payment', async () => {
      await orderPage.completePayment();
    });

    await test.step('Navigate and verify dashboard', async () => {
      await dashboardPage.gotoSuccessPage();
    });

    await test.step('Verify Order Delivery Details', async () => {
      await dashboardPage.navigateToViewOrderDetails();
    });

    await test.step('Request collection', async () => {
      await orderDeliverDetailsPage.requestCollection({ freelimit: "yes" });
    });

  });
});

test.describe('Upgrade skip', async () => {
  test.setTimeout(180000); // 3 minutes

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    test.context = context;
    test.page = page;
  });

  test('Upgrading skip for logged-in user', async () => {
    const page = test.page;
    const loginpage = new LoginPage(page);
    const profilesettingpage = new ProfileSettingsPage(page);
    const dashboardPage = new DashboardPage(page);
    const orderDeliveryDetailsPage = new OrderDeliveryDetailsPage(page);

    await test.step('Go to profile settings', async () => {
      await loginpage.goto();
      await loginpage.login(TestData.credentials.username, TestData.credentials.password);
      await profilesettingpage.goToProfileSettingsPage();
    });

    await test.step('Navigate and Upgrade skip', async () => {
      await dashboardPage.navigateToViewOrderDetails();

      const result = await orderDeliveryDetailsPage.upgradeSkip();
      if (!result.success && result.reason === 'Update Skip button is disabled') {
        test.skip('Update Skip button is disabled - skipping the test')
      }
    });
  })

});

test.describe('Downgrade skip', async () => {
  test.setTimeout(180000); // 3 minutes

  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    test.context = context;
    test.page = page;
  });

  test('Downgrading skip for logged-in user', async () => {
    const page = test.page;
    const loginpage = new LoginPage(page);
    const profilesettingpage = new ProfileSettingsPage(page);
    const dashboardPage = new DashboardPage(page);
    const orderDeliveryDetailsPage = new OrderDeliveryDetailsPage(page);
    await test.step('Go to profile settings', async () => {
      await loginpage.goto();
      await loginpage.login(TestData.credentials.username, TestData.credentials.password);
      await profilesettingpage.goToProfileSettingsPage();
    });

    await test.step('Navigate and Downgrade skip', async () => {
      await dashboardPage.navigateToViewOrderDetails();

      const result = await orderDeliveryDetailsPage.downgradeSkip();
      if (!result.success && result.reason === 'Update Skip button is disabled') {
        test.skip('Update Skip button is disabled - skipping the test')
      }
    });
  })
});

test.describe('Edit User Profile', async () => {
  test.setTimeout(180000); // 3 minutes

  let profilesettingpage, loginpage;

  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    test.context = context;
    test.page = page;
    loginpage = new LoginPage(page);
    profilesettingpage = new ProfileSettingsPage(page);

  });

  test('Edit profile settings', async () => {

    await test.step('Go to profile settings', async () => {
      await loginpage.goto();
      await loginpage.login(TestData.credentials.username, TestData.credentials.password);
      await profilesettingpage.goToProfileSettingsPage();
    });

    await test.step('Edit profile details', async () => {
      await profilesettingpage.editProfileSettings("Maitray", "Bhatt", "1333444355");
    });

  })
});

test.describe('Place an order for Wrong Skip Guarantee', () => {
  test.setTimeout(180000); // 3 minutes
  let orderPage, dashboardPage, orderDeliverDetailsPage, skipType, genFunctions;

  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    orderPage = new OrderPage(page);
    dashboardPage = new DashboardPage(page);
    orderDeliverDetailsPage = new OrderDeliveryDetailsPage(page);
    genFunctions = new genericFunctions(page);

    test.context = context;
    test.page = page;
  });

  test('Place an order for Wrong Skip Guarantee and login with existing user', async () => {
    const page = test.page;
    const orderPage = new OrderPage(page);
    const dashboardPage = new DashboardPage(page);
    const loginPage = new LoginPage(page);
    const signUpPage = new SignUpPage(page);
    const orderDeliverDetailsPage = new OrderDeliveryDetailsPage(page);
    const genFunctions = new genericFunctions(page);

    // ✅ Get random CSV row at runtime
    const randomRow = getRandomRow(csvPath);

    console.log(`🧾 Running Guest flow for:  ${TestData.postcodes[1]}, ${TestData.WasteType[1]}, Heavywaste -${TestData.HeavyWaste[0]}, Plasterboard -${TestData.PlasterBoard[0]}, Skipsize-${TestData.SkipSize[1]}, ${TestData.Placement[1]}`);

    await loginPage.goto();

    await test.step('Enter postcode', async () => {
      await orderPage.enterPostcode(TestData.postcodes[1]);
    });

    await test.step('Select waste type', async () => {
      await orderPage.selectWaste(TestData.WasteType[1]);
    });

    await test.step('Continue waste type', async () => {
      await orderPage.continueWaste(TestData.HeavyWaste[0], TestData.PlasterBoard[0]);
    });

    await test.step('Select skip & property', async () => {
      await orderPage.wrongSkipSelection();
      await orderPage.selectSkip(TestData.SkipSize[1], TestData.PlasterBoard[0], "No", "No");
    });

    await test.step('Permit check', async () => {
      await orderPage.permitCheck(TestData.Placement[1]);
    });

    await test.step('Choose date', async () => {
      await orderPage.chooseDate(TestData.BookingDay[0]);
    });

    await test.step('Complete payment', async () => {
      await expect(orderPage.paymentPageWrongSkipGuaranteeSection).toHaveText("Wrong Skip Guarantee");
      await orderPage.completePayment();
    });

    await test.step('Guest registration', async () => {
      await signUpPage.fillSignUpFormExistingUser();
      await orderPage.completePayment();
    });

    await test.step('Navigate and verify dashboard', async () => {
      await dashboardPage.gotoSuccessPage();
      await dashboardPage.verifyWrongSkipGuarantee();
    });

    await test.step('Verify Order Delivery Details', async () => {
      await dashboardPage.navigateToViewOrderDetails();
      await orderDeliverDetailsPage.verifyOrderDeliveryDetails();
      await expect(orderDeliverDetailsPage.verifyWrongSkipGuaranteeLabel).toBeVisible();
    });

    await test.step('Add 2 Tonne Bags from order details', async () => {
      await orderDeliverDetailsPage.addTonneBag();
    });

    await test.step('Order Placement Email Verification', async () => {
      const emailId = TestData.credentials.username;
      await genFunctions.goToYopmail();
      await genFunctions.accessInbox(emailId);
      await genFunctions.checkOrderEmailReceived(orderPage);
    });

  });
});

test.describe('Place order and add 2 Tonne bags', () => {
  test.setTimeout(180000); // 3 minutes
  let orderPage, dashboardPage, orderDeliverDetailsPage, genFunctions, skipType;

  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    orderPage = new OrderPage(page);
    dashboardPage = new DashboardPage(page);
    orderDeliverDetailsPage = new OrderDeliveryDetailsPage(page);
    genFunctions = new genericFunctions(page);

    test.context = context;
    test.page = page;
  });

  test('Place order and add Tonne bags', async () => {
    const page = test.page;
    const orderPage = new OrderPage(page);
    const dashboardPage = new DashboardPage(page);
    const loginPage = new LoginPage(page);
    const signUpPage = new SignUpPage(page);
    const orderDeliverDetailsPage = new OrderDeliveryDetailsPage(page);
    const genFunctions = new genericFunctions(page);

    // ✅ Get random CSV row at runtime
    const randomRow = getRandomRow(csvPath);

    console.log(`🧾 Running Guest flow for:  ${TestData.postcodes[1]}, ${TestData.WasteType[1]}, Heavywaste -${TestData.HeavyWaste[0]}, Plasterboard -${TestData.PlasterBoard[0]}, Skipsize-${TestData.SkipSize[1]}, ${TestData.Placement[1]}`);

    await loginPage.goto();

    await test.step('Enter postcode', async () => {
      await orderPage.enterPostcode(TestData.postcodes[1]);
    });

    await test.step('Select waste type', async () => {
      await orderPage.selectWaste(TestData.WasteType[1]);
    });

    await test.step('Continue waste type', async () => {
      await orderPage.continueWaste(TestData.HeavyWaste[0], TestData.PlasterBoard[0]);
    });

    await test.step('Select skip & property', async () => {
      await orderPage.selectSkip(TestData.SkipSize[1], TestData.PlasterBoard[0], "No", "No");
    });

    await test.step('Permit check', async () => {
      await orderPage.permitCheck(TestData.Placement[1]);
    });

    await test.step('Choose date', async () => {
      await orderPage.chooseDate(TestData.BookingDay[0]);
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

    await test.step('Add 2 Tonne Bags from order details', async () => {
      await orderDeliverDetailsPage.addTonneBag();
    });

    await test.step('Order Placement Email Verification', async () => {
      const emailId = TestData.credentials.username;
      await genFunctions.goToYopmail();
      await genFunctions.accessInbox(emailId);
      await genFunctions.checkOrderEmailReceived(orderPage);
    });

  });
});

test.describe('Change billing address and place order', () => {
  test.setTimeout(180000); // 3 minutes
  let orderPage, dashboardPage, orderDeliverDetailsPage, genFunctions;

  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    orderPage = new OrderPage(page);
    dashboardPage = new DashboardPage(page);
    orderDeliverDetailsPage = new OrderDeliveryDetailsPage(page);
    genFunctions = new genericFunctions(page);

    test.context = context;
    test.page = page;
  });

  test('Change billing address and place order', async () => {
    const page = test.page;
    const orderPage = new OrderPage(page);
    const dashboardPage = new DashboardPage(page);
    const loginPage = new LoginPage(page);
    const signUpPage = new SignUpPage(page);
    const orderDeliverDetailsPage = new OrderDeliveryDetailsPage(page);
    const genFunctions = new genericFunctions(page);

    // ✅ Get random CSV row at runtime
    const randomRow = getRandomRow(csvPath);

    console.log(`🧾 Running Guest flow for:  ${TestData.postcodes[0]}, ${TestData.WasteType[0]}, Heavywaste -${TestData.HeavyWaste[0]}, Plasterboard -${TestData.PlasterBoard[0]}, Skipsize-${TestData.SkipSize[0]}, ${TestData.Placement[0]}`);

    await loginPage.goto();

    await test.step('Enter postcode', async () => {
      await orderPage.enterPostcode(TestData.postcodes[0]);
    });

    await test.step('Select waste type', async () => {
      await orderPage.selectWaste(TestData.WasteType[0]);
    });

    await test.step('Continue waste type', async () => {
      await orderPage.continueWaste(TestData.HeavyWaste[0], TestData.PlasterBoard[0]);
    });

    await test.step('Select skip & property', async () => {
      await orderPage.selectSkip(TestData.SkipSize[0], TestData.PlasterBoard[0], "No", "No");
    });

    await test.step('Permit check', async () => {
      await orderPage.permitCheck(TestData.Placement[0]);
    });

    await test.step('Choose date', async () => {
      await orderPage.chooseDate(TestData.BookingDay[0]);
    });

    await test.step('Complete payment', async () => {
      await orderPage.completePayment();
    });

    await test.step('Guest registration', async () => {
      await signUpPage.fillSignUpFormExistingUser();

    });

    await test.step('Change billing address', async () => {
      await orderPage.changeBillingAddress();
      await orderPage.completePayment();
    });

    await test.step('Navigate to dashboard', async () => {
      await dashboardPage.gotoSuccessPage();
    });

    await test.step('Verify Order Delivery Details', async () => {
      await dashboardPage.navigateToViewOrderDetails();
      await orderDeliverDetailsPage.verifyOrderDeliveryDetails();
    });


    await test.step('Order Placement Email Verification', async () => {
      const emailId = TestData.credentials.username;
      await genFunctions.goToYopmail();
      await genFunctions.accessInbox(emailId);
      await genFunctions.checkOrderEmailReceived(orderPage);
    });

  });
});

test.describe('Place order and add Road permit', () => {
  test.setTimeout(180000); // 3 minutes
  let orderPage, dashboardPage, orderDeliverDetailsPage, genFunctions;

  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    orderPage = new OrderPage(page);
    dashboardPage = new DashboardPage(page);
    orderDeliverDetailsPage = new OrderDeliveryDetailsPage(page);
    genFunctions = new genericFunctions(page);

    test.context = context;
    test.page = page;
  });

  test('Place order and add road permit', async () => {
    const page = test.page;
    const orderPage = new OrderPage(page);
    const dashboardPage = new DashboardPage(page);
    const loginPage = new LoginPage(page);
    const signUpPage = new SignUpPage(page);
    const orderDeliverDetailsPage = new OrderDeliveryDetailsPage(page);
    const genFunctions = new genericFunctions(page);

    // ✅ Get random CSV row at runtime
    const randomRow = getRandomRow(csvPath);

    console.log(`🧾 Running Guest flow for:  ${TestData.postcodes[0]}, ${TestData.WasteType[0]}, Heavywaste -${TestData.HeavyWaste[0]}, Plasterboard -${TestData.PlasterBoard[0]}, Skipsize-${TestData.SkipSize[0]}, ${TestData.Placement[0]}`);

    await loginPage.goto();

    await test.step('Enter postcode', async () => {
      await orderPage.enterPostcode(TestData.postcodes[0]);
    });

    await test.step('Select waste type', async () => {
      await orderPage.selectWaste(TestData.WasteType[0]);
    });

    await test.step('Continue waste type', async () => {
      await orderPage.continueWaste(TestData.HeavyWaste[0], TestData.PlasterBoard[0]);
    });

    await test.step('Select skip & property', async () => {
      await orderPage.selectSkip(TestData.SkipSize[0], TestData.PlasterBoard[0], "No", "No");
    });

    await test.step('Permit check', async () => {
      await orderPage.permitCheck(TestData.Placement[0]);
    });

    await test.step('Choose date', async () => {
      await orderPage.chooseDate(TestData.BookingDay[0]);
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

    await test.step('Add road permit from order details', async () => {
      await orderDeliverDetailsPage.addRoadPermit();
    });

    await test.step('Order Placement Email Verification', async () => {
      const emailId = TestData.credentials.username;
      await genFunctions.goToYopmail();
      await genFunctions.accessInbox(emailId);
      await genFunctions.checkOrderEmailReceived(orderPage);
    });

  });
});

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
    const orderPlacementEmailVer = new OrderPlacementEmailVerification(page);

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

    await test.step('Order Placement Email Verification', async () => {
      const emailId = await signUpPage.fillSignUpFormExistingUser();
      console.log(`print email id from SignUp Class: ${emailId}`);
      await orderPlacementEmailVer.goToYopmail();
      await orderPlacementEmailVer.accessInbox(emailId);
      await orderPlacementEmailVer.checkOrderEmailReceived(orderPage);
    });
  });
});

test.describe('Place an order as Guest User', () => {
  test.setTimeout(180000); // 3 minutes
  let orderPage, dashboardPage, orderDeliverDetailsPage, genFunctions;

  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    orderPage = new OrderPage(page);
    dashboardPage = new DashboardPage(page);
    orderDeliverDetailsPage = new OrderDeliveryDetailsPage(page);
    genFunctions = new genericFunctions(page);

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
    const genFunctions = new genericFunctions(page);

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
