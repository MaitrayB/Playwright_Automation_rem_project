import { TestData } from '../Data/testData.js';

const guardedContexts = new WeakSet();

function cookieYesConsentCookie() {
    const hostname = new URL(TestData.baseURL).hostname;
    const parts = hostname.split('.');
    const domain = parts.length >= 2 ? `.${parts.slice(-2).join('.')}` : hostname;

    return {
        name: 'cookieyes-consent',
        value: 'consentid:automation,consent:yes,action:yes,necessary:yes,functional:yes,analytics:yes,performance:yes,advertisement:yes',
        domain,
        path: '/',
        expires: Math.floor(Date.now() / 1000) + 365 * 24 * 3600,
        httpOnly: false,
        secure: true,
        sameSite: 'Strict',
    };
}

/**
 * Prepare a browser context before the first navigation.
 * @param {import('@playwright/test').BrowserContext} context
 */
export async function prepareCookieConsent(context) {
    await seedCookieYesConsent(context);
    attachCookieYesTabGuard(context);
    await context.addInitScript(() => {
        const disableBrandingLinks = () => {
            document.querySelectorAll('.cky-consent-container a[href*="cookieyes"]').forEach((link) => {
                link.style.pointerEvents = 'none';
                link.removeAttribute('href');
            });
        };
        disableBrandingLinks();
        new MutationObserver(disableBrandingLinks).observe(document.documentElement, {
            childList: true,
            subtree: true,
        });
    });
}

/**
 * Pre-seed CookieYes consent so the banner does not appear on first navigation.
 * @param {import('@playwright/test').BrowserContext} context
 */
export async function seedCookieYesConsent(context) {
    await context.addCookies([cookieYesConsentCookie()]);
}

/**
 * Close cookieyes.com tabs that open when the branding link is mis-clicked.
 * @param {import('@playwright/test').Page} page
 */
export async function closeAccidentalCookieYesTabs(page) {
    for (const otherPage of page.context().pages()) {
        if (otherPage !== page && /cookieyes\.com/i.test(otherPage.url())) {
            await otherPage.close().catch(() => {});
        }
    }
}

/**
 * Auto-close cookieyes.com popups/tabs opened by accidental branding-link clicks.
 * @param {import('@playwright/test').BrowserContext} context
 */
export function attachCookieYesTabGuard(context) {
    if (guardedContexts.has(context)) {
        return;
    }
    guardedContexts.add(context);
    context.on('page', async (newPage) => {
        await newPage.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => {});
        if (/cookieyes\.com/i.test(newPage.url())) {
            await newPage.close().catch(() => {});
        }
    });
}

/**
 * Wait for CookieYes to load, dismiss the banner via DOM click, and verify it stays hidden.
 * CookieYes injects the banner ~500ms after domcontentloaded even when consent is pre-seeded.
 *
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<boolean>}
 */
export async function ensureCookieConsentDismissed(page) {
    await seedCookieYesConsent(page.context());
    attachCookieYesTabGuard(page.context());

    const banner = page.locator('.cky-consent-container');
    const bannerAcceptBtn = page.locator('.cky-consent-bar button[data-cky-tag="accept-button"]');

    for (let attempt = 0; attempt < 20; attempt++) {
        await closeAccidentalCookieYesTabs(page);

        if (/cookieyes\.com/i.test(page.url())) {
            await page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => {});
        }

        if (await banner.isVisible({ timeout: 500 }).catch(() => false)) {
            await page.evaluate(() => {
                document.querySelectorAll('.cky-consent-container a[href*="cookieyes"]').forEach((link) => {
                    link.style.pointerEvents = 'none';
                    link.removeAttribute('href');
                });
            });
            await bannerAcceptBtn.evaluate((btn) => btn.click()).catch(() => {});
            await banner.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
            await seedCookieYesConsent(page.context()).catch(() => {});
        }

        const stillBlocking = await banner.isVisible({ timeout: 300 }).catch(() => false);
        if (!stillBlocking) {
            const cookieYesLoaded = await page
                .evaluate(() => !!document.getElementById('cookieyes-banner'))
                .catch(() => false);

            if (!cookieYesLoaded || attempt >= 2) {
                await closeAccidentalCookieYesTabs(page);
                return true;
            }
        }

        await page.waitForTimeout(400);
    }

    await closeAccidentalCookieYesTabs(page);
    return !(await banner.isVisible({ timeout: 500 }).catch(() => false));
}

/** @deprecated Use ensureCookieConsentDismissed */
export async function acceptCookiesIfVisible(page) {
    return ensureCookieConsentDismissed(page);
}
