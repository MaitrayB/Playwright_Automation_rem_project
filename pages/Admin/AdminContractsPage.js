import { expect } from 'allure-playwright';
import { ensureCookieConsentDismissed } from '../../utils/cookieConsent.js';
import { genericFunctions } from '../../utils/genericFunctions.js';

/**
 * @typedef {import('@playwright/test').Page} Page
 * @typedef {import('@playwright/test').Locator} Locator
 */

export class AdminContractsPage {
    /** @param {Page} page */
    constructor(page) {
        this.page = page;
        this.pageHeading = page.getByRole('heading', { name: 'Contracts', exact: true });
        this.pageSubtitle = page.getByText('Commercial contract requests — from pricing to close');
        this.sidebarContractsLink = page.locator('a[href="/super-admin/contracts"]');
        this.sidebarNeedsPricingBadge = this.sidebarContractsLink.locator('span.bg-red-500');
        this.contractsTable = page.locator('table');
        this.tableHeaders = this.contractsTable.locator('th');
        this.tableRows = this.contractsTable.locator('tbody tr');
        this.footerCount = page.getByText(/\d+\s+requests?/i);
        this.emptyTitle = page.getByText('Nothing here', { exact: true });
        this.tabLabels = ['All', 'Needs pricing', 'Priced', 'Closed', 'Cancelled'];
        this.expectedColumns = [
            'From',
            'Customer',
            'Area',
            'Customer mentioned',
            'Waiting',
            'Status',
        ];
    }

    tab(label) {
        return this.page.getByRole('button', { name: label, exact: true });
    }

    async acceptCookiesIfVisible() {
        await ensureCookieConsentDismissed(this.page);
    }

    async gotoContractsPage() {
        const genFunctions = new genericFunctions(this.page);
        await this.page.goto(genFunctions.buildURL('/super-admin/contracts'), {
            waitUntil: 'domcontentloaded',
        });
        await this.acceptCookiesIfVisible();
        await expect(this.pageHeading).toBeVisible({ timeout: 30000 });
    }

    async verifyPageLayout() {
        await expect(this.pageHeading).toBeVisible();
        await expect(this.pageSubtitle).toBeVisible();
    }

    async isTabActive(label) {
        const className = (await this.tab(label).getAttribute('class')) || '';
        return className.includes('bg-[#0037C1]') && className.includes('text-white');
    }

    async verifyDefaultNeedsPricingTab() {
        expect(await this.isTabActive('Needs pricing')).toBeTruthy();
        const rowCount = await this.tableRows.count();
        expect(rowCount).toBeGreaterThan(0);
        await expect(this.tableRows.first().getByText('Awaiting pricing')).toBeVisible();
        await expect(this.tableRows.first().getByRole('button', { name: 'Price now' })).toBeVisible();
    }

    async verifySidebarNeedsPricingBadge() {
        await expect(this.sidebarNeedsPricingBadge).toBeVisible();
        const badgeText = (await this.sidebarNeedsPricingBadge.innerText()).trim();
        expect(Number(badgeText)).toBeGreaterThan(0);
        await expect(this.sidebarNeedsPricingBadge).toHaveClass(/bg-red-500/);
        return Number(badgeText);
    }

    async verifySidebarBadgeHiddenWhenZeroNeedsPricing() {
        await this.page.route('**/api/contract-requests/queue?status=submitted&limit=1*', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    data: [],
                    total: 0,
                    page: 1,
                    limit: 1,
                    totalPages: 0,
                }),
            });
        });

        await this.gotoContractsPage();
        await expect(this.sidebarNeedsPricingBadge).toHaveCount(0);
        await this.page.unroute('**/api/contract-requests/queue?status=submitted&limit=1*');
    }

    async verifyStatusTabs() {
        for (const label of this.tabLabels) {
            await expect(this.tab(label)).toBeVisible();
        }
    }

    async selectTab(label) {
        await this.tab(label).click();
        await expect.poll(async () => this.isTabActive(label)).toBeTruthy();
    }

    async verifyDesktopTableColumns() {
        await expect(this.contractsTable).toBeVisible();
        const headers = (await this.tableHeaders.allTextContents()).map((h) => h.trim()).filter(Boolean);
        for (const column of this.expectedColumns) {
            expect(headers).toContain(column);
        }
    }

    async verifyNeedsPricingActions() {
        await this.selectTab('Needs pricing');
        const firstRow = this.tableRows.first();
        await expect(firstRow.getByRole('button', { name: 'Price now' })).toBeVisible();
    }

    async verifyNonNeedsPricingActions() {
        for (const tab of ['Priced', 'Closed']) {
            await this.selectTab(tab);
            if ((await this.tableRows.count()) === 0) {
                continue;
            }
            await expect(this.tableRows.first().getByRole('button', { name: 'Open' })).toBeVisible();
            await expect(this.tableRows.first().getByRole('button', { name: 'Price now' })).toHaveCount(0);
        }
    }

    async verifyWaitingAndTermColumnsPresent() {
        await this.selectTab('Needs pricing');
        const firstRowText = await this.tableRows.first().innerText();
        expect(firstRowText).toMatch(/~\d+\s+months|—/);
        expect(firstRowText).toMatch(/\d+\s*(min|h|d|m)/i);
    }

    async verifyCustomerShowsCompanyWhenPresent() {
        await this.selectTab('Needs pricing');
        const companyRow = this.tableRows.filter({ hasText: /\[SEED\]|Ltd|Limited/i }).first();
        if ((await companyRow.count()) > 0) {
            const text = await companyRow.innerText();
            expect(text.split('\n').length).toBeGreaterThan(1);
        }
    }

    async verifyMobileCards() {
        await this.page.setViewportSize({ width: 390, height: 844 });
        await this.gotoContractsPage();
        await this.selectTab('Needs pricing');

        const card = this.page.locator('button', { hasText: /From /i }).first();
        await expect(card).toBeVisible({ timeout: 15000 });
        const text = await card.innerText();
        expect(text).toMatch(/From /);
        expect(text).toMatch(/~\d+\s+months|—/);
        expect(text).toMatch(/\d+\s*(min|h|d|m|ago)/i);

        // Restore to full available screen size for subsequent desktop tests
        const { width, height } = await this.page.evaluate(() => ({
            width: window.screen.availWidth,
            height: window.screen.availHeight,
        }));
        await this.page.setViewportSize({ width, height });
        await this.gotoContractsPage();
    }

    async verifySeesMultipleAgents() {
        await this.selectTab('Needs pricing');
        const fromCells = this.tableRows.locator('td').nth(0);
        // Collect agent names from first column across visible rows
        const names = new Set();
        const count = Math.min(await this.tableRows.count(), 20);
        for (let i = 0; i < count; i++) {
            const name = (await this.tableRows.nth(i).locator('td').first().innerText()).trim();
            if (name) names.add(name);
        }
        expect(names.size).toBeGreaterThan(1);
    }

    async verifyFooterCount() {
        await expect(this.footerCount.first()).toBeVisible();
        await expect(this.footerCount.first()).toHaveText(/\d+\s+requests?/i);
    }

    async verifyEmptyStateForTab(tabLabel) {
        const statusByTab = {
            All: null,
            'Needs pricing': 'submitted',
            Priced: 'priced',
            Closed: 'closed',
            Cancelled: 'cancelled',
        };
        const status = statusByTab[tabLabel];
        const expectedDescription =
            tabLabel === 'All'
                ? 'No contract requests yet.'
                : `No contract requests with status "${status}".`;

        await this.page.route('**/api/contract-requests/queue?**', async (route) => {
            const url = route.request().url();
            if (url.includes('limit=1')) {
                await route.continue();
                return;
            }

            const isAll = !url.includes('status=');
            const matchesTab =
                (tabLabel === 'All' && isAll) ||
                (status && url.includes(`status=${status}`));

            if (matchesTab) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        data: [],
                        total: 0,
                        page: 1,
                        limit: 50,
                        totalPages: 0,
                    }),
                });
                return;
            }
            await route.continue();
        });

        await this.gotoContractsPage();
        await this.selectTab(tabLabel);
        await expect(this.emptyTitle).toBeVisible({ timeout: 15000 });
        await expect(this.page.getByText(expectedDescription)).toBeVisible();
        await this.page.unroute('**/api/contract-requests/queue?**');
    }

    /**
     * Opens the first visible queue row via Price now / Open and returns summary fields.
     * @param {'Price now'|'Open'} actionLabel
     */
    async openFirstRequest(actionLabel = 'Price now') {
        await expect(this.tableRows.first()).toBeVisible({ timeout: 15000 });
        const firstRow = this.tableRows.first();
        const customerText = (await firstRow.locator('td').nth(1).innerText()).trim();
        const customerName = customerText.split('\n')[0].trim();
        const companyName = customerText.split('\n')[1]?.trim() || null;
        const agentName = (await firstRow.locator('td').first().innerText()).trim();
        const area = (await firstRow.locator('td').nth(2).innerText()).trim();
        const termText = (await firstRow.locator('td').nth(3).innerText()).trim();
        const termMonths = termText.match(/~(\d+)/)?.[1] || null;

        await Promise.all([
            this.page.waitForURL(/\/super-admin\/contracts\/\d+/, { timeout: 30000 }),
            firstRow.getByRole('button', { name: actionLabel }).click(),
        ]);
        await this.acceptCookiesIfVisible();

        return { customerName, companyName, agentName, area, termMonths };
    }
}
