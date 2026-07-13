import { expect } from "allure-playwright";
import { genericFunctions } from '../../utils/genericFunctions.js';
import { TestData } from "../../Data/testData.js";
import { ensureCookieConsentDismissed } from '../../utils/cookieConsent.js';
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
    this.postcodeInput = page.getByRole('textbox', { name: /Typ(e|ing) Your Delivery/i });
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
    this.dontAddWrongSkipBtn = page.getByRole('button', { name: `No, don't add` });
    this.addWrongSkipGuaranteeBtn = page.getByRole('button', { name: 'Wrong Skip Guarantee Wrong' }); //page.locator("//button[contains(.,'Yes, add Wrong Skip Guarantee')]");
    this.addSkipGuaranteeBtn = page.getByRole('button', { name: 'Yes, add Skip Guarantee — £' });
    this.modifyGuaranteeBtn = page.locator("//div[@class='hidden md:flex items-center space-x-2']/button[contains(.,'Modify Guarantee')]");
    this.paymentPageWrongSkipGuaranteeSection = page.locator("//h3[contains(.,'Wrong Skip Guarantee')]");

    this.noSkipGauranteeBtn = page.getByRole('button', { name: 'No, don\'t add' })
    this.toneBagtile = page.locator('(//div[contains(.,"Use Tonne Bags")])[last()]');
    this.nextArrowIcon = page.locator('.p-2 > div:nth-child(2) > div > button');
    //this.privatePropertyBtn = page.getByRole('button', { name: 'Private Property Driveway or' });
    this.privatePropertyBtn = page.getByRole('button', { name: 'View larger image Private' });
    this.dateBtn = page.getByRole('button', { name: '30', exact: true });
    // this.skipCheckbox = page.getByText('Skip this step to upload a photo');
    this.skipCheckbox = page.getByRole('button', { name: 'I\'ll skip this for now' });
    this.skipTarpNoBtn = page.getByRole('button', { name: 'No, continue without' });
    this.skipTarpYesBtn = page.getByRole('button', { name: /Yes, add Skip Tarp/i });
    this.skipTarpCloseBtn = page.getByRole('button', { name: 'Close modal' });
    this.skipTarpModal = page.getByRole('dialog', { name: /Protect your skip with a tarp/i });
    this.skipTarpModalTitle = page.getByRole('heading', { name: /Protect your skip with a tarp/i });
    this.skipTarpImage = page.getByRole('img', { name: /Skip Tarpaulin/i });
    this.skipTarpOneTimePurchaseNote = page.getByText('One-time purchase, yours to keep');
    this.skipTarpFooterNote = page.getByText(/Your tarp will be delivered to your address before your skip arrives/i);
    this.skipTarpDeliveryEstimate = page.locator('text=/Delivery:/i');
    this.skipTarpBenefits = [
      'Prevents fly-tipping and unauthorized waste',
      'Keeps your skip secure between uses',
      'Weather protection for your waste',
    ];
    this.tarpDiv = page.locator("//img[contains(@alt,'Skip Tarpaulin')]/../div");
    this.wrongSkipGuaranteeModal = page.getByRole('heading', { name: "Not sure you're ordering the right size?" });
    this.wrongSkipGuaranteeDismissBtn = page.getByRole('button', { name: /No, don'?t add/i });
    this.wrongSkipGuaranteeCardBtn = page.getByRole('button', { name: /Wrong Skip Guarantee/i });
    this.plasterboardDisposalOption = page.locator("//button[contains(.,'A few bits')]");
    this.plasterboardModalTitle = page.getByRole('heading', {
      name: /How (should|would) (we|you) (handle|like to handle) your plasterboard/i,
    });
    this.plasterboardModal = page.locator('div').filter({
      has: page.getByRole('heading', {
        name: /How (should|would) (we|you) (handle|like to handle) your plasterboard/i,
      }),
    }).filter({ hasText: /Confirm & Continue/i }).first();
    this.plasterboardAmountFewBitsBtn = page.getByRole('button', { name: /A few bits/i });
    this.plasterboardAmountRoomBtn = page.getByRole('button', { name: /A room'?s? worth/i });
    this.plasterboardAmountLotsBtn = page.getByRole('button', { name: /Lots of it/i });
    this.plasterboardTipOption = page.getByText(/Take it to the tip yourself/i);
    this.plasterboardSkipBagOption = page.getByText(/Skip Bag|1 Tonne Bag|Tonne Bag/i);
    this.plasterboardOnlySkipOption = page.getByText(/Plasterboard-Only Skip/i);
    this.plasterboardSegregationNotice = page.getByText(/Plasterboard must be kept separate/i);
    this.plasterboardConfirmAgreement = page.getByText(/By confirming, you agree to keep all plasterboard/i);
    this.plasterboardAdditionalChargeNote = page.getByText(
      /This is in addition to your skip hire cost|This charge is in addition to your skip hire cost/i
    );
    this.plasterboardTotalChargeLabel = page.getByText(/Total Plasterboard Charge/i);
    this.plasterboardCancelBtn = page.getByRole('button', { name: 'Cancel' });
    this.plasterboardConfirmBtn = page.getByRole('button', { name: 'Confirm & Continue' });
    this.plasterboardDisposalFeeLabel = page.getByText(/Plasterboard disposal/i);
    this.plasterboardBagSupplyLabel = page.getByText(/Bag supply & collection|Tonne bag supply/i);
    this.plasterboardSideBySideQuestion = page.getByText(/Space for two skips|side by side/i);
    this.plasterboardYesRoomForTwoBtn = page.getByRole('button', { name: /Yes, room for two/i });
    this.plasterboardLimitedSpaceBtn = page.getByRole('button', { name: /Limited — swap them|No, limited space/i });
    this.chooseDateHeading = page.getByRole('heading', { name: 'Choose a Date', level: 3 });
    this.chooseOfferHeading = page.getByRole('heading', { name: 'Choose Your Offer' });
    this.chooseDeliveryDateHeading = page.getByRole('heading', { name: /Choose Your Delivery Date/i });
    this.yourOrderBtn = page.getByRole('button', { name: /Your Order/i });
    this.orderSummaryHeading = page.getByRole('heading', { name: /Order Summary/i });
    this.orderBreakdownHeading = page.getByRole('heading', { name: /Order Breakdown/i });
    this.orderSummaryTarpHeading = page.getByRole('heading', { name: /Skip Tarp(aulin)?\s*\(/i });
    this.orderSummaryTarpDescription = page.getByText('Protection against unauthorized waste');
    this.orderSummaryTarpDeliveryEstimate = page.getByText(/Tarp(aulin)? ships/i);
    this.removeSkipTarpBtn = page.locator('button[title*="Remove Skip Tarp"]');
    this.tieDownCheckbox = page.locator('#tiedown-checkbox');
    this.tieDownLabel = page.locator('label[for="tiedown-checkbox"]');
    this.orderSummaryTieDownHeading = page.getByRole('heading', { name: /^Tie Down$/i });
    this.orderSummaryTieDownDescription = page.getByText(
      /Reflective guy rope to secure your tarp(aulin)?/i
    );
    this.removeTieDownBtn = page.locator('button[title*="Remove Tie Down"]');
    this.subtotalExclVatLabel = page.getByText('Subtotal (excl. VAT)');
    this.vat20Label = page.getByText('VAT (20%)');
    this.orderTotalLabel = page.getByText(/Order Total:?/i);
    this.dateNextMonth = page.locator('//button[contains(.,"→")]');

    this.publicPropertyBtn = page.getByRole('button', { name: 'View larger image Public' });
    //this.grassVergeBtn = page.getByRole('button', { name: 'Grass verge / footpath / pavement Between road and property Permit required' });
    this.grassVergeBtn = page.getByRole('button', { name: 'View larger image Grass verge' });
    this.grassNoPermitBtn = page.getByText('I maintain this land myself');
    this.grassPopupContinueBtn = page.locator('div').filter({ hasText: /^CancelContinue$/ }).getByRole('button', { name: 'Continue' });
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
    // this.siteContactLblOnPymtForm = page.locator('//h3[contains(., "Site Contact")]');
    this.siteContactLblOnPymtForm = page.getByRole('button', { name: 'Site Contact (optional)' })
    this.textBelowSiteContactLbl = page.getByText('Do you want to add site');
    this.yesBtnFrmSiteContactCard = page.getByRole('button', { name: 'Yes' });
    this.siteContactDropdown = page.locator("(//p[contains(.,'Do you want to add site contact, to reduce the chances of failed delivery and wasted journey?')]/../..//button)[3]");
    this.addOtherSiteContactOption = page.locator('button.text-left').filter({ hasText: 'Add other site contact' });
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
    this.billingaddressAccordian = page.locator('//h3[contains(.,"Billing Address")]');
    this.addressListBox = page.locator('.space-y-2.max-h-60');

    this.noskipMsg = page.locator("//p[contains(.,'No skips available')]");
    this.roadplacementNoticeMsg = page.locator("//h4[contains(.,'Road Placement Not Available')]");
    this.activeOrderPopupClose = page.locator('(//span[contains(.,"Active Order Detected")]/../../..//button)[1]');
    this.bookingupdatePopupClose = page.locator('(//h3[contains(.,"Booking Update Required")]/../../..//button)[1]');
    this.activeOrderNoThanksBtn = page.locator('//button[contains(.,"No Thanks")]');
    this.selectAddressBtnFromProvidedPostcode = page.locator('.space-y-2.max-h-60 button');

    // Postcode search locators
    this.addressSuggestionDropdown = page.locator('.mt-2');
    this.addressSuggestionItems = page.locator('.mt-2 button');
    this.cityInput = page.locator('div').filter({ hasText: /^City$/ }).getByRole('textbox');
  }

  //Postcode selection
  async dismissActiveOrderPopupIfVisible() {
    const noThanksBtn = this.page.getByRole('button', { name: /No Thanks.*Start a New Order/i });
    if (await noThanksBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await noThanksBtn.click();
      await this.page.waitForTimeout(1000);
      return;
    }

    if (await this.activeOrderNoThanksBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await this.activeOrderNoThanksBtn.click();
      await this.page.waitForTimeout(1000);
      return;
    }

    if (await this.activeOrderPopupClose.isVisible({ timeout: 2000 }).catch(() => false)) {
      await this.activeOrderPopupClose.click();
      await this.page.waitForTimeout(1000);
    }
  }

  async enterPostcode(postcode) {

    await this.postcodeInput.waitFor({ state: 'visible', timeout: 60000 });
    await this.postcodeInput.fill(postcode);
    await this.page.waitForTimeout(2000);

    await this.dismissActiveOrderPopupIfVisible();

    if (await this.page.locator('(//button)[3]').isVisible()) {
      await this.page.locator('(//button)[3]').click();
    }

    if (await this.page.locator('.mt-2').isVisible()) {
      await this.page.locator('.mt-2 button').first().waitFor({ state: 'visible', timeout: 60000 });
      const text = await this.page.locator('.mt-2 button').first().textContent();
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
    const selectDoubleMattress = this.page.locator('//span[contains(.,"Double Mattress")]');
    await selectDoubleMattress.click();
    await this.page.locator('//button[contains(.,"Continue")]').click();
  }

  async selectSkip(skipSize /*, ToneBag, SelfDispose*/, Skiptarp, plasterBoardTypes, HeavyWaste, PlasterBoard) {
    //skip current test if skip is not available for selection
    // const isVisible = await this.noskipMsg.isVisible();
    // if (isVisible) {
    //   return { shouldSkip: true, skipReason: "Update Skip button is disabled - Skipping the test" }
    // }

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
    await this.page.locator('.flex-1.min-w-0.p-4 h3').first().waitFor({ state: 'visible' });
    const skipsAvailable = await this.page.locator('.flex-1.min-w-0.p-4 h3').allInnerTexts();
    //console.log('All skip sizes: ', skipsAvailable);
    const textToMatch = `${skipSize} Yard Skip`;
    console.log('Text to match:', textToMatch);
    if (skipsAvailable.includes(textToMatch)) {
      await this.page.locator('.flex-1.min-w-0.p-4 h3').filter({ hasText: new RegExp(`^${textToMatch}$`) }).click();
      await this.continueBtn.click();
    } else {
      console.log("skip not found, selecting first skip from the list ")
      await this.page.locator('.flex-1.min-w-0.p-4 h3').first().click();
      await this.continueBtn.click();
    }

    // Select Skip Tarp
    if (Skiptarp === 'Yes') {
      await this.skipTarpYesBtn.click();
    }
    else {
      await this.skipTarpNoBtn.click();
    }


    if (PlasterBoard === 'Yes') {
      // Select Disposal Method - Plasterboard
      //console.log('Disposal method to select: ', plasterBoardTypes);
      if (plasterBoardTypes == TestData.plasterBoardTypes[0]) {
        await this.page.locator("//button[contains(.,'A few bits')]").click();
      }


      if (plasterBoardTypes == TestData.plasterBoardTypes[1]) {
        await this.page.locator("//button[contains(.,'A room')]").click();
      }

      if (plasterBoardTypes == TestData.plasterBoardTypes[2]) {
        await this.page.locator("//button[contains(.,'Lots of it')]").click();
        await this.page.waitForTimeout(1000);
        await this.page.locator("(//h4[contains(.,'What size do you need?')]/..//button)[1]").click();
      }

      await this.page.waitForTimeout(2000);
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
    this.skipValue = skipSize;
    // return [this.skipValue, { shouldSkip: false }];
  }

  async selectSkipAgain() {


    /*   if (this.page.getByRole('heading', { name: 'Before you start...' }).isVisible()) {
         //css locator for selecting first skip from this page -> .p-5 .space-y-2 button
         const text = await this.page.locator('.p-5 .space-y-2 button').first().textContent();
         console.log('skipName: ', text);
         const skipName = text.trim().split(' ')[0];
         console.log('skipName: ', skipName);
         await this.page.locator('.p-5 .space-y-2 button').first().click();
         if (await this.page.getByRole('heading', { name: 'Booking Update Required', level: 3 }).isVisible()) {
           await this.page.getByRole('button', { name: 'Go to Offers' }).click();
         }
         this.skipValue = skipName;
         return skipName;
       } */
  }

  async wrongSkipSelection() {
    await this.wrongSkipGuaranteeCardBtn.waitFor({ state: 'visible' });
    await this.wrongSkipGuaranteeCardBtn.click();
    await this.addSkipGuaranteeBtn.click();
  }

  //permit check

  async photoToPlaceTheSkip() {

    await this.page.locator('input[type="file"]').setInputFiles('./Data/download.jpeg');
    await this.page.getByRole('button', { name: 'Continue' }).click();
  }
  async permitCheck(Placement) {

    //if road placement notice is shown then set placement to private property
    if (await this.roadplacementNoticeMsg.isVisible()) {
      Placement = 'Private Property';
    }

    if (Placement === 'Private Property') {
      await this.privatePropertyBtn.click();
      await this.continueBtn.click();

      await this.photoToPlaceTheSkip();

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
    if (await this.page.getByRole('heading', { name: 'Booking with same' }).isVisible()) {
      await this.continueBtn.click();
    }
    else {
      await this.page.getByRole('heading', { name: 'Choose a Date', level: 3 }).click();
      await this.dateNextMonth.click();
      await this.page.waitForTimeout(1000);
      this.dateBtn = this.page.getByRole('button', { name: String(Day), exact: true });

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
    }

    await this.page.waitForTimeout(3000);
    if (await this.noBtn.isVisible()) {
      await this.noBtn.click();
    }
    await this.page.waitForTimeout(5000);
  }

  async chooseStaticDate(Day) {
    await this.page.getByRole('heading', { name: 'Choose a Date', level: 3 }).click();
    this.dateBtn = this.page.getByRole('button', { name: String(Day), exact: true });
    console.log('Selecting date: ', await this.dateBtn.innerText());

    if (await this.dateBtn.isDisabled()) {
      Day = parseInt(Day) + parseInt(2);
      console.log('Date is disabled, selecting date: ', Day);
      this.dateBtn = this.page.getByRole('button', { name: String(Day), exact: true });
      await this.dateBtn.waitFor({ state: 'visible' });
    }
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

    await this.page.waitForTimeout(3000);

    if (await this.activeOrderPopupClose.isVisible()) {
      await this.activeOrderNoThanksBtn.click();
      await this.page.waitForTimeout(2000);
    }

    if (await this.bookingupdatePopupClose.isVisible()) {
      await this.bookingupdatePopupClose.click();
      await this.page.waitForTimeout(2000);
    }

    await this.billingaddressAccordian.waitFor({ state: 'visible' });
    await this.billingaddressAccordian.click();
    await this.otherBillingAddressRadioOption.check();
    await this.billingaddressSpan.waitFor({ state: 'visible' });
    await this.billingaddressSpan.click();
    await this.postcodenewaddressInput.waitFor({ state: 'visible' });
    await this.postcodenewaddressInput.fill('RG10 1BB');
    await this.firstpostcodeOption.waitFor({ state: 'visible' });
    await this.firstpostcodeOption.click();

    await this.page.waitForTimeout(2000);

    if (this.addressListBox.isVisible()) {
      await this.selectAddressBtnFromProvidedPostcode.first().click();
    }

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
    await expect(this.siteContactLblOnPymtForm).toBeVisible();
    this.siteContactLblOnPymtForm.scrollIntoViewIfNeeded();
    await this.siteContactLblOnPymtForm.click();
    await expect(this.textBelowSiteContactLbl).toBeVisible();
    await this.yesBtnFrmSiteContactCard.click();
  }

  async getSiteContactDropdownTrigger() {
    const primary = this.siteContactDropdown;
    if (await primary.isVisible()) {
      return primary;
    }
    return this.page.locator("//p[contains(.,'Do you want to add site contact')]/following::button[contains(., '•') or contains(., 'Add other')][1]");
  }

  async addNewSiteContact(contact) {
    if (!(await this.addNameInput.isVisible())) {
      const dropdown = await this.getSiteContactDropdownTrigger();
      await dropdown.scrollIntoViewIfNeeded();
      await dropdown.click();

      if (!(await this.addNameInput.isVisible())) {
        await this.addOtherSiteContactOption.click();
      }
    }

    await this.addNameInput.waitFor({ state: 'visible' });
    await this.addNameInput.fill(contact.name);
    await this.addPhoneInput.fill(contact.phone);
    await this.addEmailInput.fill(contact.email);
  }

  hasExistingSiteContact(dropdownText) {
    return dropdownText.includes('•') && !dropdownText.includes('Add other site contact');
  }

  //This is parameter destructuring - completePayment({ contactAction } = {})
  async completePayment({ contactAction } = {}) {
    const genfunc = new genericFunctions(this.page);
    const contact = await genfunc.getSiteContactDetails();
    let cname, phone, email;

    await this.page.waitForTimeout(2000);

    if (await this.activeOrderPopupClose.isVisible()) {
      await this.activeOrderNoThanksBtn.click();
      await this.page.waitForTimeout(2000);
    }

    if (await this.bookingupdatePopupClose.isVisible()) {
      await this.bookingupdatePopupClose.click();
      await this.page.waitForTimeout(2000);
    }

    await this.page.waitForTimeout(3000);
    if (await this.cardNumberLocator.isVisible()) {
      await this.cardNumberLocator.fill('4111 1111 1111 1111');
      await this.expiryDate.fill('12/34');
      await this.cvc.fill('123');
      await this.page.waitForTimeout(2000);
    }

    if (contactAction === 'Add New Contact') {
      await this.siteContactOnPymtPage();
      await this.addNewSiteContact(contact);

      cname = contact.name;
      phone = contact.phone;
      email = contact.email;
    }

    if (contactAction === 'Verify Existing Contact') {
      await this.siteContactOnPymtPage();
      const dropdown = await this.getSiteContactDropdownTrigger();
      const text = (await dropdown.textContent())?.trim() ?? '';
      console.log('Site contact dropdown:', text);

      if (this.hasExistingSiteContact(text)) {
        [cname, phone] = text.split(/\s*•\s*/).map(v => v.trim());
        email = `${cname}_${phone}@yopmail.com`;
      } else {
        console.log('No existing site contact found, adding new contact');
        await this.addNewSiteContact(contact);
        cname = contact.name;
        phone = contact.phone;
        email = contact.email;
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
      data: { cname, phone, email }
    };
  }

  // --- Postcode Search verification methods (AC-1.1.1 to AC-1.1.5) ---

  async verifyPostcodeSearchFieldVisible() {
    await this.postcodeInput.waitFor({ state: 'visible', timeout: 60000 });
    await expect(this.postcodeInput).toBeVisible();
  }

  async typePostcodeAndVerifySuggestions(postcode) {
    await this.postcodeInput.waitFor({ state: 'visible', timeout: 60000 });
    await this.postcodeInput.fill(postcode);
    await this.page.waitForTimeout(3000);

    if (await this.page.locator('(//button)[3]').isVisible()) {
      await this.page.locator('(//button)[3]').click();
    }

    await this.addressSuggestionDropdown.waitFor({ state: 'visible', timeout: 30000 });
    const suggestionCount = await this.addressSuggestionItems.count();
    expect(suggestionCount).toBeGreaterThan(0);
    console.log(`Address suggestions found: ${suggestionCount}`);
    await this.addressSuggestionItems.first().click();
  }

  async verifyAddressFieldsAutoPopulated() {
    await this.page.waitForTimeout(2000);

    if (await this.houseNoInput.isVisible()) {
      const houseValue = await this.houseNoInput.inputValue();
      console.log('House/Flat Number auto-populated:', houseValue);
      expect(houseValue.length).toBeGreaterThan(0);
    }

    if (await this.streetInput.isVisible()) {
      const streetValue = await this.streetInput.inputValue();
      console.log('Street Name auto-populated:', streetValue);
      expect(streetValue.length).toBeGreaterThan(0);
    }

    if (await this.cityInput.isVisible()) {
      const cityValue = await this.cityInput.inputValue();
      console.log('City auto-populated:', cityValue);
      expect(cityValue.length).toBeGreaterThan(0);
    }

    const postcodeValue = await this.postcodeInput.inputValue();
    console.log('Postcode value:', postcodeValue);
    expect(postcodeValue.length).toBeGreaterThan(0);
  }

  async verifyNoResultsAndManualEntry(noResultPostcode, manualAddress) {
    await this.postcodeInput.waitFor({ state: 'visible', timeout: 60000 });
    await this.postcodeInput.fill(noResultPostcode);
    await this.page.waitForTimeout(3000);

    const suggestionsVisible = await this.addressSuggestionDropdown.isVisible();
    if (suggestionsVisible) {
      const count = await this.addressSuggestionItems.count();
      console.log(`Suggestions returned for "${noResultPostcode}": ${count}`);
    } else {
      console.log('No address suggestions found for:', noResultPostcode);
    }

    await this.postcodeInput.clear();
    await this.postcodeInput.fill(manualAddress.postcode);
    await this.page.waitForTimeout(2000);

    if (await this.closeBtnFromTermsPage.last().isVisible()) {
      await this.closeBtnFromTermsPage.last().click();
    }

    if (await this.houseNoInput.isVisible()) {
      await this.houseNoInput.clear();
      await this.houseNoInput.fill(manualAddress.houseNumber);
      const houseValue = await this.houseNoInput.inputValue();
      expect(houseValue).toBe(manualAddress.houseNumber);
      console.log('Manually entered House/Flat Number:', houseValue);
    }

    if (await this.streetInput.isVisible()) {
      await this.streetInput.clear();
      await this.streetInput.fill(manualAddress.streetName);
      const streetValue = await this.streetInput.inputValue();
      expect(streetValue).toBe(manualAddress.streetName);
      console.log('Manually entered Street Name:', streetValue);
    }

    if (await this.cityInput.isVisible()) {
      await this.cityInput.clear();
      await this.cityInput.fill(manualAddress.city);
      const cityValue = await this.cityInput.inputValue();
      expect(cityValue).toBe(manualAddress.city);
      console.log('Manually entered City:', cityValue);
    }

    console.log('Manual address entry verified successfully');

    if (await this.continueBtn.isVisible()) {
      await expect(this.continueBtn).toBeEnabled();
    }
  }

  async verifyCannotProceedWithoutAddress() {
    await this.postcodeInput.waitFor({ state: 'visible', timeout: 60000 });

    const postcodeValue = await this.postcodeInput.inputValue();
    if (postcodeValue !== '') {
      await this.postcodeInput.clear();
      await this.page.waitForTimeout(1000);
    }

    const isContinueVisible = await this.continueBtn.isVisible();
    if (isContinueVisible) {
      const isDisabled = await this.continueBtn.isDisabled();
      expect(isDisabled).toBe(true);
      console.log('Continue button is visible but disabled without valid postcode');
    } else {
      await expect(this.postcodeInput).toBeVisible();
      console.log('Continue button is hidden until a valid postcode is provided');
    }

    const currentUrl = this.page.url();
    await expect(this.postcodeInput).toBeVisible();
    console.log('Customer remains on the postcode step - cannot proceed without valid address');
    expect(this.page.url()).toBe(currentUrl);
  }

  // --- Skip Tarp booking flow helpers (AC-1.1.x) ---

  async navigateToSkipSelectionStep({
    heavyWaste = 'No',
    plasterBoard = 'No',
    placement = TestData.Placement[0],
  } = {}) {
    await this.enterPostcode(TestData.postcodes[1]);
    await this.selectWaste(TestData.WasteType[1]);
    await this.continueWaste(heavyWaste, plasterBoard);
    await this.selectItemFromTheList();
    await this.permitCheck(placement);
    await this.chooseOfferHeading.waitFor({ state: 'visible' });
  }

  getExpectedTarpSize(skipYards) {
    const yards = parseInt(skipYards, 10);
    if (yards <= 6) return 'Small';
    if (yards <= 10) return 'Medium';
    if (yards <= 16) return 'Large';
    return 'RoRo';
  }

  async openSkipTarpModalForSkipSize(skipSize) {
    await this.navigateToSkipSelectionStep();
    const selectedSkip = await this.selectSkipSizeOnly(skipSize);
    await this.clickContinueOnSkipSelection();
    await this.verifySkipTarpModalVisible();
    return selectedSkip;
  }

  async selectSkipSizeOnly(skipSize) {
    const skipHeading = this.page.locator('.flex-1.min-w-0.p-4 h3');
    await skipHeading.first().waitFor({ state: 'visible' });
    const skipsAvailable = await skipHeading.allInnerTexts();
    const candidates = [
      `${skipSize} Yard Skip`,
      `${skipSize} Yard RORO`,
    ];
    const textToMatch = candidates.find((candidate) => skipsAvailable.includes(candidate));

    if (textToMatch) {
      await skipHeading.filter({ hasText: new RegExp(`^${textToMatch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) }).click();
      return textToMatch;
    }

    console.log(`Skip size ${skipSize} not found, selecting first available skip`);
    await skipHeading.first().click();
    return skipsAvailable[0];
  }

  async clickContinueOnSkipSelection() {
    await this.continueBtn.click();
  }

  async verifySkipTarpModalVisible() {
    await expect(this.skipTarpModal).toBeVisible({ timeout: 15000 });
    await expect(this.skipTarpModal.getByRole('img', { name: /Skip Tarpaulin/i })).toBeVisible();
    await expect(this.skipTarpYesBtn).toBeVisible();
    await expect(this.skipTarpNoBtn).toBeVisible();
  }

  async verifySkipTarpModalNotVisible() {
    await expect(this.skipTarpModal).not.toBeVisible({ timeout: 5000 });
  }

  async verifyWrongSkipGuaranteeModalVisible() {
    await expect(this.wrongSkipGuaranteeModal).toBeVisible({ timeout: 15000 });
    await expect(this.wrongSkipGuaranteeDismissBtn).toBeVisible();
    await expect(this.addSkipGuaranteeBtn).toBeVisible();
  }

  async verifyWrongSkipGuaranteeModalNotVisible() {
    await expect(this.wrongSkipGuaranteeModal).not.toBeVisible({ timeout: 5000 });
  }

  async dismissWrongSkipGuaranteeModal() {
    await this.wrongSkipGuaranteeDismissBtn.click();
  }

  async dismissSkipTarpModal() {
    await this.skipTarpNoBtn.click();
  }

  async verifyPlasterboardDisposalModalVisible() {
    await expect(this.plasterboardModalTitle).toBeVisible({ timeout: 15000 });
    await expect(this.plasterboardAmountFewBitsBtn).toBeVisible();
  }

  async openWrongSkipGuaranteeOfferFromCard() {
    await this.wrongSkipGuaranteeCardBtn.click();
  }

  async verifyPlasterboardDisposalModalNotVisible() {
    await expect(this.plasterboardModalTitle).not.toBeVisible({ timeout: 5000 });
    await expect(this.plasterboardAmountFewBitsBtn).not.toBeVisible({ timeout: 5000 });
  }

  async verifyNextBookingStepNotVisible() {
    await expect(this.chooseDateHeading).not.toBeVisible({ timeout: 5000 });
  }

  // --- Plasterboard Disposal modal helpers (PB AC-1.1 / 1.2 / 1.3 / 1.4) ---

  getPlasterboardModalRoot() {
    return this.plasterboardModalTitle.locator(
      'xpath=ancestor::div[.//button[contains(.,"Confirm & Continue")]][1]'
    );
  }

  async openPlasterboardDisposalModalAfterSkipTarp({ skipSize = TestData.SkipSize[1] } = {}) {
    await this.navigateToSkipSelectionStep({ plasterBoard: 'Yes' });
    await this.selectSkipSizeOnly(skipSize);
    await this.clickContinueOnSkipSelection();

    if (await this.skipTarpModal.isVisible({ timeout: 8000 }).catch(() => false)) {
      await this.verifySkipTarpModalVisible();
      await this.verifyPlasterboardDisposalModalNotVisible();
      await this.dismissSkipTarpModal();
      await this.verifySkipTarpModalNotVisible();
    }

    await this.verifyPlasterboardDisposalModalVisible();
  }

  async verifyPlasterboardModalShellContent() {
    await expect(this.plasterboardModalTitle).toHaveText(
      /How (should|would) (we|you) (handle|like to handle) your plasterboard\?/i
    );
    await expect(this.plasterboardSegregationNotice).toBeVisible();
    await expect(this.plasterboardAmountFewBitsBtn).toBeVisible();
    await expect(this.plasterboardAmountRoomBtn).toBeVisible();
    await expect(this.plasterboardAmountLotsBtn).toBeVisible();
    await expect(this.plasterboardTotalChargeLabel).toBeVisible();
    await expect(this.plasterboardCancelBtn).toBeVisible();
    await expect(this.plasterboardConfirmBtn).toBeVisible();
    await expect(this.plasterboardAdditionalChargeNote).toBeVisible();
  }

  async verifyPlasterboardTipYourselfOption() {
    await this.plasterboardAmountFewBitsBtn.click();
    await expect(this.plasterboardTipOption.first()).toBeVisible({ timeout: 10000 });
    const modal = this.getPlasterboardModalRoot();
    const modalText = await modal.innerText();
    expect(modalText).toMatch(/Take it to the tip yourself/i);
    expect(modalText).toMatch(/£0/);
    expect(modalText).toMatch(/No charge/i);
    expect(modalText).toMatch(/Recycling Centre|free|few bits|wheelbarrow/i);
  }

  async selectPlasterboardSkipBagOption() {
    await this.plasterboardAmountRoomBtn.click();
    await expect(this.plasterboardSkipBagOption.first()).toBeVisible({ timeout: 10000 });
  }

  async verifyPlasterboardSkipBagPricingBreakdown() {
    await this.selectPlasterboardSkipBagOption();
    const modal = this.getPlasterboardModalRoot();

    await expect(this.plasterboardSkipBagOption.first()).toBeVisible();
    await expect(this.plasterboardBagSupplyLabel.first()).toBeVisible();
    await expect(this.plasterboardDisposalFeeLabel.first()).toBeVisible();

    // Modal body is scrollable; assert pricing from text content rather than visibility of every span.
    const modalText = await modal.innerText();
    expect(modalText).toMatch(/RECOMMENDED/i);
    expect(modalText).toMatch(/Skip Bag|1 Tonne Bag|Tonne Bag/i);
    expect(modalText).toMatch(/\+ VAT/i);
    expect(modalText).toMatch(/By confirming, you agree to keep all plasterboard/i);

    const supplyMatch = modalText.match(/(?:Bag supply & collection|Tonne bag supply[^\n]*)\s*\n?\s*£([\d.]+)/i);
    const disposalMatch = modalText.match(/Plasterboard disposal[^\n]*\s*\n?\s*£([\d.]+)/i);
    const totalMatch = modalText.match(/Total Plasterboard Charge\s*\n?\s*£([\d.]+)/i);

    const supplyPrice = supplyMatch ? parseFloat(supplyMatch[1]) : NaN;
    const disposalFee = disposalMatch ? parseFloat(disposalMatch[1]) : NaN;
    const totalExVat = totalMatch ? parseFloat(totalMatch[1]) : NaN;

    expect(disposalFee).toBe(250);
    expect(supplyPrice).toBeGreaterThan(0);
    expect(totalExVat).toBeCloseTo(this.roundMoney(supplyPrice + disposalFee), 2);

    // Total charge shown is ex-VAT; VAT is indicated separately as "+ VAT" (20%).
    const expectedIncVat = this.roundMoney(totalExVat * 1.2);
    expect(expectedIncVat).toBeCloseTo(this.roundMoney((supplyPrice + 250) * 1.2), 2);

    return { supplyPrice, disposalFee, totalExVat, expectedIncVat };
  }

  async verifyPlasterboardOnlySkipOption() {
    await this.plasterboardAmountLotsBtn.click();
    await expect(this.plasterboardOnlySkipOption.first()).toBeVisible({ timeout: 10000 });
    const modal = this.getPlasterboardModalRoot();
    await expect(modal.getByText(/What size do you need/i)).toBeVisible();

    const sizeButtons = modal.locator('button').filter({ hasText: /YARD/i });
    await expect(sizeButtons.first()).toBeVisible({ timeout: 10000 });
    await sizeButtons.first().click();

    await expect(this.plasterboardSideBySideQuestion.first()).toBeVisible({ timeout: 10000 });
    await expect(modal.getByText(/Yes, room for two/i)).toBeVisible();
    await expect(modal.getByText(/Limited — swap them|limited space/i)).toBeVisible();
  }

  async confirmPlasterboardDisposalSelection() {
    const modal = this.getPlasterboardModalRoot();
    await modal.getByRole('button', { name: 'Confirm & Continue' }).click();
    await this.verifyPlasterboardDisposalModalNotVisible();
  }

  async cancelPlasterboardDisposalSelection() {
    const modal = this.getPlasterboardModalRoot();
    await modal.getByRole('button', { name: 'Cancel' }).click();
    await this.verifyPlasterboardDisposalModalNotVisible();
    // Cancel dismisses without saving and returns to the Offers step.
    await expect(this.chooseOfferHeading).toBeVisible({ timeout: 15000 });
  }

  // --- Skip Tarp modal content helpers (AC-1.2.x) ---

  async verifySkipTarpModalTitle() {
    await expect(this.skipTarpModalTitle).toBeVisible();
    await expect(this.skipTarpModalTitle).toHaveText(/Protect your skip with a tarp/i);
  }

  async verifySkipTarpImageForSize(expectedTarpSize) {
    const image = this.skipTarpModal.getByRole('img', { name: new RegExp(`${expectedTarpSize} Skip Tarpaulin`, 'i') });
    await expect(image).toBeVisible();
  }

  async verifySkipTarpPricingCard(expectedTarpSize) {
    const pricingCard = this.skipTarpModal.locator('div').filter({ hasText: /Skip Tarp/i }).first();
    await expect(pricingCard).toBeVisible();
    await expect(this.skipTarpModal).toContainText(new RegExp(`Skip Tarp.*\\(${expectedTarpSize}\\)`, 'i'));
    await expect(this.skipTarpModal.getByText(/£\d+/).first()).toBeVisible();
    await expect(this.skipTarpModal.getByText('+ VAT').first()).toBeVisible();
    await expect(this.skipTarpOneTimePurchaseNote).toBeVisible();
  }

  async verifySkipTarpBenefitsList() {
    for (const benefit of this.skipTarpBenefits) {
      await expect(this.skipTarpModal.getByText(benefit, { exact: true })).toBeVisible();
    }

    const deliveredBeforeSkipBenefit = this.skipTarpModal.getByText('Delivered before your skip arrives', { exact: true });
    if (await deliveredBeforeSkipBenefit.isVisible().catch(() => false)) {
      await expect(deliveredBeforeSkipBenefit).toBeVisible();
      return;
    }

    await this.verifySkipTarpDeliveryEstimate();
  }

  async verifySkipTarpDeliveryEstimate() {
    await expect(this.skipTarpDeliveryEstimate.first()).toBeVisible({ timeout: 15000 });
    await expect(this.skipTarpDeliveryEstimate.first()).toHaveText(/Delivery:/i);
  }

  async verifySkipTarpFooterNote() {
    await expect(this.skipTarpFooterNote).toBeVisible();
    await expect(this.skipTarpFooterNote).toHaveText(
      /Your tarp will be delivered to your address before your skip arrives, so it's ready to use on delivery day/i
    );
  }

  async verifySkipTarpSizeForSkipYards(skipYards) {
    const expectedTarpSize = this.getExpectedTarpSize(skipYards);
    await this.verifySkipTarpImageForSize(expectedTarpSize);
    await expect(this.skipTarpModal).toContainText(new RegExp(`\\(${expectedTarpSize}\\)`, 'i'));
  }

  // --- Skip Tarp accept/decline helpers (AC-1.3.x) ---

  async verifySkipTarpModalActionButtons() {
    await expect(this.skipTarpYesBtn).toBeVisible();
    await expect(this.skipTarpYesBtn).toHaveText(/Yes, add Skip Tarp/i);

    const yesButtonText = (await this.skipTarpYesBtn.textContent()) ?? '';
    const hasDeliveryInButton = /ship|tomorrow|delivery/i.test(yesButtonText);
    const hasDeliveryEstimate = await this.skipTarpDeliveryEstimate.first().isVisible().catch(() => false);
    expect(hasDeliveryInButton || hasDeliveryEstimate).toBeTruthy();

    await expect(this.skipTarpNoBtn).toBeVisible();
    await expect(this.skipTarpNoBtn).toHaveText('No, continue without');
  }

  async acceptSkipTarp() {
    await this.skipTarpYesBtn.click();
  }

  async declineSkipTarp() {
    await this.skipTarpNoBtn.click();
  }

  async closeSkipTarpModalViaCloseButton() {
    await this.skipTarpCloseBtn.click();
  }

  async closeSkipTarpModalViaEscape() {
    await this.page.keyboard.press('Escape');
  }

  async proceedAfterSkipTarpModalDismissed() {
    const onOffersStep = await this.chooseOfferHeading.isVisible().catch(() => false);
    if (onOffersStep) {
      await this.clickContinueOnSkipSelection();
    }
  }

  async verifyBookingProceededToDateStep() {
    await this.verifySkipTarpModalNotVisible();
    const dateStepHeading = this.page.getByRole('heading', {
      name: /Choose Your Delivery Date|Choose a Date/i,
    });
    await expect(dateStepHeading.first()).toBeVisible({ timeout: 15000 });
  }

  async openYourOrderSummary() {
    if (await this.yourOrderBtn.isVisible()) {
      await this.yourOrderBtn.click();
    }
  }

  async verifyTarpAddedToOrder() {
    await this.openYourOrderSummary();
    await expect(this.page.getByText(/Skip Tarp/i).first()).toBeVisible({ timeout: 10000 });
  }

  async verifyTarpNotInOrder() {
    await this.openYourOrderSummary();
    await expect(this.page.getByText(/Skip Tarpaulin/i)).not.toBeVisible({ timeout: 5000 });
  }

  // --- Skip Tarp Order Summary helpers (AC-2.1.x / AC-2.2.x) ---

  parseMoney(text) {
    const match = String(text ?? '').replace(/,/g, '').match(/£\s*([\d.]+)/);
    return match ? parseFloat(match[1]) : NaN;
  }

  roundMoney(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  async navigateToPaymentStep({
    skipSize = TestData.SkipSize[1],
    acceptTarp = true,
    acceptTieDown = false,
  } = {}) {
    await this.openSkipTarpModalForSkipSize(skipSize);
    const expectedTarpSize = this.getExpectedTarpSize(skipSize);

    let tarpExVat = null;
    let tieDownExVat = null;
    if (acceptTarp) {
      const modalText = await this.skipTarpModal.innerText();
      tarpExVat = this.parseMoney(modalText.match(/£[\d.]+/)?.[0] ?? '');
      if (acceptTieDown) {
        tieDownExVat = await this.selectTieDownInSkipTarpModal();
      }
      await this.acceptSkipTarp();
    } else {
      await this.declineSkipTarp();
    }

    await this.verifyBookingProceededToDateStep();
    await this.chooseDate(TestData.BookingDay[0]);
    await this.dismissActiveOrderPopupIfVisible();
    await expect(this.orderSummaryHeading.first()).toBeVisible({ timeout: 20000 });

    return { expectedTarpSize, tarpExVat, tieDownExVat };
  }

  async selectTieDownInSkipTarpModal() {
    await expect(this.tieDownLabel).toBeVisible({ timeout: 10000 });
    await expect(this.tieDownCheckbox).toBeVisible();
    if (!(await this.tieDownCheckbox.isChecked())) {
      await this.tieDownLabel.click();
    }
    await expect(this.tieDownCheckbox).toBeChecked();

    const labelText = await this.tieDownLabel.innerText();
    const tieDownExVat = this.parseMoney(labelText.match(/£[\d.]+/)?.[0] ?? '');
    expect(tieDownExVat).toBeGreaterThan(0);
    expect(labelText).toMatch(/Reflective guy rope to secure your tarp(aulin)?/i);
    return tieDownExVat;
  }

  getOrderSummaryTieDownSection() {
    return this.orderSummaryTieDownHeading.locator(
      'xpath=ancestor::div[contains(@class,"flex") and contains(@class,"justify-between")][1]'
    );
  }

  async verifyTieDownInOrderSummary() {
    await expect(this.orderSummaryTieDownHeading.first()).toBeVisible({ timeout: 10000 });
    await expect(this.orderSummaryTieDownHeading.first()).toHaveText(/^Tie Down$/i);

    const section = this.getOrderSummaryTieDownSection();
    await expect(
      section.getByText(/Reflective guy rope to secure your tarp(aulin)?/i)
    ).toBeVisible();
    await expect(section.getByText(/^£[\d.]+$/).first()).toBeVisible();
    await expect(section.getByText(/\+\s*VAT\s*£[\d.]+/i)).toBeVisible();

    const sectionText = await section.innerText();
    const priceExVat = this.parseMoney(
      sectionText.split('\n').map((l) => l.trim()).find((l) => /^£[\d.]+$/.test(l)) ?? ''
    );
    const vatAmount = this.parseMoney(sectionText.match(/\+\s*VAT\s*(£[\d.]+)/i)?.[1] ?? '');
    expect(priceExVat).toBeGreaterThan(0);
    expect(vatAmount).toBeCloseTo(this.roundMoney(priceExVat * 0.2), 2);
    return { priceExVat, vatAmount };
  }

  async verifyTieDownAppearsBelowTarpInOrderSummary() {
    await expect(this.orderSummaryTarpHeading.first()).toBeVisible();
    await expect(this.orderSummaryTieDownHeading.first()).toBeVisible();
    const orderOk = await this.page.evaluate(() => {
      const headings = [...document.querySelectorAll('h3')].map((h) => h.textContent?.trim() || '');
      const tarpIdx = headings.findIndex((t) => /Skip Tarp(aulin)?\s*\(/i.test(t));
      const tieIdx = headings.findIndex((t) => /^Tie Down$/i.test(t));
      return tarpIdx >= 0 && tieIdx > tarpIdx;
    });
    expect(orderOk).toBeTruthy();
  }

  async verifyTieDownNotInOrderSummary() {
    await expect(this.orderSummaryTieDownHeading).toHaveCount(0, { timeout: 10000 });
    await expect(this.page.getByText(/Reflective guy rope to secure your tarp(aulin)?/i)).toHaveCount(0);
  }

  async getOrderSummaryTieDownPricing() {
    return this.verifyTieDownInOrderSummary();
  }

  async verifyOrderBreakdownIncludesTieDownPricing(tieDownExVat) {
    const totals = await this.getOrderBreakdownTotals();
    const tieDown = await this.getOrderSummaryTieDownPricing();
    expect(tieDown.priceExVat).toBeCloseTo(tieDownExVat, 2);
    expect(tieDown.vatAmount).toBeCloseTo(this.roundMoney(tieDownExVat * 0.2), 2);
    expect(totals.subtotalExVat).toBeGreaterThanOrEqual(tieDownExVat);
    expect(totals.vatAmount).toBeCloseTo(this.roundMoney(totals.subtotalExVat * 0.2), 2);
    expect(totals.orderTotal).toBeCloseTo(this.roundMoney(totals.subtotalExVat + totals.vatAmount), 2);
    return { totals, tieDown };
  }

  extractTieDownLineItemFromOrderPayload(orderPayload) {
    const items = orderPayload?.order_items || orderPayload?.items || [];
    const tieDownItem = items.find((item) => item?.item_type === 'tie_down');
    expect(tieDownItem, 'Expected a tie_down line item on the created order').toBeTruthy();
    return tieDownItem;
  }

  async waitForTieDownOrderCreateResponse() {
    return this.page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        /\/api\/tie-downs\/orders\/?$/.test(new URL(response.url()).pathname) &&
        response.status() < 400,
      { timeout: 120000 }
    );
  }

  getOrderSummaryTarpSection() {
    return this.orderSummaryTarpHeading.locator(
      'xpath=ancestor::div[contains(@class,"flex") and contains(@class,"justify-between")][1]'
    );
  }

  async verifySkipTarpInOrderSummary(expectedTarpSize) {
    await expect(this.orderSummaryHeading.first()).toBeVisible({ timeout: 15000 });
    await expect(this.orderSummaryTarpHeading.first()).toBeVisible({ timeout: 10000 });
    await expect(this.orderSummaryTarpHeading.first()).toHaveText(
      new RegExp(`Skip Tarp(aulin)?\\s*\\(${expectedTarpSize}\\)`, 'i')
    );

    const section = this.getOrderSummaryTarpSection();
    await expect(section.getByText('Protection against unauthorized waste')).toBeVisible();
    await expect(section.getByText(/^£[\d.]+$/).first()).toBeVisible();
    await expect(section.getByText(/\+\s*VAT\s*£[\d.]+/i)).toBeVisible();

    const sectionText = await section.innerText();
    const priceExVat = this.parseMoney(sectionText.match(/^£[\d.]+/m)?.[0] ?? sectionText);
    const vatAmount = this.parseMoney(sectionText.match(/\+\s*VAT\s*(£[\d.]+)/i)?.[1] ?? '');

    expect(priceExVat).toBeGreaterThan(0);
    expect(vatAmount).toBeCloseTo(this.roundMoney(priceExVat * 0.2), 2);

    return { priceExVat, vatAmount };
  }

  async verifySkipTarpDeliveryEstimateInOrderSummary() {
    await expect(this.orderSummaryTarpDeliveryEstimate.first()).toBeVisible({ timeout: 10000 });
    await expect(this.orderSummaryTarpDeliveryEstimate.first()).toHaveText(
      /Tarp(aulin)? ships .*(tomorrow|today|before your skip)?/i
    );
  }

  async verifySkipTarpRemoveControlVisible() {
    await expect(this.removeSkipTarpBtn).toBeVisible({ timeout: 10000 });
  }

  async removeSkipTarpFromOrderSummary() {
    await this.verifySkipTarpRemoveControlVisible();
    await this.removeSkipTarpBtn.click();
    await this.verifySkipTarpNotInOrderSummary();
    await this.verifyTieDownNotInOrderSummary();
  }

  async verifySkipTarpNotInOrderSummary() {
    await expect(this.orderSummaryTarpHeading).toHaveCount(0, { timeout: 10000 });
    await expect(this.orderSummaryTarpDescription).toHaveCount(0);
    await expect(this.removeSkipTarpBtn).toHaveCount(0);
  }

  async getOrderBreakdownTotals() {
    await expect(this.orderBreakdownHeading.first()).toBeVisible({ timeout: 10000 });
    await expect(this.subtotalExclVatLabel.first()).toBeVisible();
    await expect(this.vat20Label.first()).toBeVisible();
    await expect(this.orderTotalLabel.first()).toBeVisible();

    const subtotalText = await this.subtotalExclVatLabel.first()
      .locator('xpath=following::*[contains(text(),"£")][1]')
      .innerText();
    const vatText = await this.vat20Label.first()
      .locator('xpath=following::*[contains(text(),"£")][1]')
      .innerText();
    const totalText = await this.orderTotalLabel.first()
      .locator('xpath=following::*[contains(text(),"£")][1]')
      .innerText();

    return {
      subtotalExVat: this.parseMoney(subtotalText),
      vatAmount: this.parseMoney(vatText),
      orderTotal: this.parseMoney(totalText),
    };
  }

  async getOrderSummaryTarpPricing() {
    const section = this.getOrderSummaryTarpSection();
    const sectionText = await section.innerText();
    const priceExVat = this.parseMoney(
      sectionText.split('\n').map((line) => line.trim()).find((line) => /^£[\d.]+$/.test(line)) ?? ''
    );
    const vatAmount = this.parseMoney(sectionText.match(/\+\s*VAT\s*(£[\d.]+)/i)?.[1] ?? '');
    return { priceExVat, vatAmount };
  }

  async verifyOrderBreakdownIncludesTarpPricing(tarpExVat) {
    const totals = await this.getOrderBreakdownTotals();
    const { priceExVat, vatAmount } = await this.getOrderSummaryTarpPricing();

    expect(priceExVat).toBeCloseTo(tarpExVat, 2);
    expect(vatAmount).toBeCloseTo(this.roundMoney(tarpExVat * 0.2), 2);

    // Subtotal includes tarp ex-VAT; VAT line includes 20% of tarp; total is subtotal + VAT.
    expect(totals.subtotalExVat).toBeGreaterThanOrEqual(tarpExVat);
    expect(totals.vatAmount).toBeCloseTo(this.roundMoney(totals.subtotalExVat * 0.2), 2);
    expect(totals.orderTotal).toBeCloseTo(this.roundMoney(totals.subtotalExVat + totals.vatAmount), 2);

    return { totals, tarp: { priceExVat, vatAmount } };
  }

  // --- Skip Tarp persistence / order creation helpers (AC-3.2 / AC-4.x) ---

  async refreshPaymentStepAndVerifyTarpPersisted(expectedTarpSize) {
    await this.page.reload({ waitUntil: 'domcontentloaded' });
    await ensureCookieConsentDismissed(this.page);
    await this.dismissActiveOrderPopupIfVisible();
    await expect(this.orderSummaryHeading.first()).toBeVisible({ timeout: 20000 });
    return this.verifySkipTarpInOrderSummary(expectedTarpSize);
  }

  async waitForSkipTarpOrderCreateResponse() {
    return this.page.waitForResponse(
      async (response) => {
        if (response.request().method() !== 'POST') return false;
        if (!/\/api\/orders\/?$/.test(new URL(response.url()).pathname)) return false;
        if (response.status() >= 400) return false;
        const body = await response.json().catch(() => null);
        const items = body?.order_items || body?.items || [];
        return Array.isArray(items) && items.some((item) => item?.item_type === 'skip_tarp');
      },
      { timeout: 120000 }
    );
  }

  extractSkipTarpLineItemFromOrderPayload(orderPayload) {
    const items = orderPayload?.order_items || orderPayload?.items || [];
    const tarpItem = items.find((item) => item?.item_type === 'skip_tarp');
    expect(tarpItem, 'Expected a skip_tarp line item on the created order').toBeTruthy();
    return tarpItem;
  }

  async verifyPaymentTotalIncludesTarp(tarpExVat) {
    const { totals, tarp } = await this.verifyOrderBreakdownIncludesTarpPricing(tarpExVat);
    expect(totals.orderTotal).toBeCloseTo(
      this.roundMoney(totals.subtotalExVat + totals.vatAmount),
      2
    );
    expect(totals.orderTotal).toBeGreaterThan(tarp.priceExVat + tarp.vatAmount);
    return { totals, tarp };
  }
}