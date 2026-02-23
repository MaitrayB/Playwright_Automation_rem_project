import { test, expect } from '@playwright/test';
import { AdminLogin } from '../../pages/Admin/AdminLogin.js';
import { SuppliersPage } from '../../pages/Admin/SuppliersPage.js';
import { TestData } from '../../Data/testData.js';

/** @type {SuppliersPage} */ let suppliersPage;
/** @type {AdminLogin} */ let adminLogin;

test.describe('Supplier Invitations', async () => {

    test('Blank Invitation', async ({ browser }) => {
        let supplierDetails;
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

        supplierDetails = await suppliersPage.inviteSupplierViaEmailAndPhone();
        console.log('Supplier details fetched from the test case is:', supplierDetails);

        //Delete invited supplier
        await suppliersPage.deleteSupplier(supplierDetails);
    });

});