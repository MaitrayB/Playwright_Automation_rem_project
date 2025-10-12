export class OrderPage {
  constructor(page) {
    this.page = page;
    this.postcodeInput = page.getByRole('textbox', { name: 'Start Typing Your Delivery' });
    this.continueBtn = page.getByRole('button', { name: 'Continue' });
    this.constructionWasteBtn = page.getByRole('button', { name: 'Construction Waste Building' });
    this.skip4YardBtn = page.locator('div').filter({ hasText: /^-24%4 Yards4 Yard Skip14 day hire periodSelect This Skip$/ }).getByRole('button');
    this.noPermitBtn = page.getByRole('button', { name: 'No, continue without' });
    this.privatePropertyBtn = page.getByRole('button', { name: 'Private Property Driveway or' });
    this.date30Btn = page.getByRole('button', { name: '30' });
    this.termsCheckbox = page.getByRole('checkbox', { name: 'I agree to the terms and' });
    this.completePaymentBtn = page.getByRole('button', { name: 'Complete Payment' });
    this.plasterboardNobtn = page.locator('xpath=//h4[contains(.,"Do you have any plasterboard")]/../div/label[contains(.,"No")]');
  }

  async enterPostcode(postcode) {
    await this.postcodeInput.waitFor({ state: 'visible' });
    await this.postcodeInput.fill(postcode);
    await this.page.getByRole('button').nth(3).click();
    await this.page.getByRole('button').nth(3).click();
    await this.continueBtn.click();
    await this.page.waitForTimeout(1000);
  }

  async selectWaste() {
    await this.constructionWasteBtn.waitFor({ state: 'visible' });
    await this.constructionWasteBtn.click();
    await this.continueBtn.click();
    await this.page.locator('label').nth(1).click(); // Adjusted locators
    await this.plasterboardNobtn.click();
    await this.continueBtn.click();
    await this.page.waitForTimeout(1000);
  }

  async selectSkip() {
    await this.skip4YardBtn.waitFor({ state: 'visible' });
    await this.skip4YardBtn.click();
    await this.continueBtn.click();
    await this.noPermitBtn.click();
    await this.privatePropertyBtn.click();
    await this.continueBtn.click();
    await this.page.getByText('Skip this step to upload a').waitFor({ state: 'visible' });
    await this.page.getByText('Skip this step to upload a').click();
    await this.page.waitForTimeout(1000);
  }

  async chooseDate() {
    await this.continueBtn.click();
    await this.date30Btn.waitFor({ state: 'visible' });
    await this.date30Btn.click();
    await this.continueBtn.click();
    await this.page.waitForTimeout(1000);
  }

  async completePayment() {
    await this.termsCheckbox.waitFor({ state: 'visible' });
    await this.termsCheckbox.check();
    await this.completePaymentBtn.waitFor({ state: 'visible' });
    await this.completePaymentBtn.click();
    //await this.page.waitForTimeout(20000);
  }
}
