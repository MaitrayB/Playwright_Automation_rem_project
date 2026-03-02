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
        this.companyNameInput = page.locator("input[type='text']");
        this.phoneNumberInput = page.locator("input[type='tel']");
        this.postcodeInput = page.locator("[placeholder='SW1A 1AA']");
        this.serviceRadiusInput = page.locator('#serviceRadius');
        this.hirePeriodInput = page.locator('#hirePeriod');
        this.minimumTonneInput = page.locator('#minimumTonne');
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
        await this.emailInput.waitFor({ state: 'visible' });
    }

    async supplierLogin(email, password) {
        await this.emailInput.waitFor({ state: 'visible' });
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.signInBtn.click();
    }

    async verifyAcceptedInvitationMsg() {
        await this.alreadyAcceptedInvitationMsg.waitFor({ state: 'visible' });
        await expect(this.alreadyAcceptedInvitationMsg).toHaveText('This invitation has already been accepted. Please log in instead.');
        await expect(this.supplierLoginPageHeading).toBeVisible();
    }


    async completeOnboardingForm(page, supplier) {

        const { companyName, phone, postcode, hirePeriod } = supplier; // 1. Company Name
        const companyNameInput = await page.locator('.w-full.pl-10.pr-10');
        expect(await companyNameInput.inputValue()).toBe(companyName);
        await page.click('button:has-text("Next")');

        // 2. Phone Number
        const phoneNumberInput = await page.locator('input[placeholder="+44 20 1234 5678"]'); //[type="tel"]
        expect(await phoneNumberInput.inputValue()).toBe(phone);
        await page.click('button:has-text("Next")');

        // 3. Postcode
        const postcodeInput = await page.locator('input[placeholder="SW1A 1AA"]');
        expect(await postcodeInput.inputValue()).toBe(postcode);
        await page.click('button:has-text("Next")');

        // 4. Hire Period
        const hirePeriodButton = await page.locator('button.selected');
        expect(await hirePeriodButton.textContent()).toBe(hirePeriod);
        await page.click('button:has-text("Next")');

        // 5. Services
        const skipHireCheckbox = page.locator('text=Skip Hire').locator('..').locator('input[type="checkbox"]');
        if (!(await skipHireCheckbox.isChecked())) {
            await skipHireCheckbox.check();
        }
        await page.click('button:has-text("Next")');

        // 6. Supplier Protection & Dispute Policy
        await page.locator('div:has-text("Supplier Protection & Dispute Policy")').scrollIntoViewIfNeeded();
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        const policyCheckbox = page.locator('input[type="checkbox"]:below(label:has-text("I have read and agree"))');
        await policyCheckbox.check();
        await page.click('button:has-text("Complete")');

        // Verify redirect to orders page
        await expect(page).toHaveURL(/.*\/orders/);

        // Verify supplier status is "active"
        const supplierStatus = await page.locator('text=Status').locator('..').locator('text=active');
        await expect(supplierStatus).toBeVisible();
    }
}
