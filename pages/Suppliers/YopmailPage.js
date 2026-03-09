import { expect } from "allure-playwright";
import { TestData } from '../../Data/testData.js';
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

export class YopmailPage {
    /** @param {Page} page */
    constructor(page) {
        this.page = page;
        this.emailInput = page.locator("//input[@class='ycptinput']");
        this.inboxBtn = page.locator("//button[@class='md']");
        this.inboxFrame = this.page.frameLocator('#ifmail');
    }

    async navigateToYopmail() {
        await this.page.goto("https://yopmail.com/en/");
        await this.page.waitForTimeout(1000);
    }

    async accessInbox(email) {
        await this.page.waitForSelector('.ycptinput', { state: 'visible' });
        await this.emailInput.click();
        await this.emailInput.fill(email);
        await this.inboxBtn.click();
        await this.page.waitForTimeout(3000);
    }

    async waitForInvitationEmail(coName, subject = `Join ${coName} on We Want Waste Supplier Platform`, maxRetries = 10, retryDelay = 3000) {
        let emailFound = false;
        let lastInboxText = '';

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            if (this.page.locator('.recaptcha-checkbox-border').isVisible()) {
                this.page.locator('.recaptcha-checkbox-border').check();
                await this.page.waitForTimeout(5000); // Wait for reCAPTCHA to process
            }
            await this.page.waitForSelector('#ifmail', { state: 'visible', timeout: 50000 });
            await this.page.waitForTimeout(2000); // Wait for iframe to load

            // Try to find the email with various text patterns
            const emailPatterns = [
                subject,
                `Join ${coName} on We Want Waste Supplier Platform`,
                `join ${coName} on we want waste supplier platform`
            ];

            for (const pattern of emailPatterns) {
                try {
                    const element = this.inboxFrame.getByText(new RegExp(pattern, 'i'));
                    if (await element.isVisible({ timeout: 3000 })) {
                        emailFound = true;
                        break;
                    }
                } catch (e) {
                    // Continue to next pattern
                }
            }

            if (emailFound) break;

            // Refresh inbox and try again
            await this.page.reload();
            await this.page.waitForTimeout(retryDelay);
            // Optionally, log inbox text for debugging
            lastInboxText = await this.inboxFrame.locator('body').innerText().catch(() => 'No text found');
        }

        if (!emailFound) {
            throw new Error(`Invitation email not found after ${maxRetries} attempts. Last inbox content: ${lastInboxText}`);
        }
    }

    async clickInvitationEmail(subject = "Supplier Invitation") {
        // Try different patterns to find the email
        const emailPatterns = [
            subject,
            'Invitation',
            'invitation',
            'Register',
            'register'
        ];

        for (const pattern of emailPatterns) {
            try {
                const element = this.inboxFrame.getByText(new RegExp(pattern, 'i'));
                if (await element.isVisible({ timeout: 3000 })) {
                    await element.click();
                    await this.page.waitForTimeout(3000);
                    return;
                }
            } catch (e) {
                // Continue to next pattern
            }
        }

        throw new Error('Could not find email to click');
    }

    async getInvitationLink() {
        const link = this.inboxFrame.locator('a', { hasText: 'Accept Invitation' });
        return await link.getAttribute('href');
    }

    async clickInvitationLinkInEmail() {
        // Try to find and click a clickable link in the email
        const allLinks = await this.inboxFrame.locator('a').all();

        if (allLinks.length > 0) {
            // Usually the main CTA link is one of the first links
            for (const link of allLinks) {
                const text = await link.textContent();
                if (text && text.toLowerCase().includes('confirm') || text.toLowerCase().includes('register') || text.toLowerCase().includes('signup')) {
                    await link.click();
                    return;
                }
            }
            // If no specific link found, click the first link
            await allLinks[0].click();
        } else {
            throw new Error('No links found in email');
        }
    }
}
