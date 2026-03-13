import { expect } from '@playwright/test';
/**
 * @typedef {import('@playwright/test').Page} Page
 * @typedef {import('@playwright/test').Locator} Locator
 */
export class SupplierMenuNavigation {
    /** @param {Page} page */
    constructor(page) {
        this.page = page;
        this.dashboardMenuLink = page.getByRole('link', { name: 'Dashboard' });
        this.accountMenuLink = page.getByRole('link', { name: 'Account' });
        this.doItLaterBtn = page.getByRole('button', { name: 'Do it later' });
        this.usersMenuLink = page.getByRole('link', { name: 'Users' });
        this.accountStatusSection = page.getByText('Account Status').locator('..').last();//.getByText(/Active/);
    }

    async redirectToUsersPage() {
        if (await this.doItLaterBtn.isVisible()) {
            await this.doItLaterBtn.click();
            await this.page.waitForTimeout(2000);
        }
        // Step 2: Navigate to Users page
        await this.usersMenuLink.waitFor({ state: 'visible' });
        await this.usersMenuLink.click();
        await this.page.waitForTimeout(2000);
    }

    async navigateToAccountPage() {
        await this.accountMenuLink.click();
        await this.accountStatusSection.waitFor({ state: 'visible' });
        await this.page.waitForTimeout(2000);
    }
    async navigateToDashboardPage() {
        await this.dashboardMenuLink.click();
        await this.page.waitForTimeout(2000);
    }
}