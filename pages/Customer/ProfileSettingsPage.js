import { expect } from "allure-playwright";
import { TestData } from "../../Data/testData.js";
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

export class ProfileSettingsPage {
    /** @param {Page} page */
    constructor(page) {
        this.page = page;
        this.profileDropdown = page.getByRole('banner').locator('button').filter({ hasText: new RegExp(TestData.credentials.customer.firstName, 'i') }).first();
        this.profileSettingsOption = page.getByRole('button', { name: 'Profile Settings' });
        this.dashboardOption = page.getByRole('button', { name: 'Dashboard' });

        this.firstnameInput = page.getByPlaceholder('Enter your first name');
        this.lastnameInput = page.getByPlaceholder('Enter your last name');
        this.phoneInput = page.getByPlaceholder('Enter your phone number');
        this.saveChangesBtn = page.getByRole('button', { name: 'Save Changes' });
    }

    async goToProfileSettingsPage() {
        if (await this.page.getByRole('button', { name: 'No thanks, start a new order' }).isVisible().catch(() => false)) {
            await this.page.getByRole('button', { name: 'No thanks, start a new order' }).click();
        }
        await this.profileDropdown.click();
        await this.dashboardOption.waitFor({ state: 'visible' });
        await this.dashboardOption.click();
    }

    async editProfileSettings(newFirstName, newLastName, newPhone) {
        await this.profileDropdown.click();
        await this.profileSettingsOption.waitFor({ state: 'visible' });
        await this.profileSettingsOption.click();
        await this.page.waitForTimeout(2000);
        await this.firstnameInput.fill(newFirstName);
        await this.lastnameInput.fill(newLastName);
        await this.phoneInput.fill(newPhone);
        await this.saveChangesBtn.click();

        await this.page.waitForTimeout(2000);

        expect(this.firstnameInput).toHaveValue(newFirstName);
        expect(this.lastnameInput).toHaveValue(newLastName);
        expect(this.phoneInput).toHaveValue(newPhone);

        // Revert back to original details (optional)   

        await this.firstnameInput.fill(TestData.credentials.customer.firstName);
        await this.lastnameInput.fill(TestData.credentials.customer.lastName);
        await this.phoneInput.fill(TestData.credentials.customer.phone);
        await this.saveChangesBtn.click();

        await this.page.waitForTimeout(2000);

    }

}