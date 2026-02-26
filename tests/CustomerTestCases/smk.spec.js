import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/Customer/LoginPage.js';
import { OrderPage } from '../../pages/Customer/OrderPage.js';
import { DashboardPage } from '../../pages/Customer/DashboardPage.js';
import { SignUpPage } from '../../pages/Customer/SignUpPage.js';
import { OrderDeliveryDetailsPage } from '../../pages/Customer/OrderDeliveryDetailsPage.js';
import { getRandomRow } from '../../utils/getRandomRow.js';
import { TestData } from '../../Data/testData.js';
import { genericFunctions } from '../../utils/genericFunctions.js';
import { ProfileSettingsPage } from '../../pages/Customer/ProfileSettingsPage.js';
import { AdminLogin } from '../../pages/Admin/AdminLogin.js';
import { Order_Admin_Page } from '../../pages/Admin/Order_Admin_Page.js';

const csvPath = './Data/testData.csv';

// 🌍 GLOBAL POM Objects DECLARATION
/** @type {LoginPage} */ let loginPage;
/** @type {SignUpPage} */ let signUpPage;
/** @type {OrderPage} */ let orderPage;
/** @type {ProfileSettingsPage} */let profilesettingpage;
/** @type {DashboardPage} */ let dashboardPage;
/** @type {OrderDeliveryDetailsPage} */ let orderDeliveryDetailsPage;
/** @type {genericFunctions} */ let genFunctions;
/** @type {AdminLogin} */ let adminLogin;
/** @type {Order_Admin_Page} */ let orderAdminPage;

let page, context;

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
  adminLogin = new AdminLogin(page);
  orderAdminPage = new Order_Admin_Page(page);

  // Store the page in testInfo so individual tests can access it
  testInfo.page = page;
});

test.describe('Customer side test cases', () => {
  test.setTimeout(180000); // 3 minutes

  test('24. Customer and Admin conversation verification', async ({ browser }) => {
    let orderId, msgText, adminReply;
    await loginPage.goto(TestData.baseURL);
    await loginPage.login(TestData.credentials.customer.username, TestData.credentials.customer.password);

    await test.step('Go to profile settings', async () => {
      await profilesettingpage.goToProfileSettingsPage();
    });

    await test.step('Verify Order Delivery Details', async () => {
      orderId = await dashboardPage.navigateToViewOrderDetails();
    });

    await test.step('Customer sends Message', async () => {
      msgText = await orderDeliveryDetailsPage.sendMessage({ messageType: 'custom', customText: 'Request to provide an update on my order' + new Date() });
      console.log('msgText captured in test step: ', msgText);
    });

    await test.step('Admin replies to customer', async () => {
      console.log('Test status before admin step:', test.info().status);
      const agentContext = await browser.newContext({
        httpCredentials: {
          username: TestData.authCredentials.authUserName,
          password: TestData.authCredentials.authPassword
        },
        ignoreHTTPSErrors: true
      });
      const agentPage = await agentContext.newPage();
      const agentLogin = new AdminLogin(agentPage);
      const agentGenFunctions = new genericFunctions(agentPage);
      const agentOrderAdminPage = new Order_Admin_Page(agentPage);

      await agentLogin.goto(agentGenFunctions.buildURL('/agent/login'));
      await agentLogin.adminLogin(TestData.credentials.agent.username, TestData.credentials.agent.password);
      await agentOrderAdminPage.getOrderDetails(orderId);
      adminReply = await agentOrderAdminPage.adminRepliesToCustomer(msgText);
      await agentContext.close();
    });

    await test.step('Customer verifies admin reply', async () => {
      await orderDeliveryDetailsPage.verifyAdminReply(adminReply);
    });

  });

  test('23. Customer message verification', async () => {

    await loginPage.goto(TestData.baseURL);
    await loginPage.login(TestData.credentials.customer.username, TestData.credentials.customer.password);

    await test.step('Go to profile settings', async () => {
      await profilesettingpage.goToProfileSettingsPage()
    });

    await test.step('Verify Order Delivery Details', async () => {
      await dashboardPage.navigateToViewOrderDetails();
    });

    await test.step('Send Message', async () => {
      await orderDeliveryDetailsPage.sendMessage({ messageType: 'preDefined' });
      await orderDeliveryDetailsPage.sendMessage({ messageType: 'custom', customText: 'Request to provide an update on my order.' + new Date() });
      await orderDeliveryDetailsPage.sendMessage({ fromMessageTab: true, messageType: 'preDefined' });

    });

  });

  test('22. Verify Payment History', async () => {

    //console.log(`🧾 Running logged-in User's flow for:  ${TestData.postcodes[1]}, ${TestData.WasteType[1]}, Heavywaste -${TestData.HeavyWaste[0]}, Plasterboard -${TestData.PlasterBoard[0]}, Skipsize-${TestData.SkipSize[1]}, ${TestData.Placement[0]}`);

    await loginPage.goto(TestData.baseURL);
    await loginPage.login(TestData.credentials.customer.username, TestData.credentials.customer.password);

    await test.step('Go to profile settings', async () => {
      await profilesettingpage.goToProfileSettingsPage()
    });

    await test.step('Verify Order Delivery Details', async () => {
      await dashboardPage.navigateToViewOrderDetails();
      await orderDeliveryDetailsPage.verifyOrderDeliveryDetails();
    });

    await test.step('Verify payment history', async () => {
      await orderDeliveryDetailsPage.verifyPaymentHistory();
    });

  });

  // Feature is removed temporarily, will be added back once feature is live again.
  /*
    test('21. Place an order with Skip Tarp and login with existing user', async () => {
  
      // ✅ Get random CSV row at runtime
      const randomRow = getRandomRow(csvPath);
  
      console.log(`🧾 Running Guest flow for:  ${TestData.postcodes[1]}, ${TestData.WasteType[1]}, Heavywaste -${TestData.HeavyWaste[0]}, Plasterboard -${TestData.PlasterBoard[0]}, Skipsize-${TestData.SkipSize[1]}, ${TestData.Placement[1]}`);
  
      await loginPage.goto(TestData.baseURL);
  
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
        await orderPage.selectSkip(TestData.SkipSize[1], TestData.PlasterBoard[0], "No", "Yes", "Yes");
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
      });
  
      await test.step('Verify Order Delivery Details for Tarp', async () => {
        await dashboardPage.navigateToViewOrderDetails();
        await orderDeliveryDetailsPage.verifyOrderDeliveryDetails();
        await orderDeliveryDetailsPage.verifyWrongSkipGuaranteeLabel.scrollIntoViewIfNeeded();
        await expect(orderDeliveryDetailsPage.verifyWrongSkipGuaranteeLabel).toBeVisible();
        //await expect(orderDeliveryDetailsPage.skipTarpLbl).toBeVisible();
      });
  
    });
  */

  //  Request Refund scenario to be placed always after the scenario in which new order has been placed.
  /*
   
    test('Request and verify refund', async () => {
   
      //console.log(`🧾 Running logged-in User's flow for:  ${TestData.postcodes[1]}, ${TestData.WasteType[1]}, Heavywaste -${TestData.HeavyWaste[0]}, Plasterboard -${TestData.PlasterBoard[0]}, Skipsize-${TestData.SkipSize[1]}, ${TestData.Placement[0]}`);
   
      await loginPage.goto(TestData.baseURL);
      await loginPage.login(TestData.credentials.customer.username, TestData.credentials.customer.password);
   
      await test.step('Go to profile settings', async () => {
        await profilesettingpage.goToProfileSettingsPage()
      });
   
      await test.step('Verify Order Delivery Details', async () => {
        await dashboardPage.navigateToViewOrderDetails();
        await orderDeliveryDetailsPage.verifyOrderDeliveryDetails();
      });
   
      await test.step('Request Refund', async () => {
        await orderDeliveryDetailsPage.verifyRequestRefund();
      });
   
    });
  */

  test('20. Add & remove image after placing an order', async () => {

    // console.log(`🧾 Running logged-in User's flow for:  ${TestData.postcodes[1]}, ${TestData.WasteType[1]}, Heavywaste -${TestData.HeavyWaste[0]}, Plasterboard -${TestData.PlasterBoard[0]}, Skipsize-${TestData.SkipSize[1]}, ${TestData.Placement[0]}`);

    await loginPage.goto(TestData.baseURL);
    await loginPage.login(TestData.customer.credentials.username, TestData.customer.credentials.password);

    await test.step('Go to profile settings', async () => {
      await profilesettingpage.goToProfileSettingsPage()
    });

    await test.step('Verify Order Delivery Details', async () => {
      await dashboardPage.navigateToViewOrderDetails();
      await orderDeliveryDetailsPage.verifyOrderDeliveryDetails();
    });

    await test.step('Add image', async () => {
      await orderDeliveryDetailsPage.addImage();
      await orderDeliveryDetailsPage.deleteImage();
    });

  });

  test('19. Site Contacts - guest user: Add site contact while placing an order', async () => {
    let contact;

    // ✅ Get random CSV row at runtime
    const randomRow = getRandomRow(csvPath);

    console.log(`🧾 Running Guest flow for:  ${TestData.postcodes[1]}, ${TestData.WasteType[1]}, Heavywaste -${TestData.HeavyWaste[0]}, Plasterboard -${TestData.PlasterBoard[0]}, Skipsize-${TestData.SkipSize[1]}, ${TestData.Placement[0]}`);

    await loginPage.goto(TestData.baseURL);

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
      await orderPage.selectSkip(TestData.SkipSize[1], TestData.PlasterBoard[0], "No", "No", "No");
    });

    await test.step('Permit check', async () => {
      await orderPage.permitCheck(TestData.Placement[0]);
    });

    await test.step('Choose date', async () => {
      await orderPage.chooseDate(TestData.BookingDay[0]);
    });

    await test.step('Complete payment and add site contact', async () => {
      await orderPage.completePayment();
    });

    await test.step('Guest registration', async () => {
      contact = await signUpPage.fillSignUpForm();
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

    await test.step('Verify site contact details', async () => {
      await orderDeliveryDetailsPage.verifySiteContactDetails(contact);
    });

  });

  test('18. Site Contacts: Add site contact while placing an order', async () => {
    let result, contact;
    console.log(`🧾 Running logged-in User's flow for:  ${TestData.postcodes[1]}, ${TestData.WasteType[1]}, Heavywaste -${TestData.HeavyWaste[0]}, Plasterboard -${TestData.PlasterBoard[0]}, Skipsize-${TestData.SkipSize[1]}, ${TestData.Placement[0]}`);

    await loginPage.goto(TestData.baseURL);
    await loginPage.login(TestData.credentials.customer.username, TestData.credentials.customer.password);

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
      await orderPage.selectSkip(TestData.SkipSize[1], TestData.PlasterBoard[0], "No", "No", "No");
    });

    await test.step('Permit check', async () => {
      await orderPage.permitCheck(TestData.Placement[0]);
    });

    await test.step('Choose date', async () => {
      const dayNumber = new Date().getDate();
      await orderPage.chooseStaticDate(dayNumber);
    });

    await test.step('Complete payment', async () => {
      result = await orderPage.completePayment({ contactAction: 'Add New Contact' });
      contact = result.data;
    });

    await test.step('Navigate to dashboard', async () => {
      await dashboardPage.gotoSuccessPage();
    });

    await test.step('Verify Order Delivery Details', async () => {
      await dashboardPage.navigateToViewOrderDetails();
      await orderDeliveryDetailsPage.verifyOrderDeliveryDetails();
    });

    await test.step('Verify site contact details', async () => {
      await orderDeliveryDetailsPage.verifySiteContactDetails(contact);
    });

  });

  test('17. Site Contacts: Select existing site contact while placing an order', async ({ },) => {
    let result, contact;
    console.log(`🧾 Running logged-in User's flow for:  ${TestData.postcodes[1]}, ${TestData.WasteType[1]}, Heavywaste -${TestData.HeavyWaste[0]}, Plasterboard -${TestData.PlasterBoard[0]}, Skipsize-${TestData.SkipSize[1]}, ${TestData.Placement[0]}`);

    await loginPage.goto(TestData.baseURL);
    await loginPage.login(TestData.credentials.customer.username, TestData.credentials.customer.password);

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
      await orderPage.selectSkip(TestData.SkipSize[1], TestData.PlasterBoard[0], "No", "No", "No");
    });

    await test.step('Permit check', async () => {
      await orderPage.permitCheck(TestData.Placement[0]);
    });

    await test.step('Choose date', async () => {
      const dayNumber = new Date().getDate();
      await orderPage.chooseStaticDate(dayNumber);
    });

    await test.step('Complete payment', async () => {
      result = await orderPage.completePayment({ contactAction: 'Verify Existing Contact' });
      // Extract data from result
      contact = result.data;

      if (result?.skipTest) {
        test.skip(result.reason);
      }
    });

    await test.step('Navigate to dashboard', async () => {
      await dashboardPage.gotoSuccessPage();
    });

    await test.step('Verify Order Delivery Details', async () => {
      await dashboardPage.navigateToViewOrderDetails();
      await orderDeliveryDetailsPage.verifyOrderDeliveryDetails();
    });

    await test.step('Verify site contact details', async () => {
      await orderDeliveryDetailsPage.verifySiteContactDetails(contact);
    });
  });

  test(`16. Missed Collection for today's date`, async () => {

    console.log(`🧾 Running logged-in User's flow for:  ${TestData.postcodes[1]}, ${TestData.WasteType[1]}, Heavywaste -${TestData.HeavyWaste[0]}, Plasterboard -${TestData.PlasterBoard[0]}, Skipsize-${TestData.SkipSize[1]}, ${TestData.Placement[0]}`);

    await loginPage.goto(TestData.baseURL);
    await loginPage.login(TestData.credentials.customer.username, TestData.credentials.customer.password);

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
      await orderPage.selectSkip(TestData.SkipSize[1], TestData.PlasterBoard[0], "No", "No", "No");
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

  test('15. Confirm skip collection', async () => {

    console.log(`🧾 Running logged-in User's flow for:  ${TestData.postcodes[1]}, ${TestData.WasteType[1]}, Heavywaste -${TestData.HeavyWaste[0]}, Plasterboard -${TestData.PlasterBoard[0]}, Skipsize-${TestData.SkipSize[1]}, ${TestData.Placement[0]}`);

    await loginPage.goto(TestData.baseURL);
    await loginPage.login(TestData.credentials.customer.username, TestData.credentials.customer.password);

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
      await orderPage.selectSkip(TestData.SkipSize[1], TestData.PlasterBoard[0], "No", "No", "No");
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

  test(`14. Missed Delivery for today's date`, async () => {
    let dayNumber = new Date().getDate();
    console.log(`🧾 Running logged-in User's flow for:  ${TestData.postcodes[1]}, ${TestData.WasteType[1]}, Heavywaste -${TestData.HeavyWaste[0]}, Plasterboard -${TestData.PlasterBoard[0]}, Skipsize-${TestData.SkipSize[1]}, ${TestData.Placement[0]}`);

    await loginPage.goto(TestData.baseURL);
    await loginPage.login(TestData.credentials.customer.username, TestData.credentials.customer.password);

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
      await orderPage.selectSkip(TestData.SkipSize[1], TestData.PlasterBoard[0], "No", "No", "No");
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

  test(`13. Confirm Delivery for today's date`, async () => {

    console.log(`🧾 Running logged-in User's flow for:  ${TestData.postcodes[1]}, ${TestData.WasteType[1]}, Heavywaste -${TestData.HeavyWaste[0]}, Plasterboard -${TestData.PlasterBoard[0]}, Skipsize-${TestData.SkipSize[1]}, ${TestData.Placement[0]}`);

    await loginPage.goto(TestData.baseURL);
    await loginPage.login(TestData.credentials.customer.username, TestData.credentials.customer.password);

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
      await orderPage.selectSkip(TestData.SkipSize[1], TestData.PlasterBoard[0], "No", "No", "No");
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

  test('12. Request collection outside 3 days free limit and pay for difference', async () => {

    console.log(`🧾 Running Guest flow for:  ${TestData.postcodes[1]}, ${TestData.WasteType[1]}, Heavywaste -${TestData.HeavyWaste[0]}, Plasterboard -${TestData.PlasterBoard[0]}, Skipsize-${TestData.SkipSize[1]}, ${TestData.Placement[0]}`);

    await loginPage.goto(TestData.baseURL);
    await loginPage.login(TestData.credentials.customer.username, TestData.credentials.customer.password);

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
      await orderPage.selectSkip(TestData.SkipSize[1], TestData.PlasterBoard[0], "No", "No", "No");
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

  test('11. Request collection within 3 days free limit', async () => {

    console.log(`🧾 Running Guest flow for:  ${TestData.postcodes[1]}, ${TestData.WasteType[1]}, Heavywaste -${TestData.HeavyWaste[0]}, Plasterboard -${TestData.PlasterBoard[0]}, Skipsize-${TestData.SkipSize[1]}, ${TestData.Placement[0]}`);

    await loginPage.goto(TestData.baseURL);
    await loginPage.login(TestData.credentials.customer.username, TestData.credentials.customer.password);

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
      await orderPage.selectSkip(TestData.SkipSize[1], TestData.PlasterBoard[0], "No", "No", "No");
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

  test('10. Edit User Profile', async () => {
    await test.step('Go to profile settings', async () => {
      await loginPage.goto(TestData.baseURL);
      await loginPage.login(TestData.credentials.customer.username, TestData.credentials.customer.password);
      await profilesettingpage.goToProfileSettingsPage();
    });

    await test.step('Edit profile details', async () => {
      await profilesettingpage.editProfileSettings("Maitray", "Bhatt", "1333444355");
    });

  });

  test('9. Place an order for Wrong Skip Guarantee and login with existing user', async () => {

    // ✅ Get random CSV row at runtime
    const randomRow = getRandomRow(csvPath);

    console.log(`🧾 Running Guest flow for:  ${TestData.postcodes[1]}, ${TestData.WasteType[1]}, Heavywaste -${TestData.HeavyWaste[0]}, Plasterboard -${TestData.PlasterBoard[0]}, Skipsize-${TestData.SkipSize[1]}, ${TestData.Placement[1]}`);

    await loginPage.goto(TestData.baseURL);

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
      await orderPage.selectSkip(TestData.SkipSize[1], TestData.PlasterBoard[0], "No", "No", "No");
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

  test('8. Upgrading skip for logged-in user', async () => {
    //let result;
    await test.step('Go to profile settings', async () => {
      await loginPage.goto(TestData.baseURL);
      await loginPage.login(TestData.credentials.customer.username, TestData.credentials.customer.password);
      await profilesettingpage.goToProfileSettingsPage();
    });

    await test.step('Navigate and Upgrade skip', async () => {
      await dashboardPage.navigateToViewOrderDetails();
      await orderDeliveryDetailsPage.upgradeSkip();
    });
  });

  test('7. Downgrading skip for logged-in user', async () => {
    // let result;
    await test.step('Go to profile settings', async () => {

      await loginPage.goto(TestData.baseURL);
      await loginPage.login(TestData.credentials.customer.username, TestData.credentials.customer.password);
      await profilesettingpage.goToProfileSettingsPage();
    });

    await test.step('Navigate and Downgrade skip', async () => {
      await dashboardPage.navigateToViewOrderDetails();
      await orderDeliveryDetailsPage.downgradeSkip();
    });
  });

  test('6. Place order and add 2 Tonne bags', async () => {

    // ✅ Get random CSV row at runtime
    const randomRow = getRandomRow(csvPath);

    console.log(`🧾 Running Guest flow for:  ${TestData.postcodes[1]}, ${TestData.WasteType[1]}, Heavywaste -${TestData.HeavyWaste[0]}, Plasterboard -${TestData.PlasterBoard[0]}, Skipsize-${TestData.SkipSize[1]}, ${TestData.Placement[1]}`);

    await loginPage.goto(TestData.baseURL);

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
      await orderPage.selectSkip(TestData.SkipSize[1], TestData.PlasterBoard[0], "No", "No", "No");
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
      await genFunctions.goToYopmail();
      await genFunctions.accessInbox(TestData.credentials.customer.username);
      await genFunctions.checkOrderEmailReceived(orderPage);
    });

  });

  test('5. Change billing address and place order', async () => {

    // ✅ Get random CSV row at runtime
    const randomRow = getRandomRow(csvPath);

    console.log(`🧾 Running Guest flow for:  ${TestData.postcodes[0]}, ${TestData.WasteType[0]}, Heavywaste -${TestData.HeavyWaste[0]}, Plasterboard -${TestData.PlasterBoard[0]}, Skipsize-${TestData.SkipSize[0]}, ${TestData.Placement[0]}`);

    await loginPage.goto(TestData.baseURL);

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
      await orderPage.selectSkip(TestData.SkipSize[0], TestData.PlasterBoard[0], "No", "No", "No");
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
      await genFunctions.goToYopmail();
      await genFunctions.accessInbox(TestData.credentials.customer.username);
      await genFunctions.checkOrderEmailReceived(orderPage);
    });

  });

  test('4. Place order and add road permit', async () => {

    // ✅ Get random CSV row at runtime
    const randomRow = getRandomRow(csvPath);

    console.log(`🧾 Running Guest flow for:  ${TestData.postcodes[0]}, ${TestData.WasteType[0]}, Heavywaste -${TestData.HeavyWaste[0]}, Plasterboard -${TestData.PlasterBoard[0]}, Skipsize-${TestData.SkipSize[0]}, ${TestData.Placement[0]}`);

    await loginPage.goto(TestData.baseURL);

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
      await orderPage.selectSkip(TestData.SkipSize[0], TestData.PlasterBoard[0], "No", "No", "No");
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
      await genFunctions.goToYopmail();
      await genFunctions.accessInbox(TestData.credentials.customer.username);
      await genFunctions.checkOrderEmailReceived(orderPage);
    });

  });

  test('3. Start order as guest and logs in with existing account', async () => {

    // ✅ Get random CSV row at runtime
    const randomRow = getRandomRow(csvPath);

    console.log(`🧾 Running Guest flow for:  ${TestData.postcodes[0]}, ${TestData.WasteType[0]}, Heavywaste -${TestData.HeavyWaste[0]}, Plasterboard -${TestData.PlasterBoard[0]}, Skipsize-${TestData.SkipSize[0]}, ${TestData.Placement[0]}`);
    //console.log(`🧾 Running Guest flow for:  ${randomRow.Postcodes}, ${randomRow.WasteType}, Heavywaste -${randomRow.HeavyWaste}, Plasterboard -${randomRow.PlasterBoard}, Skipsize-${randomRow.SkipSize}, ${randomRow.Placement}`);

    await loginPage.goto(TestData.baseURL);

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
      const result = await orderPage.selectSkip(TestData.SkipSize[0], TestData.PlasterBoard[0], "No", "No", "No");
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
      await genFunctions.goToYopmail();
      await genFunctions.accessInbox(TestData.credentials.customer.username);
      await genFunctions.checkOrderEmailReceived(orderPage);
    });
  });

  test('2. Place an order as Guest User', async () => {

    // ✅ Get random CSV row at runtime
    const randomRow = getRandomRow(csvPath);

    //console.log(`🧾 Running Guest flow for:  ${TestData.postcodes[0]}, ${TestData.WasteType[0]}, Heavywaste -${TestData.HeavyWaste[0]}, Plasterboard -${TestData.PlasterBoard[0]}, Skipsize-${TestData.SkipSize[0]}, ${TestData.Placement[0]}`);
    console.log(`🧾 Running Guest flow for:  ${randomRow.Postcodes}, ${randomRow.WasteType}, Heavywaste -${randomRow.HeavyWaste}, Plasterboard -${randomRow.PlasterBoard}, Skipsize-${randomRow.SkipSize}, ${randomRow.Placement}`);

    await loginPage.goto(TestData.baseURL);

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
      await orderPage.selectSkip(randomRow.SkipSize, randomRow.PlasterBoard, randomRow.ToneBag, randomRow.SelfDispose, "No");
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

  test('1. Place an order as Logged-in User', async () => {

    // ✅ Get random CSV row at runtime
    const randomRow = getRandomRow(csvPath);

    await test.step('Sign up new user', async () => {
      await loginPage.goto(TestData.baseURL);
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
      await orderPage.selectSkip(TestData.SkipSize[0], TestData.PlasterBoard[0], "No", "No", "No");

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
  // Only close the customer context after all pages have finished using it
  await context?.close();

});