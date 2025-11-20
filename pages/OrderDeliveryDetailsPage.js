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
}