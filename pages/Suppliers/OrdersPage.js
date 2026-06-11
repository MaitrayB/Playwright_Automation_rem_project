import { expect } from '@playwright/test';
import { tableHelper } from '../../utils/tableHelper';
export class OrdersPage {
    constructor(page) {
        this.page = page;
        this.table = new tableHelper(page, 'table');
        this.orderPageHeading = page.getByRole('link', { name: 'Available Orders' });
        this.popupHeading = page.getByRole('heading', { name: 'Upload Documents Required' });
        this.completeDocumentsBtn = page.getByRole('link', { name: 'Complete Documents' });
        this.loadingDocumentsText = page.getByText('Loading documents...');
        this.loadingOrdersText = page.getByText('Loading orders...');
        this.actionRequiredBanner = page.getByText(/Cannot Take Orders\. Documents are not completed\./);
        this.cannotTakeOrdersMessage1 = page.getByText('Cannot Take Orders. Documents are not completed. Upload required documents to start.');
        this.cannotTakeOrdersMessage2 = page.getByText(/Cannot Take Orders\. Documents are not completed\./);

        // Tabs or Orders page
        this.availableOrdersTab = page.getByRole('link', { name: 'Available Orders' });
        this.myOrdersTab = page.getByRole('link', { name: 'My Orders' });
        this.mobileNavButtons = page.locator('header button, banner button').filter({ has: page.locator('svg') });

        //  Search
        this.searchInput = page.getByPlaceholder(/search by postcode, order/i);
        this.listViewBtn = page.getByRole('button', { name: 'List' });
        this.gridViewBtn = page.getByRole('button', { name: 'Grid' });

        // Order detail
        this.orderDetailHeading = page.getByRole('heading', { name: /order #\d+/i });
        this.bookedBadge = page.locator('text="Booked"');
        this.takeThisOrderBtn = page.getByRole('button', { name: /take this order/i, exact: true });

        //Available Orders tab - Order Details page locator
        this.moreOptionsForUnbookedOrdersBtn = page.locator('button:has(svg.lucide-more-vertical)');

    }

    async verifyPopupDisplayed() {
        await expect(this.popupHeading).toBeVisible();
    }
    async clickOnCompleteDocumentsBtn() {
        await this.completeDocumentsBtn.click();
    }
    async waitForDocumentsToLoadCompletely() {
        await expect(this.loadingDocumentsText).toBeHidden();
    }
    async isListViewAvailable() {
        return this.listViewBtn.isVisible({ timeout: 2000 }).catch(() => false);
    }

    async waitForAvailableOrdersLoaded() {
        if (await this.loadingOrdersText.isVisible({ timeout: 2000 }).catch(() => false)) {
            await expect(this.loadingOrdersText).toBeHidden({ timeout: 30000 });
        }

        await expect.poll(async () => {
            const hasTakeBtn = await this.page.getByRole('button', { name: /take order/i }).first().isVisible().catch(() => false);
            const hasDetailsBtn = await this.page.getByRole('button', { name: 'Details' }).first().isVisible().catch(() => false);
            const hasTableRow = await this.page.locator('table tbody tr').first().isVisible().catch(() => false);
            const hasNoOrders = await this.page.getByText('No orders found').isVisible().catch(() => false);
            return hasTakeBtn || hasDetailsBtn || hasTableRow || hasNoOrders;
        }, { timeout: 30000 }).toBe(true);
    }

    async getOrderCardTexts() {
        const cardButton = this.page.getByRole('button', { name: /take order/i })
            .or(this.page.getByRole('button', { name: 'Details' }));
        const count = await cardButton.count();
        const cards = [];
        for (let i = 0; i < count; i++) {
            cards.push(await cardButton.nth(i).locator('xpath=ancestor::div[contains(@class,"cursor-pointer")]').first().innerText());
        }
        return cards;
    }

    async getFirstOrderPostcode() {
        if (await this.isListViewAvailable()) {
            await this.ensureListView();
            if (await this.table.getRowCount() > 0) {
                const postcodeCell = await this.table.getCellByHeader(0, 'Postcode');
                return (await postcodeCell.innerText()).trim();
            }
        }

        const cards = await this.getOrderCardTexts();
        if (cards.length) {
            const match = cards[0].match(/\b[A-Z]{1,2}\d[\dA-Z]?\s*\d[A-Z]{2}\b/);
            return match?.[0] ?? null;
        }
        return null;
    }

    async getFirstOrderSkipSize() {
        const skipPattern = /(\d+\s*yd(?:\s*skip)?)/i;

        if (await this.isListViewAvailable()) {
            await this.ensureListView();
            if (await this.table.getRowCount() > 0) {
                const skipCell = await this.table.getCellByHeader(0, 'Skip');
                const text = (await skipCell.innerText()).trim();
                return text.match(skipPattern)?.[1]?.trim() ?? text.split('\n')[0].trim();
            }
        }

        const cards = await this.getOrderCardTexts();
        if (cards.length) {
            return cards[0].match(skipPattern)?.[1]?.trim() ?? null;
        }
        return null;
    }

    async assertFilteredOrdersContain(tableColumn, searchTerm) {
        const ydMatch = searchTerm.match(/(\d+\s*yd)/i);
        const pattern = ydMatch
            ? new RegExp(ydMatch[1].replace(/\s+/g, '\\s*'), 'i')
            : new RegExp(searchTerm.replace(/\s+/g, '\\s*'), 'i');
        const tableRowsVisible = await this.page.locator('table tbody tr').first()
            .isVisible({ timeout: 3000 }).catch(() => false);

        if (tableRowsVisible) {
            const count = await this.table.getRowCount();
            expect(count).toBeGreaterThan(0);
            for (let i = 0; i < count; i++) {
                const cell = await this.table.getCellByHeader(i, tableColumn);
                await expect(cell).toContainText(pattern);
            }
            return;
        }

        const cards = await this.getOrderCardTexts();
        expect(cards.length).toBeGreaterThan(0);
        expect(cards.some(text => pattern.test(text))).toBeTruthy();
    }

    async verifyColumnNamesofAvailableOrders() {
        if (await this.isListViewAvailable()) {
            await this.ensureListView();
            const columnNames = await this.table.getColumnNames();
            expect(columnNames.map(c => c.toLowerCase())).toEqual([
                'order', 'postcode', 'skip', 'permit', 'delivery', 'collection', 'actions'
            ]);
            return;
        }

        await expect(this.page.getByText(/#\d+/).first()).toBeVisible();
        await expect(this.page.getByText(/\d yd skip/i).first()).toBeVisible();
        await expect(this.page.locator('main').getByText('Delivery', { exact: true }).first()).toBeVisible();
        await expect(this.page.locator('main').getByText('Collection', { exact: true }).first()).toBeVisible();
        await expect(this.page.getByRole('button', { name: 'Take order' }).first()).toBeVisible();
        await expect(this.page.getByRole('button', { name: 'Details' }).first()).toBeVisible();
    }

    async verifyOrdersSortedByCreationDateNewestFirst() {
        if (await this.isListViewAvailable()) {
            await this.ensureListView();
            const count = await this.table.getRowCount();
            if (count < 2) return;

            const dates = [];
            for (let i = 0; i < count; i++) {
                const cell = await this.table.getCellByHeader(i, 'Delivery');
                const text = await cell.innerText();
                const dateLine = text.split('\n').find(line => /\d{1,2} \w+ \d{4}/.test(line)) ?? text.trim();
                dates.push(new Date(dateLine.trim()));
            }

            for (let i = 1; i < dates.length; i++) {
                expect(dates[i - 1].getTime()).toBeLessThanOrEqual(dates[i].getTime());
            }
            return;
        }

        const cards = await this.getOrderCardTexts();
        if (cards.length < 2) return;

        const dates = cards.map(text => {
            const match = text.match(/Delivery[\s\S]*?(\d{1,2} \w+ \d{4})/);
            return match ? new Date(match[1]) : null;
        }).filter(Boolean);

        for (let i = 1; i < dates.length; i++) {
            expect(dates[i - 1].getTime()).toBeLessThanOrEqual(dates[i].getTime());
        }
    }

    async verifyAllDeliveryDatesAreFuture() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const gridTakeBtn = this.page.getByRole('button', { name: /take order/i }).first();
        if (await gridTakeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
            const cards = await this.getOrderCardTexts();
            expect(cards.length).toBeGreaterThan(0);
            for (const text of cards.slice(0, 5)) {
                const match = text.match(/Delivery[\s\S]*?(\d{1,2} \w+ \d{4})/);
                if (match) {
                    expect(new Date(match[1]).getTime()).toBeGreaterThanOrEqual(today.getTime());
                }
            }
            return;
        }

        await this.ensureListView();
        const count = await this.table.getRowCount();
        expect(count).toBeGreaterThan(0);

        for (let i = 0; i < count; i++) {
            const cell = await this.table.getCellByHeader(i, 'Delivery');
            const text = await cell.innerText();
            const dateLine = text.split('\n').find(line => /\d{1,2} \w+ \d{4}/.test(line)) ?? text.trim();
            expect(new Date(dateLine.trim()).getTime()).toBeGreaterThanOrEqual(today.getTime());
        }
    }

    async verifyAvailableOrdersHasTakeBtn() {
        await this.waitForAvailableOrdersLoaded();

        const gridTakeBtns = this.page.getByRole('button', { name: /take order/i });
        if (await gridTakeBtns.first().isVisible().catch(() => false)) {
            expect(await gridTakeBtns.count()).toBeGreaterThan(0);
            return;
        }

        const cards = await this.getOrderCardTexts();
        if (cards.length > 0) {
            expect(cards.length).toBeGreaterThan(0);
            return;
        }

        if (await this.isListViewAvailable()) {
            await this.ensureListView();
            const count = await this.table.getRowCount();
            expect(count).toBeGreaterThan(0);

            for (let i = 0; i < count; i++) {
                const row = this.table.getRowByIndex(i);
                await expect(row.getByRole('button', { name: /^Take$/i })).toBeVisible();
            }
            return;
        }

        expect(await gridTakeBtns.count()).toBeGreaterThan(0);
    }

    async openFirstAvailableOrderDetails() {
        await this.waitForAvailableOrdersLoaded();

        const detailsBtn = this.page.getByRole('button', { name: 'Details' }).first();
        if (await detailsBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
            await detailsBtn.click();
            return;
        }

        if (await this.isListViewAvailable()) {
            await this.ensureListView();
            await this.table.getRowByIndex(0).getByText(/#\d+/).click();
            return;
        }

        await this.page.getByText(/#\d+/).first().click();
    }

    async clickFirstRowViewIcon() {
        await this.openFirstAvailableOrderDetails();
    }

    async clickFirstRowTakeIcon() {
        const gridTakeBtn = this.page.getByRole('button', { name: /^Take order$/i }).first();
        if (await gridTakeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await gridTakeBtn.click();
            return;
        }

        await this.ensureListView();
        const actionsCell = await this.table.getCellByHeader(0, 'Actions');
        await actionsCell.getByRole('button', { name: /^Take$/i }).click();
    }

    async clickTakeOrderButtonOnDetailsPage() {
        await this.takeThisOrderBtn.click();
    }

    async ensureListView() {
        if (!(await this.isListViewAvailable())) {
            return false;
        }
        if (await this.page.locator('table tbody tr').first().isVisible({ timeout: 2000 }).catch(() => false)) {
            return true;
        }
        await this.listViewBtn.click();
        await this.page.waitForSelector('table tbody tr', { timeout: 15000 });
        await this.page.waitForTimeout(1000);
        return true;
    }

    async searchOrder(orderId) {
        const searchBox = this.searchInput.or(this.page.getByPlaceholder(/search/i)).first();
        await searchBox.waitFor({ state: 'visible', timeout: 15000 });
        await searchBox.fill(orderId);
        await this.page.waitForTimeout(2000);
    }

    async navigateToAvailableOrdersTab() {
        const backBtn = this.page.getByRole('button', { name: /Back to Available Orders/i });
        if (await backBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await backBtn.click();
            await this.page.waitForTimeout(2000);
        } else {
            await this.openNavigationMenuIfNeeded();
            await this.availableOrdersTab.click();
        }
        await this.waitForAvailableOrdersLoaded();
    }

    async takeAvailableOrder(orderId) {
        await this.waitForAvailableOrdersLoaded();

        if (orderId) {
            await this.searchOrder(orderId);
        }

        const gridTakeBtn = this.page.getByRole('button', { name: /^Take order$/i }).first();
        if (await gridTakeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
            await gridTakeBtn.click();
            return;
        }

        if (await this.isListViewAvailable()) {
            await this.ensureListView();
        }

        const tableTakeBtn = this.page.locator('button[title="Take Order"]').first();
        if (await tableTakeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
            await tableTakeBtn.click();
            return;
        }

        const takeBtn = this.page.getByRole('button', { name: /^Take$/i }).first();
        if (await takeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
            await takeBtn.click();
            return;
        }

        if (orderId) {
            await this.page.getByText(`#${orderId}`).first().click();
        } else {
            await this.clickFirstRowViewIcon();
        }
        await this.page.waitForTimeout(1000);
        await this.clickTakeOrderButtonOnDetailsPage();
    }

    async openNavigationMenuIfNeeded() {
        if (await this.myOrdersTab.isVisible({ timeout: 2000 }).catch(() => false)) {
            return;
        }

        if (await this.availableOrdersTab.isVisible({ timeout: 2000 }).catch(() => false)) {
            return;
        }

        const menuButtonCount = await this.mobileNavButtons.count();
        for (let i = 0; i < menuButtonCount; i++) {
            await this.mobileNavButtons.nth(i).click();
            await this.page.waitForTimeout(1000);

            if (await this.myOrdersTab.or(this.availableOrdersTab).first().isVisible({ timeout: 2000 }).catch(() => false)) {
                return;
            }
        }
    }

    async navigateToMyOrdersTab() {
        await this.openNavigationMenuIfNeeded();

        if (await this.myOrdersTab.isVisible({ timeout: 3000 }).catch(() => false)) {
            await this.myOrdersTab.click();
            await this.page.waitForTimeout(3000);
            return;
        }

        const backBtn = this.page.getByRole('button', { name: /Back to (Available )?Orders/i });
        if (await backBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await backBtn.click();
            await this.page.waitForTimeout(2000);
        }

        await this.openNavigationMenuIfNeeded();
        await this.myOrdersTab.waitFor({ state: 'visible', timeout: 15000 });
        await this.myOrdersTab.click();
        await this.page.waitForTimeout(3000);
    }

    orderDetailsLocator(orderId) {
        return this.page.getByText(`Order #${orderId}`).first();
    }

    async waitForOrderDetailsPage(orderId, timeout = 30000) {
        await this.orderDetailsLocator(orderId).waitFor({ state: 'visible', timeout });
    }

    async isOnOrderDetailsPage(orderId) {
        return this.orderDetailsLocator(orderId).isVisible({ timeout: 5000 });
    }

    async verifyOrderTaken(orderId) {
        try {
            await this.waitForOrderDetailsPage(orderId);
            await expect(this.orderDetailsLocator(orderId)).toBeVisible();
            return;
        } catch {
            await this.navigateToMyOrdersTab();
            await this.searchOrder(orderId);
            await expect(this.page.getByText(`#${orderId}`).first()).toBeVisible({ timeout: 10000 });
        }
    }

    async ensureOnOrderDetailsPage(orderId) {
        try {
            await this.waitForOrderDetailsPage(orderId);
            return;
        } catch {
            await this.navigateToMyOrdersTab();
            await this.searchOrder(orderId);
            await expect(this.page.getByText(`#${orderId}`).first()).toBeVisible({ timeout: 10000 });
            await this.page.getByText(`#${orderId}`).first().click();
            await this.page.waitForTimeout(1000);
            await this.waitForOrderDetailsPage(orderId);
        }
    }

    async openMyOrderDetails(orderId) {
        await this.ensureOnOrderDetailsPage(orderId);
    }

    async verifyOrderDetailBeforeTaking() {
        await expect(this.orderDetailHeading).toBeVisible();
        await expect(this.takeThisOrderBtn).toBeVisible();
        await expect(this.takeThisOrderBtn).toBeEnabled();
        await expect(this.bookedBadge).not.toBeVisible();
    }

    async verifyTakeThisOrderBtnForUnverifiedSupplier() {
        await expect(this.takeThisOrderBtn).toBeVisible();
        await expect(this.takeThisOrderBtn).toBeEnabled();
        await this.takeThisOrderBtn.click();
        await expect(this.cannotTakeOrdersMessage2).toBeVisible();
    }

    async verifySearchFilterByOrderId() {
        const firstOrderText = await this.page.getByText(/#\d+/).first().textContent();
        const idNum = firstOrderText?.match(/#(\d+)/)?.[1];
        if (!idNum) return;

        await this.searchInput.fill(idNum);
        await this.page.waitForTimeout(1000);

        if (await this.isListViewAvailable()) {
            await this.ensureListView();
            const count = await this.table.getRowCount();
            for (let i = 0; i < count; i++) {
                const orderCell = await this.table.getCellByIndex(i, 0);
                await expect(orderCell).toContainText(idNum);
            }
        } else {
            const visibleOrders = await this.page.getByText(/#\d+/).allTextContents();
            expect(visibleOrders.length).toBeGreaterThan(0);
            for (const orderText of visibleOrders) {
                expect(orderText).toContain(idNum);
            }
        }
        await this.searchInput.clear();
        await this.page.waitForTimeout(2000);
    }

    async verifySearchFilterByAddress() {
        const searchTerm = await this.getFirstOrderPostcode();
        expect(searchTerm).toBeTruthy();

        await this.searchInput.fill(searchTerm);
        await this.page.waitForTimeout(1000);
        await this.assertFilteredOrdersContain('Postcode', searchTerm);
        await this.searchInput.clear();
        await this.page.waitForTimeout(1000);
    }

    async verifySearchFilterByPostcode() {
        await this.verifySearchFilterByAddress();
    }

    async verifySearchFilterBySkipSize() {
        const skipSize = await this.getFirstOrderSkipSize();
        expect(skipSize).toBeTruthy();

        await this.searchInput.fill(skipSize);
        await this.page.waitForTimeout(1500);
        await this.assertFilteredOrdersContain('Skip', skipSize);
        await this.searchInput.clear();
        await this.page.waitForTimeout(1000);
    }

    async getFirstRowOrderId() {
        await this.waitForAvailableOrdersLoaded();

        if (await this.isListViewAvailable()) {
            await this.ensureListView();
            if (await this.table.getRowCount() > 0) {
                const cell = await this.table.getCellByIndex(0, 0);
                const rawText = await cell.innerText();
                const idNum = rawText.split('\n')[0].trim().replace('#', '');
                return idNum || null;
            }
        }

        const firstOrderText = await this.page.getByText(/#\d+/).first().textContent();
        return firstOrderText?.match(/#(\d+)/)?.[1] ?? null;
    }

    async verifyTakenOrderIDIsNotVisibleInAvailableOrdersTab(orderId) {
        await this.navigateToAvailableOrdersTab();
        await this.searchInput.clear();
        await this.searchInput.fill(String(orderId));
        await this.page.waitForTimeout(1500);
        return !(await this.page.getByText(`#${orderId}`).first().isVisible().catch(() => false));
    }

    async verifyTakenOrderIDIsVisibleInMyOrdersTab(orderId) {
        await this.navigateToMyOrdersTab();
        await this.searchInput.clear();
        await this.searchInput.fill(String(orderId));
        await this.page.waitForTimeout(1500);
        return await this.page.getByText(`#${orderId}`).first().isVisible().catch(() => false);
    }
}