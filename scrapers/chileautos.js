import { fetchHtml } from '../lib/browser.js';
import { extractCards } from '../lib/extract.js';

export default {
  name: 'ChileAutos',
  async search(context) {
    const url =
      'https://www.chileautos.cl/vehiculos/auto/toyota/rav4/?Combustible_v=H%C3%ADbrido&sort=Year-desc';
    const html = await fetchHtml(context, url, {
      waitForSelector: 'article, .listing, [class*="vehicle-card" i], [class*="search-result" i]'
    });
    return extractCards(html, {
      source: 'ChileAutos',
      baseUrl: 'https://www.chileautos.cl',
      cardSelector:
        'article, .listing-item, [class*="vehicle-card" i], [class*="search-result" i], [class*="listing" i]',
      titleSelectors: ['h2', 'h3', '[class*="title" i]'],
      priceSelectors: ['[class*="price" i]', '[class*="precio" i]']
    });
  }
};
