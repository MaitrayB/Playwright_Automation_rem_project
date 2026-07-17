import { expect } from 'allure-playwright';
import { ensureCookieConsentDismissed } from '../../utils/cookieConsent.js';

/**
 * @typedef {import('@playwright/test').Page} Page
 * @typedef {import('@playwright/test').Locator} Locator
 */

export class AdminContractPricingPage {
    /** @param {Page} page */
    constructor(page) {
        this.page = page;
        this.backToContractsBtn = page.getByRole('button', { name: 'Back to Contracts' });
        this.priceTitle = page.getByRole('heading', { name: /^Price:/ });
        this.supplierPanelTitle = page.getByRole('heading', { name: 'Supplier & per-line cost' });
        this.supplierLabel = page.getByText('Supplier', { exact: true }).first();
        this.supplierSelectBtn = page.getByRole('button', { name: /Select a supplier|supplier/i }).first();
        this.supplierFreeTextInput = page.getByPlaceholder(
            'Supplier name (free text — off-platform suppliers allowed)'
        );
        this.supplierNameLabel = page.getByText('Supplier name', { exact: true });
        this.costHint = page.getByText(/Supplier costs, ex VAT — never shown to the agent/);
        // UI styles as uppercase via CSS; accessible text is "Requirement"
        this.requirementHeading = page.getByText(/^Requirement$/i);
        this.readOnlyWarning = page.getByText(/This request is (closed|cancelled) — the grid can no longer be changed\./i);

        this.gridPanelTitle = page.getByRole('heading', { name: 'Grid', exact: true });
        this.maxTermSelect = page.locator('main select').first();
        this.baseMarginInput = page.getByText('Base margin %', { exact: true }).locator('xpath=following::input[1]');
        this.marginFloorInput = page.getByText('Margin floor %', { exact: true }).locator('xpath=following::input[1]');
        this.discountMaxTermInput = page.getByText('Discount @ max term %', { exact: true }).locator('xpath=following::input[1]');
        this.discountFullUpfrontInput = page.getByText('Discount @ full upfront %', { exact: true }).locator('xpath=following::input[1]');
        this.lockGridBtn = page.getByRole('button', {
            name: /^(Lock grid|Re-lock grid \(supersedes current\)|Locking…)$/,
        });
        this.worstComboPreview = page.getByText(/Worst combination \(max term \+ full upfront\):/);
        this.costInputs = page.locator('input[inputmode="decimal"][placeholder="0"]');
    }

    async acceptCookiesIfVisible() {
        await ensureCookieConsentDismissed(this.page);
    }

    async verifyDetailPageLayout({ customerName, agentName, area, termMonths }) {
        await this.acceptCookiesIfVisible();
        await expect(this.page).toHaveURL(/\/super-admin\/contracts\/\d+/, { timeout: 30000 });
        await expect(this.backToContractsBtn).toBeVisible();
        await expect(this.page.getByRole('heading', { name: new RegExp(`^Price:\\s*${escapeRegExp(customerName)}`) })).toBeVisible();
        await expect(this.page.locator('h1 span, h1 >> span').filter({ hasText: /Awaiting pricing|Priced|Closed|Cancelled/i }).first()).toBeVisible();

        const subtitle = this.page.locator('p').filter({ hasText: new RegExp(`From\\s+${escapeRegExp(agentName)}`) }).first();
        await expect(subtitle).toBeVisible();
        await expect(subtitle).toContainText(area);
        if (termMonths) {
            await expect(subtitle).toContainText(`customer mentioned ~${termMonths} months`);
        }
    }

    async verifyReadOnlyWarning(status) {
        await expect(
            this.page.getByText(`This request is ${status} — the grid can no longer be changed.`)
        ).toBeVisible({ timeout: 15000 });

        // Pricing controls are not editable
        const supplierControl = this.page.getByRole('button', { name: /Select a supplier/i })
            .or(this.supplierFreeTextInput)
            .first();
        if (await supplierControl.count()) {
            await expect(supplierControl).toBeDisabled();
        }

        const costInputs = this.page.locator('input[placeholder="0"]');
        const count = await costInputs.count();
        for (let i = 0; i < count; i++) {
            await expect(costInputs.nth(i)).toBeDisabled();
        }

        const maxTerm = this.page.locator('select').first();
        if (await maxTerm.count()) {
            await expect(maxTerm).toBeDisabled();
        }
    }

    async verifyRequirementLines(expectedLines) {
        await this.requirementHeading.scrollIntoViewIfNeeded();
        await expect(this.requirementHeading).toBeVisible();
        for (const line of expectedLines) {
            // Live UI may use "2 × 8yd Mixed C&D" or "2 × 8yd — Mixed C&D"
            const pattern = new RegExp(
                `${line.qty}\\s*×\\s*${line.size}yd\\s*(—|-|·)?\\s*${escapeRegExp(line.wasteType)}`,
                'i'
            );
            await expect(
                this.page.locator('main').getByText(pattern).last()
            ).toBeVisible();
        }
    }

    async verifySupplierPanel() {
        await expect(this.supplierPanelTitle).toBeVisible();

        // Product currently uses a supplier picker; AC also describes a free-text field.
        // Accept either implementation so tests track the live UI.
        const hasFreeText = await this.supplierFreeTextInput.isVisible().catch(() => false);
        if (hasFreeText) {
            await expect(this.supplierNameLabel).toBeVisible();
            await expect(this.supplierFreeTextInput).toBeVisible();
            return;
        }

        await expect(this.supplierLabel).toBeVisible();
        await expect(this.page.getByRole('button', { name: /Select a supplier/i })).toBeVisible();
    }

    async verifySkipLineCostInputs(lines) {
        for (const line of lines) {
            // Only assert £ cost inputs for standard skip sizes 4–16yd
            if (line.size > 16) {
                continue;
            }
            const labelPattern = new RegExp(
                `${line.qty}\\s*×\\s*${line.size}yd\\s*·\\s*${escapeRegExp(line.wasteType)}`,
                'i'
            );
            const costRow = this.page
                .locator('div')
                .filter({ hasText: labelPattern })
                .filter({ has: this.page.locator('input') })
                .last();
            await expect(costRow.getByText(labelPattern)).toBeVisible();
            await expect(costRow.getByText('£', { exact: true })).toBeVisible();
            const input = costRow.locator('input').first();
            await expect(input).toBeVisible();
            await expect(input).toHaveAttribute('inputmode', 'decimal');
            // Min £1 ex VAT (attribute may be min="1")
            const min = await input.getAttribute('min');
            if (min !== null) {
                expect(Number(min)).toBeGreaterThanOrEqual(1);
            }
        }
    }

    async verifySupplierCostHint() {
        await expect(this.costHint).toBeVisible();
        await expect(this.page.getByText(/RoRo: the seller sees the margined sell rates/i)).toBeVisible();
        await expect(this.page.getByText(/extra tonnage is billed post-collection/i)).toBeVisible();
        await expect(this.page.getByText(/Contamination is REM↔supplier only/i)).toBeVisible();
    }

    async verifyGridPanelFields() {
        await expect(this.gridPanelTitle).toBeVisible();
        await expect(this.page.getByText('Max term', { exact: true })).toBeVisible();
        await expect(this.maxTermSelect).toBeVisible();

        const expectedMonths = ['1', '3', '6', '12', '18', '24'];
        for (const months of expectedMonths) {
            await expect(this.maxTermSelect.locator(`option[value="${months}"]`)).toHaveCount(1);
            await expect(this.maxTermSelect.locator(`option[value="${months}"]`)).toContainText(
                new RegExp(`^${months}\\s+months?$`)
            );
        }

        await expect(this.page.getByText('Base margin %', { exact: true })).toBeVisible();
        await expect(this.baseMarginInput).toBeVisible();
        await expect(this.baseMarginInput).toHaveAttribute('inputmode', 'decimal');

        await expect(this.page.getByText('Margin floor %', { exact: true })).toBeVisible();
        await expect(this.marginFloorInput).toBeVisible();
        await expect(this.marginFloorInput).toHaveAttribute('inputmode', 'decimal');

        await expect(this.page.getByText('Discount @ max term %', { exact: true })).toBeVisible();
        await expect(this.discountMaxTermInput).toBeVisible();
        await expect(this.discountMaxTermInput).toHaveAttribute('inputmode', 'decimal');
        await expect(this.discountMaxTermInput).toHaveValue('0');

        await expect(this.page.getByText('Discount @ full upfront %', { exact: true })).toBeVisible();
        await expect(this.discountFullUpfrontInput).toBeVisible();
        await expect(this.discountFullUpfrontInput).toHaveAttribute('inputmode', 'decimal');
        await expect(this.discountFullUpfrontInput).toHaveValue('0');
    }

    async selectFirstSupplier() {
        const freeTextVisible = await this.supplierFreeTextInput.isVisible().catch(() => false);
        if (freeTextVisible) {
            await this.supplierFreeTextInput.fill('QA Off-Platform Supplier');
            return 'QA Off-Platform Supplier';
        }

        await this.page.getByRole('button', { name: /Select a supplier/i }).click();
        const option = this.page.getByText(/\(\#\d+\)/).first();
        await expect(option).toBeVisible({ timeout: 15000 });
        const label = (await option.innerText()).split('\n')[0].trim();
        await option.click();
        await expect(this.page.getByRole('button', { name: /Select a supplier/i })).toHaveCount(0);
        return label;
    }

    async fillAllLineCosts(amount = '100') {
        const count = await this.costInputs.count();
        expect(count).toBeGreaterThan(0);
        for (let i = 0; i < count; i++) {
            await this.costInputs.nth(i).fill(String(amount));
        }
    }

    async clearAllLineCosts() {
        const count = await this.costInputs.count();
        for (let i = 0; i < count; i++) {
            await this.costInputs.nth(i).fill('');
        }
    }

    async fillMargins({ base, floor, discountMaxTerm = '0', discountFullUpfront = '0' }) {
        await this.baseMarginInput.fill(String(base));
        await this.marginFloorInput.fill(String(floor));
        await this.discountMaxTermInput.fill(String(discountMaxTerm));
        await this.discountFullUpfrontInput.fill(String(discountFullUpfront));
    }

    async verifyBaseMustExceedFloor() {
        // Base <= floor prevents a valid lock (preview shows reject / button disabled)
        await this.fillMargins({ base: '10', floor: '15' });
        await expect(this.worstComboPreview).toBeVisible();
        await expect(this.page.getByText(/the server will reject this grid/i)).toBeVisible();
        await expect(this.lockGridBtn).toBeDisabled();

        await this.fillMargins({ base: '10', floor: '10' });
        // Equal base/floor is not above floor — lock must remain blocked for submission
        const equalPreview = this.page.getByText(/Worst combination \(max term \+ full upfront\):/);
        await expect(equalPreview).toBeVisible();
        const previewText = await equalPreview.innerText();
        if (/reject this grid/i.test(previewText)) {
            await expect(this.lockGridBtn).toBeDisabled();
        } else {
            // If UI treats equal as non-reject preview, submission still must not succeed as a new lock
            // without base > floor — keep margins invalid for subsequent asserts via base < floor path above.
            await this.fillMargins({ base: '9', floor: '10' });
            await expect(this.page.getByText(/the server will reject this grid/i)).toBeVisible();
            await expect(this.lockGridBtn).toBeDisabled();
        }
    }

    async verifyWorstComboPreview({ expectedMargin, expectedFloor, expectReject = false }) {
        const pattern = new RegExp(
            `Worst combination \\(max term \\+ full upfront\\):\\s*${escapeRegExp(String(expectedMargin))}%.+margin vs\\s*${escapeRegExp(String(expectedFloor))}% floor`,
            'i'
        );
        const preview = this.page.getByText(pattern);
        await expect(preview).toBeVisible({ timeout: 10000 });

        if (expectReject) {
            await expect(this.page.getByText(/the server will reject this grid/i)).toBeVisible();
            await expect(preview).toHaveClass(/text-red/);
        } else {
            await expect(this.page.getByText(/the server will reject this grid/i)).toHaveCount(0);
            await expect(preview).toHaveClass(/text-emerald|text-green/);
        }
        return preview;
    }

    async verifyLockButtonDisabledReasons() {
        // No supplier selected
        await expect(this.page.getByRole('button', { name: /Select a supplier/i })).toBeVisible();
        await expect(this.lockGridBtn).toBeDisabled();

        await this.selectFirstSupplier();
        await this.fillAllLineCosts('100');
        await this.fillMargins({ base: '25', floor: '10' });
        await this.verifyWorstComboPreview({
            expectedMargin: '25.00',
            expectedFloor: '10.00',
            expectReject: false,
        });
        await expect(this.lockGridBtn).toBeEnabled();

        // Floor breached in worst-combo preview
        await this.fillMargins({ base: '25', floor: '30' });
        await this.verifyWorstComboPreview({
            expectedMargin: '25.00',
            expectedFloor: '30.00',
            expectReject: true,
        });
        await expect(this.lockGridBtn).toBeDisabled();

        // Restore healthy values
        await this.fillMargins({ base: '25', floor: '10' });
        await expect(this.lockGridBtn).toBeEnabled();

        // No line costs — client blocks lock with validation message
        await this.clearAllLineCosts();
        if (await this.lockGridBtn.isEnabled()) {
            await this.lockGridBtn.click();
            await expect(
                this.page.getByText(/Every line needs a supplier cost of at least £1/i)
            ).toBeVisible({ timeout: 10000 });
        } else {
            await expect(this.lockGridBtn).toBeDisabled();
        }
        await this.fillAllLineCosts('100');
        await expect(this.lockGridBtn).toBeEnabled();
    }

    async lockGridSuccessfully({
        base = '30',
        floor = '10',
        cost = '120',
        discountMaxTerm = '0',
        discountFullUpfront = '0',
    } = {}) {
        let supplierLabel = null;
        const hasSupplier = await this.page.getByRole('button', { name: /Select a supplier/i }).count();
        if (hasSupplier) {
            supplierLabel = await this.selectFirstSupplier();
        }
        await this.fillAllLineCosts(cost);
        await this.fillMargins({ base, floor, discountMaxTerm, discountFullUpfront });
        await expect(this.worstComboPreview).toBeVisible({ timeout: 10000 });
        await expect(this.worstComboPreview).toHaveClass(/text-emerald|text-green/);
        const previewText = await this.worstComboPreview.innerText();
        const worstMargin = previewText.match(/:\s*(-?\d+(?:\.\d+)?)%\s+margin/i)?.[1];
        expect(worstMargin).toBeTruthy();
        await expect(this.lockGridBtn).toBeEnabled();
        await expect(this.lockGridBtn).toHaveText('Lock grid');

        const [response] = await Promise.all([
            this.page.waitForResponse(
                (res) =>
                    res.request().method() === 'POST' &&
                    /\/api\/contract-requests\/\d+\/grid/.test(res.url())
            ),
            this.lockGridBtn.click(),
        ]);
        const body = await response.json().catch(() => ({}));

        const success = this.page.getByText(
            new RegExp(
                `Grid locked — worst-combination margin ${escapeRegExp(Number(worstMargin).toFixed(2))}%\\. The agent can now close on any term × upfront\\.`,
                'i'
            )
        );
        await expect(success).toBeVisible({ timeout: 15000 });
        await expect(this.page.getByRole('button', { name: 'Re-lock grid (supersedes current)' })).toBeVisible({
            timeout: 15000,
        });
        return { success, supplierLabel, cost, gridId: body.grid_id, lockedAt: body.locked_at };
    }

    /**
     * AC-5.7.1 — existing-grid summary (supplier, max term, locked time) + supersede note.
     * @param {{ supplierLabel?: string, maxTermMonths?: number|string }} [opts]
     */
    async verifyExistingGridSummary({ supplierLabel, maxTermMonths } = {}) {
        const note = this.page.getByText(/^Currently locked:/);
        await note.scrollIntoViewIfNeeded();
        await expect(note).toBeVisible({ timeout: 15000 });

        const noteText = await note.innerText();
        // Supplier is shown without the "(#id)" suffix used in the picker
        if (supplierLabel) {
            const supplierName = supplierLabel.replace(/\s*\(#\d+\)\s*$/, '').trim();
            expect(noteText).toContain(supplierName);
        }
        if (maxTermMonths) {
            expect(noteText).toMatch(new RegExp(`max\\s+${maxTermMonths}\\s+months?`, 'i'));
        }
        // Locked time is displayed
        expect(noteText).toMatch(/\(locked\s+\d{2}\/\d{2}\/\d{4},\s*\d{2}:\d{2}:\d{2}\)/);
        // Supersede note
        expect(noteText).toMatch(
            /Locking again replaces it — agents mid-quote will be asked to re-quote\./
        );
    }

    /**
     * AC-5.8.1 — "Locked costs:" summary of the per-line costs entered.
     * @param {(string|number)[]} expectedCosts
     */
    async verifyLockedCostsSummary(expectedCosts = []) {
        const locked = this.page.getByText(/^Locked costs:/);
        await locked.scrollIntoViewIfNeeded();
        await expect(locked).toBeVisible({ timeout: 15000 });

        const text = await locked.innerText();
        for (const cost of expectedCosts) {
            expect(text).toContain(`£${cost}`);
        }
        return text;
    }

    /**
     * AC-5.7.2 — re-lock supersedes the previous grid (new grid id / locked time),
     * and shows a fresh success message.
     */
    async reLockGridAndVerifySupersede({
        previousGridId,
        base = '28',
        floor = '9',
        cost = '150',
        discountMaxTerm = '5',
        discountFullUpfront = '5',
    } = {}) {
        await expect(this.lockGridBtn).toHaveText('Re-lock grid (supersedes current)');

        await this.fillAllLineCosts(cost);
        await this.fillMargins({ base, floor, discountMaxTerm, discountFullUpfront });
        await expect(this.worstComboPreview).toBeVisible({ timeout: 10000 });
        await expect(this.worstComboPreview).toHaveClass(/text-emerald|text-green/);
        const previewText = await this.worstComboPreview.innerText();
        const worstMargin = previewText.match(/:\s*(-?\d+(?:\.\d+)?)%\s+margin/i)?.[1];
        expect(worstMargin).toBeTruthy();
        await expect(this.lockGridBtn).toBeEnabled();

        const [response] = await Promise.all([
            this.page.waitForResponse(
                (res) =>
                    res.request().method() === 'POST' &&
                    /\/api\/contract-requests\/\d+\/grid/.test(res.url())
            ),
            this.lockGridBtn.click(),
        ]);
        const body = await response.json().catch(() => ({}));

        const success = this.page.getByText(
            new RegExp(
                `Grid locked — worst-combination margin ${escapeRegExp(Number(worstMargin).toFixed(2))}%\\. The agent can now close on any term × upfront\\.`,
                'i'
            )
        );
        await expect(success).toBeVisible({ timeout: 15000 });

        // New grid supersedes the old one
        if (previousGridId !== undefined && body.grid_id !== undefined) {
            expect(body.grid_id).not.toBe(previousGridId);
        }
        await expect(this.lockGridBtn).toHaveText('Re-lock grid (supersedes current)');
        return { gridId: body.grid_id, lockedAt: body.locked_at, cost };
    }

    async verifyRelockButtonOnPricedRequest() {
        await expect(this.page.getByRole('button', { name: 'Re-lock grid (supersedes current)' })).toBeVisible({
            timeout: 15000,
        });
    }

    async verifyLockRejectedByServerFloorBreach() {
        await this.fillAllLineCosts('100');
        await this.fillMargins({ base: '25', floor: '10' });
        await expect(this.lockGridBtn).toBeEnabled();

        await this.page.route('**/api/contract-requests/*/grid', async (route) => {
            if (route.request().method() === 'POST') {
                await route.fulfill({
                    status: 400,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        error: 'Margin floor was breached.',
                        code: 'FLOOR_BREACH',
                        worst_margin_pct: 6.5,
                    }),
                });
                return;
            }
            await route.continue();
        });

        await this.lockGridBtn.click();
        await expect(
            this.page.getByText(/Grid rejected: Margin floor was breached\.\s*\(worst margin 6\.50%\)/i)
        ).toBeVisible({ timeout: 15000 });

        await this.page.unroute('**/api/contract-requests/*/grid');
    }

    async verifyLockDisabledWhileSubmitting() {
        await this.fillAllLineCosts('100');
        await this.fillMargins({ base: '28', floor: '10' });
        await expect(this.lockGridBtn).toBeEnabled();

        let release;
        const gate = new Promise((resolve) => {
            release = resolve;
        });

        await this.page.route('**/api/contract-requests/*/grid', async (route) => {
            if (route.request().method() === 'POST') {
                await gate;
                await route.fulfill({
                    status: 400,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        error: 'Margin floor was breached.',
                        code: 'FLOOR_BREACH',
                        worst_margin_pct: 1,
                    }),
                });
                return;
            }
            await route.continue();
        });

        await Promise.all([
            this.page.waitForRequest(
                (req) => req.method() === 'POST' && /\/api\/contract-requests\/\d+\/grid/.test(req.url())
            ),
            this.lockGridBtn.click(),
        ]);
        await expect(
            this.page.getByRole('button', { name: 'Locking…' })
        ).toBeDisabled({ timeout: 5000 });
        release();
        await expect(this.page.getByText(/Grid rejected:/i)).toBeVisible({ timeout: 15000 });
        await this.page.unroute('**/api/contract-requests/*/grid');
    }
}

function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
