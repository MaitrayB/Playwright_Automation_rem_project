import { test, expect } from '@playwright/test';
import { AdminLogin } from '../../pages/Admin/AdminLogin.js';
import { SuppliersPage } from '../../pages/Admin/SuppliersPage.js';
import { TestData } from '../../Data/testData.js';
import { YopmailPage } from '../../pages/Suppliers/YopmailPage.js';
import { genericFunctions } from '../../utils/genericFunctions.js';
import { SupplierRegistrationPage } from '../../pages/Suppliers/SupplierRegistrationPage.js';

/** @type {SuppliersPage} */ let suppliersPage;
/** @type {AdminLogin} */ let adminLogin;
/** @type {YopmailPage} */ let yopmailPage;
/** @type {genericFunctions} */ let genFunctions;
/** @type {SupplierRegistrationPage} */ let supplierRegistrationPage;

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

        const supplierEmail = await suppliersPage.inviteSupplierViaEmailAndPhone({ invitationType: 'Blank Invitation' });
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

        const supplierEmail = await suppliersPage.inviteSupplierViaEmailAndPhone({ invitationType: 'Invitation with Co. Information' });

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
        const supplier = await suppliersPage.inviteSupplierViaEmailAndPhone({ invitationType: 'Blank Invitation' });

        const invitedEmail = supplier.email;
        expect(invitedEmail).toBeTruthy();

        // Create second page for email verification
        const emailContext = await browser.newContext();
        const emailPage = await emailContext.newPage();

        yopmailPage = new YopmailPage(emailPage);
        genFunctions = new genericFunctions(emailPage);

        // Navigate to yopmail and access inbox
        await genFunctions.goToYopmail();
        await genFunctions.accessInbox(invitedEmail);

        // Find invitation email and extract link
        await yopmailPage.waitForInvitationEmail(['Join Your Supplier Account', 'join your supplier account']);

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

        // Step 3: Verify registration page loads with pre-filled email
        await supplierRegistrationPage.verifyEmailPreFilled(invitedEmail);

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
        const supplierRegistrationPg = new SupplierRegistrationPage(registrationPage);
        const supplierLogin = new AdminLogin(registrationPage);
        const supplierLoginPageURL = genFunction.buildURL('/supplier/login');
        await registrationPage.goto(supplierLoginPageURL);
        await supplierRegistrationPg.supplierLogin(invitedEmail, supplierPassword);

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

        const email = await suppliersPage.getSupplierEmailBasedOnStatus('Joined');
        expect(email).toBeTruthy();

        // Step 1: Access already accepted invitation link
        // Create first page for email verification
        const emailContext = await browser.newContext();
        const emailPage = await emailContext.newPage();

        yopmailPage = new YopmailPage(emailPage);
        genFunctions = new genericFunctions(emailPage);


        // Navigate to yopmail and access inbox
        console.log(`Email of a supplier with 'Joined' status: ${email}`);
        await genFunctions.goToYopmail();
        await genFunctions.accessInbox(email);

        // Find invitation email and extract link
        await yopmailPage.waitForInvitationEmail(['Join Your Supplier Account', 'join your supplier account']);

        // Create authenticated context
        const registrationContext = await browser.newContext({
            httpCredentials: {
                username: TestData.authCredentials.authUserName,
                password: TestData.authCredentials.authPassword
            },
            ignoreHTTPSErrors: true
        });

        // Get the invitation link from email
        const invitationLink = await yopmailPage.getInvitationLink();

        // Create second page to access expired invitation link, Open inside authenticated context
        const registrationPage = await registrationContext.newPage();

        // Navigate to invitation link
        await registrationPage.goto(invitationLink, { waitUntil: 'domcontentloaded' });
        supplierRegistrationPage = new SupplierRegistrationPage(registrationPage);

        // Step 2 / 3: Verify error message displays & supplier cannot register again
        await supplierRegistrationPage.verifyAcceptedInvitationMsg();
        const currentURL = registrationPage.url();

        // Step 4: Verify link to login page is provided
        expect(currentURL).toContain('/supplier/login');

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

        const supplier = await suppliersPage.inviteSupplierViaEmailAndPhone({ invitationType: 'Invitation with Co. Information' });

        console.log('Supplier object:', supplier);
        const invitedEmail = supplier.email;
        const coName = supplier.companyName;
        // expect(invitedEmail).toBeTruthy();

        // Create second page for email verification
        const emailContext = await browser.newContext();
        const emailPage = await emailContext.newPage();

        yopmailPage = new YopmailPage(emailPage);
        genFunctions = new genericFunctions(emailPage);

        // Navigate to yopmail and access inbox
        await genFunctions.goToYopmail();
        await genFunctions.accessInbox(invitedEmail);

        // Find invitation email and extract link
        await yopmailPage.waitForInvitationEmail(coName, [`Join ${coName} on We Want Waste Supplier Platform`,
        `join ${coName} on we want waste supplier platform`]);

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

        // Verify email is pre-filled
        await supplierRegistrationPage.verifyEmailPreFilled(invitedEmail);

        // Fill registration form
        const supplierPassword = 'Password@123';
        await supplierRegistrationPage.fillRegistrationForm(supplierPassword);
        console.log('Registration form filled');

        // Submit registration
        await supplierRegistrationPage.submitRegistration();

        // Verify registration success
        await supplierRegistrationPage.verifyRegistrationSuccess();

        // Step 2: Complete onboarding form
        const onboardingPage = new SupplierRegistrationPage(registrationPage);
        await onboardingPage.completeOnboardingForm();
        console.log('Onboarding form completed');

        // Cleanup
        await context.close()
        await emailContext.close();
        await registrationContext.close();
    });

});