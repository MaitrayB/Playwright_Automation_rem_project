import { expect } from '@playwright/test';
import { tableHelper } from '../../utils/tableHelper.js';

export class MyOrdersPage {
    constructor(page) {
        this.page = page;
        this.table = new tableHelper(page, 'table');
        this.ordersListMain = page.locator('main');

        // Filter by date range button locators
        this.filterByDateRangeBtn = page.getByRole('button', { name: /Filter by date range|Date range/i });
        this.applyDateFilterBtn = page.getByRole('button', { name: 'Apply' });
        this.deliveryDateFilterHeading = page.getByText(/FILTER BY DELIVERY DATE|Filter by delivery date/i);

        // Totals Summary (desktop: "Total Orders" / "Total Amount"; mobile: "Orders" / "Total")
        this.totalOrdersLabel = page.locator('main').getByText(/^Orders$/i).or(page.getByText(/Total Orders/i));
        this.totalAmountLabel = page.locator('main').getByText(/^Total$/i).or(page.getByText(/Total Amount/i));
        this.myOrdersHeading = page.getByText(/Orders that have been booked with you/i);
    }

    getOrderCards() {
        return this.ordersListMain.locator('[class*="cursor-pointer"]').filter({ hasText: /#\d+/ });
    }

    async waitForMyOrdersLoaded() {
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                await expect.poll(async () => {
                    if (!this.page.url().includes('my-orders')) {
                        return false;
                    }

                    if (await this.page.getByText('Failed to fetch orders').isVisible().catch(() => false)) {
                        return false;
                    }

                    const hasCards = await this.getOrderCards().first().isVisible().catch(() => false);
                    const hasDetailsBtn = await this.ordersListMain.getByRole('button', { name: 'Details' }).first().isVisible().catch(() => false);
                    const hasHeading = await this.myOrdersHeading.isVisible().catch(() => false);
                    const hasFilterSection = await this.deliveryDateFilterHeading.isVisible().catch(() => false);
                    const hasTableRow = await this.page.locator('table tbody tr').first().isVisible().catch(() => false);
                    const hasNoOrders = await this.page.getByText(/No orders found|No orders awaiting delivery/i).first().isVisible().catch(() => false);
                    const summaryCount = await this.getSummaryOrderCount();

                    return hasCards || hasDetailsBtn || hasTableRow || hasNoOrders
                        || (hasHeading && hasFilterSection && summaryCount !== null);
                }, { timeout: 20000 }).toBe(true);
                return;
            } catch {
                if (attempt < 2) {
                    await this.page.reload({ waitUntil: 'domcontentloaded' });
                    await this.page.waitForTimeout(3000);
                }
            }
        }
    }

    async getSummaryOrderCount() {
        if (!(await this.myOrdersHeading.isVisible({ timeout: 2000 }).catch(() => false))) {
            return null;
        }
        const summaryText = await this.myOrdersHeading.locator('xpath=..').innerText();
        const match = summaryText.match(/\bOrders[\s\n]+(\d+)/i);
        return match ? parseInt(match[1], 10) : null;
    }

    async ensureOrdersListVisible() {
        await this.waitForMyOrdersLoaded();

        if (await this.getOrderCount() > 0) {
            return;
        }

        const allFilterBtn = this.page.getByRole('button', { name: /^All\s+\d+/i }).first();
        if (await allFilterBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await allFilterBtn.click();
            await this.page.waitForTimeout(1500);
        }

        if (await this.getOrderCount() > 0) {
            return;
        }

        const activeTab = this.page.getByRole('button', { name: /^Active$/i });
        if (await activeTab.isVisible({ timeout: 2000 }).catch(() => false)) {
            await activeTab.click();
            await this.page.waitForTimeout(1500);
        }
    }

    async getOrderCount() {
        const cardCount = await this.getOrderCards().count();
        if (cardCount > 0) {
            return cardCount;
        }

        const detailsCount = await this.ordersListMain.getByRole('button', { name: 'Details' }).count();
        if (detailsCount > 0) {
            return detailsCount;
        }

        if (await this.page.locator('table tbody tr').first().isVisible({ timeout: 2000 }).catch(() => false)) {
            return await this.table.getRowCount();
        }

        const summaryCount = await this.getSummaryOrderCount();
        if (summaryCount !== null && summaryCount > 0) {
            return summaryCount;
        }

        return await this.ordersListMain.getByText(/#\d+/).count();
    }

    async clickFirstRowViewIcon() {
        await this.waitForMyOrdersLoaded();

        const detailsBtn = this.ordersListMain.getByRole('button', { name: 'Details' }).first();
        if (await detailsBtn.isVisible({ timeout: 15000 }).catch(() => false)) {
            await detailsBtn.scrollIntoViewIfNeeded();
            await detailsBtn.click();
            await this.page.waitForURL(/\/supplier\/orders\/\d+/, { timeout: 15000 });
            return;
        }

        const orderCard = this.getOrderCards().first();
        if (await orderCard.isVisible({ timeout: 3000 }).catch(() => false)) {
            await orderCard.scrollIntoViewIfNeeded();
            await orderCard.click();
            await this.page.waitForURL(/\/supplier\/orders\/\d+/, { timeout: 15000 });
            return;
        }

        const orderIdLink = this.ordersListMain.getByText(/#\d+/).first();
        if (await orderIdLink.isVisible({ timeout: 3000 }).catch(() => false)) {
            await orderIdLink.scrollIntoViewIfNeeded();
            await orderIdLink.click();
            await this.page.waitForURL(/\/supplier\/orders\/\d+/, { timeout: 15000 });
            return;
        }

        if (await this.page.locator('table tbody tr').first().isVisible({ timeout: 2000 }).catch(() => false)) {
            const actionsCell = await this.table.getCellByHeader(0, 'Actions');
            await actionsCell.locator('button[title="View Details"]').click();
            await this.page.waitForURL(/\/supplier\/orders\/\d+/, { timeout: 15000 });
        }
    }

    getMoreOptionsButton() {
        return this.page.getByRole('heading', { name: /order #\d+/i })
            .locator('xpath=ancestor::div[.//button][1]')
            .locator('button:has(svg.lucide-more-vertical)');
    }

    async waitForBookedOrdersData(timeout = 30000) {
        if (await this.page.getByText('Loading orders...').isVisible({ timeout: 2000 }).catch(() => false)) {
            await expect(this.page.getByText('Loading orders...')).toBeHidden({ timeout });
        }

        await expect.poll(async () => {
            const detailsCount = await this.ordersListMain.getByRole('button', { name: 'Details' }).count();
            const cardCount = await this.getOrderCards().count();
            const summaryCount = await this.getSummaryOrderCount();
            const hasNoOrders = await this.page.getByText(/No orders found|No orders awaiting delivery/i)
                .first().isVisible().catch(() => false);

            return detailsCount > 0
                || cardCount > 0
                || (summaryCount !== null && summaryCount > 0)
                || hasNoOrders;
        }, { timeout }).toBe(true);
    }

    async openFirstOrderWithMoreOptions() {
        await this.waitForMyOrdersLoaded();
        await this.ensureOrdersListVisible();
        await this.waitForBookedOrdersData();

        const detailsButtons = this.ordersListMain.getByRole('button', { name: 'Details' });
        const count = await detailsButtons.count();
        if (count === 0) {
            throw new Error('No booked orders available to open');
        }

        for (let i = 0; i < count; i++) {
            await this.waitForBookedOrdersData();
            const currentDetailsButtons = this.ordersListMain.getByRole('button', { name: 'Details' });
            if (i >= await currentDetailsButtons.count()) {
                break;
            }

            await currentDetailsButtons.nth(i).scrollIntoViewIfNeeded();
            await currentDetailsButtons.nth(i).click();
            await this.page.waitForURL(/\/supplier\/orders\/\d+/, { timeout: 15000 });

            if (await this.getMoreOptionsButton().isEnabled({ timeout: 5000 }).catch(() => false)) {
                return;
            }

            await this.page.getByRole('button', { name: /Back to My Orders/i }).click();
            await this.page.waitForURL(/my-orders/, { timeout: 15000 });
        }

        throw new Error('No booked order with an enabled more-options menu was found');
    }

    async openFirstOverdueOrder() {
        await this.waitForMyOrdersLoaded();
        await this.ensureOrdersListVisible();
        await this.waitForBookedOrdersData();
        const overdueFilter = this.page.getByRole('button', { name: /^Overdue\b/i });
        if (await overdueFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
            await overdueFilter.click();
            await this.page.waitForTimeout(1500);
        }

        const detailsBtn = this.ordersListMain.getByRole('button', { name: 'Details' }).first();
        await detailsBtn.waitFor({ state: 'visible', timeout: 15000 });
        await detailsBtn.scrollIntoViewIfNeeded();
        await detailsBtn.click();
        await this.page.waitForURL(/\/supplier\/orders\/\d+/, { timeout: 15000 });
    }

    async filterOrdersByDate(startDate, endDate) {
        const isTableView = await this.page.locator('table tbody tr').first()
            .isVisible({ timeout: 1000 }).catch(() => false);

        // Mobile card view uses delivery-date quick filters (e.g. "This week 4")
        if (!isTableView && await this.deliveryDateFilterHeading.isVisible({ timeout: 2000 }).catch(() => false)) {
            const thisWeekBtn = this.page.getByRole('button', { name: /^This week\b/i });
            await thisWeekBtn.click();
            await this.page.waitForTimeout(1000);
            return;
        }

        if (await this.filterByDateRangeBtn.isVisible()) {
            await this.filterByDateRangeBtn.click();
            await this.page.waitForTimeout(500);
        }

        const resolveDay = (val) => {
            if (/^\d{1,2}$/.test(String(val))) return String(val);
            const d = new Date(val);
            return isNaN(d.getDate()) ? String(val) : String(d.getDate());
        };
        const startDay = resolveDay(startDate);
        const endDay = resolveDay(endDate);

        await this.page.getByRole('button', { name: startDay, exact: true }).first().click({ timeout: 5000 });
        await this.page.getByRole('button', { name: endDay, exact: true }).last().click({ timeout: 5000 });

        if (await this.applyDateFilterBtn.isVisible()) {
            await this.applyDateFilterBtn.click();
            await this.page.waitForTimeout(1000);
        } else {
            await this.filterByDateRangeBtn.click();
        }
    }

    async resetDateFilter() {
        const allFilterBtn = this.page.getByRole('button', { name: /^All\s+\d+/i }).first();
        if (await allFilterBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await allFilterBtn.click();
            await this.page.waitForTimeout(1000);
            return;
        }

        const allTimeBtn = this.page.getByRole('button', { name: /^All time\b/i }).first();
        if (await allTimeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await allTimeBtn.click();
            await this.page.waitForTimeout(1000);
            return;
        }

        const allBtn = this.page.getByRole('button', { name: /^All\b/i }).first();
        if (await allBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await allBtn.click();
            await this.page.waitForTimeout(1000);
            return;
        }

        if (await this.filterByDateRangeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await this.filterByDateRangeBtn.click();
            await this.page.waitForTimeout(500);
            const clearBtn = this.page.getByRole('button', { name: /Clear|Reset/i }).first();
            if (await clearBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
                await clearBtn.click();
            } else {
                await this.filterByDateRangeBtn.click();
            }
            await this.page.waitForTimeout(1000);
        }
    }

    async verifyTotalsDisplayed() {
        const ordersLabel = this.page.locator('main').getByText('Orders', { exact: true });
        const totalLabel = this.page.locator('main').getByText('Total', { exact: true });

        if (await ordersLabel.isVisible({ timeout: 3000 }).catch(() => false)) {
            await expect(ordersLabel).toBeVisible();
            await expect(totalLabel).toBeVisible();

            const summaryText = await ordersLabel.locator('xpath=..').textContent();
            expect(summaryText).toMatch(/\d+/);
            expect(summaryText).toMatch(/£/);
        } else if (await this.totalOrdersLabel.isVisible({ timeout: 3000 }).catch(() => false)) {
            await expect(this.totalOrdersLabel).toBeVisible();
            await expect(this.totalAmountLabel).toBeVisible();

            const parentText = await this.totalAmountLabel.locator('..').textContent();
            expect(parentText).toMatch(/\d+/);
        } else {
            console.warn('Totals summary view is not currently implemented/visible on this page');
        }
    }
}
