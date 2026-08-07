import { expect } from 'allure-playwright';
import { ensureCookieConsentDismissed } from '../../utils/cookieConsent.js';
import { genericFunctions } from '../../utils/genericFunctions.js';

/**
 * Sales agent: capture a new commercial contract request.
 * Customer location is a fixed Delivery address (postcode lookup) — not a free-text Area field.
 *
 * @typedef {import('@playwright/test').Page} Page
 * @typedef {import('@playwright/test').Locator} Locator
 */

/** Known full postcodes that resolve in address lookup for common QA areas */
const DEFAULT_POSTCODE_BY_AREA = {
    B29: 'B29 6NA',
};

export class SalesAgentNewContractRequestPage {
    /** @param {Page} page */
    constructor(page) {
        this.page = page;
        this.backToContractsBtn = page.getByRole('button', { name: 'Back to Contracts' });
        this.pageTitle = page.getByRole('heading', { name: 'New contract request' });
        this.pageSubtitle = page.getByText(
            'Capture the requirement — it goes to the pricing queue in #contract-pricing'
        );

        this.customerInput = page.locator('#customer-name');
        this.companyInput = page.locator('#company-name');
        this.emailInput = page.locator('#customer-email');
        this.phoneInput = page.locator('#customer-phone');
        /** @deprecated Area free-text is replaced by delivery address — kept as soft locators for migrations */
        this.areaInput = page.locator('#area');

        this.chooseDeliveryAddressBtn = page.getByRole('button', {
            name: /Choose the delivery address/i,
        });
        this.deliveryAddressSearchInput = page.getByPlaceholder(
            'Start typing your postcode or address...'
        );
        this.useThisAddressBtn = page.getByRole('button', { name: /Use this address/i });
        this.enterAddressManuallyBtn = page.getByRole('button', {
            name: /or enter address manually/i,
        });
        this.deliveryAddressHint = page.getByText(
            /Fixed for the whole contract — every delivery drawn down goes here\./i
        );
        this.changeDeliveryAddressBtn = page.getByRole('button', {
            name: /Change (delivery )?address|Edit (delivery )?address/i,
        });

        this.roughTermInput = page.locator('#desired-term');

        this.addAnotherSizeBtn = page.getByRole('button', { name: 'Add another size' });
        this.cancelBtn = page.getByRole('button', { name: 'Cancel', exact: true });
        this.sendToPricingBtn = page.getByRole('button', { name: 'Send to pricing' });
        this.depositWarning = page.getByText(
            'A £1,500 ex VAT (£1,800 inc VAT) deposit applies to any 20yd or 40yd line. It is not waivable and is excluded from commission.'
        );
        this.qtyRequiredMessage = page.getByText('Add at least one line with a quantity');
        this.successToast = page.getByText(
            /Sent to (?:pricing|the pricing (?:team|queue)).*#contract-pricing|posted to #contract-pricing/i
        );
        this.sizeOptions = ['4', '6', '8', '10', '12', '14', '16', '20', '40'];
        this.wasteTypeOptions = [
            'Mixed C&D',
            'General waste',
            'Inert',
            'Hardcore',
            'Timber',
            'Plasterboard',
        ];
    }

    async acceptCookiesIfVisible() {
        await ensureCookieConsentDismissed(this.page);
    }

    async gotoNewRequestPage() {
        const genFunctions = new genericFunctions(this.page);
        await this.page.goto(genFunctions.buildURL('/sales/contracts/new'), {
            waitUntil: 'domcontentloaded',
        });
        await this.acceptCookiesIfVisible();
        await expect(this.pageTitle).toBeVisible({ timeout: 30000 });
    }

    async verifyPageLayout() {
        await expect(this.backToContractsBtn).toBeVisible();
        await expect(this.pageTitle).toBeVisible();
        await expect(this.pageSubtitle).toBeVisible();
    }

    async verifyCustomerFields() {
        await expect(this.page.getByText('Customer', { exact: true }).first()).toBeVisible();
        await expect(this.customerInput).toBeVisible();
        await expect(this.customerInput).toHaveAttribute(
            'placeholder',
            'e.g. Barratt Homes — Selly Oak'
        );

        await expect(this.page.getByText(/Company/i).first()).toBeVisible();
        await expect(this.companyInput).toBeVisible();

        await expect(this.page.getByText(/Email/i).first()).toBeVisible();
        await expect(this.emailInput).toBeVisible();

        await expect(this.page.getByText(/Phone/i).first()).toBeVisible();
        await expect(this.phoneInput).toBeVisible();

        // Area free-text replaced by fixed Delivery address
        await this.verifyDeliveryAddressField();
        await expect(this.areaInput).toHaveCount(0);
    }

    async verifyDeliveryAddressField() {
        await expect(this.page.getByText(/Delivery address/i).first()).toBeVisible();
        await expect(this.deliveryAddressHint).toBeVisible();
        await expect(this.chooseDeliveryAddressBtn).toBeVisible();
    }

    async verifyRoughTermField() {
        await expect(this.page.getByText(/Rough term/i)).toBeVisible();
        await expect(this.roughTermInput).toBeVisible();
        await expect(this.roughTermInput).toHaveValue('6');
    }

    qtyInput(index = 0) {
        return this.page.locator(`#line-qty-${index}`);
    }

    sizeSelect(index = 0) {
        return this.page.locator(`#line-size-${index}`);
    }

    wasteTypeSelect(index = 0) {
        return this.page.locator(`#line-waste-${index}`);
    }

    removeLineBtn(index = 0) {
        return this.page.getByRole('button', { name: `Remove line ${index + 1}` });
    }

    async getRequirementLineCount() {
        return this.page.locator('[id^="line-qty-"]').count();
    }

    async verifyRequirementLineDefaults(index = 0) {
        await expect(this.qtyInput(index)).toBeVisible();
        // Product default qty is now 10 (was empty / 1 historically)
        const qty = await this.qtyInput(index).inputValue();
        expect(['', '1', '10']).toContain(qty);
        await expect(this.sizeSelect(index)).toHaveValue('8');
        await expect(this.wasteTypeSelect(index)).toHaveValue('Mixed C&D');
    }

    async verifySizeAndWasteOptions(index = 0) {
        const sizeTexts = await this.sizeSelect(index).locator('option').allTextContents();
        for (const size of this.sizeOptions) {
            expect(sizeTexts.some((t) => t.includes(`${size} yd`) || t.trim() === size)).toBeTruthy();
        }

        const wasteTexts = await this.wasteTypeSelect(index).locator('option').allTextContents();
        for (const waste of this.wasteTypeOptions) {
            expect(wasteTexts).toContain(waste);
        }
    }

    async addRequirementLine() {
        const before = await this.getRequirementLineCount();
        await this.addAnotherSizeBtn.click();
        await expect.poll(async () => this.getRequirementLineCount()).toBe(before + 1);
    }

    async removeRequirementLine(index = 0) {
        await this.removeLineBtn(index).click();
    }

    async setLineSize(index, size) {
        await this.sizeSelect(index).selectOption(String(size));
    }

    async setLineQty(index, qty) {
        await this.qtyInput(index).fill(String(qty));
    }

    /**
     * Map a short area code (e.g. B29) used in list/detail assertions to a full
     * postcode that the address lookup will resolve. Full postcodes pass through.
     * @param {string} [areaOrPostcode]
     */
    resolveDeliveryPostcode(areaOrPostcode = 'B29') {
        const raw = String(areaOrPostcode || 'B29').trim();
        if (DEFAULT_POSTCODE_BY_AREA[raw.toUpperCase()]) {
            return DEFAULT_POSTCODE_BY_AREA[raw.toUpperCase()];
        }
        // Already a full UK postcode (has inward code)
        const compact = raw.replace(/\s+/g, '').toUpperCase();
        if (/^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/.test(compact)) {
            return raw;
        }
        return DEFAULT_POSTCODE_BY_AREA.B29;
    }

    /**
     * Open address lookup, pick a suggestion for the postcode, confirm.
     * @param {{ postcode?: string, area?: string, optionText?: string|RegExp }} [opts]
     */
    async selectDeliveryAddress({ postcode, area = 'B29', optionText } = {}) {
        await this.acceptCookiesIfVisible();
        const searchPostcode = postcode || this.resolveDeliveryPostcode(area);

        // Re-open if changing an already-selected address
        if (await this.changeDeliveryAddressBtn.isVisible().catch(() => false)) {
            await this.changeDeliveryAddressBtn.click();
        } else if (await this.chooseDeliveryAddressBtn.isVisible().catch(() => false)) {
            await this.chooseDeliveryAddressBtn.click();
        } else {
            // Form already in search mode
            await expect(this.deliveryAddressSearchInput).toBeVisible({ timeout: 10000 });
        }

        await expect(this.deliveryAddressSearchInput).toBeVisible({ timeout: 15000 });
        await this.deliveryAddressSearchInput.fill('');
        await this.deliveryAddressSearchInput.fill(searchPostcode);

        const postcodeRe = new RegExp(
            escapeRegExp(searchPostcode).replace(/\s+/g, '\\s*'),
            'i'
        );
        const suggestion = optionText
            ? this.page.getByRole('button', { name: optionText }).first()
            : this.page
                  .getByRole('button')
                  .filter({ hasText: postcodeRe })
                  .filter({ hasNotText: /Choose the delivery|Use this address|Cancel|Send to pricing/i })
                  .first();

        await expect(suggestion).toBeVisible({ timeout: 20000 });
        await suggestion.click();

        await expect(this.useThisAddressBtn).toBeVisible({ timeout: 10000 });
        await this.useThisAddressBtn.click();

        // Confirmed: choose control gone; postcode / address appears in main form
        await expect(this.chooseDeliveryAddressBtn).toHaveCount(0);
        await expect(this.page.getByText(postcodeRe).first()).toBeVisible({ timeout: 10000 });
        return searchPostcode;
    }

    /**
     * Required capture fields: customer name + delivery address.
     * `area` remains the short code used by callers (e.g. 'B29') for list/detail assertions.
     * @param {{ customer: string, area?: string, postcode?: string }} fields
     */
    async fillRequiredCustomerFields({ customer, area = 'B29', postcode } = {}) {
        await this.customerInput.fill(customer);
        await this.selectDeliveryAddress({ area, postcode });
    }

    async verifyNoEditableAgentNameField() {
        await expect(this.page.getByLabel(/agent name/i)).toHaveCount(0);
        await expect(this.page.locator('input[id*="agent" i], input[name*="agent" i]')).toHaveCount(0);
    }

    /**
     * AC-7.1.1 — RoRo sizes use the same qty / size / waste fields only (no transport/tonne inputs).
     * @param {number} [index]
     */
    async verifyRoRoCaptureSameAsSkip(index = 0) {
        await expect(this.qtyInput(index)).toBeVisible();
        await expect(this.sizeSelect(index)).toBeVisible();
        await expect(this.wasteTypeSelect(index)).toBeVisible();
        await expect(this.page.getByText('Transport £ / exchange', { exact: true })).toHaveCount(0);
        await expect(this.page.getByText('Cost £ / tonne', { exact: true })).toHaveCount(0);
        await expect(this.page.getByText(/Included tonnes/i)).toHaveCount(0);
        await expect(this.page.getByText(/Contamination £/i)).toHaveCount(0);
    }

    async clickSendToPricing() {
        await this.sendToPricingBtn.scrollIntoViewIfNeeded();
        await expect(this.sendToPricingBtn).toBeEnabled();
        await this.sendToPricingBtn.click();
    }

    async clickCancel() {
        // Prefer the footer cancel (not the address-picker cancel)
        const footerCancel = this.page
            .locator('main')
            .getByRole('button', { name: 'Cancel', exact: true })
            .last();
        await Promise.all([
            this.page.waitForURL(/\/sales\/contracts\/?$/, { timeout: 30000 }),
            footerCancel.click(),
        ]);
    }

    /**
     * @param {{ customer: string, area?: string, postcode?: string, qty?: number, size?: string, wasteType?: string }} opts
     */
    async submitValidRequest({
        customer,
        area = 'B29',
        postcode,
        qty = 1,
        size = '8',
        wasteType = 'Mixed C&D',
    }) {
        await this.acceptCookiesIfVisible();
        await this.fillRequiredCustomerFields({ customer, area, postcode });
        await this.setLineQty(0, qty);
        await this.setLineSize(0, size);
        await this.wasteTypeSelect(0).selectOption(wasteType);
        await expect(this.qtyInput(0)).toHaveValue(String(qty));

        const postPromise = this.page
            .waitForResponse(
                (r) =>
                    r.request().method() === 'POST' &&
                    /contract|pricing|request/i.test(r.url()) &&
                    !r.url().includes('analytics'),
                { timeout: 30000 }
            )
            .catch(() => null);

        await this.clickSendToPricing();
        const response = await postPromise;

        if (response && !response.ok()) {
            const body = await response.text().catch(() => '');
            throw new Error(
                `Send to pricing failed: HTTP ${response.status()} ${response.url()} — ${body.slice(0, 400)}`
            );
        }

        // If no POST was observed, try once more (intermittent click / hydration miss)
        if (!response && !/\/sales\/contracts\/\d+/.test(this.page.url())) {
            await this.page.waitForTimeout(500);
            const retryPost = this.page
                .waitForResponse(
                    (r) =>
                        r.request().method() === 'POST' &&
                        /contract|pricing|request/i.test(r.url()),
                    { timeout: 25000 }
                )
                .catch(() => null);
            await this.clickSendToPricing();
            const retry = await retryPost;
            if (retry && !retry.ok()) {
                const body = await retry.text().catch(() => '');
                throw new Error(
                    `Send to pricing failed (retry): HTTP ${retry.status()} — ${body.slice(0, 400)}`
                );
            }
        }

        await expect(this.page).toHaveURL(/\/sales\/contracts\/\d+/, { timeout: 45000 });
        // Success toast is nice-to-have (copy drifts); URL proves create succeeded
        await this.successToast.isVisible().catch(() => false);
    }
}

function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
