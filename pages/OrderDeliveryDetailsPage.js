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
}