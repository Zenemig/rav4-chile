import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const PROFILE_DIR = path.join(__dirname, '..', '.browser-profile');

export async function launchBrowser() {
  return await chromium.launch({
    headless: true,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
      '--no-sandbox'
    ]
  });
}

export async function launchPersistentContext({ headless = true } = {}) {
  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless,
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewport: { width: 1440, height: 900 },
    locale: 'es-CL',
    timezoneId: 'America/Santiago',
    args: ['--disable-blink-features=AutomationControlled']
  });
  await context.addInitScript(STEALTH_INIT);
  return context;
}

const STEALTH_INIT = `
  Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  Object.defineProperty(navigator, 'languages', { get: () => ['es-CL', 'es', 'en'] });
  Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
  window.chrome = { runtime: {}, app: {}, csi: () => {}, loadTimes: () => {} };
  const originalQuery = window.navigator.permissions && window.navigator.permissions.query;
  if (originalQuery) {
    window.navigator.permissions.query = (parameters) =>
      parameters.name === 'notifications'
        ? Promise.resolve({ state: Notification.permission })
        : originalQuery(parameters);
  }
`;

export async function newContext(browser) {
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewport: { width: 1440, height: 900 },
    locale: 'es-CL',
    timezoneId: 'America/Santiago',
    extraHTTPHeaders: {
      'Accept-Language': 'es-CL,es;q=0.9,en;q=0.8',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1'
    }
  });
  await context.addInitScript(STEALTH_INIT);
  return context;
}

export async function fetchHtml(context, url, { waitForSelector, timeout = 45000 } = {}) {
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: 'load', timeout }).catch(e => {
      // tolerate redirect-induced "navigation interrupted" — content may still arrive
      if (!/interrupted|aborted/i.test(e.message)) throw e;
    });
    if (waitForSelector) {
      await page.waitForSelector(waitForSelector, { timeout: 12000 }).catch(() => {});
    }
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1000);
    // Retry content() in case the page is mid-navigation
    for (let i = 0; i < 3; i++) {
      try {
        return await page.content();
      } catch (e) {
        if (!/navigating|content/i.test(e.message) || i === 2) throw e;
        await page.waitForTimeout(1500);
      }
    }
  } finally {
    await page.close();
  }
}
