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

        //  Search
        this.searchInput = page.getByPlaceholder(/search orders/i);

        // Order detail
        this.orderDetailHeading = page.getByRole('heading', { name: /order #\d+/i });
        this.bookedBadge = page.locator('text="Booked"');
        this.takeThisOrderBtn = page.getByRole('button', { name: /take this order/i, exact: true });
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
    // async verifyFirstRowDataFields() {
    //     await expect(this.table.getRowByIndex(0).locator('td').nth(0)).toContainText(/#\d+/);

    //     const addressText = await this.table.getRowByIndex(0).locator('td').nth(1).innerText();
    //     expect(addressText).toMatch(/[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}/i);

    //     await expect(this.table.getRowByIndex(0).locator('td').nth(2)).toContainText(/yarder skip/i);
    //     await expect(this.table.getRowByIndex(0).locator('td').nth(3)).toBeVisible();
    //     await expect(this.table.getRowByIndex(0).locator('td').nth(4)).toContainText(/\d{1,2}\s+[A-Za-z]{3}\s+\d{4}/);
    //     await expect(this.table.getRowByIndex(0).locator('td').nth(5)).toContainText(/\d+\s*days/i);
    //     await expect(this.table.getRowByIndex(0).locator('td').nth(7)).toContainText(/£[\d,.]+/);
    // }

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
}