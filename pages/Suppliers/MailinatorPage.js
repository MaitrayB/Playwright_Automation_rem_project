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
        this.emailInput = page.getByPlaceholder('Enter Public Mailinator Inbox');
        this.inboxBtn = page.locator('button').filter({ has: page.locator('svg, img') }).first();
        this.inboxFrame = this.page.frameLocator('#html_msg_body');
        this.mailRow = page.getByText('We Want Waste').first();
        this.acceptInvitationLink = page.locator("//a[contains(.,'Accept Invitation')]");
    }

    getInboxName(email) {
        return email.split('@')[0];
    }

    async navigateToMailinator() {
        await this.page.goto('https://www.mailinator.com/');
        await this.page.waitForTimeout(1000);
    }

    async accessInbox(email) {
        const inbox = this.getInboxName(email);
        await this.page.goto(`https://www.mailinator.com/v4/public/inboxes.jsp?to=${inbox}`, {
            waitUntil: 'domcontentloaded',
        });
        await this.page.waitForTimeout(4000);
        await this.mailRow.click();
        await this.page.waitForTimeout(3000);
    }

    async getInvitationLink() {
        const link = this.inboxFrame.locator('a', { hasText: 'Accept Invitation' });
        return await link.getAttribute('href');
    }

    async clickInvitationLinkInEmail() {
        const allLinks = await this.inboxFrame.locator('a').all();

        if (allLinks.length > 0) {
            for (const link of allLinks) {
                const text = await link.textContent();
                if (text && text.toLowerCase().includes('confirm') || text.toLowerCase().includes('register') || text.toLowerCase().includes('signup')) {
                    await link.click();
                    return;
                }
            }
            await allLinks[0].click();
        } else {
            throw new Error('No links found in email');
        }
    }
}
