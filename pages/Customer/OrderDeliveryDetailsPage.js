import { expect } from "allure-playwright";
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
        this.customerInfoSec = page.locator('h3:has-text("Customer Information")');
        this.orderItemsSec = page.getByRole('heading', { name: 'Order Items' })//page.locator('h2:has-text("Order Items")');

        this.addItemBtn = page.getByRole('button', { name: 'Add Item' });
        this.roadPermitBtn = page.locator("//button[contains(.,'Road Permit')]");
        this.permitAndDeliveryOption = page.getByRole('radio', { name: 'Add Permit & Update Delivery' });
        this.permitConfirnBtn = page.getByRole('button', { name: 'Confirm' });

        this.tonneBagBtn = page.getByRole('button', { name: '1 Tonne Bag We supply a tonne' }); //page.locator("//button[contains(.,'Tonne Bag')]");
        //this.addQuantity = page.locator("//div[@class='flex items-center space-x-4']/button[2]");
        this.verifyTonneBagLabel = page.getByRole('heading', { name: 'Plasterboard Tonne Bag' });
        this.verifyTotalQuantity = page.getByText('Quantity:').nth(2);
        this.skipTarpLbl = page.locator("//h3[contains(.,'Skip Tarp')]");

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
        this.manageCollectionBtn = page.locator("//button[contains(.,'Manage Collection')]");
        this.completePaymentBtn = page.getByRole('button', { name: 'Set Collection Date' });
        this.payBtn = page.locator("//button[contains(.,'Pay ')]");

        this.manageDeliveryBtn = page.getByRole('button', { name: 'Manage Delivery' });
        this.confirmDeliveryBtn = page.getByRole('button', { name: 'Confirm Delivery' });
        this.textArea = page.getByPlaceholder('Add a message about this event...');
        this.submitBtn = page.getByRole('button', { name: 'Submit' });
        this.eventSuccessMsg = page.locator("//p[contains(.,'Event submitted successfully')]");
        this.verifyConfirmDeliveryLabel = page.locator('span:has-text("Delivery Confirmed")');

        this.missedDeliveryBtn = page.getByRole('button', { name: 'Missed Delivery' });
        this.verifyMissedDeliveryLabel = page.locator('span:has-text("Missed Delivery")');
        this.confirmCollectionBtn = page.getByRole('button', { name: 'Confirm Collection' });
        this.collectionConfirmedtxt = page.locator('//span[contains(.,"Collection Confirmed")]');

        //missed collection objects
        this.confirmCollectionBtn = page.getByRole('button', { name: 'Confirm Collection' });
        //this.collectionConfirmedtxt = page.locator('//span[contains(.,"Collection Confirmed")]');
        this.missedCollectionBtn = page.getByRole('button', { name: 'Missed Collection' });
        this.verifyMissedCollectionLabel = page.locator('span:has-text("Missed Collection")');

        // Site Contact elements
        this.siteContactCard = page.getByRole('heading', { name: 'Site Contact' });
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
        this.orderTotalAmt = page.locator("//div[@class='space-y-3 pt-4']/div [3]");
        this.moreOptionsBtn = page.locator('button:has(svg.lucide-more-vertical)'); //css xpath=> //button[.//svg[contains(@class,'lucide-more-vertical')]]
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
        this.sendMessageBtn = page.getByRole('button', { name: 'Send Message' }).first();
        this.preDefinedMessage = page.locator("//div[@class='flex flex-wrap gap-2']/button").filter({ hasText: 'Can I get an update on my delivery?' });
        this.closeSendMsgWindowBtn = page.locator("//button[contains(@aria-label,'Close')]");
        this.messagesTab = page.getByRole('button', { name: 'Messages' });
        this.verifySelectedMsg = page.locator("//div[@class='flex-1 min-w-0']/p").first();
        this.enterMsg = page.getByPlaceholder('Type your message...');
        //this.sendBtn = this.enterMsg.locator('..').locator('button');
        this.sendBtn = page.locator("//textarea/following-sibling::button");
        this.sendMessageBtnFromMsgTab = page.getByRole('button', { name: 'Send Message' }).last();
    }

    async verifyOrderDeliveryDetails() {
        await expect(this.manageDeliveryBtn).toBeVisible();
        await expect(this.manageCollectionBtn).toBeVisible();
        await expect(this.deliveryDetailsSec).toBeVisible();
        await expect(this.skipDetailsSec).toBeVisible();
        await expect(this.customerInfoSec).toBeVisible();
        await expect(this.orderItemsSec).toBeVisible();
    }

    async addRoadPermit() {
        await this.page.waitForTimeout(2000);
        await this.addItemBtn.click();
        await this.page.waitForTimeout(2000);
        await this.roadPermitBtn.waitFor({ state: 'visible' });
        await this.roadPermitBtn.click();
        await this.page.waitForTimeout(3000);
        await this.addBtnPopup.click();
        await this.page.waitForTimeout(2000);
        await this.permitAndDeliveryOption.click();
        await this.permitConfirnBtn.click();
        await this.page.getByRole('button', { name: 'Pay £' }).click();
    }

    async addTonneBag() {
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
        await this.page.waitForTimeout(3000);
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
        await this.payExtraBtn.waitFor({ state: 'visible' });
        await this.payExtraBtn.click();
        await this.page.waitForTimeout(5000);
    }

    async upgradeSkip() {
        await this.page.waitForTimeout(2000);
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

    async requestCollection(freelimit) {
        await this.page.waitForTimeout(2000);
        await this.manageCollectionBtn.click();
        await this.page.waitForTimeout(2000);
        await this.updateCollectionDtBtn.click();

        if (freelimit === 'yes') {
            await this.nextDeliveryDateFree.click();
            await this.page.waitForTimeout(2000);
            await this.agreeCheckbox.click();
            await this.setCollectionDateBtn.waitFor({ state: 'visible' });
            await this.setCollectionDateBtn.click();
            await this.page.waitForTimeout(3000);
        }
        else {
            await this.nextDeliveryChargeBtn.click();
            await this.page.waitForTimeout(2000);
            await this.agreeCheckbox.click();
            //await this.completePaymentBtn.waitFor({ state: 'visible' });
            await this.completePaymentBtn.click();
            // await this.page.waitForTimeout(3000);
            // await this.payBtn.waitFor({ state: 'visible' });
            // await this.payBtn.click();
            // await this.page.waitForTimeout(6000);
            await expect(this.dateexendedLlb).toBeVisible();
        }
    }

    async confirmTodaysDelivery() {
        await this.manageDeliveryBtn.click();
        await this.page.waitForTimeout(1000);
        await this.confirmDeliveryBtn.click();
        await this.page.waitForTimeout(1000);
        await this.page.setInputFiles('input[type="file"]', 'Data/test_image.png') // upload confirm delivery image
        await this.page.waitForTimeout(2000);
        await this.textArea.fill(`Today's delivery confirmed`);
        await this.page.waitForTimeout(1000);
        await this.submitBtn.click();
        await this.page.waitForTimeout(2000);
        expect(this.eventSuccessMsg).toHaveText("Event submitted successfully");
        await this.page.waitForTimeout(2000);
    }

    async missedDelivery() {
        await this.manageDeliveryBtn.click();
        await this.missedDeliveryBtn.click();
        await this.page.setInputFiles('input[type="file"]', 'Data/missed_delivery.png')// upload missed delivery image
        await this.textArea.fill('Missed Delivery');
        await this.submitBtn.click();
        expect(this.eventSuccessMsg).toHaveText("Event submitted successfully");
    }

    async confirmCollection() {
        await this.page.waitForTimeout(2000);
        await this.manageCollectionBtn.click();
        await this.page.waitForTimeout(1000);
        await this.confirmCollectionBtn.click();
        await this.page.waitForTimeout(1000);
        await this.page.setInputFiles('input[type="file"]', 'Data/skip_collected.png');
        await this.page.waitForTimeout(1000);
        await this.textArea.fill('Skip has been collected successfully!');
        await this.page.waitForTimeout(1000);
        await this.submitBtn.click();
        await this.page.waitForTimeout(3000);
        await this.collectionConfirmedtxt.scrollIntoViewIfNeeded();
        await expect(this.collectionConfirmedtxt).toBeVisible();

    }

    async missedCollection() {
        await this.page.waitForTimeout(2000);
        await this.manageCollectionBtn.click();
        await this.page.waitForTimeout(1000);
        await this.missedCollectionBtn.click();
        await this.page.waitForTimeout(1000);
        await this.page.setInputFiles('input[type="file"]', 'Data/missed_delivery.png'); // upload missed collection image
        await this.textArea.fill('Missed Collection');
        await this.submitBtn.click();
        await this.page.waitForTimeout(2000);
        expect(this.eventSuccessMsg).toHaveText("Event submitted successfully");
    }

    async verifySiteContactDetails({ cname, phone, email }) {
        await expect(this.siteContactCard).toHaveText("Site Contact");
        await expect(this.newContactName).toHaveText(cname);
        await expect(this.newContactPhone).toHaveText(phone);
        await expect(this.newContactEmail).toHaveText(email);
    }

    async addImage() {
        await expect(this.orderImagesTitle).toBeVisible();
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
        const text = await this.orderTotalAmt.textContent();
        console.log(text);
        const amt = text.slice(5);
        await this.moreOptionsBtn.click();
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
        const { fromMessageTab = false,
            messageType = 'preDefined',
            customText = '' } = options;
        // open message window
        if (fromMessageTab) {
            await this.messagesTab.click();
            await this.sendMessageBtnFromMsgTab.click();
        }
        else {
            await this.sendMessageBtn.click();
        }
        // handle message type
        let expectedMessage
        if (messageType === 'preDefined') {
            expectedMessage = await this.preDefinedMessage.textContent();
            await this.preDefinedMessage.click();
        }
        else {
            expectedMessage = customText;
            await this.enterMsg.fill(expectedMessage);
            await this.sendBtn.click();
        }
        // common steps
        await this.closeSendMsgWindowBtn.click();
        await this.page.reload();
        await this.messagesTab.click();

        await expect(this.verifySelectedMsg).toHaveText(expectedMessage);

        return expectedMessage;
    }

    async verifyAdminReply(adminReply) {
        await this.page.reload();
        await this.messagesTab.click();
        await expect(this.verifySelectedMsg).toHaveText(adminReply);
    }
}