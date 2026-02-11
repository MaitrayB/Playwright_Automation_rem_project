import { test, expect } from '@playwright/test';
import { AdminLogin } from '../../pages/StaffPages/AdminLogin';
import { LoginPage } from '../../pages/LoginPage';
import { genericFunctions } from '../../utils/genericFunctions';
import { TestData } from '../../Data/TestData';

/** @type {LoginPage} */ let loginPage;
/** @type {AdminLogin} */ let adminLogin;
/** @type {genericFunctions} */ let genFunctions;

let page, context;

test.beforeEach(async ({ browser }) => {
    context = await browser.newContext({
        httpCredentials: {
            username: TestData.authCredentials.authUserName,
            password: TestData.authCredentials.authPassword
        },
        ignoreHTTPSErrors: true
    });
    page = await context.newPage();
    // initialize global POM objects
    loginPage = new LoginPage(page);
    adminLogin = new AdminLogin(page);
    genFunctions = new genericFunctions(page);
});
test.describe('Staff portal test cases', async () => {
    test('Login into Admin', async () => {
        await adminLogin.goto();
        await loginPage.login(TestData.credentials.agent.username, TestData.credentials.agent.password);
    });

});