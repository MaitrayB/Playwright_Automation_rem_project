import { expect } from '@playwright/test';

export class DashboardPage {
  constructor(page) {
    this.page = page;
    this.continueToDashboardBtn = page.getByRole('button', { name: 'Continue to Dashboard' });
    this.paymentsBtn = page.getByRole('button', { name: 'Payments' });
    this.myOrdersBtn = page.getByRole('button', { name: 'My Orders' });
    this.pastOrdersBtn = page.getByRole('button', { name: 'Past Orders' });
    this.activeOrdersBtn = page.getByRole('button', { name: 'Active Orders' });
    this.viewOrderDetailsBtn = page.locator('(//button[contains(.,"View Order Details")])[1]');
    this.orderNumber = page.locator("//span[contains(., '#')]");
    this.orderId = '';
  }

  async gotoSuccessPage() {
    this.orderId = await this.orderNumber.textContent();
    //console.log(`Order ID: ${this.orderId}`);
    await this.continueToDashboardBtn.waitFor({ state: 'visible', timeout: 60000 });
    await this.continueToDashboardBtn.click();
    await this.page.waitForTimeout(3000);
  }

  async verifyWrongSkipGuarantee() {
    const mainDivLocatorv = this.page.locator("//div[@class='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6']");
    // Locate all div elements within the main div
    const innerDivsLocator = mainDivLocatorv.locator('div');
    // Get the count of inner divs
    const innerDivCount = await innerDivsLocator.count();
    // Iterate and print the text content of each inner div

    for (let i = 0; i < innerDivCount; i++) {
      const innerDivText = await innerDivsLocator.nth(i).textContent();
      console.log(`Inner Div ${i + 1} Text: ${innerDivText.trim()}`);

      // Verify if innerText contains the specific order ID
      if (innerDivText.includes(this.orderId)) {
        // console.log(`Inner div at index ${i} contains the order ID: ${innerDivText}`);
        expect(innerDivText).toContain("🛡️ Wrong Skip Guarantee");
      }
      else {
        console.log(`Inner div at index ${i} does not contain the order ID: ${innerDivText}`);
      }
      break;
    }
  }
  async verifyDashboard() {
    await expect(this.paymentsBtn).toBeVisible();
    await expect(this.myOrdersBtn).toBeVisible();
    await expect(this.pastOrdersBtn).toBeVisible();
    await expect(this.activeOrdersBtn).toBeVisible();
  }
  async navigateToViewOrderDetails() {
    await this.viewOrderDetailsBtn.waitFor({ state: 'visible' });
    await this.page.waitForTimeout(2000);
    await this.viewOrderDetailsBtn.click();
    await this.page.waitForTimeout(2000);
  }
}
