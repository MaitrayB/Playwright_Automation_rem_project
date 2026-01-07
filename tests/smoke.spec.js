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

// 🌍 GLOBAL DECLARATION
/** @type {LoginPage} */ let loginPage;
/** @type {SignUpPage} */ let signUpPage;
/** @type {OrderPage} */ let orderPage;
/** @type {ProfileSettingsPage} */let profilesettingpage;
/** @type {DashboardPage} */ let dashboardPage;
/** @type {OrderDeliveryDetailsPage} */ let orderDeliveryDetailsPage;
/** @type {genericFunctions} */ let genFunctions;

let page, context, contact;

// BEFORE EACH TEST 
test.beforeEach(async ({ browser }, testInfo) => {
  context = await browser.newContext({
    httpCredentials: {
      username: TestData.authCredentials.authUserName,
      password: TestData.authCredentials.authPassword
    },
    ignoreHTTPSErrors: true
  });
  page = await context.newPage();

  // initialize global POM objects
  loginPage = new LoginPage(page);
  signUpPage = new SignUpPage(page);
  orderPage = new OrderPage(page);
  profilesettingpage = new ProfileSettingsPage(page);
  dashboardPage = new DashboardPage(page);
  orderDeliveryDetailsPage = new OrderDeliveryDetailsPage(page);
  genFunctions = new genericFunctions(page);

  // Store the page in testInfo so individual tests can access it
  testInfo.page = page;
});


test.describe('Add site contact while placing an order as guest user', () => {
  test.setTimeout(180000); // 3 minutes

  test('Add site contact while placing an order as guest user', async () => {
    let contact;

    // ✅ Get random CSV row at runtime
    const randomRow = getRandomRow(csvPath);

    console.log(`🧾 Running Guest flow for:  ${TestData.postcodes[1]}, ${TestData.WasteType[1]}, Heavywaste -${TestData.HeavyWaste[0]}, Plasterboard -${TestData.PlasterBoard[0]}, Skipsize-${TestData.SkipSize[1]}, ${TestData.Placement[0]}`);

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
      await orderPage.permitCheck(TestData.Placement[0]);
    });

    await test.step('Choose date', async () => {
      await orderPage.chooseDate(TestData.BookingDay[0]);
    });

    await test.step('Complete payment and add site contact', async () => {
      contact = await orderPage.completePayment();
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
      await orderDeliveryDetailsPage.verifyOrderDeliveryDetails();
    });

  });
});


test.describe('Add site contact while placing an order', () => {
  test.setTimeout(180000); // 3 minutes

  test('Add site contact', async () => {

    console.log(`🧾 Running logged-in User's flow for:  ${TestData.postcodes[1]}, ${TestData.WasteType[1]}, Heavywaste -${TestData.HeavyWaste[0]}, Plasterboard -${TestData.PlasterBoard[0]}, Skipsize-${TestData.SkipSize[1]}, ${TestData.Placement[0]}`);

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
      await orderPage.chooseStaticDate(dayNumber);
    });

    await test.step('Complete payment', async () => {
      contact = await orderPage.completePayment({ contactAction: 'Add New Contact' });
    });

    await test.step('Navigate to dashboard', async () => {
      await dashboardPage.gotoSuccessPage();
    });

    await test.step('Navigate to View Order Details', async () => {
      await dashboardPage.navigateToViewOrderDetails();
    });

    await test.step('Verify new contact details', async () => {
      await orderDeliveryDetailsPage.verifySiteContactDetails(contact);
    });

  });
});

test.describe('Select existing site contact while placing an order', () => {
  test.setTimeout(180000); // 3 minutes

  test('Select site contact', async () => {

    console.log(`🧾 Running logged-in User's flow for:  ${TestData.postcodes[1]}, ${TestData.WasteType[1]}, Heavywaste -${TestData.HeavyWaste[0]}, Plasterboard -${TestData.PlasterBoard[0]}, Skipsize-${TestData.SkipSize[1]}, ${TestData.Placement[0]}`);

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
      await orderPage.chooseStaticDate(dayNumber);
    });

    await test.step('Complete payment', async () => {
      contact = await orderPage.completePayment({ contactAction: 'Verify Existing Contact' });
    });

    await test.step('Navigate to dashboard', async () => {
      await dashboardPage.gotoSuccessPage();
    });

    await test.step('Navigate to View Order Details', async () => {
      await dashboardPage.navigateToViewOrderDetails();
    });

    await test.step('Verify new contact details', async () => {
      await orderDeliveryDetailsPage.verifySiteContactDetails(contact);
    });

  });
});

test.describe('Missed Collection', () => {
  test.setTimeout(180000); // 3 minutes

  test(`Missed Collection for today's date`, async () => {

    console.log(`🧾 Running logged-in User's flow for:  ${TestData.postcodes[1]}, ${TestData.WasteType[1]}, Heavywaste -${TestData.HeavyWaste[0]}, Plasterboard -${TestData.PlasterBoard[0]}, Skipsize-${TestData.SkipSize[1]}, ${TestData.Placement[0]}`);

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

    await test.step(`Confirm and verify missed collection`, async () => {
      await orderDeliveryDetailsPage.missedCollection();
      await orderDeliveryDetailsPage.verifyMissedCollectionLabel.scrollIntoViewIfNeeded();
      await expect(orderDeliveryDetailsPage.verifyMissedCollectionLabel).toBeVisible();
    });

  });
});

test.describe('Confirm Collection', () => {
  test.setTimeout(180000); // 3 minutes


  test('Confirm skip collection', async () => {

    console.log(`🧾 Running logged-in User's flow for:  ${TestData.postcodes[1]}, ${TestData.WasteType[1]}, Heavywaste -${TestData.HeavyWaste[0]}, Plasterboard -${TestData.PlasterBoard[0]}, Skipsize-${TestData.SkipSize[1]}, ${TestData.Placement[0]}`);

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
      await orderDeliveryDetailsPage.confirmCollection();

    });

  });
});

test.describe('Missed Delivery', () => {
  test.setTimeout(180000); // 3 minutes

  test(`Missed Delivery for today's date`, async () => {

    console.log(`🧾 Running logged-in User's flow for:  ${TestData.postcodes[1]}, ${TestData.WasteType[1]}, Heavywaste -${TestData.HeavyWaste[0]}, Plasterboard -${TestData.PlasterBoard[0]}, Skipsize-${TestData.SkipSize[1]}, ${TestData.Placement[0]}`);

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
      await orderDeliveryDetailsPage.missedDelivery();
      await orderDeliveryDetailsPage.verifyMissedDeliveryLabel.scrollIntoViewIfNeeded();
      await expect(orderDeliveryDetailsPage.verifyMissedDeliveryLabel).toBeVisible();
    });

  });
});

test.describe('Confirm Delivery', () => {
  test.setTimeout(180000); // 3 minutes

  test(`Confirm Delivery for today's date`, async () => {

    console.log(`🧾 Running logged-in User's flow for:  ${TestData.postcodes[1]}, ${TestData.WasteType[1]}, Heavywaste -${TestData.HeavyWaste[0]}, Plasterboard -${TestData.PlasterBoard[0]}, Skipsize-${TestData.SkipSize[1]}, ${TestData.Placement[0]}`);

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
      await orderDeliveryDetailsPage.verifyConfirmDeliveryLabel.scrollIntoViewIfNeeded();
      await expect(orderDeliveryDetailsPage.verifyConfirmDeliveryLabel).toBeVisible();
    });

  });
});

test.describe('Request collection outside 3 days free limit and pay for difference', () => {
  test.setTimeout(180000); // 3 minutes

  test('Request collection outside 3 days free limit and pay for difference', async () => {

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
      await orderDeliveryDetailsPage.requestCollection("no");
    });

  });
});

test.describe('Request collection within 3 days free limit', () => {
  test.setTimeout(180000); // 3 minutes

  test('Request collection within 3 days free limit', async () => {

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
      await orderDeliveryDetailsPage.requestCollection("yes");
    });

  });
});

test.describe('Upgrade skip', async () => {
  test.setTimeout(180000); // 3 minutes

  test('Upgrading skip for logged-in user', async () => {

    await test.step('Go to profile settings', async () => {
      await loginPage.goto();
      await loginPage.login(TestData.credentials.username, TestData.credentials.password);
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

  test('Downgrading skip for logged-in user', async () => {

    await test.step('Go to profile settings', async () => {
      await loginPage.goto();
      await loginPage.login(TestData.credentials.username, TestData.credentials.password);
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

  test('Edit profile settings', async () => {

    await test.step('Go to profile settings', async () => {
      await loginPage.goto();
      await loginPage.login(TestData.credentials.username, TestData.credentials.password);
      await profilesettingpage.goToProfileSettingsPage();
    });

    await test.step('Edit profile details', async () => {
      await profilesettingpage.editProfileSettings("Maitray", "Bhatt", "1333444355");
    });

  })
});

test.describe('Place an order for Wrong Skip Guarantee', () => {
  test.setTimeout(180000); // 3 minutes

  test('Place an order for Wrong Skip Guarantee and login with existing user', async () => {

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
      await orderDeliveryDetailsPage.verifyOrderDeliveryDetails();
      await orderDeliveryDetailsPage.verifyWrongSkipGuaranteeLabel.scrollIntoViewIfNeeded();
      await expect(orderDeliveryDetailsPage.verifyWrongSkipGuaranteeLabel).toBeVisible();
    });

  });
});

test.describe('Place order and add 2 Tonne bags', () => {
  test.setTimeout(180000); // 3 minutes

  test('Place order and add Tonne bags', async () => {

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
      await orderDeliveryDetailsPage.verifyOrderDeliveryDetails();
    });

    await test.step('Add 2 Tonne Bags from order details', async () => {
      await orderDeliveryDetailsPage.addTonneBag();
      await orderDeliveryDetailsPage.verifyTonneBagLabel.waitFor({ state: "visible" });
      await orderDeliveryDetailsPage.verifyTonneBagLabel.scrollIntoViewIfNeeded();
      await expect(orderDeliveryDetailsPage.verifyTonneBagLabel).toBeVisible();
      await expect(orderDeliveryDetailsPage.verifyTotalQuantity).toBeVisible();
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

  test('Change billing address and place order', async () => {

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
      await orderDeliveryDetailsPage.verifyOrderDeliveryDetails();
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

  test('Place order and add road permit', async () => {

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
      await orderDeliveryDetailsPage.verifyOrderDeliveryDetails();
    });

    await test.step('Add road permit from order details', async () => {
      await orderDeliveryDetailsPage.addRoadPermit();
      await orderDeliveryDetailsPage.roadpermitFeeLbl.waitFor({ state: "visible" });
      await orderDeliveryDetailsPage.roadpermitFeeLbl.scrollIntoViewIfNeeded();
      await expect(orderDeliveryDetailsPage.roadpermitFeeLbl).toBeVisible();
      await page.reload();
      await orderDeliveryDetailsPage.verifyOrderHistoryForAddedPermit.scrollIntoViewIfNeeded();
      await expect(orderDeliveryDetailsPage.verifyOrderHistoryForAddedPermit).toBeVisible();
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

  test('Start order as guest and logs in with existing account', async () => {

    // ✅ Get random CSV row at runtime
    const randomRow = getRandomRow(csvPath);

    console.log(`🧾 Running Guest flow for:  ${TestData.postcodes[0]}, ${TestData.WasteType[0]}, Heavywaste -${TestData.HeavyWaste[0]}, Plasterboard -${TestData.PlasterBoard[0]}, Skipsize-${TestData.SkipSize[0]}, ${TestData.Placement[0]}`);
    //console.log(`🧾 Running Guest flow for:  ${randomRow.Postcodes}, ${randomRow.WasteType}, Heavywaste -${randomRow.HeavyWaste}, Plasterboard -${randomRow.PlasterBoard}, Skipsize-${randomRow.SkipSize}, ${randomRow.Placement}`);

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
      //await orderPage.selectSkip(randomRow.SkipSize, randomRow.PlasterBoard, randomRow.ToneBag, randomRow.SelfDispose);
      const result = await orderPage.selectSkip(TestData.SkipSize[0], TestData.PlasterBoard[0], "No", "No");
      if (!result.success && result.reason === 'No skip available for the selection') {
        test.skip('No skip available for the selection — skipping the test.');
      }
    });

    await test.step('Permit check', async () => {
      await orderPage.permitCheck(TestData.Placement[0]);
    });

    await test.step('Choose date', async () => {
      //await orderPage.chooseDate(randomRow.BookingDay);
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
      await orderDeliveryDetailsPage.verifyOrderDeliveryDetails();
    });

    await test.step('Order Placement Email Verification', async () => {
      const emailId = TestData.credentials.username;
      console.log(`print email id from SignUp Class: ${emailId}`);
      await genFunctions.goToYopmail();
      await genFunctions.accessInbox(emailId);
      await genFunctions.checkOrderEmailReceived(orderPage);
    });
  });
});

test.describe('Place an order as Guest User', () => {
  test.setTimeout(180000); // 3 minutes

  test('Guest User Placing an order', async () => {

    // ✅ Get random CSV row at runtime
    const randomRow = getRandomRow(csvPath);

    //console.log(`🧾 Running Guest flow for:  ${TestData.postcodes[0]}, ${TestData.WasteType[0]}, Heavywaste -${TestData.HeavyWaste[0]}, Plasterboard -${TestData.PlasterBoard[0]}, Skipsize-${TestData.SkipSize[0]}, ${TestData.Placement[0]}`);
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
      await orderDeliveryDetailsPage.verifyOrderDeliveryDetails();
    });
  });
});

test.describe('Place an order as Logged-in User', () => {
  test.setTimeout(180000); // 3 minutes

  test('Logged-in User Placing an order', async () => {

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
      //console.log(`🧾 Running Guest flow for:  ${TestData.postcodes[0]}, ${TestData.WasteType[0]}, Heavywaste -${TestData.HeavyWaste[0]}, Plasterboard -${TestData.PlasterBoard[0]}, Skipsize-${TestData.SkipSize[0]}, ${TestData.Placement[0]}`);
      console.log(`🧾 Running Logged-in flow for: ${randomRow.Postcodes}, ${randomRow.WasteType}, Heavywaste -${randomRow.HeavyWaste}, Plasterboard -${randomRow.PlasterBoard}, Skipsize-${randomRow.SkipSize}, ${randomRow.Placement}`);
    });

    await test.step('Enter postcode', async () => {
      //await orderPage.enterPostcode(randomRow.Postcodes);
      await orderPage.enterPostcode(TestData.postcodes[0]);
    });

    await test.step('Select waste type', async () => {
      //await orderPage.selectWaste(randomRow.WasteType);
      await orderPage.selectWaste(TestData.WasteType[0]);
    });

    await test.step('Continue waste type', async () => {
      //await orderPage.continueWaste(randomRow.HeavyWaste, randomRow.PlasterBoard);
      await orderPage.continueWaste(TestData.HeavyWaste[0], TestData.PlasterBoard[0]);
    });

    await test.step('Select skip & property', async () => {
      //await orderPage.selectSkip(randomRow.SkipSize, randomRow.PlasterBoard, randomRow.ToneBag, randomRow.SelfDispose);
      await orderPage.selectSkip(TestData.SkipSize[0], TestData.PlasterBoard[0], "No", "No");

    });

    await test.step('Permit check', async () => {
      //await orderPage.permitCheck(randomRow.Placement);
      await orderPage.permitCheck(TestData.Placement[0]);
    });

    await test.step('Choose date', async () => {
      //await orderPage.chooseDate(randomRow.BookingDay);
      await orderPage.chooseDate(TestData.BookingDay[0]);
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
      await orderDeliveryDetailsPage.verifyOrderDeliveryDetails();
    });
  });
});

test.afterEach(async () => {
  await test.page?.context()?.close();
});