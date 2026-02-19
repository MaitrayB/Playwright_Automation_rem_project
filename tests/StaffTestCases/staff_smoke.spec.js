import { test, expect } from '@playwright/test';
import { AdminLogin } from '../../pages/Admin/AdminLogin.js';
import { LoginPage } from '../../pages/Customer/LoginPage.js';
import { genericFunctions } from '../../utils/genericFunctions.js';
import { TestData } from '../../Data/testData.js';

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
});
test.describe('Staff portal test cases', async () => {
    test('Login into Admin', async () => {
        await adminLogin.goto();
        await loginPage.login(TestData.credentials.agent.username, TestData.credentials.agent.password);
    });
});