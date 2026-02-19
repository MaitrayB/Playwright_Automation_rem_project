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
        this.profileDropdown = page.locator('button p').filter({ hasText: TestData.credentials.customer.username });
        this.profileSettingsOption = page.getByRole('button', { name: 'Profile Settings' });
        this.dashboardOption = page.getByRole('button', { name: 'Dashboard' });
        this.profileSettingsOption = page.getByRole('button', { name: 'Profile Settings' });

        this.firstnameInput = page.getByPlaceholder('Enter your first name');
        this.lastnameInput = page.getByPlaceholder('Enter your last name');
        this.phoneInput = page.getByPlaceholder('Enter your phone number');
        this.saveChangesBtn = page.getByRole('button', { name: 'Save Changes' });
    }

    async goToProfileSettingsPage() {
        if (await this.page.getByRole('button', { name: 'No thanks, start a new order' }, { state: 'visible' }).isVisible()) {
            await this.page.getByRole('button', { name: 'No thanks, start a new order' }).click();
        }
        await this.profileDropdown.click();
        await this.dashboardOption.waitFor({ state: 'visible' });
        await this.dashboardOption.click();
    }

    async editProfileSettings(newFirstName, newLastName, newPhone) {
        await this.profileDropdown.focus();
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

        await this.firstnameInput.fill("Navin");
        await this.lastnameInput.fill("Shah");
        await this.phoneInput.fill("1333444333");
        await this.saveChangesBtn.click();

        await this.page.waitForTimeout(2000);

    }

}