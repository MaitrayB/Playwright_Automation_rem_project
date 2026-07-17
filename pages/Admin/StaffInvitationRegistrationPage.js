import { expect } from 'allure-playwright';
import { ensureCookieConsentDismissed } from '../../utils/cookieConsent.js';

/**
 * @typedef {import('@playwright/test').Page} Page
 * @typedef {import('@playwright/test').Locator} Locator
 */

export class StaffInvitationRegistrationPage {
    /** @param {Page} page */
    constructor(page) {
        this.page = page;
        this.heading = page.getByRole('heading', { name: "You've been invited" });
        this.emailInput = page.locator('input[type="email"]');
        this.firstNameInput = page.locator('#firstName');
        this.lastNameInput = page.locator('#lastName');
        this.phoneInput = page.locator('#phone');
        this.passwordInput = page.locator('#password');
        this.confirmPasswordInput = page.locator('#confirmPassword');
        this.createAccountBtn = page.getByRole('button', { name: 'Create Account' });
        this.staffSignInHeading = page.getByRole('heading', { name: 'Staff Sign In' });
        this.accountCreatedBanner = page.getByText('Account created! Please sign in to continue.');
    }

    async acceptCookiesIfVisible() {
        await ensureCookieConsentDismissed(this.page);
    }

    /**
     * @param {string} email
     * @param {string} [roleLabel='Sales Agent']
     */
    async verifyInvitationRegistrationPage(email, roleLabel = 'Sales Agent') {
        await this.acceptCookiesIfVisible();
        await expect(this.heading).toBeVisible({ timeout: 30000 });
        await expect(this.page.getByText(`Create your ${roleLabel} account for ${email}`)).toBeVisible();
        await expect(this.emailInput).toHaveValue(email);
        await expect(this.emailInput).toBeDisabled();
        await expect(this.firstNameInput).toBeVisible();
        await expect(this.lastNameInput).toBeVisible();
        await expect(this.phoneInput).toBeVisible();
        await expect(this.passwordInput).toBeVisible();
        await expect(this.confirmPasswordInput).toBeVisible();
        await expect(this.createAccountBtn).toBeVisible();
    }

    /**
     * @param {{ firstName: string, lastName: string, password: string, phone?: string }} details
     */
    async fillRegistrationForm(details) {
        const { firstName, lastName, password, phone } = details;
        await this.firstNameInput.fill(firstName);
        await this.lastNameInput.fill(lastName);
        if (phone) {
            await this.phoneInput.fill(phone);
        }
        await this.passwordInput.fill(password);
        await this.confirmPasswordInput.fill(password);
    }

    async submitCreateAccount() {
        await this.acceptCookiesIfVisible();
        await expect(this.createAccountBtn).toBeEnabled({ timeout: 10000 });
        await Promise.all([
            this.page.waitForURL(url => url.pathname.includes('/agent/login') || url.pathname.includes('/login'), {
                timeout: 30000,
            }),
            this.createAccountBtn.click(),
        ]);
    }

    async verifyRedirectedToStaffSignInWithSuccessBanner() {
        await this.acceptCookiesIfVisible();
        await expect(this.staffSignInHeading).toBeVisible({ timeout: 30000 });
        await expect(this.accountCreatedBanner).toBeVisible({ timeout: 15000 });
    }
}
