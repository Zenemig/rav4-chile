import * as cheerio from 'cheerio';
import { parsePrice, parseKm, parseYear, isAwdConfirmed } from './normalize.js';

export function extractCards(html, config) {
  const $ = cheerio.load(html);
  const items = [];

  $(config.cardSelector).each((_, el) => {
    const $el = $(el);
    const title =
      pickText($, $el, config.titleSelectors) ||
      $el.attr('aria-label') ||
      $el.attr('title') ||
      '';
    if (!title) return;

    const priceText = pickText($, $el, config.priceSelectors);
    const link = $el.is('a') ? $el.attr('href') : pickAttr($el, 'a', 'href');
    const image =
      pickAttr($el, 'img', 'src') ||
      pickAttr($el, 'img', 'data-src') ||
      pickAttr($el, 'img', 'data-lazy-src');

    // Separator-preserving text — joins text nodes with ' | ' so '2026' and '0 Km' don't fuse.
    const parts = collectTextParts($, $el);
    const meta = parts.join(' | ').slice(0, 600);
    const combined = `${title} | ${parts.join(' | ')}`;

    items.push({
      source: config.source,
      title: title.trim(),
      description: meta,
      price: parsePrice(priceText) ?? parsePrice(parts.join(' ')),
      km: parseKm(combined),
      year: parseYear(combined),
      awd: isAwdConfirmed(title, meta),
      url: absolutize(link, config.baseUrl),
      image: absolutize(image, config.baseUrl)
    });
  });

  return items;
}

function collectTextParts($, $el) {
  const parts = [];
  const seen = new Set();
  $el.find('*').addBack().each((_, node) => {
    $(node).contents().each((__, child) => {
      if (child.type === 'text') {
        const t = (child.data || '').replace(/\s+/g, ' ').trim();
        if (t && !seen.has(t)) {
          seen.add(t);
          parts.push(t);
        }
      }
    });
  });
  return parts;
}

function pickText($, $el, selectors = []) {
  for (const sel of selectors) {
    const t = $el.find(sel).first().text().trim();
    if (t) return t;
  }
  return '';
}

function pickAttr($el, selector, attr) {
  const v = $el.find(selector).first().attr(attr);
  return v || null;
}

function absolutize(link, base) {
  if (!link) return null;
  if (link.startsWith('http')) return link;
  if (link.startsWith('//')) return `https:${link}`;
  if (!base) return link;
  return `${base.replace(/\/$/, '')}${link.startsWith('/') ? '' : '/'}${link}`;
}
