import { expect } from '@playwright/test';
export class BankInformationPage {
    /** @param {Page} page */
    constructor(page) {
        this.page = page;
        this.pageHeading = page.getByRole('heading', { name: 'Bank & Payouts' });
        this.setupPayoutsBtn = page.getByRole('button', { name: 'Set up payouts' });
    }
    async verifyBankInformationPage() {
        await this.pageHeading.waitFor({ state: 'visible' });
        await expect(this.pageHeading).toBeVisible();
    }
    async goToSetupPayoutsWindow() {
        await this.setupPayoutsBtn.click();
    }
}