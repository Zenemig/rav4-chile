import { fetchHtml } from '../lib/browser.js';
import { extractCards } from '../lib/extract.js';

// Autonauta is Toyota Chile's official certified-used marketplace.
// Replaced toyotacertificados.cl. Open / no bot protection.

export default {
  name: 'Autonauta',
  async search(context) {
    const url = 'https://autonauta.cl/comprar/?marca=toyota&modelo=rav4';
    const html = await fetchHtml(context, url, {
      waitForSelector: 'a[href*="/comprar/"]'
    });
    return extractCards(html, {
      source: 'Autonauta',
      baseUrl: 'https://autonauta.cl',
      cardSelector: 'a[href*="/comprar/toyota-rav4"]',
      titleSelectors: ['h2', 'h3', '[class*="title" i]', '[class*="model" i]'],
      priceSelectors: ['[class*="price" i]', '[class*="precio" i]']
    });
  }
};
