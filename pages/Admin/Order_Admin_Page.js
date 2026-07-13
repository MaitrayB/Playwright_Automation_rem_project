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
        await viewButton.click({ force: true });
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

    async openFinancialsTab() {
        const financialsTab = this.page.getByRole('button', { name: /^Financials$/i })
            .or(this.page.getByText('Financials', { exact: true }));
        await financialsTab.first().waitFor({ state: 'visible', timeout: 15000 });
        await financialsTab.first().click({ force: true });
        await expect(this.page.getByRole('heading', { name: 'Order Items' }).first()).toBeVisible({ timeout: 15000 });
    }

    async verifySkipTarpAdminLineItem({ expectedTarpSize, expectedPriceExVat } = {}) {
        await this.openFinancialsTab();
        const tarpHeading = this.page.getByRole('heading', { name: /Skip Tarp(aulin)?\s*\(/i })
            .or(this.page.getByText(/Skip Tarpaulin\s*\(/i));
        await expect(tarpHeading.first()).toBeVisible({ timeout: 10000 });
        await expect(tarpHeading.first()).toHaveText(
            new RegExp(`Skip Tarp(aulin)?\\s*\\(${expectedTarpSize}\\)`, 'i')
        );

        const block = tarpHeading.first().locator(
            'xpath=ancestor::div[.//text()[contains(.,"Quantity")] and .//text()[contains(.,"£")]][1]'
        );
        await expect(block.getByText(/Quantity:\s*1/i)).toBeVisible();
        if (expectedPriceExVat != null) {
            await expect(
              block.getByText(`£${Number(expectedPriceExVat).toFixed(2)}`, { exact: true })
            ).toBeVisible();
        }
    }

    async verifyTieDownAdminLineItem({ expectedPriceExVat } = {}) {
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
        return block;
    }

    async verifyNoTieDownDeliveryStatusSection() {
        await expect(
            this.page.getByRole('heading', { name: /Tie Down Delivery|TIE DOWN DELIVERY/i })
        ).toHaveCount(0);
        await expect(this.page.getByText(/Tie down included with this order/i)).toHaveCount(0);
    }

    async removeTieDownIfRemovable() {
        await this.openFinancialsTab();
        const tieDownHeading = this.page.getByText('Tie Down (Reflective Guy Rope)', { exact: true }).first();
        await expect(tieDownHeading).toBeVisible({ timeout: 10000 });
        const block = tieDownHeading.locator(
            'xpath=ancestor::div[.//button[contains(.,"Remove")] or .//text()[contains(.,"Remove")]][1]'
        );
        const removeBtn = block.getByRole('button', { name: /^Remove$/i }).first();
        await expect(removeBtn).toBeVisible({ timeout: 10000 });
        await removeBtn.click();

        // Confirm dialog if present
        const confirmBtn = this.page.getByRole('button', { name: /Confirm|Remove|Yes/i }).last();
        if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            const confirmText = (await confirmBtn.textContent()) || '';
            if (/confirm|remove|yes/i.test(confirmText)) {
                await confirmBtn.click();
            }
        }

        await expect(
            this.page.getByText('Tie Down (Reflective Guy Rope)', { exact: true })
        ).toHaveCount(0, { timeout: 15000 });
    }
}