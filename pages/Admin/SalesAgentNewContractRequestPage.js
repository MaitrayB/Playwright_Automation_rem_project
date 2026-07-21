import { expect } from 'allure-playwright';
import { ensureCookieConsentDismissed } from '../../utils/cookieConsent.js';
import { genericFunctions } from '../../utils/genericFunctions.js';

/**
 * @typedef {import('@playwright/test').Page} Page
 * @typedef {import('@playwright/test').Locator} Locator
 */

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
        this.areaInput = page.locator('#area');
        this.roughTermInput = page.locator('#desired-term');

        this.addAnotherSizeBtn = page.getByRole('button', { name: 'Add another size' });
        this.cancelBtn = page.getByRole('button', { name: 'Cancel' });
        this.sendToPricingBtn = page.getByRole('button', { name: 'Send to pricing' });
        this.depositWarning = page.getByText(
            'A £1,500 ex VAT (£1,800 inc VAT) deposit applies to any 20yd or 40yd line. It is not waivable and is excluded from commission.'
        );
        this.qtyRequiredMessage = page.getByText('Add at least one line with a quantity');
        this.successToast = page.getByText('Sent to pricing — posted to #contract-pricing');

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

        await expect(this.page.getByText('Area', { exact: true }).first()).toBeVisible();
        await expect(this.areaInput).toBeVisible();
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
        await expect(this.qtyInput(index)).toHaveValue('');
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

    async fillRequiredCustomerFields({ customer, area }) {
        await this.customerInput.fill(customer);
        await this.areaInput.fill(area);
    }

    async verifyNoEditableAgentNameField() {
        await expect(this.page.getByLabel(/agent name/i)).toHaveCount(0);
        await expect(this.page.locator('input[id*="agent" i], input[name*="agent" i]')).toHaveCount(0);
    }

    async clickSendToPricing() {
        await this.sendToPricingBtn.click();
    }

    async clickCancel() {
        await Promise.all([
            this.page.waitForURL(/\/sales\/contracts\/?$/, { timeout: 30000 }),
            this.cancelBtn.click(),
        ]);
    }

    async submitValidRequest({ customer, area, qty = 1, size = '8', wasteType = 'Mixed C&D' }) {
        await this.fillRequiredCustomerFields({ customer, area });
        await this.setLineQty(0, qty);
        await this.setLineSize(0, size);
        await this.wasteTypeSelect(0).selectOption(wasteType);
        await this.clickSendToPricing();
        await expect(this.successToast).toBeVisible({ timeout: 15000 });
        await expect(this.page).toHaveURL(/\/sales\/contracts\/\d+/, { timeout: 30000 });
    }
}
