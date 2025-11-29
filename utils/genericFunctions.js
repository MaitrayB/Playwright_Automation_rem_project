import { expect } from '@playwright/test';

export class genericFunctions {
    constructor(page) {
        this.page = page;
        this.inputEmail = page.locator("//input[@class='ycptinput']");
        this.inboxBtn = page.locator("//button[@class='md']");
        this.inboxFrame = this.page.frameLocator('#ifmail');
    }

    async goToYopmail() {
        await this.page.waitForTimeout(3000);
        await this.page.goto("https://yopmail.com/en/");
        await this.page.waitForTimeout(2000);
    }

    async accessInbox(emailId) {
        await this.inputEmail.waitFor({ state: 'visible', timeout: 4000 });
        await this.inputEmail.click();
        await this.inputEmail.fill(emailId);
        await this.inboxBtn.click();
        await this.page.waitForTimeout(2000);
    }

    async checkOrderEmailReceived(orderPage) {
        const emailSubject = "Your Skip Hire Booking Confirmation";

        await this.page.waitForSelector('#ifmail', { state: 'visible' });
        await expect(this.inboxFrame.getByText(emailSubject)).toBeVisible({ timeout: 30000 }); // Waits up to 30 seconds
        await this.inboxFrame.getByText(emailSubject).click();

        const skip = orderPage.skipValue;
        //console.log(`skip name: ${skip}`);

        await expect(this.inboxFrame.getByText('You did it…  Here’s your booking details for your skip with ')).toBeVisible();
        await expect(this.inboxFrame.getByText(`Skip Type: ${skip} yarder skip`)).toBeVisible({ timeout: 3000 });

    }
}