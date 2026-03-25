import { expect } from "allure-playwright";
import { genericFunctions } from '../../utils/genericFunctions.js';
import { tableHelper } from '../../utils/tableHelper.js';
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

export class SupplierRegistrationPage {
    /** @param {Page} page */
    constructor(page) {
        this.page = page;
        this.emailInput = page.locator('#email');
        this.passwordInput = page.locator('#password');
        this.confirmPasswordInput = page.locator('#confirmPassword');
        this.registerBtn = page.getByRole('button', { name: 'Complete Registration' });
        this.registrationSuccessMessage = page.locator("//p[@class='text-sm text-green-500']");
        this.pageHeading = page.getByRole('heading');
        this.supplierEmailInput = page.locator('#email');
        this.supplierPasswordInput = page.locator('#password');
        this.signInBtn = page.getByRole('button', { name: 'Sign in' });
        this.alreadyAcceptedInvitationMsg = page.getByText('This invitation has already been accepted. Please log in instead.');
        this.supplierLoginPageHeading = page.getByRole('heading', { name: 'Supplier Sign In' });

        // Onboarding form locators
        this.companyNameErrorMsg = page.getByText('Company name is required');
        this.phoneErrorMsg = page.getByText('Please enter a valid UK phone number');
        this.previousBtn = page.getByRole('button', { name: 'Previous' });
        this.scrollWarningBanner = page.getByText('Please scroll down to read the full Supplier Protection & Dispute Policy');
        this.checkboxHintText = page.getByText('Please scroll to the bottom of the Supplier Protection & Dispute Policy above to enable this checkbox.');
        this.termsErrorMsg = page.getByText('You must accept the Supplier Protection & Dispute Policy to continue');

        this.findCompanyNameInput = page.getByPlaceholder('Find company');
        this.selectExistingCoName = page.locator('.absolute.z-50 button').filter({ has: page.locator('span', { hasText: 'active' }) }).first();
        this.companyNameInput = page.locator('input[type="text"]');
        this.phoneNumberInput = page.locator('input[type="tel"]');
        this.postcodeInput = page.getByRole('textbox', { name: 'SW1A 1AA' });
        this.skipHireCheckbox = page.getByRole('checkbox', { name: 'Skip Hire Skip bins and' });
        this.nextBtn = page.getByRole('button', { name: 'Next' });
        this.privacyPolicyPdf = page.locator('div:nth-child(15) > .react-pdf__Page__canvas');
        this.termsCheckbox = page.getByText('I have read and agree to the');
        this.completeBtn = page.getByRole('button', { name: 'Complete' });

        //Supplier order page locators
        this.orderPageHeading = page.getByRole('heading', { name: 'Orders' });
        this.doItLaterBtn = page.getByRole('button', { name: 'Do it later' });
    }

    async verifyEmailPreFilled(expectedEmail) {
        await expect(this.emailInput).toHaveValue(expectedEmail);
    }

    async fillRegistrationForm(password) {
        await this.passwordInput.waitFor({ state: 'visible' });
        await this.passwordInput.fill(password);
        await this.confirmPasswordInput.fill(password);
    }

    async submitRegistration() {
        await this.registerBtn.click();
    }

    async verifyRegistrationSuccess() {
        await this.registrationSuccessMessage.waitFor({ state: 'visible', timeout: 10000 });
        await expect(this.registrationSuccessMessage).toContainText('Your Supplier Account has been created successfully! Complete your onboarding now to view orders.');
    }
    //used
    async verifyPageLoaded() {
        await this.emailInput.waitFor({ state: 'visible', timeout: 20000 });
    }

    async supplierLogin(email, password) {
        await this.emailInput.waitFor({ state: 'visible', timeout: 20000 });
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.signInBtn.click();
    }

    async verifyAcceptedInvitationMsg() {
        await this.alreadyAcceptedInvitationMsg.waitFor({ state: 'visible' });
        await expect(this.alreadyAcceptedInvitationMsg).toHaveText('This invitation has already been accepted. Please log in instead.');
        await expect(this.supplierLoginPageHeading).toBeVisible();
    }

    async changeCompanyNameOnOnboardingForm() {
        await this.companyNameInput.waitFor({ state: 'visible', timeout: 20000 });
        await this.companyNameInput.fill(' ');
        await this.companyNameInput.pressSequentially('bc');
        await this.selectExistingCoName.waitFor({ state: 'visible', timeout: 20000 });
        await this.selectExistingCoName.click();
        await this.page.waitForTimeout(1000);

        // ✅ Read from the actual input field, not the button
        const newCoName = await this.companyNameInput.inputValue();
        return newCoName;
    }

    // ✅ NEW — blur the field to trigger inline validation
    async clearCompanyNameAndTriggerError() {
        await this.companyNameInput.waitFor({ state: 'visible', timeout: 20000 });
        await this.companyNameInput.fill('');
        await this.companyNameInput.press('Tab');
        await this.page.waitForTimeout(500);
    }

    //Verify company name required error is visible after trying to proceed without entering company name
    async verifyCompanyNameRequiredError() {
        await this.companyNameErrorMsg.waitFor({ state: 'visible', timeout: 10000 });
        await expect(this.companyNameErrorMsg).toBeVisible();
    }

    //Enter a valid company name to pass the step
    async enterCompanyNameToPassStep(companyName) {
        await this.companyNameInput.fill(companyName);
        await this.page.waitForTimeout(500);
    }

    //Verify company name error has cleared 
    async verifyCompanyNameErrorCleared() {
        await expect(this.companyNameErrorMsg).not.toBeVisible();
    }

    //Proceed to phone step
    async proceedToPhoneStep() {
        await this.nextBtn.click();
        await this.page.waitForTimeout(1000);
        // Confirm we are now on the phone step
        await this.phoneNumberInput.waitFor({ state: 'visible', timeout: 10000 });
    }

    // ✅ NEW — blur after invalid input
    async enterInvalidPhoneAndTriggerError(invalidPhone) {
        await this.phoneNumberInput.fill('');
        await this.phoneNumberInput.fill(invalidPhone);
        // Blur to trigger validation
        // await this.phoneNumberInput.press('Tab');
        await this.page.waitForTimeout(500);
    }

    //Verify phone validation error is visible
    async verifyPhoneValidationError() {
        await this.phoneErrorMsg.waitFor({ state: 'visible', timeout: 10000 });
        await expect(this.phoneErrorMsg).toBeVisible();
    }

    //Replace invalid phone with a correct phone number
    async correctPhoneNumber(validPhone) {
        await this.phoneNumberInput.fill('');
        await this.phoneNumberInput.fill(validPhone);
        await this.page.waitForTimeout(500);
    }

    //Verify phone error has cleared
    async verifyPhoneErrorCleared() {
        await expect(this.phoneErrorMsg).not.toBeVisible();
    }

    async verifyCompanyNameOnOnboardingForm(companyName) {
        if (await this.companyNameInput.isVisible()) {
            await expect(this.companyNameInput).toHaveValue(companyName);
        }
    }

    async completeOnboardingForm(page, supplier, { scenarioName } = {}) {
        // Step 1: Navigate through all steps to reach the Terms step
        const { companyName, phone, postcode, hirePeriod } = supplier;
        //console.log(`completeOnboardingForm: Starting with companyName=${companyName}, phone=${phone}, postcode=${postcode}, hirePeriod=${hirePeriod}`);
        if (await this.companyNameInput.isVisible()) {
            await this.verifyCompanyNameOnOnboardingForm(companyName);
            await this.nextBtn.click();
            await page.waitForTimeout(1000);
        }
        if (await this.phoneNumberInput.isVisible()) {
            await expect(this.phoneNumberInput).toHaveValue(phone);
            await this.nextBtn.click();
            await page.waitForTimeout(1000);
        }
        //Postcode
        await expect(this.postcodeInput).toHaveValue(postcode);
        await this.nextBtn.click();
        await page.waitForTimeout(1000);

        if (scenarioName === 'Scenario 5: Step Navigation') {
            // Verify we can navigate back to previous steps and the data is retained
            await this.previousBtn.click();
            await page.waitForTimeout(500);
            await this.previousBtn.click();
            await page.waitForTimeout(500);
            await this.previousBtn.click();
            await page.waitForTimeout(500);
            await expect(this.companyNameInput).toHaveValue(companyName);
            await page.waitForTimeout(1000);
            await this.nextBtn.click();
            await expect(this.phoneNumberInput).toHaveValue(phone);
            await page.waitForTimeout(1000);
            await this.nextBtn.click();
            await expect(this.postcodeInput).toHaveValue(postcode);
            await page.waitForTimeout(1000);
            await this.nextBtn.click();
        }

        //Hire period
        await expect(page.getByRole('button', { name: `${hirePeriod} days` })).toBeVisible();
        await this.nextBtn.click();
        await page.waitForTimeout(1000);

        //Services
        await this.skipHireCheckbox.check();
        await page.waitForTimeout(1000);
        await this.nextBtn.click();
        await page.waitForTimeout(1000);

        // Terms step
        await this.privacyPolicyPdf.waitFor({ state: 'visible', timeout: 20000 });

        // Step 2: Verify checkbox is disabled before scrolling
        await this.verifyTermsCheckboxIsDisabled();

        // Step 3: Verify warning banner is visible before scrolling
        await this.verifyScrollWarningIsVisible();

        // Step 4: Scroll through the terms document
        await this.privacyPolicyPdf.click({
            position: {
                x: 634,
                y: 641
            }
        });
        await page.waitForTimeout(1000);
        // Step 4 (continued): Verify warning banner disappears after scrolling
        await this.verifyScrollWarningIsGone();

        // Step 5: Verify checkbox is now enabled
        await this.verifyTermsCheckboxIsEnabled();

        // Step 6 & 7: Accept terms and complete onboarding
        await this.termsCheckbox.check();
        await page.waitForTimeout(1000);
        await this.completeBtn.click();
        await page.waitForTimeout(1000);
    }

    //Verify the terms checkbox is disabled before scrolling
    async verifyTermsCheckboxIsDisabled() {
        await expect(this.termsCheckbox).toBeDisabled();
        await expect(this.checkboxHintText).toBeVisible();
    }

    //Verify the orange scroll warning banner is visible before scrolling
    async verifyScrollWarningIsVisible() {
        await expect(this.scrollWarningBanner).toBeVisible();
    }

    //Verify the orange scroll warning banner is gone after scrolling
    async verifyScrollWarningIsGone() {
        await expect(this.scrollWarningBanner).not.toBeVisible();
    }

    //Verify the checkbox is now enabled after scrolling to the bottom.
    async verifyTermsCheckboxIsEnabled() {
        await expect(this.termsCheckbox).toBeEnabled();
        await expect(this.checkboxHintText).not.toBeVisible();
    }

    async verifySupplierRedirectedToOrdersPage(page) {
        await expect(page).toHaveURL(/.*\/orders/);
        await page.waitForTimeout(1000);
        if (await this.doItLaterBtn.isVisible()) {
            await this.doItLaterBtn.click();
            await this.page.waitForTimeout(2000);
        }
        await page.waitForTimeout(1000);
        await expect(this.orderPageHeading).toBeVisible();
        await page.waitForTimeout(1000);
    }
}
