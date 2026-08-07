import { expect } from 'allure-playwright';
import { ensureCookieConsentDismissed } from '../../utils/cookieConsent.js';

/**
 * Public supplier supply-agreement signing page.
 * Phase 2 §5 — no identity check, no payment; sign-only review page.
 *
 * @typedef {import('@playwright/test').Page} Page
 */

export class SupplierContractSigningPage {
    /** @param {Page} page */
    constructor(page) {
        this.page = page;
        this.heading = page.getByRole('heading', {
            name: 'We Want Waste supply agreement',
            exact: true,
        });
        this.reviewAndSignHeading = page.getByRole('heading', {
            name: /Review and sign/i,
        });
        this.agreementDetailsHeading = page.getByText('Agreement Details', { exact: true });
        this.deliveriesRatesHeading = page.getByText(/Deliveries\s*&\s*Rates/i);
        this.signerNameInput = page.getByPlaceholder('Full name of signer');
        this.signAgreementBtn = page.getByRole('button', {
            name: /^(Sign agreement|Submitting…)$/,
        });
        this.signHereBtn = page.getByRole('button', { name: 'Sign here' });
        this.uploadDocumentBtn = page.getByRole('button', { name: 'Upload document' });
        this.drawTab = page.getByRole('button', { name: 'Draw', exact: true });
        this.typeSignatureTab = page.getByRole('button', { name: 'Type', exact: true });
        this.typedSignatureInput = page.getByPlaceholder('e.g. John Smith');

        this.allDoneHeading = page.getByText("You're all done", { exact: true });
        this.signedAwaitingConfirmation = page.getByText(
            /Signed — awaiting We Want Waste confirmation/i
        );
        this.willBeInTouch = page.getByText(
            /We will be in touch once the contract is countersigned and live/i
        );
        this.viewSignedDocumentLink = page
            .getByRole('link', { name: /View your signed document/i })
            .or(page.getByRole('button', { name: /View your signed document/i }))
            .or(page.getByText(/View your signed document/i));
        this.passwordFields = page.locator('input[type="password"]');
    }

    async acceptCookiesIfVisible() {
        await ensureCookieConsentDismissed(this.page);
        const acceptAll = this.page.getByRole('button', { name: 'Accept All' });
        if (await acceptAll.isVisible().catch(() => false)) {
            await acceptAll.click().catch(() => {});
            await this.page
                .locator('.cky-consent-container')
                .waitFor({ state: 'hidden', timeout: 3000 })
                .catch(() => {});
        }
    }

    /**
     * AC-5.3 — heading + "{term}-month supply agreement for {supplier} — area {area}"
     * @param {{ termMonths: string|number, supplierName: string, area: string }} expected
     */
    async verifySupplierHeading({ termMonths, supplierName, area }) {
        await this.acceptCookiesIfVisible();
        await expect(this.page).toHaveURL(/\/(contract-signing|supplier-sign|supply)/i, {
            timeout: 45000,
        });
        await expect(this.heading).toBeVisible({ timeout: 30000 });
        await expect(
            this.page.getByText(
                new RegExp(
                    `^${escapeRegExp(String(termMonths))}-month supply agreement for ${escapeRegExp(
                        supplierName
                    )}\\s*—\\s*area\\s*${escapeRegExp(area)}$`,
                    'i'
                )
            )
        ).toBeVisible();
    }

    /**
     * AC-5.4 — Review and sign + Agreement Details (supplier, area, term)
     * @param {{ supplierName: string, area: string, termMonths: string|number }} expected
     */
    async verifyAgreementDetails({ supplierName, area, termMonths }) {
        await this.acceptCookiesIfVisible();
        await expect(this.reviewAndSignHeading).toBeVisible({ timeout: 20000 });
        await expect(this.agreementDetailsHeading).toBeVisible();

        const details = this.page
            .locator('div, section')
            .filter({ has: this.agreementDetailsHeading })
            .first();
        await expect(details.getByText(new RegExp(escapeRegExp(supplierName), 'i')).first()).toBeVisible();
        await expect(details.getByText(new RegExp(escapeRegExp(area), 'i')).first()).toBeVisible();
        await expect(
            details
                .getByText(new RegExp(`${escapeRegExp(String(termMonths))}\\s*mo(nths?)?`, 'i'))
                .first()
        ).toBeVisible();
    }

    /** AC-5.5 — Deliveries & Rates lists each line with WWW→supplier rate */
    async verifyDeliveriesAndRates() {
        await expect(this.deliveriesRatesHeading).toBeVisible({ timeout: 15000 });
        await expect(this.page.getByText(/\d+\s*×\s*\d+yd/i).first()).toBeVisible();
        // Rates WWW pays supplier — £ figures next to lines
        await expect(
            this.page
                .locator('div, section')
                .filter({ has: this.deliveriesRatesHeading })
                .getByText(/£\d/)
                .first()
        ).toBeVisible();
    }

    /** AC-5.6 — no Stripe identity step and no payment/card Step 3 */
    async verifyNoIdentityOrPaymentSteps() {
        await this.acceptCookiesIfVisible();
        await expect(
            this.page.getByRole('heading', { name: /Verify your identity/i })
        ).toHaveCount(0);
        await expect(
            this.page.getByRole('button', { name: /Verify identity with Stripe/i })
        ).toHaveCount(0);
        await expect(
            this.page.getByRole('heading', { name: /Step 3 — (Upfront payment|Save a payment card)/i })
        ).toHaveCount(0);
        await expect(this.page.getByRole('button', { name: /^Pay £/i })).toHaveCount(0);
        await expect(
            this.page.getByRole('button', { name: /Save card for contract deliveries/i })
        ).toHaveCount(0);
    }

    /** AC-5.7 — same Sign here / Upload document / Sign agreement surface as customer */
    async verifySignatureControls() {
        await expect(this.signHereBtn).toBeVisible();
        await expect(this.uploadDocumentBtn).toBeVisible();
        await expect(this.page.getByText('Person signing the agreement')).toBeVisible();
        await expect(this.signerNameInput).toBeVisible();
        await expect(this.signAgreementBtn).toBeVisible();

        await this.signHereBtn.click();
        await expect(this.drawTab).toBeVisible();
        await expect(this.typeSignatureTab).toBeVisible();
        await this.typeSignatureTab.click();
        for (const font of ['Script', 'Elegant', 'Casual']) {
            await expect(this.page.getByRole('button', { name: font, exact: true })).toBeVisible();
        }
        await this.uploadDocumentBtn.click();
        await expect(
            this.page.getByText(/Upload the signed document \(JPEG, PNG or PDF, max 10MB\)/i)
        ).toBeVisible();
    }

    async typeSignature(name = 'QA Supplier Signer') {
        await this.signHereBtn.click();
        await this.typeSignatureTab.click();
        await this.typedSignatureInput.fill(name);
    }

    /**
     * AC-5.8 — sign and land on success (no password capture)
     */
    async signAgreementAndVerifyDone(signerName = 'QA Supplier Signer') {
        await this.signerNameInput.fill(signerName);
        await this.typeSignature(signerName);
        await expect(this.signAgreementBtn).toBeEnabled({ timeout: 10000 });
        await this.signAgreementBtn.click();

        await expect(this.allDoneHeading).toBeVisible({ timeout: 45000 });
        await expect(this.signedAwaitingConfirmation).toBeVisible();
        await expect(this.willBeInTouch).toBeVisible();
        await expect(this.viewSignedDocumentLink).toBeVisible();
        await expect(this.passwordFields).toHaveCount(0);
    }
}

function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
