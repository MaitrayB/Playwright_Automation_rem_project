import { genericFunctions } from '../../utils/genericFunctions.js';
import { expect } from "allure-playwright";
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
        this.cookieAcceptBtn = page.locator('(//button[contains(.,"Accept All")])[1]');
    }
    async goto(url) {
        await this.page.goto(url, { waitUntil: 'domcontentloaded' });
        await this.emailInput.waitFor({ state: 'visible', timeout: 30000 }).catch(() => {});
        await this.page.waitForTimeout(1000);
        if (await this.cookieAcceptBtn.isVisible()) {
            await this.cookieAcceptBtn.click();
        }
    }

    async adminLogin(email, password) {
        await this.emailInput.waitFor();
        await this.emailInput.fill(email);
        await this.passwordInput.waitFor();
        await this.passwordInput.fill(password);
        if (await this.cookieAcceptBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await this.cookieAcceptBtn.click();
        }
        await this.signInBtn.scrollIntoViewIfNeeded();
        await Promise.all([
            this.page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 30000 }),
            this.signInBtn.click(),
        ]);
        await expect(this.landingPageTitle).toHaveText('Orders', { timeout: 30000 });
    }

    async goToSuppliersPage() {
        const genFunctions = new genericFunctions(this.page);
        await this.page.goto(genFunctions.buildURL('/super-admin/suppliers'), { waitUntil: 'domcontentloaded' });
        await expect(this.page.getByRole('heading', { name: 'Suppliers' })).toBeVisible({ timeout: 30000 });
        await expect(this.page.getByRole('button', { name: 'Invite' })).toBeVisible();
    }
}