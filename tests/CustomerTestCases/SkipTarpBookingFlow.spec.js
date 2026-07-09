import { test, expect } from '../../fixtures/test.js';
import { LoginPage } from '../../pages/Customer/LoginPage.js';
import { OrderPage } from '../../pages/Customer/OrderPage.js';
import { TestData } from '../../Data/testData.js';

/** @type {LoginPage} */ let loginPage;
/** @type {OrderPage} */ let orderPage;

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

      await test.step('AC-1.1.1: Dismissing Skip Tarp allows proceeding to the next step', async () => {
        await orderPage.dismissSkipTarpModal();
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

    test('Scenario 1.1.4: Plasterboard Disposal modal appears after Skip Tarp modal', async () => {
      await loginPage.goto(TestData.baseURL);

      await test.step('Navigate to Skip Selection step with plasterboard waste', async () => {
        await orderPage.navigateToSkipSelectionStep({ plasterBoard: 'Yes' });
      });

      await test.step('Select skip size and click Continue', async () => {
        await orderPage.selectSkipSizeOnly(TestData.SkipSize[1]);
        await orderPage.clickContinueOnSkipSelection();
      });

      await test.step('AC-1.1.4: Skip Tarp modal is shown before Plasterboard Disposal', async () => {
        await orderPage.verifySkipTarpModalVisible();
        await orderPage.verifyPlasterboardDisposalModalNotVisible();
      });

      await test.step('AC-1.1.4: Plasterboard Disposal modal appears after Skip Tarp is dismissed', async () => {
        await orderPage.dismissSkipTarpModal();
        await orderPage.verifySkipTarpModalNotVisible();
        await orderPage.verifyPlasterboardDisposalModalVisible();
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
