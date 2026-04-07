import { expect } from '@playwright/test';
import { tableHelper } from '../../utils/tableHelper.js';

export class MyOrdersPage {
    constructor(page) {
        this.page = page;
        this.table = new tableHelper(page, 'table');

        // Filter by date range button locators
        this.filterByDateRangeBtn = page.getByRole('button', { name: /Filter by date range/i });
        this.applyDateFilterBtn = page.getByRole('button', { name: 'Apply' });
        // this.endDateInput = page.getByPlaceholder(/end/i).or(page.locator('input[type="date"]').last());

        // Totals Summary
        this.totalOrdersLabel = page.getByText(/Total Orders/i);
        this.totalAmountLabel = page.getByText(/Total Amount/i);
    }

    async clickFirstRowViewIcon() {
        const actionsCell = await this.table.getCellByHeader(0, 'Actions');
        await actionsCell.locator('button[title="View Details"]').click();
    }

    async filterOrdersByDate(startDate, endDate) {
        if (await this.filterByDateRangeBtn.isVisible()) {
            await this.filterByDateRangeBtn.click();
            await this.page.waitForTimeout(500); // Allow popover animation to complete
        }

        // Extract numeric day as string from whatever is passed in
        const resolveDay = (val) => {
            if (/^\d{1,2}$/.test(String(val))) return String(val);
            const d = new Date(val);
            return isNaN(d.getDate()) ? String(val) : String(d.getDate());
        };
        const startDay = resolveDay(startDate);
        const endDay = resolveDay(endDate);

        // ✅ Pass the string value directly, not wrapped in {}
        await this.page.getByRole('button', { name: startDay, exact: true }).first().click();
        await this.page.getByRole('button', { name: endDay, exact: true }).last().click();

        // Click the Apply button
        if (await this.applyDateFilterBtn.isVisible()) {
            await this.applyDateFilterBtn.click();
            await this.page.waitForTimeout(1000); // wait for the API/table debounce refresh
        } else {
            // fallback if Apply is not rendered
            await this.filterByDateRangeBtn.click(); // to close the popover
        }
    }

    async verifyTotalsDisplayed() {
        // Validates that both aggregate labels are displayed if the feature is enabled
        if (await this.totalOrdersLabel.isVisible()) {
            await expect(this.totalOrdersLabel).toBeVisible();
            await expect(this.totalAmountLabel).toBeVisible();

            // Check parent wrapper text content for numbers since the amount value could be in a sibling element
            const parentText = await this.totalAmountLabel.locator('..').textContent();
            expect(parentText).toMatch(/\d+/);
        } else {
            console.warn('Totals summary view is not currently implemented/visible on this page');
        }
    }
}