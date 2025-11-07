import { expect } from "allure-playwright";
import { faker, Faker } from "@faker-js/faker";

export class SignUpPage {
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
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const emailAddress = `${firstName}_${lastName}@yopmail.com`;

        //const randomPassword = faker.internet.password({ length: 7, symbols: true });
        const randomPassword = "P@ssw0rd";

        this.emailAddress = emailAddress;
        this.randomPassword = randomPassword;

        try {
            if (await this.loginBtn.isVisible()) {
                //console.log('guest user');
                await this.page.locator('#firstName').focus();
                await this.firstNameInput.fill(firstName);
                await this.lastNameInput.fill(lastName);
                await this.emailInput.fill(emailAddress);
                await this.confirmEmailInput.fill(emailAddress);
                await this.phoneInput.fill('+44 16977 2987');
                if (await this.continueBtn.isEnabled()) {
                    //console.log('Continue button is enabled');
                    await this.continueBtn.click();
                } else {
                    console.log('Continue button is disabled');
                }
            }
            else {
                console.log('registered user');
                await this.page.locator('#firstName').focus();
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
    }

    async guest_CreateNewPassword() {
        const randomPassword = "P@ssw0rd";
        await this.passwordInput.waitFor({ state: 'visible' });
        await this.passwordInput.fill(randomPassword);
        await this.confirmPasswordInput.fill(randomPassword);

        await this.updatePasswordBtn.click();

        await this.passwordUpdatedSuccessMessage.waitFor({ state: 'visible' });
        await expect(this.passwordUpdatedSuccessMessage).toHaveText('Password updated successfully!');

        await this.page.locator('#firstName').focus();
        await this.firstNameInput.fill(firstName);
        await this.lastNameInput.fill(lastName);
        await this.emailInput.fill(emailAddress);
        console.log("Generated Email Address: " + emailAddress);
        await this.phoneInput.fill('+44 16977 2987');
        await this.passwordInput.fill(randomPassword);
        await this.confirmPasswordInput.fill(randomPassword);
        console.log("Generated Password: " + randomPassword);

        await this.signUpBtn.click();
        await this.page.waitForTimeout(3000)

        this.emailAddress = emailAddress;
        this.randomPassword = randomPassword;

    }

    async verifyRegistrationSuccess() {
        await this.registrationSuccessMessage.waitFor({ state: 'visible' });
        await expect(this.registrationSuccessMessage).toHaveText('Registration successful!.');
    }
}