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
        this.invitedSupplierRow = page.locator('//table/tbody/tr').first();
        this.actionsBtn = this.invitedSupplierRow.locator('td').last().locator('//div/button[2]');
        this.deleteBtn = page.getByRole('button', { name: 'Delete' });
        this.deleteSupplierPopupHeading = page.getByRole('heading', { name: 'Delete Supplier' });
        this.deleteSupplierBtn = this.page.getByRole('button', { name: 'Delete Supplier' });
        this.deleteSuccessMsg = page.getByText('Supplier deleted successfully');
    }

    async inviteSupplierViaEmailAndPhone() {
        const genFunctions = new genericFunctions(this.page);
        await this.inviteBtn.click();
        await this.blankInvitationRadioBtn.check();
        await this.sendInvitationsViaEmail.check();
        await this.sendInvitationsViaPhone.check();
        const emailInput = await genFunctions.generateRandomEmail();
        //console.log('Generated Email is:', emailInput);
        await this.supplierEmailInput.fill(emailInput);
        const phoneInput = await genFunctions.generateRandomPhoneNum();
        //console.log('Generated phone no is:', phoneInput);
        // await this.supplierTelInput.pressSequentially('7123456789');
        await this.supplierTelInput.fill(phoneInput);
        await this.sendInvitationBtn.click();
        await this.invitationSentSuccessMsg.waitFor();
        await expect(this.invitationSentSuccessMsg).toBeVisible();
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