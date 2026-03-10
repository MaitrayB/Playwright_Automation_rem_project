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

export class MailinatorPage {
    /** @param {Page} page */
    constructor(page) {
        this.page = page;
        this.emailInput = page.locator("(//input[@placeholder='Enter Public Mailinator Inbox'])[1]");
        this.inboxBtn = page.locator("(//button)[1]");
        this.inboxFrame = this.page.frameLocator('#html_msg_body');
        this.mailRow = page.locator("(//td[contains(.,'We Want Waste')])[1]");
        this.acceptInvitationLink = page.locator("//a[contains(.,'Accept Invitation')]");
    }

    async navigateToMailinator() {
        await this.page.goto("https://www.mailinator.com/");
        await this.page.waitForTimeout(1000);
    }

    async accessInbox(email) {
        
        await this.emailInput.click();
        await this.emailInput.fill(email);
        await this.inboxBtn.click();
        await this.page.waitForTimeout(4000);
        //await expect(this.mailRow).toBeVisible();   
        await this.mailRow.click();
        await this.page.waitForTimeout(3000);
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
