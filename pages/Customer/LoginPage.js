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

export class LoginPage {
  //is JSDoc — a type-hinting comment used in JavaScript to give IntelliSense and type safety.
  //JavaScript has no built-in type system, so VS Code cannot guess the type of variables. JSDoc adds type information without using TypeScript.
  // Benefits: Intellisense / Auto-completion / Type checking / Better error detection / 
  /** @param {Page} page */

  constructor(page) {
    this.page = page;
    this.closeBtnFromTermsPage = page.getByRole('button', { name: 'Close' });
    this.loginBtn = page.locator("//div[@class='flex items-center space-x-3']/button");
    this.emailInput = page.getByRole('textbox', { name: 'Email address' });
    this.passwordInput = page.getByRole('textbox', { name: 'Password' });
    this.signInBtn = page.getByRole('button', { name: 'Sign in' });
    this.signOutBtn = page.getByRole('button', { name: 'Sign Out' });
    this.cookieAcceptBtn = page.locator('(//button[contains(.,"Accept All")])[1]');
    this.popUPText = page.getByText('We noticed you already have a');
    this.closeBtnFromIsSkipFullPopUp = page.getByRole('button').nth(1);
  }

  async goto(url) {
    await this.page.goto(url);

    await this.page.waitForTimeout(2000);
    if (await this.cookieAcceptBtn.isVisible()) {
      await this.cookieAcceptBtn.click();
    }
  }

  async login(email, password) {

    if (await this.loginBtn.isVisible()) {
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

    if (await this.popUPText.isVisible()) {
      const noThanksBtn = this.page.getByRole('button', { name: /No Thanks.*Start a New Order/i });
      if (await noThanksBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await noThanksBtn.click();
      } else {
        await this.closeBtnFromIsSkipFullPopUp.waitFor({ state: 'visible' });
        await this.closeBtnFromIsSkipFullPopUp.click();
      }
    }

    // Handle "No thanks, start a new order" pop-up if it appears
    if (await this.page.getByRole('button', { name: 'No thanks, start a new order' }, { state: 'visible' }).isVisible()) {
      await this.page.getByRole('button', { name: 'No thanks, start a new order' }).click();
    }

    // if (await this.closeBtnFromTermsPage.last().isVisible()) {
    //   await this.closeBtnFromTermsPage.last().click();
    // }
  }
}
