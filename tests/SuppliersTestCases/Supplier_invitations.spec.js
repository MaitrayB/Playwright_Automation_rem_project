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
        let invitedEmail;
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

        await adminLogin.goto();
        await adminLogin.adminLogin(TestData.credentials.agent.username, TestData.credentials.agent.password);
        await adminLogin.goToSuppliersPage();

        const supplierDetails = await suppliersPage.inviteSupplierViaEmailAndPhone({ invitationType: 'Blank Invitation' });

        //Delete invited supplier
        await suppliersPage.deleteSupplier(supplierDetails);

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

        await adminLogin.goto();
        await adminLogin.adminLogin(TestData.credentials.agent.username, TestData.credentials.agent.password);
        await adminLogin.goToSuppliersPage();

        const supplierDetails = await suppliersPage.inviteSupplierViaEmailAndPhone({ invitationType: 'Invitation with Co. Information' });

        //Delete invited supplier
        await suppliersPage.deleteSupplier(supplierDetails);

        // Cleanup
        await context.close();
    });

    test('Scenario 3: Supplier Registers via Invitation Link', async ({ browser }) => {
        let invitedEmail;
        //---------------------------------------
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

        const supplierDetails = await suppliersPage.inviteSupplierViaEmailAndPhone({ invitationType: 'Blank Invitation' });

        console.log('Supplier details from blank invitation test is:', supplierDetails);
        const emailMatch = supplierDetails.match(/\d+-([\w._-]+@yopmail\.com)/);

        invitedEmail = emailMatch ? emailMatch[1] : null;
        //-------------------------------------
        //invitedEmail = 'Nicolette_Medhurst@yopmail.com';
        if (!invitedEmail) {
            throw new Error('Could not extract email from supplier details');
        }
        // console.log(email);
        console.log('Invited supplier email:', invitedEmail);

        // Step 2: Create second page for email verification
        const emailContext = await browser.newContext();
        const emailPage = await emailContext.newPage();

        yopmailPage = new YopmailPage(emailPage);
        genFunctions = new genericFunctions(emailPage);

        // Navigate to yopmail and access inbox
        await genFunctions.goToYopmail();
        await genFunctions.accessInbox(invitedEmail);

        // Step 3: Find invitation email and extract link
        await yopmailPage.waitForInvitationEmail(['Join Your Supplier Account', 'join your supplier account']);

        // Create authenticated context
        // Step 4: Create third page for registration
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
        console.log('Supplier registration page loaded');

        // Step 5: Verify email is pre-filled
        await supplierRegistrationPage.verifyEmailPreFilled(invitedEmail);
        console.log('Email pre-filled correctly');

        // Step 6: Fill registration form
        const supplierPassword = 'Password@123';
        await supplierRegistrationPage.fillRegistrationForm(supplierPassword);
        console.log('Registration form filled');

        // Step 7: Submit registration
        await supplierRegistrationPage.submitRegistration();
        console.log('Registration form submitted');

        // Step 8: Verify registration success
        await supplierRegistrationPage.verifyRegistrationSuccess();
        console.log('Registration successful');

        // Step 9: Verify automatic redirect to dashboard/onboarding
        await registrationPage.waitForTimeout(3000);
        const currentUrl = registrationPage.url();
        console.log('Current URL after registration:', currentUrl);

        // Verify that the page has redirected (not on registration page anymore)
        expect(currentUrl).not.toContain('/register');
        expect(currentUrl).not.toContain('/invite');
        expect(currentUrl).toContain('/onboarding');
        console.log('Successfully redirected onboarding page');

        //Verify AutoLogin to supplier's a/c
        //https://develop.wewantwaste.co.uk/supplier/login
        const genFunction = new genericFunctions(registrationPage);
        const supplierRegistrationPg = new SupplierRegistrationPage(registrationPage);
        const supplierLogin = new AdminLogin(registrationPage);
        const supplierLoginPageURL = genFunction.buildURL('/supplier/login');
        await supplierLogin.goto(supplierLoginPageURL);
        await supplierRegistrationPg.supplierLogin(invitedEmail, supplierPassword);

        // Cleanup
        await context.close()
        await emailContext.close();
        await registrationContext.close();
    });

    test('Scenario 5: Already Accepted Invitation', async ({ browser }) => {

        // Step 1: Create first page for email verification
        const emailContext = await browser.newContext();
        const emailPage = await emailContext.newPage();

        yopmailPage = new YopmailPage(emailPage);
        genFunctions = new genericFunctions(emailPage);

        // Navigate to yopmail and access inbox
        await genFunctions.goToYopmail();
        await genFunctions.accessInbox('Alena_Kessler@yopmail.com');

        // Step 2: Find invitation email and extract link
        await yopmailPage.waitForInvitationEmail(['Join Your Supplier Account', 'join your supplier account']);

        // Create authenticated context
        // Step 3: Create second page to access expired invitation link
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

        // Verify that the page shows already accepted invitation message
        await supplierRegistrationPage.verifyAcceptedInvitationMsg();
        const currentURL = registrationPage.url();
        expect(currentURL).toContain('/supplier/login');

        // Cleanup
        await emailContext.close();
        await registrationContext.close();
    });

});