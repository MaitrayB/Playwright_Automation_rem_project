import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Small helper delay
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

(async () => {
  try {
    // Path to Allure HTML report
    const reportPath = path.resolve(__dirname, 'allure-report', 'index.html');
    const reportUrl = 'file://' + reportPath;

    console.log('📁 Opening Allure report from:', reportUrl);

    // Launch headless browser
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Go to report
    await page.goto(reportUrl, { waitUntil: 'networkidle0', timeout: 60000 });

    // Wait for charts and UI to render
    await delay(2000);

    // Define PDF path
    const pdfPath = path.resolve(__dirname, 'allure-report.pdf');

    // Generate PDF
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      landscape: true,
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
    });

    await browser.close();
    console.log('✅ Allure PDF report generated successfully at:', pdfPath);
  } catch (err) {
    console.error('❌ Error generating Allure PDF report:', err);
    process.exit(1);
  }
})();
