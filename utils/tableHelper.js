export class tableHelper {
    constructor(page, tableSelector) {
        this.page = page;
        this.table = page.locator(tableSelector);
        this.headers = this.table.locator('thead tr th');
        this.rows = this.table.locator('tbody tr');
    }

    //Get total row count
    async getRowCount() {
        return await this.rows.count();
    }

    //Get total column count
    async getColumnCount() {
        return await this.headers.count();
    }

    //Get row by index(0 based)
    getRowByIndex(rowIndex) {
        return this.rows.nth(rowIndex);
    }

    //Get row by matching text in any cell
    getRowByText(text) {
        return this.rows.filter({ hasText: text }).first();
    }

    //Get column index by header name
    async getColumnIndexByHeader(headerName) {
        const headers = this.page.locator('thead th');

        // ✅ wait until headers are visible
        await headers.first().waitFor({ state: 'visible' });

        const count = await headers.count();

        for (let i = 0; i < count; i++) {
            const text = (await headers.nth(i).innerText()).trim();

            if (text.toLowerCase() === headerName.toLowerCase()) {
                return i;
            }
        }

        const allHeaders = await headers.allTextContents();
        throw new Error(
            `Column "${headerName}" not found. Available headers: ${allHeaders.join(', ')}`
        );
    }

    //Get cell value by row index and column name
    async getCellByIndex(rowIndex, colIndex) {
        return this.getRowByIndex(rowIndex).locator('td').nth(colIndex);
    }

    // Get cell by row index & column header name
    async getCellByHeader(rowIndex, headerName) {
        const colIndex = await this.getColumnIndexByHeader(headerName);
        return this.getCellByIndex(rowIndex, colIndex);
    }

    // Get cell by row text & column header
    async getCellByRowTextAndHeader(rowText, headerName) {
        const row = this.getRowByText(rowText);
        const colIndex = await this.getColumnIndexByHeader(headerName);
        //console.log(`getCellByRowTextAndHeader: Row with text "${rowText}" found. Column "${headerName}" is at index ${colIndex}.`);
        return row.locator('td').nth(colIndex);
    }

    // Click the 3-dots menu in a row
    async openActionMenu(rowText, actionColumnHeader = 'ACTIONS') {
        const actionCell = await this.getCellByRowTextAndHeader(
            rowText,
            actionColumnHeader
        );

        // Try common selectors for 3-dot button
        const menuButton = actionCell.locator(
            'button, [aria-label*="menu"], [aria-label*="More"], svg'
        ).last();

        await menuButton.click();
    }

    // Click specific option from opened menu
    async clickActionOption(optionText) {
        // Works even if menu is rendered outside table (portal)
        const option = this.page.locator('role=menuitem', {
            hasText: optionText,
        }).or(this.page.locator(`text=${optionText}`));

        await option.first().click();
    }

    // One-line action performer
    async performRowAction(rowText, actionName) {
        await this.openActionMenu(rowText);
        await this.clickActionOption(actionName);
    }
}