import { expect } from '@playwright/test';

export class DashboardPage {
  constructor(page) {
    this.page = page;
    this.continueToDashboardBtn = page.getByRole('button', { name: 'Continue to Dashboard' });
    this.paymentsBtn = page.getByRole('button', { name: 'Payments' });
    this.myOrdersBtn = page.getByRole('button', { name: 'My Orders' });
    this.pastOrdersBtn = page.getByRole('button', { name: 'Past Orders' });
    this.activeOrdersBtn = page.getByRole('button', { name: 'Active Orders' });
  }

  async gotoSuccessPage() {
    //await this.page.goto('https://develop.wewantwaste.co.uk/payment/success');
    await this.continueToDashboardBtn.waitFor({ state: 'visible' });
    await this.continueToDashboardBtn.click();
    await this.page.waitForTimeout(3000);
  }

  async verifyDashboard() {
    await expect(this.paymentsBtn).toBeVisible();
    await expect(this.myOrdersBtn).toBeVisible();
    await expect(this.pastOrdersBtn).toBeVisible();
    await expect(this.activeOrdersBtn).toBeVisible();
  }
}
