import { expect } from '@playwright/test';
import { tableHelper } from '../../utils/tableHelper';
export class OrdersPage {
    constructor(page) {
        this.page = page;
        this.table = new tableHelper(page, 'table');
        this.orderPageHeading = page.getByRole('heading', { name: 'Orders' });
        this.popupHeading = page.getByRole('heading', { name: 'Upload Documents Required' });
        this.completeDocumentsBtn = page.getByRole('link', { name: 'Complete documents' });
        this.loadingDocumentsText = page.getByText('Loading documents...');
        this.actionRequiredBanner = page.getByRole('heading', { name: 'Action Required' });
        this.cannotTakeOrdersMessage1 = page.getByText('Cannot Take Orders. Documents are not completed. You need to upload and have your required documents (Waste Carrier License & Public Liability Insurance) approved before you can take orders.');
        this.cannotTakeOrdersMessage2 = page.getByText('Cannot Take Orders. Documents are not completed. You need to upload your documents and be verified before you can take orders.');

        // Tabs or Orders page
        this.availableOrdersTab = page.getByRole('link', { name: 'Available Orders' });
        this.myOrdersTab = page.getByRole('link', { name: 'My Orders' });
        this.mobileNavButtons = page.locator('header button, banner button').filter({ has: page.locator('svg') });

        //  Search
        this.searchInput = page.getByPlaceholder(/search orders/i);

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
    async verifyColumnNamesofAvailableOrders() {
        const columnNames = await this.table.getColumnNames();
        expect(columnNames.map(c => c.toLowerCase())).toEqual([
            'order', 'address / postcode', 'skip size', 'permit',
            'delivery date', 'days to delivery', 'days to collection',
            'your price', 'actions'
        ]);
    }

    async verifyOrdersSortedByCreationDateNewestFirst() {
        const count = await this.table.getRowCount();
        if (count < 2) return;

        const dates = [];
        for (let i = 0; i < count; i++) {
            const cell = await this.table.getCellByIndex(i, 0);
            const text = await cell.innerText();
            dates.push(new Date(text.trim()));
        }

        for (let i = 1; i < dates.length; i++) {
            expect(dates[i - 1].getTime()).toBeGreaterThanOrEqual(dates[i].getTime());
        }
    }

    async verifyAllDeliveryDatesAreFuture() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await this.page.waitForSelector('table'); // Ensure table is loaded
        const count = await this.table.getRowCount();
        expect(count).toBeGreaterThan(0);

        for (let i = 0; i < count; i++) {
            const cell = await this.table.getCellByHeader(i, 'Delivery Date');
            const text = await cell.innerText();
            expect(new Date(text.trim()).getTime()).toBeGreaterThanOrEqual(today.getTime());
        }
    }

    async verifyAvailableOrdersHasTakeBtn() {
        await this.page.waitForSelector('table'); // Ensure table is loaded
        const count = await this.table.getRowCount();
        expect(count).toBeGreaterThan(0);

        for (let i = 0; i < count; i++) {
            const row = this.table.getRowByIndex(i);
            await expect(row.getByRole('button', { name: /take/i })).toBeVisible();
        }
    }

    async clickFirstRowViewIcon() {
        const actionsCell = await this.table.getCellByHeader(0, 'Actions');
        await actionsCell.locator('button[title="View Details"]').click();
    }

    async clickFirstRowTakeIcon() {
        const actionsCell = await this.table.getCellByHeader(0, 'Actions');
        await actionsCell.locator('button[title="Take Order"]').click();
    }

    async clickTakeOrderButtonOnDetailsPage() {
        await this.takeThisOrderBtn.click();
    }

    async ensureListView() {
        const listViewBtn = this.page.getByRole('button', { name: 'List' });
        if (await listViewBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await listViewBtn.click();
            await this.page.waitForTimeout(2000);
        }
    }

    async searchOrder(orderId) {
        const searchBox = this.searchInput.or(this.page.getByPlaceholder(/search/i)).first();
        await searchBox.waitFor({ state: 'visible', timeout: 15000 });
        await searchBox.fill(orderId);
        await this.page.waitForTimeout(2000);
    }

    async takeAvailableOrder(orderId) {
        await this.ensureListView();

        if (orderId) {
            await this.searchOrder(orderId);
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
        await expect(this.page.getByTitle('You must accept the Supplier')).toBeVisible();
    }

    async verifySearchFilterByOrderId() {
        const cell = await this.table.getCellByIndex(0, 0);
        const text = await cell.innerText();
        const idNum = text.match(/#(\d+)/)?.[1];
        if (!idNum) return;

        await this.searchInput.fill(idNum);
        await this.page.waitForTimeout(400); // debounce

        const count = await this.table.getRowCount();
        for (let i = 0; i < count; i++) {
            const orderCell = await this.table.getCellByIndex(i, 0);
            await expect(orderCell).toContainText(idNum);
        }
        await this.searchInput.clear();
    }

    async verifySearchFilterByAddress() {
        const cell = await this.table.getCellByHeader(0, 'Address / Postcode');
        const text = await cell.innerText();
        // Extract street address (first line) e.g. "80 Anyards Road, Cobham"
        const address = text.trim().split('\n')[0].trim();
        if (!address) return;

        await this.searchInput.fill(address);
        await this.page.waitForTimeout(400); // debounce

        const count = await this.table.getRowCount();
        for (let i = 0; i < count; i++) {
            const addressCell = await this.table.getCellByHeader(i, 'Address / Postcode');
            await expect(addressCell).toContainText(address);
        }
        await this.searchInput.clear();
    }

    async verifySearchFilterByPostcode() {
        const cell = await this.table.getCellByHeader(0, 'Address / Postcode');
        const text = await cell.innerText();
        // Extract postcode (second line) e.g. "KT11 2LG"
        const postcode = text.trim().split('\n').pop().trim();
        if (!postcode) return;

        await this.searchInput.fill(postcode);
        await this.page.waitForTimeout(400); // debounce

        const count = await this.table.getRowCount();
        for (let i = 0; i < count; i++) {
            const addressCell = await this.table.getCellByHeader(i, 'Address / Postcode');
            await expect(addressCell).toContainText(postcode);
        }
        await this.searchInput.clear();
    }

    async verifySearchFilterBySkipSize() {
        const cell = await this.table.getCellByHeader(0, 'Skip Size');
        const skipSize = (await cell.innerText()).trim();
        if (!skipSize) return;

        await this.searchInput.fill(skipSize);
        await this.page.waitForTimeout(400); // debounce

        const count = await this.table.getRowCount();
        for (let i = 0; i < count; i++) {
            const skipCell = await this.table.getCellByHeader(i, 'Skip Size');
            await expect(skipCell).toContainText(skipSize);
        }
        await this.searchInput.clear();
    }

    async getFirstRowOrderId() {
        try {
            await this.page.waitForSelector('table.w-full tbody tr', {
                state: 'visible',
                timeout: 10000
            });

            const tbleHelper = new tableHelper(this.page, '.w-full');
            const cell = await tbleHelper.getCellByIndex(0, 0);

            await cell.waitFor({ state: 'visible', timeout: 5000 }); // ← key fix

            const rawText = await cell.innerText();
            const idNum = rawText.split('\n')[0].trim().replace('#', '');
            console.log("First Row ORDER_ID:", idNum);
            return idNum || null;
        } catch (error) {
            console.error("getFirstRowOrderId error:", error);
            return null;
        }
    }

    async verifyTakenOrderIDIsNotVisibleInAvailableOrdersTab(orderId) {
        try {
            const tbleHelper = new tableHelper(this.page, 'w-full');
            const count = await tbleHelper.getRowCount();
            for (let i = 0; i < count; i++) {
                const cell = await tbleHelper.getCellByIndex(i, 0);
                const text = await cell.innerText();
                if (text.includes(`#${orderId}`)) {
                    return false;
                }
            }
            return true;
        }
        catch (error) { return false; }
    }

    async verifyTakenOrderIDIsVisibleInMyOrdersTab(orderId) {
        try {
            await this.myOrdersTab.click();
            const tbleHelper = new tableHelper(this.page, 'w-full');
            const count = await tbleHelper.getRowCount();
            for (let i = 0; i < count; i++) {
                const cell = await tbleHelper.getCellByIndex(i, 0);
                const text = await cell.innerText();
                if (text.includes(`#${orderId}`)) {
                    return true;
                }
            }
            return false;
        }
        catch (error) { return false; }
    }
}