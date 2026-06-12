import { expect } from '@playwright/test';
/** 
 * @typedef {import('@playwright/test').Page} Page
 * @typedef {import('@playwright/test').Locator} Locator 
 */

export class AccountPage {
    /** @param {Page} page */
    constructor(page) {
        this.page = page;
        this.accountStatusCard = page.locator('div').filter({
            has: page.getByRole('heading', { name: 'Account Status' }),
        }).filter({
            hasText: 'Created At',
        }).first();
        this.getCompanyName = page.getByText('Company Name').locator('..').getByText(/.+/).last();
    }

    async verifyAccountStatus(expectedStatus) {
        await expect(this.accountStatusCard).toContainText(expectedStatus);
    }

    async companyName() {
        console.log(`Company Name: ${await this.getCompanyName.innerText()}`);
        return await this.getCompanyName.innerText();
    }

    async verifyCompanyName(expectedCompanyName) {
        const actualCompanyName = await this.getCompanyName.innerText();
        expect(actualCompanyName).toBe(expectedCompanyName);
    }
}