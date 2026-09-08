import { expect } from 'allure-playwright';
import { genericFunctions } from '../../utils/genericFunctions.js';

/**
 * @typedef {import('@playwright/test').Page} Page
 * @typedef {import('@playwright/test').Locator} Locator
 */

export class AdminUsersPage {
    /** @param {Page} page */
    constructor(page) {
        this.page = page;
        this.pageHeading = page.getByRole('heading', { name: 'Users', exact: true });
        this.salesAgentsTab = page.getByRole('button', { name: /Sales Agents/i });
        this.activeTab = page.getByRole('button', { name: /^Active/i });
        this.pendingTab = page.getByRole('button', { name: /^Pending/i });
        this.inviteSalesAgentBtn = page.getByRole('button', { name: 'Invite Sales Agent' });
        this.inviteAdminBtn = page.getByRole('button', { name: 'Invite Admin' });
        this.emailInput = page.getByPlaceholder('Enter email address');
        this.roleDropdown = page.getByRole('combobox');
        this.sendInvitationBtn = page.getByRole('button', { name: 'Send Invitation' });
        this.cancelBtn = page.getByRole('button', { name: 'Cancel' });
    }

    async goToUsersPage() {
        const genFunctions = new genericFunctions(this.page);
        await this.page.goto(genFunctions.buildURL('/super-admin/users'), { waitUntil: 'domcontentloaded' });
        await expect(this.pageHeading).toBeVisible({ timeout: 30000 });
    }

    async openSalesAgentsTab() {
        await this.salesAgentsTab.click();
        // Sales Agents defaults to Active, where Invite Sales Agent is available.
        await expect(this.inviteSalesAgentBtn).toBeVisible({ timeout: 10000 });
    }

    async openActiveTab() {
        await this.activeTab.click();
        await expect(this.inviteSalesAgentBtn).toBeVisible({ timeout: 10000 });
    }

    async openPendingTab() {
        await this.pendingTab.click();
        // Invite lives on Active only; Pending shows Resend/Cancel for invitations.
        await expect(this.inviteSalesAgentBtn).toBeHidden({ timeout: 10000 });
    }

    async openInviteModal() {
        await this.inviteSalesAgentBtn.click();
        await expect(this.emailInput).toBeVisible({ timeout: 10000 });
        await expect(this.sendInvitationBtn).toBeVisible();
    }

    /**
     * @param {string} email
     * @param {string} [roleLabel='Sales Agent']
     */
    async inviteUserByRole(email, roleLabel = 'Sales Agent') {
        const roleValues = {
            'Sales Agent': 'sales_agent',
            Agent: 'agent',
            Admin: 'admin',
            'Super Admin': 'super_admin',
        };

        await this.openSalesAgentsTab();
        await this.openInviteModal();

        await this.emailInput.fill(email);
        await this.roleDropdown.selectOption({ label: roleLabel });
        await expect(this.roleDropdown).toHaveValue(roleValues[roleLabel]);

        await this.sendInvitationBtn.click();
        await expect(this.emailInput).toBeHidden({ timeout: 15000 });

        // New invites land under Pending, not the default Active tab.
        await this.openPendingTab();

        // Backend stores invite emails lowercased.
        const normalizedEmail = email.toLowerCase();
        await expect(this.page.getByText(normalizedEmail, { exact: true }).first()).toBeVisible({ timeout: 15000 });

        return { email: normalizedEmail, role: roleLabel };
    }
}
