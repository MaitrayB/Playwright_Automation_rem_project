import { TestData } from "../Data/TestData.js";

export class LoginPage {
  constructor(page) {
    this.page = page;
    this.loginBtn = page.getByRole('button', { name: 'Login' });
    this.emailInput = page.getByRole('textbox', { name: 'Email address' });
    this.passwordInput = page.getByRole('textbox', { name: 'Password' });
    this.signInBtn = page.getByRole('button', { name: 'Sign in' });
    this.signOutBtn = page.getByRole('button', { name: 'Sign Out' });
  }

  async goto() {
    await this.page.goto(TestData.baseURL);
    await this.page.waitForTimeout(1000);
  }

  async login(email, password) {
    
    if(await this.loginBtn.isVisible()){
      await this.loginBtn.click();
      await this.page.waitForTimeout(1000);
    }

    await this.emailInput.waitFor({ state: 'visible' });
    await this.emailInput.fill(email);
    await this.page.waitForTimeout(1000);

    await this.passwordInput.waitFor({ state: 'visible' });
    await this.passwordInput.fill(password);
    await this.page.waitForTimeout(1000);

    await this.signInBtn.waitFor({ state: 'visible' });
    await this.signInBtn.click();
    await this.page.waitForTimeout(3000);
   
  }
}
