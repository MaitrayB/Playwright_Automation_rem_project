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
<<<<<<< HEAD

        //elements for guest user sign up form
        this.confirmEmailInput = page.locator("//input[@id = 'confirmEmail']");
        this.continueBtn = page.locator("//div[@class='space-y-3']/button/span");
=======
>>>>>>> bd432f5a6d65b1fab5acd726477fe2851de43e3f
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
<<<<<<< HEAD
        this.emailAddress = emailAddress;
        this.randomPassword = randomPassword;

        // console.log("Generated Email Address: " + emailAddress);
        try {
            if (await this.loginBtn.isVisible()) {
                console.log('guest user');
                await this.page.locator('#firstName').focus();
                await this.firstNameInput.fill(firstName);
                await this.lastNameInput.fill(lastName);
                await this.emailInput.fill(emailAddress);
                await this.confirmEmailInput.fill(emailAddress);
                await this.phoneInput.fill('+44 16977 2987');
                if (await this.continueBtn.isEnabled()) {
                    console.log('Continue button is enabled');
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
                // console.log("Generated Password: " + randomPassword);

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
        await this.passwordInput.fill(randomPassword);
        await this.confirmPasswordInput.fill(randomPassword);
=======

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
>>>>>>> bd432f5a6d65b1fab5acd726477fe2851de43e3f
    }

    async verifyRegistrationSuccess() {
        await this.registrationSuccessMessage.waitFor({ state: 'visible' });
        await expect(this.registrationSuccessMessage).toHaveText('Registration successful!.');
    }
<<<<<<< HEAD
=======

>>>>>>> bd432f5a6d65b1fab5acd726477fe2851de43e3f
}