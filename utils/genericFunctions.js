import { expect } from '@playwright/test';
import { faker, Faker } from "@faker-js/faker";
import { TestData } from '../Data/testData.js';

export class genericFunctions {
    constructor(page) {
        this.page = page;
        //this.inputEmail = page.locator("//input[@class='ycptinput']");
        this.inputEmail = page.locator("//input[contains(@class,'ycptinput')]");
        this.inboxBtn = page.locator('button.md').first();
        this.inboxFrame = this.page.frameLocator('#ifmail');
        this.inboxListFrame = this.page.frameLocator('#ifinbox');
        this.mobileMailFrame = this.page.frameLocator('#ifmobmail');
        this.usernameInput = page.locator("#email");
        this.passwordInput = page.locator('#password');
        this.signInBtn = page.getByRole('button', { name: 'Sign in' });
        this.cookieAcceptBtn = page.locator('(//button[contains(.,"Accept All")])[1]');
    }

    buildURL(path) {
        return `${TestData.baseURL.replace(/\/$/, '')}${path}`;
    }

    async acceptPrivacyPopupIfVisible(page = this.page) {
        await page.waitForTimeout(2000);
        if (await page.locator('(//button[contains(.,"Accept All")])[1]').isVisible().catch(() => false)) {
            await page.locator('(//button[contains(.,"Accept All")])[1]').click();
        }
    }

    async goto(page, path) {
        await page.goto(this.buildURL(path));
        await this.acceptPrivacyPopupIfVisible(page);
    }

    async autoLogin(username, password) {
        await this.usernameInput.fill(username);
        await this.passwordInput.fill(password);
        await this.signInBtn.click();
        await this.page.getByRole('heading', { name: 'Orders' });
    }

    async goToYopmail() {
        await this.page.waitForTimeout(3000);
        await this.page.goto("https://yopmail.com/en/", { timeout: 50000 });
        await this.page.waitForTimeout(1000);
    }

    async accessInbox(email) {

        let attempts = 0;
        const maxAttempts = 5;

        await this.page.waitForSelector('.ycptinput', { state: 'visible' });
        await this.inputEmail.click();
        await this.inputEmail.fill(email);
        await this.inboxBtn.click();
        await this.page.waitForTimeout(2000);

        while (await this.inputEmail.isVisible() && attempts < maxAttempts) {
            await this.page.goto(this.page.url(), { waitUntil: 'domcontentloaded' });
            await this.page.goto("https://yopmail.com", { timeout: 50000 });
            await this.page.waitForTimeout(2000);
            await this.inputEmail.click();
            await this.inputEmail.fill(email);
            await this.inboxBtn.click();
            await this.page.waitForTimeout(2000);
            await this.inboxBtn.click();
            await this.page.waitForTimeout(2000);
            attempts++;
        }
    }

    async checkOrderEmailReceived(orderPage) {
        const emailSubject = "Your Skip Hire Booking Confirmation";
        const skip = orderPage.skipValue;

        const isMobile = await this.page.locator('#ifmail').count() === 0;

        if (isMobile) {
            await expect(this.inboxListFrame.getByText(emailSubject).first()).toBeVisible({ timeout: 30000 });
            await this.inboxListFrame.getByText(emailSubject).first().click();
            await this.page.waitForSelector('#ifmobmail', { state: 'visible', timeout: 15000 });

            await expect(this.mobileMailFrame.getByText(emailSubject)).toBeVisible({ timeout: 30000 });
            await expect(this.mobileMailFrame.getByText(/You did it/)).toBeVisible({ timeout: 10000 });
            await expect(this.mobileMailFrame.getByText(`Skip Type: ${skip} yarder skip`)).toBeVisible({ timeout: 3000 });
        } else {
            await this.page.waitForSelector('#ifmail', { state: 'visible' });
            await expect(this.inboxFrame.getByText(emailSubject)).toBeVisible({ timeout: 30000 });
            await this.inboxFrame.getByText(emailSubject).click();

            await expect(this.inboxFrame.getByText(/You did it/)).toBeVisible({ timeout: 10000 });
            await expect(this.inboxFrame.getByText(`Skip Type: ${skip} yarder skip`)).toBeVisible({ timeout: 3000 });
        }
    };

    async getFutureDay(daysToAdd) {
        // Create a Date object for the current date and time
        const today = new Date();
        // Create a new variable for the future date to avoid modifying 'today' directly
        const futureDate = new Date(today);
        // Use setDate() to modify the day of the month.
        // The Date object automatically handles month and year rollovers.
        futureDate.setDate(today.getDate() + daysToAdd);
        // Get day from the date with time value
        const futureDay = futureDate.getDate();
        return futureDay;
    };

    async getSiteContactDetails() {
        const phone = "1888999393";
        const name = faker.person.firstName();
        const email = `${name}_${phone}@yopmail.com`;
        return {
            phone, name, email
        };
    }

    async generateRandomEmail() {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const emailAddress = `${firstName}_${lastName}@yopmail.com`;
        return emailAddress;
    }

    async generateRandomEmailmailinator() {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const emailAddress = `${firstName}_${lastName}@mailinator.com`;
        return emailAddress;
    }

    async generateRandomPhoneNum() {
        // Generate valid UK mobile phone number in format: 07XXX XXXXXX (e.g., 07361 583234)
        // UK mobile numbers starting with 07 are SMS-capable and can receive text messages
        const validPrefixes = [
            '071', '072', '073', '074',
            '075', '077', '078', '079'
        ];
        const prefix = faker.helpers.arrayElement(validPrefixes);
        const areaCode = faker.string.numeric(2);
        const localNumber = faker.string.numeric(6);
        const number = `${prefix}${areaCode} ${localNumber}`;
        return number;
    }

    async clickRandomItem(locator) {
        const count = await locator.count();
        if (count === 0) {
            throw new Error('No items found');
        }
        const randomIndex = Math.floor(Math.random() * count);
        await locator.nth(randomIndex).click();
        return randomIndex;
    }
}
