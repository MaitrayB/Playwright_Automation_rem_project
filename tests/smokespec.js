import { test } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { OrderPage } from '../pages/OrderPage.js';
import { DashboardPage } from '../pages/DashboardPage.js';
import { TestData, PostCode } from '../Data/TestData.js';
import { readCsv } from '../utils/readCsv.js';

const csvData = readCsv('./Data/testData.csv');

//get data from CSV and run test for each row
for (const row of csvData) {

  test(`Place order for postcode: ${row.Postcodes}, Waste Type: ${row.WasteType}, ${row.HeavyWaste} - Heavy Waste, ${row.PlasterBoard} - Plasterboard, Skip size - ${row.SkipSize}, Placement - ${row.Placement}  `, async ({ page }) => {
    const loginPage = new LoginPage(page);
    const orderPage = new OrderPage(page);
    const dashboardPage = new DashboardPage(page);

    await test.step('Login to application', async () => {
      await loginPage.goto();
      await loginPage.login(TestData.credentials.username, TestData.credentials.password);
    });

    //enter postcode
    await test.step('Enter postcode', async () => {
      await loginPage.goto();
      await orderPage.enterPostcode(row.Postcodes);
    });

    //select waste type options
    await test.step('Select waste type', async () => {
      await orderPage.selectWaste(row.WasteType);


    });

    //select heavy waste & plasterboard options
    await test.step('Continue waste type', async () => {
      await orderPage.continueWaste(row.HeavyWaste, row.PlasterBoard);
    });

    //select skip & property
    await test.step('Select skip & property', async () => {
      await orderPage.selectSkip(row.SkipSize);
    });

    //Permit check
    await test.step('Permit check', async () => {
      await orderPage.permitCheck(row.Placement); //Private Property, Public Property, Grass verge, Not sure
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
  });


}
//end of for loop

/*
test('Place Order End-to-End', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const orderPage = new OrderPage(page);
  const dashboardPage = new DashboardPage(page);

  await test.step('Login to application', async () => {
    await loginPage.goto();
    await loginPage.login(TestData.credentials.username, TestData.credentials.password);
  });

  //enter postcode
  await test.step('Enter postcode', async () => {
    await loginPage.goto();
    await orderPage.enterPostcode(TestData.postcodes[0]);
  });

  //select waste type options
  await test.step('Select waste type', async () => {
    await orderPage.selectWaste(TestData.WasteType[0]);
    await orderPage.selectWaste(TestData.WasteType[1]);
  //  await orderPage.selectWaste(TestData.WasteType[2]);
   // await orderPage.selectWaste(TestData.WasteType[3]);
 
  });

  //select heavy waste & plasterboard options
  await test.step('Continue waste type', async () => {
    await orderPage.continueWaste(TestData.HeavyWaste[0], TestData.PlasterBoard[0]);
  });

  //select skip & property
  await test.step('Select skip & property', async () => {
    await orderPage.selectSkip(TestData.SkipSize[1]);
  });

 //Permit check
  await test.step('Permit check', async () => {
    await orderPage.permitCheck(TestData.Placement[1]); //Private Property, Public Property, Grass verge, Not sure
  });
 

  await test.step('Choose date', async () => {
    await orderPage.chooseDate(TestData.BookingDay[0]);
  });

  await test.step('Complete payment', async () => {
    await orderPage.completePayment();
  });

  await test.step('Verify dashboard', async () => {
    await dashboardPage.gotoSuccessPage();
    await dashboardPage.verifyDashboard();
  });
});
*/



