import { fetchHtml } from '../lib/browser.js';
import { extractCards } from '../lib/extract.js';

export default {
  name: 'MercadoLibre',
  async search(context) {
    // Used vehicles only (ITEM_CONDITION=2230581). Listings include new+used by default; we filter to used.
    const url = 'https://listado.mercadolibre.cl/rav4-hibrido-autos-toyota_ITEM*CONDITION_2230581';
    const html = await fetchHtml(context, url, {
      waitForSelector: '.ui-search-layout, .ui-search-results'
    });
    const items = extractCards(html, {
      source: 'MercadoLibre',
      baseUrl: 'https://listado.mercadolibre.cl',
      cardSelector: 'li.ui-search-layout__item, .ui-search-result, .andes-card.poly-card',
      titleSelectors: ['.ui-search-item__title', '.poly-component__title', 'h2', 'h3'],
      priceSelectors: ['.andes-money-amount__fraction', '.price-tag-fraction']
    });
    // Filter to vehicle listings only — autos use auto.mercadolibre.cl, accessories use articulo./www.
    return items.filter(i => i.url && /auto\.mercadolibre\.cl/.test(i.url));
  }
};
