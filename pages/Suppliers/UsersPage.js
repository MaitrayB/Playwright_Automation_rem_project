import { expect } from '@playwright/test';
import { tableHelper } from '../../utils/tableHelper';
import { genericFunctions } from '../../utils/genericFunctions';
/** 
 * @typedef {import('@playwright/test').Page} Page
 * @typedef {import('@playwright/test').Locator} Locator 
 */

export class UsersPage {
    /** @param {Page} page */
    constructor(page) {
        this.page = page;

        // Table Utility
        this.table = new tableHelper(page, 'table');

        this.inviteUserBtn = page.getByRole('button', { name: 'Invite User' });
        this.supplierUserRole = page.locator("input[value='supplier_user']");
        this.emailAddressInput = page.getByRole('textbox', { name: 'Email Address *' });
        this.phoneNumberInput = page.getByRole('textbox', { name: 'Phone Number (optional)' });
        this.sendInvitationBtn = page.getByRole('button', { name: 'Send Invitation' });
        this.UserInviteSuccessMsg = page.getByText('User invited successfully!');
    }

    async inviteTeamMember() {
        const genFunctions = new genericFunctions(this.page);
        const tblHelper = new tableHelper(this.page, 'table.min-w-full');

        // Step 3: Click "Invite User"
        await this.inviteUserBtn.click();
        await expect(this.supplierUserRole).toBeChecked();
        // Step 4: Enter email, phone (optional), and select role
        const emailInput = await genFunctions.generateRandomEmail();
        const phoneInput = await genFunctions.generateRandomPhoneNum();
        await this.emailAddressInput.fill(emailInput);
        await this.phoneNumberInput.fill(phoneInput);
        // Step 5: Send invitation
        await this.sendInvitationBtn.click();
        // Step 6: Verify success message
        await expect(this.UserInviteSuccessMsg).toHaveText('User invited successfully!');
        // Step 7: Verify invited user appears in list with "pending" status

        const invitedUserRow = await tblHelper.getRowByText(emailInput);
        const statusCell = await tblHelper.getCellByRowTextAndHeader(emailInput, 'STATUS');
        const status = await statusCell.innerText();
        // console.log(`inviteTeamMember: Status cell text: ${status}`);
        // console.log(`inviteTeamMember: Invited user row text: ${await invitedUserRow.innerText()}`);
        await expect(invitedUserRow).toBeVisible();

        return { emailInput, status };
    }

    async verifyUserDetails(email, expectedStatus) {
        const tblHelper = new tableHelper(this.page, 'table.min-w-full');
        const emailInput = await tblHelper.getCellByRowTextAndHeader(email, 'EMAIL');
        console.log(`verifyUserDetails: Email cell text: ${await emailInput.innerText()}`);
        await expect(emailInput).toHaveText(await email.toLowerCase());
        const statusCell = await tblHelper.getCellByRowTextAndHeader(email, 'STATUS');
        const status = await statusCell.innerText();
        const roleCell = await tblHelper.getCellByRowTextAndHeader(email, 'ROLE');
        console.log(`verifyUserDetails: Status cell text: ${expectedStatus}`);
        console.log(`verifyUserDetails: Role cell text: ${await roleCell.innerText()}`);
        await expect(statusCell).toHaveText(expectedStatus);
        await expect(roleCell).toHaveText(/User/);
    }

    async deleteRegisteredUser(email) {
        const tblHelper = new tableHelper(this.page, 'table.min-w-full');
        const userRow = await tblHelper.getRowByText(email);
        const deleteBtn = userRow.getByRole('button', { title: 'Remove User' });
        this.page.once('dialog', async dialog => {
            console.log(dialog.message());
            await dialog.accept();
        });
        await deleteBtn.click();
        const confirmDeleteBtn = this.page.getByRole('button', { name: 'Confirm Delete' });
        await confirmDeleteBtn.click();
        const deleteSuccessMsg = this.page.getByText('User removed successfully!');
        await expect(deleteSuccessMsg).toBeVisible();
        await expect(tblHelper.getRowByText(email)).toBeHidden();
    }
}