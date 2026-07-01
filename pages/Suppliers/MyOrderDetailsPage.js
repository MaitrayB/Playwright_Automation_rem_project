import { expect } from '@playwright/test';

export class MyOrderDetailsPage {
    constructor(page) {
        this.page = page;
        // Status Badge locator
        this.orderStatusBadge = page.locator('main').getByText(/\b(Booked|In Progress|Requested Collection|Collected|Delivered|Refunded|Pending,? New)\b/i).first();
        // Back to My Orders button locator
        this.orderStatusBadgeCorrected = page.locator('//span[contains(@class,"text-green")]')
        this.backToMyOrdersBtn = page.getByRole('button', { name: /Back to My Orders/i })
            .or(page.getByText(/Back to My Orders/i));
        this.manageDeliveryBtn = page.getByRole('button', { name: /Manage Delivery/i });
        this.markDeliveredBtn = page.getByRole('button', { name: 'Mark delivered' });
        this.confirmDeliveryBtn = page.getByRole('button', { name: /Confirm Delivery/i });
        this.textArea = page.getByPlaceholder('Add a message about this event...');
        this.submitBtn = page.getByRole('button', { name: 'Submit' });
        this.manageCollectionBtn = page.getByRole('button', { name: /Manage Collection/i });
        this.extraChargeableItemsBtn = page.getByRole('button', { name: /Extra Chargeable Items/i });
        this.moreOptionsBtn = page.getByRole('heading', { name: /order #\d+/i })
            .locator('xpath=ancestor::div[.//button][1]')
            .locator('button:has(svg.lucide-more-vertical)');
        this.unassignFromOrderBtn = page.getByRole('button', { name: /Unassign from Order/i });

        // Unassign Modal Locators
        this.unassignModal = page.getByRole('heading', { name: /Unassign from this order\?|Confirm Unassignment/i })
            .locator('xpath=ancestor::div[contains(@class,"max-w")][1]');
        this.unassignModalTitle = page.getByRole('heading', { name: 'Unassign from this order?', exact: true });
        this.unassignConfirmTitle = page.getByRole('heading', { name: 'Confirm Unassignment', exact: true });
        this.unassignVehicleBreakdownOption = page.getByRole('button', { name: 'Vehicle breakdown' });
        this.unassignDriverAvailabilityOption = page.getByRole('button', { name: 'Driver availability issue' });
        this.unassignSiteAccessOption = page.getByRole('button', { name: 'Site access issue' });
        this.unassignPricingMistakeOption = page.getByRole('button', { name: 'Pricing / quote mistake' });
        this.unassignOtherOption = page.getByRole('button', { name: 'Other' });
        this.unassignValidationMsg = page.getByText(/Please select a reason/i);
        this.unassignCustomReasonInput = page.getByPlaceholder('Enter reason...');
        this.unassignCustomReasonValidationMsg = page.getByText(/Please provide a reason/i);
        this.unassignContinueBtn = page.getByRole('button', { name: 'Continue', exact: true });
        this.unassignCancelBtn = page.getByRole('button', { name: 'Cancel', exact: true });
        this.reasonDropdown = page.locator('label:has-text("Reason")').locator('xpath=following::button[1]');
        this.backBtn = page.getByRole('button', { name: 'Back', exact: true });
        this.lateDeliveryOrderRow = page.locator('main [class*="cursor-pointer"]').filter({ hasText: /#\d+/ }).first();
        this.confirmUnassignBtn = page.getByRole('button', { name: /Confirm Unassign|Confirm & Accept/i });
        this.wastedJourneyTitle = page.getByText(/Late Release Charge|Wasted Journey Fee/i);
   
   
    }

    async verifyOrderStatusBadge() {
        await this.orderStatusBadge.waitFor({ state: 'visible', timeout: 5000 });
        const badgeText = await this.orderStatusBadge.textContent();

        // Standardizing checks (adding common statuses like "pending" or mapping spaces)
        const normalizedText = badgeText.trim().toLowerCase().replace(' ', '_');

        const validStatuses = ['booked', 'in_progress', 'requested_collection', 'collected', 'delivered', 'refunded', 'pending, New'];

        if (!validStatuses.includes(normalizedText)) {
            expect(validStatuses, `Unexpected order status badge found: ${badgeText}`).toContain(normalizedText);
        }
    }

    async clickBackToMyOrders() {
        await this.backToMyOrdersBtn.waitFor({ state: 'visible' });
        await this.backToMyOrdersBtn.click();
    }

    async getDeliveryActionButton() {
        if (await this.markDeliveredBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            return this.markDeliveredBtn;
        }
        if (await this.manageDeliveryBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            return this.manageDeliveryBtn;
        }
        return null;
    }

    async verifyOrderManagementOptionsVisible() {
        await expect(
            this.page.locator('main').getByRole('button', { name: /^take this order$/i })
        ).not.toBeVisible();

        const deliveryBtn = await this.getDeliveryActionButton();
        const hasDesktopManagement = deliveryBtn
            && await this.manageCollectionBtn.isVisible({ timeout: 2000 }).catch(() => false)
            && await this.extraChargeableItemsBtn.isVisible({ timeout: 2000 }).catch(() => false);

        if (hasDesktopManagement) {
            await deliveryBtn.scrollIntoViewIfNeeded();
            await expect(deliveryBtn).toBeVisible({ timeout: 15000 });
            await expect(this.manageCollectionBtn).toBeVisible({ timeout: 15000 });
            await expect(this.extraChargeableItemsBtn).toBeVisible({ timeout: 15000 });
            return;
        }

        await this.verifyMobileOrderManagementOptions();
    }

    async verifyMobileOrderManagementOptions() {
        const waitingForDelivery = this.page.locator('main').getByRole('button', { name: /Waiting for Delivery/i });
        await waitingForDelivery.scrollIntoViewIfNeeded();
        await expect(waitingForDelivery).toBeVisible({ timeout: 15000 });
        await expect(this.page.locator('main').getByRole('button', { name: /^Delivered$/i }).first()).toBeVisible();
        await expect(this.page.locator('main').getByRole('button', { name: /Waiting for Collection/i })).toBeVisible();

        const headerActions = this.page.getByRole('heading', { name: /order #\d+/i })
            .locator('xpath=ancestor::div[.//button][1]')
            .getByRole('button')
            .and(this.page.locator(':enabled'))
            .filter({ has: this.page.locator('svg') });
        await expect(headerActions.first()).toBeVisible({ timeout: 15000 });
    }

    async markDelivered(message = "Today's delivery marked by supplier") {
        if (await this.markDeliveredBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await this.markDeliveredBtn.click();
        } else {
            await this.manageDeliveryBtn.scrollIntoViewIfNeeded();
            await expect(this.manageDeliveryBtn).toBeEnabled({ timeout: 15000 });
            await this.manageDeliveryBtn.click();
            await this.page.waitForTimeout(1000);
            await this.confirmDeliveryBtn.waitFor({ state: 'visible', timeout: 10000 });
            await this.confirmDeliveryBtn.click();
        }

        await this.page.waitForTimeout(1000);
        await this.page.setInputFiles('input[type="file"]', 'Data/test_image.png');
        await this.page.waitForTimeout(2000);
        await this.textArea.fill(message);
        await this.page.waitForTimeout(1000);
        await this.submitBtn.click();
        await this.page.waitForTimeout(2000);
    }

    async openMoreOptionsMenu() {
        await expect(this.page.getByRole('heading', { name: /order #\d+/i })).toBeVisible({ timeout: 15000 });
        await expect(this.moreOptionsBtn).toBeEnabled({ timeout: 15000 });
        await this.moreOptionsBtn.click();
    }

    // Unassign Modal Methods
    async verifyUnassignModalDisplayed() {
        await expect(this.unassignModal).toBeVisible();
        await expect(this.unassignModalTitle).toBeVisible();
    }

    async openReasonDropdown() {
        await this.reasonDropdown.click();
    }

    async clickReasonDropdown() {
        await this.openReasonDropdown();
    }

    async verifyDropdownOptionsVisible() {
        await expect(this.unassignVehicleBreakdownOption).toBeVisible();
        await expect(this.unassignDriverAvailabilityOption).toBeVisible();
        await expect(this.unassignSiteAccessOption).toBeVisible();
        await expect(this.unassignPricingMistakeOption).toBeVisible();
        await expect(this.unassignOtherOption).toBeVisible();
    }

    async closeDropdownWithoutSelecting() {
        await this.reasonDropdown.click();
    }

    async clickContinueToUnassign() {
        await this.unassignContinueBtn.scrollIntoViewIfNeeded();
        await this.unassignContinueBtn.highlight();
        await this.unassignContinueBtn.click();
    }

    async verifyReasonValidationMessage() {
        await expect(this.unassignValidationMsg).toBeVisible();
    }

    async selectOtherReason() {
        await this.openReasonDropdown();
        await this.unassignOtherOption.click();
    }

    async verifyCustomReasonInputVisible() {
        await expect(this.unassignCustomReasonInput).toBeVisible();
    }

    async verifyCustomReasonValidationMessage() {
        await expect(this.unassignCustomReasonValidationMsg).toBeVisible();
    }

        async fillCustomReason(reason) {
            await this.unassignCustomReasonInput.fill(reason);
        }

    async clickConfirmUnassign() {
        await this.confirmUnassignBtn.scrollIntoViewIfNeeded();
        await this.confirmUnassignBtn.highlight();
        await this.confirmUnassignBtn.click();
    }

    async clickConfirmUnassignLateDelivery() {
        await this.confirmUnassignBtn.scrollIntoViewIfNeeded();
        await this.confirmUnassignBtn.highlight();
        await expect(this.wastedJourneyTitle).toBeVisible();
        await this.confirmUnassignBtn.click();
    }
}
