import { expect } from '@playwright/test';

export class OrderDeliveryDetailsPage {
    constructor(page) {
        this.page = page;
        this.paymentsBtn = page.getByRole('button', { name: 'Payments' });
        this.collectionsBtn = page.getByRole('button', { name: 'Collections' });
        this.exchangeBtn = page.getByRole('button', { name: 'Exchange' });
        this.deliveryBtn = page.getByRole('button', { name: 'Delivery' });

        this.deliveryDetailsSec = page.locator('h3:has-text("Delivery Details")');
        this.skipDetailsSec = page.locator('h3:has-text("Skip Details")');
        this.customerInfoSec = page.locator('h3:has-text("Customer Information")');
        this.orderItemsSec = page.locator('h2:has-text("Order Items")');

        this.addItemBtn = page.getByRole('button', { name: 'Add Item' });
        this.roadPermitBtn = page.locator("//button[contains(.,'Road Permit')]");

        this.tonneBagBtn = page.locator("//button[contains(.,'Tonne Bag')]");
        this.addQuantity = page.locator("//div[@class='flex items-center space-x-4']/button[2]");
        this.verifyTonneBagLabel = page.locator('h3:has-text("Tonne Bag")');
        this.verifyTotalQuantity = page.locator("//p[contains(.,'Quantity: 2')]");

        this.addBtnPopup = page.locator("(//button[contains(.,'Add Item')])[last()]");
        this.payBtn = page.locator("(//button[contains(.,'Pay')])[last()]");
        this.roadpermitFeeLbl = page.locator("//h3[contains(.,'Road Permit Fee')]");
        this.verifyWrongSkipGuaranteeLabel = page.locator("//span[contains(., 'Wrong Skip Guarantee')]");
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

        this.collectionBtn = page.getByRole('button', { name: 'Collections' });
        this.manageCollectionLabel = page.getByRole('heading', { name: 'Manage Your Collection Date' });
        this.nextdeliveryDateFree = page.locator("(//button[contains(concat(' ', normalize-space(@class), ' '), ' bg-[#0037C1] ')])[1]/following-sibling::button[1]");
        this.agreeCheckbox = page.getByLabel('I agree to ensure the skip meets all collection requirements');
        this.setCollectionDateBtn = page.getByRole('button', { name: 'Set Collection Date' });
    }

    async verifyOrderDeliveryDetails() {
        await expect(this.paymentsBtn).toBeVisible();
        await expect(this.paymentsBtn).toBeVisible();
        await expect(this.collectionsBtn).toBeVisible();
        await expect(this.exchangeBtn).toBeVisible();
        await expect(this.deliveryBtn).toBeVisible();
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
        await this.payBtn.click();
        await expect(this.roadpermitFeeLbl).toBeVisible();
    }

    async addTonneBag() {
        await this.page.waitForTimeout(2000);
        await this.addItemBtn.click();
        await this.page.waitForTimeout(2000);
        await this.tonneBagBtn.waitFor({ state: 'visible' });
        await this.tonneBagBtn.click();
        await this.page.waitForTimeout(1000);
        await this.addQuantity.click();
        await this.addBtnPopup.click();
        await this.page.waitForTimeout(1000);
        await this.payBtn.click();
        await expect(this.verifyTonneBagLabel).toBeVisible();
        await expect(this.verifyTotalQuantity).toBeVisible();
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
        //await this.page.waitForTimeout(2000);
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
    }

    async requestCollection() {
        await this.page.waitForTimeout(2000);
        await this.collectionBtn.click();
        await expect(this.manageCollectionLabel).toBeVisible();
        await this.nextdeliveryDateFree.click();
        await this.page.waitForTimeout(2000);
        await this.agreeCheckbox.click();
        await this.setCollectionDateBtn.waitFor({ state: 'visible' });
        await this.setCollectionDateBtn.click();
        await this.page.waitForTimeout(3000);
        
    }
}