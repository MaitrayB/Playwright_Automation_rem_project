import { expect } from '@playwright/test';
/** 
 * @typedef {import('@playwright/test').Page} Page
 * @typedef {import('@playwright/test').Locator} Locator 
 */

export class AccountPage {
    /** @param {Page} page */
    constructor(page) {
        this.page = page;
        this.accountStatusSection = page.getByText('Account Status').locator('..').last();//.getByText(/Active/);
        this.getCompanyName = page.getByText('Company Name').locator('..').getByText(/.+/).last();
    }

    async verifyAccountStatus(expectedStatus) {
        await expect(this.accountStatusSection).toContainText(expectedStatus);
    }

    async companyName() {
        console.log(`Company Name: ${await this.getCompanyName.innerText()}`);
        return await this.getCompanyName.innerText();
    }
}