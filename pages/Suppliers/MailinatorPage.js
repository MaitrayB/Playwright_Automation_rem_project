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

    /**
     * Polls the public inbox until an email matching the subject appears, then opens it.
     * @param {string} email
     * @param {string|RegExp} subject
     * @param {number} [maxRetries=12]
     * @param {number} [retryDelay=3000]
     */
    async waitForInvitationEmail(email, subject, maxRetries = 12, retryDelay = 3000) {
        const inbox = this.getInboxName(email);
        const subjectPattern = subject instanceof RegExp ? subject : new RegExp(subject, 'i');

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            await this.page.goto(`https://www.mailinator.com/v4/public/inboxes.jsp?to=${inbox}`, {
                waitUntil: 'domcontentloaded',
            });
            await this.page.waitForTimeout(3000);

            const subjectRow = this.page.getByText(subjectPattern).first();
            if (await subjectRow.isVisible({ timeout: 3000 }).catch(() => false)) {
                await subjectRow.click();
                await this.page.waitForTimeout(3000);
                return;
            }

            await this.page.waitForTimeout(retryDelay);
        }

        throw new Error(`Invitation email with subject "${subject}" not found in Mailinator inbox after ${maxRetries} attempts`);
    }

    async getInvitationLink(linkText = /Accept [Ii]nvitation/) {
        const pattern = linkText instanceof RegExp ? linkText : new RegExp(String(linkText), 'i');

        const findHref = async () => {
            for (const frame of this.page.frames()) {
                const loc = frame.locator('a').filter({ hasText: pattern }).first();
                if (await loc.count().catch(() => 0)) {
                    const href = await loc.getAttribute('href', { timeout: 2000 }).catch(() => null);
                    if (href) return href;
                }
            }
            const pageLink = this.page.locator('a').filter({ hasText: pattern }).first();
            if (await pageLink.count().catch(() => 0)) {
                return await pageLink.getAttribute('href', { timeout: 2000 }).catch(() => null);
            }
            return null;
        };

        const deadline = Date.now() + 25000;
        while (Date.now() < deadline) {
            const href = await findHref();
            if (href) return href;

            const linksTab = this.page.getByText(/^LINKS$/i).first();
            if (await linksTab.isVisible().catch(() => false)) {
                await linksTab.click().catch(() => {});
                await this.page.waitForTimeout(800);
                const contractLink = this.page
                    .locator('a[href*="wewantwaste"], a[href*="contract-signing"], a[href*="onboard"]')
                    .first();
                if (await contractLink.count().catch(() => 0)) {
                    const href = await contractLink.getAttribute('href');
                    if (href) return href;
                }
            }
            await this.page.waitForTimeout(500);
        }
        throw new Error('Invitation link not found in Mailinator message');
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
