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
}
