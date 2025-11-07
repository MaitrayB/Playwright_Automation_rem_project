import { test } from '@playwright/test';
import { SignUP } from '../pages/SignUpPage.js';
import { TestData } from '../Data/TestData.js';
import { LoginPage } from '../pages/LoginPage.js';

let context;
let page;

test.beforeAll(async ({ browser }) => {

    // Create a new context and page before all tests
    context = await browser.newContext();
    page = await context.newPage();

    // Save context for reuse
    test.info().annotations.push({ type: 'context', description: 'Logged in context created' });
});

test('Sign Up', async () => {

    const loginPage = new LoginPage(page);
    const signUpPage = new SignUP(page);

    await loginPage.goto();

    await test.step('Go to create account page', async () => {
        await signUpPage.navigateToSignUpPage();
    });
    await test.step('Fill sign up form', async () => {

        //await signUpPage.fillSignUpForm(TestData.signUp.username, TestData.signUp.email, TestData.signUp.phone, TestData.signUp.password);
        await signUpPage.fillSignUpForm();
    });
    await test.step('Verify registration success', async () => {
        await signUpPage.verifyRegistrationSuccess();
    });
});

test.afterAll(async () => {
    await context?.close();
});
