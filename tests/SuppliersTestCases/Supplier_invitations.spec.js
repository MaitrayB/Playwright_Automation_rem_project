import { test, expect } from '@playwright/test';
import { AdminLogin } from '../../pages/Admin/AdminLogin.js';
import { SuppliersPage } from '../../pages/Admin/SuppliersPage.js';
import { TestData } from '../../Data/testData.js';
import { YopmailPage } from '../../pages/Suppliers/YopmailPage.js';
import { genericFunctions } from '../../utils/genericFunctions.js';
import { SupplierRegistrationPage } from '../../pages/Suppliers/SupplierRegistrationPage.js';
import { AccountPage } from '../../pages/Suppliers/AccountPage.js';
import { UsersPage } from '../../pages/Suppliers/UsersPage.js';
import { DashboardPage } from '../../pages/Suppliers/DashboardPage.js';
import { SupplierMenuNavigation } from '../../pages/Suppliers/SupplierMenuNavigation.js';
import { MailinatorPage } from '../../pages/Suppliers/MailinatorPage.js';

/** @type {SuppliersPage} */ let suppliersPage;
/** @type {AdminLogin} */ let adminLogin;
/** @type {YopmailPage} */ let yopmailPage;
/** @type {genericFunctions} */ let genFunctions;
/** @type {SupplierRegistrationPage} */ let supplierRegistrationPage;
/** @type {AccountPage} */ let supplierAccount;
/** @type {UsersPage} */ let usersPage;
/** @type {DashboardPage} */ let dashboardPage;
/** @type {SupplierMenuNavigation} */ let supplierMenuNavigation;
/** @type {MailinatorPage} */ let mailinatorPage;

test.describe('Supplier Invitations', async () => {

    test('Scenario 1: Blank Invitation', async ({ browser }) => {
        const context = await browser.newContext({
            httpCredentials: {
                username: TestData.authCredentials.authUserName,
                password: TestData.authCredentials.authPassword
            },
            ignoreHTTPSErrors: true
        });
        const page = await context.newPage();
        adminLogin = new AdminLogin(page);
        suppliersPage = new SuppliersPage(page);
        genFunctions = new genericFunctions(page);

        await adminLogin.goto(genFunctions.buildURL('/agent/login'));
        await adminLogin.adminLogin(TestData.credentials.agent.username, TestData.credentials.agent.password);
        await adminLogin.goToSuppliersPage();

        const supplierEmail = await suppliersPage.inviteSupplierViaEmailAndPhone({ invitationTypeOptions: 'Blank Invitation', domainName: 'yopmail.com' });
        console.log(supplierEmail);
        //Delete invited supplier
        await suppliersPage.deleteSupplier(supplierEmail.email);

        // Cleanup
        await context.close();
    });

    test('Scenario 2: Invitation with Company Information', async ({ browser }) => {
        const context = await browser.newContext({
            httpCredentials: {
                username: TestData.authCredentials.authUserName,
                password: TestData.authCredentials.authPassword
            },
            ignoreHTTPSErrors: true
        });
        const page = await context.newPage();
        adminLogin = new AdminLogin(page);
        suppliersPage = new SuppliersPage(page);
        genFunctions = new genericFunctions(page);

        await adminLogin.goto(genFunctions.buildURL('/agent/login'));
        await adminLogin.adminLogin(TestData.credentials.agent.username, TestData.credentials.agent.password);
        await adminLogin.goToSuppliersPage();

        const supplierEmail = await suppliersPage.inviteSupplierViaEmailAndPhone({ invitationTypeOptions: 'Invitation with Co. Information', domainName: 'yopmail.com' });

        //Delete invited supplier
        await suppliersPage.deleteSupplier(supplierEmail.email);

        // Cleanup
        await context.close();
    });

    test('Scenario 3: Supplier Registers via Invitation Link', async ({ browser }) => {
        // let invitedEmail;

        const context = await browser.newContext({
            httpCredentials: {
                username: TestData.authCredentials.authUserName,
                password: TestData.authCredentials.authPassword
            },
            ignoreHTTPSErrors: true
        });
        const page = await context.newPage();
        adminLogin = new AdminLogin(page);
        suppliersPage = new SuppliersPage(page);
        genFunctions = new genericFunctions(page);

        await adminLogin.goto(genFunctions.buildURL('/agent/login'));
        await adminLogin.adminLogin(TestData.credentials.agent.username, TestData.credentials.agent.password);
        await adminLogin.goToSuppliersPage();

        //Step 1: Receive invitation email/SMS and extract invitation link
        const supplier = await suppliersPage.inviteSupplierViaEmailAndPhone({ invitationTypeOptions: 'Invitation with Co. Information', domainName: 'yopmail.com' });

        expect(supplier.email).toBeTruthy();

        // Create second page for email verification
        const emailContext = await browser.newContext();
        const emailPage = await emailContext.newPage();

        yopmailPage = new YopmailPage(emailPage);
        genFunctions = new genericFunctions(emailPage);

        // Navigate to yopmail and access inbox
        await genFunctions.goToYopmail();
        await genFunctions.accessInbox(supplier.email);

        // Find invitation email and extract link
        await yopmailPage.waitForInvitationEmail(supplier.companyName);

        // Create authenticated context
        // Create third page for registration
        const registrationContext = await browser.newContext({
            httpCredentials: {
                username: TestData.authCredentials.authUserName,
                password: TestData.authCredentials.authPassword
            },
            ignoreHTTPSErrors: true
        });

        // Step 2: Get & Click invitation link
        const invitationLink = await yopmailPage.getInvitationLink();

        // Open inside authenticated context
        const registrationPage = await registrationContext.newPage();

        // Navigate to invitation link
        await registrationPage.goto(invitationLink, { waitUntil: 'domcontentloaded' });
        supplierRegistrationPage = new SupplierRegistrationPage(registrationPage);

        await supplierRegistrationPage.verifyPageLoaded();
        await supplierRegistrationPage.waitForTimeout(2000);

        // Step 3: Verify registration page loads with pre-filled email
        await supplierRegistrationPage.verifyEmailPreFilled(supplier.email);

        // Step 4: Enter password and confirm password
        const supplierPassword = 'Password@123';
        await supplierRegistrationPage.fillRegistrationForm(supplierPassword);

        // Step 5: Submit registration
        await supplierRegistrationPage.submitRegistration();

        // Verify registration success
        await supplierRegistrationPage.verifyRegistrationSuccess();

        // Step 7: Verify redirect to onboarding page
        // await registrationPage.waitForTimeout(3000);
        const currentUrl = registrationPage.url();
        expect(currentUrl).not.toContain('/register');
        expect(currentUrl).not.toContain('/invite');
        expect(currentUrl).toContain('/onboarding');

        //Step 6: Verify automatic login
        const genFunction = new genericFunctions(registrationPage);
        const supplierLoginPageURL = genFunction.buildURL('/supplier/login');
        await registrationPage.goto(supplierLoginPageURL);
        await supplierRegistrationPage.supplierLogin(supplier.email, supplierPassword);
        await registrationPage.waitForTimeout(3000);

        // Cleanup
        await context.close()
        await emailContext.close();
        await registrationContext.close();
    });

    test('Scenario 5: Already Accepted Invitation', async ({ browser }) => {
        const context = await browser.newContext({
            httpCredentials: {
                username: TestData.authCredentials.authUserName,
                password: TestData.authCredentials.authPassword
            },
            ignoreHTTPSErrors: true
        });
        const page = await context.newPage();
        adminLogin = new AdminLogin(page);
        suppliersPage = new SuppliersPage(page);
        genFunctions = new genericFunctions(page);

        await adminLogin.goto(genFunctions.buildURL('/agent/login'));
        await adminLogin.adminLogin(TestData.credentials.agent.username, TestData.credentials.agent.password);
        await adminLogin.goToSuppliersPage();

        // Get supplier with status "Joined"
        const supplierInfo = await suppliersPage.getSupplierEmailBasedOnStatus('Joined');
        await page.waitForTimeout(3000);
        expect(supplierInfo.email).toBeTruthy();

        // Access already accepted invitation link
        const emailContext = await browser.newContext();
        const emailPage = await emailContext.newPage();
        yopmailPage = new YopmailPage(emailPage);
        genFunctions = new genericFunctions(emailPage);

        await genFunctions.goToYopmail();
        await genFunctions.accessInbox(supplierInfo.email);

        // Find invitation email and extract link
        await yopmailPage.waitForInvitationEmail(supplierInfo.companyName);
        const invitationLink = await yopmailPage.getInvitationLink();

        // Open invitation link in authenticated context
        const registrationContext = await browser.newContext({
            httpCredentials: {
                username: TestData.authCredentials.authUserName,
                password: TestData.authCredentials.authPassword
            },
            ignoreHTTPSErrors: true
        });
        const registrationPage = await registrationContext.newPage();
        supplierRegistrationPage = new SupplierRegistrationPage(registrationPage);

        await registrationPage.goto(invitationLink, { waitUntil: 'domcontentloaded' });

        // Verify error message displays
        await supplierRegistrationPage.verifyAcceptedInvitationMsg();

        // Verify cannot register again (no registration form visible)
        // Optionally, check that registration button is not visible
        await expect(registrationPage.getByRole('button', { name: 'Complete Registration' })).not.toBeVisible();

        // Verify link to login page is provided
        const currentURL = registrationPage.url();
        expect(currentURL).toContain('/supplier/login');
        await registrationPage.waitForTimeout(3000);

        // Cleanup
        await emailContext.close();
        await registrationContext.close();
    });

    test('Scenario 6: Supplier Completes Onboarding', async ({ browser }) => {
        const context = await browser.newContext({
            httpCredentials: {
                username: TestData.authCredentials.authUserName,
                password: TestData.authCredentials.authPassword
            },
            ignoreHTTPSErrors: true
        });
        const page = await context.newPage();
        adminLogin = new AdminLogin(page);
        suppliersPage = new SuppliersPage(page);
        genFunctions = new genericFunctions(page);

        await adminLogin.goto(genFunctions.buildURL('/agent/login'));
        await adminLogin.adminLogin(TestData.credentials.agent.username, TestData.credentials.agent.password);
        await adminLogin.goToSuppliersPage();

        const supplier = await suppliersPage.inviteSupplierViaEmailAndPhone({ invitationTypeOptions: 'Invitation with Co. Information', domainName: 'yopmail.com' });
        const email = supplier.email;
        console.log(email);
        expect(email).toBeTruthy();

        // Create second page for email verification
        const emailContext = await browser.newContext();
        const emailPage = await emailContext.newPage();

        yopmailPage = new YopmailPage(emailPage);
        genFunctions = new genericFunctions(emailPage);

        // Navigate to yopmail and access inbox
        await genFunctions.goToYopmail();
        await genFunctions.accessInbox(email);

        // Find invitation email and extract link
        await yopmailPage.waitForInvitationEmail(supplier.companyName);

        // Create third page for registration
        const registrationContext = await browser.newContext({
            httpCredentials: {
                username: TestData.authCredentials.authUserName,
                password: TestData.authCredentials.authPassword
            },
            ignoreHTTPSErrors: true
        });

        // Get the invitation link from email
        const invitationLink = await yopmailPage.getInvitationLink();

        // Open inside authenticated context
        const registrationPage = await registrationContext.newPage();

        // Navigate to invitation link
        await registrationPage.goto(invitationLink, { waitUntil: 'domcontentloaded' });
        supplierRegistrationPage = new SupplierRegistrationPage(registrationPage);

        await supplierRegistrationPage.verifyPageLoaded();

        // Step 2: Complete Onboarding Form
        // Verify email is pre-filled
        await supplierRegistrationPage.verifyEmailPreFilled(email);

        // Fill registration form
        const supplierPassword = 'Password@123';
        await supplierRegistrationPage.fillRegistrationForm(supplierPassword);

        // Submit registration
        await supplierRegistrationPage.submitRegistration();

        // Verify registration success
        await supplierRegistrationPage.verifyRegistrationSuccess();

        // Step 3: Submit onboarding
        await supplierRegistrationPage.completeOnboardingForm(registrationPage, supplier);

        //Step 4: Verify redirect to orders page
        await supplierRegistrationPage.verifySupplierRedirectedToOrdersPage(registrationPage);

        //Step 5: Verify supplier status is "active"
        supplierAccount = new AccountPage(registrationPage);
        supplierMenuNavigation = new SupplierMenuNavigation(registrationPage);

        await supplierMenuNavigation.navigateToAccountPage();
        await supplierAccount.verifyAccountStatus('Active');

        //Delete Supplier after test
        await page.bringToFront();
        await suppliersPage.deleteSupplier(email); await page.waitForTimeout(1000);

        // Cleanup
        await context.close()
        await emailContext.close();
        await registrationContext.close();
    });

    test('Scenario 7 & 8: Supplier Invites Team Member & Team member registers', async ({ browser }) => {
        // Step 1: Login as supplier admin
        const context = await browser.newContext({
            httpCredentials: {
                username: TestData.authCredentials.authUserName,
                password: TestData.authCredentials.authPassword
            },
            ignoreHTTPSErrors: true
        });

        const page = await context.newPage();
        genFunctions = new genericFunctions(page);
        usersPage = new UsersPage(page);
        supplierMenuNavigation = new SupplierMenuNavigation(page);
        supplierAccount = new AccountPage(page);

        await genFunctions.goto(page, '/supplier/login');
        await genFunctions.autoLogin(TestData.credentials.supplier.username, TestData.credentials.supplier.password);
        await supplierMenuNavigation.redirectToUsersPage();
        const userDetails = await usersPage.inviteTeamMember();
        await usersPage.verifyUserDetails(userDetails.emailInput, await userDetails.status);

        await supplierMenuNavigation.navigateToAccountPage();
        // const companyName = await supplierAccount.companyName();

        // Create second page for email verification
        const emailContext = await browser.newContext();
        const emailPage = await emailContext.newPage();

        //yopmailPage = new YopmailPage(emailPage);
        mailinatorPage = new MailinatorPage(emailPage);
        genFunctions = new genericFunctions(emailPage);

        // Navigate to mailinator and access inbox
        await mailinatorPage.navigateToMailinator();
        await mailinatorPage.accessInbox(userDetails.emailInput);

        // Create third page for registration
        const registrationContext = await browser.newContext({
            httpCredentials: {
                username: TestData.authCredentials.authUserName,
                password: TestData.authCredentials.authPassword
            },
            ignoreHTTPSErrors: true
        });

        // Get the invitation link from email
        const invitationLink = await mailinatorPage.getInvitationLink();

        // Open inside authenticated context
        const registrationPage = await registrationContext.newPage();

        // Navigate to invitation link
        await registrationPage.goto(invitationLink, { waitUntil: 'domcontentloaded' });
        supplierRegistrationPage = new SupplierRegistrationPage(registrationPage);
        dashboardPage = new DashboardPage(registrationPage);
        supplierMenuNavigation = new SupplierMenuNavigation(registrationPage);
        usersPage = new UsersPage(registrationPage);

        await supplierRegistrationPage.verifyPageLoaded();

        // Step 2: Complete Onboarding Form
        // Verify email is pre-filled
        await supplierRegistrationPage.verifyEmailPreFilled(userDetails.emailInput.toLowerCase());

        // Fill registration form
        const supplierPassword = 'Password@123';
        await supplierRegistrationPage.fillRegistrationForm(supplierPassword);

        // Submit registration
        //verify registered user navigates to dashboard
        await supplierRegistrationPage.submitRegistration();
        await dashboardPage.verifyDashboardPageLoaded();

        // Cleanup
        await context.close()
        await emailContext.close();
        await registrationContext.close();
    });

});