import { expect } from '@playwright/test';
import { faker, Faker } from "@faker-js/faker";
import { TestData } from '../Data/testData.js';

export class genericFunctions {
    constructor(page) {
        this.page = page;
        this.inputEmail = page.locator("//input[@class='ycptinput']");
        this.inboxBtn = page.locator("//button[@class='md']");
        this.inboxFrame = this.page.frameLocator('#ifmail');
    }

    async goToYopmail() {
        await this.page.waitForTimeout(3000);
        await this.page.goto("https://yopmail.com/en/", { waitUntil: 'networkidle' });
        // await this.page.waitForLoadState("networkidle");
    }

    async accessInbox(email) {
        await this.page.waitForSelector('.ycptinput', { state: 'visible' });
        await this.inputEmail.click();
        await this.inputEmail.fill(email);
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

    buildURL(path) {
        return `${TestData.baseURL.replace(/\/$/, '')}${path}`;
    }

    async generateRandomEmail() {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const emailAddress = `${firstName}_${lastName}@yopmail.com`;
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
}