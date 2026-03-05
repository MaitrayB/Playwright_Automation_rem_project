import { expect } from '@playwright/test';
/** 
 * @typedef {import('@playwright/test').Page} Page
 * @typedef {import('@playwright/test').Locator} Locator 
 */

export class SupplierAccount {
    /** @param {Page} page */
    constructor(page) {
        this.page = page;
        this.accountMenu = page.getByRole('link', { name: 'Account' });
        this.accountStatusSection = page.getByText('Account Status').locator('..').last();//.getByText(/Active/);
    }

    async navigateToAccountPage() {
        await this.accountMenu.click();
        await this.accountStatusSection.waitFor({ state: 'visible' });
    }

    async verifyAccountStatus(expectedStatus) {
        await expect(this.accountStatusSection).toContainText(expectedStatus);
    }
}