import { test } from '@playwright/test';
import { LoginPage } from '../pages/Customer/LoginPage.js';
import { OrderPage } from '../pages/Customer/OrderPage.js';
import { DashboardPage } from '../pages/Customer/DashboardPage.js';
import { readCsv } from '../utils/readCsv.js';
import { SignUpPage } from '../pages/Customer/SignUpPage.js';
import { OrderDeliveryDetailsPage } from '../pages/Customer/OrderDeliveryDetailsPage.js';

const csvData = readCsv('./Data/testData.csv');

test.describe('Place multiple orders', () => {
    test.setTimeout(180000); // 3 minutes
    let orderPage;
    let dashboardPage;
    let orderDeliverDetailsPage

    test.beforeEach(async ({ browser }) => {
        const context = await browser.newContext();
        const page = await context.newPage();

        const signUpPage = new SignUpPage(page);
        const loginPage = new LoginPage(page);

        // Sign up before all tests
        await test.step('Sign up before all tests)', async () => {
            await loginPage.goto();
            await signUpPage.navigateToSignUpPage();
            await signUpPage.fillSignUpForm();
            await signUpPage.verifyRegistrationSuccess();
        });

        // ✅ Login once before all tests
        await test.step('Login to application (before all tests)', async () => {
            await loginPage.login(signUpPage.emailAddress, signUpPage.randomPassword);
        });

        // Initialize pages after login
        orderPage = new OrderPage(page);
        dashboardPage = new DashboardPage(page);
        orderDeliverDetailsPage = new OrderDeliveryDetailsPage(page);

        // Save context for reuse
        test.info().annotations.push({ type: 'context', description: 'Logged in context created' });
        test.context = context;
        test.page = page;
    });

    for (const row of csvData.slice(0, 3)) { // Limit to first 10 rows for brevity
        // --- Logged In User ---
        test(`Multiple Orders for postcode: ${row.Postcodes}, Waste Type: ${row.WasteType}, ${row.HeavyWaste} - Heavy Waste, ${row.PlasterBoard} - Plasterboard, Skip size - ${row.SkipSize}, Placement - ${row.Placement}`, async () => {
            const page = test.page; // reuse same page
            const orderPage = new OrderPage(page);
            const dashboardPage = new DashboardPage(page);
            const loginPage = new LoginPage(page);
            const signUpPage = new SignUpPage(page);
            const orderDeliverDetailsPage = new OrderDeliveryDetailsPage(page);

            await test.step('Enter postcode', async () => {
                // await loginPage.goto();
                await orderPage.enterPostcode(row.Postcodes);
            });

            await test.step('Select waste type', async () => {
                await orderPage.selectWaste(row.WasteType);
            });

            await test.step('Continue waste type', async () => {
                await orderPage.continueWaste(row.HeavyWaste, row.PlasterBoard);
            });

            await test.step('Select skip & property', async () => {
                await orderPage.selectSkip(row.SkipSize, row.PlasterBoard, row.ToneBag, row.SelfDispose);
            });

            await test.step('Permit check', async () => {
                await orderPage.permitCheck(row.Placement);
            });

            await test.step('Choose date', async () => {
                await orderPage.chooseDate(row.BookingDay);
            });

            await test.step('Complete payment', async () => {
                await orderPage.completePayment();
            });

            await test.step('Verify dashboard', async () => {
                await dashboardPage.gotoSuccessPage();
                await dashboardPage.verifyDashboard();
            });

            await test.step('Verify Order Delivery Details', async () => {
                await dashboardPage.navigateToViewOrderDetails();
                await orderDeliverDetailsPage.verifyOrderDeliveryDetails();
            });
        });
    }
});

test.afterEach(async () => {
    await test.page?.context()?.close();
});