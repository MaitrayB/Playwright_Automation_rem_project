export class OrderPage {
  constructor(page) {

    this.page = page;
    this.postcodeInput = page.getByRole('textbox', { name: 'Start Typing Your Delivery' });
    this.continueBtn = page.getByRole('button', { name: 'Continue' });
    this.confirmBtn = page.getByRole('button', { name: 'Confirm' });
    this.streetInput = page.locator('div').filter({ hasText: /^Street Name$/ }).getByRole('textbox');
    this.houseNoInput = page.locator('div').filter({ hasText: /^House\/Flat Number$/ }).getByRole('textbox');


    this.constructionWasteBtn = page.getByRole('button', { name: 'Construction Waste Building' });
    this.commercialWasteBtn = page.getByRole('button', { name: 'Commercial Waste' });
    this.gardenWasteBtn = page.getByRole('button', { name: 'Garden Waste' });
    this.houseHoldWasteBtn = page.getByRole('button', { name: 'Household Waste' });

    this.plasterboardNobtn = page.locator('xpath=//h4[contains(.,"Do you have any plasterboard")]/../div/label[contains(.,"No")]');
    this.plasterboardYesbtn = page.locator('xpath=//h4[contains(.,"Do you have any plasterboard")]/../div/label[contains(.,"Yes")]');
    this.heavyWasteNobtn = page.locator('xpath=//h4[contains(.,"Do you have any heavy waste?")]/../div/label[contains(.,"No")]');
    this.heavyWasteYesbtn = page.locator('xpath=//h4[contains(.,"Do you have any heavy waste?")]/../div/label[contains(.,"Yes")]');

    const skipSize = 6;
    this.skipYardBtn = page.locator(`xpath=(//div[contains(.,"${skipSize} Yard Skip")]/../button)[1]`);

    this.noSkipGauranteeBtn = page.getByRole('button', { name: 'No, continue without' });
    this.toneBagtile = page.locator('(//div[contains(.,"Use Tonne Bags")])[last()]');
    this.nextArrowIcon = page.locator('.p-2 > div:nth-child(2) > div > button')
    this.privatePropertyBtn = page.getByRole('button', { name: 'Private Property Driveway or' });
    this.dateBtn = page.getByRole('button', { name: '30' });
    this.skipCheckbox = page.getByText('Skip this step to upload a');

    this.publicPropertyBtn = page.getByRole('button', { name: 'Public Property Council or' });
    this.grassVergeBtn = page.getByRole('button', { name: 'Grass verge / footpath / pavement Between road and property Permit required' });
    this.grassNoPermitBtn = page.getByText('I maintain this land myself');
    this.grassPopupContinueBtn = page.locator('div').filter({ hasText: /^CancelContinue$/ }).getByRole('button', { name: 'Continue' });
    this.notsureBtn = page.getByRole('button', { name: 'Unsure We will check for you We\'ll determine if a permit is needed' });

    this.noBtn = page.locator('//button[contains(.,"No")]');

    this.calendarNextArrow = page.getByRole('button', { name: '→' })

    //Paymentform
    this.cardNumberLocator = page.frameLocator('iframe[name^="__privateStripe"]').nth(0).locator('xpath=//input[@id="Field-numberInput"]');
    this.expiryDate = page.frameLocator('iframe[name^="__privateStripe"]').nth(0).locator('xpath=//input[@id="Field-expiryInput"]');
    this.cvc = page.frameLocator('iframe[name^="__privateStripe"]').nth(0).locator('xpath=//input[@id="Field-cvcInput"]');

    this.termsCheckbox = page.getByRole('checkbox', { name: 'I agree to the terms and' });
    this.completePaymentBtn = page.getByRole('button', { name: 'Complete Payment' });


  }

  //Postcode selection
  async enterPostcode(postcode) {
    await this.page.waitForLoadState('networkidle');
    await this.postcodeInput.waitFor({ state: 'visible', timeout: 60000 });
    await this.postcodeInput.fill(postcode);
    await this.page.getByRole('button').nth(3).click();

    if (await this.page.getByRole('button').nth(3).isVisible()) { await this.page.getByRole('button').nth(3).click(); }

    await this.page.waitForTimeout(2000);

    //see if house and street are not auto filled then fill them
    if (await this.streetInput.inputValue() === '') {
      await this.streetInput.fill('Main Street');
    }


    if (await this.houseNoInput.inputValue() === '') {
      await this.houseNoInput.fill('123');
    }


    await this.continueBtn.click();
    await this.page.waitForTimeout(1000);
  }

  //Waste type selection
  async selectWaste(wastetype) {

    if (wastetype === 'Construction Waste') {
      await this.constructionWasteBtn.waitFor({ state: 'visible' });
      await this.constructionWasteBtn.click();
    }

    if (wastetype === 'Garden Waste') {
      await this.gardenWasteBtn.waitFor({ state: 'visible' });
      await this.gardenWasteBtn.click();
    }

    if (wastetype === 'Commercial Waste') {
      await this.commercialWasteBtn.waitFor({ state: 'visible' });
      await this.commercialWasteBtn.click();
    }

    if (wastetype === 'Household Waste') {
      await this.houseHoldWasteBtn.waitFor({ state: 'visible' });
      await this.houseHoldWasteBtn.click();
    }
  }

  async continueWaste(HeavyWaste, PlasterBoard) {
    await this.continueBtn.click();

    if (HeavyWaste === 'Yes') {
      await this.page.waitForTimeout(1000);
      if (await this.heavyWasteYesbtn.isVisible()) {
        this.heavyWasteYesbtn.click();
      }
    }
    else {
      if (await this.heavyWasteNobtn.isVisible()) {
        this.heavyWasteNobtn.click();
      }
    }
    await this.page.waitForTimeout(1000);

    if (PlasterBoard === 'Yes') {
      if (await this.plasterboardYesbtn.isVisible()) {
        this.plasterboardYesbtn.click();
      }
    }
    else {
      if (await this.plasterboardNobtn.isVisible()) {
        this.plasterboardNobtn.click();
      }
    }

    await this.continueBtn.click();
    await this.page.waitForTimeout(1000);
  }

  async selectSkip(skipSize, Plasterboard, ToneBag, SelfDispose) {
    this.skipYardBtn = this.page.locator(`xpath=(//div[contains(.,"${skipSize} Yard Skip")]/../button)[1]`);

    await this.page.waitForTimeout(2000);

    if (!(await this.skipYardBtn.isVisible())) {
      skipSize = 4;
      this.skipYardBtn = this.page.locator(`xpath=(//div[contains(.,"${skipSize} Yard Skip")]/../button)[1]`);

      if (!(await this.skipYardBtn.isVisible())) {
        skipSize = 6;
        this.skipYardBtn = this.page.locator(`xpath=(//div[contains(.,"${skipSize} Yard Skip")]/../button)[1]`);
      }

    }
    await this.skipYardBtn.click();

    await this.continueBtn.click();
    await this.noSkipGauranteeBtn.click();
    await this.page.waitForTimeout(1000);

    if (Plasterboard === 'Yes') {
      if (ToneBag === 'Yes') {

        await this.confirmBtn.click();

      }
      else {
        await this.nextArrowIcon.click();
        await this.confirmBtn.click();
      }
    }
  }


  //permit check
  async permitCheck(Placement) {

    if (Placement === 'Private Property') {

      await this.privatePropertyBtn.click();
      await this.continueBtn.click();
      await this.skipCheckbox.waitFor({ state: 'visible' });
      await this.skipCheckbox.click();
      await this.continueBtn.click();
    }
    else if (Placement === 'Public Property') {
      await this.publicPropertyBtn.click();
      await this.continueBtn.click();
      await this.page.setInputFiles('input[type="file"]', 'Data/download.jpeg'); //upload permit file
      await this.continueBtn.click();
    }
    else if (Placement === 'Grass verge') {
      await this.grassVergeBtn.waitFor({ state: 'visible' });
      await this.grassVergeBtn.click();

      await this.grassNoPermitBtn.waitFor({ state: 'visible' });
      await this.grassNoPermitBtn.click();
      await this.grassPopupContinueBtn.click();
      await this.page.waitForTimeout(2000);
      await this.continueBtn.click();
      await this.page.setInputFiles('input[type="file"]', 'Data/download.jpeg');
      await this.continueBtn.click();

    }

    else {
      await this.notsureBtn.click();
      await this.continueBtn.click();
      await this.page.setInputFiles('input[type="file"]', './Data/download.jpeg');
      await this.continueBtn.click();
    }


  }

  async chooseDate(Day) {

    await this.calendarNextArrow.click();
    this.dateBtn = this.page.getByRole('button', { name: Day });
    if (await this.dateBtn.isDisabled()) {
      Day = Day - 2;
    }
    this.dateBtn = this.page.getByRole('button', { name: Day });
    await this.dateBtn.waitFor({ state: 'visible' });
    await this.dateBtn.click();
    await this.continueBtn.click();

    await this.page.waitForTimeout(3000);
    if (await this.noBtn.isVisible()) {
      await this.noBtn.click();
    }

    await this.page.waitForTimeout(5000);
    //await this.page.waitForLoadState('networkidle');
  }

  async completePayment() {

    await this.cardNumberLocator.waitFor({ state: 'visible' });
    await this.cardNumberLocator.fill('4111 1111 1111 1111');
    await this.expiryDate.fill('12/34');
    await this.cvc.fill('123');
    await this.page.waitForTimeout(2000);

    await this.termsCheckbox.waitFor({ state: 'visible' });
    await this.termsCheckbox.check();
    await this.completePaymentBtn.waitFor({ state: 'visible' });

    await this.completePaymentBtn.click();
  }
}