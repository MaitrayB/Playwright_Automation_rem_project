export class OrderPage {
  constructor(page) {
   
    this.page = page;
    this.postcodeInput = page.getByRole('textbox', { name: 'Start Typing Your Delivery' });
    this.continueBtn = page.getByRole('button', { name: 'Continue' });
   
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

    this.noPermitBtn = page.getByRole('button', { name: 'No, continue without' });
    this.privatePropertyBtn = page.getByRole('button', { name: 'Private Property Driveway or' });
    this.dateBtn = page.getByRole('button', { name: '30' });
    this.skipCheckbox = page.getByText('Skip this step to upload a');

    this.publicPropertyBtn = page.getByRole('button', { name: 'Public Property Council or' });
    this.grassVergeBtn = page.getByRole('button', { name: 'Grass verge / footpath / pavement Between road and property Permit required' });
    this.grassNoPermitBtn = page.getByText('I maintain this land myself');
    this.grassPopupContinueBtn = page.locator('div').filter({ hasText: /^CancelContinue$/ }).getByRole('button', { name: 'Continue' });
    this.notsureBtn = page.getByRole('button', { name: 'Unsure We will check for you We\'ll determine if a permit is needed' });

    this.noBtn = page.locator('//button[contains(.,"No")]');
    this.termsCheckbox = page.getByRole('checkbox', { name: 'I agree to the terms and' });
    this.completePaymentBtn = page.getByRole('button', { name: 'Complete Payment' });
    

  }

  //Postcode selection
  async enterPostcode(postcode) {
    await this.postcodeInput.waitFor({ state: 'visible' });
    await this.postcodeInput.fill(postcode);
    await this.page.getByRole('button').nth(3).click();
    
    if (await this.page.getByRole('button').nth(3).isVisible())
    {await this.page.getByRole('button').nth(3).click();}

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
      await this.heavyWasteYesbtn.waitFor({ state: 'visible' });
      this.heavyWasteYesbtn.click();
    }
    else {
      await this.heavyWasteNobtn.waitFor({ state: 'visible' });
      this.heavyWasteNobtn.click();
    }
    await this.page.waitForTimeout(1000);

    if (PlasterBoard === 'Yes') {
      await this.plasterboardYesbtn.waitFor({ state: 'visible' });
      this.plasterboardYesbtn.click();
    }
    else {
      await this.plasterboardNobtn.waitFor({ state: 'visible' });
      this.plasterboardNobtn.click();
    }
   
    await this.continueBtn.click();
    await this.page.waitForTimeout(1000);
  }

  async selectSkip(skipSize) {
    this.skipYardBtn = this.page.locator(`xpath=(//div[contains(.,"${skipSize} Yard Skip")]/../button)[1]`);
    await this.skipYardBtn.waitFor({ state: 'visible' });
    await this.skipYardBtn.click();

    await this.continueBtn.click();
    await this.noPermitBtn.click();
    await this.page.waitForTimeout(1000);
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
else if( Placement === 'Public Property') {
  await this.publicPropertyBtn.click();
  await this.continueBtn.click();
  await this.page.setInputFiles('input[type="file"]', 'Data/download.jpeg'); //upload permit file
  await this.continueBtn.click();
}
  else if( Placement === 'Grass verge') {
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
  await this.page.setInputFiles('input[type="file"]', 'Data/download.jpeg');
  await this.continueBtn.click(); 
}


}

  async chooseDate(Day) {
    
    this.dateBtn = this.page.getByRole('button', { name: Day });
    await this.dateBtn.waitFor({ state: 'visible' });
    await this.dateBtn.click();
    await this.continueBtn.click();

    await this.noBtn.waitFor({ state: 'visible' });
    await this.noBtn.click();

    await this.page.waitForTimeout(6000);
  }

  async completePayment() {
    await this.termsCheckbox.waitFor({ state: 'visible' });
    await this.termsCheckbox.check();
    await this.completePaymentBtn.waitFor({ state: 'visible' });
    await this.completePaymentBtn.click();
    await this.page.waitForTimeout(10000);
  }
}
