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
}
