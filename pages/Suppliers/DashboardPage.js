import { expect } from '@playwright/test';

/** 
 * @typedef {import('@playwright/test').Page} Page
 * @typedef {import('@playwright/test').Locator} Locator 
 */

export class DashboardPage {
    /** @param {Page} page */
    constructor(page) {
        this.page = page;
        this.pageHeading = page.getByRole('heading', { name: 'Supplier Dashboard' });
    }

    async verifyDashboardPageLoaded() {
        await this.pageHeading.waitFor({ state: 'visible' });
        await expect(this.pageHeading).toHaveText('Supplier Dashboard');
    }
}