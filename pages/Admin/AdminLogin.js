import { genericFunctions } from '../../utils/genericFunctions.js';
import { expect } from "allure-playwright";
import { ensureCookieConsentDismissed, prepareCookieConsent } from '../../utils/cookieConsent.js';
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

export class AdminLogin {
    /** @param {Page} page */

    constructor(page) {
        this.page = page;
        this.emailInput = page.locator('#email');
        this.passwordInput = page.getByPlaceholder('Enter your password');
        this.signInBtn = page.getByRole('button', { name: 'Sign in' });
        this.landingPageTitle = page.getByRole('heading', { name: 'Orders' });
        this.staffSignInHeading = page.getByRole('heading', { name: 'Staff Sign In' });
        this.contractsPageHeading = page.getByRole('heading', { name: 'Contracts', exact: true });
    }
    async goto(url) {
        await prepareCookieConsent(this.page.context());
        await this.page.goto(url, { waitUntil: 'domcontentloaded' });
        await this.emailInput.waitFor({ state: 'visible', timeout: 30000 }).catch(() => {});
        await ensureCookieConsentDismissed(this.page);
    }

    async adminLogin(email, password) {
        await this.emailInput.waitFor();
        await this.emailInput.fill(email);
        await this.passwordInput.waitFor();
        await this.passwordInput.fill(password);
        await ensureCookieConsentDismissed(this.page);
        await this.signInBtn.scrollIntoViewIfNeeded();
        await Promise.all([
            this.page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 30000 }),
            this.signInBtn.click(),
        ]);
        await expect(this.landingPageTitle).toHaveText('Orders', { timeout: 30000 });
    }

    async salesAgentLogin(email, password) {
        await expect(this.staffSignInHeading).toBeVisible({ timeout: 30000 });
        await this.emailInput.waitFor();
        await this.emailInput.fill(email);
        await this.passwordInput.waitFor();
        await this.passwordInput.fill(password);
        await ensureCookieConsentDismissed(this.page);
        await this.signInBtn.scrollIntoViewIfNeeded();
        await Promise.all([
            this.page.waitForURL(url => url.pathname.includes('/sales/contracts'), { timeout: 30000 }),
            this.signInBtn.click(),
        ]);
        await expect(this.contractsPageHeading).toBeVisible({ timeout: 30000 });
    }

    async goToSuppliersPage() {
        const genFunctions = new genericFunctions(this.page);
        await this.page.goto(genFunctions.buildURL('/super-admin/suppliers'), { waitUntil: 'domcontentloaded' });
        await expect(this.page.getByRole('heading', { name: 'Suppliers' })).toBeVisible({ timeout: 30000 });
        await expect(this.page.getByRole('button', { name: 'Invite' })).toBeVisible();
    }

    async goToUsersPage() {
        const genFunctions = new genericFunctions(this.page);
        await this.page.goto(genFunctions.buildURL('/super-admin/users'), { waitUntil: 'domcontentloaded' });
        await expect(this.page.getByRole('heading', { name: 'Users', exact: true })).toBeVisible({ timeout: 30000 });
    }

    async goToContractsPage() {
        const genFunctions = new genericFunctions(this.page);
        await this.page.goto(genFunctions.buildURL('/super-admin/contracts'), { waitUntil: 'domcontentloaded' });
        await expect(this.page.getByRole('heading', { name: 'Contracts', exact: true })).toBeVisible({ timeout: 30000 });
    }
}