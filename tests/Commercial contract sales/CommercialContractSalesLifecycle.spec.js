import { test, expect } from '../../fixtures/test.js';
import { AdminLogin } from '../../pages/Admin/AdminLogin.js';
import { AdminContractsPage } from '../../pages/Admin/AdminContractsPage.js';
import { AdminContractPricingPage } from '../../pages/Admin/AdminContractPricingPage.js';
import { SalesAgentContractsPage } from '../../pages/Admin/SalesAgentContractsPage.js';
import { SalesAgentNewContractRequestPage } from '../../pages/Admin/SalesAgentNewContractRequestPage.js';
import { TestData } from '../../Data/testData.js';
import { genericFunctions } from '../../utils/genericFunctions.js';

/** @type {import('@playwright/test').BrowserContext} */ let context;
/** @type {import('@playwright/test').Page} */ let page;
/** @type {AdminLogin} */ let adminLogin;
/** @type {SalesAgentContractsPage} */ let contractsPage;
/** @type {SalesAgentNewContractRequestPage} */ let newRequestPage;
/** @type {genericFunctions} */ let genFunctions;

/** Customer created in this run for list/search/detail assertions */
let seededCustomerName = '';

test.describe('Commercial Contract Sales Lifecycle', () => {
    test.describe.configure({ mode: 'serial' });
    test.setTimeout(240000);

    test.beforeAll(async ({ browser }, testInfo) => {
        context = await browser.newContext({
            ...testInfo.project.use,
            httpCredentials: {
                username: TestData.authCredentials.authUserName,
                password: TestData.authCredentials.authPassword,
            },
            ignoreHTTPSErrors: true,
            // null + --start-maximized (playwright.config) = full window
            viewport: null,
        });
        page = await context.newPage();
        adminLogin = new AdminLogin(page);
        contractsPage = new SalesAgentContractsPage(page);
        newRequestPage = new SalesAgentNewContractRequestPage(page);
        genFunctions = new genericFunctions(page);

        await adminLogin.goto(genFunctions.buildURL('/agent/login'));
        await adminLogin.salesAgentLogin(
            TestData.credentials.salesAgent.username,
            TestData.credentials.salesAgent.password
        );
        await contractsPage.verifyContractsPageLoaded();

        // Seed one request so list/search/status assertions have data
        seededCustomerName = `QA Contracts ${Date.now()}`;
        await newRequestPage.gotoNewRequestPage();
        await newRequestPage.submitValidRequest({
            customer: seededCustomerName,
            area: 'B29',
            qty: 2,
            size: '8',
        });
        await contractsPage.gotoContractsPage();
    });

    test.afterAll(async () => {
        await context?.close();
    });

    test.describe('2 — Contracts List', () => {
        test('AC-2.1: Page layout and desktop table columns', async () => {
            await contractsPage.gotoContractsPage();

            // AC-2.1.1
            await contractsPage.verifyPageLayout();

            // AC-2.1.2
            await contractsPage.verifyDesktopTableColumns();
        });

        test('AC-2.2: Status filter pills filter the list and highlight the active pill', async () => {
            await contractsPage.gotoContractsPage();

            // AC-2.2.1
            await contractsPage.verifyStatusFilterPills();

            // AC-2.2.2 — Needs pricing shows awaiting requests and highlights the pill
            await contractsPage.selectStatusFilter('Needs pricing');
            expect(await contractsPage.isFilterPillActive('Needs pricing')).toBeTruthy();
            const needsPricingCustomers = await contractsPage.getVisibleCustomerNames();
            expect(needsPricingCustomers.length).toBeGreaterThan(0);
            await expect(contractsPage.statusBadge('Awaiting pricing').first()).toBeVisible();

            await contractsPage.selectStatusFilter('Priced');
            expect(await contractsPage.isFilterPillActive('Priced')).toBeTruthy();
            for (const name of await contractsPage.getVisibleCustomerNames()) {
                await expect(
                    page.locator('tbody tr', { hasText: name }).getByText('Awaiting pricing')
                ).toHaveCount(0);
            }

            // AC-2.2.3
            await contractsPage.selectStatusFilter('All');
            expect(await contractsPage.isFilterPillActive('All')).toBeTruthy();
            const allCustomers = await contractsPage.getVisibleCustomerNames();
            expect(allCustomers).toContain(seededCustomerName);
            expect(allCustomers.length).toBeGreaterThanOrEqual(needsPricingCustomers.length);
        });

        test('AC-2.3: Status badges use the correct label and colour classes', async () => {
            await contractsPage.gotoContractsPage();
            await contractsPage.selectStatusFilter('All');

            // AC-2.3.1 — amber "Awaiting pricing"
            await contractsPage.verifyStatusBadge('awaitingPricing');

            // AC-2.3.2 / AC-2.3.3 — when priced/closed rows exist, verify blue/green badges
            await contractsPage.selectStatusFilter('Priced');
            if ((await contractsPage.tableRows.count()) > 0) {
                await contractsPage.verifyStatusBadge('priced');
            } else {
                await expect(page.getByText('Nothing sent yet')).toBeVisible();
                await contractsPage.verifyBadgeColourContract('priced');
            }

            await contractsPage.selectStatusFilter('Closed');
            if ((await contractsPage.tableRows.count()) > 0) {
                await contractsPage.verifyStatusBadge('closed');
            } else {
                await expect(page.getByText('Nothing sent yet')).toBeVisible();
                await contractsPage.verifyBadgeColourContract('closed');
            }

            await contractsPage.selectStatusFilter('All');
        });

        test('AC-2.4: Search filters by customer name (partial, case-insensitive)', async () => {
            await contractsPage.gotoContractsPage();
            await contractsPage.selectStatusFilter('All');

            // AC-2.4.1
            await expect(contractsPage.searchInput).toBeVisible();
            await expect(contractsPage.searchInput).toHaveAttribute('placeholder', 'Search customer…');

            // AC-2.4.2
            const partial = seededCustomerName.slice(0, 8).toLowerCase();
            await contractsPage.searchCustomer(partial);
            const matched = await contractsPage.getVisibleCustomerNames();
            expect(matched.length).toBeGreaterThan(0);
            expect(matched.every((name) => name.toLowerCase().includes(partial))).toBeTruthy();

            await contractsPage.searchCustomer('zzz-no-match-xyz');
            await expect(contractsPage.tableRows).toHaveCount(0);

            await contractsPage.clearSearch();
            expect(await contractsPage.getVisibleCustomerNames()).toContain(seededCustomerName);
        });

        test('AC-2.5.1: Sales agent only sees their own submitted requests', async () => {
            await contractsPage.gotoContractsPage();
            await contractsPage.selectStatusFilter('All');
            await contractsPage.clearSearch();

            // Other agents' known customers must not appear in this agent's list
            await expect(page.getByText('AC Test Customer', { exact: true })).toHaveCount(0);
            await expect(page.getByText(/List Status Customer/)).toHaveCount(0);

            // Own seeded request is visible
            expect(await contractsPage.getVisibleCustomerNames()).toContain(seededCustomerName);
        });

        test('AC-2.7: Row opens detail; New request opens capture page', async () => {
            await contractsPage.gotoContractsPage();
            await contractsPage.selectStatusFilter('All');
            await contractsPage.clearSearch();
            await contractsPage.searchCustomer(seededCustomerName);

            // AC-2.7.1
            const openedCustomer = await contractsPage.openFirstRequestRow();
            expect(openedCustomer).toContain(seededCustomerName.slice(0, 10));
            await expect(page).toHaveURL(/\/sales\/contracts\/\d+/);
            await expect(page.getByRole('heading', { name: seededCustomerName })).toBeVisible({ timeout: 15000 });

            // AC-2.7.2
            await contractsPage.gotoContractsPage();
            await contractsPage.openNewRequest();
            await expect(page).toHaveURL(/\/sales\/contracts\/new/);
            await expect(newRequestPage.pageTitle).toBeVisible();
        });
    });

    test.describe('3 — New Contract Request (Capture)', () => {
        test('AC-3.1 & 3.2: Page layout and customer fields', async () => {
            await newRequestPage.gotoNewRequestPage();

            // AC-3.1.1
            await newRequestPage.verifyPageLayout();

            // AC-3.2.1
            await newRequestPage.verifyCustomerFields();

            // AC-3.2.2
            await newRequestPage.verifyRoughTermField();

            // AC-3.5.4
            await newRequestPage.verifyNoEditableAgentNameField();
        });

        test('AC-3.3: Requirement lines — options, defaults, add, remove, reset, qty validation', async () => {
            await newRequestPage.gotoNewRequestPage();

            // AC-3.3.1
            await expect(newRequestPage.qtyInput(0)).toBeVisible();
            await expect(newRequestPage.sizeSelect(0)).toBeVisible();
            await expect(newRequestPage.wasteTypeSelect(0)).toBeVisible();
            await newRequestPage.verifySizeAndWasteOptions(0);

            // AC-3.3.2
            await newRequestPage.verifyRequirementLineDefaults(0);

            // AC-3.3.3
            await expect(await newRequestPage.getRequirementLineCount()).toBe(1);
            await newRequestPage.addRequirementLine();
            await expect(await newRequestPage.getRequirementLineCount()).toBe(2);
            await newRequestPage.verifyRequirementLineDefaults(1);

            // AC-3.3.4
            await newRequestPage.setLineQty(0, 3);
            await newRequestPage.setLineQty(1, 5);
            await newRequestPage.removeRequirementLine(0);
            await expect(await newRequestPage.getRequirementLineCount()).toBe(1);
            await expect(newRequestPage.qtyInput(0)).toHaveValue('5');

            // AC-3.3.5
            await newRequestPage.setLineQty(0, 4);
            await newRequestPage.setLineSize(0, '14');
            await newRequestPage.wasteTypeSelect(0).selectOption('Timber');
            await newRequestPage.removeRequirementLine(0);
            await expect(await newRequestPage.getRequirementLineCount()).toBe(1);
            await newRequestPage.verifyRequirementLineDefaults(0);

            // AC-3.3.6
            await newRequestPage.fillRequiredCustomerFields({
                customer: 'Qty Validation Customer',
                area: 'B29',
            });
            await newRequestPage.clickSendToPricing();
            await expect(page).toHaveURL(/\/sales\/contracts\/new/);
            await expect(newRequestPage.qtyRequiredMessage).toBeVisible();
        });

        test('AC-3.4: Deposit warning for 20yd / 40yd lines', async () => {
            await newRequestPage.gotoNewRequestPage();

            // AC-3.4.2
            await newRequestPage.setLineSize(0, '8');
            await expect(newRequestPage.depositWarning).toBeHidden();

            // AC-3.4.1
            await newRequestPage.setLineSize(0, '20');
            await expect(newRequestPage.depositWarning).toBeVisible();
            await newRequestPage.setLineSize(0, '8');
            await expect(newRequestPage.depositWarning).toBeHidden();
            await newRequestPage.setLineSize(0, '40');
            await expect(newRequestPage.depositWarning).toBeVisible();

            await newRequestPage.setLineSize(0, '8');
            await expect(newRequestPage.depositWarning).toBeHidden();
        });

        test('AC-3.5: Cancel, submit to pricing, list status', async () => {
            await newRequestPage.gotoNewRequestPage();

            // AC-3.5.1
            await expect(newRequestPage.cancelBtn).toBeVisible();
            await expect(newRequestPage.sendToPricingBtn).toBeVisible();
            await newRequestPage.clickCancel();
            await contractsPage.verifyContractsPageLoaded();

            // AC-3.5.2 + AC-3.5.3
            await newRequestPage.gotoNewRequestPage();
            const customer = `Capture Customer ${Date.now()}`;
            await newRequestPage.submitValidRequest({
                customer,
                area: 'B29',
                qty: 2,
                size: '8',
            });
            await expect(page.getByRole('heading', { name: customer })).toBeVisible({ timeout: 15000 });
            await expect(page.getByText('Awaiting pricing').first()).toBeVisible();
            await contractsPage.verifyRequestInList(customer, 'Awaiting pricing');
        });
    });
});

test.describe('4 — Admin Pricing Queue', () => {
    test.describe.configure({ mode: 'serial' });
    test.setTimeout(180000);

    /** @type {import('@playwright/test').BrowserContext} */ let adminContext;
    /** @type {import('@playwright/test').Page} */ let adminPage;
    /** @type {AdminLogin} */ let adminAuth;
    /** @type {AdminContractsPage} */ let adminContractsPage;
    /** @type {AdminContractPricingPage} */ let adminPricingPage;
    /** @type {genericFunctions} */ let adminGen;

    test.beforeAll(async ({ browser }, testInfo) => {
        adminContext = await browser.newContext({
            ...testInfo.project.use,
            httpCredentials: {
                username: TestData.authCredentials.authUserName,
                password: TestData.authCredentials.authPassword,
            },
            ignoreHTTPSErrors: true,
            // null + --start-maximized (playwright.config) = full window
            viewport: null,
        });
        adminPage = await adminContext.newPage();
        adminAuth = new AdminLogin(adminPage);
        adminContractsPage = new AdminContractsPage(adminPage);
        adminPricingPage = new AdminContractPricingPage(adminPage);
        adminGen = new genericFunctions(adminPage);

        await adminAuth.goto(adminGen.buildURL('/agent/login'));
        await adminAuth.adminLogin(
            TestData.credentials.agent.username,
            TestData.credentials.agent.password
        );
        await adminContractsPage.gotoContractsPage();
    });

    test.afterAll(async () => {
        await adminContext?.close();
    });

    test('AC-4.1: Page layout and default Needs pricing tab', async () => {
        await adminContractsPage.gotoContractsPage();

        // AC-4.1.1
        await adminContractsPage.verifyPageLayout();

        // AC-4.1.2
        await adminContractsPage.verifyDefaultNeedsPricingTab();
    });

    test('AC-4.2: Sidebar red badge for Needs pricing count', async () => {
        await adminContractsPage.gotoContractsPage();

        // AC-4.2.1
        const badgeCount = await adminContractsPage.verifySidebarNeedsPricingBadge();
        await adminContractsPage.selectTab('Needs pricing');
        const footerText = await adminContractsPage.footerCount.first().innerText();
        expect(footerText).toMatch(new RegExp(`^${badgeCount}\\s+requests?$`));

        // AC-4.2.2 — badge hidden when Needs pricing total is zero
        await adminContractsPage.verifySidebarBadgeHiddenWhenZeroNeedsPricing();
        await adminContractsPage.gotoContractsPage();
    });

    test('AC-4.3: Status tabs filter the queue', async () => {
        await adminContractsPage.gotoContractsPage();

        // AC-4.3.1
        await adminContractsPage.verifyStatusTabs();

        // AC-4.3.2
        await adminContractsPage.selectTab('Needs pricing');
        await expect(adminContractsPage.tableRows.first().getByRole('button', { name: 'Price now' })).toBeVisible();

        await adminContractsPage.selectTab('Priced');
        if ((await adminContractsPage.tableRows.count()) > 0) {
            await expect(adminContractsPage.tableRows.first().getByText('Priced — ready to close')).toBeVisible();
            await expect(adminContractsPage.tableRows.first().getByRole('button', { name: 'Open' })).toBeVisible();
        }

        await adminContractsPage.selectTab('All');
        expect(await adminContractsPage.isTabActive('All')).toBeTruthy();
        await expect(adminContractsPage.footerCount.first()).toBeVisible();
    });

    test('AC-4.4: Queue table columns, actions, and mobile cards', async () => {
        await adminContractsPage.gotoContractsPage();

        // AC-4.4.1
        await adminContractsPage.verifyDesktopTableColumns();
        await adminContractsPage.verifyWaitingAndTermColumnsPresent();
        await adminContractsPage.verifyCustomerShowsCompanyWhenPresent();

        // AC-4.4.2
        await adminContractsPage.verifyNeedsPricingActions();
        await adminContractsPage.verifyNonNeedsPricingActions();

        // AC-4.4.3
        await adminContractsPage.verifyMobileCards();
    });

    test('AC-4.5 & 4.6: Queue scoping and footer count', async () => {
        await adminContractsPage.gotoContractsPage();

        // AC-4.5.1 — requests from more than one agent
        await adminContractsPage.verifySeesMultipleAgents();

        // AC-4.6.1
        await adminContractsPage.verifyFooterCount();
    });

    test('AC-4.7: Empty state title and tab-specific description', async () => {
        // Use Cancelled (and All) via mocked empty API responses
        await adminContractsPage.verifyEmptyStateForTab('Cancelled');
        await adminContractsPage.verifyEmptyStateForTab('All');
        await adminContractsPage.gotoContractsPage();
    });

    test('AC-5.1 & 5.2 & 5.3: Grid-lock pricing detail layout, requirements, supplier costs', async () => {
        // AC-5.1.1 — open editable request via Price now
        await adminContractsPage.gotoContractsPage();
        await adminContractsPage.selectTab('Needs pricing');
        const submitted = await adminContractsPage.openFirstRequest('Price now');
        await adminPricingPage.verifyDetailPageLayout({
            customerName: submitted.customerName,
            agentName: submitted.agentName,
            area: submitted.area,
            termMonths: submitted.termMonths,
        });

        // AC-5.2.1 — requirement lines (parse from cost labels on page when possible)
        const requirementMatch = (await adminPage.locator('body').innerText()).match(
            /(\d+)\s*×\s*(\d+)yd\s*[·—-]?\s*([A-Za-z0-9 &]+)/
        );
        expect(requirementMatch).toBeTruthy();
        await adminPricingPage.verifyRequirementLines([
            {
                qty: requirementMatch[1],
                size: requirementMatch[2],
                wasteType: requirementMatch[3].trim(),
            },
        ]);

        // AC-5.3.1 / 5.3.2 / 5.3.4
        await adminPricingPage.verifySupplierPanel();
        await adminPricingPage.verifySkipLineCostInputs([
            {
                qty: Number(requirementMatch[1]),
                size: Number(requirementMatch[2]),
                wasteType: requirementMatch[3].trim(),
            },
        ]);
        await adminPricingPage.verifySupplierCostHint();

        // AC-5.1.2 — closed request is read-only with warning
        await adminContractsPage.gotoContractsPage();
        await adminContractsPage.selectTab('Closed');
        const closed = await adminContractsPage.openFirstRequest('Open');
        await adminPricingPage.verifyDetailPageLayout({
            customerName: closed.customerName,
            agentName: closed.agentName,
            area: closed.area,
            termMonths: closed.termMonths,
        });
        await adminPricingPage.verifyReadOnlyWarning('closed');
    });

    test('AC-5.4 & 5.5 & 5.6: Grid parameters, worst-combo preview, and lock action', async () => {
        await adminContractsPage.gotoContractsPage();
        await adminContractsPage.selectTab('Needs pricing');
        await adminContractsPage.openFirstRequest('Price now');

        // AC-5.4.1
        await adminPricingPage.verifyGridPanelFields();

        // AC-5.6.1 / 5.6.2 — Lock grid label; disabled with no supplier
        await expect(adminPricingPage.lockGridBtn).toHaveText('Lock grid');
        await expect(adminPricingPage.lockGridBtn).toBeDisabled();

        await adminPricingPage.selectFirstSupplier();
        await adminPricingPage.fillAllLineCosts('100');

        // AC-5.4.2 — base must be greater than floor
        await adminPricingPage.verifyBaseMustExceedFloor();

        // AC-5.5.1 / 5.5.2 — live green worst-combo preview
        await adminPricingPage.fillMargins({ base: '30', floor: '10' });
        await adminPricingPage.verifyWorstComboPreview({
            expectedMargin: '30.00',
            expectedFloor: '10.00',
            expectReject: false,
        });
        await expect(adminPricingPage.lockGridBtn).toBeEnabled();

        // AC-5.5.3 — red preview when worst combo is below floor
        await adminPricingPage.fillMargins({ base: '30', floor: '35' });
        await adminPricingPage.verifyWorstComboPreview({
            expectedMargin: '30.00',
            expectedFloor: '35.00',
            expectReject: true,
        });
        await expect(adminPricingPage.lockGridBtn).toBeDisabled();

        // AC-5.6.2 — no line costs blocks lock; floor breach already covered above
        await adminPricingPage.fillMargins({ base: '30', floor: '10' });
        await expect(adminPricingPage.lockGridBtn).toBeEnabled();
        await adminPricingPage.clearAllLineCosts();
        if (await adminPricingPage.lockGridBtn.isEnabled()) {
            await adminPricingPage.lockGridBtn.click();
            await expect(
                adminPage.getByText(/Every line needs a supplier cost of at least £1/i)
            ).toBeVisible({ timeout: 10000 });
        } else {
            await expect(adminPricingPage.lockGridBtn).toBeDisabled();
        }
        await adminPricingPage.fillAllLineCosts('120');

        // AC-5.6.2 — disabled while submitting
        await adminPricingPage.verifyLockDisabledWhileSubmitting();

        // AC-5.6.3 — successful lock with non-zero discounts
        await adminPricingPage.lockGridSuccessfully({
            base: '30',
            floor: '10',
            cost: '120',
            discountMaxTerm: '5',
            discountFullUpfront: '5',
        });

        // AC-5.6.1 — re-lock label when a grid already exists
        await expect(adminPage.getByRole('button', { name: 'Re-lock grid (supersedes current)' })).toBeVisible();

        // AC-5.6.4 — server-side floor breach rejection
        await adminPricingPage.verifyLockRejectedByServerFloorBreach();

        // Confirm re-lock label also on another priced request from the queue
        await adminContractsPage.gotoContractsPage();
        await adminContractsPage.selectTab('Priced');
        if ((await adminContractsPage.tableRows.count()) > 0) {
            await adminContractsPage.openFirstRequest('Open');
            await adminPricingPage.verifyRelockButtonOnPricedRequest();
        }
    });

    test('AC-5.7 & 5.8: Re-lock supersede note and locked costs display', async () => {
        await adminContractsPage.gotoContractsPage();
        await adminContractsPage.selectTab('Needs pricing');
        await adminContractsPage.openFirstRequest('Price now');

        // Initial lock
        const firstLock = await adminPricingPage.lockGridSuccessfully({
            base: '30',
            floor: '10',
            cost: '120',
            discountMaxTerm: '5',
            discountFullUpfront: '5',
        });

        // AC-5.8.1 — locked costs summary shows the entered per-line costs
        await adminPricingPage.verifyLockedCostsSummary([firstLock.cost]);

        // AC-5.7.1 — existing grid details + supersede note
        await adminPricingPage.verifyExistingGridSummary({
            supplierLabel: firstLock.supplierLabel,
            maxTermMonths: 6,
        });

        // AC-5.7.2 — re-lock supersedes the previous grid
        const reLock = await adminPricingPage.reLockGridAndVerifySupersede({
            previousGridId: firstLock.gridId,
            base: '28',
            floor: '9',
            cost: '150',
            discountMaxTerm: '5',
            discountFullUpfront: '5',
        });

        // AC-5.8.1 — locked costs summary reflects the re-locked costs
        await adminPricingPage.verifyLockedCostsSummary([reLock.cost]);

        // AC-5.7.1 — note still present after re-lock
        await adminPricingPage.verifyExistingGridSummary({ maxTermMonths: 6 });
    });
});
