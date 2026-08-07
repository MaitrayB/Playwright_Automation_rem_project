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
        this.pageSubtitle = page.getByText(
            /Commercial contract requests — from pricing to (?:a live contract|close|agree)/i
        );
        this.sidebarContractsLink = page.locator('a[href="/super-admin/contracts"]');
        this.sidebarNeedsPricingBadge = this.sidebarContractsLink.locator('span.bg-red-500');
        this.contractsTable = page.locator('table');
        this.tableHeaders = this.contractsTable.locator('th');
        this.tableRows = this.contractsTable.locator('tbody tr');
        this.footerCount = page.getByText(/\d+\s+requests?/i);
        this.emptyTitle = page.getByText('Nothing here', { exact: true });
        // Product rename: Closed → Agreed (Closed still accepted via selectTab mapping)
        this.tabLabels = ['All', 'Needs pricing', 'Priced', 'Agreed', 'Cancelled'];
        this.expectedColumns = [
            'From',
            'Customer',
            'Site',
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
        // Session expiry lands on staff login
        if (/\/agent\/login|\/login/.test(this.page.url())) {
            throw new Error(
                'Admin session expired on /super-admin/contracts — re-login via ensureAdminSession / adminLogin before navigating'
            );
        }
        await expect(this.pageHeading).toBeVisible({ timeout: 30000 });
        try {
            await this.waitForContractsListSettled({ timeout: 45000 });
        } catch {
            // Occasional sticky spinner after long sessions — reload once
            await this.page.reload({ waitUntil: 'domcontentloaded' });
            await this.acceptCookiesIfVisible();
            await expect(this.pageHeading).toBeVisible({ timeout: 30000 });
            await this.waitForContractsListSettled({ timeout: 45000 });
        }
    }

    /**
     * Queue load/filter changes show a spinner before rows/empty state render.
     * Wait until loading finishes so callers don't read an empty list mid-fetch.
     * @param {{ timeout?: number }} [opts]
     */
    async waitForContractsListSettled({ timeout = 45000 } = {}) {
        await expect
            .poll(
                async () => {
                    if ((await this.page.locator('main .animate-spin').count()) > 0) {
                        return false;
                    }
                    const hasRows = (await this.tableRows.filter({ visible: true }).count()) > 0;
                    const isEmpty =
                        (await this.emptyTitle.isVisible().catch(() => false)) ||
                        (await this.page
                            .getByText(/^Nothing in\s+"/i)
                            .isVisible()
                            .catch(() => false)) ||
                        (await this.page
                            .getByText(/No contract requests/i)
                            .isVisible()
                            .catch(() => false));
                    const hasFooter = await this.footerCount
                        .first()
                        .isVisible()
                        .catch(() => false);
                    const hasTabs = await this.tab('All').isVisible().catch(() => false);
                    return hasRows || isEmpty || hasFooter || hasTabs;
                },
                { timeout }
            )
            .toBeTruthy();
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
        await this.waitForContractsListSettled();
        await expect.poll(async () => this.tableRows.count(), { timeout: 30000 }).toBeGreaterThan(0);
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
            if (label === 'Agreed') {
                await expect(this.tab('Agreed').or(this.tab('Closed')).first()).toBeVisible();
                continue;
            }
            await expect(this.tab(label)).toBeVisible();
        }
    }

    async selectTab(label) {
        await this.acceptCookiesIfVisible();
        const resolved = await this.resolveTabLabel(label);
        await this.tab(resolved).click();
        await expect.poll(async () => this.isTabActive(resolved)).toBeTruthy();
        await this.waitForContractsListSettled();
    }

    /** Closed → Agreed (and reverse if only legacy label is present). */
    async resolveTabLabel(label) {
        if (label === 'Closed' || label === 'Agreed') {
            const preferred = label === 'Closed' ? 'Agreed' : 'Agreed';
            const fallback = 'Closed';
            const preferredTab = this.tab(preferred);
            if (
                (await preferredTab.count()) > 0 &&
                (await preferredTab.first().isVisible().catch(() => false))
            ) {
                return preferred;
            }
            const legacy = this.tab(fallback);
            if ((await legacy.count()) > 0 && (await legacy.first().isVisible().catch(() => false))) {
                return fallback;
            }
        }
        return label;
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
        for (const tab of ['Priced', 'Agreed', 'Closed']) {
            const resolved = await this.resolveTabLabel(tab);
            // Skip duplicate tab when both Close/Agreed labels map to the same control
            if (tab === 'Closed' && resolved === 'Agreed') continue;
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

        // Restore a reliable desktop viewport. screen.avail* is often too small in
        // headless / maximized contexts and leaves the table CSS-hidden (md: breakpoint).
        await this.page.setViewportSize({ width: 1920, height: 1080 });
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
            Agreed: 'agreed',
            Closed: 'closed',
            Cancelled: 'cancelled',
        };
        const status = statusByTab[tabLabel];

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
        // Description is separate from the "Nothing here" heading
        if (tabLabel === 'All') {
            await expect(
                this.page.getByText('No contract requests yet.', { exact: true }).first()
            ).toBeVisible();
        } else {
            await expect(
                this.page
                    .getByText(new RegExp(`Nothing in\\s+"${tabLabel}"`, 'i'))
                    .or(
                        this.page.getByText(
                            new RegExp(`No contract requests with status\\s+"${status}"`, 'i')
                        )
                    )
                    .first()
            ).toBeVisible();
        }
        await this.page.unroute('**/api/contract-requests/queue?**');
    }

    /**
     * Opens the first visible queue row via Price now / Open and returns summary fields.
     * @param {'Price now'|'Open'} actionLabel
     */
    async openFirstRequest(actionLabel = 'Price now') {
        // Prefer visible desktop rows — a hidden <table> remains in the DOM on mobile.
        const firstRow = this.tableRows.filter({ visible: true }).first();
        await expect(firstRow).toBeVisible({ timeout: 15000 });
        return this._openRow(firstRow, actionLabel);
    }

    /**
     * Opens a queue row matching the customer name.
     * @param {string} customerName
     * @param {'Price now'|'Open'} [actionLabel]
     * @param {'All'|'Needs pricing'|'Priced'|'Agreed'|'Closed'|'Cancelled'} [tab]
     */
    async openRequestByCustomer(customerName, actionLabel = 'Price now', tab = 'Needs pricing') {
        await this.gotoContractsPage();
        await this.selectTab(tab);
        const row = this.tableRows.filter({ visible: true }).filter({ hasText: customerName }).first();
        await expect(row).toBeVisible({ timeout: 30000 });
        return this._openRow(row, actionLabel);
    }

    /**
     * @param {Locator} row
     * @param {'Price now'|'Open'} actionLabel
     */
    async _openRow(row, actionLabel) {
        const customerText = (await row.locator('td').nth(1).innerText()).trim();
        const customerName = customerText.split('\n')[0].trim();
        const companyName = customerText.split('\n')[1]?.trim() || null;
        const agentName = (await row.locator('td').first().innerText()).trim().split('\n')[0].trim();
        const area = (await row.locator('td').nth(2).innerText()).trim();
        const termText = (await row.locator('td').nth(3).innerText()).trim();
        const termMonths = termText.match(/~(\d+)/)?.[1] || null;

        await Promise.all([
            this.page.waitForURL(/\/super-admin\/contracts\/\d+/, { timeout: 30000 }),
            row.getByRole('button', { name: actionLabel }).click(),
        ]);
        await this.acceptCookiesIfVisible();

        return { customerName, companyName, agentName, area, termMonths };
    }
}
