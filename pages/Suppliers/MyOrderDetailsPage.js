import { expect } from '@playwright/test';

export class MyOrderDetailsPage {
    constructor(page) {
        this.page = page;
        // Status Badge locator
        this.orderStatusBadge = page.locator('div, span').filter({ hasText: /^(Booked|In Progress|Requested Collection|Collected|Delivered|Refunded|Pending, New)$/i }).first();
        // Back to My Orders button locator
        this.backToMyOrdersBtn = page.getByText(/Back to My Orders/i);
        this.manageDeliveryBtn = page.getByRole('button', { name: /Manage Delivery/i });
        this.manageCollectionBtn = page.getByRole('button', { name: /Manage Collection/i });
        this.extraChargeableItemsBtn = page.getByRole('button', { name: /Extra Chargeable Items/i });
        this.moreOptionsBtn = page.locator('button:has(svg.lucide-more-vertical)');
        this.unassignFromOrderBtn = page.getByRole('button', { name: /Unassign from Order/i });

        // Unassign Modal Locators
        this.unassignModal = page.locator('div.max-w-md');
        this.unassignModalTitle = page.getByRole('heading', { name: 'Unassign from this order?', exact: true });
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

    // Unassign Modal Methods
    async verifyUnassignModalDisplayed() {
        await expect(this.unassignModal).toBeVisible();
        await expect(this.unassignModalTitle).toBeVisible();
    }

    async clickReasonDropdown() {
        await expect(this.unassignReasonDropdown).toBeVisible();
        await this.unassignReasonDropdown.click();
    }

    async verifyDropdownOptionsVisible() {
        await expect(this.unassignVehicleBreakdownOption).toBeVisible();
        await expect(this.unassignDriverAvailabilityOption).toBeVisible();
        await expect(this.unassignSiteAccessOption).toBeVisible();
        await expect(this.unassignPricingMistakeOption).toBeVisible();
        await expect(this.unassignOtherOption).toBeVisible();
    }

    async closeDropdownWithoutSelecting() {
        // await this.page.keyboard.press('Backspace');
        await this.unassignReasonDropdown.click();
    }

    async clickContinueToUnassign() {
        await this.unassignContinueBtn.click();
    }

    async verifyReasonValidationMessage() {
        await expect(this.unassignValidationMsg).toBeVisible();
    }

    async selectOtherReason() {
        await this.clickReasonDropdown();
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
}
