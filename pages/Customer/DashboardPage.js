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

export class DashboardPage {
  /** @param {Page} page */
  constructor(page) {
    this.page = page;
    this.continueToDashboardBtn = page.getByRole('button', { name: 'Continue to Dashboard' });
    this.paymentsBtn = page.getByRole('button', { name: 'Payments' });
    //this.myOrdersBtn = page.getByRole('button', { name: 'My Orders' });
    this.pastOrdersBtn = page.getByRole('button', { name: 'Past Orders' });
    this.activeOrdersBtn = page.getByRole('button', { name: 'Active Orders' });
    this.viewOrderDetailsBtn = page.getByRole('button', { name: 'View details' }).first();
    this.orderNumber = page.locator("//span[contains(., '#')]");
    this.orderId = '';
    this.existingOrderNumber = page.locator('h1, h2, h3').filter({ hasText: /Order #/ });
    this.commercialAccountPopUp = page.locator('div').filter({ hasText: 'Do you need a commercial' }).nth(5);
  }

  async gotoSuccessPage() {
    this.orderId = await this.orderNumber.textContent();
    //console.log(`Order ID: ${this.orderId}`);
    await this.continueToDashboardBtn.waitFor({ state: 'visible', timeout: 60000 });
    await this.continueToDashboardBtn.click();
    await this.page.waitForTimeout(3000);
  }

  async takeActionOnCommercialAccountPopUp() {
    const modal = this.page.locator('div').filter({
      has: this.page.getByRole('heading', { name: 'Do you need a commercial account?' })
    }).nth(5);
    await expect(modal).toBeVisible();
    await modal.getByRole('button', { name: 'No thanks, continue' }).click();
    await expect(modal).toBeHidden();
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
        expect(innerDivText).toContain("Wrong Skip Guarantee");
      }
      else {
        console.log(`Inner div at index ${i} does not contain the order ID: ${innerDivText}`);
      }
      break;
    }
  }
  async verifyDashboard() {
    await expect(this.paymentsBtn).toBeVisible();
    //await expect(this.myOrdersBtn).toBeVisible();
    await expect(this.pastOrdersBtn).toBeVisible();
    await expect(this.activeOrdersBtn).toBeVisible();
  }
  async navigateToViewOrderDetails() {
    await this.viewOrderDetailsBtn.waitFor({ state: 'visible' });
    await this.viewOrderDetailsBtn.click();
    const text = await this.existingOrderNumber.textContent();
    const orderId = await text.split('#')[1];
    console.log(`Extracted Order ID: ${orderId}`);
    return orderId;
  }
}
