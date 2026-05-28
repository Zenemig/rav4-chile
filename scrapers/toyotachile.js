import { fetchHtml } from '../lib/browser.js';
import { extractCards } from '../lib/extract.js';

export default {
  name: 'ToyotaChile',
  async search(context) {
    const url = 'https://www.toyotacertificados.cl/buscador?modelo=Rav4';
    const html = await fetchHtml(context, url, {
      waitForSelector: 'article, [class*="card" i], [class*="vehicle" i]',
      timeout: 45000
    });
    return extractCards(html, {
      source: 'ToyotaChile',
      baseUrl: 'https://www.toyotacertificados.cl',
      cardSelector:
        'article, [class*="vehicle-card" i], [class*="card" i], [class*="auto" i], [class*="result" i]',
      titleSelectors: ['h2', 'h3', '[class*="title" i]', '[class*="modelo" i]'],
      priceSelectors: ['[class*="price" i]', '[class*="precio" i]']
    });
  }
};
