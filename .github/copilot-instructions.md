# Copilot Instructions for REMAutomation3

## Project Overview
- This is a Playwright-based end-to-end test automation project for web applications.
- Major directories:
  - `pages/`: Page Object Model (POM) classes (e.g., `DashboardPage.js`, `LoginPage.js`, `OrderPage.js`).
  - `tests/`: Main test specs (e.g., `smoke.spec.js`).
  - `tests-examples/`: Example/specimen tests.
  - `utils/`: Utility functions (details to be discovered as needed).
  - `allure-report/`, `allure-results/`: Allure reporting output and attachments.
  - `playwright-report/`: Playwright HTML report output.

## Architecture & Patterns
- Follows Page Object Model: Each page class encapsulates selectors and actions for a specific UI page.
- Test specs import page objects and orchestrate test flows.
- Allure reporting is integrated for test result visualization.
- Test data and history are stored in JSON/CSV under `allure-report/data/` and `allure-report/history/`.

## Developer Workflows
- **Run tests:**
  - Use Playwright CLI: `npx playwright test` (runs all tests in `tests/`)
  - For specific specs: `npx playwright test tests/smoke.spec.js`
- **View reports:**
  - Playwright: Open `playwright-report/index.html`
  - Allure: Open `allure-report/index.html` (may require Allure CLI for advanced features)
- **Debugging:**
  - Use Playwright's `--debug` or `--headed` flags for interactive debugging.
  - Page objects are the main abstraction for UI actions—add debug logs or breakpoints there.

## Conventions & Patterns
- Page classes are named `*Page.js` and reside in `pages/`.
- Test specs are named `*.spec.js` and reside in `tests/`.
- Use async/await for all Playwright actions.
- Prefer importing page objects rather than duplicating selectors/actions.
- Store test data and reporting artifacts in the provided report directories.

## Integration Points
- Playwright is the main test runner and browser automation tool.
- Allure is used for advanced reporting; ensure results are generated for each run.
- No backend or API code is present—focus is on UI automation.

## Examples
- To add a new test:
  1. Create a new spec in `tests/`, e.g., `new-feature.spec.js`.
  2. Import relevant page objects from `pages/`.
  3. Use Playwright's test API and Allure annotations as needed.

## Key Files
- `playwright.config.js`: Playwright configuration (browser, timeouts, etc.)
- `package.json`: Dependency management and scripts
- `pages/OrderPage.js`: Example of a page object
- `tests/smoke.spec.js`: Example of a test spec

---
_If any conventions or workflows are unclear or missing, please provide feedback to improve these instructions._
