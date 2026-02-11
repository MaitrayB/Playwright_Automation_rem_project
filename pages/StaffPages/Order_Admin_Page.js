import { expect } from 'allure-playwright';
import { AdminLogin } from '../../pages/StaffPages/AdminLogin';
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

export class Order_Admin_Page {
    /** @param {Page} page */

    constructor(page) {
        this.page = page;
        this.searchInput = page.locator("//input[contains(@placeholder,'Search')]");
        // Order Details Page - admin
        this.sendMsgBtn = page.getByRole('button', { name: 'Send Message' });
        this.customerLastMsg = page.locator("//div[contains(@class,'flex justify-start')]").last();
        this.repliedMsg = page.locator("//div[@class='flex flex-wrap gap-2']/button").filter({ hasText: 'Your order is being prioritized.' });
    }

    async getOrderDetails(orderId) {
        await this.searchInput.waitFor();
        await this.searchInput.fill(orderId);
        await this.page.locator(`table tbody tr td`, { hasText: orderId }).waitFor({ state: 'visible' });

        const table = this.page.locator('table');
        const tbody = table.locator('tbody');
        const row = tbody.locator('tr', { hasText: orderId });

        await row.locator('td').allTextContents();
        const viewButton = row.getByRole('button', { name: 'View Order' });
        await viewButton.click();
    }

    async adminRepliesToCustomer(msgText) {
        await this.sendMsgBtn.click();
        const lastCustMsg = await this.customerLastMsg.textContent();
        expect(lastCustMsg).toContain(msgText);
        const adminReply = await this.repliedMsg.textContent();
        await this.repliedMsg.click();
        return adminReply;
    }
}