import { test, expect } from '@playwright/test';
import { TestData } from '../../Data/testData.js';
import { genericFunctions } from '../../utils/genericFunctions.js';
import { SupplierRegistrationPage } from '../../pages/Suppliers/SupplierRegistrationPage.js';
import { OrdersPage } from '../../pages/Suppliers/OrdersPage.js';

/** @type {genericFunctions} */ let genFunctions;
/** @type {SupplierRegistrationPage} */ let supplierRegistrationPage;
/** @type {OrdersPage} */ let ordersPage;

test.describe('Supplier Onboarding Validation cases', async () => {

    test('Scenario 1: Requirements Check Display when supplier is not verified', async ({ browser }) => {
        const context = await browser.newContext({
            httpCredentials: {
                username: TestData.authCredentials.authUserName,
                password: TestData.authCredentials.authPassword
            },
            ignoreHTTPSErrors: true
        });
        const page = await context.newPage();
        supplierRegistrationPage = new SupplierRegistrationPage(page);
        genFunctions = new genericFunctions(page);
        ordersPage = new OrdersPage(page);
        await genFunctions.goto(page, '/supplier/login');
        await supplierRegistrationPage.supplierLogin(TestData.credentials.pendingVerificationSupplier.username,
            TestData.credentials.pendingVerificationSupplier.password);
        await expect(supplierRegistrationPage.orderPageHeading).toBeVisible();

        // AC-1.2.1: If documents not completed:
        // Shows "Action Required" banner on orders page
        await expect(ordersPage.actionRequiredBanner).toBeVisible();

        // Message: "Cannot Take Orders. Documents are not completed. You need to upload your documents and be verified before you can take orders."
        await expect(ordersPage.cannotTakeOrdersMessage).toBeVisible();

        // Shows "Complete Documents" button
        await expect(ordersPage.completeDocumentsBtn).toBeVisible();
    });

    test('Scenario 2.1 Available Orders Tab', async ({ browser }) => {
        const context = await browser.newContext({
            httpCredentials: {
                username: TestData.authCredentials.authUserName,
                password: TestData.authCredentials.authPassword
            },
            ignoreHTTPSErrors: true
        });
        const page = await context.newPage();
        supplierRegistrationPage = new SupplierRegistrationPage(page);
        genFunctions = new genericFunctions(page);
        ordersPage = new OrdersPage(page);

        await genFunctions.goto(page, '/supplier/login');
        await supplierRegistrationPage.supplierLogin(
            TestData.credentials.supplier.username,
            TestData.credentials.supplier.password
        );
        await expect(supplierRegistrationPage.orderPageHeading).toBeVisible();

        // AC-2.1.1: Supplier can access "Available Orders" tab on orders page
        await expect(ordersPage.availableOrdersTab).toBeVisible();
        await ordersPage.myOrdersTab.click();
        await page.waitForLoadState("domcontentloaded");
        await ordersPage.availableOrdersTab.click();

        // AC-2.1.3: Orders list shows: Order ID, Address / Postcode, Skip size, Permit, Delivery date, Days to delivery, Supplier price (with VAT)
        await ordersPage.verifyColumnNamesofAvailableOrders();

        // AC: First row contains all required data fields with correct format
        // await ordersPage.verifyFirstRowDataFields();

        // AC-2.1.4: Orders are sorted by creation date (newest first)
        await ordersPage.verifyOrdersSortedByCreationDateNewestFirst();

        // AC-2.1.5: Orders can be searched by Address, Postcode, Skip size or order ID
        await ordersPage.verifySearchFilterByOrderId();
        await ordersPage.verifySearchFilterByAddress();
        await ordersPage.verifySearchFilterByPostcode();
        await ordersPage.verifySearchFilterBySkipSize();

        // AC-2.1.2: Available Orders tab displays orders that are not booked with any supplier

        // AC-2.1.2: Orders have future delivery date
        await ordersPage.verifyAllDeliveryDatesAreFuture();

        // AC-2.1.2: Each order row has a Take button confirming it is unbooked
        await ordersPage.verifyAvailableOrdersHasTakeBtn();

        // AC-2.1.2: Opening an order detail page shows no Booked badge and Take this Order is enabled
        await ordersPage.clickFirstRowViewIcon();
        await ordersPage.verifyOrderDetailBeforeTaking();

        await context.close();
        await page.close();
    });

    test('Scenario 2.2 Order Display States', async ({ browser }) => {
        const context = await browser.newContext({
            httpCredentials: {
                username: TestData.authCredentials.authUserName,
                password: TestData.authCredentials.authPassword
            },
            ignoreHTTPSErrors: true
        });
        const page = await context.newPage();
        supplierRegistrationPage = new SupplierRegistrationPage(page);
        genFunctions = new genericFunctions(page);
        ordersPage = new OrdersPage(page);

        await genFunctions.goto(page, '/supplier/login');
        await supplierRegistrationPage.supplierLogin(
            TestData.credentials.supplier.username,
            TestData.credentials.supplier.password
        );
        await expect(supplierRegistrationPage.orderPageHeading).toBeVisible();

        // AC-2.2.4: "Take" button is visible and clickable even if supplier is not verified (but submission is prevented)
        await ordersPage.verifyAvailableOrdersHasTakeBtn();
        await ordersPage.clickFirstRowViewIcon();
        await ordersPage.verifyTakeThisOrderBtnForUnverifiedSupplier();

        await context.close();
        await page.close();
    });

    test('3.1 Take Order Button', async ({ browser }) => {
        const context = await browser.newContext({
            httpCredentials: {
                username: TestData.authCredentials.authUserName,
                password: TestData.authCredentials.authPassword
            },
            ignoreHTTPSErrors: true
        });
        const page = await context.newPage();
        supplierRegistrationPage = new SupplierRegistrationPage(page);
        genFunctions = new genericFunctions(page);
        ordersPage = new OrdersPage(page);

        await genFunctions.goto(page, '/supplier/login');
        await supplierRegistrationPage.supplierLogin(
            TestData.credentials.supplier.username,
            TestData.credentials.supplier.password
        );
        await expect(supplierRegistrationPage.orderPageHeading).toBeVisible();

        // AC-3.1.1: "Take" button is visible on available orders
        await ordersPage.verifyAvailableOrdersHasTakeBtn();

        // AC-3.1.2: "Take" button is clickable even if supplier is not verified (but submission is prevented)
        // AC-3.1.3: Clicking "Take" button opens "Take Order" sheet 
        await ordersPage.clickFirstRowViewIcon();
        await ordersPage.verifyTakeThisOrderBtnForUnverifiedSupplier();

        await context.close();
        await page.close();
    });

    test('3.2 Take Order Sheet - Display', async ({ browser }) => {
        const context = await browser.newContext({
            httpCredentials: {
                username: TestData.authCredentials.authUserName,
                password: TestData.authCredentials.authPassword
            },
            ignoreHTTPSErrors: true
        });
        const page = await context.newPage();
        supplierRegistrationPage = new SupplierRegistrationPage(page);
        genFunctions = new genericFunctions(page);
        ordersPage = new OrdersPage(page);

        await genFunctions.goto(page, '/supplier/login');
        await supplierRegistrationPage.supplierLogin(
            TestData.credentials.supplier.username,
            TestData.credentials.supplier.password
        );
        await expect(supplierRegistrationPage.orderPageHeading).toBeVisible();

        // AC-3.2.1: Take Order sheet displays when "Take" button is clicked
        // AC-3.1.3: Clicking "Take" button opens "Take Order" sheet 
        await ordersPage.clickFirstRowViewIcon();
        await ordersPage.verifyTakeThisOrderBtnForUnverifiedSupplier();

        // AC-3.2.2: Sheet shows order summary: Delivery address, Postcode, Delivery date


        // AC-3.2.3: Sheet shows order items with: Item name, Item type
        // Quantity
        // Supplier price per unit (with VAT)
        // Total price per item (with VAT)
        // AC-3.2.4: Sheet shows total summary: Pass
        // Total supplier price (with VAT)
        // Clear pricing breakdown
        // AC-3.2.5: Sheet shows loading state while fetching order items 


        await context.close();
        await page.close();
    });


});
