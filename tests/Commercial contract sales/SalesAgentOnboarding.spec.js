import { test, expect } from '../../fixtures/test.js';
import { AdminLogin } from '../../pages/Admin/AdminLogin.js';
import { AdminUsersPage } from '../../pages/Admin/AdminUsersPage.js';
import { StaffInvitationRegistrationPage } from '../../pages/Admin/StaffInvitationRegistrationPage.js';
import { SalesAgentContractsPage } from '../../pages/Admin/SalesAgentContractsPage.js';
import { MailinatorPage } from '../../pages/Suppliers/MailinatorPage.js';
import { TestData } from '../../Data/testData.js';
import { genericFunctions } from '../../utils/genericFunctions.js';

/** @type {AdminLogin} */ let adminLogin;
/** @type {AdminUsersPage} */ let adminUsersPage;
/** @type {StaffInvitationRegistrationPage} */ let staffInvitationRegistrationPage;
/** @type {SalesAgentContractsPage} */ let salesAgentContractsPage;
/** @type {MailinatorPage} */ let mailinatorPage;
/** @type {genericFunctions} */ let genFunctions;

const SALES_AGENT_INVITE_SUBJECT = "You've been invited to join We Want Waste as Sales Agent";
const SALES_AGENT_INVITE_LINK_TEXT = /Accept invitation and create your account/i;
const REGISTRATION_PASSWORD = 'Password@123';

async function createAuthenticatedContext(browser, testInfo) {
    return browser.newContext({
        ...testInfo.project.use,
        httpCredentials: {
            username: TestData.authCredentials.authUserName,
            password: TestData.authCredentials.authPassword,
        },
        ignoreHTTPSErrors: true,
    });
}

test.describe('Onboarding — Invite, Register & Login', () => {
    test.describe('1.1 — Invitation', () => {
        test('AC-1.1.1: Admin invites Sales Agent and invitee receives invitation email', async ({ browser }, testInfo) => {
            test.setTimeout(180000);

            const context = await createAuthenticatedContext(browser, testInfo);
            const page = await context.newPage();
            adminLogin = new AdminLogin(page);
            adminUsersPage = new AdminUsersPage(page);
            genFunctions = new genericFunctions(page);

            const inviteeEmail = await genFunctions.generateRandomEmailmailinator();

            await adminLogin.goto(genFunctions.buildURL('/agent/login'));
            await adminLogin.adminLogin(TestData.credentials.agent.username, TestData.credentials.agent.password);
            await adminLogin.goToUsersPage();

            const invite = await adminUsersPage.inviteUserByRole(inviteeEmail, 'Sales Agent');

            const emailContext = await browser.newContext({ ...testInfo.project.use });
            const emailPage = await emailContext.newPage();
            mailinatorPage = new MailinatorPage(emailPage);

            await mailinatorPage.waitForInvitationEmail(invite.email, SALES_AGENT_INVITE_SUBJECT);
            const invitationLink = await mailinatorPage.getInvitationLink(SALES_AGENT_INVITE_LINK_TEXT);

            expect(invitationLink).toBeTruthy();

            await context.close();
            await emailContext.close();
        });

        test('AC-1.1.2: Registration link opens public Sales Agent registration page', async ({ browser }, testInfo) => {
            test.setTimeout(180000);

            const context = await createAuthenticatedContext(browser, testInfo);
            const page = await context.newPage();
            adminLogin = new AdminLogin(page);
            adminUsersPage = new AdminUsersPage(page);
            genFunctions = new genericFunctions(page);

            const inviteeEmail = await genFunctions.generateRandomEmailmailinator();

            await adminLogin.goto(genFunctions.buildURL('/agent/login'));
            await adminLogin.adminLogin(TestData.credentials.agent.username, TestData.credentials.agent.password);
            await adminLogin.goToUsersPage();
            const invite = await adminUsersPage.inviteUserByRole(inviteeEmail, 'Sales Agent');

            const emailContext = await browser.newContext({ ...testInfo.project.use });
            const emailPage = await emailContext.newPage();
            mailinatorPage = new MailinatorPage(emailPage);
            await mailinatorPage.waitForInvitationEmail(invite.email, SALES_AGENT_INVITE_SUBJECT);
            const invitationLink = await mailinatorPage.getInvitationLink(SALES_AGENT_INVITE_LINK_TEXT);

            const registrationContext = await createAuthenticatedContext(browser, testInfo);
            const registrationPage = await registrationContext.newPage();
            await registrationPage.goto(invitationLink, { waitUntil: 'domcontentloaded' });

            staffInvitationRegistrationPage = new StaffInvitationRegistrationPage(registrationPage);
            await staffInvitationRegistrationPage.verifyInvitationRegistrationPage(invite.email, 'Sales Agent');

            await expect(registrationPage).toHaveURL(/\/staff-invitation\//);

            await context.close();
            await emailContext.close();
            await registrationContext.close();
        });

        test('AC-1.1.3: Creating account redirects to Staff Sign In with success banner', async ({ browser }, testInfo) => {
            test.setTimeout(180000);

            const context = await createAuthenticatedContext(browser, testInfo);
            const page = await context.newPage();
            adminLogin = new AdminLogin(page);
            adminUsersPage = new AdminUsersPage(page);
            genFunctions = new genericFunctions(page);

            const inviteeEmail = await genFunctions.generateRandomEmailmailinator();

            await adminLogin.goto(genFunctions.buildURL('/agent/login'));
            await adminLogin.adminLogin(TestData.credentials.agent.username, TestData.credentials.agent.password);
            await adminLogin.goToUsersPage();
            const invite = await adminUsersPage.inviteUserByRole(inviteeEmail, 'Sales Agent');

            const emailContext = await browser.newContext({ ...testInfo.project.use });
            const emailPage = await emailContext.newPage();
            mailinatorPage = new MailinatorPage(emailPage);
            await mailinatorPage.waitForInvitationEmail(invite.email, SALES_AGENT_INVITE_SUBJECT);
            const invitationLink = await mailinatorPage.getInvitationLink(SALES_AGENT_INVITE_LINK_TEXT);

            const registrationContext = await createAuthenticatedContext(browser, testInfo);
            const registrationPage = await registrationContext.newPage();
            await registrationPage.goto(invitationLink, { waitUntil: 'domcontentloaded' });

            staffInvitationRegistrationPage = new StaffInvitationRegistrationPage(registrationPage);
            await staffInvitationRegistrationPage.verifyInvitationRegistrationPage(invite.email, 'Sales Agent');
            await staffInvitationRegistrationPage.fillRegistrationForm({
                firstName: 'Sales',
                lastName: 'Agent',
                password: REGISTRATION_PASSWORD,
            });
            await staffInvitationRegistrationPage.submitCreateAccount();
            await staffInvitationRegistrationPage.verifyRedirectedToStaffSignInWithSuccessBanner();

            await context.close();
            await emailContext.close();
            await registrationContext.close();
        });
    });

    test.describe('1.2 — Login', () => {
        test.describe.configure({ mode: 'serial' });

        test('AC-1.2.2: Unauthenticated access to Contracts redirects to Staff Sign In', async ({ browser }, testInfo) => {
            test.setTimeout(60000);

            const context = await createAuthenticatedContext(browser, testInfo);
            const page = await context.newPage();
            salesAgentContractsPage = new SalesAgentContractsPage(page);
            adminLogin = new AdminLogin(page);

            await salesAgentContractsPage.gotoContractsPage();

            await expect(page).toHaveURL(/\/agent\/login/, { timeout: 30000 });
            await expect(adminLogin.staffSignInHeading).toBeVisible({ timeout: 30000 });

            await context.close();
        });

        test('AC-1.2.1 & AC-1.2.3: Sales agent sign in reaches Contracts; logout returns to Staff Sign In', async ({ browser }, testInfo) => {
            test.setTimeout(60000);

            const context = await createAuthenticatedContext(browser, testInfo);
            const page = await context.newPage();
            adminLogin = new AdminLogin(page);
            salesAgentContractsPage = new SalesAgentContractsPage(page);
            genFunctions = new genericFunctions(page);

            await adminLogin.goto(genFunctions.buildURL('/agent/login'));
            await adminLogin.salesAgentLogin(
                TestData.credentials.salesAgent.username,
                TestData.credentials.salesAgent.password
            );
            await salesAgentContractsPage.verifyContractsPageLoaded();

            await salesAgentContractsPage.logout();
            await expect(page).toHaveURL(/\/agent\/login/, { timeout: 30000 });
            await expect(adminLogin.staffSignInHeading).toBeVisible();

            await context.close();
        });
    });
});
