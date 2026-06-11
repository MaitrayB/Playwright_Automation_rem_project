import { SupplierRegistrationPage } from './SupplierRegistrationPage.js';
import { genericFunctions } from '../../utils/genericFunctions.js';
/**
 * @typedef {import('@playwright/test').Page} Page
 * @typedef {import('@playwright/test').Locator} Locator
 */
export class SupplierMenuNavigation {
    /** @param {Page} page */
    constructor(page) {
        this.page = page;
        this.dashboardMenuLink = page.getByRole('link', { name: 'Dashboard' });
        this.accountMenuLink = page.getByRole('link', { name: 'Account' });
        this.doItLaterBtn = page.getByRole('button', { name: 'Do it later' });
        this.usersMenuLink = page.getByRole('link', { name: 'Users' });
        this.accountStatusSection = page.getByText('Account Status').locator('..').last();//.getByText(/Active/);
        this.bankInformationMenuLink = page.getByRole('link', { name: 'Bank Information' });

        //Logout
        this.logOutBtn = page.getByRole('button', { name: 'Logout' });
        this.mobileNavButtons = page.locator('header button, banner button').filter({ has: page.locator('svg') });
    }

    async openMobileMenuIfNeeded() {
        if (await this.logOutBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            return;
        }

        const menuButtonCount = await this.mobileNavButtons.count();
        for (let i = menuButtonCount - 1; i >= 0; i--) {
            await this.mobileNavButtons.nth(i).click();
            await this.page.waitForTimeout(1000);

            if (await this.logOutBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
                return;
            }
        }
    }

    async switchToLoginPage() {
        await this.page.context().clearCookies();
        await this.page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });
        const genFunctions = new genericFunctions(this.page);
        await genFunctions.goto(this.page, '/supplier/login');
    }
    async redirectToUsersPage() {
        if (await this.doItLaterBtn.isVisible()) {
            await this.doItLaterBtn.click();
            await this.page.waitForTimeout(2000);
        }
        // Step 2: Navigate to Users page
        await this.usersMenuLink.waitFor({ state: 'visible' });
        await this.usersMenuLink.click();
        await this.page.waitForTimeout(2000);
    }
    async navigateToAccountPage() {
        await this.accountMenuLink.click();
        await this.accountStatusSection.waitFor({ state: 'visible' });
        await this.page.waitForTimeout(2000);
    }
    async navigateToDashboardPage() {
        await this.dashboardMenuLink.click();
        await this.page.waitForTimeout(2000);
    }
    async navigateToBankInformationPage() {
        await this.bankInformationMenuLink.click();
        await this.page.waitForTimeout(2000);
    }

    async logout() {
        const supplierRegistrationPage = new SupplierRegistrationPage(this.page);
        await this.openMobileMenuIfNeeded();

        if (await this.logOutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await this.logOutBtn.click();
        } else {
            await this.switchToLoginPage();
        }

        await supplierRegistrationPage.emailInput.waitFor({ state: 'visible', timeout: 20000 });
    }
}