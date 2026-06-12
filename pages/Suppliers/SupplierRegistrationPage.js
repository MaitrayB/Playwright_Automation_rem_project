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
        this.supplierLogInPageHeading = page.getByRole('heading', { name: 'Supplier Sign In' });
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
        this.privacyPolicyPdf = page.locator('.react-pdf__Page__canvas').first();
        this.vatRegistrationHeading = page.getByRole('heading', { name: 'VAT Registration' });
        this.vatNotRegisteredBtn = page.getByRole('button', { name: 'No', exact: true });
        this.selfBillingHeading = page.getByRole('heading', { name: 'Self-Billing Agreement' }).last();
        this.selfBillingAcceptLabel = page.getByText(/I accept the self-billing agreement/i);
        this.supplierProfileHeading = page.getByRole('heading', { name: 'Supplier Profile' });
        this.termsCheckbox = page.getByText('I have read and agree to the');
        this.completeBtn = page.getByRole('button', { name: 'Complete' });

        //Supplier order page locators
        this.orderPageHeading = page.getByRole('link', { name: 'Available Orders' });
        this.doItLaterBtn = page.getByRole('button', { name: 'Do it later' });
        this.cookieAcceptBtn = page.locator('(//button[contains(.,"Accept All")])[1]');
    }

    async verifyEmailPreFilled(expectedEmail) {
        await expect(this.emailInput).toHaveValue(expectedEmail);
    }

    async fillRegistrationForm(password) {
        await this.passwordInput.waitFor({ state: 'visible' });
        await this.passwordInput.fill(password);
        await this.confirmPasswordInput.fill(password);
    }

    async acceptCookiesIfVisible() {
        if (await this.cookieAcceptBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await this.cookieAcceptBtn.click();
            await this.page.waitForTimeout(500);
        }
    }

    async submitRegistration() {
        await this.acceptCookiesIfVisible();
        await this.registerBtn.click({ force: true });
    }

    async verifyRegistrationSuccess() {
        await this.registrationSuccessMessage.waitFor({ state: 'visible', timeout: 10000 });
        await expect(this.registrationSuccessMessage).toContainText('Your Supplier Account has been created successfully! Complete your onboarding now to view orders.');
    }
    //used
    async verifyPageLoaded() {
        await this.acceptCookiesIfVisible();
        await this.emailInput.waitFor({ state: 'visible', timeout: 20000 });
    }

    async supplierLogin(email, password) {
        await this.acceptCookiesIfVisible();
        await this.emailInput.waitFor({ state: 'visible', timeout: 20000 });
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.signInBtn.click();
        await this.page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 20000 });

        if (this.page.url().includes('/onboarding')) {
            await expect(this.page.getByText(/complete your onboarding/i)).toBeVisible();
            return;
        }

        if (await this.doItLaterBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await this.doItLaterBtn.click();
            await this.page.waitForTimeout(1000);
        }
        await this.orderPageHeading.waitFor({ state: 'visible', timeout: 20000 });
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

    async completeSelfBillingStep(page) {
        await expect(this.selfBillingHeading).toBeVisible();
        const acceptCheckbox = page.getByRole('checkbox', {
            name: /I accept the self-billing agreement/i,
        });

        if (await acceptCheckbox.isVisible().catch(() => false)) {
            await acceptCheckbox.click({ force: true });
        } else {
            await this.selfBillingAcceptLabel.scrollIntoViewIfNeeded();
            await this.selfBillingAcceptLabel.click({ force: true });
        }

        if (!(await this.nextBtn.isEnabled().catch(() => false))) {
            await page.evaluate(() => {
                const match = [...document.querySelectorAll('label, div, p, span')]
                    .find(el => el.textContent?.includes('I accept the self-billing agreement'));
                const container = match?.closest('label, div') ?? match?.parentElement;
                const checkbox = container?.querySelector('input[type="checkbox"]');
                checkbox?.click();
            });
        }

        await expect(this.nextBtn).toBeEnabled({ timeout: 10000 });
        await this.nextBtn.click();
        await page.waitForTimeout(1000);
    }

    async advanceToTermsStep(page) {
        for (let step = 0; step < 6; step++) {
            if (await this.privacyPolicyPdf.isVisible({ timeout: 2000 }).catch(() => false)) {
                return;
            }
            if (await this.scrollWarningBanner.isVisible({ timeout: 2000 }).catch(() => false)) {
                return;
            }

            if (await this.vatRegistrationHeading.isVisible({ timeout: 2000 }).catch(() => false)) {
                await this.vatNotRegisteredBtn.click();
                await page.waitForTimeout(500);
                await expect(this.nextBtn).toBeEnabled({ timeout: 10000 });
                await this.nextBtn.click();
                await page.waitForTimeout(1000);
                continue;
            }

            if (await this.selfBillingHeading.isVisible({ timeout: 2000 }).catch(() => false)) {
                await this.completeSelfBillingStep(page);
                continue;
            }

            if (await this.supplierProfileHeading.isVisible({ timeout: 2000 }).catch(() => false)) {
                await expect(this.nextBtn).toBeEnabled({ timeout: 10000 });
                await this.nextBtn.click();
                await page.waitForTimeout(1000);
                continue;
            }

            if (await this.nextBtn.isEnabled({ timeout: 2000 }).catch(() => false)) {
                await this.nextBtn.click();
                await page.waitForTimeout(1000);
                continue;
            }

            break;
        }
    }

    async scrollTermsPolicyToBottom(page) {
        const pdfCanvas = this.privacyPolicyPdf;
        await pdfCanvas.evaluate(canvas => {
            let el = canvas.parentElement;
            while (el) {
                if (el.scrollHeight > el.clientHeight + 10) {
                    el.scrollTop = el.scrollHeight;
                    return;
                }
                el = el.parentElement;
            }
        });
        await page.waitForTimeout(1000);

        if (await this.scrollWarningBanner.isVisible().catch(() => false)) {
            await page.evaluate(() => {
                for (const el of document.querySelectorAll('*')) {
                    if (el.scrollHeight > el.clientHeight + 10) {
                        el.scrollTop = el.scrollHeight;
                    }
                }
            });
            await page.waitForTimeout(1000);
        }

        if (await this.scrollWarningBanner.isVisible().catch(() => false)) {
            await pdfCanvas.click({ force: true });
            await page.mouse.wheel(0, 2000);
            await page.waitForTimeout(1000);
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

        await this.advanceToTermsStep(page);

        // Terms step
        await this.privacyPolicyPdf.waitFor({ state: 'visible', timeout: 20000 });

        // Step 2: Verify checkbox is disabled before scrolling
        await this.verifyTermsCheckboxIsDisabled();

        // Step 3: Verify warning banner is visible before scrolling
        await this.verifyScrollWarningIsVisible();

        // Step 4: Scroll through the terms document
        await this.scrollTermsPolicyToBottom(page);
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
        if (await this.doItLaterBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
            await this.doItLaterBtn.click({ force: true });
            await this.page.waitForTimeout(2000);
        }
        await page.waitForTimeout(1000);
        await expect(this.orderPageHeading).toBeVisible();
        await page.waitForTimeout(1000);
    }
}
