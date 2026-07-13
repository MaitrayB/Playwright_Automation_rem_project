import { expect } from '@playwright/test';

/**
 * Page Object for the Take Order Sheet modal/drawer in the Supplier portal.
 * Handles all locators and interactions with the order sheet display when a supplier takes an order.
 * Covers acceptance criteria AC-3.2.1 through AC-3.2.5.
 */
export class TakeOrderSheetPage {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;

        // Main container locators with multiple fallbacks
        this.takeOrderSheet = page.getByRole('dialog', { name: 'Take this Order' });

        //Actioin Required section locators
        this.actionRequiredHeading = this.takeOrderSheet.getByRole('heading', { name: 'Action Required' });
        this.documentsNotCompletedMsg = this.takeOrderSheet.getByText(/Cannot Take Orders\. Documents are not completed\./);
        this.completeDocumentsLink = this.takeOrderSheet.getByRole('link', { name: /Complete [Dd]ocuments/ });

        // Order Summary Section Locators - scoped to Take Order dialog
        this.deliveryLocationHeading = this.takeOrderSheet.getByRole('heading', { name: 'Delivery Location' });
        this.deliveryLocationBlock = this.deliveryLocationHeading.locator('..');
        this.deliveryAddressValue = this.deliveryLocationBlock.locator('> div').nth(0);
        this.postcodeValue = this.deliveryLocationBlock.locator('> div').nth(1);
        this.deliveryCollectionHeading = this.takeOrderSheet.getByRole('heading', { name: 'Delivery & Collection' });
        this.deliveryCollectionBlock = this.deliveryCollectionHeading.locator('xpath=../..');
        this.deliveryDateValue = this.takeOrderSheet.getByText('Delivery', { exact: true })
            .locator('xpath=following-sibling::*[1]');

        // Order Items Section Locators
        this.orderItemsSection = this.takeOrderSheet.getByRole('heading', { name: 'Order Items' });
        this.itemsTable = this.orderItemsSection;
        this.itemRows = this.takeOrderSheet.getByRole('heading', { level: 5 });
        this.firstItemRow = this.itemRows.first();
        this.itemNameCell = this.itemRows.first();
        this.itemQuantityCell = this.takeOrderSheet.getByText('Quantity:').first();
        this.itemPriceCell = this.takeOrderSheet.getByText(/Your Price/i).first();

        // Total Summary Section Locators
        this.totalSummarySection = this.takeOrderSheet.getByRole('heading', { name: 'Total Summary' });
        this.totalSummaryBlock = this.totalSummarySection.locator('xpath=../..');
        this.subtotalLabel = this.takeOrderSheet.getByText('Your Total (incl. VAT)');
        this.totalValue = this.totalSummaryBlock.locator('> div').last();

        // Loading and interaction elements
        this.loadingSpinner = this.takeOrderSheet.locator('[class*="spinner"], [class*="loading"], [role="progressbar"]').first();
        // Scope to dialog header so cookie-consent Close is never matched
        this.closeButton = this.takeOrderSheet.locator('button[aria-label="Close"]');
        this.confirmButton = page.locator('button:has-text(/confirm|proceed|next/i)').first();

        //Bank account not set up locators
        this.completeSetupSection = this.takeOrderSheet.getByRole('heading', { name: 'Complete Setup Required' });
        this.addBankAccountMsg = this.takeOrderSheet.getByText('Add Bank Account Details');
        this.setPaymentDetailsMsg = this.takeOrderSheet.getByText('Set up payment information to receive payouts');
        this.completeLink = this.takeOrderSheet.getByRole('link', { name: 'Complete' });

        // Policy accordion locators (replaces legacy input#terms checkbox)
        this.supplierProtectionPolicyTab = this.takeOrderSheet.getByRole('button', { name: /Supplier Protection & Dispute Policy/i });
        this.esgWeighbridgeTab = this.takeOrderSheet.getByRole('button', { name: /ESG Weighbridge/i });
        this.termsAndPolicyBtnToViewPolicy = this.supplierProtectionPolicyTab;
        this.supplierProtectionPolicyRegion = this.takeOrderSheet.getByRole('region', { name: /Supplier Protection & Dispute Policy/i });
        this.termsPDFHeading = this.supplierProtectionPolicyRegion;
        this.iAgreeBtn = this.takeOrderSheet.getByRole('button', { name: 'I Agree' });

        // Submit Take Order Sheet button locator
        this.takeThisOrderBtn = this.takeOrderSheet.getByRole('button', { name: /Take this Order/i });
        this.submitBtnNameDuringSubmission = this.takeOrderSheet.getByRole('button', { name: 'Taking Order...' });
        this.takeOrderSuccessMsg = this.takeOrderSheet.getByText(/Order taken successfully/i);
    }

    async verifySheetDisplayed() {
        await expect(this.takeOrderSheet).toBeVisible();
    }

    async verifyTakeOrderSheetClosed() {

    }

    async verifyOrderSummarySection() {
        await expect(this.deliveryLocationHeading).toBeVisible();
        await expect(this.deliveryAddressValue).toBeVisible();
        await expect(this.postcodeValue).toBeVisible();
        await expect(this.deliveryCollectionHeading).toBeVisible();
        await expect(this.deliveryDateValue).toBeVisible();
    }

    async verifyOrderItemsSection() {
        await expect(this.orderItemsSection).toBeVisible();
        await expect(this.itemsTable).toBeVisible();
        const itemCount = await this.itemRows.count();
        expect(itemCount).toBeGreaterThan(0);
    }

    async verifySkipTarpSupplierLineItem({ expectedTarpSize } = {}) {
        await this.verifyOrderItemsSection();
        const tarpHeading = this.takeOrderSheet.getByRole('heading', {
            name: new RegExp(`Skip Tarp(aulin)?\\s*\\(${expectedTarpSize}\\)`, 'i'),
        });
        await expect(tarpHeading.first()).toBeVisible({ timeout: 10000 });

        const tarpBlock = tarpHeading.first().locator(
            'xpath=ancestor::div[.//text()[contains(.,"Type")] or .//text()[contains(.,"Quantity")]][1]'
        );
        const blockText = await tarpBlock.innerText();
        expect(blockText).toMatch(/Type:\s*skip_tarp/i);
        expect(blockText).toMatch(/Quantity:\s*1/i);
    }

    async verifyTieDownSupplierLineItem() {
        await this.verifyOrderItemsSection();
        const tieDownHeading = this.takeOrderSheet.getByRole('heading', {
            name: /Tie Down \(Reflective Guy Rope\)/i,
        }).or(this.takeOrderSheet.getByText(/Tie Down \(Reflective Guy Rope\)/i));
        await expect(tieDownHeading.first()).toBeVisible({ timeout: 10000 });
        const block = tieDownHeading.first().locator(
            'xpath=ancestor::div[.//text()[contains(.,"Type")] or .//text()[contains(.,"Quantity")]][1]'
        );
        const blockText = await block.innerText();
        expect(blockText).toMatch(/Type:\s*tie_down/i);
        expect(blockText).toMatch(/Quantity:\s*1/i);
    }

    async verifyNoTieDownDeliveryStatusSection() {
        await expect(
            this.takeOrderSheet.getByRole('heading', { name: /Tie Down Delivery|TIE DOWN DELIVERY/i })
        ).toHaveCount(0);
        await expect(this.takeOrderSheet.getByText(/Tie down included with this order/i)).toHaveCount(0);
    }

    async verifyNoTarpDeliveryStatusSection() {
        await expect(
            this.takeOrderSheet.getByRole('heading', { name: /Skip Tarpaulin Delivery|TARP DELIVERY/i })
        ).toHaveCount(0);
        await expect(this.takeOrderSheet.getByText(/Tarp included with this order/i)).toHaveCount(0);
    }

    async closeTakeOrderSheet() {
        if (await this.closeButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            await this.closeButton.click();
        } else {
            await this.page.keyboard.press('Escape');
        }
        await expect(this.takeOrderSheet).not.toBeVisible({ timeout: 10000 });
    }

    async verifyTotalSummarySection() {
        await expect(this.totalSummarySection).toBeVisible();
        await expect(this.subtotalLabel).toBeVisible();
        await expect(this.totalValue).toBeVisible();
    }

    async verifySheetFullyLoaded() {
        await this.waitForLoadingComplete();
        const loadingVisible = await this.loadingSpinner.isVisible().catch(() => false);
        expect(loadingVisible).toBe(false);
    }

    async waitForLoadingComplete() {
        try {
            await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 5000 });
        } catch {
            // Spinner may not appear once sheet content is rendered
        }
        await expect(this.orderItemsSection).toBeVisible({ timeout: 15000 });
        await expect(this.totalSummarySection).toBeVisible({ timeout: 15000 });
        await expect(this.itemRows.first()).toBeVisible({ timeout: 15000 });
    }

    async verifyLoadingStateExists() {
        try {
            await this.loadingSpinner.waitFor({ state: 'visible', timeout: 2000 });
            return true;
        } catch (e) {
            return false;
        }
    }

    async getDeliveryAddress() {
        return await this.deliveryAddressValue.textContent();
    }

    async getPostcode() {
        return await this.postcodeValue.textContent();
    }

    async getDeliveryDate() {
        return await this.deliveryDateValue.textContent();
    }

    getOrderItemBlock(index = 0) {
        return this.orderItemsSection
            .locator('xpath=following-sibling::*[1]/*')
            .nth(index);
    }

    async getFirstItemData() {
        const item = this.getOrderItemBlock(0);

        return {
            name: (await item.getByRole('heading', { level: 5 }).textContent()) || '',
            quantity: (await item.getByText(/Quantity:/).textContent()) || '',
            price: (await item.getByText(/£[\d,.]+/).last().textContent()) || ''
        };
    }

    async getTotalSupplierPrice() {
        return await this.totalValue.textContent();
    }

    async getSubtotal() {
        return await this.totalValue.textContent();
    }

    async getVAT() {
        return null;
    }

    async getAllItemsData() {
        const items = [];
        const itemBlocks = this.orderItemsSection.locator('xpath=following-sibling::*[1]/*');
        const itemCount = await itemBlocks.count();

        for (let i = 0; i < itemCount; i++) {
            const item = itemBlocks.nth(i);
            items.push({
                name: (await item.getByRole('heading', { level: 5 }).textContent()) || '',
                quantity: (await item.getByText(/Quantity:/).textContent()) || '',
                price: (await item.getByText(/£[\d,.]+/).last().textContent()) || ''
            });
        }
        return items;
    }

    async closeSheet() {
        await this.closeButton.click();
        await expect(this.takeOrderSheet).not.toBeVisible();
    }

    async verifyPolicySectionsDisplayed() {
        await expect(this.supplierProtectionPolicyTab).toBeVisible();
    }

    async verifyTakeOrderDisabled() {
        await expect(this.takeThisOrderBtn).toBeDisabled();
    }

    async verifyTakeOrderEnabled() {
        await expect(this.takeThisOrderBtn).toBeEnabled();
    }

    async openSupplierProtectionPolicy() {
        await this.supplierProtectionPolicyTab.click();
    }

    async collapseSupplierProtectionPolicy() {
        await this.supplierProtectionPolicyTab.click();
    }

    async verifySupplierProtectionPolicyOpened() {
        await expect(this.supplierProtectionPolicyRegion).toBeVisible({ timeout: 10000 });
        await expect(this.iAgreeBtn).toBeVisible();
    }

    async acceptEsgPolicyIfVisible() {
        if (await this.esgWeighbridgeTab.isVisible({ timeout: 2000 }).catch(() => false)) {
            await this.scrollAndAgreeToPolicy(this.esgWeighbridgeTab);
        }
    }

    async acceptAllPolicies() {
        await this.scrollAndAgreeToPolicy(this.supplierProtectionPolicyTab);
        await this.acceptEsgPolicyIfVisible();

        const btnTitle = await this.takeThisOrderBtn.getAttribute('title').catch(() => null);
        if (btnTitle?.includes('ESG') && await this.takeThisOrderBtn.isDisabled()) {
            await this.scrollAndAgreeToPolicy(this.esgWeighbridgeTab);
        }
    }

    async confirmOrder() {
        await this.confirmButton.click();
    }

    async scrollAndAgreeToPolicy(policyTab) {
        await policyTab.click();
        await this.page.waitForTimeout(2000);

        const pdfCanvas = this.takeOrderSheet.locator('canvas').first();
        if (await pdfCanvas.isVisible()) {
            await pdfCanvas.evaluate(canvas => {
                let el = canvas.parentElement;
                while (el) {
                    if (el.scrollHeight > el.clientHeight + 10) {
                        el.scrollTop = el.scrollHeight;
                        return;
                    }
                    el = el.parentElement;
                }
            });
        }

        await this.page.waitForTimeout(2000);

        if (!(await this.iAgreeBtn.isEnabled())) {
            await this.takeOrderSheet.evaluate(dialog => {
                const allEls = dialog.querySelectorAll('*');
                for (const el of allEls) {
                    if (el.scrollHeight > el.clientHeight + 10) {
                        el.scrollTop = el.scrollHeight;
                    }
                }
            });
            await this.page.waitForTimeout(2000);
        }

        await this.iAgreeBtn.click({ timeout: 15000 });
        await this.page.waitForTimeout(1000);
    }
}
