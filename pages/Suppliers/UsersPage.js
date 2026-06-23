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
        // Below the md breakpoint the users table is hidden and a card list is
        // rendered instead. Each card holds the email in a <p title> and two
        // rounded-full badges in order: [role, status].
        this.mobileUserCards = page.locator('div.md\\:hidden div.p-4');
    }

    isMobileViewport() {
        const viewport = this.page.viewportSize();
        return viewport ? viewport.width < 768 : false;
    }

    mobileCard(email) {
        return this.mobileUserCards.filter({ hasText: email }).first();
    }

    // Returns the user's row/card plus its status text, reading from the table on
    // desktop and the responsive card layout on mobile.
    async getUserRow(email) {
        if (this.isMobileViewport()) {
            const card = this.mobileCard(email);
            await card.waitFor({ state: 'visible' });
            const status = (await card.locator('span.rounded-full').nth(1).innerText()).trim();
            return { row: card, status };
        }
        const tblHelper = new tableHelper(this.page, 'table.min-w-full');
        const row = tblHelper.getRowByText(email);
        const statusCell = await tblHelper.getCellByRowTextAndHeader(email, 'STATUS');
        const status = await statusCell.innerText();
        return { row, status };
    }

    async inviteTeamMember() {
        const genFunctions = new genericFunctions(this.page);

        // Step 3: Click "Invite User"
        await this.inviteUserBtn.click();
        await expect(this.supplierUserRole).toBeChecked();
        // Step 4: Enter email, phone (optional), and select role
        await this.page.waitForTimeout(2000);
        const emailInput = await genFunctions.generateRandomEmailmailinator();
        const phoneInput = await genFunctions.generateRandomPhoneNum();
        await this.emailAddressInput.fill(emailInput);
        await this.phoneNumberInput.fill(phoneInput);
        // Step 5: Send invitation
        await this.sendInvitationBtn.scrollIntoViewIfNeeded();
        await this.sendInvitationBtn.click();
        // Step 6: Verify success message when shown (toast can be brief or omitted on mobile)
        if (await this.UserInviteSuccessMsg.isVisible({ timeout: 3000 }).catch(() => false)) {
            await expect(this.UserInviteSuccessMsg).toHaveText('User invited successfully!');
        }
        // Step 7: Verify invited user appears in list with "pending" status
        const { row: invitedUserRow, status } = await this.getUserRow(emailInput);
        await expect(invitedUserRow).toBeVisible();
        await expect(status).toMatch(/pending/i);

        return { emailInput, status };
    }

    async verifyUserDetails(email, expectedStatus) {
        if (this.isMobileViewport()) {
            const card = this.mobileCard(email);
            await card.waitFor({ state: 'visible' });
            await expect(card).toContainText(email.toLowerCase());
            const badges = card.locator('span.rounded-full');
            await expect(badges.nth(1)).toHaveText(new RegExp(expectedStatus, 'i'));
            await expect(badges.nth(0)).toHaveText(/User/);
            return;
        }
        const tblHelper = new tableHelper(this.page, 'table.min-w-full');
        const emailInput = await tblHelper.getCellByRowTextAndHeader(email, 'EMAIL');
        console.log(`verifyUserDetails: Email cell text: ${await emailInput.innerText()}`);
        await expect(emailInput).toHaveText(await email.toLowerCase());
        const statusCell = await tblHelper.getCellByRowTextAndHeader(email, 'STATUS');
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