import { expect } from "allure-playwright";
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

export class SuppliersPage {
    /** @param {Page} page */
    constructor(page) {
        this.page = page;
        this.inviteBtn = page.getByRole('button', { name: 'Invite' });
        this.blankInvitationRadioBtn = page.getByRole('radio', { name: 'Blank Invitation' });
        this.sendInvitationsViaEmail = page.getByRole('checkbox', { name: 'Email' });
        this.sendInvitationsViaPhone = page.getByRole('checkbox', { name: 'Phone' });
        this.supplierEmailInput = page.getByPlaceholder('Enter email address');
        this.supplierTelInput = page.locator("input[type='tel']");
        this.sendInvitationBtn = page.getByRole('button', { name: 'Send Invitation' });
        this.invitationSentSuccessMsg = page.getByText('Invitation(s) sent successfully');
        this.supplierInvitationStatus = page.locator('table tbody tr').first();
        this.invitedSupplierRow = page.locator('table tbody tr').first();
        this.actionsBtn = this.invitedSupplierRow.locator('td:last-child div > button:nth-of-type(2)'); //Because nth-child can break if another element (like a <span>) appears before the button
        this.deleteBtn = page.getByRole('button', { name: 'Delete' });
        this.deleteSupplierPopupHeading = page.getByRole('heading', { name: 'Delete Supplier' });
        this.deleteSupplierBtn = this.page.getByRole('button', { name: 'Delete Supplier' });
        this.deleteSuccessMsg = page.getByText('Supplier deleted successfully');
        this.inviteWithInfoRadioOption = page.getByRole('radio', { name: 'With Information' });
        this.findCompanyNameInput = page.getByPlaceholder('Find company');
        this.selectExistingCoName = page.locator('.absolute.z-50 button').filter({ has: page.locator('span', { hasText: 'active' }) }).first();
        this.postcodeInput = page.getByPlaceholder('SW1A 1AA');
        this.sericeRadiusInput = page.locator("[name ='companyRadius']");
        this.hirePeriodInput = page.locator("[name ='companyHirePeriodDays']");
        this.minimumTonneInput = page.locator("[name ='companyMinimumTone']");
        this.invitationWithInfoSentSuccessMsg = page.getByText('Supplier created and invitation(s) sent successfully');

    }

    async inviteSupplierViaEmailAndPhone({ invitationType } = {}) {
        let emailInput;
        let phoneInput;
        const genFunctions = new genericFunctions(this.page);
        await this.inviteBtn.click();
        if (invitationType === 'Blank Invitation') {
            await this.blankInvitationRadioBtn.check();
            await this.sendInvitationsViaEmail.check();
            await this.sendInvitationsViaPhone.check();
            emailInput = await genFunctions.generateRandomEmail();
            //console.log('Generated Email is:', emailInput);
            await this.supplierEmailInput.fill(emailInput);
            phoneInput = await genFunctions.generateRandomPhoneNum();
            //console.log('Generated phone no is:', phoneInput);
            await this.supplierTelInput.fill(phoneInput);
        }
        if (invitationType === 'Invitation with Co. Information') {
            await this.inviteWithInfoRadioOption.check();
            await this.findCompanyNameInput.pressSequentially('abc');
            await this.selectExistingCoName.click();
            emailInput = await genFunctions.generateRandomEmail();
            console.log('Generated Email for existing co. is:', emailInput);
            await this.supplierEmailInput.fill(emailInput);
            phoneInput = await genFunctions.generateRandomPhoneNum();
            console.log('Generated phone no in existing co. is:', phoneInput);
            await this.supplierTelInput.fill(phoneInput);
            await this.postcodeInput.fill('M1 1AA');
            await this.sericeRadiusInput.fill('27');
            await this.hirePeriodInput.fill('14');
            await this.minimumTonneInput.fill('2.6');
        }

        await this.sendInvitationBtn.click();

        if (invitationType === 'Blank Invitation') {
            await this.invitationSentSuccessMsg.waitFor();
            await expect(this.invitationSentSuccessMsg).toBeVisible();
        }
        if (invitationType === 'Invitation with Co. Information') {
            await this.invitationWithInfoSentSuccessMsg.waitFor();
            await expect(this.invitationWithInfoSentSuccessMsg).toBeVisible();
        }
        await expect(this.supplierInvitationStatus.getByText('Invited')).toBeVisible();
        await this.page.waitForTimeout(3000);
        const supplierEmail = await this.invitedSupplierRow.textContent();
        expect(supplierEmail).toContain(emailInput);
        return supplierEmail;
    }

    async deleteSupplier(supplierDetails) {
        console.log('Supplier details passed to delete supplier function is:', supplierDetails);
        if (supplierDetails.includes('Invited')) {
            await this.actionsBtn.click();
            await this.deleteBtn.click();
            this.deleteSupplierPopupHeading.waitFor();
            await expect(this.deleteSupplierPopupHeading).toBeVisible();
            await this.deleteSupplierBtn.click();
            await this.deleteSuccessMsg.waitFor();
            await expect(this.deleteSuccessMsg).toBeVisible();
        }
    }
}