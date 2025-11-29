export class ProfileSettingsPage {
    constructor(page) {
        this.page = page;
        this.dropDown1 = page.locator("//div[@class='text-right hidden sm:block']");
        this.dashboardOption = page.getByRole('button', { name: 'Dashboard' });
        this.dropDown2 = page.locator("//div[@class='text-right']");
        this.profileSettingsOption = page.getByRole('button', { name: 'Profile Settings' });
    }

    async goToProfileSettingsPage() {
        await this.dropDown.click();
        await this.dashboardOption.click();
        await this.dropDown2.click();
        await this.profileSettingsOption.click();
    }
}