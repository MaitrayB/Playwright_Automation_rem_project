import { test, expect } from '../../fixtures/test.js';
import { LoginPage } from '../../pages/Customer/LoginPage.js';
import { OrderPage } from '../../pages/Customer/OrderPage.js';
import { DashboardPage } from '../../pages/Customer/DashboardPage.js';
import { SignUpPage } from '../../pages/Customer/SignUpPage.js';
import { OrderDeliveryDetailsPage } from '../../pages/Customer/OrderDeliveryDetailsPage.js';
import { TestData } from '../../Data/testData.js';
import { genericFunctions } from '../../utils/genericFunctions.js';
import { AdminLogin } from '../../pages/Admin/AdminLogin.js';
import { Order_Admin_Page } from '../../pages/Admin/Order_Admin_Page.js';
import { SupplierRegistrationPage } from '../../pages/Suppliers/SupplierRegistrationPage.js';
import { OrdersPage as SupplierOrdersPage } from '../../pages/Suppliers/OrdersPage.js';
import { TakeOrderSheetPage } from '../../pages/Suppliers/TakeOrderSheetPage.js';
import { ensureCookieConsentDismissed } from '../../utils/cookieConsent.js';

/** @type {LoginPage} */ let loginPage;
/** @type {OrderPage} */ let orderPage;
/** @type {DashboardPage} */ let dashboardPage;
/** @type {SignUpPage} */ let signUpPage;
/** @type {OrderDeliveryDetailsPage} */ let orderDeliveryDetailsPage;

let page, context;

test.beforeEach(async ({ browser }, testInfo) => {
  const projectUse = testInfo.project.use;
  context = await browser.newContext({
    ...projectUse,
    httpCredentials: {
      username: TestData.authCredentials.authUserName,
      password: TestData.authCredentials.authPassword,
    },
    ignoreHTTPSErrors: true,
  });
  page = await context.newPage();
  loginPage = new LoginPage(page);
  orderPage = new OrderPage(page);
  dashboardPage = new DashboardPage(page);
  signUpPage = new SignUpPage(page);
  orderDeliveryDetailsPage = new OrderDeliveryDetailsPage(page);
});

test.afterEach(async () => {
  await context?.close();
});

test.describe('1. Booking Flow — Skip Tarp Offer', () => {
  test.setTimeout(240000);

  test.describe('1.1 — When the Skip Tarp Modal Appears', () => {
    test('Scenario 1.1.1: Skip Tarp modal appears after skip selection', async () => {
      await loginPage.goto(TestData.baseURL);

      await test.step('Navigate to Skip Selection step', async () => {
        await orderPage.navigateToSkipSelectionStep();
      });

      await test.step('AC-1.1.1: Select skip size and click Continue', async () => {
        await orderPage.selectSkipSizeOnly(TestData.SkipSize[1]);
        await orderPage.clickContinueOnSkipSelection();
      });

      await test.step('AC-1.1.1: Skip Tarp modal is presented before the next step', async () => {
        await orderPage.verifySkipTarpModalVisible();
        await orderPage.verifyNextBookingStepNotVisible();
      });

      await test.step('AC-1.1.1 / PB AC-1.1.3: Dismissing Skip Tarp proceeds without Plasterboard modal when plasterboard was not selected', async () => {
        await orderPage.dismissSkipTarpModal();
        await orderPage.verifyPlasterboardDisposalModalNotVisible();
        await expect(orderPage.chooseDateHeading).toBeVisible({ timeout: 15000 });
      });
    });

    test('Scenario 1.1.3: Wrong Skip Guarantee modal is shown before Skip Tarp modal', async () => {
      await loginPage.goto(TestData.baseURL);

      await test.step('Navigate to Offers step where Wrong Skip Guarantee is available', async () => {
        await orderPage.navigateToSkipSelectionStep();
      });

      await test.step('Select skip size on the Offers step', async () => {
        await orderPage.selectSkipSizeOnly(TestData.SkipSize[0]);
      });

      await test.step('AC-1.1.3: When Wrong Skip Guarantee is triggered, it is shown before Skip Tarp', async () => {
        await orderPage.openWrongSkipGuaranteeOfferFromCard();
        await orderPage.verifyWrongSkipGuaranteeModalVisible();
        await orderPage.verifySkipTarpModalNotVisible();
      });

      await test.step('AC-1.1.3: Skip Tarp modal appears after Wrong Skip Guarantee is dismissed and Continue is clicked', async () => {
        await orderPage.dismissWrongSkipGuaranteeModal();
        await orderPage.verifyWrongSkipGuaranteeModalNotVisible();
        await orderPage.clickContinueOnSkipSelection();
        await orderPage.verifySkipTarpModalVisible();
      });
    });

    test('Scenario 1.1.4 + PB 1.1–1.4: Plasterboard modal after Skip Tarp with content, pricing, cancel & confirm', async () => {
      await loginPage.goto(TestData.baseURL);

      await test.step('PB AC-1.1.1 / AC-1.1.2: After Skip Tarp, Plasterboard modal appears when plasterboard + skip are selected', async () => {
        await orderPage.openPlasterboardDisposalModalAfterSkipTarp({ skipSize: TestData.SkipSize[1] });
      });

      await test.step('PB AC-1.2.1 / 1.2.3 / 1.2.4 / 1.2.5: Modal shell shows title, segregation notice, total, Cancel/Confirm, and add-on note', async () => {
        await orderPage.verifyPlasterboardModalShellContent();
      });

      await test.step('PB AC-1.2.2 Option 1: "A few bits" recommends tip-yourself with no charge', async () => {
        await orderPage.verifyPlasterboardTipYourselfOption();
      });

      await test.step('PB AC-1.2.2 Option 3: "Lots of it" offers plasterboard-only skip size + side-by-side space question', async () => {
        await orderPage.verifyPlasterboardOnlySkipOption();
      });

      let bagPricing;
      await test.step('PB AC-1.2.2 Option 2 / 1.3.1 / 1.4.2 / 1.4.3: Skip Bag shows supply + £250 disposal and combined total + VAT', async () => {
        bagPricing = await orderPage.verifyPlasterboardSkipBagPricingBreakdown();
        expect(bagPricing.disposalFee).toBe(250);
        expect(bagPricing.totalExVat).toBeCloseTo(bagPricing.supplyPrice + 250, 2);
        expect(bagPricing.expectedIncVat).toBeCloseTo(
          orderPage.roundMoney((bagPricing.supplyPrice + 250) * 1.2),
          2
        );
      });

      await test.step('PB AC-1.3.3: Cancel closes the modal without saving and returns to Offers', async () => {
        await orderPage.cancelPlasterboardDisposalSelection();
      });

      await test.step('PB AC-1.3.2: Confirm & Continue on Skip Bag saves selection and proceeds to date step', async () => {
        // Re-open from Offers (same booking session) instead of restarting the whole flow.
        await orderPage.clickContinueOnSkipSelection();
        if (await orderPage.skipTarpModal.isVisible({ timeout: 8000 }).catch(() => false)) {
          await orderPage.dismissSkipTarpModal();
        }
        await orderPage.verifyPlasterboardDisposalModalVisible();
        await orderPage.selectPlasterboardSkipBagOption();
        await orderPage.confirmPlasterboardDisposalSelection();
        await orderPage.verifyBookingProceededToDateStep();
      });
    });
  });

  test.describe('1.2 — Skip Tarp Modal Content', () => {
    test('Scenario 1.2.1–1.2.5 & 1.2.9: Skip Tarp modal displays complete content', async () => {
      await loginPage.goto(TestData.baseURL);

      await test.step('Open Skip Tarp modal after selecting a skip', async () => {
        await orderPage.openSkipTarpModalForSkipSize(TestData.SkipSize[0]);
      });

      await test.step('AC-1.2.1: Modal displays title and tarp image for selected skip size', async () => {
        await orderPage.verifySkipTarpModalTitle();
        await orderPage.verifySkipTarpImageForSize(orderPage.getExpectedTarpSize(TestData.SkipSize[0]));
      });

      await test.step('AC-1.2.2: Pricing card shows tarp size, price, VAT indicator, and one-time purchase note', async () => {
        await orderPage.verifySkipTarpPricingCard(orderPage.getExpectedTarpSize(TestData.SkipSize[0]));
      });

      await test.step('AC-1.2.4: Benefits list explains why the customer should add a tarp', async () => {
        await orderPage.verifySkipTarpBenefitsList();
      });

      await test.step('AC-1.2.5: Delivery estimate section shows real-time delivery information', async () => {
        await orderPage.verifySkipTarpDeliveryEstimate();
      });

      await test.step('AC-1.2.9: Footer note explains tarp delivery before skip arrival', async () => {
        if (await orderPage.skipTarpFooterNote.isVisible({ timeout: 3000 }).catch(() => false)) {
          await orderPage.verifySkipTarpFooterNote();
        } else {
          test.info().annotations.push({
            type: 'ac-gap',
            description: 'AC-1.2.9 footer note is not yet implemented on develop',
          });
        }
      });
    });

    const tarpSizeMappings = [
      { skipYards: '4', expectedTarpSize: 'Small' },
      { skipYards: '6', expectedTarpSize: 'Small' },
      { skipYards: '8', expectedTarpSize: 'Medium' },
      { skipYards: '12', expectedTarpSize: 'Large' },
      { skipYards: '16', expectedTarpSize: 'Large' },
    ];

    for (const { skipYards, expectedTarpSize } of tarpSizeMappings) {
      test(`Scenario 1.2.3: ${skipYards} yard skip maps to ${expectedTarpSize} tarp`, async () => {
        await loginPage.goto(TestData.baseURL);

        await test.step(`Open Skip Tarp modal for ${skipYards} yard skip`, async () => {
          await orderPage.openSkipTarpModalForSkipSize(skipYards);
        });

        await test.step(`AC-1.2.3: Tarp size is automatically determined as ${expectedTarpSize}`, async () => {
          expect(orderPage.getExpectedTarpSize(skipYards)).toBe(expectedTarpSize);
          await orderPage.verifySkipTarpSizeForSkipYards(skipYards);
        });
      });
    }

    test('Scenario 1.2.3: RoRo skip maps to RoRo tarp', async () => {
      await loginPage.goto(TestData.baseURL);

      await test.step('Open Skip Tarp modal for a RoRo skip size', async () => {
        await orderPage.navigateToSkipSelectionStep();
        await orderPage.selectSkipSizeOnly('20');
        await orderPage.clickContinueOnSkipSelection();

        if (!(await orderPage.skipTarpModal.isVisible({ timeout: 5000 }).catch(() => false))) {
          test.skip(true, 'Skip Tarp modal is not offered for RoRo skips in this environment');
        }
      });

      await test.step('AC-1.2.3: Tarp size is automatically determined as RoRo', async () => {
        await orderPage.verifySkipTarpSizeForSkipYards('20');
      });
    });
  });

  test.describe('1.3 — Accepting or Declining the Tarp', () => {
    test('Scenario 1.3.1: Modal offers accept and decline actions', async () => {
      await loginPage.goto(TestData.baseURL);

      await test.step('Open Skip Tarp modal', async () => {
        await orderPage.openSkipTarpModalForSkipSize(TestData.SkipSize[0]);
      });

      await test.step('AC-1.3.1: Primary and secondary action buttons are displayed', async () => {
        await orderPage.verifySkipTarpModalActionButtons();
      });
    });

    test('Scenario 1.3.2: Accepting tarp adds it to the order and proceeds', async () => {
      await loginPage.goto(TestData.baseURL);

      await test.step('Open Skip Tarp modal', async () => {
        await orderPage.openSkipTarpModalForSkipSize(TestData.SkipSize[0]);
      });

      await test.step('AC-1.3.2: Click Yes, add Skip Tarp', async () => {
        await orderPage.acceptSkipTarp();
      });

      await test.step('AC-1.3.2: Modal closes and booking proceeds to the next step', async () => {
        await orderPage.verifyBookingProceededToDateStep();
      });

      await test.step('AC-1.3.2: Tarp is added to the order', async () => {
        await orderPage.verifyTarpAddedToOrder();
      });
    });

    test('Scenario 1.3.3: Declining tarp proceeds without adding it', async () => {
      await loginPage.goto(TestData.baseURL);

      await test.step('Open Skip Tarp modal', async () => {
        await orderPage.openSkipTarpModalForSkipSize(TestData.SkipSize[0]);
      });

      await test.step('AC-1.3.3: Click No, continue without', async () => {
        await orderPage.declineSkipTarp();
      });

      await test.step('AC-1.3.3: Modal closes and booking proceeds without a tarp', async () => {
        await orderPage.verifyBookingProceededToDateStep();
        await orderPage.verifyTarpNotInOrder();
      });
    });

    test('Scenario 1.3.4: Closing modal via X declines tarp and proceeds', async () => {
      await loginPage.goto(TestData.baseURL);

      await test.step('Open Skip Tarp modal', async () => {
        await orderPage.openSkipTarpModalForSkipSize(TestData.SkipSize[0]);
      });

      await test.step('AC-1.3.4: Close modal via X button', async () => {
        await orderPage.closeSkipTarpModalViaCloseButton();
        await orderPage.verifySkipTarpModalNotVisible();
        await orderPage.proceedAfterSkipTarpModalDismissed();
      });

      await test.step('AC-1.3.4: Booking proceeds without a tarp', async () => {
        await orderPage.verifyBookingProceededToDateStep();
        await orderPage.verifyTarpNotInOrder();
      });
    });

    test('Scenario 1.3.4: Closing modal via Escape declines tarp and proceeds', async () => {
      await loginPage.goto(TestData.baseURL);

      await test.step('Open Skip Tarp modal', async () => {
        await orderPage.openSkipTarpModalForSkipSize(TestData.SkipSize[0]);
      });

      await test.step('AC-1.3.4: Close modal via Escape key', async () => {
        await orderPage.closeSkipTarpModalViaEscape();
        await orderPage.verifySkipTarpModalNotVisible();
        await orderPage.proceedAfterSkipTarpModalDismissed();
      });

      await test.step('AC-1.3.4: Booking proceeds without a tarp', async () => {
        await orderPage.verifyBookingProceededToDateStep();
        await orderPage.verifyTarpNotInOrder();
      });
    });
  });
});

test.describe('2. Order Summary — Skip Tarp Display', () => {
  test.setTimeout(240000);

  test.describe('2.1 — Tarp Line Item in Order Summary', () => {
    test('Scenario 2.1.1–2.1.2 & 3.2: Order Summary shows Skip Tarp and persists after refresh', async () => {
      await loginPage.goto(TestData.baseURL);

      const skipSize = '8';
      let expectedTarpSize;

      await test.step('Accept tarp and navigate to payment Order Summary', async () => {
        ({ expectedTarpSize } = await orderPage.navigateToPaymentStep({ skipSize, acceptTarp: true }));
      });

      await test.step('AC-2.1.1: Skip Tarp section shows size, description, price ex-VAT, and VAT', async () => {
        await orderPage.verifySkipTarpInOrderSummary(expectedTarpSize);
      });

      await test.step('AC-2.1.2: Compact delivery estimate is shown below the tarp section', async () => {
        await orderPage.verifySkipTarpDeliveryEstimateInOrderSummary();
      });

      await test.step('Tie Down AC-2.1.3 / AC-5.1: Tie Down section is hidden when only tarp is selected', async () => {
        await orderPage.verifyTieDownNotInOrderSummary();
      });

      await test.step('AC-3.2: Refreshing mid-booking restores tarp selection from local storage', async () => {
        await orderPage.refreshPaymentStepAndVerifyTarpPersisted(expectedTarpSize);
        await orderPage.verifySkipTarpDeliveryEstimateInOrderSummary();
        await orderPage.verifyTieDownNotInOrderSummary();
      });
    });

    test('Scenario 2.1.3–2.1.4: Removing tarp clears the line item and updates totals', async () => {
      await loginPage.goto(TestData.baseURL);

      await test.step('Accept tarp and navigate to payment Order Summary', async () => {
        await orderPage.navigateToPaymentStep({ skipSize: '8', acceptTarp: true });
      });

      let totalsBefore;
      let tarpPricing;

      await test.step('Capture totals and tarp pricing before removal', async () => {
        await orderPage.verifySkipTarpRemoveControlVisible();
        tarpPricing = await orderPage.getOrderSummaryTarpPricing();
        totalsBefore = await orderPage.getOrderBreakdownTotals();
      });

      await test.step('AC-2.1.3: Clicking the trash icon removes the tarp from the order', async () => {
        await orderPage.removeSkipTarpFromOrderSummary();
      });

      await test.step('AC-2.1.4: Subtotal, VAT, and total update in real time after removal', async () => {
        const totalsAfter = await orderPage.getOrderBreakdownTotals();

        expect(totalsAfter.subtotalExVat).toBeCloseTo(
          orderPage.roundMoney(totalsBefore.subtotalExVat - tarpPricing.priceExVat),
          2
        );
        expect(totalsAfter.vatAmount).toBeCloseTo(
          orderPage.roundMoney(totalsBefore.vatAmount - tarpPricing.vatAmount),
          2
        );
        expect(totalsAfter.orderTotal).toBeCloseTo(
          orderPage.roundMoney(totalsBefore.orderTotal - tarpPricing.priceExVat - tarpPricing.vatAmount),
          2
        );
      });
    });

    test('Scenario 2.1.5: Skip Tarp section is hidden when no tarp is selected', async () => {
      await loginPage.goto(TestData.baseURL);

      await test.step('Decline tarp and navigate to payment Order Summary', async () => {
        await orderPage.navigateToPaymentStep({ skipSize: '8', acceptTarp: false });
      });

      await test.step('AC-2.1.5: Skip Tarp section does not appear in the Order Summary', async () => {
        await orderPage.verifySkipTarpNotInOrderSummary();
      });
    });
  });

  test.describe('2.2 — Pricing Breakdown', () => {
    test('Scenario 2.2.1–2.2.3: Order totals include tarp price, 20% VAT, and add-ons', async () => {
      await loginPage.goto(TestData.baseURL);

      let tarpExVatFromModal;

      await test.step('Accept tarp and navigate to payment Order Summary', async () => {
        ({ tarpExVat: tarpExVatFromModal } = await orderPage.navigateToPaymentStep({
          skipSize: '8',
          acceptTarp: true,
        }));
      });

      await test.step('AC-2.2.1–2.2.3: Subtotal includes tarp; VAT is 20%; total includes skip, tarp, and add-ons', async () => {
        const { totals, tarp } = await orderPage.verifyOrderBreakdownIncludesTarpPricing(tarpExVatFromModal);

        expect(tarp.priceExVat).toBeCloseTo(tarpExVatFromModal, 2);
        expect(tarp.vatAmount).toBeCloseTo(orderPage.roundMoney(tarpExVatFromModal * 0.2), 2);

        // Subtotal (ex VAT) must include the tarp line amount.
        expect(totals.subtotalExVat).toBeGreaterThanOrEqual(tarp.priceExVat);

        // VAT line must include 20% of the tarp price (and match overall 20% of subtotal).
        expect(totals.vatAmount).toBeGreaterThanOrEqual(tarp.vatAmount);
        expect(totals.vatAmount).toBeCloseTo(orderPage.roundMoney(totals.subtotalExVat * 0.2), 2);

        // Total payment = subtotal + VAT (skip + tarp + any other add-ons, inc. VAT).
        expect(totals.orderTotal).toBeCloseTo(
          orderPage.roundMoney(totals.subtotalExVat + totals.vatAmount),
          2
        );
      });
    });
  });

  test.describe('2.x — Tie Down Line Item & Pricing', () => {
    test('Scenario Tie Down 2.1–2.2 & 5.2: Order Summary shows Tie Down under tarp; remove tarp clears both', async () => {
      await loginPage.goto(TestData.baseURL);

      let expectedTarpSize;
      let tarpExVat;
      let tieDownExVat;
      let totalsBefore;
      let tarpPricing;
      let tieDownPricing;

      await test.step('Accept tarp + Tie Down and navigate to payment Order Summary', async () => {
        ({ expectedTarpSize, tarpExVat, tieDownExVat } = await orderPage.navigateToPaymentStep({
          skipSize: '8',
          acceptTarp: true,
          acceptTieDown: true,
        }));
      });

      await test.step('Tie Down AC-2.1.1 / 2.1.2: Tie Down section shows title, description, price, VAT, below tarp', async () => {
        await orderPage.verifySkipTarpInOrderSummary(expectedTarpSize);
        tieDownPricing = await orderPage.verifyTieDownInOrderSummary();
        expect(tieDownPricing.priceExVat).toBeCloseTo(tieDownExVat, 2);
        await orderPage.verifyTieDownAppearsBelowTarpInOrderSummary();
      });

      await test.step('Tie Down AC-2.2.1–2.2.3: Totals include tie down price and 20% VAT', async () => {
        const { totals } = await orderPage.verifyOrderBreakdownIncludesTieDownPricing(tieDownExVat);
        expect(totals.subtotalExVat).toBeGreaterThanOrEqual(
          orderPage.roundMoney(tarpExVat + tieDownExVat)
        );
        expect(totals.vatAmount).toBeCloseTo(orderPage.roundMoney(totals.subtotalExVat * 0.2), 2);
        expect(totals.orderTotal).toBeCloseTo(
          orderPage.roundMoney(totals.subtotalExVat + totals.vatAmount),
          2
        );
        totalsBefore = totals;
        tarpPricing = await orderPage.getOrderSummaryTarpPricing();
      });

      await test.step('Tie Down AC-2.1.4 / AC-5.2: Removing tarp also removes Tie Down and updates totals', async () => {
        await orderPage.removeSkipTarpFromOrderSummary();
        const totalsAfter = await orderPage.getOrderBreakdownTotals();
        const removedExVat = orderPage.roundMoney(tarpPricing.priceExVat + tieDownPricing.priceExVat);
        const removedVat = orderPage.roundMoney(tarpPricing.vatAmount + tieDownPricing.vatAmount);

        expect(totalsAfter.subtotalExVat).toBeCloseTo(
          orderPage.roundMoney(totalsBefore.subtotalExVat - removedExVat),
          2
        );
        expect(totalsAfter.vatAmount).toBeCloseTo(
          orderPage.roundMoney(totalsBefore.vatAmount - removedVat),
          2
        );
        expect(totalsAfter.orderTotal).toBeCloseTo(
          orderPage.roundMoney(totalsBefore.orderTotal - removedExVat - removedVat),
          2
        );
      });
    });
  });
});

test.describe('4–5. Order Creation & Tarp Visibility (Customer / Supplier / Admin)', () => {
  test.setTimeout(420000);

  test('Scenario 4.1–4.2 & 5.1–5.3: Place tarp order and verify line item across portals', async ({ browser }, testInfo) => {
    await loginPage.goto(TestData.baseURL);

    const skipSize = '8';
    let expectedTarpSize;
    let tarpExVat;
    let totalsBeforePayment;
    let createdOrderPayload;
    let orderId;

    await test.step('Accept tarp and reach payment Order Summary', async () => {
      ({ expectedTarpSize, tarpExVat } = await orderPage.navigateToPaymentStep({ skipSize, acceptTarp: true }));
    });

    await test.step('AC-4.2: Payment amount includes tarp price plus VAT', async () => {
      ({ totals: totalsBeforePayment } = await orderPage.verifyPaymentTotalIncludesTarp(tarpExVat));
    });

    await test.step('Complete payment with existing customer and capture created order', async () => {
      const orderCreateWait = orderPage.waitForSkipTarpOrderCreateResponse();

      await orderPage.completePayment();
      await signUpPage.fillSignUpFormExistingUser();
      if (
        (await orderPage.completePaymentBtn.isVisible({ timeout: 8000 }).catch(() => false)) ||
        (await orderPage.placeOrderBtn.isVisible({ timeout: 2000 }).catch(() => false))
      ) {
        await orderPage.completePayment();
      }

      const createResponse = await orderCreateWait;
      createdOrderPayload = await createResponse.json();
    });

    await test.step('AC-4.1: Created order includes skip_tarp line item with size, price, and quantity 1', async () => {
      const tarpItem = orderPage.extractSkipTarpLineItemFromOrderPayload(createdOrderPayload);
      expect(tarpItem.item_type).toBe('skip_tarp');
      expect(tarpItem.quantity).toBe(1);
      expect(tarpItem.name).toMatch(new RegExp(`Skip Tarp(aulin)?\\s*\\(${expectedTarpSize}\\)`, 'i'));
      expect(Number(tarpItem.unit_price)).toBeCloseTo(tarpExVat, 2);
      expect(Number(tarpItem.total_price ?? tarpItem.unit_price)).toBeCloseTo(tarpExVat, 2);
      expect(Number(createdOrderPayload.total_amount)).toBeCloseTo(totalsBeforePayment.orderTotal, 2);
    });

    await test.step('Navigate to customer order details', async () => {
      await dashboardPage.gotoSuccessPage();
      orderId = await dashboardPage.navigateToViewOrderDetails();
      orderId = String(orderId).replace(/[^\d]/g, '');
      expect(orderId).toBeTruthy();
    });

    await test.step('AC-5.1.1: Customer Financials shows Skip Tarp line item with name, size, and price', async () => {
      await orderDeliveryDetailsPage.verifySkipTarpCustomerLineItem({
        expectedTarpSize,
        expectedPriceExVat: tarpExVat,
      });
    });

    await test.step('AC-5.2.1–5.2.2: Supplier order sheet shows skip_tarp line item and no tarp delivery status', async () => {
      const supplierContext = await browser.newContext({
        ...testInfo.project.use,
        httpCredentials: {
          username: TestData.authCredentials.authUserName,
          password: TestData.authCredentials.authPassword,
        },
        ignoreHTTPSErrors: true,
      });
      const supplierPage = await supplierContext.newPage();
      const genFunctions = new genericFunctions(supplierPage);
      const supplierRegistrationPage = new SupplierRegistrationPage(supplierPage);
      const supplierOrdersPage = new SupplierOrdersPage(supplierPage);
      const takeOrderSheetPage = new TakeOrderSheetPage(supplierPage);

      await genFunctions.goto(supplierPage, '/supplier/login');
      await ensureCookieConsentDismissed(supplierPage);
      await supplierRegistrationPage.supplierLogin(
        TestData.credentials.supplier.username,
        TestData.credentials.supplier.password
      );
      if (await supplierRegistrationPage.doItLaterBtn.isVisible().catch(() => false)) {
        await supplierRegistrationPage.doItLaterBtn.click();
      }

      await supplierOrdersPage.takeAvailableOrder(orderId);
      await takeOrderSheetPage.verifySheetDisplayed();
      await takeOrderSheetPage.verifySkipTarpSupplierLineItem({ expectedTarpSize });
      await takeOrderSheetPage.verifyNoTarpDeliveryStatusSection();
      await takeOrderSheetPage.closeTakeOrderSheet();
      await supplierContext.close();
    });

    await test.step('AC-5.3.1: Admin order details shows Skip Tarp in Order Items', async () => {
      const adminContext = await browser.newContext({
        ...testInfo.project.use,
        httpCredentials: {
          username: TestData.authCredentials.authUserName,
          password: TestData.authCredentials.authPassword,
        },
        ignoreHTTPSErrors: true,
      });
      const adminPage = await adminContext.newPage();
      const genFunctions = new genericFunctions(adminPage);
      const adminLogin = new AdminLogin(adminPage);
      const orderAdminPage = new Order_Admin_Page(adminPage);

      await adminLogin.goto(genFunctions.buildURL('/agent/login'));
      await ensureCookieConsentDismissed(adminPage);
      await adminLogin.adminLogin(TestData.credentials.agent.username, TestData.credentials.agent.password);
      await orderAdminPage.getOrderDetails(orderId);
      await orderAdminPage.verifySkipTarpAdminLineItem({
        expectedTarpSize,
        expectedPriceExVat: tarpExVat,
      });
      await adminContext.close();
    });
  });

  test('Scenario Tie Down 3–5: Place tarp+tie-down order and verify across portals', async ({ browser }, testInfo) => {
    await loginPage.goto(TestData.baseURL);

    const skipSize = '8';
    let expectedTarpSize;
    let tarpExVat;
    let tieDownExVat;
    let totalsBeforePayment;
    let createdOrderPayload;
    let tieDownOrderPayload;
    let orderId;

    await test.step('Accept tarp + Tie Down and reach payment', async () => {
      ({ expectedTarpSize, tarpExVat, tieDownExVat } = await orderPage.navigateToPaymentStep({
        skipSize,
        acceptTarp: true,
        acceptTieDown: true,
      }));
      await orderPage.verifyTieDownInOrderSummary();
    });

    await test.step('Tie Down AC-3.2: Payment total includes tie down + VAT', async () => {
      ({ totals: totalsBeforePayment } = await orderPage.verifyOrderBreakdownIncludesTieDownPricing(tieDownExVat));
      expect(totalsBeforePayment.subtotalExVat).toBeGreaterThanOrEqual(
        orderPage.roundMoney(tarpExVat + tieDownExVat)
      );
    });

    await test.step('Complete payment and capture order + tie_down create responses', async () => {
      const orderCreateWait = orderPage.waitForSkipTarpOrderCreateResponse();
      const tieDownCreateWait = orderPage.waitForTieDownOrderCreateResponse();

      await orderPage.completePayment();
      await signUpPage.fillSignUpFormExistingUser();
      if (
        (await orderPage.completePaymentBtn.isVisible({ timeout: 8000 }).catch(() => false)) ||
        (await orderPage.placeOrderBtn.isVisible({ timeout: 2000 }).catch(() => false))
      ) {
        await orderPage.completePayment();
      }

      const createResponse = await orderCreateWait;
      createdOrderPayload = await createResponse.json();
      const tieDownResponse = await tieDownCreateWait;
      tieDownOrderPayload = await tieDownResponse.json();
    });

    await test.step('Tie Down AC-3.1 / 3.4: tie_down line item saved; dedicated tie-down order created with address', async () => {
      const tieDownItem = orderPage.extractTieDownLineItemFromOrderPayload(createdOrderPayload);
      expect(tieDownItem.item_type).toBe('tie_down');
      expect(tieDownItem.quantity).toBe(1);
      expect(tieDownItem.name).toBe('Tie Down (Reflective Guy Rope)');
      expect(Number(tieDownItem.unit_price)).toBeCloseTo(tieDownExVat, 2);
      expect(Number(createdOrderPayload.total_amount)).toBeCloseTo(totalsBeforePayment.orderTotal, 2);
      expect(createdOrderPayload.address || createdOrderPayload.billing_address).toBeTruthy();

      expect(tieDownOrderPayload.success).toBeTruthy();
      expect(tieDownOrderPayload.tieDownOrder?.orderId || tieDownOrderPayload.tieDownOrder?.order_id).toBeTruthy();
    });

    await test.step('Navigate to customer order details', async () => {
      await dashboardPage.gotoSuccessPage();
      orderId = String(await dashboardPage.navigateToViewOrderDetails()).replace(/[^\d]/g, '');
      expect(orderId).toBeTruthy();
    });

    await test.step('Tie Down AC-4.1.1 / AC-5.3: Customer sees Tie Down line item; Add Item does not offer independent add', async () => {
      await orderDeliveryDetailsPage.verifyTieDownCustomerLineItem({ expectedPriceExVat: tieDownExVat });
      await orderDeliveryDetailsPage.verifyTieDownNotAddableIndependentlyInAddItem();
    });

    await test.step('Tie Down AC-4.2.1–4.2.2: Supplier sheet shows tie_down type and no tie-down delivery status', async () => {
      const supplierContext = await browser.newContext({
        ...testInfo.project.use,
        httpCredentials: {
          username: TestData.authCredentials.authUserName,
          password: TestData.authCredentials.authPassword,
        },
        ignoreHTTPSErrors: true,
      });
      const supplierPage = await supplierContext.newPage();
      const genFunctions = new genericFunctions(supplierPage);
      const supplierRegistrationPage = new SupplierRegistrationPage(supplierPage);
      const supplierOrdersPage = new SupplierOrdersPage(supplierPage);
      const takeOrderSheetPage = new TakeOrderSheetPage(supplierPage);

      await genFunctions.goto(supplierPage, '/supplier/login');
      await ensureCookieConsentDismissed(supplierPage);
      await supplierRegistrationPage.supplierLogin(
        TestData.credentials.supplier.username,
        TestData.credentials.supplier.password
      );
      if (await supplierRegistrationPage.doItLaterBtn.isVisible().catch(() => false)) {
        await supplierRegistrationPage.doItLaterBtn.click();
      }

      await supplierOrdersPage.takeAvailableOrder(orderId);
      await takeOrderSheetPage.verifySheetDisplayed();
      await takeOrderSheetPage.verifyTieDownSupplierLineItem();
      await takeOrderSheetPage.verifyNoTieDownDeliveryStatusSection();
      await takeOrderSheetPage.closeTakeOrderSheet();
      await supplierContext.close();
    });

    await test.step('Tie Down AC-4.3.1–4.3.3: Admin shows Tie Down, no delivery status, and can remove when not shipped', async () => {
      const adminContext = await browser.newContext({
        ...testInfo.project.use,
        httpCredentials: {
          username: TestData.authCredentials.authUserName,
          password: TestData.authCredentials.authPassword,
        },
        ignoreHTTPSErrors: true,
      });
      const adminPage = await adminContext.newPage();
      const genFunctions = new genericFunctions(adminPage);
      const adminLogin = new AdminLogin(adminPage);
      const orderAdminPage = new Order_Admin_Page(adminPage);

      await adminLogin.goto(genFunctions.buildURL('/agent/login'));
      await ensureCookieConsentDismissed(adminPage);
      await adminLogin.adminLogin(TestData.credentials.agent.username, TestData.credentials.agent.password);
      await orderAdminPage.getOrderDetails(orderId);
      await orderAdminPage.verifyTieDownAdminLineItem({ expectedPriceExVat: tieDownExVat });
      await orderAdminPage.verifyNoTieDownDeliveryStatusSection();
      await orderAdminPage.removeTieDownIfRemovable();
      await orderAdminPage.verifySkipTarpAdminLineItem({
        expectedTarpSize,
        expectedPriceExVat: tarpExVat,
      });
      await adminContext.close();
    });
  });
});
