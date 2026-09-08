import { expect } from '@playwright/test';
import { tableHelper } from '../../utils/tableHelper';
/** * @typedef {import('@playwright/test').Page} Page
 * @typedef {import('@playwright/test').Locator} Locator 
 */
export class DocumentsPage {
    /** @param {Page} page */
    constructor(page) {
        this.page = page;

        // Table Utility
        this.table = new tableHelper(page, 'table');
        this.pageHeading = page.getByRole('heading', { name: 'Documents' });
        this.documentUploadSuccessMsg = page.getByText('Document uploaded successfully');
    }

    async uploadDocuments(documentsName) {
        console.log(`Documents to be uploaded: ${documentsName.join(', ')}`);
        for (const documentName of documentsName) {
            console.log(`Document to be uploaded: ${documentName}`);
            const tblHelper = new tableHelper(this.page, 'table.w-full');
            //document names = Waste Carrier License, Public Liability Insurance, Terms and Conditions, Compliance
            const documentRow = await tblHelper.getRowByText(documentName);
            // const attributeName = `upload-${documentName.toLowerCase().replace(/\s/g, '_')}`;
            // console.log(`Looking for upload button with attribute: ${attributeName}`);
            // const uploadButton = documentRow.locator(`label[for="${attributeName}"] span`);
            const uploadButton = documentRow.locator('label[for^="upload-"] span');
            await uploadButton.click();
            // Playwright resolve relative paths from the project root (where you run the command).
            //Use the Project Root Path (Easiest) -- Since you typically run tests from projectName/, simply point directly to the folder from there:
            await uploadButton.setInputFiles(`./Data/${documentName}.pdf`); // Adjust the path and file type as needed
            await expect(this.documentUploadSuccessMsg).toBeVisible();
        }
    }
}