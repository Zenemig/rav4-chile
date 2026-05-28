import { fetchHtml } from '../lib/browser.js';
import { extractCards } from '../lib/extract.js';

export default {
  name: 'Kavak',
  async search(context) {
    const url = 'https://www.kavak.com/cl/usados/toyota-rav4';
    const html = await fetchHtml(context, url, {
      waitForSelector: 'article, [class*="card" i], a[href*="/cl/autos/"]',
      timeout: 45000
    });
    return extractCards(html, {
      source: 'Kavak',
      baseUrl: 'https://www.kavak.com',
      cardSelector:
        'article, [class*="card" i], [class*="vehicle" i], a[href*="/cl/autos/"]',
      titleSelectors: ['h2', 'h3', '[class*="title" i]', '[class*="model" i]'],
      priceSelectors: ['[class*="price" i]', '[class*="precio" i]']
    });
  }
};
