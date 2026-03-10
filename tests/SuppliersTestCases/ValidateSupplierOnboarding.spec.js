import { test, expect } from '@playwright/test';
import { AdminLogin } from '../../pages/Admin/AdminLogin.js';
import { SuppliersPage } from '../../pages/Admin/SuppliersPage.js';
import { TestData } from '../../Data/testData.js';
import { genericFunctions } from '../../utils/genericFunctions.js';
import { SupplierRegistrationPage } from '../../pages/Suppliers/SupplierRegistrationPage.js';
import { AccountPage } from '../../pages/Suppliers/AccountPage.js';
import { UsersPage } from '../../pages/Suppliers/UsersPage.js';
import { DashboardPage } from '../../pages/Suppliers/DashboardPage.js';
import { SupplierMenuNavigation } from '../../pages/Suppliers/SupplierMenuNavigation.js';
import { MailinatorPage } from '../../pages/Suppliers/MailinatorPage.js';

/** @type {SuppliersPage} */ let suppliersPage;
/** @type {AdminLogin} */ let adminLogin;
/** @type {genericFunctions} */ let genFunctions;
/** @type {SupplierRegistrationPage} */ let supplierRegistrationPage;
/** @type {AccountPage} */ let supplierAccount;
/** @type {UsersPage} */ let usersPage;
/** @type {DashboardPage} */ let dashboardPage;
/** @type {SupplierMenuNavigation} */ let supplierMenuNavigation;
/** @type {MailinatorPage} */ let mailinatorPage;

test.describe('Supplier Onboarding Validation cases', async () => {

    test('Scenario 1: Complete Onboarding Flow', async ({ browser }) => {
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

        const supplier = await suppliersPage.inviteSupplierViaEmailAndPhone({ invitationTypeOptions: 'Invitation with Co. Information', domainName: 'mailinator.com' });
        const email = supplier.email;
        console.log(email);
        expect(email).toBeTruthy();

        // Create second page for email verification
        const emailContext = await browser.newContext();
        const emailPage = await emailContext.newPage();

        //yopmailPage = new YopmailPage(emailPage);
        mailinatorPage = new MailinatorPage(emailPage);
        // genFunctions = new genericFunctions(emailPage);

        // Navigate to mailinator and access inbox
        await mailinatorPage.navigateToMailinator();
        await mailinatorPage.accessInbox(email);

        // // Find invitation email and extract link
        // await yopmailPage.waitForInvitationEmail(supplier.companyName);

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
});