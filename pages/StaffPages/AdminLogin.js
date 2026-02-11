import { genericFunctions } from '../../utils/genericFunctions';
import { expect } from '@playwright/test';
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
        this.emailAddInput = page.locator('#email');
        this.passwordInput = page.getByPlaceholder('Enter your password');
        this.signInBtn = page.getByRole('button', { name: 'Sign in' });
        this.landingPageTitle = page.getByRole('heading', { name: 'Orders' });
    }
    async goto() {
        const genFunctions = new genericFunctions(this.page);
        await this.page.goto(genFunctions.buildURL('/agent/login'));
        await this.page.waitForTimeout(1000);
    }

    async adminLogin(email, password) {
        await this.emailAddInput.waitFor();
        await this.emailAddInput.fill(email);
        await this.passwordInput.waitFor();
        await this.passwordInput.fill(password);
        await this.signInBtn.click();
        await this.page.waitForSelector('h1');
        await expect(this.landingPageTitle).toHaveText('Orders');
    }
}