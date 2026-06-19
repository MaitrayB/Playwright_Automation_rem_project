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

        //View Supplier Details
        this.documentsTab = page.getByRole('button', { name: 'Documents' });
        this.approveDocumentSuccessMsg = page.getByText('Document approved successfully');
        this.informationTab = page.getByRole('button', { name: 'Information' });
        this.verifySupplierBtn = page.getByRole('button', { name: 'Verify Supplier' });
        this.supplierVerifiedSuccessMsg = page.getByText('Supplier verified successfully');
    }

    async isCardView() {
        const viewport = this.page.viewportSize();
        if (viewport) {
            return viewport.width < 1024;
        }
        const width = await this.page.evaluate(() => window.innerWidth);
        return width < 1024;
    }

    async findSupplierCardByEmail(email) {
        const searchInput = this.page.getByPlaceholder('Search suppliers by name, email, or contact');
        if (await this.isCardView() && await searchInput.isVisible()) {
            await searchInput.fill(email);
            await this.page.waitForTimeout(1000);
        }

        return this.page.getByText(`Email: ${email}`, { exact: true })
            .locator('..').locator('..').locator('..');
    }

    async inviteSupplierViaEmailAndPhone(options = {}/*{ invitationType } = {}*/) {
        const { invitationTypeOptions = ['Blank Invitation', 'Invitation with Co. Information'],
            domainName = '' } = options;
        const genFunctions = new genericFunctions(this.page);
        const tblHelper = new tableHelper(this.page, 'table.w-full');

        let emailInput;
        let phoneInput;
        let companyName;
        let postcode, serviceRadius, hirePeriod, minimumTonne
        await this.inviteBtn.click();

        if (invitationTypeOptions === 'Blank Invitation') {
            await this.blankInvitationRadioBtn.check();
            await this.sendInvitationsViaEmail.check();
            await this.sendInvitationsViaPhone.check();
            if (domainName === 'yopmail.com') {
                emailInput = await genFunctions.generateRandomEmail();
            }
            if (domainName === 'mailinator.com') {
                emailInput = await genFunctions.generateRandomEmailmailinator();
            }
            phoneInput = await genFunctions.generateRandomPhoneNum();

            await this.supplierEmailInput.fill(emailInput);
            await this.supplierTelInput.fill(phoneInput);

            companyName = '-'; // Blank invitation has no company name, so we use a placeholder value for validation later
        }
        if (invitationTypeOptions === 'Invitation with Co. Information') {
            await this.inviteWithInfoRadioOption.check();
            await this.sendInvitationsViaEmail.check();
            await this.sendInvitationsViaPhone.check();
            await this.findCompanyNameInput.pressSequentially('abcl');
            await this.selectExistingCoName.click();

            if (domainName === 'yopmail.com') {
                emailInput = await genFunctions.generateRandomEmail();
            }
            if (domainName === 'mailinator.com') {
                emailInput = await genFunctions.generateRandomEmailmailinator();
            }
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
        if (invitationTypeOptions === 'Blank Invitation') {
            await this.invitationSentSuccessMsg.waitFor();
            await expect(this.invitationSentSuccessMsg).toBeVisible();
        }
        if (invitationTypeOptions === 'Invitation with Co. Information') {
            await this.invitationWithInfoSentSuccessMsg.waitFor();
            await expect(this.invitationWithInfoSentSuccessMsg).toBeVisible();
        }
        let id;
        if (await this.isCardView()) {
            const card = await this.findSupplierCardByEmail(emailInput);
            await expect(card).toBeVisible({ timeout: 15000 });
            await expect(card.locator('span', { hasText: /^Invited$/ })).toBeVisible();

            const cardText = await card.textContent();
            id = cardText?.match(/#(\d+)/)?.[1];
            companyName = (await card.locator('p').first().textContent())?.trim();
        } else {
            const row = this.table.getRowByText(emailInput);
            await expect(row).toBeVisible();

            const idCell = await tblHelper.getCellByRowTextAndHeader(emailInput, 'ID');
            const companyCell = await tblHelper.getCellByRowTextAndHeader(emailInput, 'COMPANY');
            const statusCell = await tblHelper.getCellByRowTextAndHeader(emailInput, 'INVITATION');

            id = (await idCell.textContent())?.trim();
            companyName = (await companyCell.textContent())?.trim();
            await expect(statusCell).toHaveText(/Invited/);
        }

        return { id, email: emailInput, companyName, phone: phoneInput, postcode, hirePeriod };
    }

    // DELETE SUPPLIER (GENERIC & STABLE)
    async deleteSupplier(email) {
        const tblHelper = new tableHelper(this.page, 'table.w-full');
        console.log('Deleting supplier with email:', email);

        if (await this.isCardView()) {
            const card = await this.findSupplierCardByEmail(email);
            await expect(card).toBeVisible({ timeout: 15000 });
            await card.getByRole('button', { name: 'Actions' }).click({ force: true });
        } else {
            const row = tblHelper.getRowByText(email);
            await expect(row).toBeVisible();
            await row.getByRole('button', { name: 'Actions' }).click({ force: true });
        }
        await this.page.waitForTimeout(1000);

        await this.page.locator('[data-supplier-actions-portal="true"]').last()
            .getByRole('button', { name: 'Delete' })
            .click({ force: true });
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
        if (await this.isCardView()) {
            await expect(this.page.getByRole('button', { name: 'Actions' }).first()).toBeVisible({ timeout: 15000 });

            const emailLines = this.page.getByText(/^Email: [A-Za-z0-9._%+-]+@yopmail\.com$/);
            const emailCount = await emailLines.count();

            for (let i = 0; i < emailCount; i++) {
                const card = emailLines.nth(i).locator('..').locator('..').locator('..');
                const statusBadge = card.locator('span', { hasText: new RegExp(`^${statusToFind}$`) });
                if (await statusBadge.count() === 0) continue;

                const emailText = await emailLines.nth(i).textContent();
                const email = emailText?.replace('Email: ', '').trim();
                const companyName = (await card.locator('p').first().textContent())?.trim();
                return { email, companyName };
            }

            throw new Error(`No supplier found with status: ${statusToFind}`);
        }

        await expect(this.page.locator('main table tbody tr').first()).toBeVisible({ timeout: 15000 });
        const tblHelper = new tableHelper(this.page, 'main table');
        const rowCount = await tblHelper.getRowCount();

        for (let i = 0; i < rowCount; i++) {
            const companyCell = await tblHelper.getCellByIndex(i, await tblHelper.getColumnIndexByHeader('COMPANY'));
            const companyName = await companyCell.textContent().then(text => text.trim());
            const statusCell = await tblHelper.getCellByIndex(i, await tblHelper.getColumnIndexByHeader('INVITATION'));
            const cellStatusRaw = (await statusCell.textContent())?.trim() || '';
            const match = cellStatusRaw.match(/^(Joined|Invited|Not Invited|Blacklisted)/i);
            const cellStatus = match ? match[1] : '';

            if (cellStatus === statusToFind) {
                const emailCell = await tblHelper.getCellByIndex(i, await tblHelper.getColumnIndexByHeader('CONTACT'));
                const contactText = await emailCell.textContent();
                const emailMatch = contactText.match(/[A-Za-z0-9._%+-]+@yopmail\.com/);
                const email = emailMatch ? emailMatch[0] : contactText.trim();
                if (emailMatch) {
                    return { email, companyName };
                }
            }
        }

        throw new Error(`No supplier found with status: ${statusToFind}`);
    }

    async viewSupplierDetails(email) {
        const tblHelper = new tableHelper(this.page, 'table.w-full');
        const row = tblHelper.getRowByText(email);
        await expect(row).toBeVisible();
        const viewButton = row.getByRole('button', { name: 'View Details' }).first();
        await viewButton.click();
    }

    async goToDocumentTabinViewSupplier() {
        await this.documentsTab.click();
    }

    async approveDocuments(documentNames) {
        for (const docName of documentNames) {
            const tblHelper = new tableHelper(this.page, 'table.w-full');
            //document names = Waste Carrier License, Public Liability Insurance, Terms and Conditions, Compliance
            const documentRow = await tblHelper.getRowByText(docName);
            const approveBtn = documentRow.getByRole('button', { name: 'Approve document' }).first();
            await approveBtn.click();
            await expect(this.approveDocumentSuccessMsg).toBeVisible();
        }
    }

    async goToInformationTabinViewSupplier() {
        await this.informationTab.click();
    }

    async verifySupplier() {
        await this.verifySupplierBtn.click();
        await expect(this.supplierVerifiedSuccessMsg).toBeVisible();
    }
}