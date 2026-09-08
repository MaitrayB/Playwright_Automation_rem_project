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
    const orderVisible = await this.orderNumber.first().isVisible({ timeout: 20000 }).catch(() => false);
    if (orderVisible) {
      this.orderId = await this.orderNumber.first().textContent();
    }
    await this.continueToDashboardBtn.waitFor({ state: 'visible', timeout: 60000 });
    await this.continueToDashboardBtn.click();
    await this.page.waitForTimeout(3000);
  }

  async takeActionOnCommercialAccountPopUp() {
    const heading = this.page.getByRole('heading', { name: 'Do you need a commercial account?' });
    if (!(await heading.isVisible({ timeout: 5000 }).catch(() => false))) {
      console.log('Commercial account popup not shown');
      return;
    }
    const dismiss = this.page.getByRole('button', { name: /No thanks, continue/i });
    await dismiss.click();
    await expect(heading).toBeHidden({ timeout: 10000 });
  }

  async verifyWrongSkipGuarantee() {
    const guarantee = this.page.getByText(/Wrong Skip Guarantee/i).first();
    await expect(guarantee).toBeVisible({ timeout: 15000 });
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

  async navigateToEditableOrderDetails() {
    const buttons = this.page.getByRole('button', { name: 'View details' });
    await buttons.first().waitFor({ state: 'visible', timeout: 20000 });
    const count = await buttons.count();
    console.log(`View details count: ${count}`);

    let clicked = false;
    for (let i = 0; i < count; i++) {
      const cardText = await buttons.nth(i).evaluate((btn) => {
        let el = btn.parentElement;
        while (el) {
          const text = el.innerText || '';
          if (/until delivery/i.test(text) && text.length < 2000) {
            return text;
          }
          el = el.parentElement;
        }
        return '';
      });
      if (/until delivery/i.test(cardText)) {
        console.log(`Opening editable order card ${i}`);
        await buttons.nth(i).click();
        clicked = true;
        break;
      }
    }
    if (!clicked) {
      console.log('No until-delivery card found, opening first View details');
      await buttons.first().click();
    }

    const text = await this.existingOrderNumber.textContent();
    const orderId = await text.split('#')[1];
    console.log(`Extracted Order ID: ${orderId}`);
    return orderId;
  }
}
