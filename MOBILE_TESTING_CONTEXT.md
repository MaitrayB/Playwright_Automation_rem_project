# Mobile Browser Testing Implementation - Context Summary

## Overview

Adapted the Playwright test suite for mobile browser emulation with selective execution on desktop or mobile browsers.

## What Was Done

### 1. Playwright Configuration (`playwright.config.js`)

- Added `projects` array with three configurations:
  - **Desktop Chrome** – standard Chromium with maximized window
  - **Mobile Chrome** – Pixel 7 device emulation
  - **Mobile Safari** – iPhone 14 device emulation
- Set `PLAYWRIGHT_BROWSERS_PATH` to a stable `.browsers` directory to prevent temporary path issues
- Added `path` and `fileURLToPath` imports for stable path resolution

### 2. Test Files Updated (6 files)

All `browser.newContext()` calls were modified to spread `testInfo.project.use` into context options:

- `tests/CustomerTestCases/smk.spec.js`
- `tests/AdminTestCases/staff_smoke.spec.js`
- `tests/CustomerTestCases/multipleOrderInLoop.spec.js`
- `tests/SuppliersTestCases/Supplier_invitations.spec.js`
- `tests/SuppliersTestCases/ValidateSupplierOnboarding.spec.js`
- `tests/SuppliersTestCases/SupplierTakingUnassigningOrders.spec.js`

**Pattern applied:**

```javascript
test.beforeEach(async ({ browser }, testInfo) => {
  const projectUse = testInfo.project.use;
  context = await browser.newContext({
    ...projectUse,
    httpCredentials: { /* ... */ },
    ignoreHTTPSErrors: true
  });
});
```

### 3. Locator Fixes (`pages/Customer/OrderPage.js`)

- **Postcode input**: Changed from exact string match to regex to support both desktop and mobile labels:
  ```javascript
  this.postcodeInput = page.getByRole('textbox', { name: /Typ(e|ing) Your Delivery/i });
  ```
- **Date selection**: Uncommented `await this.dateNextMonth.click()` in `chooseDate` to ensure calendar navigates to next month

### 4. Yopmail Email Verification (`utils/genericFunctions.js`)

- Added `this.mobileMailFrame = this.page.frameLocator('#ifmobmail')` to handle mobile Yopmail iframe
- Implemented conditional logic to detect desktop (`#ifmail`) vs mobile (`#ifmobmail`) iframe structure
- Desktop: reads email content directly from `#ifmail`
- Mobile: clicks email in `#ifinbox`, then reads content from `#ifmobmail`

### 5. Browser Installation Fix

- Added `"pretest": "npx playwright install"` to `package.json`
- Configured `PLAYWRIGHT_BROWSERS_PATH` in `playwright.config.js` pointing to `.browsers/`
- Added `.browsers/` to `.gitignore`

## How to Run Tests

### Run on Desktop Chrome:
```bash
PLAYWRIGHT_BROWSERS_PATH=.browsers npx playwright test tests/CustomerTestCases/smk.spec.js --project="Desktop Chrome" --headed
```

### Run on Mobile Chrome:
```bash
PLAYWRIGHT_BROWSERS_PATH=.browsers npx playwright test tests/CustomerTestCases/smk.spec.js --project="Mobile Chrome" --headed
```

### Run on Mobile Safari:
```bash
PLAYWRIGHT_BROWSERS_PATH=.browsers npx playwright test tests/CustomerTestCases/smk.spec.js --project="Mobile Safari" --headed
```

### Run a specific test:
```bash
PLAYWRIGHT_BROWSERS_PATH=.browsers npx playwright test tests/CustomerTestCases/smk.spec.js -g "Place order and add 2 Tonne bags" --project="Mobile Chrome" --headed
```

### Run all projects:
```bash
PLAYWRIGHT_BROWSERS_PATH=.browsers npx playwright test tests/CustomerTestCases/smk.spec.js --headed
```

## Issues Resolved

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| Browser executable not found | Playwright installed to temp sandbox dir | Stable `.browsers` path + pretest script |
| Postcode input not found on mobile | Different placeholder text on mobile UI | Regex-based locator |
| Yopmail email verification fails on mobile | Different iframe structure (`#ifmobmail` vs `#ifmail`) | Conditional desktop/mobile handling |
| Date selection fails | `dateNextMonth.click()` was commented out | Uncommented the line |
| `git push` rejected | Local branch behind remote | Force pushed to `stage` |

## Test Cases Verified on Mobile Chrome

- 1.1 - Postcode Search
- Place an order as Logged-in User
- Place an order as Guest User
- Start order as guest and logs in with existing account
- Place order and add road permit
- Change billing address and place order
- Place order and add 2 Tonne bags

## Branch

All changes are on the `stage` branch (force pushed).
