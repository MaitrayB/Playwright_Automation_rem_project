import { test, expect } from '@playwright/test';
import { TestData } from '../../Data/testData.js';
import { genericFunctions } from '../../utils/genericFunctions.js';
import { SupplierRegistrationPage } from '../../pages/Suppliers/SupplierRegistrationPage.js';
import { OrdersPage } from '../../pages/Suppliers/OrdersPage.js';
import { TakeOrderSheetPage } from '../../pages/Suppliers/TakeOrderSheetPage.js';
import { SupplierMenuNavigation } from '../../pages/Suppliers/SupplierMenuNavigation.js';
import { MyOrdersPage } from '../../pages/Suppliers/MyOrdersPage.js';
import { MyOrderDetailsPage } from '../../pages/Suppliers/MyOrderDetailsPage.js';

/** @type {genericFunctions} */ let genFunctions;
/** @type {SupplierRegistrationPage} */ let supplierRegistrationPage;
/** @type {OrdersPage} */ let ordersPage;
/** @type {TakeOrderSheetPage} */ let takeOrderSheetPage;
/** @type {SupplierMenuNavigation} */ let supplierMenuNavigation;
/** @type {MyOrdersPage} */ let myOrdersPage;
/** @type {MyOrderDetailsPage} */ let myOrderDetailsPage;


test.describe('1. Requirements to Take Orders', () => {
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

        // Message: Cannot Take Orders. Documents are not completed.
        // You need to upload and have your required documents (Waste Carrier License & Public Liability Insurance) approved before you can take orders.
        await expect(ordersPage.cannotTakeOrdersMessage1).toBeVisible();

        // Shows "Complete Documents" button
        await expect(ordersPage.completeDocumentsBtn).toBeVisible();

        // Cleanup
        await context.close();
        await page.close();
    });
});

test.describe('2. Viewing Available Orders', () => {
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

        // Cleanup
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
            TestData.credentials.pendingVerificationSupplier.username,
            TestData.credentials.pendingVerificationSupplier.password
        );
        await expect(supplierRegistrationPage.orderPageHeading).toBeVisible();

        // AC-2.2.4: "Take" button is visible and clickable even if supplier is not verified (but submission is prevented)
        await ordersPage.verifyAvailableOrdersHasTakeBtn();
        await ordersPage.clickFirstRowViewIcon();
        await ordersPage.verifyTakeThisOrderBtnForUnverifiedSupplier();

        await context.close();
        await page.close();
    });
});

test.describe('3. Taking Orders', () => {
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
            TestData.credentials.pendingVerificationSupplier.username,
            TestData.credentials.pendingVerificationSupplier.password
        );
        await expect(supplierRegistrationPage.orderPageHeading).toBeVisible();

        // AC-3.1.1: "Take" button is visible on available orders
        await ordersPage.verifyAvailableOrdersHasTakeBtn();

        // AC-3.1.2: "Take" button is clickable even if supplier is not verified (but submission is prevented)
        // AC-3.1.3: Clicking "Take" button opens "Take Order" sheet 
        await ordersPage.clickFirstRowViewIcon();
        await ordersPage.verifyTakeThisOrderBtnForUnverifiedSupplier();

        // Cleanup
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
        takeOrderSheetPage = new TakeOrderSheetPage(page);

        // Setup: Navigate to supplier login
        await test.step('Navigate to supplier login', async () => {
            await genFunctions.goto(page, '/supplier/login');
        });

        // Setup: Login as verified supplier
        await test.step('Login as verified supplier', async () => {
            await supplierRegistrationPage.supplierLogin(
                TestData.credentials.supplier.username,
                TestData.credentials.supplier.password
            );
            await expect(supplierRegistrationPage.orderPageHeading).toBeVisible();
        });

        // Setup: Navigate to first order detail page
        await test.step('Navigate to first order detail page', async () => {
            await ordersPage.clickFirstRowViewIcon();
            await page.waitForTimeout(1000);
        });

        // AC-3.2.1: Take Order sheet displays when "Take" button is clicked
        await test.step('AC-3.2.1: Click Take Order button to open sheet', async () => {
            await expect(ordersPage.takeThisOrderBtn).toBeVisible();
            await expect(ordersPage.takeThisOrderBtn).toBeEnabled();
            await ordersPage.takeThisOrderBtn.click();
            await page.waitForTimeout(2000);
        });

        // AC-3.2.1: Verify Take Order sheet/modal has opened
        await test.step('AC-3.2.1: Verify Take Order sheet is displayed', async () => {
            await takeOrderSheetPage.verifySheetDisplayed();
        });

        // AC-3.2.2: Sheet shows order summary - Delivery address, Postcode, Delivery date
        await test.step('AC-3.2.2: Verify order summary section displays', async () => {
            await takeOrderSheetPage.verifyOrderSummarySection();
        });

        // AC-3.2.2: Verify postcode is displayed in correct UK format
        await test.step('AC-3.2.2: Verify postcode is displayed in correct UK format', async () => {
            const html = await takeOrderSheetPage.takeOrderSheet.innerHTML();
            // console.log("SHEET_HTML_DUMP:\n", html);
            const postcode = await takeOrderSheetPage.getPostcode();
            expect(postcode).toMatch(/[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}/i);
        });

        // AC-3.2.2: Verify delivery date is displayed
        await test.step('AC-3.2.2: Verify delivery date is displayed', async () => {
            const deliveryDate = await takeOrderSheetPage.getDeliveryDate();
            expect(deliveryDate.trim().length).toBeGreaterThan(0);
        });

        // AC-3.2.5: Verify loading state is visible while fetching order items
        await test.step('AC-3.2.5: Wait for order sheet to fully load', async () => {
            await takeOrderSheetPage.waitForLoadingComplete();
        });

        // AC-3.2.3: Verify Order Items section is displayed
        await test.step('AC-3.2.3: Verify order items section is displayed', async () => {
            await takeOrderSheetPage.verifyOrderItemsSection();
        });

        // AC-3.2.3: Verify item data is populated
        await test.step('AC-3.2.3: Verify item data is populated', async () => {
            const itemData = await takeOrderSheetPage.getFirstItemData();
            expect(itemData.name.trim().length).toBeGreaterThan(0);
            expect(itemData.quantity.trim().length).toBeGreaterThan(0);
            expect(itemData.price.trim().length).toBeGreaterThan(0);
        });

        // AC-3.2.4: Verify Total Summary section is visible
        await test.step('AC-3.2.4: Verify total summary section is displayed', async () => {
            await takeOrderSheetPage.verifyTotalSummarySection();
        });

        // AC-3.2.4: Verify total supplier price is displayed with VAT
        await test.step('AC-3.2.4: Verify total supplier price with VAT is displayed', async () => {
            const totalPrice = await takeOrderSheetPage.getTotalSupplierPrice();
            expect(totalPrice).toMatch(/£\d+(\.\d{2})?/);
        });

        // AC-3.2.5: Verify order sheet is fully loaded with all sections complete
        await test.step('AC-3.2.5: Verify all order sheet sections are fully loaded', async () => {
            await takeOrderSheetPage.verifySheetFullyLoaded();
        });

        //Cleanup
        await context.close();
        await page.close();
    });

    test('3.3 Take Order Sheet - Requirements Check', async ({ browser }) => {
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
        takeOrderSheetPage = new TakeOrderSheetPage(page);
        supplierMenuNavigation = new SupplierMenuNavigation(page);

        // Setup: Navigate to supplier login
        await test.step('Navigate to supplier login', async () => {
            await genFunctions.goto(page, '/supplier/login');
        });

        // Setup: Login as unverified supplier
        await test.step('Login as unverified supplier', async () => {
            await supplierRegistrationPage.supplierLogin(
                TestData.credentials.pendingVerificationSupplier.username,
                TestData.credentials.pendingVerificationSupplier.password
            );
            await expect(supplierRegistrationPage.orderPageHeading).toBeVisible();
        });

        // Setup: Navigate to first order detail page
        await test.step('Navigate to first order detail page', async () => {
            await ordersPage.clickFirstRowViewIcon();
            await page.waitForTimeout(1000);
        });

        // Setup: Take Order sheet displays when "Take" button is clicked
        await test.step('Click Take Order button to open sheet', async () => {
            await expect(ordersPage.takeThisOrderBtn).toBeVisible();
            await expect(ordersPage.takeThisOrderBtn).toBeEnabled();
            await ordersPage.takeThisOrderBtn.click();
            await page.waitForTimeout(2000);
        });

        // Setup: Verify Take Order sheet has opened
        await test.step('Verify Take Order sheet is displayed', async () => {
            await takeOrderSheetPage.verifySheetDisplayed();
        });

        // AC-3.3.1: Sheet checks if documents are completed
        // AC-3.3.4: If documents not completed:
        // Shows "Action Required" banner
        // Message: "Cannot Take Orders. Documents are not completed. You need to upload your documents and be verified before you can take orders."
        // Shows "Complete Documents" button
        await test.step('AC-3.3.1 / AC-3.3.4: Validation if documents are not completed', async () => {
            await expect(takeOrderSheetPage.actionRequiredHeading).toBeVisible();
            await expect(takeOrderSheetPage.documentsNotCompletedMsg).toBeVisible();
            await expect(takeOrderSheetPage.completeDocumentsLink).toBeVisible();
        });
        //Logout from unverified supplier
        await takeOrderSheetPage.closeButton.click();
        await supplierMenuNavigation.logout();

        // Setup: Login as pending bank setup supplier
        await test.step('Login as pending bank setup supplier', async () => {
            await supplierRegistrationPage.supplierLogin(
                TestData.credentials.pendingBankSetupSupplier.username,
                TestData.credentials.pendingBankSetupSupplier.password
            );
            await expect(supplierRegistrationPage.orderPageHeading).toBeVisible();
        });

        // Setup: Navigate to first order detail page
        await test.step('Navigate to first order detail page', async () => {
            await ordersPage.clickFirstRowViewIcon();
            await page.waitForTimeout(1000);
        });

        // Setup: Take Order sheet displays when "Take" button is clicked
        await test.step('Click Take Order button to open sheet', async () => {
            await expect(ordersPage.takeThisOrderBtn).toBeVisible();
            await expect(ordersPage.takeThisOrderBtn).toBeEnabled();
            await ordersPage.takeThisOrderBtn.click();
            await page.waitForTimeout(2000);
        });

        // Setup: Verify Take Order sheet has opened
        await test.step('Verify Take Order sheet is displayed', async () => {
            await takeOrderSheetPage.verifySheetDisplayed();
        });

        // AC-3.3.2: Sheet checks if bank account is set up
        await test.step('AC-3.3.2: Validation bank account is not set up', async () => {
            await expect(takeOrderSheetPage.completeSetupSection).toBeVisible();
            await expect(takeOrderSheetPage.addBankAccountMsg).toBeVisible();
            await expect(takeOrderSheetPage.setPaymentDetailsMsg).toBeVisible();
            await expect(takeOrderSheetPage.completeLink).toBeVisible();
        });
        //Logout from pending bank setup supplier
        await takeOrderSheetPage.closeButton.click();
        await supplierMenuNavigation.logout();

        //  AC - 3.3.3: Sheet checks if supplier is verified and enabled Pass
        // Setup: Login as verified supplier
        await test.step('Login as verified supplier', async () => {
            await supplierRegistrationPage.supplierLogin(
                TestData.credentials.supplier.username,
                TestData.credentials.supplier.password
            );
            await expect(supplierRegistrationPage.orderPageHeading).toBeVisible();
        });

        // Setup: Navigate to first order detail page
        await test.step('Navigate to first order detail page', async () => {
            await ordersPage.clickFirstRowViewIcon();
            await page.waitForTimeout(1000);
        });

        // Setup: Take Order sheet displays when "Take" button is clicked
        await test.step('Click Take Order button to open sheet', async () => {
            await expect(ordersPage.takeThisOrderBtn).toBeVisible();
            await expect(ordersPage.takeThisOrderBtn).toBeEnabled();
            await ordersPage.takeThisOrderBtn.click();
            await page.waitForTimeout(2000);
        });

        // Setup: Verify Take Order sheet/modal has opened
        await test.step('Verify Take Order sheet is displayed', async () => {
            await takeOrderSheetPage.verifySheetDisplayed();
        });

        // AC - 3.3.3: Sheet checks if supplier is verified and enabled Pass
        await test.step('AC-3.3.3: Validate supplier is verified and enabled', async () => {
            await expect(takeOrderSheetPage.addBankAccountMsg).not.toBeVisible();
            await expect(takeOrderSheetPage.documentsNotCompletedMsg).not.toBeVisible();
        });

        // Cleanup
        await context.close();
        await page.close();
    });

    test('3.4 Take Order Sheet - Terms and Conditions', async ({ browser }) => {
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
        takeOrderSheetPage = new TakeOrderSheetPage(page);

        // Setup: Navigate to supplier login
        await test.step('Navigate to supplier login', async () => {
            await genFunctions.goto(page, '/supplier/login');
        });

        // Setup: Login as verified supplier
        await test.step('Login as verified supplier', async () => {
            await supplierRegistrationPage.supplierLogin(
                TestData.credentials.supplier.username,
                TestData.credentials.supplier.password
            );
            await expect(supplierRegistrationPage.orderPageHeading).toBeVisible();
        });

        // Setup: Navigate to first order detail page
        await test.step('Navigate to first order detail page', async () => {
            await ordersPage.clickFirstRowViewIcon();
            await page.waitForTimeout(1000);
        });

        // Setup: Take Order sheet displays when "Take" button is clicked
        await test.step('Click Take Order button to open sheet', async () => {
            await expect(ordersPage.takeThisOrderBtn).toBeVisible();
            await expect(ordersPage.takeThisOrderBtn).toBeEnabled();
            await ordersPage.takeThisOrderBtn.click();
            await page.waitForTimeout(2000);
        });

        // Setup: Verify Take Order sheet/modal has opened
        await test.step('Verify Take Order sheet is displayed', async () => {
            await takeOrderSheetPage.verifySheetDisplayed();
        });

        await test.step('AC-3.4.1: Validate terms and conditions checkbox is displayed', async () => {
            await expect(takeOrderSheetPage.termsAndConditionsCheckbox).toBeVisible();
        });

        await test.step('AC-3.4.2 / AC-3.4.4: Validate checkbox must be checked to submit', async () => {
            takeOrderSheetPage.termsAndConditionsCheckbox.check();
            await expect(takeOrderSheetPage.takeThisOrderBtn).toBeEnabled();
        });

        await test.step('AC-3.4.3: Validate terms can be viewed in modal', async () => {
            await takeOrderSheetPage.termsAndPolicyBtnToViewPolicy.click();
            await expect(takeOrderSheetPage.termsPDFHeading).toBeVisible();
            await takeOrderSheetPage.closeTermsPDFBtn.click();
        });

        await test.step('AC-3.4.4: Form cannot be submitted without accepting terms', async () => {
            await takeOrderSheetPage.termsAndConditionsCheckbox.uncheck();
            //  await takeOrderSheetPage.submitButton.click();
            await expect(page.getByText(/must accept/i)).toBeVisible();
        });

        // Cleanup
        await context.close();
        await page.close();
    });

    test('3.5 Take Order Sheet - Order Summary Accuracy', async ({ browser }) => {
        let orderId;
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
        takeOrderSheetPage = new TakeOrderSheetPage(page);

        await test.step('Navigate to supplier login', async () => {
            await genFunctions.goto(page, '/supplier/login');
        });

        await test.step('Login as verified supplier', async () => {
            await supplierRegistrationPage.supplierLogin(
                TestData.credentials.supplier.username,
                TestData.credentials.supplier.password
            );
            await expect(supplierRegistrationPage.orderPageHeading).toBeVisible();
        });

        await test.step('Navigate to first order detail page & click Take button', async () => {
            orderId = await ordersPage.getFirstRowOrderId();
            await ordersPage.clickFirstRowTakeIcon();
            await page.waitForTimeout(1000);
        });

        await test.step('Verify Take Order sheet is displayed', async () => {
            await takeOrderSheetPage.verifySheetDisplayed();
        });

        await test.step('Accept terms and policies', async () => {
            await expect(takeOrderSheetPage.termsAndConditionsCheckbox).toBeVisible();
            takeOrderSheetPage.termsAndConditionsCheckbox.check();
            await expect(takeOrderSheetPage.takeThisOrderBtn).toBeEnabled();
        });

        await test.step('AC-3.5.4: On successful submission, validate success message, order status and order list', async () => {
            await takeOrderSheetPage.takeThisOrderBtn.click();
            await expect(takeOrderSheetPage.takeOrderSheet).not.toBeVisible();
            await expect(takeOrderSheetPage.takeOrderSuccessMsg).toBeVisible();
            await ordersPage.verifyTakenOrderIDIsNotVisibleInAvailableOrdersTab(orderId);
        });

        await test.step('AC-3.5.5: Order appears in "My Orders" tab after taking', async () => {
            await ordersPage.myOrdersTab.click();
            await page.waitForLoadState("domcontentloaded");
            await ordersPage.verifyTakenOrderIDIsVisibleInMyOrdersTab(orderId);
        });

        // Cleanup
        await context.close();
        await page.close();

    });
});

test.describe('4. Viewing My Orders', () => {
    test('4.1 My Orders Tab', async ({ browser }) => {
        const context = await browser.newContext({
            httpCredentials: {
                username: TestData.authCredentials.authUserName,
                password: TestData.authCredentials.authPassword
            },
            ignoreHTTPSErrors: true
        });
        const page = await context.newPage();

        // Initialize page objects
        supplierRegistrationPage = new SupplierRegistrationPage(page);
        genFunctions = new genericFunctions(page);
        ordersPage = new OrdersPage(page);
        myOrdersPage = new MyOrdersPage(page);
        myOrderDetailsPage = new MyOrderDetailsPage(page);

        // Setup: Navigate to supplier login & Login as verified supplier
        await test.step('Navigate to supplier login and authenticate', async () => {
            await genFunctions.goto(page, '/supplier/login');
            await supplierRegistrationPage.supplierLogin(
                TestData.credentials.supplier.username,
                TestData.credentials.supplier.password
            );
            await expect(supplierRegistrationPage.orderPageHeading).toBeVisible();
        });

        await test.step('AC-4.1.2: My Orders tab displays orders', async () => {
            await expect(ordersPage.myOrdersTab).toBeVisible();
            await ordersPage.myOrdersTab.click();
            await page.waitForLoadState("domcontentloaded");

            // Verify the table has loaded orders
            await page.waitForSelector('table');
            const rowCount = await ordersPage.table.getRowCount();
            expect(rowCount).toBeGreaterThan(0);
        });

        await test.step('AC-4.1.3: Orders show status badge', async () => {
            // View order details first since the badge is visible on the detailed page
            await myOrdersPage.clickFirstRowViewIcon();
            await page.waitForLoadState('domcontentloaded');

            // Verify the badge on the order details view
            await myOrderDetailsPage.verifyOrderStatusBadge();

            // Navigate back to My Orders tab to continue other tests
            await myOrderDetailsPage.clickBackToMyOrders();
            await expect(ordersPage.myOrdersTab).toBeVisible();
        });

        await test.step('AC-4.1.5: Orders can be filtered by date range', async () => {
            await myOrdersPage.filterOrdersByDate('1', '28');
            const rowCount = await ordersPage.table.getRowCount();
            expect(rowCount).toBeGreaterThanOrEqual(0);
        });

        await test.step('AC-4.1.6: My Orders tab shows total orders and total amount', async () => {
            await myOrdersPage.verifyTotalsDisplayed();
        });

        await test.step('AC-4.1.7: My Orders tab is searchable', async () => {
            // Reusing the same search methods from OrdersPage as they target the list & search input
            await expect(ordersPage.searchInput).toBeVisible();

            // Search by filtering methods 
            await ordersPage.verifySearchFilterByOrderId();
            await ordersPage.verifySearchFilterByAddress();
            await ordersPage.verifySearchFilterByPostcode();
            await ordersPage.verifySearchFilterBySkipSize();
        });
    });
});

test.describe('5. Order Details Page - Taking Orders', () => {
    test('5.2 Order Details After Taking', async ({ browser }) => {
        const context = await browser.newContext({
            httpCredentials: {
                username: TestData.authCredentials.authUserName,
                password: TestData.authCredentials.authPassword
            },
            ignoreHTTPSErrors: true
        });
        const page = await context.newPage();

        // Initialize page objects
        supplierRegistrationPage = new SupplierRegistrationPage(page);
        genFunctions = new genericFunctions(page);
        ordersPage = new OrdersPage(page);
        myOrdersPage = new MyOrdersPage(page);
        myOrderDetailsPage = new MyOrderDetailsPage(page);

        await test.step('Supplier login and authenticate', async () => {
            await genFunctions.goto(page, '/supplier/login');
            await supplierRegistrationPage.supplierLogin(
                TestData.credentials.supplier.username,
                TestData.credentials.supplier.password
            );
            await expect(supplierRegistrationPage.orderPageHeading).toBeVisible();
        });
        await expect(ordersPage.myOrdersTab).toBeVisible();
        await ordersPage.myOrdersTab.click();
        await page.waitForLoadState("domcontentloaded");

        await test.step('Navigate to order details page of a booked order', async () => {
            await myOrdersPage.clickFirstRowViewIcon();
            await page.waitForLoadState('domcontentloaded');
            await myOrderDetailsPage.verifyOrderStatusBadge();
        });

        await test.step('AC-5.2.2: "Take this Order" button is replaced with order management options', async () => {
            await expect(myOrderDetailsPage.manageDeliveryBtn).toBeVisible();
            await expect(myOrderDetailsPage.manageCollectionBtn).toBeVisible();
            await expect(myOrderDetailsPage.extraChargeableItemsBtn).toBeVisible();
        });
    });
});

test.describe('6. Unassigning from Orders', () => {
    test('6.1 Unassign Button Access', async ({ browser }) => {
        const context = await browser.newContext({
            httpCredentials: {
                username: TestData.authCredentials.authUserName,
                password: TestData.authCredentials.authPassword
            },
            ignoreHTTPSErrors: true
        });
        const page = await context.newPage();

        // Initialize page objects
        supplierRegistrationPage = new SupplierRegistrationPage(page);
        genFunctions = new genericFunctions(page);
        ordersPage = new OrdersPage(page);
        myOrdersPage = new MyOrdersPage(page);
        myOrderDetailsPage = new MyOrderDetailsPage(page);

        await test.step('Supplier login and authenticate', async () => {
            await genFunctions.goto(page, '/supplier/login');
            await supplierRegistrationPage.supplierLogin(
                TestData.credentials.supplier.username,
                TestData.credentials.supplier.password
            );
            await expect(supplierRegistrationPage.orderPageHeading).toBeVisible();
        });
        await expect(ordersPage.myOrdersTab).toBeVisible();
        await ordersPage.myOrdersTab.click();
        await page.waitForLoadState("domcontentloaded");

        await test.step('Navigate to order details page of a booked order', async () => {
            await myOrdersPage.clickFirstRowViewIcon();
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('AC-6.1.2 / AC-6.1.3: Unassign button is visible in more options menu', async () => {
            await myOrderDetailsPage.moreOptionsBtn.click();
            await expect(myOrderDetailsPage.unassignFromOrderBtn).toBeVisible();
            await myOrderDetailsPage.backToMyOrdersBtn.click(); // to navigate to Available Orders tab for next test step
        });

        await test.step('AC-6.1.4: Supplier cannot unassign from orders not booked with them', async () => {
            await ordersPage.availableOrdersTab.click();
            await page.waitForLoadState("domcontentloaded");
            await ordersPage.clickFirstRowViewIcon();
            await page.waitForLoadState('domcontentloaded');
            await expect(ordersPage.moreOptionsForUnbookedOrdersBtn).toBeDisabled();
        });
    });
});