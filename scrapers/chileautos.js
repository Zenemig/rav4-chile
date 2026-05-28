import { launchPersistentContext, fetchHtml } from '../lib/browser.js';
import { extractCards } from '../lib/extract.js';

// ChileAutos is protected by DataDome. Solve the captcha once via
// `npm run login https://www.chileautos.cl/vehiculos/autos-vehículo/toyota/rav4/`
// (cookies persist in .browser-profile/, typically 12-24h before re-solve needed).

export default {
  name: 'ChileAutos',
  async search(_fresh) {
    const context = await launchPersistentContext({ headless: true });
    try {
      const url =
        'https://www.chileautos.cl/vehiculos/autos-vehículo/toyota/rav4/?Combustible_v=H%C3%ADbrido&sort=Year-desc';
      const html = await fetchHtml(context, url, {
        waitForSelector: 'article, [class*="vehicle-card" i], [data-id]'
      });
      // DataDome challenge page is ~1.5KB; real content is much larger.
      if (!html || html.length < 5000) {
        throw new Error('DataDome challenge — run `npm run login <chileautos URL>` to solve once');
      }
      return extractCards(html, {
        source: 'ChileAutos',
        baseUrl: 'https://www.chileautos.cl',
        cardSelector:
          'article, [class*="vehicle-card" i], [class*="search-result" i], [class*="listing-item" i], [data-id]',
        titleSelectors: ['h2', 'h3', '[class*="title" i]'],
        priceSelectors: ['[class*="price" i]', '[class*="precio" i]']
      });
    } finally {
      await context.close();
    }
  }
};
