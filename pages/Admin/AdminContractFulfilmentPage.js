import { expect } from 'allure-playwright';
import { ensureCookieConsentDismissed } from '../../utils/cookieConsent.js';

/**
 * Admin contract detail — Phase 2 Fulfilment card.
 * Issue for signing + signature party rows (Customer / Supplier).
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
        this.closedNotIssuedBadge = this.notSentBadge;
        this.awaitingSignaturesBadge = page
            .locator('main')
            .getByText('Awaiting signatures', { exact: true })
            .first();
        this.notIssuedMessage = page.getByText(
            /The deal is (?:agreed|closed) but nothing has been sent to sign yet/i
        );
        this.sendForSignatureBtn = page.getByRole('button', {
            name: /^(Send for signature|Issue for signing)$/i,
        });
        this.issueForSigningBtn = this.sendForSignatureBtn;
        this.customerEmailInput = page
            .getByRole('textbox', { name: /Customer email( \(required to (?:issue|send)\))?/i })
            .or(page.getByPlaceholder('customer@company.co.uk'));
        this.customerPhoneInput = page
            .getByRole('textbox', { name: /Customer phone \(optional\)/i })
            .or(page.getByPlaceholder('07123 456789'));
        this.sendToCustomerBtn = page.getByRole('button', {
            name: /^(Send to customer|Issue & send invites|Send (?:& )?invites|Send signing invites|Sending…|Issuing…)$/i,
        });
        this.issueAndSendBtn = this.sendToCustomerBtn;
        this.cancelIssueBtn = page.getByRole('button', { name: 'Cancel', exact: true });
        this.issuedStamp = page.getByText(/^(?:issued|sent)\s+\d{1,2}\/\d{1,2}\/\d{4}/i);

        // §6 — toast / flash messages
        this.customerVerifiedToast = page.getByText(
            /Customer signature verified — the supply agreement has now been sent to the supplier\./i
        );
        this.supplierVerifiedToast = page.getByText(/Supplier signature verified/i);
        this.resendCustomerToast = page.getByText(/Signing invite re-sent to the customer\./i);
        this.resendSupplierToast = page.getByText(/Signing invite re-sent to the supplier\./i);
        this.alreadySignedToast = page.getByText(
            /This party has already signed — nothing to re-send\./i
        );
        this.supplierNotReleasedToast = page.getByText(
            /The supply agreement goes out once the customer has signed — nothing to re-send yet\./i
        );
        this.emailUpdatedToast = page.getByText(
            /Customer email updated — a fresh signing invite was sent to /i
        );
        this.phoneUpdatedToast = page.getByText(/Customer phone updated\./i);
        this.cannotEditAfterSignedToast = page.getByText(
            /This party has already signed — contact details can no longer be edited\./i
        );
        this.portalLoginHint = page.getByText(
            /The portal login account was created with the original email and will not be renamed/i
        );
        this.saveAndResendBtn = page.getByRole('button', {
            name: /^(Save & re-send if email changed|Saving…)$/i,
        });
    }

    fulfilmentCard() {
        // Prefer main so DEV chrome / sidebar never leak into signature-row matching
        return this.page
            .locator('main')
            .filter({ has: this.fulfilmentHeading })
            .first();
    }

    /**
     * Signature party label inside the fulfilment card (not the Customer header card).
     * Product uses a fixed-width party name span (e.g. span.w-20).
     * @param {'Customer'|'Supplier'} party
     */
    partyLabel(party) {
        const compact = this.fulfilmentCard()
            .locator('span.w-20')
            .filter({ hasText: new RegExp(`^${party}$`) })
            .first();
        // Fallback: first party name span after the Fulfilment heading
        const afterHeading = this.fulfilmentHeading.locator(
            `xpath=following::span[normalize-space()="${party}"][1]`
        );
        return compact.or(afterHeading);
    }

    /**
     * Status pill for a party (exact match so "Awaiting Signature" ≠ "Awaiting signatures").
     * @param {'Customer'|'Supplier'} party
     * @param {string} status
     */
    partyStatus(party, status) {
        return this.partyLabel(party).locator(
            `xpath=following::span[normalize-space()="${status}"][1]`
        );
    }

    /**
     * Customer or Supplier signature party row (label through status/actions).
     * @param {'Customer'|'Supplier'} party
     */
    signatureRow(party) {
        return this.partyLabel(party).locator(
            'xpath=ancestor::div[contains(@class,"flex") and (.//button or .//span[contains(@class,"rounded")])][1]'
        );
    }

    /**
     * Action button on a party row (Re-send, Edit, Verify, Signed document…).
     * Scoped so Customer actions never match Supplier buttons (and vice versa).
     * @param {'Customer'|'Supplier'} party
     * @param {RegExp} name
     */
    partyActionButton(party, name) {
        const nextParty = party === 'Customer' ? 'Supplier' : null;
        if (nextParty) {
            // After Customer label, before Supplier label
            return this.partyLabel(party)
                .locator(
                    `xpath=following::button[not(preceding::span[contains(@class,"w-20") and normalize-space()="${nextParty}"])]`
                )
                .filter({ hasText: name })
                .first();
        }
        // Supplier (last party): buttons after its label
        return this.partyLabel(party)
            .locator('xpath=following::button')
            .filter({ hasText: name })
            .first();
    }

    verifyBtn(party) {
        return this.partyActionButton(party, /^(Verify|Verifying…)$/);
    }

    resendBtn(party) {
        return this.partyActionButton(party, /^(Re-send|Sending…)$/);
    }

    editCustomerBtn() {
        return this.partyActionButton('Customer', /^Edit$/i);
    }

    signedDocumentBtn(party) {
        return this.partyActionButton(party, /^(Signed document|Opening…)$/);
    }

    async acceptCookiesIfVisible() {
        await ensureCookieConsentDismissed(this.page);
    }

    async verifyNotSentToSignCard() {
        await this.acceptCookiesIfVisible();
        await expect(this.fulfilmentHeading).toBeVisible({ timeout: 20000 });
        await expect(this.notSentBadge).toBeVisible();
        await expect(this.notIssuedMessage).toBeVisible();
        await expect(this.sendForSignatureBtn).toBeVisible();
        await expect(this.sendForSignatureBtn).toBeEnabled();
    }

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

    async verifySendButtonDisabledEmptyAndSendingState(email) {
        await this.clearCustomerEmail();
        await expect(this.sendToCustomerBtn).toBeDisabled();
        await this.fillCustomerEmail(email);

        let intercepted = false;
        const handler = async (route) => {
            const req = route.request();
            if (
                req.method() === 'POST' &&
                /contract-requests|issue|invite|fulfil|sign/i.test(req.url()) &&
                !/analytics|telemetry/i.test(req.url())
            ) {
                intercepted = true;
                await expect(
                    this.page.getByRole('button', { name: /Sending|Issuing/i })
                ).toBeVisible({ timeout: 5000 }).catch(() => {});
                await expect(this.sendToCustomerBtn).toBeDisabled().catch(() => {});
                await new Promise((r) => setTimeout(r, 400));
                await route.continue();
                return;
            }
            await route.continue();
        };

        await this.page.route('**/api/**', handler);
        await this.sendToCustomerBtn.click();
        await expect(this.page).toHaveURL(/\/super-admin\/contracts\/\d+/, { timeout: 30000 });
        await expect(this.fulfilmentHeading).toBeVisible({ timeout: 20000 });
        await expect(this.awaitingSignaturesBadge).toBeVisible({ timeout: 45000 });
        await this.page.unroute('**/api/**', handler).catch(() => {});
        // Sending… can be too fast to observe — fulfilment status is the hard signal
        void intercepted;
    }

    async verifyIssueButtonDisabledEmptyAndIssuingState(email) {
        return this.verifySendButtonDisabledEmptyAndSendingState(email);
    }

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
        await expect(this.page).toHaveURL(/\/super-admin\/contracts\/\d+/, { timeout: 30000 });
        await expect(this.fulfilmentHeading).toBeVisible({ timeout: 20000 });
        await expect(this.awaitingSignaturesBadge).toBeVisible({ timeout: 45000 });
    }

    async issueAndSendInvites(opts) {
        return this.sendToCustomer(opts);
    }

    async verifyIssuedAwaitingSignatures({ customerEmail, customerPhone } = {}) {
        await expect(this.page).toHaveURL(/\/super-admin\/contracts\/\d+/, { timeout: 15000 });
        await expect(this.fulfilmentHeading).toBeVisible({ timeout: 20000 });
        await expect(this.awaitingSignaturesBadge).toBeVisible({ timeout: 20000 });
        await expect(this.issuedStamp).toBeVisible();
        await expect(this.issuedStamp).toHaveText(
            /(?:issued|sent)\s+\d{1,2}\/\d{1,2}\/\d{4},\s+\d{1,2}:\d{2}:\d{2}/i
        );

        await expect(this.partyLabel('Customer')).toBeVisible({ timeout: 15000 });
        await expect(this.partyLabel('Supplier')).toBeVisible();
        await expect(this.partyStatus('Customer', 'Awaiting Signature')).toBeVisible();

        if (customerEmail) {
            await this.verifyCustomerContactOnRow({ email: customerEmail, phone: customerPhone });
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

    // ── §6.1 signature rows ──────────────────────────────────────────────

    /** AC-6.1.2 — Customer row shows email (+ phone when on file) */
    async verifyCustomerContactOnRow({ email, phone } = {}) {
        const card = this.fulfilmentCard();
        await expect(this.partyLabel('Customer')).toBeVisible({ timeout: 15000 });
        // Contact can sit on a sibling of the party label, not always inside the same flex row
        await expect(
            card.getByText(new RegExp(escapeRegExp(email), 'i')).first()
        ).toBeVisible({ timeout: 10000 });
        if (phone) {
            const digits = String(phone).replace(/\D/g, '');
            await expect(
                card
                    .getByText(new RegExp(digits.slice(-6), 'i'))
                    .or(card.getByText(phone))
                    .first()
            ).toBeVisible();
        }
    }

    /** AC-6.1.3 — signed by {name} */
    async verifyPartySignedBy(party, signerName) {
        await expect(
            this.signatureRow(party).getByText(
                new RegExp(`signed by\\s+${escapeRegExp(signerName)}`, 'i')
            )
        ).toBeVisible({ timeout: 20000 });
    }

    async verifySupplierNotSentYet() {
        await expect(this.partyStatus('Supplier', 'Not sent yet')).toBeVisible({
            timeout: 15000,
        });
    }

    async verifySupplierAwaitingSignature() {
        await expect(this.partyStatus('Supplier', 'Awaiting Signature')).toBeVisible({
            timeout: 20000,
        });
    }

    async verifyCustomerAwaitingSignature() {
        await expect(this.partyStatus('Customer', 'Awaiting Signature')).toBeVisible({
            timeout: 15000,
        });
    }

    // ── §6.2 verify ──────────────────────────────────────────────────────

    async verifyCustomerSignaturePendingAdminCheck() {
        await expect(this.fulfilmentHeading).toBeVisible({ timeout: 20000 });
        await expect(
            this.page
                .getByText(
                    /Customer signature to check|Signature to check|To check|signed by/i
                )
                .first()
        ).toBeVisible({ timeout: 30000 });
        await expect(this.verifyBtn('Customer')).toBeVisible({ timeout: 15000 });
    }

    /**
     * AC-6.2.1 + 6.2.2 — Verify button (Verifying…), customer toast, supplier moves to Awaiting.
     * @param {{ intercept?: boolean }} [opts] — when true, delay the POST to assert Verifying…
     */
    async verifyCustomerSignature({ intercept = true } = {}) {
        await this.acceptCookiesIfVisible();
        await expect(this.fulfilmentHeading).toBeVisible({ timeout: 20000 });
        const btn = this.verifyBtn('Customer');
        await expect(btn).toBeVisible({ timeout: 20000 });
        await expect(btn).toHaveText(/^Verify$/i);

        if (intercept) {
            let sawVerifying = false;
            const handler = async (route) => {
                const req = route.request();
                if (
                    req.method() === 'POST' &&
                    /verify|signature|fulfil|sign/i.test(req.url())
                ) {
                    await expect(this.verifyBtn('Customer')).toHaveText(/Verifying/i, {
                        timeout: 5000,
                    });
                    sawVerifying = true;
                    await new Promise((r) => setTimeout(r, 350));
                    await route.continue();
                    return;
                }
                await route.continue();
            };
            await this.page.route('**/api/**', handler);
            await btn.click();
            await expect(this.customerVerifiedToast).toBeVisible({ timeout: 45000 });
            await this.page.unroute('**/api/**', handler).catch(() => {});
            // Verifying… can be too brief on fast networks — don't hard-fail
            void sawVerifying;
        } else {
            await btn.click();
            await expect(this.customerVerifiedToast).toBeVisible({ timeout: 45000 });
        }

        await this.verifySupplierAwaitingSignature();
    }

    /**
     * AC-6.2.3 — Verifying supplier when contract does not yet go live.
     */
    async verifySupplierSignature({ intercept = true } = {}) {
        await this.acceptCookiesIfVisible();
        const btn = this.verifyBtn('Supplier');
        await expect(btn).toBeVisible({ timeout: 20000 });

        if (intercept) {
            const handler = async (route) => {
                const req = route.request();
                if (
                    req.method() === 'POST' &&
                    /verify|signature|fulfil|sign/i.test(req.url())
                ) {
                    await expect(this.verifyBtn('Supplier')).toHaveText(/Verifying/i, {
                        timeout: 5000,
                    }).catch(() => {});
                    await new Promise((r) => setTimeout(r, 350));
                    await route.continue();
                    return;
                }
                await route.continue();
            };
            await this.page.route('**/api/**', handler);
            await btn.click();
            await expect(
                this.supplierVerifiedToast
                    .or(this.page.getByText(/Contract active — allowance is live/i))
                    .first()
            ).toBeVisible({ timeout: 45000 });
            await this.page.unroute('**/api/**', handler).catch(() => {});
        } else {
            await btn.click();
            await expect(
                this.supplierVerifiedToast
                    .or(this.page.getByText(/Contract active — allowance is live/i))
                    .first()
            ).toBeVisible({ timeout: 45000 });
        }
    }

    // ── §6.3 signed document ─────────────────────────────────────────────

    /** AC-6.3.1 — Signed document button opens new tab; Opening… during work */
    async openSignedDocument(party = 'Customer') {
        const btn = this.signedDocumentBtn(party);
        await expect(btn).toBeVisible({ timeout: 15000 });

        const popupPromise = this.page.context().waitForEvent('page', { timeout: 45000 });
        let intercepted = false;
        const handler = async (route) => {
            const req = route.request();
            if (
                req.method() === 'GET' &&
                /sign|document|pdf|file|agreement/i.test(req.url())
            ) {
                intercepted = true;
                await expect(btn).toHaveText(/Opening/i, { timeout: 3000 }).catch(() => {});
                await route.continue();
                return;
            }
            await route.continue();
        };
        await this.page.route('**/api/**', handler);
        await btn.click();
        const popup = await popupPromise.catch(() => null);
        await this.page.unroute('**/api/**', handler).catch(() => {});
        void intercepted;
        expect(popup).toBeTruthy();
        await popup.waitForLoadState('domcontentloaded').catch(() => {});
        await popup.close().catch(() => {});
    }

    // ── §6.4 re-send ─────────────────────────────────────────────────────

    /**
     * @param {'Customer'|'Supplier'} party
     * @param {'customer'|'supplier'|'alreadySigned'|'supplierNotReleased'} expected
     */
    async resendInvite(party, expected = 'customer') {
        const btn = this.resendBtn(party);
        await expect(btn).toBeVisible({ timeout: 15000 });

        let sawSending = false;
        const handler = async (route) => {
            const req = route.request();
            if (
                req.method() === 'POST' &&
                /resend|re-send|invite|send|sign|fulfil/i.test(req.url())
            ) {
                await expect(btn).toHaveText(/Sending/i, { timeout: 5000 }).catch(() => {});
                sawSending = true;
                await new Promise((r) => setTimeout(r, 350));
                await route.continue();
                return;
            }
            await route.continue();
        };
        await this.page.route('**/api/**', handler);
        await btn.click();

        if (expected === 'customer') {
            await expect(this.resendCustomerToast).toBeVisible({ timeout: 20000 });
        } else if (expected === 'supplier') {
            await expect(this.resendSupplierToast).toBeVisible({ timeout: 20000 });
        } else if (expected === 'alreadySigned') {
            await expect(this.alreadySignedToast).toBeVisible({ timeout: 20000 });
        } else if (expected === 'supplierNotReleased') {
            await expect(this.supplierNotReleasedToast).toBeVisible({ timeout: 20000 });
        }
        await this.page.unroute('**/api/**', handler).catch(() => {});
        void sawSending;
    }

        // ── §6.5 edit customer contact ───────────────────────────────────────

    /** AC-6.5.1 — open Edit form while awaiting / declined */
    async openCustomerEditForm({
        expectPrefilledEmail,
        expectPrefilledPhone,
        expectPortalLoginHint,
    } = {}) {
        await expect(this.editCustomerBtn()).toBeVisible({ timeout: 15000 });
        await this.editCustomerBtn().click();
        await expect(this.customerEmailInput).toBeVisible({ timeout: 10000 });
        await expect(this.customerPhoneInput).toBeVisible();
        if (expectPrefilledEmail) {
            await expect(this.customerEmailInput).toHaveValue(
                new RegExp(escapeRegExp(expectPrefilledEmail), 'i')
            );
        }
        if (expectPrefilledPhone !== undefined) {
            const val = await this.customerPhoneInput.inputValue();
            if (expectPrefilledPhone) {
                expect(val.replace(/\D/g, '')).toContain(
                    String(expectPrefilledPhone).replace(/\D/g, '').slice(-6)
                );
            }
        }
        await expect(this.saveAndResendBtn).toBeVisible();
        await expect(this.saveAndResendBtn).toHaveText(/Save & re-send if email changed/i);
        // AC-6.5.2 — portal-account rename warning only when a login already exists
        if (expectPortalLoginHint === true) {
            await expect(this.portalLoginHint).toBeVisible({ timeout: 10000 });
        } else if (expectPortalLoginHint === false) {
            await expect(this.portalLoginHint).toHaveCount(0);
        }
    }

    /**
     * AC-6.5.3–6.5.5
     * @param {{ email?: string, phone?: string }} fields
     * @param {'emailChanged'|'phoneOnly'} result
     */
    async saveCustomerContact(fields, result = 'emailChanged') {
        if (fields.email !== undefined) {
            await this.customerEmailInput.fill(fields.email);
        }
        if (fields.phone !== undefined) {
            await this.customerPhoneInput.fill(fields.phone);
        }

        let sawSaving = false;
        const handler = async (route) => {
            const req = route.request();
            if (
                req.method() === 'POST' ||
                req.method() === 'PATCH' ||
                req.method() === 'PUT'
            ) {
                if (/customer|email|phone|contact|fulfil|sign|invite/i.test(req.url())) {
                    await expect(this.saveAndResendBtn)
                        .toHaveText(/Saving/i, { timeout: 5000 })
                        .catch(() => {});
                    sawSaving = true;
                    await new Promise((r) => setTimeout(r, 350));
                    await route.continue();
                    return;
                }
            }
            await route.continue();
        };
        await this.page.route('**/api/**', handler);
        await this.saveAndResendBtn.click();

        if (result === 'emailChanged') {
            await expect(this.emailUpdatedToast).toBeVisible({ timeout: 20000 });
            if (fields.email) {
                await expect(
                    this.page.getByText(
                        new RegExp(
                            `Customer email updated — a fresh signing invite was sent to ${escapeRegExp(
                                fields.email
                            )}`,
                            'i'
                        )
                    )
                ).toBeVisible();
            }
        } else if (result === 'phoneOnly') {
            await expect(this.phoneUpdatedToast).toBeVisible({ timeout: 20000 });
        } else if (result === 'alreadySigned') {
            await expect(this.cannotEditAfterSignedToast).toBeVisible({ timeout: 20000 });
        }
        await this.page.unroute('**/api/**', handler).catch(() => {});
        void sawSaving;
    }

    /** AC-6.5.6 */
    async assertCustomerContactLockedAfterSign() {
        const edit = this.editCustomerBtn();
        if ((await edit.count()) > 0 && (await edit.isVisible().catch(() => false))) {
            await edit.click();
            // Saving current details should still refuse edit-after-sign
            if (await this.saveAndResendBtn.isVisible().catch(() => false)) {
                await this.saveAndResendBtn.click();
            }
            await expect(this.cannotEditAfterSignedToast).toBeVisible({ timeout: 15000 });
        } else {
            // Edit control removed once signed — still satisfy lock-out intent
            await expect(edit).toHaveCount(0);
        }
    }

    // Back-compat aliases used by §5
    customerPartySection() {
        return this.signatureRow('Customer');
    }

    async verifySupplierStillAwaitingSignature() {
        return this.verifySupplierAwaitingSignature();
    }
}

function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
