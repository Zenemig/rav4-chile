import { launchPersistentContext } from '../lib/browser.js';
import { parsePrice, parseKm, parseYear, isAwdConfirmed } from '../lib/normalize.js';

// Facebook Marketplace requires a logged-in session. Run `npm run login` once to
// authenticate in a real browser window; cookies persist in .browser-profile/.
// We then load the marketplace search via that persistent context.

export default {
  name: 'Facebook Marketplace',
  async search(_unusedContext) {
    const context = await launchPersistentContext({ headless: true });
    const page = await context.newPage();
    try {
      const url =
        'https://www.facebook.com/marketplace/santiago/search?query=toyota%20rav4%20hibrido&exact=false';
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(3500);

      // Check we're not on a login wall
      const onLogin = await page
        .locator('input[name="email"], input[name="pass"]')
        .first()
        .isVisible()
        .catch(() => false);
      if (onLogin) {
        throw new Error('not logged in — run `npm run login` first');
      }

      // Extract via in-page evaluation, since FB markup is heavily obfuscated
      const items = await page.evaluate(() => {
        const cards = [...document.querySelectorAll('a[href*="/marketplace/item/"]')];
        const seen = new Set();
        const out = [];
        for (const a of cards) {
          if (seen.has(a.href)) continue;
          seen.add(a.href);
          const card = a.closest('div[class]') || a;
          const text = card.innerText || '';
          const img = card.querySelector('img')?.src || null;
          out.push({ url: a.href, text, image: img });
        }
        return out;
      });

      return items.map(i => ({
        source: 'Facebook',
        title: i.text.split('\n').find(l => /rav.?4/i.test(l)) || i.text.slice(0, 80),
        description: i.text.slice(0, 600),
        price: parsePrice(i.text),
        km: parseKm(i.text),
        year: parseYear(i.text),
        awd: isAwdConfirmed(i.text),
        url: i.url,
        image: i.image
      }));
    } finally {
      await context.close();
    }
  }
};
