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
        this.inboxListFrame = this.page.frameLocator('#ifinbox');
        this.mobileMailFrame = this.page.frameLocator('#ifmobmail');
    }

    async isMobileInbox() {
        const viewport = this.page.viewportSize();
        if (viewport) {
            return viewport.width < 1024;
        }
        return (await this.page.locator('#ifmail').count()) === 0;
    }

    getInvitationEmailPatterns(coName, subject) {
        return [
            subject,
            `Join ${coName} on We Want Waste Supplier Platform`,
            `join ${coName} on we want waste supplier platform`,
            'We Want Waste Supplier Platform',
            'We Want Waste Team',
            'Accept Invitation',
        ];
    }

    async handleRecaptchaIfPresent() {
        const recaptchaFrame = this.page.frameLocator('iframe[title*="reCAPTCHA"], iframe[src*="recaptcha"]').first();
        const frameCheckbox = recaptchaFrame.locator('.recaptcha-checkbox-border, #recaptcha-anchor').first();
        if (await frameCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
            await frameCheckbox.click({ force: true });
            await this.page.waitForTimeout(5000);
            return;
        }

        const captcha = this.page.locator('.recaptcha-checkbox-border, #recaptcha-anchor').first();
        if (await captcha.isVisible({ timeout: 2000 }).catch(() => false)) {
            await captcha.click({ force: true });
            await this.page.waitForTimeout(5000);
        }
    }

    async reopenInbox(email) {
        const login = email.split('@')[0];
        await this.page.goto(`https://yopmail.com/en/?login=${login}`, { waitUntil: 'domcontentloaded' });
        await this.page.waitForTimeout(3000);
        await this.handleRecaptchaIfPresent();
    }

    async refreshInbox() {
        await this.handleRecaptchaIfPresent();
        const refreshBtn = this.page.locator('#refreshbut button').first();
        if (await refreshBtn.isVisible().catch(() => false)) {
            await refreshBtn.click();
        } else {
            await this.page.reload();
        }
        await this.page.waitForTimeout(2000);
    }

    async findInvitationEmailInFrame(frame, emailPatterns) {
        for (const pattern of emailPatterns) {
            const element = frame.getByText(new RegExp(pattern, 'i')).first();
            if (await element.isVisible({ timeout: 3000 }).catch(() => false)) {
                await element.click();
                return true;
            }
        }
        return false;
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

    async waitForInvitationEmail(coName, subject, email = '', maxRetries = 10, retryDelay = 3000) {
        let emailFound = false;
        let lastInboxText = '';
        const resolvedSubject = subject || `Join ${coName} on We Want Waste Supplier Platform`;
        const emailPatterns = this.getInvitationEmailPatterns(coName, resolvedSubject);

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            await this.handleRecaptchaIfPresent();

            const isMobile = await this.isMobileInbox();

            if (isMobile) {
                await this.page.waitForSelector('#ifinbox', { state: 'visible', timeout: 15000 });
                await this.page.waitForTimeout(1000);
                emailFound = await this.findInvitationEmailInFrame(this.inboxListFrame, emailPatterns);

                if (emailFound) {
                    await this.page.waitForSelector('#ifmobmail', { state: 'visible', timeout: 15000 });
                } else {
                    lastInboxText = await this.inboxListFrame.locator('body').innerText().catch(() => 'No text found');
                }
            } else {
                if (await this.page.locator('#ifinbox').isVisible().catch(() => false)) {
                    emailFound = await this.findInvitationEmailInFrame(this.inboxListFrame, emailPatterns);
                }

                if (!emailFound && await this.page.locator('#ifmail').isVisible().catch(() => false)) {
                    emailFound = await this.findInvitationEmailInFrame(this.inboxFrame, emailPatterns);
                }

                if (!emailFound) {
                    lastInboxText = await this.page.locator('#ifmail').isVisible().catch(() => false)
                        ? await this.inboxFrame.locator('body').innerText().catch(() => 'No text found')
                        : 'Inbox blocked by CAPTCHA or not loaded';
                }
            }

            if (emailFound) break;

            if (email) {
                await this.reopenInbox(email);
            } else {
                await this.refreshInbox();
            }
            await this.page.waitForTimeout(retryDelay);
        }

        if (!emailFound) {
            throw new Error(`Invitation email not found after ${maxRetries} attempts. Last inbox content: ${lastInboxText}`);
        }
    }

    async clickInvitationEmail(subject = "Supplier Invitation") {
        const emailPatterns = [
            subject,
            'Invitation',
            'invitation',
            'Register',
            'register'
        ];

        const isMobile = await this.isMobileInbox();
        const searchFrame = isMobile ? this.inboxListFrame : this.inboxFrame;

        for (const pattern of emailPatterns) {
            const element = searchFrame.getByText(new RegExp(pattern, 'i')).first();
            if (await element.isVisible({ timeout: 3000 }).catch(() => false)) {
                await element.click();
                if (isMobile) {
                    await this.page.waitForSelector('#ifmobmail', { state: 'visible', timeout: 15000 });
                }
                await this.page.waitForTimeout(3000);
                return;
            }
        }

        throw new Error('Could not find email to click');
    }

    async getInvitationLink() {
        const mailFrame = await this.isMobileInbox() ? this.mobileMailFrame : this.inboxFrame;
        const link = mailFrame.locator('a', { hasText: 'Accept Invitation' });
        return await link.getAttribute('href');
    }

    async clickInvitationLinkInEmail() {
        const mailFrame = await this.isMobileInbox() ? this.mobileMailFrame : this.inboxFrame;
        const allLinks = await mailFrame.locator('a').all();

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
