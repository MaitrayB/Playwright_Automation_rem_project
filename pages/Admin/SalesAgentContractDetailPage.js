import { expect } from 'allure-playwright';
import { ensureCookieConsentDismissed } from '../../utils/cookieConsent.js';

/**
 * @typedef {import('@playwright/test').Page} Page
 * @typedef {import('@playwright/test').Locator} Locator
 */

export class SalesAgentContractDetailPage {
    /** @param {Page} page */
    constructor(page) {
        this.page = page;
        this.backToContractsBtn = page.getByRole('button', { name: 'Back to Contracts' });
        this.awaitingPricingMessage = page.getByText(
            /Sent to the pricing team — Slack posted to #contract-pricing\. Terms and prices appear here once pricing is locked/
        );
        this.quoteCalculatorHeading = page.getByRole('heading', { name: 'Quote calculator' });
        this.termHint = page.getByText("These are the only terms available — a longer term isn't offered.");
        this.upfrontHint = page.getByText('More upfront earns the customer a better price.');
        this.contractValueLabel = page.getByText('Contract value — quote to customer');
        this.closeDealBtn = page.getByRole('button', { name: 'Close deal' });
        this.closeModalTitle = page.getByRole('heading', { name: 'Close contract' });
        this.closeModalCancelBtn = page.getByRole('button', { name: 'Cancel', exact: true });
        this.closeModalConfirmBtn = page.getByRole('button', { name: 'Close contract', exact: true });
        this.closedPhase2Note = page.getByText(
            'Next: contract signatures are handled in Phase 2 — nothing more to do here.'
        );
        this.depositWarning = page.getByText(
            'A £1,500 ex VAT (£1,800 inc VAT) deposit applies to any 20yd or 40yd line. It is not waivable and is excluded from commission.'
        );
        this.upfrontOptions = ['Drawdown', '25% upfront', '50% upfront', 'Full upfront'];
    }

    async acceptCookiesIfVisible() {
        await ensureCookieConsentDismissed(this.page);
    }

    supplierSubtitle(supplierName) {
        return this.page.getByText(new RegExp(`^Supplier:\\s*${escapeRegExp(supplierName)}`, 'i'));
    }

    termButton(label) {
        return this.page.getByRole('button', { name: label, exact: true });
    }

    upfrontButton(label) {
        return this.page.getByRole('button', { name: label, exact: true });
    }

    quoteTable() {
        return this.page.locator('main table').filter({
            has: this.page.locator('th', { hasText: 'Customer price' }),
        });
    }

    contractValueCard() {
        return this.contractValueLabel.locator('xpath=ancestor::*[self::div or self::section][1]');
    }

    async verifyAwaitingPricingState() {
        await this.acceptCookiesIfVisible();
        await expect(this.page).toHaveURL(/\/sales\/contracts\/\d+/, { timeout: 30000 });
        await expect(this.awaitingPricingMessage).toBeVisible({ timeout: 15000 });
        await expect(this.page.getByText('Awaiting pricing').first()).toBeVisible();

        // AC-6.1.2 — no calculator / pricing controls
        await expect(this.quoteCalculatorHeading).toHaveCount(0);
        await expect(this.page.getByText('Term', { exact: true })).toHaveCount(0);
        await expect(this.page.getByText('Upfront', { exact: true })).toHaveCount(0);
        await expect(this.closeDealBtn).toHaveCount(0);
        await expect(this.page.getByText(/Base margin|Margin floor|Supplier costs|worst-combination/i)).toHaveCount(0);
    }

    async verifyQuoteCalculatorLayout({ supplierName } = {}) {
        await expect(this.quoteCalculatorHeading).toBeVisible({ timeout: 20000 });
        if (supplierName) {
            const name = String(supplierName).replace(/\s*\(#\d+\)\s*$/, '').trim();
            await expect(this.supplierSubtitle(name)).toBeVisible();
        } else {
            await expect(this.page.getByText(/^Supplier:/i)).toBeVisible();
        }

        await expect(this.page.getByText('Term', { exact: true }).first()).toBeVisible();
        await expect(this.termHint).toBeVisible();
        await expect(this.page.getByText('Upfront', { exact: true }).first()).toBeVisible();
        await expect(this.upfrontHint).toBeVisible();

        for (const option of this.upfrontOptions) {
            await expect(this.upfrontButton(option)).toBeVisible();
        }
        expect(await this.isPickerSelected(this.upfrontButton('Drawdown'))).toBeTruthy();
    }

    async isPickerSelected(button) {
        const className = (await button.getAttribute('class')) || '';
        // Selected term/upfront chips use white fill + semibold (inactive are dark/outline)
        return className.includes('bg-white') && className.includes('font-semibold');
    }

    async getVisibleTermLabels() {
        const labels = [];
        for (const months of [1, 3, 6, 12, 18, 24]) {
            const label = `${months} mo`;
            if (await this.termButton(label).isVisible().catch(() => false)) {
                labels.push(label);
            }
        }
        return labels;
    }

    async verifyTermPickerDefaults() {
        const terms = await this.getVisibleTermLabels();
        expect(terms.length).toBeGreaterThan(0);
        // First available term selected by default
        expect(await this.isPickerSelected(this.termButton(terms[0]))).toBeTruthy();
        return terms;
    }

    async waitForQuoteUpdate() {
        const responsePromise = this.page
            .waitForResponse(
                (res) =>
                    /\/api\/contract-requests\/\d+\/quote/.test(res.url()) &&
                    res.request().method() === 'GET' &&
                    res.ok(),
                { timeout: 15000 }
            )
            .catch(() => null);

        // If no network fire, still wait for table + value to be present
        await responsePromise;
        await expect(this.quoteTable().locator('tbody tr').first()).toBeVisible({ timeout: 15000 });
        await expect(this.contractValueLabel).toBeVisible({ timeout: 15000 });
    }

    async selectTerm(label) {
        const [response] = await Promise.all([
            this.page
                .waitForResponse(
                    (res) =>
                        /\/api\/contract-requests\/\d+\/quote/.test(res.url()) &&
                        res.request().method() === 'GET',
                    { timeout: 15000 }
                )
                .catch(() => null),
            this.termButton(label).click(),
        ]);
        void response;
        await expect(this.quoteTable().locator('tbody tr').first()).toBeVisible({ timeout: 15000 });
        await expect(this.contractValueLabel).toBeVisible();
    }

    async selectUpfront(label) {
        await Promise.all([
            this.page
                .waitForResponse(
                    (res) =>
                        /\/api\/contract-requests\/\d+\/quote/.test(res.url()) &&
                        res.request().method() === 'GET',
                    { timeout: 15000 }
                )
                .catch(() => null),
            this.upfrontButton(label).click(),
        ]);
        await expect(this.quoteTable().locator('tbody tr').first()).toBeVisible({ timeout: 15000 });
        await expect(this.contractValueLabel).toBeVisible();
    }

    async verifyQuoteTableColumns() {
        const table = this.quoteTable();
        await expect(table).toBeVisible();
        const headers = (await table.locator('th').allTextContents()).map((h) => h.trim());
        for (const col of ['Qty', 'Line', 'Customer price', 'Line total']) {
            expect(headers).toContain(col);
        }
        const firstLine = (await table.locator('tbody tr').first().locator('td').nth(1).innerText()).trim();
        expect(firstLine).toMatch(/\d+yd\s*[—-]\s*.+/i);
        const qtyCell = (await table.locator('tbody tr').first().locator('td').first().innerText()).trim();
        expect(qtyCell).toMatch(/\d+×?/);
    }

    /**
     * AC-7.3.1 — RoRo lines use the same quote columns; no transport / £/t / tonnes breakdown.
     * AC-7.3.2 — Extra tonnage is post-collection and not part of contract value.
     */
    async verifyRoRoQuoteHasNoCostBreakdown() {
        await this.verifyQuoteTableColumns();
        const mainText = await this.page.locator('main').innerText();
        expect(mainText).not.toMatch(/Transport £|Cost £ \/ tonne|Included tonnes|Contamination/i);
        // Contract value is a single whole-£ figure (no tonnage surcharge lines)
        await this.verifyContractValueCard();
        const valueCard = await this.contractValueLabel.locator('..').innerText();
        expect(valueCard).not.toMatch(/tonne|tonnage|post-collection|extra/i);
    }

    async verifyContractValueCard() {
        await expect(this.contractValueLabel).toBeVisible();
        const amount = this.page.locator('main').getByText(/£\d[\d,]*/).filter({
            hasNot: this.page.getByText(/deposit/i),
        });
        // Large whole-£ amount near the contract value label
        const card = this.contractValueLabel.locator('..');
        await expect(card.getByText(/£\d[\d,]*$/)).toBeVisible();
        const text = await card.innerText();
        expect(text).toMatch(/£\d[\d,]*\b/);
        expect(text).not.toMatch(/£\d[\d,]*\.\d{2}/);
        void amount;
    }

    async verifyNoInternalPricingParams() {
        const body = await this.page.locator('main').innerText();
        expect(body).not.toMatch(/Base margin|Margin floor|Supplier costs|worst-combination|\bGP\b|Gross profit/i);
        expect(body).not.toMatch(/Cost £ \/ tonne|Transport £|Contamination/i);
    }

    async verifyDepositWarningVisible() {
        await expect(this.depositWarning).toBeVisible();
    }

    /**
     * @returns {Promise<number[]>} customer unit prices from the quote table
     */
    async getCustomerUnitPrices() {
        const table = this.quoteTable();
        const rows = table.locator('tbody tr');
        const count = await rows.count();
        const prices = [];
        for (let i = 0; i < count; i++) {
            const raw = (await rows.nth(i).locator('td').nth(2).innerText()).trim();
            const match = raw.replace(/,/g, '').match(/£?\s*(\d+)/);
            expect(match, `Expected whole-£ price in "${raw}"`).toBeTruthy();
            prices.push(Number(match[1]));
        }
        return prices;
    }

    async getContractValuePounds() {
        const card = this.contractValueLabel.locator('..');
        const text = await card.innerText();
        const match = text.replace(/,/g, '').match(/£\s*(\d+)/);
        expect(match).toBeTruthy();
        return Number(match[1]);
    }

    async verifyWholePoundPrices() {
        const table = this.quoteTable();
        const priceCells = table.locator('tbody tr td:nth-child(3), tbody tr td:nth-child(4)');
        const count = await priceCells.count();
        for (let i = 0; i < count; i++) {
            const text = (await priceCells.nth(i).innerText()).trim();
            expect(text).toMatch(/^£?\d[\d,]*$/);
            expect(text).not.toMatch(/\.\d/);
        }
        const valueText = await this.contractValueLabel.locator('..').innerText();
        expect(valueText).toMatch(/£\d[\d,]*/);
        expect(valueText).not.toMatch(/£\d[\d,]*\.\d{2}/);
    }

    async verifyCloseDealEnabled() {
        await expect(this.closeDealBtn).toBeVisible();
        await expect(this.closeDealBtn).toBeEnabled();
    }

    async openCloseDealModal() {
        await this.closeDealBtn.click();
        await expect(this.closeModalTitle).toBeVisible({ timeout: 10000 });
        await expect(this.closeModalCancelBtn).toBeVisible();
        await expect(this.closeModalConfirmBtn).toBeVisible();
    }

    async verifyCloseModalContents({ termLabel, upfrontLabel }) {
        const dialog = this.closeModalTitle.locator('xpath=ancestor::div[contains(@class,"fixed") or contains(@class,"modal")][1]')
            .or(this.page.locator('div').filter({ has: this.closeModalTitle }).filter({ has: this.closeModalConfirmBtn }).last());

        // Term picker uses "6 mo"; modal often shows "6 months"
        const termMonths = String(termLabel || '').match(/(\d+)/)?.[1];
        if (termMonths) {
            await expect(dialog.getByText(new RegExp(`${termMonths}\\s*mo(nths?)?`, 'i')).first()).toBeVisible();
        }
        if (upfrontLabel) {
            await expect(dialog.getByText(upfrontLabel, { exact: false }).first()).toBeVisible();
        }
        await expect(dialog.getByText(/\d+yd/i).first()).toBeVisible();
        await expect(dialog.getByText(/£\d/).first()).toBeVisible();
    }

    async confirmCloseContract() {
        await this.closeModalConfirmBtn.click();
        await expect(this.page.getByText('Closed', { exact: true }).first()).toBeVisible({ timeout: 20000 });
        await expect(this.quoteCalculatorHeading).toHaveCount(0);
        await expect(this.closeDealBtn).toHaveCount(0);
        await expect(this.page.getByText('Term', { exact: true })).toHaveCount(0);
        await expect(this.page.getByText('Upfront', { exact: true })).toHaveCount(0);
    }

    async verifyClosedState({ termLabel, upfrontLabel } = {}) {
        await expect(this.page.getByText('Closed', { exact: true }).first()).toBeVisible();

        const termMonths = String(termLabel || '').match(/(\d+)/)?.[1];
        if (termMonths) {
            await expect(this.page.getByText(new RegExp(`Term:\\s*${termMonths}\\s*months?`, 'i'))).toBeVisible();
        }
        if (upfrontLabel) {
            await expect(this.page.getByText(new RegExp(`Upfront:\\s*${escapeRegExp(upfrontLabel)}`, 'i'))).toBeVisible();
        }
        await expect(this.page.getByText(/Closed:\s*\d{1,2}\s+\w+\s+\d{4}/i)).toBeVisible();

        await expect(this.quoteTable()).toBeVisible();
        const closedValueLabel = this.page.getByText('Contract value', { exact: true });
        await expect(closedValueLabel).toBeVisible();
        await expect(this.closedPhase2Note).toBeVisible();

        // Green-styled contract value card
        const card = closedValueLabel.locator('xpath=ancestor::div[contains(@class,"bg-") or contains(@class,"border") or contains(@class,"green") or contains(@class,"emerald")][1]');
        const className = (await card.getAttribute('class').catch(() => '')) || '';
        const styleOk =
            /green|emerald/.test(className) ||
            (await card
                .evaluate((el) => {
                    const bg = getComputedStyle(el).backgroundColor;
                    const color = getComputedStyle(el).color;
                    return /rgb\(\s*\d+,\s*2\d{2},\s*\d+\s*\)/.test(`${bg} ${color}`);
                })
                .catch(() => false));
        expect(styleOk).toBeTruthy();

        await expect(this.depositWarning).toBeVisible();
    }
}

function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
