import { expect } from "allure-playwright";
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
        this.orderChatBtn = page.locator('h1, h2, h3').filter({ hasText: /Order #/ }).locator('..').getByRole('button', { name: /^(Chat|Open chat)$/i });
        this.latestChatThread = page.locator('.divide-y button').first();
        this.customerLastMsg = page.locator("div[class*='flex justify-start']").last();
        this.replyInput = page.getByPlaceholder('Type a message...');
        this.quickReplyBtns = page.locator('div.flex.flex-wrap.gap-2 button');
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
        await this.orderChatBtn.click();
        await this.latestChatThread.waitFor({ state: 'visible' });
        await this.latestChatThread.click();
        await this.page.waitForTimeout(2000);

        const lastCustMsg = await this.customerLastMsg.textContent();
        expect(lastCustMsg).toContain(msgText);

        let adminReply;
        if (await this.quickReplyBtns.count() > 0) {
            const replyBtn = this.quickReplyBtns.first();
            adminReply = (await replyBtn.textContent()).trim();
            await replyBtn.click();
        } else {
            adminReply = 'Your order is being prioritized.';
            await this.replyInput.fill(adminReply);
            await this.page.locator('button[type="submit"], button:has(svg.lucide-send)').click();
        }
        await this.page.waitForTimeout(2000);
        return adminReply;
    }
}