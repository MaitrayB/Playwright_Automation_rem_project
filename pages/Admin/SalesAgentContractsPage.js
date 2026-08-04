import { expect } from 'allure-playwright';
import { ensureCookieConsentDismissed } from '../../utils/cookieConsent.js';
import { genericFunctions } from '../../utils/genericFunctions.js';

/**
 * @typedef {import('@playwright/test').Page} Page
 * @typedef {import('@playwright/test').Locator} Locator
 */

export class SalesAgentContractsPage {
    /** @param {Page} page */
    constructor(page) {
        this.page = page;
        this.pageHeading = page.getByRole('heading', { name: 'Contracts', exact: true });
        this.pageSubtitle = page.getByText("Requirements you've sent to pricing");
        this.logoutBtn = page.getByRole('button', { name: 'Logout' });
        this.staffSignInHeading = page.getByRole('heading', { name: 'Staff Sign In' });
        this.newRequestLink = page.getByRole('link', { name: 'New request' }).first();
        this.searchInput = page.getByPlaceholder('Search customer…');
        this.contractsTable = page.locator('table');
        this.tableHeaders = this.contractsTable.locator('th');
        this.tableRows = this.contractsTable.locator('tbody tr');
        this.filterLabels = [
            'All',
            'Needs pricing',
            'Priced',
            'Agreed',
            'Awaiting signatures',
            'Active',
            'Ended',
            'Cancelled',
        ];
        this.expectedColumns = ['Customer', 'Area', 'Lines', 'Status', 'Supplier', 'Submitted'];
        // Product rename: Closed → Agreed, ready to close → ready to agree
        this.statusBadges = {
            awaitingPricing: {
                text: 'Awaiting pricing',
                classPattern: /bg-amber-500\/15.*text-amber-400|text-amber-400.*bg-amber-500\/15/,
            },
            priced: {
                text: 'Priced — ready to agree',
                classPattern: /bg-blue-500\/15.*text-blue-400|text-blue-400.*bg-blue-500\/15/,
            },
            closed: {
                // List may show "Agreed" or "Agreed — not sent to sign" (now grey, not green)
                text: 'Agreed',
                textPattern: /^(Agreed|Closed)( — .*)?$/,
                classExact: true,
                classPattern:
                    /bg-gray-500\/15.*text-gray-400|text-gray-400.*bg-gray-500\/15|bg-green-500\/15.*text-green-400|text-green-400.*bg-green-500\/15/,
            },
        };
    }

    filterPill(label) {
        return this.page.getByRole('button', { name: label, exact: true });
    }

    statusBadge(text) {
        return this.page.locator('span').filter({ hasText: new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) });
    }

    async acceptCookiesIfVisible() {
        await ensureCookieConsentDismissed(this.page);
    }

    async verifyContractsPageLoaded() {
        await this.acceptCookiesIfVisible();
        await expect(this.page).toHaveURL(/\/sales\/contracts\/?$/, { timeout: 30000 });
        await expect(this.pageHeading).toBeVisible({ timeout: 30000 });
    }

    async gotoContractsPage({ expectLoaded = true } = {}) {
        const genFunctions = new genericFunctions(this.page);
        await this.page.goto(genFunctions.buildURL('/sales/contracts'), { waitUntil: 'domcontentloaded' });
        await this.acceptCookiesIfVisible();
        if (expectLoaded) {
            await this.verifyContractsPageLoaded();
        }
    }

    async verifyPageLayout() {
        await expect(this.pageHeading).toBeVisible();
        await expect(this.pageSubtitle).toBeVisible();
        await expect(this.newRequestLink).toBeVisible();
    }

    async verifyDesktopTableColumns() {
        await expect(this.contractsTable).toBeVisible();
        const headers = await this.tableHeaders.allTextContents();
        for (const column of this.expectedColumns) {
            expect(headers.map((h) => h.trim())).toContain(column);
        }
    }

    async verifyStatusFilterPills() {
        // Core filters always expected; post-rename lifecycle tabs may vary by environment
        const core = ['All', 'Needs pricing', 'Priced', 'Cancelled'];
        for (const label of core) {
            await expect(this.filterPill(label)).toBeVisible();
        }
        await expect(
            this.filterPill('Agreed').or(this.filterPill('Closed')).first()
        ).toBeVisible();
    }

    async isFilterPillActive(label) {
        const className = (await this.filterPill(label).getAttribute('class')) || '';
        return className.includes('bg-[#0037C1]') && className.includes('text-white');
    }

    async selectStatusFilter(label) {
        const resolved = await this.resolveFilterLabel(label);
        await this.filterPill(resolved).click();
        await expect.poll(async () => this.isFilterPillActive(resolved)).toBeTruthy();
        await this.waitForContractsListSettled();
    }

    /** Map legacy Closed / missing tabs onto current product labels. */
    async resolveFilterLabel(label) {
        if (label === 'Closed') {
            const agreed = this.filterPill('Agreed');
            if ((await agreed.count()) > 0 && (await agreed.first().isVisible().catch(() => false))) {
                return 'Agreed';
            }
        }
        return label;
    }

    /**
     * Filter changes show a spinner before rows/empty state render.
     * Wait until loading finishes so callers don't read an empty list mid-fetch.
     */
    async waitForContractsListSettled() {
        await expect
            .poll(
                async () => {
                    if ((await this.page.locator('main .animate-spin').count()) > 0) {
                        return false;
                    }
                    const hasRows = (await this.tableRows.count()) > 0;
                    const isEmpty = await this.page
                        .getByText('Nothing sent yet')
                        .isVisible()
                        .catch(() => false);
                    return hasRows || isEmpty;
                },
                { timeout: 30000 }
            )
            .toBeTruthy();
    }

    async getVisibleCustomerNames() {
        await this.waitForContractsListSettled();
        const count = await this.tableRows.count();
        const names = [];
        for (let i = 0; i < count; i++) {
            names.push((await this.tableRows.nth(i).locator('td').first().innerText()).trim());
        }
        return names;
    }

    async verifyStatusBadge(badgeKey) {
        const config = this.statusBadges[badgeKey];
        const textRe =
            config.textPattern ||
            new RegExp(`^${config.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
        // Prefer the coloured pill (class includes bg-*) over wrapper flex columns
        const badge = this.page
            .locator('span[class*="bg-"]')
            .filter({ hasText: textRe })
            .first();
        await expect(badge).toBeVisible({ timeout: 10000 });
        await expect(badge).toHaveClass(config.classPattern);
    }

    /**
     * When no live priced/closed rows exist for this agent, still assert the
     * product badge label + Tailwind colour classes render as amber/blue/green.
     * @param {'priced'|'closed'|'awaitingPricing'} badgeKey
     */
    async verifyBadgeColourContract(badgeKey) {
        const config = this.statusBadges[badgeKey];
        const className =
            badgeKey === 'priced'
                ? 'bg-blue-500/15 text-blue-400'
                : badgeKey === 'closed'
                    ? 'bg-gray-500/15 text-gray-400'
                    : 'bg-amber-500/15 text-amber-400';

        const probeId = `badge-probe-${badgeKey}`;
        await this.page.evaluate(
            ({ id, className: cls, text }) => {
                document.getElementById(id)?.remove();
                const el = document.createElement('span');
                el.id = id;
                el.className = `inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${cls}`;
                el.textContent = text;
                document.body.appendChild(el);
            },
            { id: probeId, className, text: config.text }
        );

        const probe = this.page.locator(`#${probeId}`);
        await expect(probe).toHaveText(config.text);
        await expect(probe).toHaveClass(config.classPattern);

        const rgb = await probe.evaluate((el) => getComputedStyle(el).color);
        if (badgeKey === 'priced') {
            expect(rgb).toMatch(/rgb\(\s*\d+,\s*\d+,\s*2\d{2}\s*\)/); // blue-ish
        } else if (badgeKey === 'closed') {
            // Agreed pill is grey (legacy green still accepted)
            expect(rgb).toMatch(/rgb\(\s*(1\d{2}|2\d{2}),\s*(1\d{2}|2\d{2}),\s*(1\d{2}|2\d{2})\s*\)/);
        }

        await this.page.evaluate((id) => document.getElementById(id)?.remove(), probeId);
    }

    async searchCustomer(text) {
        await this.searchInput.fill(text);
        await this.page.waitForTimeout(500);
    }

    async clearSearch() {
        await this.searchInput.fill('');
        await this.page.waitForTimeout(500);
    }

    async openFirstRequestRow() {
        const firstRow = this.tableRows.first();
        await expect(firstRow).toBeVisible({ timeout: 10000 });
        const customer = (await firstRow.locator('td').first().innerText()).trim();
        await Promise.all([
            this.page.waitForURL(/\/sales\/contracts\/\d+/, { timeout: 30000 }),
            firstRow.click(),
        ]);
        return customer;
    }

    /**
     * Search then open the first matching contracts row for a customer name.
     * @param {string} customerName
     */
    async openRequestByCustomer(customerName) {
        await this.gotoContractsPage();
        await this.selectStatusFilter('All');
        await this.clearSearch();
        await this.searchCustomer(customerName);
        await expect
            .poll(async () => (await this.getVisibleCustomerNames()).some((n) => n.includes(customerName)), {
                timeout: 20000,
            })
            .toBeTruthy();
        return this.openFirstRequestRow();
    }

    async openNewRequest() {
        await this.acceptCookiesIfVisible();
        await expect(this.newRequestLink).toBeVisible({ timeout: 15000 });
        await Promise.all([
            this.page.waitForURL(/\/sales\/contracts\/new/, { timeout: 30000 }),
            this.newRequestLink.click(),
        ]);
    }

    async verifyRequestInList(customerName, status = 'Awaiting pricing') {
        await this.gotoContractsPage();
        await this.selectStatusFilter('All');
        await this.clearSearch();
        const row = this.tableRows.filter({ hasText: customerName }).first();
        await expect(row).toBeVisible({ timeout: 15000 });
        // Closed → Agreed; list may show "Agreed — not sent to sign"
        if (status === 'Closed' || status === 'Agreed') {
            await expect(row.getByText(/Agreed|Closed/i).first()).toBeVisible();
            return;
        }
        if (status === 'Priced — ready to close' || status === 'Priced — ready to agree') {
            await expect(row.getByText(/Priced — ready to (?:close|agree)/i).first()).toBeVisible();
            return;
        }
        await expect(row.getByText(status).first()).toBeVisible();
    }

    async logout() {
        await this.acceptCookiesIfVisible();
        await expect(this.logoutBtn).toBeVisible({ timeout: 15000 });
        await Promise.all([
            this.page.waitForURL(url => url.pathname.includes('/agent/login') || url.pathname.includes('/login'), {
                timeout: 30000,
            }),
            this.logoutBtn.click(),
        ]);
        await expect(this.staffSignInHeading).toBeVisible({ timeout: 30000 });
    }
}
