import { expect } from "allure-playwright";
import { genericFunctions } from '../../utils/genericFunctions.js';
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

export class OrderPage {
  /** @param {Page} page */
  constructor(page) {

    this.page = page;
    this.closeBtnFromTermsPage = page.getByRole('button', { name: 'Close' });
    this.postcodeInput = page.getByRole('textbox', { name: 'Start Typing Your Delivery' });
    this.continueBtn = page.getByRole('button', { name: 'Continue' });
    this.confirmBtn = page.getByRole('button', { name: 'Confirm' });
    this.streetInput = page.locator('div').filter({ hasText: /^Street Name$/ }).getByRole('textbox');
    this.houseNoInput = page.locator('div').filter({ hasText: /^House\/Flat Number$/ }).getByRole('textbox');


    this.constructionWasteBtn = page.getByRole('button', { name: 'Construction Waste Building' });
    this.commercialWasteBtn = page.getByRole('button', { name: 'Commercial Waste' });
    this.gardenWasteBtn = page.getByRole('button', { name: 'Garden Waste' });
    this.houseHoldWasteBtn = page.getByRole('button', { name: 'Household Waste' });

    //this.plasterboardNobtn = page.locator('xpath=//h4[contains(.,"Do you have any plasterboard")]/../div/label[contains(.,"No")]');
    this.plasterboardNobtn = page.getByRole('button', { name: 'No' }).nth(2)
    //this.plasterboardYesbtn = page.locator('xpath=//h4[contains(.,"Do you have any plasterboard")]/../div/label[contains(.,"Yes")]');
    this.plasterboardYesbtn = page.getByRole('button', { name: 'Yes' }).nth(1)
    //this.heavyWasteNobtn = page.locator('xpath=//h4[contains(.,"Do you have any heavy waste?")]/../div/label[contains(.,"No")]');
    this.heavyWasteNobtn = page.getByRole('button', { name: 'No' }).nth(1)
    //this.heavyWasteYesbtn = page.locator('xpath=//h4[contains(.,"Do you have any heavy waste?")]/../div/label[contains(.,"Yes")]');
    this.heavyWasteYesbtn = page.getByRole('button', { name: 'Yes' }).first()

    const skipSize = 6;
    this.skipYardBtn = page.locator(`xpath=(//div[contains(.,"${skipSize} Yard Skip")]/../button)[1]`);
    this.howItWorksBtn = page.getByRole('button', { name: 'See how it works' });
    this.popUpHeading = page.locator('h2:has-text("Not sure what size skip you need?")');
    this.wrongSkipPopUp = page.locator("//h3[contains(., 'Wrong Skip Guarantee')]");
    this.dontAddWrongSkipBtn = page.getByRole('button', { name: `No, don't add` });
    this.addWrongSkipGuaranteeBtn = page.locator("//button[contains(.,'Yes, add Wrong Skip Guarantee')]");
    this.modifyGuaranteeBtn = page.locator("//div[@class='hidden md:flex items-center space-x-2']/button[contains(.,'Modify Guarantee')]");
    this.paymentPageWrongSkipGuaranteeSection = page.locator("//h3[contains(.,'Wrong Skip Guarantee')]");

    //this.noSkipGauranteeBtn = page.getByRole('button', { name: 'No, continue without' });
    this.noSkipGauranteeBtn = page.getByRole('button', { name: 'No, don\'t add' })
    this.toneBagtile = page.locator('(//div[contains(.,"Use Tonne Bags")])[last()]');
    this.nextArrowIcon = page.locator('.p-2 > div:nth-child(2) > div > button');
    //this.privatePropertyBtn = page.getByRole('button', { name: 'Private Property Driveway or' });
    this.privatePropertyBtn = page.getByRole('button', { name: 'View larger image Private' });
    this.dateBtn = page.getByRole('button', { name: '30', exact: true });
    // this.skipCheckbox = page.getByText('Skip this step to upload a photo');
    this.skipCheckbox = page.getByRole('button', { name: 'I\'ll skip this for now' });
    // this.skipTarpNoBtn = page.locator('//button[contains(.,"No, continue without")]');
    this.skipTarpNoBtn = page.getByRole('button', { name: 'No, continue without' });
    this.skipTarpYesBtn = page.locator('//button[.="Yes, add Skip Tarp"]');
    this.tarpDiv = page.locator("//img[@alt='Skip Tarp']/../div");


    //this.publicPropertyBtn = page.getByRole('button', { name: 'Public Property Council or' });
    this.publicPropertyBtn = page.getByRole('button', { name: 'View larger image Public' });
    //this.grassVergeBtn = page.getByRole('button', { name: 'Grass verge / footpath / pavement Between road and property Permit required' });
    this.grassVergeBtn = page.getByRole('button', { name: 'View larger image Grass verge' });
    this.grassNoPermitBtn = page.getByText('I maintain this land myself');
    this.grassPopupContinueBtn = page.locator('div').filter({ hasText: /^CancelContinue$/ }).getByRole('button', { name: 'Continue' });
    //this.notsureBtn = page.getByRole('button', { name: 'Unsure We will check for you We\'ll determine if a permit is needed' });
    this.notsureBtn = page.getByRole('button', { name: 'Unsure We will check for you' });

    // Disposal Method locators
    this.disposableMethods = page.locator('.px-4.sm\\:px-5.space-y-2\\.5');

    this.noBtn = page.locator('//button[contains(.,"No")]');
    this.upholsteredFurnitureNoBtn = page.locator("//h3[contains(.,'Do you have any')]/../..//button[contains(.,'No')]");

    this.calendarNextArrow = page.getByRole('button', { name: '→' })

    //Paymentform
    const stripeFrame = page.locator('//iframe[contains(@name,"__privateStripeFrame")]').first().contentFrame();
    this.cardNumberLocator = stripeFrame.locator('//input[@id="payment-numberInput"]');
    this.expiryDate = stripeFrame.locator('//input[@id="payment-expiryInput"]');
    this.cvc = stripeFrame.locator('xpath=//input[@id="payment-cvcInput"]');

    // Site contact
    this.siteContactLblOnPymtForm = page.locator('//h3[contains(., "Site Contact")]');
    this.textBelowSiteContactLbl = page.getByText('Do you want to add site contact, to reduce the chances of failed delivery and wasted journey?');
    this.yesSiteContactBtn = page.getByRole('button', { name: 'Yes' });
    this.defaultSiteContactInDropDown = page.locator("//div[@class='relative z-50']/button");
    this.siteContactDropdown = page.locator("(//p[contains(.,'Do you want to add site contact, to reduce the chances of failed delivery and wasted journey?')]/../..//button)[3]");
    this.addOtherSiteContactOption = page.getByRole('button', { name: 'Add other site contact' }).nth(1);
    this.addNameInput = page.getByPlaceholder('Enter site contact name');
    this.addPhoneInput = page.getByPlaceholder('Enter site contact phone');
    this.addEmailInput = page.getByPlaceholder('Enter site contact email');

    this.termsCheckbox = page.getByRole('checkbox', { name: 'I agree to the terms and' });
    this.placeOrderBtn = page.getByRole('button', { name: 'Place Order' });
    this.completePaymentBtn = page.getByRole('button', { name: 'Complete Payment' });

    //billing address change locators
    this.otherBillingAddressRadioOption = page.getByRole('radio', { name: 'Other' });
    this.billingaddressSpan = page.getByRole('button', { name: 'Select billing address' });
    this.postcodenewaddressInput = page.locator("//input[contains(@placeholder,'Start typing your postcode or address')]");
    this.firstpostcodeOption = page.locator('.space-y-2.max-h-60.overflow-y-auto button').first();
    this.usethisaddressBtn = page.getByRole('button', { name: 'Use This Address' });
    this.streetinputchangeaddressInput = page.getByPlaceholder('e.g. Main Street');
    this.housenumberchangeaddressInput = page.getByPlaceholder('e.g. 123');

    this.noskipMsg = page.locator("//p[contains(.,'No skips available')]");
    this.roadplacementNoticeMsg = page.locator("//h4[contains(.,'Road Placement Not Available')]");
  }

  //Postcode selection
  async enterPostcode(postcode) {
    await this.postcodeInput.waitFor({ state: 'visible', timeout: 60000 });
    await this.postcodeInput.fill(postcode);
    await this.page.locator('(//button)[3]').waitFor({ state: 'visible', timeout: 60000 });
    await this.page.locator('(//button)[3]').click();

    if (await this.page.locator('.mt-2').isVisible()) {
      await this.page.locator('.mt-2 button').waitFor({ state: 'visible', timeout: 60000 });
      const text = await this.page.locator('.mt-2 button').textContent();
      console.log('text: ', text);
      await this.page.locator('.mt-2 button').nth(1).click();
    }

    await this.page.waitForTimeout(2000);
    if (await this.closeBtnFromTermsPage.last().isVisible()) {
      await this.closeBtnFromTermsPage.last().click();
    }
    //see if house and street are not auto filled then fill them
    if (await this.streetInput.isVisible()) {
      if (await this.streetInput.inputValue() === '') {
        await this.streetInput.fill('Main Street');
      }
    }

    if (await this.houseNoInput.isVisible()) {
      if (await this.houseNoInput.inputValue() === '') {
        await this.houseNoInput.fill('123');
      }
    }

    if (await this.page.getByRole('button', { name: 'Continue' }).isVisible()) {
      await this.page.getByRole('button', { name: 'Continue' }).click();
    }

    if (await this.continueBtn.isVisible()) {
      await this.continueBtn.click();
    }
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

    return { HeavyWaste, PlasterBoard };
  }

  async selectItemFromTheList() {
    //.overflow-y-auto > .px-4  > div > div --> list of the 12 items
    // getByRole('button', { name: 'None of these' })
    const listItems = this.page.locator('.overflow-y-auto > .px-4  > div > div');
    const count = await listItems.count();
    //console.log('count: ', count);
    const randomItem = Math.floor(Math.random() * count);
    await listItems.nth(randomItem).click();
    await this.page.locator('//button[contains(.,"Continue")]').click();
  }

  async selectSkip(skipSize /*, ToneBag, SelfDispose*/, Skiptarp, Plasterboard) {
    //skip current test if skip is not available for selection
    const isVisible = await this.noskipMsg.isVisible();
    if (isVisible) {
      return { shouldSkip: true, skipReason: "Update Skip button is disabled - Skipping the test" }
    }

    // this.skipYardBtn = this.page.locator(`xpath=(//div[contains(.,"${skipSize} Yard Skip")]/../button)[1]`);
    // await this.page.waitForTimeout(2000);

    // if (!(await this.skipYardBtn.isVisible())) {
    //   skipSize = 4;
    //   this.skipYardBtn = this.page.locator(`xpath=(//div[contains(.,"${skipSize} Yard Skip")]/../button)[1]`);

    //   if (!(await this.skipYardBtn.isVisible())) {
    //     skipSize = 6;
    //     this.skipYardBtn = this.page.locator(`xpath=(//div[contains(.,"${skipSize} Yard Skip")]/../button)[1]`);
    //   }
    // }
    // await this.skipYardBtn.waitFor({ state: 'visible' });
    // await this.skipYardBtn.click();

    // Select skip size
    console.log('Skip size looking for: ', skipSize);
    await this.page.locator('.flex-1.min-w-0.p-4').filter({ hasText: String(skipSize) }).first().click();
    await this.continueBtn.click();

    // Select Skip Tarp
    if (Skiptarp === 'Yes') {
      await this.skipTarpYesBtn.click();
    }
    else {
      await this.skipTarpNoBtn.click();
    }
    if (this.continueWaste.HeavyWaste === 'Yes' && this.continueWaste.PlasterBoard === 'Yes') {
      // Select Disposal Method - Plasterboard
      console.log('Disposal method to select: ', Plasterboard);

      // Locate the specific button inside the container that matches the Plasterboard text
      const selectedMethodBtn = this.disposableMethods.locator('button').filter({ hasText: Plasterboard }).first();

      // Extract its text for logging to ensure we got the right one
      const selectedMethodText = await selectedMethodBtn.textContent();
      console.log('selectedMethod: ', selectedMethodText?.trim());

      // Click the selected option
      await selectedMethodBtn.click();
      await this.page.getByRole('button', { name: 'Confirm & Continue' }).click();
    }

    // if (!(await this.modifyGuaranteeBtn.isVisible())) {
    //   await this.noSkipGauranteeBtn.click();
    //   await this.continueBtn.click();
    // }
    // else {
    //   await this.continueBtn.click();
    // }

    // await this.page.waitForTimeout(1000);
    // expect(this.tarpDiv.getByText('Add Skip Tarp (Small) for £15 (one-time)').isVisible()).toBeTruthy();

    // /*
    //     if (Skiptarp === 'Yes') {
    //       await this.skipTarpYesBtn.click();
    //     }
    //     else {
    //       await this.skipTarpNoBtn.click();
    //     }*/

    // if (Plasterboard === 'Yes') {
    //   if (ToneBag === 'Yes') {

    //     await this.confirmBtn.click();

    //   }
    //   else {
    //     await this.nextArrowIcon.click();
    //     await this.confirmBtn.click();
    //   }
    // }
    // this.skipValue = skipSize;
    // return [this.skipValue, { shouldSkip: false }];
  }

  async wrongSkipSelection() {
    await this.howItWorksBtn.waitFor({ state: 'visible' });
    await this.howItWorksBtn.click();
    await this.page.waitForTimeout(2000);
    await expect(this.popUpHeading).toHaveText('Not sure what size skip you need?');
    await expect(this.wrongSkipPopUp).toContainText('Wrong Skip Guarantee');
    await this.dontAddWrongSkipBtn.click();
    await this.howItWorksBtn.click();
    await this.page.waitForTimeout(2000);
    await this.addWrongSkipGuaranteeBtn.click();
  }

  //permit check
  async permitCheck(Placement) {

    //if road placement notice is shown then set placement to private property
    if (await this.roadplacementNoticeMsg.isVisible()) {
      Placement = 'Private Property';
    }

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
    await this.page.getByRole('heading', { name: 'Choose a Date', level: 3 }).click();
    this.dateBtn = this.page.getByRole('button', { name: String(Day), exact: true });
    //await this.page.waitForTimeout(3000);
    await this.dateBtn.waitFor({ state: 'visible' });

    if (await this.dateBtn.isDisabled()) {
      Day = parseInt(Day) + parseInt(2);
      this.dateBtn = this.page.getByRole('button', { name: String(Day), exact: true });
      await this.dateBtn.waitFor({ state: 'visible' });
      await this.dateBtn.click();
    }
    else {
      await this.dateBtn.click();
    }

    await this.continueBtn.click();

    await this.page.waitForTimeout(3000);
    if (await this.noBtn.isVisible()) {
      await this.noBtn.click();
    }

    await this.page.waitForTimeout(5000);
  }

  async chooseStaticDate(Day) {
    this.dateBtn = this.page.getByRole('button', { name: Day });
    await this.page.waitForTimeout(3000);

    await this.dateBtn.click();

    await this.continueBtn.click();

    await this.page.waitForTimeout(3000);
    if (await this.upholsteredFurnitureNoBtn.isVisible()) {
      await this.upholsteredFurnitureNoBtn.click();
    }
    await this.page.waitForTimeout(3000);
  }

  async changeBillingAddress() {
    if (await this.page.getByRole('button', { name: 'No thanks, start a new order' }, { state: 'visible' }).isVisible()) {
      await this.page.getByRole('button', { name: 'No thanks, start a new order' }).click();
    }
    //await this.page.waitForTimeout(3000);
    //await this.otherBillingAddressRadioOption.waitFor({ state: 'visible' });
    await this.otherBillingAddressRadioOption.check();
    await this.billingaddressSpan.waitFor({ state: 'visible' });
    await this.billingaddressSpan.click();
    await this.postcodenewaddressInput.waitFor({ state: 'visible' });
    await this.postcodenewaddressInput.fill('RG10 1BB');
    await this.firstpostcodeOption.waitFor({ state: 'visible' });
    await this.firstpostcodeOption.click();
    // await this.firstpostcodeOption.waitFor({ state: 'visible' });
    // await this.firstpostcodeOption.click();

    await this.page.waitForTimeout(2000);

    //see if house and street are not auto filled then fill them
    if (await this.streetinputchangeaddressInput.inputValue() === '') {
      await this.streetinputchangeaddressInput.fill('Main Street');
    }

    if (await this.housenumberchangeaddressInput.inputValue() === '') {
      await this.housenumberchangeaddressInput.fill('123');
    }
    //await this.usethisaddressBtn.waitFor({ state: 'visible' });
    await this.usethisaddressBtn.click();
  }

  async siteContactOnPymtPage() {
    this.siteContactLblOnPymtForm.scrollIntoViewIfNeeded();
    await expect(this.textBelowSiteContactLbl).toBeVisible();
    this.yesSiteContactBtn.click();
  }

  //This is parameter destructuring - completePayment({ contactAction } = {})
  async completePayment({ contactAction } = {}) {
    const genfunc = new genericFunctions(this.page);
    const contact = await genfunc.getSiteContactDetails();
    let cname, phone, email;

    await this.page.waitForTimeout(2000);
    if (await this.cardNumberLocator.isVisible()) {
      await this.cardNumberLocator.fill('4111 1111 1111 1111');
      await this.expiryDate.fill('12/34');
      await this.cvc.fill('123');
      await this.page.waitForTimeout(2000);
    }

    if (contactAction === 'Add New Contact') {
      await this.siteContactOnPymtPage();
      await this.siteContactDropdown.click();
      await this.addOtherSiteContactOption.click();
      await this.addNameInput.fill(contact.name);
      await this.addPhoneInput.fill(contact.phone);
      await this.addEmailInput.fill(contact.email);

      cname = contact.name;
      phone = contact.phone;
      email = contact.email;
    }

    if (contactAction === 'Verify Existing Contact') {
      await this.siteContactOnPymtPage();
      const text = await this.defaultSiteContactInDropDown.textContent();
      console.log(text);
      if (text === 'Add other site contact') {
        return { success: true, reason: "Existing site contact is not available" }
      }
      else {
        [cname, phone] = text.split(/\s*•\s*/).map(v => v.trim());
        email = `${cname}_${phone}@yopmail.com`;
      }
    }
    await this.termsCheckbox.waitFor({ state: 'visible' });
    await this.termsCheckbox.check();

    if (await this.placeOrderBtn.isVisible()) {
      await this.placeOrderBtn.click();
    }
    await this.completePaymentBtn.waitFor({ state: 'visible' });
    await this.completePaymentBtn.click();

    return {
      success: false, data: { cname, phone, email }
    };
  }
}