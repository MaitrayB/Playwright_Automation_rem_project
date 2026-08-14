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

    const acceptAll = page.getByRole('button', { name: /^Accept All$/i });

    const bannerIsBlocking = async () =>
        page.evaluate(() => {
            const btn = [...document.querySelectorAll('button')].find((b) =>
                /^Accept All$/i.test((b.textContent || '').trim())
            );
            if (btn) {
                const s = getComputedStyle(btn);
                if (s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity) > 0.05) {
                    const r = btn.getBoundingClientRect();
                    if (r.width > 0 && r.height > 0) return true;
                }
            }
            const box = document.querySelector(
                '.cky-consent-container, .cky-popup-center, [aria-label="We value your privacy"]'
            );
            if (!box) return false;
            const s = getComputedStyle(box);
            if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) < 0.05) {
                return false;
            }
            const r = box.getBoundingClientRect();
            return r.width > 0 && r.height > 0;
        }).catch(() => false);

    for (let attempt = 0; attempt < 8; attempt++) {
        if (page.isClosed()) return false;
        await closeAccidentalCookieYesTabs(page);

        if (await acceptAll.isVisible({ timeout: 250 }).catch(() => false)) {
            await acceptAll.click({ force: true }).catch(() => {});
            await seedCookieYesConsent(page.context()).catch(() => {});
        } else if (await bannerIsBlocking()) {
            await page.evaluate(() => {
                const btn = document.querySelector('button[data-cky-tag="accept-button"]');
                if (btn) btn.click();
            }).catch(() => {});
            await acceptAll.click({ force: true }).catch(() => {});
        }

        if (!(await bannerIsBlocking())) {
            if (attempt >= 1) {
                await closeAccidentalCookieYesTabs(page);
                return true;
            }
        } else if (attempt >= 3) {
            await page.evaluate(() => {
                document
                    .querySelectorAll(
                        '.cky-consent-container, .cky-overlay, .cky-modal, .cky-popup-center'
                    )
                    .forEach((el) => el.remove());
            }).catch(() => {});
            return true;
        }

        await page.waitForTimeout(250).catch(() => {});
    }

    await page.evaluate(() => {
        document
            .querySelectorAll('.cky-consent-container, .cky-overlay, .cky-modal, .cky-popup-center')
            .forEach((el) => el.remove());
    }).catch(() => {});
    await closeAccidentalCookieYesTabs(page);
    return true;
}

/** @deprecated Use ensureCookieConsentDismissed */
export async function acceptCookiesIfVisible(page) {
    return ensureCookieConsentDismissed(page);
}
