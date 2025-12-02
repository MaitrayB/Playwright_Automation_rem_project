import { expect } from "allure-playwright";

export class ProfileSettingsPage {
    constructor(page) {
        this.page = page;
        this.profileDropdown = page.locator("//div[@class='relative']//button");
        this.profileSettingsOption = page.getByRole('button', { name: 'Profile Settings' });
        this.dashboardOption = page.locator("//button[contains(.,'Dashboard')]");
        this.profileSettingsOption = page.getByRole('button', { name: 'Profile Settings' });

        this.firstnameInput = page.getByPlaceholder('Enter your first name');
        this.lastnameInput = page.getByPlaceholder('Enter your last name');
        this.phoneInput = page.getByPlaceholder('Enter your phone number');
        this.saveChangesBtn = page.getByRole('button', { name: 'Save Changes' });
    }

    async goToProfileSettingsPage() {
        await this.profileDropdown.click();
        await this.dashboardOption.waitFor({ state: 'visible' });
        await this.dashboardOption.click();
    }

    async editProfileSettings(newFirstName, newLastName, newPhone) {
        await this.profileDropdown.waitFor({ state: 'visible' });
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