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
import { TestData } from '../../Data/testData.js';
import { genericFunctions } from '../../utils/genericFunctions.js';
import { prepareCookieConsent } from '../../utils/cookieConsent.js';

/**
 * Phase 2 — Fulfilment
 * Post-close contract signatures (customer + supplier) and fulfilment unlock.
 */

const CUSTOMER_SIGNING_EMAIL_SUBJECT = 'Your We Want Waste contract is ready to sign';
const CUSTOMER_SIGNING_LINK_TEXT = /Review and sign your contract/i;

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
        await adminContractsPage.gotoContractsPage();
        return;
    }
    // Already on contracts (or redirected); settle when heading is present
    if (await adminContractsPage.pageHeading.isVisible().catch(() => false)) {
        await adminContractsPage.waitForContractsListSettled();
        return;
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
}) {
    const customerName = `${customerPrefix} ${Date.now()}`;
    const email = await adminGen.generateRandomEmailmailinator();

    await ensureSalesAgentSession(agentAuth, agentContractsPage, agentGen);
    await agentNewRequestPage.gotoNewRequestPage();
    await agentNewRequestPage.submitValidRequest({
        customer: customerName,
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
    await adminPricingPage.lockGridSuccessfully({
        base: '30',
        floor: '10',
        cost: '120',
        discountMaxTerm: '5',
        discountFullUpfront: '5',
    });

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
    await adminFulfilmentPage.sendToCustomer({ email });
    await adminFulfilmentPage.verifyIssuedAwaitingSignatures({ customerEmail: email });

    const emailContext = await browser.newContext({ ...testInfo.project.use });
    const emailPage = await emailContext.newPage();
    const mailinatorPage = new MailinatorPage(emailPage);
    await mailinatorPage.waitForInvitationEmail(email, CUSTOMER_SIGNING_EMAIL_SUBJECT, 15, 3000);
    const link = await mailinatorPage.getInvitationLink(CUSTOMER_SIGNING_LINK_TEXT);
    await emailContext.close();
    expect(link).toBeTruthy();

    return { customerName, email, termMonths, link };
}

test.describe('Commercial Contract Sales — Phase 2 Fulfilment', () => {
    test.describe.configure({ mode: 'serial', timeout: 300000 });
    test.setTimeout(300000);

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
            testInfo.setTimeout(300000);
            // Seed a closed Drawdown deal for Issue-for-signing + shared signing token ACs
            fulfilmentCustomerName = `QA Fulfilment ${Date.now()}`;
            customerSigningEmail = await adminGen.generateRandomEmailmailinator();

            await ensureSalesAgentSession(agentAuth, agentContractsPage, agentGen);
            await agentNewRequestPage.gotoNewRequestPage();
            await agentNewRequestPage.submitValidRequest({
                customer: fulfilmentCustomerName,
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

        test('AC-4.10: Drawdown Step 3 — Save a payment card', async () => {
            await contractSigningPage.signAgreementSuccessfully('QA Drawdown Signer');
            await contractSigningPage.verifySaveCardStep();
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
});
