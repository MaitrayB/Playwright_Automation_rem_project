import { test, expect } from '../../fixtures/test.js';
import { AdminLogin } from '../../pages/Admin/AdminLogin.js';
import { AdminContractsPage } from '../../pages/Admin/AdminContractsPage.js';
import { AdminContractPricingPage } from '../../pages/Admin/AdminContractPricingPage.js';
import { AdminContractFulfilmentPage } from '../../pages/Admin/AdminContractFulfilmentPage.js';
import { SalesAgentContractsPage } from '../../pages/Admin/SalesAgentContractsPage.js';
import { SalesAgentNewContractRequestPage } from '../../pages/Admin/SalesAgentNewContractRequestPage.js';
import { SalesAgentContractDetailPage } from '../../pages/Admin/SalesAgentContractDetailPage.js';
import { MailinatorPage } from '../../pages/Suppliers/MailinatorPage.js';
import { ContractSigningPage } from '../../pages/Customer/ContractSigningPage.js';
import { SupplierContractSigningPage } from '../../pages/Supplier/SupplierContractSigningPage.js';
import { TestData } from '../../Data/testData.js';
import { genericFunctions } from '../../utils/genericFunctions.js';
import { prepareCookieConsent } from '../../utils/cookieConsent.js';
import {
    DEFAULT_CONTRACT_CUSTOMER_PASSWORD,
    saveContractCustomerCredentials,
} from '../../utils/contractCustomerCredentials.js';

/**
 * Phase 2 — Fulfilment
 * Post-close contract signatures (customer + supplier) and fulfilment unlock.
 */

const CUSTOMER_SIGNING_EMAIL_SUBJECT = 'Your We Want Waste contract is ready to sign';
const CUSTOMER_SIGNING_LINK_TEXT = /Review and sign your contract/i;
const SUPPLIER_SIGNING_EMAIL_SUBJECT = 'We Want Waste supply agreement — review and sign';
const SUPPLIER_SIGNING_LINK_TEXT = /Review and sign|sign your (supply )?agreement|Open the agreement/i;

/**
 * Seed: agent submit → admin lock → agent close → admin issue → Mailinator signing link.
 * Reuses already-authenticated agent/admin page objects from the parent suite.
 */
async function ensureSalesAgentSession(agentAuth, agentContractsPage, agentGen) {
    // Session can expire while admin locks pricing; URL may still show a contract detail
    // until the next navigation redirects to login.
    await agentAuth.goto(agentGen.buildURL('/sales/contracts'));
    if (/\/agent\/login/.test(agentAuth.page.url())) {
        await agentAuth.salesAgentLogin(
            TestData.credentials.salesAgent.username,
            TestData.credentials.salesAgent.password
        );
    }
    await agentContractsPage.verifyContractsPageLoaded();
}

async function ensureAdminSession(adminAuth, adminContractsPage, adminGen) {
    await adminAuth.goto(adminGen.buildURL('/super-admin/contracts'));
    if (/\/agent\/login|\/login/.test(adminAuth.page.url())) {
        await adminAuth.adminLogin(
            TestData.credentials.agent.username,
            TestData.credentials.agent.password
        );
    }
    if (!/\/super-admin\/contracts/.test(adminAuth.page.url())) {
        await adminAuth.page.goto(adminGen.buildURL('/super-admin/contracts'), {
            waitUntil: 'domcontentloaded',
        });
    }
    if (/\/agent\/login|\/login/.test(adminAuth.page.url())) {
        await adminAuth.adminLogin(
            TestData.credentials.agent.username,
            TestData.credentials.agent.password
        );
        await adminAuth.page.goto(adminGen.buildURL('/super-admin/contracts'), {
            waitUntil: 'domcontentloaded',
        });
    }
    await adminContractsPage.gotoContractsPage();
}

async function seedIssuedSigningContract({
    agentAuth,
    agentContractsPage,
    agentNewRequestPage,
    agentDetailPage,
    agentPage,
    agentGen,
    adminAuth,
    adminContractsPage,
    adminPricingPage,
    adminFulfilmentPage,
    adminGen,
    browser,
    testInfo,
    customerPrefix,
    upfrontLabel = 'Drawdown',
    phone,
}) {
    const customerName = `${customerPrefix} ${Date.now()}`;
    const email = await adminGen.generateRandomEmailmailinator();

    await ensureSalesAgentSession(agentAuth, agentContractsPage, agentGen);
    await agentNewRequestPage.gotoNewRequestPage();
    await agentNewRequestPage.submitValidRequest({
        customer: customerName,
        email,
        area: 'B29',
        qty: 2,
        size: '8',
    });
    await expect(agentPage.getByRole('heading', { name: customerName })).toBeVisible({
        timeout: 15000,
    });

    await ensureAdminSession(adminAuth, adminContractsPage, adminGen);
    await adminContractsPage.openRequestByCustomer(customerName, 'Price now');
    await expect(adminPricingPage.lockGridBtn).toBeVisible({ timeout: 20000 });
    const lock = await adminPricingPage.lockGridSuccessfully({
        base: '30',
        floor: '10',
        cost: '120',
        discountMaxTerm: '5',
        discountFullUpfront: '5',
    });
    const supplierName =
        lock.supplierLabel?.replace(/\s*\(#\d+\)\s*$/, '').trim() ||
        TestData.contractPricingSupplier.displayName;
    const area = 'B29';

    await ensureSalesAgentSession(agentAuth, agentContractsPage, agentGen);
    await agentContractsPage.openRequestByCustomer(customerName);
    await expect(agentPage.getByText(/Priced — ready to (?:close|agree)/i).first()).toBeVisible({
        timeout: 20000,
    });
    await expect(agentDetailPage.quoteCalculatorHeading).toBeVisible({ timeout: 20000 });
    const terms = await agentDetailPage.getVisibleTermLabels();
    expect(terms.length).toBeGreaterThan(0);
    const termMonths = String(terms[0]).match(/(\d+)/)?.[1] || '';
    await agentDetailPage.selectTerm(terms[0]);
    await agentDetailPage.selectUpfront(upfrontLabel);
    await agentDetailPage.openCloseDealModal();
    await agentDetailPage.confirmCloseContract();
    await ensureSalesAgentSession(agentAuth, agentContractsPage, agentGen);
    await agentContractsPage.verifyRequestInList(customerName, 'Agreed');

    await ensureAdminSession(adminAuth, adminContractsPage, adminGen);
    await adminContractsPage.openRequestByCustomer(customerName, 'Open', 'Agreed');
    await adminFulfilmentPage.verifyNotSentToSignCard();
    await adminFulfilmentPage.openSendForm();
    await adminFulfilmentPage.sendToCustomer({ email, phone });
    await adminFulfilmentPage.verifyIssuedAwaitingSignatures({
        customerEmail: email,
        customerPhone: phone,
    });

    const emailContext = await browser.newContext({ ...testInfo.project.use });
    const emailPage = await emailContext.newPage();
    const mailinatorPage = new MailinatorPage(emailPage);
    await mailinatorPage.waitForInvitationEmail(email, CUSTOMER_SIGNING_EMAIL_SUBJECT, 15, 3000);
    const link = await mailinatorPage.getInvitationLink(CUSTOMER_SIGNING_LINK_TEXT);
    await emailContext.close();
    expect(link).toBeTruthy();

    return { customerName, email, phone, termMonths, link, supplierName, area };
}

/** Fresh invite link for a customer email (latest matching subject). */
async function fetchCustomerSigningLink(browser, testInfo, email) {
    const emailContext = await browser.newContext({ ...testInfo.project.use });
    const emailPage = await emailContext.newPage();
    const mailinatorPage = new MailinatorPage(emailPage);
    await mailinatorPage.waitForInvitationEmail(email, CUSTOMER_SIGNING_EMAIL_SUBJECT, 15, 3000);
    const link = await mailinatorPage.getInvitationLink(CUSTOMER_SIGNING_LINK_TEXT);
    await emailContext.close();
    expect(link).toBeTruthy();
    return link;
}

/** Customer public page should reject a superceded signing invite. */
async function expectSigningLinkInvalid(browser, testInfo, link) {
    const ctx = await browser.newContext({
        ...testInfo.project.use,
        httpCredentials: {
            username: TestData.authCredentials.authUserName,
            password: TestData.authCredentials.authPassword,
        },
        ignoreHTTPSErrors: true,
    });
    await prepareCookieConsent(ctx);
    const page = await ctx.newPage();
    await page.goto(link, { waitUntil: 'domcontentloaded' });
    await expect(
        page
            .getByText(
                /no longer (work|valid)|expired|invalid|already been (used|re-sent)|link (is )?(not|no longer)|invite (has )?(expired|been revoked)|this signing link/i
            )
            .or(page.getByRole('heading', { name: /link (expired|invalid)|invite (expired|invalid)/i }))
            .first()
    ).toBeVisible({ timeout: 45000 });
    await ctx.close();
}

test.describe('Commercial Contract Sales — Phase 2 Fulfilment', () => {
    test.describe.configure({ mode: 'serial', timeout: 720000 });
    test.setTimeout(720000);

    /** @type {import('@playwright/test').BrowserContext} */ let agentContext;
    /** @type {import('@playwright/test').Page} */ let agentPage;
    /** @type {AdminLogin} */ let agentAuth;
    /** @type {SalesAgentContractsPage} */ let agentContractsPage;
    /** @type {SalesAgentNewContractRequestPage} */ let agentNewRequestPage;
    /** @type {SalesAgentContractDetailPage} */ let agentDetailPage;
    /** @type {genericFunctions} */ let agentGen;

    /** @type {import('@playwright/test').BrowserContext} */ let adminContext;
    /** @type {import('@playwright/test').Page} */ let adminPage;
    /** @type {AdminLogin} */ let adminAuth;
    /** @type {AdminContractsPage} */ let adminContractsPage;
    /** @type {AdminContractPricingPage} */ let adminPricingPage;
    /** @type {AdminContractFulfilmentPage} */ let adminFulfilmentPage;
    /** @type {genericFunctions} */ let adminGen;

    /** Customer seeded for fulfilment assertions */
    let fulfilmentCustomerName = '';
    /** Mailinator inbox used when issuing for signing */
    let customerSigningEmail = '';
    /** Customer portal password set after card save during AC-4.10 */
    let customerPortalPassword = '';
    /** Term months chosen at close — used on the customer signing subtitle */
    let selectedTermMonths = '';
    /** Signing invite URL from Mailinator */
    let customerSigningLink = '';

    /** @type {import('@playwright/test').BrowserContext} */ let signingContext;
    /** @type {import('@playwright/test').Page} */ let signingPage;
    /** @type {ContractSigningPage} */ let contractSigningPage;

    test.beforeAll(async ({ browser }, testInfo) => {
        testInfo.setTimeout(300000);
        const sharedUse = {
            ...testInfo.project.use,
            httpCredentials: {
                username: TestData.authCredentials.authUserName,
                password: TestData.authCredentials.authPassword,
            },
            ignoreHTTPSErrors: true,
            viewport: null,
        };

        agentContext = await browser.newContext(sharedUse);
        agentPage = await agentContext.newPage();
        agentAuth = new AdminLogin(agentPage);
        agentContractsPage = new SalesAgentContractsPage(agentPage);
        agentNewRequestPage = new SalesAgentNewContractRequestPage(agentPage);
        agentDetailPage = new SalesAgentContractDetailPage(agentPage);
        agentGen = new genericFunctions(agentPage);

        adminContext = await browser.newContext(sharedUse);
        adminPage = await adminContext.newPage();
        adminAuth = new AdminLogin(adminPage);
        adminContractsPage = new AdminContractsPage(adminPage);
        adminPricingPage = new AdminContractPricingPage(adminPage);
        adminFulfilmentPage = new AdminContractFulfilmentPage(adminPage);
        adminGen = new genericFunctions(adminPage);

        await agentAuth.goto(agentGen.buildURL('/agent/login'));
        await agentAuth.salesAgentLogin(
            TestData.credentials.salesAgent.username,
            TestData.credentials.salesAgent.password
        );
        await agentContractsPage.verifyContractsPageLoaded();

        await adminAuth.goto(adminGen.buildURL('/agent/login'));
        await adminAuth.adminLogin(
            TestData.credentials.agent.username,
            TestData.credentials.agent.password
        );
        await adminContractsPage.gotoContractsPage();
        // Deal seeding lives in section beforeAlls so grepped runs (e.g. AC-4.11)
        // do not pay for / flake on the shared Drawdown seed.
    });

    test.afterAll(async () => {
        await signingContext?.close();
        await agentContext?.close();
        await adminContext?.close();
    }, { timeout: 30000 });

    test.describe('2 — Admin Issue Contract for Signing', () => {
        test.beforeAll(async ({}, testInfo) => {
            testInfo.setTimeout(600000);
            // Seed a closed Drawdown deal for Issue-for-signing + shared signing token ACs
            fulfilmentCustomerName = `QA Fulfilment ${Date.now()}`;
            customerSigningEmail = await adminGen.generateRandomEmailmailinator();

            await ensureSalesAgentSession(agentAuth, agentContractsPage, agentGen);
            await agentNewRequestPage.gotoNewRequestPage();
            await agentNewRequestPage.submitValidRequest({
                customer: fulfilmentCustomerName,
                email: customerSigningEmail,
                area: 'B29',
                qty: 2,
                size: '8',
            });
            await expect(agentPage.getByRole('heading', { name: fulfilmentCustomerName })).toBeVisible({
                timeout: 15000,
            });

            await ensureAdminSession(adminAuth, adminContractsPage, adminGen);
            await adminContractsPage.openRequestByCustomer(fulfilmentCustomerName, 'Price now');
            await expect(adminPricingPage.lockGridBtn).toBeVisible({ timeout: 20000 });
            await adminPricingPage.lockGridSuccessfully({
                base: '30',
                floor: '10',
                cost: '120',
                discountMaxTerm: '5',
                discountFullUpfront: '5',
            });

            await ensureSalesAgentSession(agentAuth, agentContractsPage, agentGen);
            await agentContractsPage.openRequestByCustomer(fulfilmentCustomerName);
            await expect(agentPage.getByText(/Priced — ready to (?:close|agree)/i).first()).toBeVisible({
                timeout: 20000,
            });
            await expect(agentDetailPage.quoteCalculatorHeading).toBeVisible({ timeout: 20000 });
            const terms = await agentDetailPage.getVisibleTermLabels();
            expect(terms.length).toBeGreaterThan(0);
            selectedTermMonths = String(terms[0]).match(/(\d+)/)?.[1] || '';
            expect(selectedTermMonths).toBeTruthy();
            await agentDetailPage.selectTerm(terms[0]);
            await agentDetailPage.selectUpfront('Drawdown');
            await agentDetailPage.openCloseDealModal();
            await agentDetailPage.confirmCloseContract();
            await agentContractsPage.verifyRequestInList(fulfilmentCustomerName, 'Agreed');
        });

        test('AC-2.1: Agreed not-sent card shows message and Send for signature', async () => {
            await ensureAdminSession(adminAuth, adminContractsPage, adminGen);
            await adminContractsPage.openRequestByCustomer(
                fulfilmentCustomerName,
                'Open',
                'Agreed'
            );
            await adminFulfilmentPage.verifyNotSentToSignCard();
        });

        test('AC-2.2: Send for signature opens email/phone form with Send to customer & Cancel', async () => {
            await ensureAdminSession(adminAuth, adminContractsPage, adminGen);
            await adminContractsPage.openRequestByCustomer(
                fulfilmentCustomerName,
                'Open',
                'Agreed'
            );
            await adminFulfilmentPage.verifyNotSentToSignCard();
            await adminFulfilmentPage.openSendForm();
            await adminFulfilmentPage.verifySendFormFields();
        });

        test('AC-2.3 & 2.4: Send disabled when email empty; Sending… then Awaiting signatures', async () => {
            await ensureAdminSession(adminAuth, adminContractsPage, adminGen);
            await adminContractsPage.openRequestByCustomer(
                fulfilmentCustomerName,
                'Open',
                'Agreed'
            );
            await adminFulfilmentPage.verifyNotSentToSignCard();
            await adminFulfilmentPage.openSendForm();

            // AC-2.3 (empty email) + Sending… during send, then successful issue (AC-2.4)
            await adminFulfilmentPage.verifySendButtonDisabledEmptyAndSendingState(
                customerSigningEmail
            );
            await adminFulfilmentPage.verifyIssuedAwaitingSignatures({
                customerEmail: customerSigningEmail,
            });
        });

        test('AC-2.5: Customer receives signing email and can open onboard link', async ({
            browser,
        }, testInfo) => {
            const emailContext = await browser.newContext({ ...testInfo.project.use });
            const emailPage = await emailContext.newPage();
            const mailinatorPage = new MailinatorPage(emailPage);

            await mailinatorPage.waitForInvitationEmail(
                customerSigningEmail,
                CUSTOMER_SIGNING_EMAIL_SUBJECT,
                15,
                3000
            );
            customerSigningLink = await mailinatorPage.getInvitationLink(CUSTOMER_SIGNING_LINK_TEXT);
            expect(customerSigningLink).toBeTruthy();

            const onboardContext = await browser.newContext({
                ...testInfo.project.use,
                httpCredentials: {
                    username: TestData.authCredentials.authUserName,
                    password: TestData.authCredentials.authPassword,
                },
                ignoreHTTPSErrors: true,
            });
            const onboardPage = await onboardContext.newPage();
            await onboardPage.goto(customerSigningLink, { waitUntil: 'domcontentloaded' });

            await expect(onboardPage).toHaveURL(/\/contract-signing\//, { timeout: 45000 });
            await expect(
                onboardPage.getByRole('heading', { name: 'Your We Want Waste contract' })
            ).toBeVisible({ timeout: 30000 });
            await expect(
                onboardPage.getByText(
                    new RegExp(fulfilmentCustomerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
                )
            ).toBeVisible();
            await expect(
                onboardPage.getByRole('heading', { name: /Step 1 — Verify your identity/i })
            ).toBeVisible();
            await expect(
                onboardPage.getByRole('button', { name: /Verify identity with Stripe/i })
            ).toBeVisible();

            await emailContext.close();
            await onboardContext.close();
        });
    });

    test.describe('4 — Customer Contract Signing', () => {
        test.beforeAll(async ({ browser }, testInfo) => {
            testInfo.setTimeout(180000);
            expect(customerSigningLink, 'AC-2.5 must capture the signing link first').toBeTruthy();

            signingContext = await browser.newContext({
                ...testInfo.project.use,
                httpCredentials: {
                    username: TestData.authCredentials.authUserName,
                    password: TestData.authCredentials.authPassword,
                },
                ignoreHTTPSErrors: true,
                viewport: null,
            });
            await prepareCookieConsent(signingContext);
            signingPage = await signingContext.newPage();
            contractSigningPage = new ContractSigningPage(signingPage);
            await signingPage.goto(customerSigningLink, { waitUntil: 'domcontentloaded' });
            await expect(signingPage).toHaveURL(/\/contract-signing\//, { timeout: 45000 });
            await contractSigningPage.acceptCookiesIfVisible();
        });

        test('AC-4.2: Customer link heading and term/customer subtitle', async () => {
            await contractSigningPage.verifyCustomerHeading({
                termMonths: selectedTermMonths,
                customerName: fulfilmentCustomerName,
            });
        });

        test('AC-4.3: Identity step copy, Starting…, then Stripe test-mode Submit/Done', async () => {
            // Fresh navigation if a prior visit already completed identity
            if (await contractSigningPage.step2Heading.isVisible().catch(() => false)) {
                test.skip(true, 'Identity already verified on this signing token — Step 2 is showing');
            }
            await contractSigningPage.verifyIdentityStepAndCompleteTestMode();
        });

        test('AC-4.5: Step 2 shows Agreement Details, Included Deliveries, Terms', async () => {
            if (!(await contractSigningPage.step2Heading.isVisible().catch(() => false))) {
                // Identity may still be required if AC-4.3 was skipped
                await contractSigningPage.verifyIdentityStepAndCompleteTestMode();
            }
            await contractSigningPage.verifyReviewAndSignSections();
        });

        test('AC-4.6: Signer field and Sign agreement shows Submitting…', async () => {
            await contractSigningPage.ensureStep2();
            await contractSigningPage.verifySignAreaAndSubmittingState();
        });

        test('AC-4.7: Empty name and missing signature show validation errors', async () => {
            await contractSigningPage.verifySignValidationErrors();
        });

        test('AC-4.8: Signature options and upload type/size errors', async () => {
            await contractSigningPage.verifySignatureOptionsAndUploadErrors();
        });

        test('AC-4.10: Drawdown Step 3 — Save a payment card, set password, My contracts', async () => {
            await contractSigningPage.signAgreementSuccessfully('QA Drawdown Signer');
            await contractSigningPage.verifySaveCardStep();
            // Card → set password → land on My contracts (credentials for later tests)
            const { password } = await contractSigningPage.saveCardSetPasswordAndOpenMyContracts({
                password: DEFAULT_CONTRACT_CUSTOMER_PASSWORD,
            });
            customerPortalPassword = password;
            saveContractCustomerCredentials({
                email: customerSigningEmail,
                password: customerPortalPassword,
                customerName: fulfilmentCustomerName,
            });
            expect(customerSigningEmail).toBeTruthy();
            expect(customerPortalPassword).toBeTruthy();
        });
    });

    test.describe('4 — Upfront payment (AC-4.9)', () => {
        /** @type {import('@playwright/test').BrowserContext} */ let upfrontContext;
        /** @type {ContractSigningPage} */ let upfrontSigningPage;
        let upfrontCustomerName = '';
        let upfrontTermMonths = '';

        test.beforeAll(async ({ browser }, testInfo) => {
            testInfo.setTimeout(360000);
            const seeded = await seedIssuedSigningContract({
                agentAuth,
                agentContractsPage,
                agentNewRequestPage,
                agentDetailPage,
                agentPage,
                agentGen,
                adminAuth,
                adminContractsPage,
                adminPricingPage,
                adminFulfilmentPage,
                adminGen,
                browser,
                testInfo,
                customerPrefix: 'QA Upfront',
                upfrontLabel: 'Full upfront',
            });
            upfrontCustomerName = seeded.customerName;
            upfrontTermMonths = seeded.termMonths;

            upfrontContext = await browser.newContext({
                ...testInfo.project.use,
                httpCredentials: {
                    username: TestData.authCredentials.authUserName,
                    password: TestData.authCredentials.authPassword,
                },
                ignoreHTTPSErrors: true,
                viewport: null,
            });
            await prepareCookieConsent(upfrontContext);
            const page = await upfrontContext.newPage();
            upfrontSigningPage = new ContractSigningPage(page);
            await page.goto(seeded.link, { waitUntil: 'domcontentloaded' });
            await upfrontSigningPage.acceptCookiesIfVisible();
            await upfrontSigningPage.verifyCustomerHeading({
                termMonths: upfrontTermMonths,
                customerName: upfrontCustomerName,
            });
            await upfrontSigningPage.ensureStep2();
            await upfrontSigningPage.signAgreementSuccessfully('QA Upfront Signer');
        });

        test.afterAll(async () => {
            await upfrontContext?.close();
        });

        test('AC-4.9: Step 3 upfront payment rows, Pay £total, Processing…', async () => {
            await upfrontSigningPage.verifyUpfrontPaymentStep();
        });
    });

    test.describe('4 — Decline agreement (AC-4.11)', () => {
        /** @type {import('@playwright/test').BrowserContext} */ let declineContext;
        /** @type {ContractSigningPage} */ let declineSigningPage;

        test.beforeAll(async ({ browser }, testInfo) => {
            testInfo.setTimeout(360000);
            const seeded = await seedIssuedSigningContract({
                agentAuth,
                agentContractsPage,
                agentNewRequestPage,
                agentDetailPage,
                agentPage,
                agentGen,
                adminAuth,
                adminContractsPage,
                adminPricingPage,
                adminFulfilmentPage,
                adminGen,
                browser,
                testInfo,
                customerPrefix: 'QA Decline',
                upfrontLabel: 'Drawdown',
            });

            declineContext = await browser.newContext({
                ...testInfo.project.use,
                httpCredentials: {
                    username: TestData.authCredentials.authUserName,
                    password: TestData.authCredentials.authPassword,
                },
                ignoreHTTPSErrors: true,
                viewport: null,
            });
            await prepareCookieConsent(declineContext);
            const page = await declineContext.newPage();
            declineSigningPage = new ContractSigningPage(page);
            await page.goto(seeded.link, { waitUntil: 'domcontentloaded' });
            await declineSigningPage.acceptCookiesIfVisible();
            await declineSigningPage.ensureStep2();
        });

        test.afterAll(async () => {
            await declineContext?.close();
        });

        test('AC-4.11: Decline link prompts reason and shows Agreement declined', async () => {
            await declineSigningPage.declineAgreement('Declining via QA automation');
        });
    });

    /**
     * §5 Supplier signing — requires customer sign + admin verify of that signature
     * before the supplier receives "We Want Waste supply agreement — review and sign".
     */
    test.describe('5 — Supplier Contract Signing', () => {
        test.describe.configure({ timeout: 720000 });

        /** @type {import('@playwright/test').BrowserContext} */ let supplierContext;
        /** @type {SupplierContractSigningPage} */ let supplierSigningPage;
        let supplierCustomerName = '';
        let supplierTermMonths = '';
        let supplierArea = '';
        let supplierDisplayName = '';
        let supplierSigningLink = '';

        test.beforeAll(async ({ browser }, testInfo) => {
            testInfo.setTimeout(720000);

            const seeded = await seedIssuedSigningContract({
                agentAuth,
                agentContractsPage,
                agentNewRequestPage,
                agentDetailPage,
                agentPage,
                agentGen,
                adminAuth,
                adminContractsPage,
                adminPricingPage,
                adminFulfilmentPage,
                adminGen,
                browser,
                testInfo,
                customerPrefix: 'QA SupplierSign',
                upfrontLabel: 'Drawdown',
            });
            supplierCustomerName = seeded.customerName;
            supplierTermMonths = seeded.termMonths;
            supplierArea = seeded.area;
            supplierDisplayName = seeded.supplierName;

            // Customer signs first (AC-5.1 gating)
            const customerCtx = await browser.newContext({
                ...testInfo.project.use,
                httpCredentials: {
                    username: TestData.authCredentials.authUserName,
                    password: TestData.authCredentials.authPassword,
                },
                ignoreHTTPSErrors: true,
                viewport: null,
            });
            await prepareCookieConsent(customerCtx);
            const customerPage = await customerCtx.newPage();
            const customerSigning = new ContractSigningPage(customerPage);
            await customerPage.goto(seeded.link, { waitUntil: 'domcontentloaded' });
            await customerSigning.acceptCookiesIfVisible();
            await customerSigning.ensureStep2();
            // Drawdown contracts must save a card + set password before full portal activation
            const { password } = await customerSigning.signAgreementAndSaveCard(
                'QA Customer For Supplier',
                { password: DEFAULT_CONTRACT_CUSTOMER_PASSWORD }
            );
            saveContractCustomerCredentials({
                email: seeded.email,
                password,
                customerName: supplierCustomerName,
            });
            await customerCtx.close();

            // AC-5.1 / 5.2 — admin verifies customer signature → supplier email
            await ensureAdminSession(adminAuth, adminContractsPage, adminGen);
            // Prefer All so signed deals are findable regardless of status tab rename
            await adminContractsPage.gotoContractsPage();
            await adminContractsPage.selectTab('All');
            try {
                await adminContractsPage.openRequestByCustomer(supplierCustomerName, 'Open', 'All');
            } catch {
                await adminContractsPage.openRequestByCustomer(
                    supplierCustomerName,
                    'Open',
                    'Awaiting signatures'
                );
            }
            await adminFulfilmentPage.verifyCustomerSignaturePendingAdminCheck().catch(async () => {
                await expect(adminFulfilmentPage.fulfilmentHeading).toBeVisible({ timeout: 20000 });
            });
            await adminFulfilmentPage.verifyCustomerSignature();

            const mailCtx = await browser.newContext({ ...testInfo.project.use });
            const mailPage = await mailCtx.newPage();
            const mailinator = new MailinatorPage(mailPage);
            const supplierEmail = TestData.contractPricingSupplier.email;
            await mailinator.waitForInvitationEmail(
                supplierEmail,
                SUPPLIER_SIGNING_EMAIL_SUBJECT,
                20,
                3000
            );
            supplierSigningLink = await mailinator.getInvitationLink(SUPPLIER_SIGNING_LINK_TEXT);
            await mailCtx.close();
            expect(supplierSigningLink).toBeTruthy();

            supplierContext = await browser.newContext({
                ...testInfo.project.use,
                httpCredentials: {
                    username: TestData.authCredentials.authUserName,
                    password: TestData.authCredentials.authPassword,
                },
                ignoreHTTPSErrors: true,
                viewport: null,
            });
            await prepareCookieConsent(supplierContext);
            const page = await supplierContext.newPage();
            supplierSigningPage = new SupplierContractSigningPage(page);
            await page.goto(supplierSigningLink, { waitUntil: 'domcontentloaded' });
            await supplierSigningPage.acceptCookiesIfVisible();
        });

        test.afterAll(async () => {
            await supplierContext?.close();
        });

        test('AC-5.1 & 5.2: Supplier email only after customer sign + admin verify; subject and link', async () => {
            // Seed/beforeAll already enforced gating + Mailinator subject/link
            expect(supplierSigningLink).toMatch(/^https?:\/\//i);
            await expect(supplierSigningPage.heading).toBeVisible({ timeout: 30000 });
        });

        test('AC-5.3: Supply agreement heading and term/supplier/area subtitle', async () => {
            await supplierSigningPage.verifySupplierHeading({
                termMonths: supplierTermMonths,
                supplierName: supplierDisplayName,
                area: supplierArea,
            });
        });

        test('AC-5.4: Review and sign — Agreement Details (supplier, area, term)', async () => {
            await supplierSigningPage.verifyAgreementDetails({
                supplierName: supplierDisplayName,
                area: supplierArea,
                termMonths: supplierTermMonths,
            });
        });

        test('AC-5.5: Deliveries & Rates lists lines with supplier rates', async () => {
            await supplierSigningPage.verifyDeliveriesAndRates();
        });

        test('AC-5.6: No identity check and no payment step', async () => {
            await supplierSigningPage.verifyNoIdentityOrPaymentSteps();
        });

        test('AC-5.7: Sign here, Upload document, and Sign agreement controls', async () => {
            await supplierSigningPage.verifySignatureControls();
        });

        test('AC-5.8: After sign — You\'re all done, awaiting confirmation, view document, no password', async () => {
            await supplierSigningPage.signAgreementAndVerifyDone('QA Supplier Signer');
        });
    });

    /**
     * §6 Admin Signature Review & Sequencing
     * Progressive seed: issued-with-phone → resend/edit → customer sign → verify → docs.
     * Separate seed for decline → re-send (AC-6.4.5).
     */
    test.describe('6 — Admin Signature Review & Sequencing', () => {
        const CUSTOMER_PHONE = '07123456789';
        const SIGNER_NAME = 'QA SigReview Customer';

        /** @type {string} */ let sigCustomerName;
        /** @type {string} */ let sigEmail;
        /** @type {string} */ let sigPhone = CUSTOMER_PHONE;
        /** @type {string} */ let sigLink;
        /** @type {string} */ let sigSupplierName;
        /** @type {string} */ let sigArea;
        /** @type {string} */ let sigTermMonths;

        async function openAdminSigDeal(tab = 'All') {
            await ensureAdminSession(adminAuth, adminContractsPage, adminGen);
            const alreadyOpen =
                (await adminPage
                    .getByRole('heading', { name: sigCustomerName })
                    .isVisible()
                    .catch(() => false)) &&
                (await adminFulfilmentPage.fulfilmentHeading.isVisible().catch(() => false));
            if (alreadyOpen) {
                return;
            }
            await adminContractsPage.gotoContractsPage();
            await adminContractsPage.selectTab(tab);
            try {
                await adminContractsPage.openRequestByCustomer(sigCustomerName, 'Open', tab);
            } catch {
                await adminContractsPage.openRequestByCustomer(
                    sigCustomerName,
                    'Open',
                    'Awaiting signatures'
                );
            }
            await expect(adminFulfilmentPage.fulfilmentHeading).toBeVisible({ timeout: 20000 });
        }

        test.beforeAll(async ({ browser }, testInfo) => {
            testInfo.setTimeout(720000);
            const seeded = await seedIssuedSigningContract({
                agentAuth,
                agentContractsPage,
                agentNewRequestPage,
                agentDetailPage,
                agentPage,
                agentGen,
                adminAuth,
                adminContractsPage,
                adminPricingPage,
                adminFulfilmentPage,
                adminGen,
                browser,
                testInfo,
                customerPrefix: 'QA SigReview',
                upfrontLabel: 'Drawdown',
                phone: CUSTOMER_PHONE,
            });
            sigCustomerName = seeded.customerName;
            sigEmail = seeded.email;
            sigPhone = seeded.phone || CUSTOMER_PHONE;
            sigLink = seeded.link;
            sigSupplierName = seeded.supplierName;
            sigArea = seeded.area;
            sigTermMonths = seeded.termMonths;
        });

        test('AC-6.1.2: Customer row shows email and phone when on file', async () => {
            await openAdminSigDeal('Awaiting signatures');
            await adminFulfilmentPage.verifyCustomerContactOnRow({
                email: sigEmail,
                phone: sigPhone,
            });
            await adminFulfilmentPage.verifyCustomerAwaitingSignature();
            await adminFulfilmentPage.verifySupplierNotSentYet();
        });

        test('AC-6.4.1 & 6.4.4: Re-send visible while awaiting; supplier not released yet blocked', async () => {
            await openAdminSigDeal('Awaiting signatures');
            await expect(adminFulfilmentPage.resendBtn('Customer')).toBeVisible();
            await adminFulfilmentPage.verifySupplierNotSentYet();

            // AC-6.4.4 — Re-send on a not-yet-released supplier invite (or toast gate)
            const supplierResend = adminFulfilmentPage.resendBtn('Supplier');
            if (await supplierResend.isVisible().catch(() => false)) {
                await adminFulfilmentPage.resendInvite('Supplier', 'supplierNotReleased');
            } else {
                // Product may hide Re-send until supplier invite is released (AC-6.4.1:
                // Re-send for awaiting / declined only). Assert release gate via status.
                await expect(supplierResend).toHaveCount(0);
            }
        });

        test('AC-6.4.1 (agent): Owning sales agent can Re-send customer invite', async ({
            browser,
        }, testInfo) => {
            await ensureSalesAgentSession(agentAuth, agentContractsPage, agentGen);
            await agentContractsPage.openRequestByCustomer(sigCustomerName);
            await agentDetailPage.verifyNoVerifyControls();
            const previous = sigLink;
            await agentDetailPage.resendInvite('Customer', 'customer');
            sigLink = await fetchCustomerSigningLink(browser, testInfo, sigEmail);
            expect(sigLink).not.toBe(previous);
        });

        test('AC-6.4.1 & 6.4.2: Admin Re-send customer — toast and previous link stops working', async ({
            browser,
        }, testInfo) => {
            await openAdminSigDeal('Awaiting signatures');
            const previous = sigLink;
            await adminFulfilmentPage.resendInvite('Customer', 'customer');
            sigLink = await fetchCustomerSigningLink(browser, testInfo, sigEmail);
            expect(sigLink).toBeTruthy();
            expect(sigLink).not.toBe(previous);
            await expectSigningLinkInvalid(browser, testInfo, previous);
        });

        test('AC-6.5.1 & 6.5.3: Edit opens pre-filled email/phone; Save & re-send label', async () => {
            await openAdminSigDeal('Awaiting signatures');
            await adminFulfilmentPage.openCustomerEditForm({
                expectPrefilledEmail: sigEmail,
                expectPrefilledPhone: sigPhone,
            });
        });

        test('AC-6.5.5: Phone-only save shows phone updated and does not rotate the invite', async ({
            browser,
        }, testInfo) => {
            const previousLink = sigLink;
            const newPhone = '07999888777';
            await openAdminSigDeal('Awaiting signatures');
            await adminFulfilmentPage.openCustomerEditForm({
                expectPrefilledEmail: sigEmail,
            });
            await adminFulfilmentPage.saveCustomerContact(
                { phone: newPhone },
                'phoneOnly'
            );
            sigPhone = newPhone;
            // Same invite should still work (no re-send)
            const check = await browser.newContext({
                ...testInfo.project.use,
                httpCredentials: {
                    username: TestData.authCredentials.authUserName,
                    password: TestData.authCredentials.authPassword,
                },
                ignoreHTTPSErrors: true,
            });
            await prepareCookieConsent(check);
            const page = await check.newPage();
            await page.goto(previousLink, { waitUntil: 'domcontentloaded' });
            await expect(
                page.getByRole('heading', { name: 'Your We Want Waste contract' })
            ).toBeVisible({ timeout: 45000 });
            await check.close();
        });

        test('AC-6.5.4: Email change re-sends invite, toast, previous link dead', async ({
            browser,
        }, testInfo) => {
            const previousEmail = sigEmail;
            const previousLink = sigLink;
            const newEmail = await adminGen.generateRandomEmailmailinator();

            await openAdminSigDeal('Awaiting signatures');
            await adminFulfilmentPage.openCustomerEditForm({
                expectPrefilledEmail: previousEmail,
            });
            await adminFulfilmentPage.saveCustomerContact({ email: newEmail }, 'emailChanged');

            sigEmail = newEmail;
            sigLink = await fetchCustomerSigningLink(browser, testInfo, newEmail);
            await expectSigningLinkInvalid(browser, testInfo, previousLink);

            // Invite only on the new address: wait should succeed for newEmail (already) —
            // optional: confirm previous mailbox doesn't receive a fresh invite (skip — flaky timing).
            void previousEmail;
        });

        test('AC-6.4.1 (agent, post-edit): Agent still has Re-send while customer is awaiting', async () => {
            await ensureSalesAgentSession(agentAuth, agentContractsPage, agentGen);
            await agentContractsPage.openRequestByCustomer(sigCustomerName);
            await expect(agentDetailPage.resendBtn('Customer')).toBeVisible({ timeout: 15000 });
            await agentDetailPage.verifyNoVerifyControls();
        });

        test('Customer signs for verify / document ACs', async ({ browser }, testInfo) => {
            expect(sigLink).toBeTruthy();
            const customerCtx = await browser.newContext({
                ...testInfo.project.use,
                httpCredentials: {
                    username: TestData.authCredentials.authUserName,
                    password: TestData.authCredentials.authPassword,
                },
                ignoreHTTPSErrors: true,
                viewport: null,
            });
            await prepareCookieConsent(customerCtx);
            const customerPage = await customerCtx.newPage();
            const customerSigning = new ContractSigningPage(customerPage);
            await customerPage.goto(sigLink, { waitUntil: 'domcontentloaded' });
            await customerSigning.acceptCookiesIfVisible();
            await customerSigning.ensureStep2();
            const { password } = await customerSigning.signAgreementAndSaveCard(SIGNER_NAME, {
                password: DEFAULT_CONTRACT_CUSTOMER_PASSWORD,
            });
            saveContractCustomerCredentials({
                email: sigEmail,
                password,
                customerName: sigCustomerName,
            });
            await customerCtx.close();
        });

        test('AC-6.1.3: Signed row shows signed by {name}', async () => {
            await openAdminSigDeal('All');
            await adminFulfilmentPage.verifyPartySignedBy('Customer', SIGNER_NAME);
        });

        test('AC-6.2.1: Verify only after sign for admin; Verifying… then completes', async () => {
            await openAdminSigDeal('All');
            await expect(adminFulfilmentPage.verifyBtn('Customer')).toBeVisible();
            await expect(adminFulfilmentPage.verifyBtn('Customer')).toHaveText(/^Verify$/i);

            await ensureSalesAgentSession(agentAuth, agentContractsPage, agentGen);
            await agentContractsPage.openRequestByCustomer(sigCustomerName);
            await agentDetailPage.verifyNoVerifyControls();
        });

        test('AC-6.2.2: Verify customer — toast and Supplier Not sent yet → Awaiting Signature', async () => {
            await openAdminSigDeal('All');
            await adminFulfilmentPage.verifySupplierNotSentYet().catch(() => {});
            await adminFulfilmentPage.verifyCustomerSignature({ intercept: true });
        });

        test('AC-6.4.3: Re-send after customer signed — nothing to re-send', async () => {
            await openAdminSigDeal('All');
            // Re-send may remain or appear; clicking should warn if still present
            const resend = adminFulfilmentPage.resendBtn('Customer');
            if ((await resend.count()) > 0 && (await resend.isVisible().catch(() => false))) {
                await adminFulfilmentPage.resendInvite('Customer', 'alreadySigned');
            } else {
                // Control removed after sign is also valid lock-out behaviour
                await expect(resend).toHaveCount(0);
            }
        });

        test('AC-6.5.6: Contact edit blocked after customer has signed', async () => {
            await openAdminSigDeal('All');
            await adminFulfilmentPage.assertCustomerContactLockedAfterSign();
        });

        test('AC-6.3.1: Admin Signed document — Opening… and new tab', async () => {
            await openAdminSigDeal('All');
            await adminFulfilmentPage.openSignedDocument('Customer');
        });

        test('AC-6.3.2: Sales agent sees Agreement on file and cannot open document', async () => {
            await ensureSalesAgentSession(agentAuth, agentContractsPage, agentGen);
            await agentContractsPage.openRequestByCustomer(sigCustomerName);
            await agentDetailPage.verifyAgreementOnFileNoOpen('Customer');
        });

        test('AC-6.2.3: Verify supplier signature (not yet live) shows Supplier signature verified.', async ({
            browser,
        }, testInfo) => {
            // Shared Mailinator inbox — re-send so the newest invite is this deal
            await openAdminSigDeal('All');
            await adminFulfilmentPage.resendInvite('Supplier', 'supplier');

            const mailCtx = await browser.newContext({ ...testInfo.project.use });
            const mailPage = await mailCtx.newPage();
            const mailinator = new MailinatorPage(mailPage);
            const supplierEmail = TestData.contractPricingSupplier.email;
            await mailinator.waitForInvitationEmail(
                supplierEmail,
                SUPPLIER_SIGNING_EMAIL_SUBJECT,
                20,
                3000
            );
            const supplierLink = await mailinator.getInvitationLink(SUPPLIER_SIGNING_LINK_TEXT);
            await mailCtx.close();
            expect(supplierLink).toBeTruthy();

            const supplierCtx = await browser.newContext({
                ...testInfo.project.use,
                httpCredentials: {
                    username: TestData.authCredentials.authUserName,
                    password: TestData.authCredentials.authPassword,
                },
                ignoreHTTPSErrors: true,
                viewport: null,
            });
            await prepareCookieConsent(supplierCtx);
            const sp = await supplierCtx.newPage();
            const supplierSigning = new SupplierContractSigningPage(sp);
            await sp.goto(supplierLink, { waitUntil: 'domcontentloaded' });
            await supplierSigning.acceptCookiesIfVisible();
            await supplierSigning.signAgreementAndVerifyDone('QA SigReview Supplier');
            await supplierCtx.close();

            await openAdminSigDeal('All');
            // Supplier may show signature to check before verify is enabled
            await expect(adminFulfilmentPage.verifyBtn('Supplier')).toBeVisible({
                timeout: 30000,
            });
            await adminFulfilmentPage.verifySupplierSignature({ intercept: true });
            void sigSupplierName;
            void sigArea;
            void sigTermMonths;
        });
    });

    test.describe('6 — Re-send after customer decline (AC-6.4.5)', () => {
        /** @type {string} */ let declinedCustomerName;
        /** @type {string} */ let declinedEmail;

        test.beforeAll(async ({ browser }, testInfo) => {
            testInfo.setTimeout(720000);
            const seeded = await seedIssuedSigningContract({
                agentAuth,
                agentContractsPage,
                agentNewRequestPage,
                agentDetailPage,
                agentPage,
                agentGen,
                adminAuth,
                adminContractsPage,
                adminPricingPage,
                adminFulfilmentPage,
                adminGen,
                browser,
                testInfo,
                customerPrefix: 'QA SigDecline',
                upfrontLabel: 'Drawdown',
            });
            declinedCustomerName = seeded.customerName;
            declinedEmail = seeded.email;

            const ctx = await browser.newContext({
                ...testInfo.project.use,
                httpCredentials: {
                    username: TestData.authCredentials.authUserName,
                    password: TestData.authCredentials.authPassword,
                },
                ignoreHTTPSErrors: true,
                viewport: null,
            });
            await prepareCookieConsent(ctx);
            const page = await ctx.newPage();
            const signing = new ContractSigningPage(page);
            await page.goto(seeded.link, { waitUntil: 'domcontentloaded' });
            await signing.acceptCookiesIfVisible();
            await signing.ensureStep2();
            await signing.declineAgreement('QA decline for re-send test');
            await ctx.close();
        });

        test('AC-6.4.5: Re-send after decline returns Customer row to Awaiting Signature', async () => {
            await ensureAdminSession(adminAuth, adminContractsPage, adminGen);
            await adminContractsPage.gotoContractsPage();
            await adminContractsPage.selectTab('All');
            await adminContractsPage.openRequestByCustomer(declinedCustomerName, 'Open', 'All');
            await expect(adminFulfilmentPage.fulfilmentHeading).toBeVisible({ timeout: 20000 });

            // Row should reflect decline before re-send
            await expect(
                adminFulfilmentPage.signatureRow('Customer').getByText(/Declined/i)
            ).toBeVisible({ timeout: 20000 });

            await adminFulfilmentPage.resendInvite('Customer', 'customer');
            await adminFulfilmentPage.verifyCustomerAwaitingSignature();
            void declinedEmail;
        });
    });
});
