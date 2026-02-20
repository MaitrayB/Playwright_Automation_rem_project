import { test, expect } from '@playwright/test';
import { AdminLogin } from '../../pages/Admin/AdminLogin.js';
import { InviteSupplierPage } from '../../pages/Admin/InviteSupplierPage.js';
import { TestData } from '../../Data/testData.js';

/** @type {InviteSupplier} */ let inviteSupplier;
/** @type {AdminLogin} */ let adminLogin;

test.describe('Supplier Invitations', async () => {

    test('Blank Invitation', async ({ browser }) => {
        const context = await browser.newContext({
            httpCredentials: {
                username: TestData.authCredentials.authUserName,
                password: TestData.authCredentials.authPassword
            },
            ignoreHTTPSErrors: true
        });
        const page = await context.newPage();
        adminLogin = new AdminLogin(page);
        inviteSupplier = new InviteSupplierPage(page);

        await adminLogin.goto();
        await adminLogin.adminLogin(TestData.credentials.agent.username, TestData.credentials.agent.password);
        await adminLogin.goToSuppliersPage();

        await inviteSupplier.inviteSupplierViaEmailAndPhone();
    });

});