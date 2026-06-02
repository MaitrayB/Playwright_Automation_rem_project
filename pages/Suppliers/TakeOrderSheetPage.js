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
        this.takeOrderSheet = page.locator('[role="dialog"]:has(h2:text("Take this Order"))').first();

        //Actioin Required section locators
        this.actionRequiredHeading = page.getByRole('heading', { name: 'Action Required' });
        this.documentsNotCompletedMsg = page.getByText('Cannot Take Orders. Documents are not completed. You need to upload your documents and be verified before you can take orders.');
        this.completeDocumentsLink = page.getByRole('link', { name: 'Complete documents' });

        // Order Summary Section Locators - based on visible text in dialog
        this.orderSummarySection = page.getByText('Order Summary').first();
        this.deliveryAddressLabel = page.getByText('Address:').first();
        this.deliveryAddressValue = page.locator('span:text-is("Address:") + span');
        this.postcodeLabel = page.getByText('Postcode:').first();
        this.postcodeValue = page.locator('span:text-is("Postcode:") + span');
        this.deliveryDateLabel = page.getByLabel('Take this Order', { exact: true }).getByText('Delivery:') //page.getByText(/Delivery:/);
        this.deliveryDateValue = page.locator('span:text-is("Delivery:") + span');

        // Order Items Section Locators
        this.orderItemsSection = page.getByText('Order Items').first();
        this.itemsTable = page.getByText('Order Items').first();
        this.itemRows = page.getByRole('heading', { level: 5 });
        this.firstItemRow = this.itemRows.first();
        this.itemNameCell = page.getByRole('heading', { level: 5 }).first();
        this.itemQuantityCell = page.getByText('Quantity:').first();
        this.itemPriceCell = page.getByText(/Your Price/i).first();

        // Total Summary Section Locators
        this.totalSummarySection = page.getByText('Total Summary').first();
        this.subtotalLabel = page.getByText(/Your Total|Total/i).first();
        this.subtotalValue = page.locator('text=/£/').first();
        this.vatLabel = page.getByText(/VAT|Tax/i).first();
        this.vatValue = page.locator('text=/£/').nth(1);
        this.totalLabel = page.getByText('Total Summary');
        this.totalValue = page.locator('text=/£356.16|£\\d+/').last();

        // Loading and interaction elements
        this.loadingSpinner = page.locator('[class*="spinner"], [class*="loading"], [role="progressbar"]').first();
        this.closeButton = page.locator('button[aria-label*="Close"]'); //getByLabel('Close')
        this.confirmButton = page.locator('button:has-text(/confirm|proceed|next/i)').first();

        //Bank account not set up locators
        this.completeSetupSection = page.getByRole('heading', { name: 'Complete Setup Required' });
        this.addBankAccountMsg = page.getByText('Add Bank Account Details');
        this.setPaymentDetailsMsg = page.getByText('Set up payment information to receive payouts');
        this.completeLink = page.getByRole('link', { name: 'Complete' });

        // Terms and Conditions locators
        this.termsAndConditionsCheckbox = page.locator('input#terms');
        this.termsAndPolicyBtnToViewPolicy = page.getByRole('button', { name: /Supplier Protection & Dispute Policy/i });
        this.termsPDFHeading = page.getByRole('heading', { name: /Supplier Protection & Dispute Policy/i });
        this.closeTermsPDFBtn = page.getByText('Close');
        this.termsLink = page.getByRole('link', { name: /terms and conditions/i });

        // Policy accordion/tab locators
        this.supplierProtectionPolicyTab = page.getByRole('button', { name: /Supplier Protection & Dispute Policy/i });
        this.esgWeighbridgeTab = page.getByRole('button', { name: /ESG Weighbridge/i });
        this.iAgreeBtn = page.getByRole('button', { name: 'I Agree' });

        // Submit Take Order Sheet button locator
        // this.submitButton = page.locator('#root').getByRole('button', { name: 'Take this Order' });
        this.takeThisOrderBtn = page.locator('button[type="submit"]');//.filter({ hasText: 'Take this Order' });
        this.submitBtnNameDuringSubmission = page.getByRole('button', { name: 'Taking Order...' });
        this.takeOrderSuccessMsg = page.getByText(/Order taken successfully/i);
    }

    async verifySheetDisplayed() {
        await expect(this.takeOrderSheet).toBeVisible();
    }

    async verifyTakeOrderSheetClosed() {

    }

    async verifyOrderSummarySection() {
        await expect(this.orderSummarySection).toBeVisible();
        await expect(this.deliveryAddressLabel).toBeVisible();
        await expect(this.deliveryAddressValue).toBeVisible();
        await expect(this.postcodeLabel).toBeVisible();
        await expect(this.postcodeValue).toBeVisible();
        await expect(this.deliveryDateLabel).toBeVisible();
        await expect(this.deliveryDateValue).toBeVisible();
    }

    async verifyOrderItemsSection() {
        await expect(this.orderItemsSection).toBeVisible();
        await expect(this.itemsTable).toBeVisible();
        const itemCount = await this.itemRows.count();
        expect(itemCount).toBeGreaterThan(0);
    }

    async verifyTotalSummarySection() {
        await expect(this.totalSummarySection).toBeVisible();
        await expect(this.subtotalLabel).toBeVisible();
        await expect(this.subtotalValue).toBeVisible();
        await expect(this.vatLabel).toBeVisible();
        await expect(this.vatValue).toBeVisible();
        await expect(this.totalLabel).toBeVisible();
        await expect(this.totalValue).toBeVisible();
    }

    async verifySheetFullyLoaded() {
        await this.page.waitForLoadState('networkidle');
        const loadingVisible = await this.loadingSpinner.isVisible().catch(() => false);
        expect(loadingVisible).toBe(false);
    }

    async waitForLoadingComplete() {
        try {
            await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 10000 });
        } catch (e) {
            // Loading spinner might not always appear, so continue
        }
        await this.page.waitForLoadState('networkidle');
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

    async getFirstItemData() {
        // Find the main container holding the first item
        const container = this.firstItemRow.locator('xpath=ancestor::div[contains(@class, "bg-[#2A2A2A]")]').first();

        return {
            name: await container.locator('h5').textContent() || '',
            quantity: await container.locator('p:has-text("Quantity:")').textContent() || '',
            price: await container.locator('div.text-green-400.font-semibold.text-lg').first().textContent() || ''
        };
    }

    async getTotalSupplierPrice() {
        return await this.totalValue.textContent();
    }

    async getSubtotal() {
        return await this.subtotalValue.textContent();
    }

    async getVAT() {
        return await this.vatValue.textContent();
    }

    async getAllItemsData() {
        const items = [];
        const itemCount = await this.itemRows.count();
        for (let i = 0; i < itemCount; i++) {
            const rowHeading = this.itemRows.nth(i);
            const container = rowHeading.locator('xpath=ancestor::div[contains(@class, "bg-[#2A2A2A]")]').first();

            items.push({
                name: await container.locator('h5').textContent() || '',
                quantity: await container.locator('p:has-text("Quantity:")').textContent() || '',
                price: await container.locator('div.text-green-400.font-semibold.text-lg').first().textContent() || ''
            });
        }
        return items;
    }

    async closeSheet() {
        await this.closeButton.click();
        await expect(this.takeOrderSheet).not.toBeVisible();
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
