import { test, expect } from '../../fixtures/test.js';
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
import { SupplierRegistrationPage } from '../../pages/Suppliers/SupplierRegistrationPage.js';
import { OrdersPage as SupplierOrdersPage } from '../../pages/Suppliers/OrdersPage.js';
import { TakeOrderSheetPage } from '../../pages/Suppliers/TakeOrderSheetPage.js';
import { MyOrderDetailsPage } from '../../pages/Suppliers/MyOrderDetailsPage.js';
import { ensureCookieConsentDismissed } from '../../utils/cookieConsent.js';

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
  const projectUse = testInfo.project.use;
  context = await browser.newContext({
    ...projectUse,
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

/**
 * Supplier takes an order from Available Orders.
 * @param {import('@playwright/test').Browser} browser
 * @param {import('@playwright/test').TestInfo} testInfo
 * @param {string} [orderId] - when provided, takes that specific order; otherwise takes the first available
 * @param {{ markDelivered?: boolean }} [options] - when true, supplier marks order delivered from My Orders
 */
async function supplierTakeOrder(browser, testInfo, orderId, options = {}) {
  const { markDelivered = false } = options;
  const supplierContext = await browser.newContext({
    ...testInfo.project.use,
    httpCredentials: {
      username: TestData.authCredentials.authUserName,
      password: TestData.authCredentials.authPassword
    },
    ignoreHTTPSErrors: true
  });
  const supplierPage = await supplierContext.newPage();
  const genFunctionsLocal = new genericFunctions(supplierPage);
  const supplierRegistrationPage = new SupplierRegistrationPage(supplierPage);
  const supplierOrdersPage = new SupplierOrdersPage(supplierPage);
  const takeOrderSheetPage = new TakeOrderSheetPage(supplierPage);

  let takenOrderId = orderId;

  await test.step('Navigate to supplier login and login', async () => {
    await genFunctionsLocal.goto(supplierPage, '/supplier/login');
    await supplierRegistrationPage.supplierLogin(
      TestData.credentials.supplier.username,
      TestData.credentials.supplier.password
    );
    if (await supplierRegistrationPage.doItLaterBtn.isVisible()) {
      await supplierRegistrationPage.doItLaterBtn.click();
    }
    await expect(supplierOrdersPage.availableOrdersTab).toBeVisible({ timeout: 15000 });
    await ensureCookieConsentDismissed(supplierPage);
  });

  await test.step('Take order from Available Orders', async () => {
    if (!orderId) {
      takenOrderId = await supplierOrdersPage.getFirstRowOrderId();
    }

    console.log(`Taking order ID: ${takenOrderId}`);
    await ensureCookieConsentDismissed(supplierPage);
    await supplierOrdersPage.takeAvailableOrder(takenOrderId);
    await supplierPage.waitForTimeout(2000);
  });

  await test.step('Verify Take Order sheet is displayed', async () => {
    await takeOrderSheetPage.verifySheetDisplayed();
  });

  await test.step('Agree to take-order policies', async () => {
    await ensureCookieConsentDismissed(supplierPage);
    await takeOrderSheetPage.acceptAllPolicies();
  });

  await test.step('Click Take Order button', async () => {
    await expect(takeOrderSheetPage.takeThisOrderBtn).toBeEnabled({ timeout: 20000 });
    await takeOrderSheetPage.takeThisOrderBtn.click();
    await Promise.race([
      takeOrderSheetPage.takeOrderSuccessMsg.waitFor({ state: 'visible', timeout: 15000 }),
      takeOrderSheetPage.takeOrderSheet.waitFor({ state: 'hidden', timeout: 15000 }),
    ]);
    await supplierPage.waitForTimeout(2000);
  });

  await test.step('Verify order is visible in My Orders tab', async () => {
    await supplierOrdersPage.verifyOrderTaken(takenOrderId);
  });

  if (markDelivered) {
    const myOrderDetailsPage = new MyOrderDetailsPage(supplierPage);

    await test.step('Mark delivered from My Orders', async () => {
      await supplierOrdersPage.ensureOnOrderDetailsPage(takenOrderId);
      await myOrderDetailsPage.markDelivered();
    });
  }

  await supplierContext.close();
  return takenOrderId;
}

test.describe('Customer side test cases', () => {
  test.setTimeout(240000); // 3 minutes

  test('1.1 - Postcode Search', async () => {

    await test.step('AC-1.1.1: Verify postcode search field is visible on booking page', async () => {
      await loginPage.goto(TestData.baseURL);
      await orderPage.verifyPostcodeSearchFieldVisible();
    });

    await test.step('AC-1.1.2: Verify address suggestions appear and can be selected', async () => {
      await orderPage.typePostcodeAndVerifySuggestions(TestData.postcodes[0]);
    });

    await test.step('AC-1.1.3: Verify address fields are auto-populated after selection', async () => {
      await orderPage.verifyAddressFieldsAutoPopulated();
    });

    await test.step('AC-1.1.4: Verify manual address entry when no results found', async () => {
      await loginPage.goto(TestData.baseURL);
      await orderPage.verifyNoResultsAndManualEntry(
        TestData.noResultPostcode,
        TestData.manualAddress
      );
    });

    await test.step('AC-1.1.5: Verify customer cannot proceed without valid postcode/address', async () => {
      await loginPage.goto(TestData.baseURL);
      await orderPage.verifyCannotProceedWithoutAddress();
    });

  });

  test('1.2 - Customer booking flow: address, waste, placement, dates', async () => {
    test.setTimeout(240000);

    await loginPage.goto(TestData.baseURL);
    await ensureCookieConsentDismissed(page);

    await test.step('AC-5: Incomplete address step cannot continue', async () => {
      await orderPage.verifyCannotProceedWithoutAddress();
    });

    await test.step('AC-1: Complete UK delivery address continues to waste type', async () => {
      await orderPage.enterPostcode(TestData.postcodes[0]);
      await orderPage.verifyWasteTypeStepVisible();
    });

    await test.step('AC-5: Incomplete waste step cannot continue', async () => {
      await orderPage.verifyContinueBlocked();
    });

    await test.step('AC-2: Waste category and questions allow booking to continue', async () => {
      await orderPage.selectWaste(TestData.WasteType[0]);
      await orderPage.openWasteQuestionsModal();
      await orderPage.verifyContinueBlocked();
      await orderPage.answerWasteTypeQuestions(TestData.HeavyWaste[0], TestData.PlasterBoard[0]);
      await orderPage.submitWasteQuestionsAndContinue();
      await orderPage.skipChargeableItemsIfShown();
    });

    await test.step('AC-5: Incomplete placement step cannot continue', async () => {
      await orderPage.verifyPlacementStepVisible();
      await orderPage.verifyContinueBlocked();
    });

    await test.step('AC-3: Skip placement continues to offers', async () => {
      await orderPage.permitCheck(TestData.Placement[0]);
      await orderPage.verifyOffersStepVisible();
    });

    await test.step('AC-4: Selecting an available offer reaches the date step', async () => {
      await orderPage.selectSkipSizeOnly(TestData.SkipSize[0]);
      await orderPage.clickContinueOnSkipSelection();
      if (await orderPage.skipTarpNoBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
        await orderPage.dismissSkipTarpModal();
      }
      await orderPage.verifyDateStepVisible();
    });

    await test.step('AC-5: Incomplete date step cannot continue', async () => {
      await orderPage.verifyContinueBlocked();
    });

    await test.step('AC-4: Delivery and collection dates continue to payment', async () => {
      await orderPage.selectEarliestAvailableDeliveryAndCollection();
      await orderPage.continueFromDateStepToPayment();
    });
  });

  test('1.3 - Private placement: no permit without photo (AC-14, AC-16)', async () => {
    test.setTimeout(480000);

    await loginPage.goto(TestData.baseURL);
    await loginPage.login(TestData.credentials.customer.username, TestData.credentials.customer.password);

    await test.step('AC-14 / AC-16: Book private property without a placement photo', async () => {
      await orderPage.navigateToPlacementStep();
      await orderPage.selectPrivatePlacementWithoutPhoto();
      await orderPage.continueFromPlacementToDateStep();
      await orderPage.selectEarliestAvailableDeliveryAndCollection();
      await orderPage.continueFromDateStepToPayment();
      await orderPage.verifyNoPermitOnOrderSummary();
    });

    await test.step('Complete payment and open the created order', async () => {
      await orderPage.completePayment();
      await dashboardPage.gotoSuccessPage();
      await dashboardPage.navigateToViewOrderDetails();
      await orderDeliveryDetailsPage.verifyOrderDeliveryDetails();
    });

    await test.step('AC-14: Private property order has no permit', async () => {
      await orderDeliveryDetailsPage.verifyRoadPermitNotOnOrder();
    });
  });

  test('1.4 - Public placement: permit and council processing days (AC-15)', async () => {
    test.setTimeout(480000);

    await loginPage.goto(TestData.baseURL);
    await loginPage.login(TestData.credentials.customer.username, TestData.credentials.customer.password);

    await test.step('AC-15: Public land adds a permit and shows council processing time', async () => {
      await orderPage.navigateToPlacementStep();
      await orderPage.selectPublicPlacement();
      await orderPage.continueFromPlacementToDateStep();
      await orderPage.verifyEarliestDeliveryRespectsCouncilProcessingDays();
      await orderPage.selectEarliestAvailableDeliveryAndCollection();
      await orderPage.continueFromDateStepToPayment();
      await orderPage.verifyPermitOnOrderSummary();
    });

    await test.step('AC-15: Permit is on the created order', async () => {
      await orderPage.completePayment();
      await dashboardPage.gotoSuccessPage();
      await dashboardPage.navigateToViewOrderDetails();
      await orderDeliveryDetailsPage.verifyOrderDeliveryDetails();
      await orderDeliveryDetailsPage.verifyRoadPermitOnOrder();
    });
  });

  test('1.5 - Placement photo is attached after the order is created (AC-17)', async () => {
    test.setTimeout(480000);

    await loginPage.goto(TestData.baseURL);
    await loginPage.login(TestData.credentials.customer.username, TestData.credentials.customer.password);

    await test.step('AC-17: Upload a placement photo during booking', async () => {
      await orderPage.navigateToPlacementStep();
      await orderPage.selectPrivatePlacementWithoutPhoto();
      await orderPage.uploadPlacementPhoto('Data/test_image.png');
      await orderPage.continueFromPlacementToDateStep();
      await orderPage.selectEarliestAvailableDeliveryAndCollection();
      await orderPage.continueFromDateStepToPayment();
    });

    await test.step('AC-17: Photo is attached on the created order', async () => {
      await orderPage.completePayment();
      await dashboardPage.gotoSuccessPage();
      await dashboardPage.navigateToViewOrderDetails();
      await orderDeliveryDetailsPage.verifyOrderDeliveryDetails();
      await orderDeliveryDetailsPage.verifyPlacementPhotoAttached();
    });
  });

  test('1.6 - Offers: matching sizes selectable and carry to summary (AC-19, AC-24)', async () => {
    test.setTimeout(240000);

    await loginPage.goto(TestData.baseURL);
    await loginPage.login(TestData.credentials.customer.username, TestData.credentials.customer.password);
    await ensureCookieConsentDismissed(page);

    let selectedOffer;

    await test.step('AC-19: No heavy waste and no permit keeps matching sizes selectable', async () => {
      await orderPage.navigateToPlacementStep({ heavyWaste: TestData.HeavyWaste[0] });
      await orderPage.selectPrivatePlacementWithoutPhoto();
      await orderPage.continueFromPlacementToOffers();
      await orderPage.verifyNoUnavailableOffers();
      await orderPage.selectAvailableOffer('4');
      await orderPage.selectAvailableOffer('20');
      await orderPage.selectAvailableOffer('40');
      await orderPage.selectAvailableOffer('4');
    });

    await test.step('AC-24: Selected size, price, and hire period carry to summary and total', async () => {
      selectedOffer = await orderPage.captureSelectedOfferDetails('4');
      await orderPage.clickContinueOnSkipSelection();
      if (await orderPage.skipTarpNoBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
        await orderPage.dismissSkipTarpModal();
      }
      await orderPage.verifyDateStepVisible();
      await orderPage.selectEarliestAvailableDeliveryAndCollection();
      await orderPage.continueFromDateStepToPayment();
      await orderPage.verifyOfferCarriedToOrderSummary(selectedOffer);
    });
  });

  test('1.7 - Offers: permit-required sizes unavailable (AC-21)', async () => {
    test.setTimeout(240000);

    await loginPage.goto(TestData.baseURL);
    await loginPage.login(TestData.credentials.customer.username, TestData.credentials.customer.password);
    await ensureCookieConsentDismissed(page);

    await test.step('AC-21: Sizes that cannot go on the road stay unavailable', async () => {
      await orderPage.navigateToPlacementStep({ heavyWaste: TestData.HeavyWaste[0] });
      await orderPage.selectPublicPlacement();
      await orderPage.continueFromPlacementToOffers();
      await orderPage.verifyOfferAvailable('4');
      await orderPage.verifyOfferUnavailable('10', "Can't go on the road");
      await orderPage.verifyOfferUnavailable('20', "Can't go on the road");
      await orderPage.verifyUnavailableOfferCannotBeSelected('10');
      await orderPage.selectAvailableOffer('4');
    });
  });

  test('1.8 - Offers: heavy waste, combined rules, and in-place answer change (AC-20, AC-22, AC-23)', async () => {
    test.setTimeout(240000);

    await loginPage.goto(TestData.baseURL);
    await loginPage.login(TestData.credentials.customer.username, TestData.credentials.customer.password);
    await ensureCookieConsentDismissed(page);

    let offersUrl;

    await test.step('AC-22: A size ruled out by heavy waste or permit stays unavailable', async () => {
      await orderPage.navigateToPlacementStep({ heavyWaste: TestData.HeavyWaste[1] });
      await orderPage.selectPublicPlacement();
      await orderPage.continueFromPlacementToOffers();
      offersUrl = page.url();
      await orderPage.verifyOfferAvailable('4');
      await orderPage.verifyOfferUnavailable('20', "Can't go on the road");
      await orderPage.verifyOfferUnavailable('10');
      await orderPage.verifyUnavailableOfferCannotBeSelected('20');
    });

    await test.step('AC-23 / AC-20: Changing placement updates offers in place; heavy-only sizes stay locked', async () => {
      await orderPage.changePlacementAnswerFromUnavailableOffer('20', TestData.Placement[0]);
      await orderPage.verifyStillOnOffersStep(offersUrl);
      await orderPage.verifyOfferAvailable('20');
      await orderPage.verifyOfferUnavailable('10', "Can't take heavy waste");
      await orderPage.verifyUnavailableOfferCannotBeSelected('10');
    });

    await test.step('AC-23: Changing heavy waste from an unavailable offer unlocks matching sizes in place', async () => {
      await orderPage.changeHeavyWasteAnswerFromUnavailableOffer('10', TestData.HeavyWaste[0]);
      await orderPage.verifyStillOnOffersStep(offersUrl);
      await orderPage.verifyOfferAvailable('10');
      await orderPage.verifyNoUnavailableOffers();
      await orderPage.selectAvailableOffer('10');
    });
  });

  test('1.9 - Chargeable items and under-20 yard card payment (AC-25, AC-30)', async () => {
    test.setTimeout(480000);

    await loginPage.goto(TestData.baseURL);
    await loginPage.login(TestData.credentials.customer.username, TestData.credentials.customer.password);
    await ensureCookieConsentDismissed(page);

    let paidTotal;

    await test.step('AC-25: Extra chargeable items appear on the summary and in the total', async () => {
      await orderPage.navigateToPlacementStep({ chargeableItems: ['Double Mattress'] });
      await orderPage.selectPrivatePlacementWithoutPhoto();
      await orderPage.continueFromPlacementToOffers();
      await orderPage.continueFromSelectedOfferToPayment('4');
      const totals = await orderPage.verifyChargeableItemsOnOrderSummaryAndTotal(['Double Mattress']);
      paidTotal = totals.total;
    });

    await test.step('AC-30: Under-20 yard skip takes card or wallet payment and shows Payment Successful', async () => {
      await orderPage.verifyCardOrWalletPaymentRequired();
      await orderPage.completePayment();
      await orderPage.verifyPaymentSuccessful(paidTotal);
    });
  });

  test('1.10 - Plasterboard taken to the tip is not charged (AC-29)', async () => {
    test.setTimeout(240000);

    await loginPage.goto(TestData.baseURL);
    await loginPage.login(TestData.credentials.customer.username, TestData.credentials.customer.password);
    await ensureCookieConsentDismissed(page);

    await test.step('AC-29: Taking plasterboard to the tip adds no plasterboard extra', async () => {
      await orderPage.navigateToPlacementStep({ plasterBoard: TestData.PlasterBoard[1] });
      await orderPage.selectPrivatePlacementWithoutPhoto();
      await orderPage.continueFromPlacementToOffers();
      await orderPage.selectAvailableOffer('4');
      await orderPage.clickContinueOnSkipSelection();
      if (await orderPage.skipTarpNoBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
        await orderPage.dismissSkipTarpModal();
      }
      await orderPage.selectPlasterboardTakeToTip();
      await orderPage.verifyDateStepVisible();
      await orderPage.selectEarliestAvailableDeliveryAndCollection();
      await orderPage.continueFromDateStepToPayment();
      await orderPage.verifyNoPlasterboardExtraCharged();
    });
  });

  test('1.11 - No extras, RoRo place-order, and verification requirements (AC-26, AC-31, AC-32)', async () => {
    test.setTimeout(480000);

    await loginPage.goto(TestData.baseURL);
    await loginPage.login(TestData.credentials.customer.username, TestData.credentials.customer.password);
    await ensureCookieConsentDismissed(page);

    await test.step('AC-26: Booking continues with no extra chargeable lines when none are selected', async () => {
      await orderPage.navigateToPlacementStep();
      await orderPage.selectPrivatePlacementWithoutPhoto();
      await orderPage.continueFromPlacementToOffers();
      await orderPage.continueFromSelectedOfferToPayment('20');
      await orderPage.verifyNoChargeableItemsOnOrderSummary();
    });

    await test.step('AC-31: 20 yard or larger skip places the order without taking hire payment', async () => {
      await orderPage.verifyNoHirePaymentAtPlaceOrder();
      await orderPage.placeRoRoOrderWithoutHirePayment();
    });

    await test.step('AC-32: RoRo order requires ID, extra-tonnage agreement, and deposit before delivery', async () => {
      await orderPage.verifyRoRoVerificationRequirements();
    });
  });

  test('Customer message verification @chat', async () => {

    await loginPage.goto(TestData.baseURL);
    await loginPage.login(TestData.credentials.customer.username, TestData.credentials.customer.password);

    await test.step('Go to profile settings', async () => {
      await profilesettingpage.goToProfileSettingsPage()
    });

    await test.step('Verify Order Delivery Details', async () => {
      await dashboardPage.navigateToViewOrderDetails();
    });

    await test.step('Send Message', async () => {
      // await orderDeliveryDetailsPage.sendMessage({ messageType: 'preDefined' });
      await orderDeliveryDetailsPage.sendMessage({ messageType: 'custom', customText: 'Request to provide an update on my order.' + new Date() });
    });
  });

  test('Customer and Admin conversation verification @chat', async ({ browser }) => {
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
      const projectUse = test.info().project.use;
      const agentContext = await browser.newContext({
        ...projectUse,
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

  test('Verify search existing customer message functionality @chat', async () => {

    await loginPage.goto(TestData.baseURL);
    await loginPage.login(TestData.credentials.customer.username, TestData.credentials.customer.password);

    await test.step('Go to profile settings', async () => {
      await profilesettingpage.goToProfileSettingsPage()
    });

    await test.step('Verify Order Delivery Details', async () => {
      await dashboardPage.navigateToViewOrderDetails();
    });

    await test.step('Verify existing issue is correctly displayed', async () => {
      await orderDeliveryDetailsPage.verifySearchMessagesFunctionality();
    });

  });

  
  test('Verify Payment History', async () => {

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

  test('Add & remove image after placing an order', async () => {

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

  test('Site Contacts - guest user: Add site contact while placing an order', async () => {
    test.setTimeout(480000);
    let contact;
    let skipValues;
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
      skipValues = await orderPage.continueWaste(TestData.HeavyWaste[0], TestData.PlasterBoard[0]);
    });

    await test.step('Select item from the list', async () => {
      await orderPage.selectItemFromTheList();
    });

    await test.step('Permit check', async () => {
      await orderPage.permitCheck(TestData.Placement[0]);
    });

    await test.step('Select skip & property', async () => {
      //await orderPage.selectSkip(TestData.SkipSize[1], TestData.PlasterBoard[0], "No", "No", "No");
      //skipSize, Skiptarp, plasterBoardTypes
      await orderPage.selectSkip(TestData.SkipSize[1], "No", TestData.plasterBoardTypes[0], skipValues.HeavyWaste, skipValues.PlasterBoard);
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

  test('Site Contacts: Add site contact while placing an order', async () => {
    test.setTimeout(480000);
    let result, contact, skipValues;
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
      skipValues = await orderPage.continueWaste(TestData.HeavyWaste[0], TestData.PlasterBoard[0]);
    });

    await test.step('Select item from the list', async () => {
      await orderPage.selectItemFromTheList();
    });

    await test.step('Permit check', async () => {
      await orderPage.permitCheck(TestData.Placement[0]);
    });

    await test.step('Select skip & property', async () => {
      //await orderPage.selectSkip(TestData.SkipSize[1], TestData.PlasterBoard[0], "No", "No", "No");
      //skipSize, Skiptarp, plasterBoardTypes
      await orderPage.selectSkip(TestData.SkipSize[1], "No", TestData.plasterBoardTypes[0], skipValues.HeavyWaste, skipValues.PlasterBoard);
    });

    await test.step('Choose date', async () => {
      await orderPage.chooseDate(TestData.BookingDay[0]);
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

  test('Site Contacts: Select existing site contact while placing an order', async ({ },) => {
    test.setTimeout(480000);
    let result, contact, skipValues;
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
      skipValues = await orderPage.continueWaste(TestData.HeavyWaste[0], TestData.PlasterBoard[0]);
    });

    await test.step('Select item from the list', async () => {
      await orderPage.selectItemFromTheList();
    });

    await test.step('Permit check', async () => {
      await orderPage.permitCheck(TestData.Placement[0]);
    });

    await test.step('Select skip & property', async () => {
      //await orderPage.selectSkip(TestData.SkipSize[1], TestData.PlasterBoard[0], "No", "No", "No");
      //skipSize, Skiptarp, plasterBoardTypes
      await orderPage.selectSkip(TestData.SkipSize[1], "No", TestData.plasterBoardTypes[0], skipValues.HeavyWaste, skipValues.PlasterBoard);
    });

    await test.step('Choose date', async () => {
      await orderPage.chooseDate(TestData.BookingDay[0]);
    });

    await test.step('Complete payment', async () => {
      result = await orderPage.completePayment({ contactAction: 'Verify Existing Contact' });
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

  test(`Missed Collection for today's date`, async ({ browser }, testInfo) => {
    test.setTimeout(600000);
    let skipValues;
    let orderId;
    // console.log(`🧾 Running logged-in User's flow for:  ${TestData.postcodes[1]}, ${TestData.WasteType[1]}, Heavywaste -${TestData.HeavyWaste[0]}, Plasterboard -${TestData.PlasterBoard[0]}, Skipsize-${TestData.SkipSize[1]}, ${TestData.Placement[0]}`);

    await loginPage.goto(TestData.baseURL);
    await loginPage.login(TestData.credentials.customer.username, TestData.credentials.customer.password);

    await test.step('Enter postcode', async () => {
      await orderPage.enterPostcode(TestData.postcodes[1]);
    });

    await test.step('Select waste type', async () => {
      await orderPage.selectWaste(TestData.WasteType[1]);
    });

    await test.step('Continue waste type', async () => {
      skipValues = await orderPage.continueWaste(TestData.HeavyWaste[0], TestData.PlasterBoard[0]);
    });

    await test.step('Select item from the list', async () => {
      await orderPage.selectItemFromTheList();
    });

    await test.step('Permit check', async () => {
      await orderPage.permitCheck(TestData.Placement[0]);
    });

    await test.step('Select skip & property', async () => {
      //await orderPage.selectSkip(TestData.SkipSize[1], TestData.PlasterBoard[0], "No", "No", "No");
      //skipSize, Skiptarp, plasterBoardTypes
      await orderPage.selectSkip(TestData.SkipSize[1], "No", TestData.plasterBoardTypes[0], skipValues.HeavyWaste, skipValues.PlasterBoard);
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
      orderId = await dashboardPage.navigateToViewOrderDetails();
    });

    await test.step('Supplier takes the order and marks delivered', async () => {
      await supplierTakeOrder(browser, testInfo, orderId, { markDelivered: true });
    });

    await test.step('Customer confirms delivery', async () => {
      await page.reload();
      await page.waitForTimeout(2000);
      await orderDeliveryDetailsPage.confirmTodaysDelivery();
    });

    await test.step(`Confirm and verify missed collection`, async () => {
      await page.reload();
      await page.waitForTimeout(2000);
      await orderDeliveryDetailsPage.missedCollection();
    });

  });

  test('Confirm skip collection', async ({ browser }, testInfo) => {
    test.setTimeout(600000);
    let skipValues;
    let orderId;
    //console.log(`🧾 Running logged-in User's flow for:  ${TestData.postcodes[1]}, ${TestData.WasteType[1]}, Heavywaste -${TestData.HeavyWaste[0]}, Plasterboard -${TestData.PlasterBoard[0]}, Skipsize-${TestData.SkipSize[1]}, ${TestData.Placement[0]}`);

    await loginPage.goto(TestData.baseURL);
    await loginPage.login(TestData.credentials.customer.username, TestData.credentials.customer.password);

    await test.step('Enter postcode', async () => {
      await orderPage.enterPostcode(TestData.postcodes[1]);
    });

    await test.step('Select waste type', async () => {
      await orderPage.selectWaste(TestData.WasteType[1]);
    });

    await test.step('Continue waste type', async () => {
      skipValues = await orderPage.continueWaste(TestData.HeavyWaste[0], TestData.PlasterBoard[0]);
    });

    await test.step('Select item from the list', async () => {
      await orderPage.selectItemFromTheList();
    });

    await test.step('Permit check', async () => {
      await orderPage.permitCheck(TestData.Placement[0]);
    });

    await test.step('Select skip & property', async () => {
      // await orderPage.selectSkip(TestData.SkipSize[1], TestData.PlasterBoard[0], "No", "No", "No");
      //skipSize, Skiptarp, plasterBoardTypes
      await orderPage.selectSkip(TestData.SkipSize[1], "No", TestData.plasterBoardTypes[0], skipValues.HeavyWaste, skipValues.PlasterBoard);
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
      orderId = await dashboardPage.navigateToViewOrderDetails();
    });

    await test.step('Supplier takes the order and marks delivered', async () => {
      await supplierTakeOrder(browser, testInfo, orderId, { markDelivered: true });
    });

    await test.step('Customer confirms delivery', async () => {
      await page.reload();
      await page.waitForTimeout(2000);
      await orderDeliveryDetailsPage.confirmTodaysDelivery();
    });

    await test.step('Confirm skip collection', async () => {
      await page.reload();
      await page.waitForTimeout(2000);
      await orderDeliveryDetailsPage.confirmCollection();
    });

  });

  test(`Missed Delivery for today's date`, async ({ browser }, testInfo) => {
    test.setTimeout(600000);
    let skipValues;
    let orderId;
    let dayNumber = new Date().getDate();
    //console.log(`🧾 Running logged-in User's flow for:  ${TestData.postcodes[1]}, ${TestData.WasteType[1]}, Heavywaste -${TestData.HeavyWaste[0]}, Plasterboard -${TestData.PlasterBoard[0]}, Skipsize-${TestData.SkipSize[1]}, ${TestData.Placement[0]}`);

    await loginPage.goto(TestData.baseURL);
    await loginPage.login(TestData.credentials.customer.username, TestData.credentials.customer.password);

    await test.step('Enter postcode', async () => {
      await orderPage.enterPostcode(TestData.postcodes[1]);
    });

    await test.step('Select waste type', async () => {
      await orderPage.selectWaste(TestData.WasteType[1]);
    });

    await test.step('Continue waste type', async () => {
      skipValues = await orderPage.continueWaste(TestData.HeavyWaste[0], TestData.PlasterBoard[0]);
    });

    await test.step('Select item from the list', async () => {
      await orderPage.selectItemFromTheList();
    });

    await test.step('Permit check', async () => {
      await orderPage.permitCheck(TestData.Placement[0]);
    });

    await test.step('Select skip & property', async () => {
      //await orderPage.selectSkip(TestData.SkipSize[1], TestData.PlasterBoard[0], "No", "No", "No");
      //skipSize, Skiptarp, plasterBoardTypes
      await orderPage.selectSkip(TestData.SkipSize[1], "No", TestData.plasterBoardTypes[0], skipValues.HeavyWaste, skipValues.PlasterBoard);
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
      orderId = await dashboardPage.navigateToViewOrderDetails();
    });

    await test.step('Supplier takes the order and marks delivered', async () => {
      await supplierTakeOrder(browser, testInfo, orderId, { markDelivered: true });
    });

    await test.step(`Mark and verify missed delivery for today's date`, async () => {
      await page.reload();
      await page.waitForTimeout(2000);
      await orderDeliveryDetailsPage.missedDelivery();
    });

  });
  
  test('Request collection outside 3 days free limit and pay for difference', async ({ browser }, testInfo) => {
    test.setTimeout(600000);
    let skipValues;
    let orderId;
    // console.log(`🧾 Running Guest flow for:  ${TestData.postcodes[1]}, ${TestData.WasteType[1]}, Heavywaste -${TestData.HeavyWaste[0]}, Plasterboard -${TestData.PlasterBoard[0]}, Skipsize-${TestData.SkipSize[1]}, ${TestData.Placement[0]}`);

    await loginPage.goto(TestData.baseURL);
    await loginPage.login(TestData.credentials.customer.username, TestData.credentials.customer.password);

    await test.step('Enter postcode', async () => {
      await orderPage.enterPostcode(TestData.postcodes[1]);
    });

    await test.step('Select waste type', async () => {
      await orderPage.selectWaste(TestData.WasteType[1]);
    });

    await test.step('Continue waste type', async () => {
      skipValues = await orderPage.continueWaste(TestData.HeavyWaste[0], TestData.PlasterBoard[0]);
    });

    await test.step('Select item from the list', async () => {
      await orderPage.selectItemFromTheList();
    });

    await test.step('Permit check', async () => {
      await orderPage.permitCheck(TestData.Placement[0]);
    });

    await test.step('Select skip & property', async () => {
      //  await orderPage.selectSkip(TestData.SkipSize[1], TestData.PlasterBoard[0], "No", "No", "No");
      //skipSize, Skiptarp, plasterBoardTypes
      await orderPage.selectSkip(TestData.SkipSize[1], "No", TestData.plasterBoardTypes[0], skipValues.HeavyWaste, skipValues.PlasterBoard);
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
      orderId = await dashboardPage.navigateToViewOrderDetails();
    });

    await test.step('Supplier takes the order and marks delivered', async () => {
      await supplierTakeOrder(browser, testInfo, orderId, { markDelivered: true });
    });

    await test.step('Customer confirms delivery', async () => {
      await page.reload();
      await page.waitForTimeout(2000);
      await orderDeliveryDetailsPage.confirmTodaysDelivery();
    });

    await test.step('Request collection', async () => {
      await page.reload();
      await page.waitForTimeout(2000);
      await orderDeliveryDetailsPage.requestCollection("no");
    });

  });

  test('Request collection within 3 days free limit', async ({ browser }, testInfo) => {
    test.setTimeout(600000);
    let skipValues;
    let orderId;
    //console.log(`🧾 Running Guest flow for:  ${TestData.postcodes[2]}, ${TestData.WasteType[1]}, Heavywaste -${TestData.HeavyWaste[0]}, Plasterboard -${TestData.PlasterBoard[0]}, Skipsize-${TestData.SkipSize[1]}, ${TestData.Placement[0]}`);

    await loginPage.goto(TestData.baseURL);
    await loginPage.login(TestData.credentials.customer.username, TestData.credentials.customer.password);

    await test.step('Enter postcode', async () => {
      await orderPage.enterPostcode(TestData.postcodes[1]);
    });

    await test.step('Select waste type', async () => {
      await orderPage.selectWaste(TestData.WasteType[1]);
    });

    await test.step('Continue waste type', async () => {
      skipValues = await orderPage.continueWaste(TestData.HeavyWaste[0], TestData.PlasterBoard[0]);
    });

    await test.step('Select item from the list', async () => {
      await orderPage.selectItemFromTheList();
    });

    await test.step('Permit check', async () => {
      await orderPage.permitCheck(TestData.Placement[0]);
    });

    await test.step('Select skip & property', async () => {
      //await orderPage.selectSkip(TestData.SkipSize[1], TestData.PlasterBoard[0], "No", "No", "No");
      //skipSize, Skiptarp, plasterBoardTypes
      await orderPage.selectSkip(TestData.SkipSize[1], "No", TestData.plasterBoardTypes[0], skipValues.HeavyWaste, skipValues.PlasterBoard);
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
      orderId = await dashboardPage.navigateToViewOrderDetails();
    });

    await test.step('Supplier takes the order and marks delivered', async () => {
      await supplierTakeOrder(browser, testInfo, orderId, { markDelivered: true });
    });

    await test.step('Customer confirms delivery', async () => {
      await page.reload();
      await page.waitForTimeout(2000);
      await orderDeliveryDetailsPage.confirmTodaysDelivery();
    });

    await test.step('Request collection', async () => {
      await page.reload();
      await page.waitForTimeout(2000);
      await orderDeliveryDetailsPage.requestCollection("yes");
    });

  });


  test(`Confirm Delivery for today's date`, async ({ browser }, testInfo) => {
    test.setTimeout(600000);
    let skipValues;
    let orderId;
    //console.log(`🧾 Running logged-in User's flow for:  ${TestData.postcodes[1]}, ${TestData.WasteType[1]}, Heavywaste -${TestData.HeavyWaste[0]}, Plasterboard -${TestData.PlasterBoard[0]}, Skipsize-${TestData.SkipSize[1]}, ${TestData.Placement[0]}`);

    await loginPage.goto(TestData.baseURL);
    await loginPage.login(TestData.credentials.customer.username, TestData.credentials.customer.password);

    await test.step('Enter postcode', async () => {
      await orderPage.enterPostcode(TestData.postcodes[1]);
    });

    await test.step('Select waste type', async () => {
      await orderPage.selectWaste(TestData.WasteType[1]);
    });

    await test.step('Continue waste type', async () => {
      skipValues = await orderPage.continueWaste(TestData.HeavyWaste[0], TestData.PlasterBoard[0]);
    });

    await test.step('Select item from the list', async () => {
      await orderPage.selectItemFromTheList();
    });

    await test.step('Permit check', async () => {
      await orderPage.permitCheck(TestData.Placement[0]);
    });

    await test.step('Select skip & property', async () => {
      //await orderPage.selectSkip(TestData.SkipSize[1], TestData.PlasterBoard[0], "No", "No", "No");
      //skipSize, Skiptarp, plasterBoardTypes
      await orderPage.selectSkip(TestData.SkipSize[1], "No", TestData.plasterBoardTypes[0], skipValues.HeavyWaste, skipValues.PlasterBoard);
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
      orderId = await dashboardPage.navigateToViewOrderDetails();
    });

    await test.step('Supplier takes the order and marks delivered', async () => {
      await supplierTakeOrder(browser, testInfo, orderId, { markDelivered: true });
    });

    await test.step(`Verify today's delivery confirmed on customer order details`, async () => {
      await page.reload();
      await page.waitForTimeout(2000);
      await orderDeliveryDetailsPage.confirmTodaysDelivery();
      await expect(
        orderDeliveryDetailsPage.verifyConfirmDeliveryLabel
          .or(page.getByText('Delivery Confirmed'))
          .or(page.getByRole('button', { name: /^Delivered$/ }))
          .first()
      ).toBeVisible({ timeout: 15000 });
    });

  });

  test('Edit User Profile', async () => {
    await test.step('Go to profile settings', async () => {
      await loginPage.goto(TestData.baseURL);
      await loginPage.login(TestData.credentials.customer.username, TestData.credentials.customer.password);
      await profilesettingpage.goToProfileSettingsPage();
    });

    await test.step('Edit profile details', async () => {
      await profilesettingpage.editProfileSettings("Maitray", "Bhatt", "1333444355");
    });

  });

  test('Place an order for Wrong Skip Guarantee and login with existing user', async () => {
    test.setTimeout(480000);
    let skipValues;
    //console.log(`🧾 Running Guest flow for:  ${TestData.postcodes[1]}, ${TestData.WasteType[1]}, Heavywaste -${TestData.HeavyWaste[0]}, Plasterboard -${TestData.PlasterBoard[0]}, Skipsize-${TestData.SkipSize[3]}, ${TestData.Placement[1]}`);

    await loginPage.goto(TestData.baseURL);

    await test.step('Enter postcode', async () => {
      await orderPage.enterPostcode(TestData.postcodes[1]);
    });

    await test.step('Select waste type', async () => {
      await orderPage.selectWaste(TestData.WasteType[1]);
    });

    await test.step('Continue waste type', async () => {
      skipValues = await orderPage.continueWaste(TestData.HeavyWaste[0], TestData.PlasterBoard[0]);
    });

    await test.step('Select item from the list', async () => {
      await orderPage.selectItemFromTheList();
    });

    await test.step('Permit check', async () => {
      await orderPage.permitCheck(TestData.Placement[0]);
    });

    await test.step('Select skip, add Wrong Skip Guarantee, continue', async () => {
      const selected = await orderPage.selectSkipSizeOnly(TestData.SkipSize[0]);
      console.log('Selected skip:', selected);
      await orderPage.wrongSkipSelection();
      await orderPage.clickContinueOnSkipSelection();
      if (await orderPage.skipTarpNoBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
        await orderPage.skipTarpNoBtn.click();
      }
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
      if (!(await orderDeliveryDetailsPage.verifyWrongSkipGuaranteeLabel.isVisible({ timeout: 3000 }).catch(() => false))) {
        await orderDeliveryDetailsPage.openFinancialsTab();
      }
      await orderDeliveryDetailsPage.verifyWrongSkipGuaranteeLabel.scrollIntoViewIfNeeded();
      await expect(orderDeliveryDetailsPage.verifyWrongSkipGuaranteeLabel).toBeVisible();
    });

  });

  test('Upgrading skip for logged-in user', async () => {
    test.setTimeout(480000);
    let skipValues;

    await loginPage.goto(TestData.baseURL);
    await loginPage.login(TestData.credentials.customer.username, TestData.credentials.customer.password);

    await test.step('Enter postcode', async () => {
      await orderPage.enterPostcode(TestData.postcodes[1]);
    });

    await test.step('Select waste type', async () => {
      await orderPage.selectWaste(TestData.WasteType[1]);
    });

    await test.step('Continue waste type', async () => {
      skipValues = await orderPage.continueWaste(TestData.HeavyWaste[0], TestData.PlasterBoard[0]);
    });

    await test.step('Select item from the list', async () => {
      await orderPage.selectItemFromTheList();
    });

    await test.step('Permit check', async () => {
      await orderPage.permitCheck(TestData.Placement[0]);
    });

    await test.step('Select skip & property', async () => {
      await orderPage.selectSkip(TestData.SkipSize[0], "No", TestData.plasterBoardTypes[0], skipValues.HeavyWaste, skipValues.PlasterBoard);
    });

    await test.step('Choose date', async () => {
      await orderPage.chooseDate(TestData.BookingDay[0]);
    });

    await test.step('Complete payment', async () => {
      await orderPage.completePayment();
    });

    await test.step('Navigate to the new order and upgrade skip', async () => {
      await dashboardPage.gotoSuccessPage();
      await dashboardPage.navigateToViewOrderDetails();
      await orderDeliveryDetailsPage.upgradeSkip();
      await orderDeliveryDetailsPage.openActivityTab();
      await orderDeliveryDetailsPage.upgradeSkipRefundRequestedLog.scrollIntoViewIfNeeded();
      await expect(orderDeliveryDetailsPage.upgradeSkipRefundRequestedLog).toBeVisible();
    });
  });

  test('Downgrading skip for logged-in user @smoke', async () => {
    test.setTimeout(480000);
    let skipValues;

    await loginPage.goto(TestData.baseURL);
    await loginPage.login(TestData.credentials.customer.username, TestData.credentials.customer.password);

    await test.step('Enter postcode', async () => {
      await orderPage.enterPostcode(TestData.postcodes[1]);
    });

    await test.step('Select waste type', async () => {
      await orderPage.selectWaste(TestData.WasteType[1]);
    });

    await test.step('Continue waste type', async () => {
      skipValues = await orderPage.continueWaste(TestData.HeavyWaste[0], TestData.PlasterBoard[0]);
    });

    await test.step('Select item from the list', async () => {
      await orderPage.selectItemFromTheList();
    });

    await test.step('Permit check', async () => {
      await orderPage.permitCheck(TestData.Placement[0]);
    });

    await test.step('Select skip & property', async () => {
      await orderPage.selectSkip(TestData.SkipSize[2], "No", TestData.plasterBoardTypes[0], skipValues.HeavyWaste, skipValues.PlasterBoard);
    });

    await test.step('Choose date', async () => {
      await orderPage.chooseDate(TestData.BookingDay[0]);
    });

    await test.step('Complete payment', async () => {
      await orderPage.completePayment();
    });

    await test.step('Navigate to the new order and downgrade skip', async () => {
      await dashboardPage.gotoSuccessPage();
      await dashboardPage.navigateToViewOrderDetails();
      await orderDeliveryDetailsPage.downgradeSkip();
      await orderDeliveryDetailsPage.openActivityTab();
      await orderDeliveryDetailsPage.downgradeRefundRequestedLog.scrollIntoViewIfNeeded();
      await expect(orderDeliveryDetailsPage.downgradeRefundRequestedLog).toBeVisible();
    });
  });

  test('Place order and add 2 Tonne bags @smoke', async () => {
    test.setTimeout(480000);
    let skipValues;
    //console.log(`🧾 Running Guest flow for:  ${TestData.postcodes[1]}, ${TestData.WasteType[1]}, Heavywaste -${TestData.HeavyWaste[0]}, Plasterboard -${TestData.PlasterBoard[0]}, Skipsize-${TestData.SkipSize[2]}, ${TestData.Placement[0]}`);

    await loginPage.goto(TestData.baseURL);

    await test.step('Enter postcode', async () => {
      await orderPage.enterPostcode(TestData.postcodes[1]);
    });

    await test.step('Select waste type', async () => {
      await orderPage.selectWaste(TestData.WasteType[1]);
    });

    await test.step('Continue waste type', async () => {
      skipValues = await orderPage.continueWaste(TestData.HeavyWaste[0], TestData.PlasterBoard[0]);
    });

    await test.step('Select item from the list', async () => {
      await orderPage.selectItemFromTheList();
    });

    await test.step('Permit check', async () => {
      await orderPage.permitCheck(TestData.Placement[0]);
    });

    await test.step('Select skip & property', async () => {
      //skipSize, Skiptarp, Plasterboard
      await orderPage.selectSkip(TestData.SkipSize[2], "No", TestData.plasterBoardTypes[0], skipValues.HeavyWaste, skipValues.PlasterBoard);
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

  test('Change billing address and place order @smoke', async () => {
    test.setTimeout(480000);
    // console.log(`🧾 Running Guest flow for:  ${TestData.postcodes[1]}, ${TestData.WasteType[0]}, Heavywaste -${TestData.HeavyWaste[0]}, Plasterboard -${TestData.PlasterBoard[0]}, Skipsize-${TestData.SkipSize[0]}, ${TestData.Placement[0]}`);

    await loginPage.goto(TestData.baseURL);

    await test.step('Enter postcode', async () => {
      await orderPage.enterPostcode(TestData.postcodes[1]);
    });

    await test.step('Select waste type', async () => {
      await orderPage.selectWaste(TestData.WasteType[0]);
    });

    await test.step('Continue waste type', async () => {
      await orderPage.continueWaste(TestData.HeavyWaste[0], TestData.PlasterBoard[0]);
    });

    await test.step('Select item from the list', async () => {
      await orderPage.selectItemFromTheList();
    });

    await test.step('Permit check', async () => {
      await orderPage.permitCheck(TestData.Placement[0]);
    });

    await test.step('Select skip & property', async () => {
      await orderPage.selectSkip(TestData.SkipSize[0], TestData.PlasterBoard[0], "No", "No", "No");
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

  test('Place order and add road permit @smoke', async () => {
    test.setTimeout(480000);
    try {
      let skipValues;
      //console.log(`🧾 Running Guest flow for:  ${TestData.postcodes[0]}, ${TestData.WasteType[0]}, Heavywaste -${TestData.HeavyWaste[0]}, Plasterboard -${TestData.PlasterBoard[0]}, Skipsize-${TestData.SkipSize[0]}, ${TestData.Placement[0]}`);

      await loginPage.goto(TestData.baseURL);

      await test.step('Enter postcode', async () => {
        await orderPage.enterPostcode(TestData.postcodes[0]);
      });

      await test.step('Select waste type', async () => {
        await orderPage.selectWaste(TestData.WasteType[0]);
      });

      await test.step('Continue waste type', async () => {
        skipValues = await orderPage.continueWaste(TestData.HeavyWaste[0], TestData.PlasterBoard[0]);
      });

      await test.step('Select item from the list', async () => {
        await orderPage.selectItemFromTheList();
      });

      await test.step('Permit check', async () => {
        await orderPage.permitCheck(TestData.Placement[0]);
      });

      await test.step('Select skip & property', async () => {
        //skipSize, Skiptarp, Plasterboard
        await orderPage.selectSkip(TestData.SkipSize[0], "No", TestData.plasterBoardTypes[0], skipValues.HeavyWaste, skipValues.PlasterBoard);
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
        await orderDeliveryDetailsPage.openFinancialsTab();
        await expect(orderDeliveryDetailsPage.roadpermitFeeLbl).toBeVisible();
        await orderDeliveryDetailsPage.openActivityTab();
        const permitHistory = orderDeliveryDetailsPage.verifyOrderHistoryForAddedPermit
          .or(page.getByText(/Road Permit/i));
        await permitHistory.first().scrollIntoViewIfNeeded();
        await expect(permitHistory.first()).toBeVisible();
      });

      await test.step('Order Placement Email Verification', async () => {
        await genFunctions.goToYopmail();
        await genFunctions.accessInbox(TestData.credentials.customer.username);
        await genFunctions.checkOrderEmailReceived(orderPage);
      });
    }
    catch (error) {
      console.log(error);
      throw error;
    }

  });

  test('Start order as guest and logs in with existing account @smoke', async () => {
    test.setTimeout(480000);
    try {
      let skipValues;
      // console.log(`🧾 Running Guest flow for:  ${TestData.postcodes[0]}, ${TestData.WasteType[0]}, Heavywaste -${TestData.HeavyWaste[0]}, Plasterboard -${TestData.PlasterBoard[0]}, ${TestData.Placement[2]}, Skipsize-${TestData.SkipSize[0]}`);

      await loginPage.goto(TestData.baseURL);

      await test.step('Enter postcode', async () => {
        await orderPage.enterPostcode(TestData.postcodes[0]);
      });

      await test.step('Select waste type', async () => {
        await orderPage.selectWaste(TestData.WasteType[0]);
      });

      await test.step('Continue waste type', async () => {
        skipValues = await orderPage.continueWaste(TestData.HeavyWaste[0], TestData.PlasterBoard[0]);
      });

      await test.step('Select item from the list', async () => {
        await orderPage.selectItemFromTheList();
      });

      await test.step('Permit check', async () => {
        await orderPage.permitCheck(TestData.Placement[0]);
      });

      await test.step('Select skip & property', async () => {
        //await orderPage.selectSkip(randomRow.SkipSize, randomRow.PlasterBoard, randomRow.ToneBag, randomRow.SelfDispose);
        //skipSize, Skiptarp, Plasterboard
        await orderPage.selectSkip(TestData.SkipSize[0], "No", TestData.plasterBoardTypes[0], skipValues.HeavyWaste, skipValues.PlasterBoard);
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
    }
    catch (error) {
      console.log(error);
      throw error;
    }
  });

  test('Place an order as Guest User @smoke', async () => {
    test.setTimeout(480000);
    let skipValues;
    // ✅ Get random CSV row at runtime
    //const randomRow = getRandomRow(csvPath);
    // console.log(`🧾 Running Guest flow for:  ${randomRow.Postcodes}, ${randomRow.WasteType}, Heavywaste -${randomRow.HeavyWaste}, Plasterboard -${randomRow.PlasterBoard}, Skipsize-${randomRow.SkipSize}, ${randomRow.Placement}`);
    try {
      //console.log(`🧾 Running Guest flow for:  ${TestData.postcodes[0]}, ${TestData.WasteType[0]}, Heavywaste -${TestData.HeavyWaste[0]}, Plasterboard -${TestData.PlasterBoard[1]}, ${TestData.Placement[1]}, Skipsize-${TestData.SkipSize[1]}, Plasterboard -${TestData.plasterBoardTypes[2]}`);

      await loginPage.goto(TestData.baseURL);

      await test.step('Enter postcode', async () => {
        await orderPage.enterPostcode(TestData.postcodes[0]);
      });

      await test.step('Select waste type', async () => {
        await orderPage.selectWaste(TestData.WasteType[0]);
      });

      await test.step('Continue waste type', async () => {
        skipValues = await orderPage.continueWaste(TestData.HeavyWaste[0], TestData.PlasterBoard[0]);
      });

      await test.step('Select item from the list', async () => {
        await orderPage.selectItemFromTheList();
      });

      await test.step('Permit check', async () => {
        await orderPage.permitCheck(TestData.Placement[0]);
      });

      await test.step('Select skip & property', async () => {
        await orderPage.selectSkip(TestData.SkipSize[0], "No", TestData.plasterBoardTypes[0], skipValues.HeavyWaste, skipValues.PlasterBoard);
      });

      await test.step('Choose date', async () => {
        await orderPage.chooseDate(TestData.BookingDay[0]);
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

      await test.step('Close commercial pop up if visible', async () => {
        await dashboardPage.takeActionOnCommercialAccountPopUp();
      });

      await test.step('Verify Order Delivery Details', async () => {
        await dashboardPage.navigateToViewOrderDetails();
        await orderDeliveryDetailsPage.verifyOrderDeliveryDetails();
      });
    }
    catch (error) {
      console.log(error);
      throw error;
    }
  });

  test('Place an order as Logged-in User @smoke', async () => {
    test.setTimeout(480000);
    let skipValues;

    await test.step('Sign up new user', async () => {
      await loginPage.goto(TestData.baseURL);
      await signUpPage.navigateToSignUpPage();
      await signUpPage.fillSignUpForm();
      await signUpPage.verifyRegistrationSuccess();
    });

    await test.step('Login to application', async () => {
      await loginPage.login(signUpPage.emailAddress, signUpPage.randomPassword);
      // console.log(`🧾 Running Logged-in flow for:  ${TestData.postcodes[0]}, ${TestData.WasteType[0]}, Heavywaste -${TestData.HeavyWaste[1]}, Plasterboard -${TestData.PlasterBoard[1]}, ${TestData.Placement[0]}, Skipsize-${TestData.SkipSize[0]}, Plasterboard -${TestData.plasterBoardTypes[0]}`);
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
      skipValues = await orderPage.continueWaste(TestData.HeavyWaste[1], TestData.PlasterBoard[1]);
    });

    await test.step('Select item from the list', async () => {
      await orderPage.selectItemFromTheList();
    });

    await test.step('Permit check', async () => {
      //await orderPage.permitCheck(randomRow.Placement);
      await orderPage.permitCheck(TestData.Placement[0]);
    });

    await test.step('Select skip & property', async () => {
      //skipSize, Skiptarp, plasterBoardTypes
      await orderPage.selectSkip(TestData.SkipSize[0], "No", TestData.plasterBoardTypes[0], skipValues.HeavyWaste, skipValues.PlasterBoard);
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

test.describe('Supplier Take Order', () => {
  test.setTimeout(180000);

  test('Supplier takes an order from available orders', async ({ browser }, testInfo) => {
    test.setTimeout(600000);
    await supplierTakeOrder(browser, testInfo);
  });
});

test.afterEach(async () => {
  // Only close the customer context after all pages have finished using it
  await context?.close();

});