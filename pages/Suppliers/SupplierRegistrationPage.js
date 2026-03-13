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
        // this.searchNewCompanyName = page.locator('input[type="text"]');
        this.findCompanyNameInput = page.getByPlaceholder('Find company');
        this.selectExistingCoName = page.locator('.absolute.z-50 button').filter({ has: page.locator('span', { hasText: 'active' }) }).first();
        this.companyNameInput = page.getByRole('textbox');
        this.phoneNumberInput = page.getByRole('textbox', { name: '+44 20 1234' });
        this.postcodeInput = page.getByRole('textbox', { name: 'SW1A 1AA' });
        this.skipHireCheckbox = page.getByRole('checkbox', { name: 'Skip Hire Skip bins and' });
        this.nextBtn = page.getByRole('button', { name: 'Next' });
        this.privacyPolicyPdf = page.locator('div:nth-child(15) > .react-pdf__Page__canvas');
        this.termsCheckbox = page.getByText('I have read and agree to the');
        this.completeBtn = page.getByRole('button', { name: 'Complete' });

        //Supplier admin portal locators
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

    async verifyCompanyNameOnOnboardingForm(companyName) {
        await expect(this.companyNameInput).toHaveValue(companyName);
    }

    async changeCompanyNameOnOnboardingForm() {
        await this.companyNameInput.fill(' ');
        await this.companyNameInput.pressSequentially('bc');
        await this.selectExistingCoName.waitFor({ state: 'visible', timeout: 20000 });
        await this.selectExistingCoName.click();
        await this.page.waitForTimeout(1000);

        // ✅ Read from the actual input field, not the button
        const newCoName = await this.companyNameInput.inputValue();
        return newCoName;
    }

    async completeOnboardingForm(page, supplier) {
        const { companyName, phone, postcode, hirePeriod } = supplier; // 1. Company Name
        //console.log(`completeOnboardingForm: Starting with companyName=${companyName}, phone=${phone}, postcode=${postcode}, hirePeriod=${hirePeriod}`);
        await this.verifyCompanyNameOnOnboardingForm(companyName);
        //await expect(this.companyNameInput).toHaveValue(companyName);
        await this.nextBtn.click();
        await page.waitForTimeout(1000);
        await expect(this.phoneNumberInput).toHaveValue(phone);
        await this.nextBtn.click();
        await page.waitForTimeout(1000);
        await expect(this.postcodeInput).toHaveValue(postcode);
        await this.nextBtn.click();
        await page.waitForTimeout(1000);
        await expect(page.getByRole('button', { name: `${hirePeriod} days` })).toBeVisible();
        await this.nextBtn.click();
        await page.waitForTimeout(1000);
        await this.skipHireCheckbox.check();
        await page.waitForTimeout(1000);
        await this.nextBtn.click();
        await page.waitForTimeout(1000);
        await this.privacyPolicyPdf.click({
            position: {
                x: 634,
                y: 641
            }
        });
        await page.waitForTimeout(1000);
        await expect(this.privacyPolicyPdf).toBeVisible();
        await expect(this.termsCheckbox).toBeEnabled();
        await page.waitForTimeout(1000);
        await this.termsCheckbox.check();
        await page.waitForTimeout(1000);
        await this.completeBtn.click();
        await page.waitForTimeout(1000);
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
