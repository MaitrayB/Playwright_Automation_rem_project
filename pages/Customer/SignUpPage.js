import { expect } from "allure-playwright";
import { faker, Faker } from "@faker-js/faker";
import { TestData } from "../../Data/testData.js";
import { LoginPage } from "./LoginPage.js";
import { genericFunctions } from '../../utils/genericFunctions.js';
/*
Below 2 TYPEDEF lines you need for:
✔ VS Code IntelliSense
✔ Cmd + Click navigation
✔ Proper type inference for page
✔ Method autocomplete in test files
*/
/** 
 * @typedef {import('@playwright/test').Page} Page
 * @typedef {import('@playwright/test').Locator} Locator 
 */

export class SignUpPage {
    /** @param {Page} page */
    constructor(page) {
        this.page = page;

        this.loginBtn = page.getByRole('button', { name: 'Login' });
        this.signUpLink = page.locator("//a[@href='/register']");
        this.firstNameInput = page.locator('#firstName');
        this.lastNameInput = page.locator('#lastName');
        this.emailInput = page.locator('#email');
        this.phoneInput = page.locator('#phone');
        this.passwordInput = page.locator('#password');
        this.confirmPasswordInput = page.locator('#confirmPassword');
        this.signUpBtn = page.getByRole('button', { name: 'Sign up' });
        this.registrationSuccessMessage = page.locator("//p[@class='text-sm text-green-500']");
        this.signInContinueBtn = page.locator('//button[contains(.,"Sign In to Continue")]');
        this.sitecontactYesBtn = page.getByRole('button', { name: 'Yes' });
        this.sitecontactName = page.getByPlaceholder('Enter site contact name');
        this.sitecontactPhone = page.getByPlaceholder('Enter site contact phone');
        this.sitecontactEmail = page.getByPlaceholder('Enter site contact email');
        this.continueBtn = page.getByRole('button', { name: 'Continue' })


        //elements for guest user registration form
        this.confirmEmailInput = page.locator("//input[@id = 'confirmEmail']");
        this.continueBtn = page.locator("//div[@class='space-y-3']/button/span");

        //Elements on Create New Password page
        this.updatePasswordBtn = page.getByRole('button', { name: 'Update Password' });
        this.passwordUpdatedSuccessMessage = page.locator("//p[@class='text-green-500']");
    }

    async navigateToSignUpPage() {
        await this.loginBtn.waitFor({ state: 'visible' });
        await this.loginBtn.click();
        await this.page.waitForTimeout(1000);
        await this.signUpLink.click();
    }

    async fillSignUpForm() {
        let cname, phone, email;

        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const emailAddress = `${firstName}_${lastName}@yopmail.com`;
        const randomPassword = "P@ssw0rd";

        this.emailAddress = emailAddress;
        this.randomPassword = randomPassword;

        const genfunc = new genericFunctions(this.page);
        const contact = await genfunc.getSiteContactDetails();

        try {
            if (await this.loginBtn.isVisible()) {
                //console.log('guest user');
                await this.page.locator('#firstName').focus();
                await this.firstNameInput.fill(firstName);
                await this.lastNameInput.fill(lastName);
                await this.emailInput.fill(this.emailAddress);
                await this.confirmEmailInput.fill(this.emailAddress);
                await this.phoneInput.fill('+44 16977 2987');

                await this.sitecontactYesBtn.click();
                await this.sitecontactName.fill(contact.name);
                await this.sitecontactPhone.fill(contact.phone);
                await this.sitecontactEmail.fill(contact.email);

                cname = contact.name;
                phone = contact.phone;
                email = contact.email;

                await this.page.waitForTimeout(3000);

                //await this.continueBtn.click();
                //await this.page.waitForTimeout(3000);

                if (await this.continueBtn.isEnabled()) {
                    //console.log('Continue button is enabled');
                    await this.continueBtn.click();
                } else {
                    console.log('Continue button is disabled');
                }
            }
            else {
                //await this.page.locator('#firstName').focus();
                await this.firstNameInput.fill(firstName);
                await this.lastNameInput.fill(lastName);
                await this.emailInput.fill(emailAddress);
                await this.phoneInput.fill('+44 16977 2987');

                await this.passwordInput.fill(randomPassword);
                await this.confirmPasswordInput.fill(randomPassword);

                await this.signUpBtn.click();
                await this.page.waitForTimeout(3000)
            }
        }
        catch {
            console.log('logged in user found but login button is not visible');
        }

        return { cname, phone, email };
    }

    async fillSignUpFormExistingUser() {

        const loginPage = new LoginPage(this.page);

        await this.page.locator('#firstName').focus();
        await this.firstNameInput.fill("Navin");
        await this.lastNameInput.fill("Shah");
        await this.emailInput.fill(TestData.credentials.customer.username);
        await this.confirmEmailInput.fill(TestData.credentials.customer.username);
        await this.phoneInput.fill('+44 16977 2987');
        if (await this.continueBtn.isEnabled()) {
            //console.log('Continue button is enabled');
            await this.continueBtn.click();
        } else {
            console.log('Continue button is disabled');
        }
        await this.page.waitForTimeout(3000);

        await this.signInContinueBtn.click();
     
        await loginPage.login(TestData.credentials.customer.username, TestData.credentials.customer.password);
        await this.page.waitForTimeout(3000);
    }

    async guest_CreateNewPassword() {
        const randomPassword = "P@ssw0rd";
        await this.passwordInput.waitFor({ state: 'visible' });
        await this.passwordInput.fill(randomPassword);
        await this.confirmPasswordInput.fill(randomPassword);
        await this.updatePasswordBtn.click();

        await this.passwordUpdatedSuccessMessage.waitFor({ state: 'visible' });
        await expect(this.passwordUpdatedSuccessMessage).toHaveText('Password updated successfully!');
    }

    async verifyRegistrationSuccess() {
        await this.registrationSuccessMessage.waitFor({ state: 'visible' });
        await expect(this.registrationSuccessMessage).toHaveText('Registration successful!');
    }
}