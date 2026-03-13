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

        const supplier = await suppliersPage.inviteSupplierViaEmailAndPhone({
            invitationTypeOptions: 'Invitation with Co. Information',
            domainName: 'mailinator.com'
        });
        const email = supplier.email;
        console.log(email);
        expect(email).toBeTruthy();

        // Create second page for email verification
        const emailContext = await browser.newContext();
        const emailPage = await emailContext.newPage();

        mailinatorPage = new MailinatorPage(emailPage);

        // Navigate to mailinator and access inbox
        await mailinatorPage.navigateToMailinator();
        await mailinatorPage.accessInbox(email);

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
        await page.reload();
        await suppliersPage.deleteSupplier(email);
        await page.waitForTimeout(1000);

        // Cleanup
        await context.close()
        await emailContext.close();
        await registrationContext.close();
    });

    test('Scenario 2: Pre-filled Data', async ({ browser }) => {
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

        //Step 1: Register with invitation containing company information
        const supplier = await suppliersPage.inviteSupplierViaEmailAndPhone({
            invitationTypeOptions: 'Invitation with Co. Information',
            domainName: 'mailinator.com'
        });

        expect(supplier.email).toBeTruthy();

        const emailContext = await browser.newContext();
        const emailPage = await emailContext.newPage();
        mailinatorPage = new MailinatorPage(emailPage);

        await mailinatorPage.navigateToMailinator();
        await mailinatorPage.accessInbox(supplier.email);

        const registrationContext = await browser.newContext({
            httpCredentials: {
                username: TestData.authCredentials.authUserName,
                password: TestData.authCredentials.authPassword
            },
            ignoreHTTPSErrors: true
        });

        const invitationLink = await mailinatorPage.getInvitationLink();
        const registrationPage = await registrationContext.newPage();

        await registrationPage.goto(invitationLink, { waitUntil: 'domcontentloaded' });
        supplierRegistrationPage = new SupplierRegistrationPage(registrationPage);
        supplierMenuNavigation = new SupplierMenuNavigation(registrationPage);

        //Supplier registration
        await supplierRegistrationPage.verifyPageLoaded();
        // await supplierRegistrationPage.waitForTimeout();
        await supplierRegistrationPage.verifyEmailPreFilled(supplier.email);
        //const supplierPassword = 'Password@123';
        await supplierRegistrationPage.fillRegistrationForm(TestData.credentials.supplier.password);
        await supplierRegistrationPage.submitRegistration();

        // Verify registration success
        await supplierRegistrationPage.verifyRegistrationSuccess();

        // Step2: Access onboarding page
        const currentUrl = registrationPage.url();
        expect(currentUrl).not.toContain('/register');
        expect(currentUrl).not.toContain('/invite');
        expect(currentUrl).toContain('/onboarding');

        //Step 3: Verify company name is pre-filled from invitation
        await supplierRegistrationPage.verifyCompanyNameOnOnboardingForm(supplier.companyName);
        await expect(registrationPage.getByText('ℹ️ Company name has been pre-filled from your invitation. Please confirm or update it below.')).toBeVisible();

        //Step5: Edit company name
        const newCoName = await supplierRegistrationPage.changeCompanyNameOnOnboardingForm();
        supplier.companyName = newCoName; // Update supplier object with new company name for later validation

        //Step 6: Complete remaining steps
        await supplierRegistrationPage.completeOnboardingForm(registrationPage, supplier);

        //Step 7: Verify edited data is saved
        await supplierRegistrationPage.verifySupplierRedirectedToOrdersPage(registrationPage);
        await supplierMenuNavigation.navigateToAccountPage();
        supplierAccount = new AccountPage(registrationPage);
        await supplierAccount.verifyCompanyName(supplier.companyName); // Verify updated company name is displayed on account page
        await page.bringToFront();
        await page.reload();

        //Delete Supplier after test
        await suppliersPage.deleteSupplier(supplier.email);
        await page.waitForTimeout(1000);

        // Cleanup
        await context.close()
        await emailContext.close();
        await registrationContext.close();
    });

    test('Scenario 6: Incomplete Onboarding Redirect', async ({ browser }) => {

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

        //Step 1: Register as supplier
        await adminLogin.goto(genFunctions.buildURL('/agent/login'));
        await adminLogin.adminLogin(TestData.credentials.agent.username, TestData.credentials.agent.password);
        await adminLogin.goToSuppliersPage();

        const supplier = await suppliersPage.inviteSupplierViaEmailAndPhone({
            invitationTypeOptions: 'Invitation with Co. Information',
            domainName: 'mailinator.com'
        });

        expect(supplier.email).toBeTruthy();

        const emailContext = await browser.newContext();
        const emailPage = await emailContext.newPage();
        mailinatorPage = new MailinatorPage(emailPage);

        await mailinatorPage.navigateToMailinator();
        await mailinatorPage.accessInbox(supplier.email);

        const registrationContext = await browser.newContext({
            httpCredentials: {
                username: TestData.authCredentials.authUserName,
                password: TestData.authCredentials.authPassword
            },
            ignoreHTTPSErrors: true
        });

        const invitationLink = await mailinatorPage.getInvitationLink();
        const registrationPage = await registrationContext.newPage();

        await registrationPage.goto(invitationLink, { waitUntil: 'domcontentloaded' });
        supplierRegistrationPage = new SupplierRegistrationPage(registrationPage);
        supplierMenuNavigation = new SupplierMenuNavigation(registrationPage);

        //Supplier registration
        await supplierRegistrationPage.verifyPageLoaded();
        // await supplierRegistrationPage.waitForTimeout();
        await supplierRegistrationPage.verifyEmailPreFilled(supplier.email);
        const supplierPassword = 'Password@123';
        await supplierRegistrationPage.fillRegistrationForm(supplierPassword);
        await supplierRegistrationPage.submitRegistration();

        // Verify registration success
        await supplierRegistrationPage.verifyRegistrationSuccess();

        // Verify redirect to onboarding page
        const currentUrl = registrationPage.url();
        expect(currentUrl).not.toContain('/register');
        expect(currentUrl).not.toContain('/invite');
        expect(currentUrl).toContain('/onboarding');

        // Step2: Start onboarding but do not complete
        await supplierRegistrationPage.verifyCompanyNameOnOnboardingForm(supplier.companyName);
        await registrationPage.getByRole('button', { name: 'Next' }).click();

        //Step 3 & 4: Try to access supplier dashboard / Verify redirect to onboarding page
        genFunctions = new genericFunctions(registrationPage);
        const supplierLoginPageURL = genFunctions.buildURL('/supplier/login');
        await registrationPage.goto(supplierLoginPageURL);
        await supplierRegistrationPage.supplierLogin(supplier.email, supplierPassword);
        await registrationPage.waitForTimeout(3000);

        // Step 4: Verify redirect to onboarding page
        expect(currentUrl).toContain('/onboarding');

        //Step 5: Complete onboarding
        await supplierRegistrationPage.completeOnboardingForm(registrationPage, supplier);

        //Step 6: Verify can access dashboard
        await supplierRegistrationPage.verifySupplierRedirectedToOrdersPage(registrationPage);
        await supplierMenuNavigation.navigateToDashboardPage();
        dashboardPage = new DashboardPage(registrationPage);
        await dashboardPage.verifyDashboardPageLoaded();

        //Delete Supplier after test
        await page.bringToFront();
        await page.reload();
        await suppliersPage.deleteSupplier(supplier.email);
        await page.waitForTimeout(1000);

        // Cleanup
        await context.close()
        await emailContext.close();
        await registrationContext.close();
    });
});