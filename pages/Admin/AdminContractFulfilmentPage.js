import { expect } from 'allure-playwright';
import { ensureCookieConsentDismissed } from '../../utils/cookieConsent.js';

/**
 * Admin contract detail — Phase 2 Fulfilment card (send for signature).
 * Lives on `/super-admin/contracts/{id}` below the pricing grid.
 *
 * Product copy: Agreed / Send for signature / Send to customer
 * (legacy Closed / Issue for signing still matched where needed).
 *
 * @typedef {import('@playwright/test').Page} Page
 * @typedef {import('@playwright/test').Locator} Locator
 */

export class AdminContractFulfilmentPage {
    /** @param {Page} page */
    constructor(page) {
        this.page = page;
        this.fulfilmentHeading = page.getByRole('heading', { name: /Fulfilment — Contract #\d+/i });
        this.notSentBadge = page
            .getByText('Agreed — not sent to sign', { exact: true })
            .or(page.getByText('Closed — not issued', { exact: true }));
        /** @deprecated alias — use notSentBadge */
        this.closedNotIssuedBadge = this.notSentBadge;
        this.awaitingSignaturesBadge = page.getByText('Awaiting signatures', { exact: true });
        this.notIssuedMessage = page.getByText(
            /The deal is (?:agreed|closed) but nothing has been sent to sign yet/i
        );
        this.sendForSignatureBtn = page.getByRole('button', {
            name: /^(Send for signature|Issue for signing)$/i,
        });
        /** @deprecated alias — use sendForSignatureBtn */
        this.issueForSigningBtn = this.sendForSignatureBtn;
        this.customerEmailInput = page
            .getByRole('textbox', { name: /Customer email \(required to (?:issue|send)\)/i })
            .or(page.getByPlaceholder('customer@company.co.uk'));
        this.customerPhoneInput = page
            .getByRole('textbox', { name: /Customer phone \(optional\)/i })
            .or(page.getByPlaceholder('07123 456789'));
        this.sendToCustomerBtn = page.getByRole('button', {
            name: /^(Send to customer|Issue & send invites|Send (?:& )?invites|Send signing invites|Sending…|Issuing…)$/i,
        });
        /** @deprecated alias — use sendToCustomerBtn */
        this.issueAndSendBtn = this.sendToCustomerBtn;
        this.cancelIssueBtn = page.getByRole('button', { name: 'Cancel', exact: true });
        this.issuedStamp = page.getByText(/^(?:issued|sent)\s+\d{1,2}\/\d{1,2}\/\d{4}/i);
    }

    /** Scoped to the Fulfilment issue/signature card (not the lower ops panel). */
    fulfilmentCard() {
        return this.page
            .locator('div')
            .filter({ has: this.fulfilmentHeading })
            .filter({
                hasText:
                    /Agreed — not sent to sign|Closed — not issued|Awaiting signatures|Send for signature|Issue for signing|Contract issued/i,
            })
            .first();
    }

    async acceptCookiesIfVisible() {
        await ensureCookieConsentDismissed(this.page);
    }

    /** AC-2.1 — agreed deal not yet sent for signature */
    async verifyNotSentToSignCard() {
        await this.acceptCookiesIfVisible();
        await expect(this.fulfilmentHeading).toBeVisible({ timeout: 20000 });
        await expect(this.notSentBadge).toBeVisible();
        await expect(this.notIssuedMessage).toBeVisible();
        await expect(this.sendForSignatureBtn).toBeVisible();
        await expect(this.sendForSignatureBtn).toBeEnabled();
    }

    /** @deprecated use verifyNotSentToSignCard */
    async verifyClosedNotIssuedCard() {
        return this.verifyNotSentToSignCard();
    }

    async openSendForm() {
        await this.sendForSignatureBtn.click();
        await expect(this.customerEmailInput).toBeVisible({ timeout: 10000 });
        await expect(this.customerPhoneInput).toBeVisible();
        await expect(this.sendToCustomerBtn).toBeVisible();
        await expect(this.cancelIssueBtn).toBeVisible();
    }

    /** @deprecated use openSendForm */
    async openIssueForm() {
        return this.openSendForm();
    }

    async verifySendFormFields({ emailPrefilled } = {}) {
        await expect(this.customerEmailInput).toBeVisible();
        await expect(this.customerEmailInput).toHaveAttribute(
            'placeholder',
            'customer@company.co.uk'
        );
        await expect(this.customerPhoneInput).toBeVisible();
        await expect(this.customerPhoneInput).toHaveAttribute('placeholder', '07123 456789');
        await expect(this.sendToCustomerBtn).toBeVisible();
        await expect(this.cancelIssueBtn).toBeVisible();

        if (emailPrefilled) {
            await expect(this.customerEmailInput).toHaveValue(emailPrefilled);
        }
    }

    /** @deprecated use verifySendFormFields */
    async verifyIssueFormFields(opts) {
        return this.verifySendFormFields(opts);
    }

    async clearCustomerEmail() {
        await this.customerEmailInput.fill('');
        await expect(this.sendToCustomerBtn).toBeDisabled();
    }

    async fillCustomerEmail(email) {
        await this.customerEmailInput.fill(email);
        await expect(this.sendToCustomerBtn).toBeEnabled();
    }

    async fillCustomerPhone(phone) {
        if (phone) {
            await this.customerPhoneInput.fill(phone);
        }
    }

    /**
     * AC-2.3 — Send disabled while email empty; label becomes Sending…/Issuing… while POST is in flight.
     */
    async verifySendButtonDisabledEmptyAndSendingState(email) {
        await this.clearCustomerEmail();
        await expect(this.sendToCustomerBtn).toBeDisabled();

        await this.fillCustomerEmail(email);

        let intercepted = false;
        const handler = async (route) => {
            const req = route.request();
            if (req.method() === 'POST' && /issue|invite|sign|fulfil|send/i.test(req.url())) {
                intercepted = true;
                await expect(
                    this.page.getByRole('button', { name: /Sending|Issuing/i })
                ).toBeVisible({
                    timeout: 5000,
                });
                await expect(this.sendToCustomerBtn).toBeDisabled();
                await new Promise((r) => setTimeout(r, 400));
                await route.continue();
                return;
            }
            await route.continue();
        };

        await this.page.route('**/api/**', handler);
        await this.sendToCustomerBtn.click();
        await expect(this.awaitingSignaturesBadge).toBeVisible({ timeout: 45000 });
        await this.page.unroute('**/api/**', handler);
        expect(intercepted).toBeTruthy();
    }

    /** @deprecated use verifySendButtonDisabledEmptyAndSendingState */
    async verifyIssueButtonDisabledEmptyAndIssuingState(email) {
        return this.verifySendButtonDisabledEmptyAndSendingState(email);
    }

    /**
     * Sends the contract for signature with a customer email.
     * @param {{ email: string, phone?: string }} details
     */
    async sendToCustomer({ email, phone } = {}) {
        const emailValue = (await this.customerEmailInput.inputValue()).trim();
        if (emailValue !== email) {
            await this.fillCustomerEmail(email);
        }
        if (phone) {
            await this.fillCustomerPhone(phone);
        }
        await expect(this.sendToCustomerBtn).toBeEnabled();
        await this.sendToCustomerBtn.click();
        await expect(this.awaitingSignaturesBadge).toBeVisible({ timeout: 45000 });
    }

    /** @deprecated use sendToCustomer */
    async issueAndSendInvites(opts) {
        return this.sendToCustomer(opts);
    }

    async verifyIssuedAwaitingSignatures({ customerEmail } = {}) {
        await expect(this.fulfilmentHeading).toBeVisible();
        await expect(this.awaitingSignaturesBadge).toBeVisible({ timeout: 20000 });
        await expect(this.issuedStamp).toBeVisible();
        await expect(this.issuedStamp).toHaveText(
            /(?:issued|sent)\s+\d{1,2}\/\d{1,2}\/\d{4},\s+\d{1,2}:\d{2}:\d{2}/i
        );

        const signatureSection = this.page
            .locator('div')
            .filter({ has: this.fulfilmentHeading })
            .filter({ hasText: 'Awaiting Signature' })
            .first();
        await expect(signatureSection.getByText('Customer', { exact: true }).first()).toBeVisible();
        await expect(signatureSection.getByText('Supplier', { exact: true }).first()).toBeVisible();
        await expect(signatureSection.getByText('Awaiting Signature').first()).toBeVisible();

        if (customerEmail) {
            await expect(
                this.page.getByText(new RegExp(`^${escapeRegExp(customerEmail)}$`, 'i')).first()
            ).toBeVisible();
            await expect(
                this.page.getByText(
                    new RegExp(
                        `Contract issued — signing invites sent to ${escapeRegExp(customerEmail)}`,
                        'i'
                    )
                )
            ).toBeVisible();
        }
    }
}

function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
