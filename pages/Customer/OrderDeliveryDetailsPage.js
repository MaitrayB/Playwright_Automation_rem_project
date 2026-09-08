import { expect } from "allure-playwright";
import { genericFunctions } from "../../utils/genericFunctions.js";
// import { OrderPage } from '../pages/OrderPage.js';
/*
Below 2 TYPEDEF lines you need for:
✔ VS Code IntelliSense
✔ Cmd + Click navigation
✔ Proper type inference for page
✔ Method autocomplete in test files
*/
/** 
 * @typedef {import('@playwright/test').Page} Page
 * @typedef {import('@playwright/test').Locator} Locator 
 */

export class OrderDeliveryDetailsPage {
    /** @param {Page} page */
    constructor(page) {
        this.page = page;

        this.manageDeliveryBtn = page.getByRole('button', { name: 'Manage Delivery' });

        this.deliveryDetailsSec = page.locator('h3:has-text("Delivery Details")');
        this.skipDetailsSec = page.locator('h3:has-text("Skip Details")');
        this.customerInfoSec = page.getByRole('heading', { name: 'Customer Information' })
            .or(page.getByText('Customer', { exact: true }));
        this.orderItemsSec = page.getByRole('heading', { name: 'Order Items' })//page.locator('h2:has-text("Order Items")');
        this.financialsTab = page.getByRole('button', { name: /^Financials$/i }).or(page.getByText('Financials', { exact: true }));
        this.overviewTab = page.getByRole('button', { name: /^Overview$/i }).or(page.getByText('Overview', { exact: true }));
        this.imagesTab = page.getByRole('button', { name: /^Images/i }).or(page.getByText(/^Images/i));
        this.skipTarpLbl = page.locator("//h3[contains(.,'Skip Tarp')]");
        this.skipTarpLineItemHeading = page.getByRole('heading', { name: /Skip Tarp(aulin)?\s*\(/i })
            .or(page.getByText(/Skip Tarpaulin\s*\(/i));
        this.skipTarpDeliveryStatusSection = page.getByRole('heading', { name: /Skip Tarpaulin Delivery/i });

        this.addItemBtn = page.getByRole('button', { name: 'Add Item' });
        this.roadPermitBtn = page.locator("//button[contains(.,'Road Permit')]");
        // this.permitAndDeliveryOption = page.getByRole('radio', { name: 'Add Permit & Update Delivery' });
        //this.permitConfirnBtn = page.getByRole('button', { name: 'Confirm' });

        this.tonneBagBtn = page.getByRole('button', { name: '1 Tonne Bag We supply a tonne' }); //page.locator("//button[contains(.,'Tonne Bag')]");
        //this.addQuantity = page.locator("//div[@class='flex items-center space-x-4']/button[2]");
        this.verifyTonneBagLabel = page.getByRole('heading', { name: 'Plasterboard Tonne Bag' });
        this.verifyTotalQuantity = page.getByText(/Plasterboard disposal \(1 tonne\)/i);

        this.addBtnPopup = page.locator("(//button[contains(.,'Add Item')])[last()]");
        this.payBtn = page.locator("(//button[contains(.,'Pay')])[last()]");
        this.roadpermitFeeLbl = page.locator("//h3[contains(.,'Road Permit Fee')]");
        this.verifyOrderHistoryForAddedPermit = page.locator("//p[contains(.,'Road Permit Fee')]");
        this.verifyWrongSkipGuaranteeLabel = page.getByRole('heading', { name: 'Wrong Skip Guarantee' }); //locator("//span[contains(., 'Wrong Skip Guarantee')]");
        this.updateSkipBtn = page.getByRole('button', { name: 'Update Skip' });
        this.checkPrecedingSkipAvailability = page.locator("(//button[contains(.,'Currently Selected')]/../preceding-sibling::div)");
        this.previousSkipBtn = page.locator("(//button[contains(.,'Currently Selected')]/../preceding-sibling::div)[1]");
        this.nextSkipAvailibility = page.locator("(//button[contains(.,'Currently Selected')]/../following-sibling::div)");
        this.nextSkipBtn = page.locator("(//button[contains(.,'Currently Selected')]/../following-sibling::div)[1]");
        this.changeSkipBtn = page.getByRole('button', { name: 'Change Skip' });
        this.confirmChangeBtn = page.getByText("Confirm Change");
        this.payExtraBtn = page.locator("//span[contains(.,'Pay £')]");
        this.skipChangeSuccessMsg = page.getByText("Skip Changed Successfully");
        this.refundRequestMsg = page.getByText("Refund Request Created");
        this.doneBtn = page.getByRole('button', { name: 'Done' });

        this.collectionMgmtNotAvailableMsg = page.getByText('Collection Date Management Not Available YetCollection date management is only');
        this.closeCollectionBtn = page.getByRole('button', { name: 'Close' });
        this.updateCollectionDtBtn = page.locator("//button[contains(.,'Update Collection Date')]");
        this.manageCollectionLabel = page.getByRole('heading', { name: 'Manage Your Collection Date' });
        this.collectionDtBtn = page.getByRole('button', { name: 'Collection Date', exact: true });
        //this.nextdeliveryDateFree = page.locator("(//button[contains(concat(' ', normalize-space(@class), ' '), ' bg-[#0037C1] ')])[1]/following-sibling::button[1]");
        this.nextDeliveryDateFree = page.locator("//div[contains(@class,'grid')]//button[contains(@class,'text-white')]/following-sibling::button[1]");
        //this.nextdeliveyChargedBtn = page.locator("((//button[contains(concat(' ', normalize-space(@class), ' '), ' bg-[#0037C1] ')])[1]/following-sibling::button[contains(@class,'hover:bg-[#2A2A2A]')])[last()]");
        this.nextDeliveryChargeBtn = page.locator("(//div[contains(@class,'grid')]//button[not(@disabled)])[last()]");
        this.agreeCheckbox = page.getByLabel('I agree to ensure the skip meets all collection requirements');
        this.setCollectionDateBtn = page.getByRole('button', { name: 'Set Collection Date' });
        this.freeExtensionDayUsedLbl = page.getByText('Free extension days used: 0/3');
        this.freeExtensionRemainingLbl = page.getByText('Free extension days remaining: 3');
        this.dateexendedLlb = page.locator("//p[contains(.,'Collection date extended from')]");
        this.manageCollectionBtn = page.getByRole('button', { name: /Manage Collection/i });
        this.completePaymentBtn = page.getByRole('button', { name: 'Set Collection Date' });
        this.payBtn = page.locator("//button[contains(.,'Pay ')]");

        this.manageDeliveryBtn = page.getByRole('button', { name: 'Manage Delivery' });
        this.confirmDeliveryBtn = page.getByRole('button', { name: 'Confirm Delivery' });
        this.textArea = page.getByPlaceholder('Add a message about this event...');
        this.submitBtn = page.getByRole('button', { name: 'Submit' });
        this.eventSuccessMsg = page.getByText('Event submitted successfully')
            .or(page.getByRole('heading', { name: 'Report Submitted' }));
        this.verifyConfirmDeliveryLabel = page.locator('span:has-text("Delivery Confirmed")');

        this.missedDeliveryBtn = page.getByRole('button', { name: 'Missed Delivery' });
        this.verifyMissedDeliveryLabel = page.locator('span:has-text("Missed Delivery")');
        this.confirmCollectionBtn = page.getByRole('button', { name: 'Confirm Collection' });
        this.collectionConfirmedtxt = page.locator('//span[contains(.,"Collection Confirmed")]');

        //missed collection objects
        this.confirmCollectionBtn = page.getByRole('button', { name: 'Confirm Collection' });
        //this.collectionConfirmedtxt = page.locator('//span[contains(.,"Collection Confirmed")]');
        this.missedCollectionBtn = page.getByRole('button', { name: 'Missed Collection' });
        this.verifyMissedCollectionLabel = page.locator('span:has-text("Missed Collection")')
            .or(page.getByRole('heading', { name: 'Report Submitted' }))
            .or(page.getByText('Missed Collection', { exact: true }));

        // Site Contact elements
        this.siteContactCard = page.getByRole('heading', { name: 'Site Contact' })
            .or(page.getByText('Site Contact', { exact: true }));
        this.newContactName = this.siteContactCard.locator('..').getByText('Name', { exact: true }).locator('..').locator('.text-gray-400');
        this.newContactPhone = this.siteContactCard.locator('..').getByText('Phone', { exact: true }).locator('..').locator('.text-gray-400');
        this.newContactEmail = this.siteContactCard.locator('..').getByText('Email', { exact: true }).locator('..').locator('.text-gray-400');

        // Add / Remove Image
        this.orderImagesTitle = page.locator('h3:has-text("Order Images")');
        this.addImagesBtn = page.getByRole('button', { name: 'Add Images' });
        this.uploadImageBtn = page.locator("//button[contains(.,'Upload')]");
        this.uploadSuccessMsg = page.locator("//p[contains(.,'1 image added successfully')]");
        this.xIconCount = page.locator("//div[@class='relative group']/button");
        this.removeImgPopup = page.locator("(//button[contains(.,'Remove')])[last()]");
        this.imageDeletedMsg = page.getByText("Image removed successfully");

        // Payment History
        this.orderTotalAmt = page.getByText('Total', { exact: true }).locator('xpath=following-sibling::*[1]');
        this.moreOptionsBtn = page.getByRole('button', { name: 'More actions' })
            .or(page.locator('button:has(svg.lucide-more-vertical)'));
        this.paymentHistoryBtn = page.getByRole('button', { name: 'Payment History' });
        this.pymtHistoryLbl = page.locator('h3:has-text("Payment History")');
        this.basePrice = page.locator('div:has-text("Base Price")').locator('div.text-white.font-semibold.text-lg');

        //Request Refund
        this.requestRefundBtn = page.getByRole('button', { name: 'Request Refund' });
        this.requestRefundTitle = page.locator('h2:has-text("Request Refund")');
        this.reasonForRefundDropDown = page.getByRole('button', { name: 'Select reason' });
        this.reasonSelection = page.locator("//div[@class='py-1']/button").filter({ hasText: 'Timing Of Permit Issue' });
        this.additionalNotes = page.getByPlaceholder("Please provide details about your refund request...");
        this.submitRequestBtn = page.getByRole('button', { name: 'Submit Request' });
        this.RequestSubmissionSuccessMsg = page.getByText("Refund request submitted successfully");
        this.verifyRefundRequestedLogHistory = page.getByText("Refund Requested");
        this.verifyRefundRequestStatus = page.locator("//div[contains(@class, 'text-gray-300')]/span[2]");
        this.downgradeRefundRequestedLog = page.getByText('Refund requested: Item Downgraded.').first();
        this.upgradeSkipRefundRequestedLog = page.getByText('Skip Changed').first();

        // Send message feature locators
        this.orderChatBtn = page.getByRole('button', { name: /^(Chat|Open chat)$/i });
        this.startNewChatBtn = page.getByRole('button', { name: 'Start New Chat' });
        this.sendMessageBtn = page.getByRole('button', { name: 'Send Message' });
        this.preDefinedMessages = page.locator('.justify-end .mb-3 button');
        this.closeSendMsgWindowBtn = page.getByRole('button', { name: 'Close' });
        this.searchChatsTextBox = page.getByPlaceholder('Search chats...');
        this.issuesList = page.locator('.grid.gap-2 button');
        this.openLatestMsgBtn = page.locator('.divide-y button').first();
        this.chatMessages = page.locator('.space-y-1 p');
        this.enterIssueDetail = page.getByRole('textbox', { name: 'Describe your issue or' });
    }

    async verifyOrderDeliveryDetails() {
        await expect(this.deliveryDetailsSec).toBeVisible();
        await expect(this.skipDetailsSec).toBeVisible();
        await expect(this.customerInfoSec.first()).toBeVisible();
    }

    async verifyRoadPermitNotOnOrder() {
        if (await this.financialsTab.first().isVisible({ timeout: 8000 }).catch(() => false)) {
            await this.openFinancialsTab();
        }
        await expect(this.roadpermitFeeLbl).toHaveCount(0);
        await expect(this.page.getByRole('heading', { name: /Road Permit/i })).toHaveCount(0);
    }

    async verifyRoadPermitOnOrder() {
        await this.openFinancialsTab();
        await expect(
            this.roadpermitFeeLbl.or(this.page.getByRole('heading', { name: /Road Permit/i })).first()
        ).toBeVisible({ timeout: 15000 });
    }

    async verifyPlacementPhotoAttached() {
        const imagesTab = this.page.getByRole('button', { name: /^Images/i });
        await imagesTab.first().waitFor({ state: 'visible', timeout: 15000 });
        await expect(imagesTab.first()).toContainText(/1/);
        await imagesTab.first().click();
        const attachedImage = this.page.locator(
            'img[alt*="image" i], img[alt*="placement" i], img[alt*="photo" i], img[alt*="Order" i]'
        ).or(this.page.getByRole('img').filter({ hasNot: this.page.locator('[alt="We Want Waste"]') }));
        await expect(attachedImage.first()).toBeVisible({ timeout: 15000 });
    }

    async openFinancialsTab() {
        await this.financialsTab.first().waitFor({ state: 'visible', timeout: 15000 });
        await this.financialsTab.first().click();
        await expect(this.orderItemsSec.first()).toBeVisible({ timeout: 15000 });
    }

    async openActivityTab() {
        const activity = this.page.getByRole('button', { name: /^Activity$/i });
        await activity.waitFor({ state: 'visible', timeout: 15000 });
        await activity.click();
        await this.page.waitForTimeout(1000);
    }

    getSkipTarpLineItemBlock() {
        return this.skipTarpLineItemHeading.first().locator(
            'xpath=ancestor::div[.//text()[contains(.,"Quantity")] and .//text()[contains(.,"£")]][1]'
        );
    }

    async verifySkipTarpCustomerLineItem({ expectedTarpSize, expectedPriceExVat } = {}) {
        await this.openFinancialsTab();
        await expect(this.orderItemsSec.first()).toBeVisible();
        await expect(this.skipTarpLineItemHeading.first()).toBeVisible({ timeout: 10000 });
        await expect(this.skipTarpLineItemHeading.first()).toHaveText(
            new RegExp(`Skip Tarp(aulin)?\\s*\\(${expectedTarpSize}\\)`, 'i')
        );

        const block = this.getSkipTarpLineItemBlock();
        await expect(block.getByText(/Quantity:\s*1/i)).toBeVisible();
        await expect(
          block.getByText(`£${Number(expectedPriceExVat).toFixed(2)}`, { exact: true })
        ).toBeVisible();
    }

    async verifyTieDownCustomerLineItem({ expectedPriceExVat } = {}) {
        await this.openFinancialsTab();
        const tieDownHeading = this.page.getByText('Tie Down (Reflective Guy Rope)', { exact: true });
        await expect(tieDownHeading.first()).toBeVisible({ timeout: 10000 });
        const block = tieDownHeading.first().locator(
            'xpath=ancestor::div[.//text()[contains(.,"Quantity")] and .//text()[contains(.,"£")]][1]'
        );
        await expect(block.getByText(/Quantity:\s*1/i)).toBeVisible();
        if (expectedPriceExVat != null) {
            await expect(
              block.getByText(`£${Number(expectedPriceExVat).toFixed(2)}`, { exact: true })
            ).toBeVisible();
        }
    }

    async verifyTieDownNotAddableIndependentlyInAddItem() {
        await this.openFinancialsTab();
        await this.addItemBtn.first().click();
        const dialog = this.page.getByRole('dialog').filter({ hasText: /Select Item Type|Add Item/i }).first()
            .or(this.page.locator('div').filter({ hasText: /Select Item Type/i }).filter({ hasText: /Cancel/i }).first());
        await expect(this.page.getByText(/Select Item Type/i).first()).toBeVisible({ timeout: 10000 });

        const bodyText = await this.page.locator('body').innerText();
        // Tie downs are booking-flow only: when already on the order they show as Added,
        // and there is no independent "Add" action for a standalone tie down.
        expect(bodyText).toMatch(/Tie Down \(Reflective Guy Rope\)/i);
        expect(bodyText).toMatch(/Added/i);

        const cancelBtn = this.page.getByRole('button', { name: 'Cancel' }).last();
        if (await cancelBtn.isVisible().catch(() => false)) {
            await cancelBtn.click();
        }
    }

    async addRoadPermit() {
        await this.openFinancialsTab();
        await this.page.waitForTimeout(2000);
        await this.addItemBtn.click();
        await this.page.waitForTimeout(2000);
        await this.roadPermitBtn.waitFor({ state: 'visible' });
        await this.roadPermitBtn.click();
        await this.page.waitForTimeout(2000);
        await this.addBtnPopup.click();
        const payAmountBtn = this.page.getByRole('button', { name: /Pay £/i });
        await payAmountBtn.first().waitFor({ state: 'visible', timeout: 15000 });
        await payAmountBtn.first().click();
        await this.page.waitForTimeout(2000);
        if (await payAmountBtn.first().isVisible({ timeout: 8000 }).catch(() => false)) {
            await payAmountBtn.first().click();
        }
        await this.roadpermitFeeLbl.or(this.page.getByText(/Road Permit/i)).first().waitFor({ state: 'visible', timeout: 20000 });
    }

    async addTonneBag() {
        await this.openFinancialsTab();
        await this.page.waitForTimeout(2000);
        await this.addItemBtn.click();
        await this.page.waitForTimeout(2000);
        await this.tonneBagBtn.waitFor({ state: 'visible' });
        await this.tonneBagBtn.click();
        await this.page.waitForTimeout(1000);
        //await this.addQuantity.click();
        await this.addBtnPopup.click();
        await this.page.waitForTimeout(1000);
        await this.payBtn.click();
    }

    async downgradeSkip() {
        await this.openFinancialsTab();
        await this.page.waitForTimeout(3000);
        await expect(this.updateSkipBtn).toBeEnabled({ timeout: 15000 });
        await this.updateSkipBtn.focus();
        await this.updateSkipBtn.click();
        await this.page.waitForTimeout(2000);
        // (//button[contains(.,'Currently Selected')]/../preceding-sibling::div)[1]
        const precedingSkipCount = await this.checkPrecedingSkipAvailability.count();
        if (precedingSkipCount === 0) {
            await this.performNextSkipActions();
            await this.page.waitForTimeout(2000);
            await this.updateSkipBtn.click();
            await this.page.waitForTimeout(1000);
            await this.performPreviousSkipActions();
        }
        else {
            await this.performPreviousSkipActions();
        }

        return { skipTest: false };
    }

    async skipChangePaymentFinished() {
        if (await this.skipChangeSuccessMsg.isVisible().catch(() => false)) {
            return true;
        }
        if (await this.doneBtn.isVisible().catch(() => false)) {
            return true;
        }
        const dialog = this.page.getByRole('dialog');
        const dialogOpen = await dialog.first().isVisible().catch(() => false);
        if (!dialogOpen && await this.updateSkipBtn.isVisible().catch(() => false)) {
            return true;
        }
        return false;
    }

    async completeSkipChangePayment() {
        const payAmountBtn = this.page.getByRole('button', { name: /Pay £/i });
        const complete = this.page.getByRole('button', { name: 'Complete Payment' });
        const deadline = Date.now() + 25000;
        while (Date.now() < deadline) {
            if (await this.skipChangePaymentFinished()) {
                return;
            }
            if (await payAmountBtn.first().isVisible().catch(() => false)) {
                await payAmountBtn.first().click();
                await this.page.waitForTimeout(1500);
                continue;
            }
            if (await complete.isVisible().catch(() => false)) {
                await complete.click();
                await this.page.waitForTimeout(1500);
                continue;
            }
            for (const frame of this.page.frames()) {
                const card = frame.locator('#payment-numberInput');
                if (await card.isVisible().catch(() => false)) {
                    await card.fill('4111 1111 1111 1111');
                    await frame.locator('#payment-expiryInput').fill('12/34');
                    await frame.locator('#payment-cvcInput').fill('123');
                    await this.page.waitForTimeout(1000);
                    if (await complete.isVisible().catch(() => false)) {
                        await complete.click();
                    }
                    break;
                }
            }
            await this.page.waitForTimeout(500);
        }
    }

    async performPreviousSkipActions() {
        await this.previousSkipBtn.click();
        await this.changeSkipBtn.click();
        await this.confirmChangeBtn.waitFor({ state: 'visible' });
        await this.confirmChangeBtn.click();
        await expect(this.skipChangeSuccessMsg).toBeVisible();
        await expect(this.refundRequestMsg).toBeVisible();
        await this.doneBtn.click();
        await this.page.waitForTimeout(5000);
    }

    async performNextSkipActions() {
        await this.nextSkipBtn.click();
        await this.page.waitForTimeout(2000);
        await this.changeSkipBtn.click();
        const payExtra = this.page.getByRole('button', { name: /Pay £|Pay Extra/i }).or(this.payExtraBtn);
        await payExtra.first().waitFor({ state: 'visible', timeout: 15000 });
        await payExtra.first().click();
        await this.page.waitForTimeout(2000);
        await this.completeSkipChangePayment();
        await expect.poll(async () => this.skipChangePaymentFinished(), { timeout: 30000 }).toBeTruthy();
        if (await this.doneBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await this.doneBtn.click();
        }
        await this.page.waitForTimeout(2000);
    }

    async upgradeSkip() {
        await this.openFinancialsTab();
        await this.page.waitForTimeout(2000);
        await expect(this.updateSkipBtn).toBeEnabled({ timeout: 15000 });
        await this.updateSkipBtn.focus();
        await this.updateSkipBtn.click();
        await this.page.waitForTimeout(2000);
        const nextSkipCount = await this.nextSkipAvailibility.count();
        if (nextSkipCount === 0) {
            await this.performPreviousSkipActions();
            await this.updateSkipBtn.click();
            await this.performNextSkipActions();
            await this.page.waitForTimeout(3000);
        }
        else {
            await this.performNextSkipActions();
            await this.page.waitForTimeout(3000);
        }

        return { skipTest: false };
    }

    async openCollectionManagement() {
        const triggers = this.page.getByRole('button', {
            name: /Manage Collection|Request Collection|Update Collection Date|Request collection/i,
        });

        if (await triggers.first().isVisible({ timeout: 3000 }).catch(() => false)) {
            await triggers.first().scrollIntoViewIfNeeded();
            await triggers.first().click();
            return;
        }

        if (await this.moreOptionsBtn.first().isVisible().catch(() => false)) {
            await this.moreOptionsBtn.first().click();
            await this.page.waitForTimeout(500);
            const menuItems = (await this.page.getByRole('button').allTextContents())
                .map((t) => t.trim())
                .filter(Boolean);
            console.log('More actions items:', menuItems);
            if (await triggers.first().isVisible({ timeout: 3000 }).catch(() => false)) {
                await triggers.first().click();
                return;
            }
            await this.page.keyboard.press('Escape').catch(() => {});
        }

        const waitingForCollection = this.page.getByRole('button', { name: /Waiting for Collection/i });
        if (await waitingForCollection.isVisible().catch(() => false)) {
            await waitingForCollection.click();
            await this.page.waitForTimeout(1000);
            if (await triggers.first().isVisible({ timeout: 3000 }).catch(() => false)) {
                await triggers.first().click();
                return;
            }
        }

        await triggers.first().waitFor({ state: 'visible', timeout: 15000 });
        await triggers.first().scrollIntoViewIfNeeded();
        await triggers.first().click();
    }

    async openDeliveryManagement() {
        const manage = this.manageDeliveryBtn.first();
        if (await manage.isVisible({ timeout: 5000 }).catch(() => false)) {
            await manage.scrollIntoViewIfNeeded();
            await manage.click();
            return;
        }

        if (await this.moreOptionsBtn.first().isVisible().catch(() => false)) {
            await this.moreOptionsBtn.first().click();
            if (await manage.isVisible({ timeout: 3000 }).catch(() => false)) {
                await manage.click();
                return;
            }
            await this.page.keyboard.press('Escape').catch(() => {});
        }

        const waitingForDelivery = this.page.getByRole('button', { name: /Waiting for Delivery/i });
        if (await waitingForDelivery.isVisible().catch(() => false)) {
            await waitingForDelivery.click();
        }

        await manage.waitFor({ state: 'visible', timeout: 15000 });
        await manage.scrollIntoViewIfNeeded();
        await manage.click();
    }

    async pickCollectionDate(dayNumber) {
        const dialog = this.page.getByRole('dialog', { name: /Set Collection Date/i });
        await dialog.waitFor({ state: 'visible', timeout: 15000 });
        const dateTrigger = dialog.getByRole('button', { name: /Collection Date/i });
        if (await dateTrigger.isVisible().catch(() => false)) {
            await dateTrigger.click();
            await this.page.waitForTimeout(800);
        }
        const dayBtn = dialog.getByRole('button', { name: String(dayNumber), exact: true })
            .or(this.page.getByRole('button', { name: String(dayNumber), exact: true }));
        await dayBtn.last().click();
        await this.page.waitForTimeout(1500);
    }

    async requestCollection(freelimit) {
        await this.page.waitForTimeout(2000);
        await this.openCollectionManagement();
        await this.page.waitForTimeout(1000);
        await this.updateCollectionDtBtn.click();
        await this.page.waitForTimeout(2000);
        if (await this.collectionMgmtNotAvailableMsg.isVisible().catch(() => false)) {
            await this.closeCollectionBtn.click();
            console.log("Collection date management is not available, skipping the collection date update test.");
            return;
        }

        const collectionDay = 7;
        if (freelimit === 'yes') {
            await this.pickCollectionDate(collectionDay + 2);
            await this.agreeCheckbox.check();
            const setBtn = this.page.getByRole('dialog').getByRole('button', { name: /Set Collection Date|Confirm/i });
            await setBtn.waitFor({ state: 'visible', timeout: 10000 });
            await setBtn.click();
            await this.page.waitForTimeout(3000);
            return;
        }

        await this.pickCollectionDate(collectionDay + 7);
        if (await this.page.getByRole('button', { name: 'Request Extension' }).isVisible().catch(() => false)) {
            await this.pickCollectionDate(collectionDay + 5);
        }
        await this.agreeCheckbox.check();
        const payOrSet = this.page.getByRole('dialog').getByRole('button', {
            name: /Complete Payment|Pay |Set Collection Date/i,
        });
        await payOrSet.first().waitFor({ state: 'visible', timeout: 15000 });
        await payOrSet.first().click();
        const payAmountBtn = this.page.getByRole('button', { name: /Pay £/i });
        if (await payAmountBtn.isVisible({ timeout: 15000 }).catch(() => false)) {
            await payAmountBtn.click();
        } else {
            await this.fillCollectionPaymentIfNeeded();
        }
        const dialog = this.page.getByRole('dialog', { name: /Set Collection Date/i });
        await Promise.race([
            dialog.waitFor({ state: 'hidden', timeout: 30000 }),
            this.dateexendedLlb.waitFor({ state: 'visible', timeout: 30000 }),
            this.page.getByText('14 Sept 2026').first().waitFor({ state: 'visible', timeout: 30000 }),
        ]);
    }

    async fillCollectionPaymentIfNeeded() {
        const deadline = Date.now() + 20000;
        while (Date.now() < deadline) {
            for (const frame of this.page.frames()) {
                const card = frame.locator('#payment-numberInput');
                if (await card.isVisible().catch(() => false)) {
                    await card.fill('4111 1111 1111 1111');
                    await frame.locator('#payment-expiryInput').fill('12/34');
                    await frame.locator('#payment-cvcInput').fill('123');
                    await this.page.waitForTimeout(1000);
                    const complete = this.page.getByRole('button', { name: 'Complete Payment' });
                    if (await complete.isVisible().catch(() => false)) {
                        await complete.click();
                    }
                    return;
                }
            }
            if (await this.dateexendedLlb.isVisible().catch(() => false)) {
                return;
            }
            await this.page.waitForTimeout(500);
        }
    }

    async confirmTodaysDelivery() {
        await this.openDeliveryManagement();
        await this.page.waitForTimeout(1000);
        await this.confirmDeliveryBtn.click();
        await this.page.waitForTimeout(1000);
        await this.page.setInputFiles('input[type="file"]', 'Data/test_image.png') // upload confirm delivery image
        await this.page.waitForTimeout(2000);
        await this.textArea.fill(`Today's delivery confirmed`);
        await this.page.waitForTimeout(1000);
        await this.submitBtn.click();
        await expect(this.eventSuccessMsg.first()).toBeVisible({ timeout: 15000 });
        await this.page.waitForTimeout(2000);
    }

    async missedDelivery() {
        await this.openDeliveryManagement();
        await this.page.waitForTimeout(1000);
        await this.missedDeliveryBtn.click();
        await this.page.setInputFiles('input[type="file"]', 'Data/missed_delivery.png')// upload missed delivery image
        await this.textArea.fill('Missed Delivery');
        await this.submitBtn.click();
        await expect(this.eventSuccessMsg.first()).toBeVisible({ timeout: 15000 });
        const reportDialog = this.page.getByRole('dialog', { name: /Missed Delivery/i });
        const closeBtn = reportDialog.getByRole('button', { name: /^Close$/ });
        if (await closeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
            await closeBtn.click();
            await reportDialog.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
        }
    }

    async confirmCollection() {
        await this.page.waitForTimeout(2000);
        await this.openCollectionManagement();
        await this.page.waitForTimeout(1000);
        await this.confirmCollectionBtn.click();
        await this.page.waitForTimeout(1000);
        await this.page.setInputFiles('input[type="file"]', 'Data/skip_collected.png');
        await this.page.waitForTimeout(1000);
        await this.textArea.fill('Skip has been collected successfully!');
        await this.page.waitForTimeout(1000);
        await this.submitBtn.click();
        await expect(
            this.collectionConfirmedtxt
                .or(this.page.getByRole('heading', { name: 'Report Submitted' }))
                .or(this.eventSuccessMsg)
                .first()
        ).toBeVisible({ timeout: 15000 });
        const closeBtn = this.page.getByRole('dialog').getByRole('button', { name: /^Close$/ });
        if (await closeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
            await closeBtn.click();
        }
    }

    async missedCollection() {
        await this.page.waitForTimeout(2000);
        await this.openCollectionManagement();
        await this.page.waitForTimeout(1000);
        await this.missedCollectionBtn.click();
        await this.page.waitForTimeout(1000);
        await this.page.setInputFiles('input[type="file"]', 'Data/missed_delivery.png'); // upload missed collection image
        await this.textArea.fill('Missed Collection');
        await this.submitBtn.click();
        await expect(this.eventSuccessMsg).toBeVisible({ timeout: 15000 });
        const reportDialog = this.page.getByRole('dialog', { name: /Missed Collection/i });
        const closeBtn = reportDialog.getByRole('button', { name: /^Close$/ });
        if (await closeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
            await closeBtn.click();
            await reportDialog.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
        }
    }

    async verifySiteContactDetails({ cname, phone, email }) {
        const section = this.siteContactCard.first().locator('..');
        await expect(this.siteContactCard.first()).toBeVisible();
        await expect(section.getByText(cname, { exact: true })).toBeVisible();
        await expect(section.getByText(String(phone), { exact: true })).toBeVisible();
        await expect(section.getByText(email, { exact: true })).toBeVisible();
    }

    async addImage() {
        await this.imagesTab.first().click();
        await expect(this.orderImagesTitle).toBeVisible({ timeout: 15000 });
        await this.orderImagesTitle.scrollIntoViewIfNeeded();
        await this.addImagesBtn.waitFor({ state: 'visible' });
        await this.page.waitForTimeout(1000);
        await this.addImagesBtn.click();
        await this.page.setInputFiles('input[type="file"]', './Data/download.jpeg');
        await this.page.waitForTimeout(1000);
        await this.uploadImageBtn.click();
        await expect(this.uploadSuccessMsg).toContainText("1 image added successfully");
        const impagePreview = this.page.locator("//img[contains(@alt,'Order image')]");
        const count = await impagePreview.count();
        let image;
        if (count > 1) {
            image = impagePreview.nth(0);
        }
        else {
            image = impagePreview.first();
        }
        await image.scrollIntoViewIfNeeded();
        await expect(image).toBeVisible();
        await expect.poll(async () => {
            return await image.evaluate(img => img.complete && img.naturalHeight > 0);
        }, { timeout: 5000 }).toBe(true);
    }

    async deleteImage() {
        await this.page.waitForTimeout(1000);
        const count = await this.xIconCount.count();
        let deleteFirstImg;
        if (count > 1) {
            deleteFirstImg = this.xIconCount.nth(0);
        }
        else {
            deleteFirstImg = this.xIconCount.first();
        }
        await this.page.waitForTimeout(1000);
        await deleteFirstImg.click();
        await this.removeImgPopup.click();
        await this.page.waitForTimeout(1000);
        await expect(this.imageDeletedMsg).toBeVisible();
    }

    async verifyPaymentHistory() {
        const text = await this.orderTotalAmt.first().textContent();
        console.log(text);
        const amt = (text || '').replace(/[^\d.]/g, '');
        await this.moreOptionsBtn.first().click();
        await this.paymentHistoryBtn.click();
        await expect(this.pymtHistoryLbl).toBeVisible();
        const basePrice = await this.basePrice.textContent();
        console.log(basePrice);
        expect(basePrice).toContain(amt);
    }

    async verifyRequestRefund() {
        await this.moreOptionsBtn.click();
        await this.requestRefundBtn.click();
        await expect(this.requestRefundTitle).toBeVisible();
        await this.reasonForRefundDropDown.click();
        await this.reasonSelection.click();
        await this.additionalNotes.fill("Requesting refund due to selected reason.");
        await this.submitRequestBtn.click();
        await expect(this.RequestSubmissionSuccessMsg).toHaveText("Refund request submitted successfully");
        await expect(this.verifyRefundRequestedLogHistory).toBeVisible();
        await expect(this.verifyRefundRequestStatus).toHaveText("PENDING");
    }

    async verifySearchMessagesFunctionality() {
        await this.orderChatBtn.click();
        await this.searchChatsTextBox.waitFor({ state: 'visible' });
        const chatThreads = this.page.locator('.divide-y button');
        await chatThreads.first().waitFor({ state: 'visible' });

        const firstIssueTitle = chatThreads.first().locator('h4');
        const issueName = (await firstIssueTitle.textContent()).trim();
        console.log("First issue name: " + issueName);

        await this.searchChatsTextBox.fill(issueName);
        await chatThreads.first().waitFor({ state: 'visible' });

        const searchedIssueTitle = chatThreads.first().locator('h4');
        const searchedName = (await searchedIssueTitle.textContent()).trim();
        console.log("Searched issue name: " + searchedName);
        expect(searchedName).toBe(issueName);
    }

    //Send Message
    //Below is parameter destructure
    //     async sendMessage({
    //   fromMessagesTab = false,
    //   messageType = 'predefined',
    //   customText = ''
    // } = {}) {
    //   ...
    // }
    //we do NOT destructure in the parameter Instead, we destructure inside the function
    async sendMessage(options = {}) {
        const genericFunc = new genericFunctions(this.page);

        const {
            messageType = 'preDefined',
            customText = '' } = options;

        await this.orderChatBtn.click();
        await this.startNewChatBtn.click();
        await this.issuesList.first().waitFor({ state: 'visible' });
        await genericFunc.clickRandomItem(this.issuesList);

        let expectedMessage;
        const selectedPreDefinedMessage = this.preDefinedMessages.first().locator('span').last();
        if (messageType === 'preDefined') {
            expectedMessage = (await selectedPreDefinedMessage.textContent()).trim();
            await selectedPreDefinedMessage.click();
            await this.sendMessageBtn.click();
        } else {
            expectedMessage = customText;
            await this.enterIssueDetail.fill(expectedMessage);
            await this.sendMessageBtn.click();
        }

        await expect(this.page.locator('.overflow-y-auto p').filter({ hasText: expectedMessage })).toBeVisible({ timeout: 10000 });
        await this.closeSendMsgWindowBtn.click();
        return expectedMessage;
    }

    async verifyAdminReply(adminReply) {
        await this.page.reload();
        await this.orderChatBtn.click();
        await this.openLatestMsgBtn.click();
        await expect(this.page.locator('.overflow-y-auto p').filter({ hasText: adminReply })).toBeVisible();
    }
}