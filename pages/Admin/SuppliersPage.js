import { expect } from "allure-playwright";
import { genericFunctions } from '../../utils/genericFunctions.js';
import { tableHelper } from '../../utils/tableHelper.js';
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

        // Table Utility
        this.table = new tableHelper(page, 'table');

        //Buttons and Inputs
        this.inviteBtn = page.getByRole('button', { name: 'Invite' });
        this.blankInvitationRadioBtn = page.getByRole('radio', { name: 'Blank Invitation' });
        this.sendInvitationsViaEmail = page.getByRole('checkbox', { name: 'Email' });
        this.sendInvitationsViaPhone = page.getByRole('checkbox', { name: 'Phone' });
        this.supplierEmailInput = page.getByPlaceholder('Enter email address');
        this.supplierTelInput = page.locator("input[type='tel']");
        this.sendInvitationBtn = page.getByRole('button', { name: 'Send Invitation' });

        this.invitationSentSuccessMsg = page.getByText('Invitation(s) sent successfully');
        this.invitationWithInfoSentSuccessMsg = page.getByText('Supplier created and invitation(s) sent successfully');

        this.inviteWithInfoRadioOption = page.getByRole('radio', { name: 'With Information' });
        this.findCompanyNameInput = page.getByPlaceholder('Find company');
        this.selectExistingCoName = page.locator('.absolute.z-50 button').filter({ has: page.locator('span', { hasText: 'active' }) }).first();
        this.postcodeInput = page.getByPlaceholder('SW1A 1AA');
        this.sericeRadiusInput = page.locator("[name ='companyRadius']");
        this.hirePeriodInput = page.locator("[name ='companyHirePeriodDays']");
        this.minimumTonneInput = page.locator("[name ='companyMinimumTone']");

        //Delete Supplier
        this.deleteSupplierPopupHeading = page.getByRole('heading', { name: 'Delete Supplier' });
        this.deleteSupplierBtn = this.page.getByRole('button', { name: 'Delete Supplier' });
        this.deleteSuccessMsg = page.getByText('Supplier deleted successfully');
    }

    async inviteSupplierViaEmailAndPhone({ invitationType } = {}) {
        const genFunctions = new genericFunctions(this.page);
        const tblHelper = new tableHelper(this.page, 'table.w-full');

        let emailInput;
        let phoneInput;
        let companyName;
        let postcode, serviceRadius, hirePeriod, minimumTonne
        await this.inviteBtn.click();

        if (invitationType === 'Blank Invitation') {
            await this.blankInvitationRadioBtn.check();
            await this.sendInvitationsViaEmail.check();
            await this.sendInvitationsViaPhone.check();

            emailInput = await genFunctions.generateRandomEmail();
            phoneInput = await genFunctions.generateRandomPhoneNum();

            await this.supplierEmailInput.fill(emailInput);
            await this.supplierTelInput.fill(phoneInput);

            companyName = '-'; // Blank invitation has no company name, so we use a placeholder value for validation later
        }
        if (invitationType === 'Invitation with Co. Information') {
            await this.inviteWithInfoRadioOption.check();
            await this.sendInvitationsViaEmail.check();
            await this.sendInvitationsViaPhone.check();
            await this.findCompanyNameInput.pressSequentially('abcl');
            await this.selectExistingCoName.click();

            emailInput = await genFunctions.generateRandomEmail();
            phoneInput = await genFunctions.generateRandomPhoneNum();

            await this.supplierEmailInput.fill(emailInput);
            await this.supplierTelInput.fill(phoneInput);
            postcode = 'M1 1AA';
            serviceRadius = '27';
            hirePeriod = '14';
            minimumTonne = '2.6';
            await this.postcodeInput.fill(postcode);
            await this.sericeRadiusInput.fill(serviceRadius);
            await this.hirePeriodInput.fill(hirePeriod);
            await this.minimumTonneInput.fill(minimumTonne);
        }

        await this.sendInvitationBtn.click();
        // Success validation
        if (invitationType === 'Blank Invitation') {
            await this.invitationSentSuccessMsg.waitFor();
            await expect(this.invitationSentSuccessMsg).toBeVisible();
        }
        if (invitationType === 'Invitation with Co. Information') {
            await this.invitationWithInfoSentSuccessMsg.waitFor();
            await expect(this.invitationWithInfoSentSuccessMsg).toBeVisible();
        }
        // Wait for row to appear using email
        const row = this.table.getRowByText(emailInput);
        await expect(row).toBeVisible();

        // Dynamically get values from table columns
        const idCell = await tblHelper.getCellByRowTextAndHeader(emailInput, 'ID');
        const companyCell = await tblHelper.getCellByRowTextAndHeader(emailInput, 'COMPANY');
        const statusCell = await tblHelper.getCellByRowTextAndHeader(emailInput, 'INVITATION');

        const id = (await idCell.textContent())?.trim();
        companyName = (await companyCell.textContent())?.trim();
        //console.log(`inviteSupplierViaEmailAndPhone: Extracted from table - ID: ${id}, Company: ${companyName}, Status: ${(await statusCell.textContent())?.trim()}`);

        await expect(statusCell).toHaveText(/Invited/);

        return { id, email: emailInput, companyName, phone: phoneInput, postcode, hirePeriod };
    }

    // DELETE SUPPLIER (GENERIC & STABLE)
    async deleteSupplier(email) {
        const tblHelper = new tableHelper(this.page, 'table.w-full');
        console.log('Deleting supplier with email:', email);

        // Verify row exists
        const row = tblHelper.getRowByText(email);
        await expect(row).toBeVisible();

        // Use generic action utility
        await this.page.waitForTimeout(1000);
        await tblHelper.performRowAction(email, 'Delete');
        await this.page.waitForTimeout(1000);

        await expect(this.deleteSupplierPopupHeading).toBeVisible();
        await this.deleteSupplierBtn.click();
        await this.page.waitForTimeout(1000);
        await expect(this.deleteSuccessMsg).toBeVisible();
        await this.page.waitForTimeout(1000);

        // Optional: Validate row removed
       // await expect(tblHelper.getRowByText(email)).toHaveCount(0);
    }

    async getSupplierEmailBasedOnStatus(statusToFind) {
        const tblHelper = new tableHelper(this.page, 'table.w-full');
        const rowCount = await tblHelper.getRowCount();
        for (let i = 0; i < rowCount; i++) {
            const companyCell = await tblHelper.getCellByIndex(i, await tblHelper.getColumnIndexByHeader('COMPANY'));
            const companyName = await companyCell.textContent().then(text => text.trim());
            const statusCell = await tblHelper.getCellByIndex(i, await tblHelper.getColumnIndexByHeader('INVITATION'));
            // Use regex to extract status word
            const cellStatusRaw = (await statusCell.textContent())?.trim();
            const match = cellStatusRaw.match(/^(Joined|Invited|Not\sInvited|Blacklisted)/i);
            const cellStatus = match ? match[0] : '';
            if (cellStatus === statusToFind) {
                const emailCell = await tblHelper.getCellByIndex(i, await tblHelper.getColumnIndexByHeader('CONTACT'));
                const contactText = await emailCell.textContent();
                const emailMatch = contactText.match(/[A-Za-z0-9._%+-]+@yopmail\.com/);
                const email = emailMatch ? emailMatch[0] : contactText.trim();
                return { email, companyName };
            }
            await this.page.waitForTimeout(1000);
        }
        throw new Error(`No supplier found with status: ${statusToFind}`);
    }
}