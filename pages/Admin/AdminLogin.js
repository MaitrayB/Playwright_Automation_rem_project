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
        await this.page.goto(url);
        await this.page.waitForTimeout(2000);
        if (await this.cookieAcceptBtn.isVisible()) {
            await this.cookieAcceptBtn.click();
        }
    }

    async adminLogin(email, password) {
        await this.emailInput.waitFor();
        await this.emailInput.fill(email);
        await this.passwordInput.waitFor();
        await this.passwordInput.fill(password);
        await this.signInBtn.click();
        await this.page.waitForSelector('table');
        await expect(this.landingPageTitle).toHaveText('Orders');
    }

    async goToSuppliersPage() {
        const baseUrl = new URL(this.page.url()).origin;
        await this.page.goto(`${baseUrl}/super-admin/suppliers`);
        await this.page.waitForSelector('table');
        await expect(this.page.locator('table')).toBeVisible();
    }
}