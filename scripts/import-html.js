import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractCards } from '../lib/extract.js';
import { isRav4Hybrid } from '../lib/normalize.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MANUAL = path.join(__dirname, '..', 'docs', 'data', 'manual.json');

const SOURCES = {
  chileautos: {
    source: 'ChileAutos',
    baseUrl: 'https://www.chileautos.cl',
    cardSelector:
      'article, [class*="vehicle-card" i], [class*="search-result" i], [class*="listing-item" i], [data-id], a[href*="/auto/"]',
    titleSelectors: ['h2', 'h3', '[class*="title" i]', '[class*="model" i]'],
    priceSelectors: ['[class*="price" i]', '[class*="precio" i]']
  },
  generic: {
    source: 'Manual',
    baseUrl: '',
    cardSelector: 'article, [class*="card" i], [class*="vehicle" i], [class*="listing" i], [data-id]',
    titleSelectors: ['h2', 'h3', '[class*="title" i]'],
    priceSelectors: ['[class*="price" i]', '[class*="precio" i]']
  }
};

const [, , sourceKey, filePath] = process.argv;
if (!sourceKey || !filePath) {
  console.error(`Usage: node scripts/import-html.js <source> <file.html>`);
  console.error(`  source: ${Object.keys(SOURCES).join(' | ')}`);
  process.exit(1);
}

const config = SOURCES[sourceKey];
if (!config) {
  console.error(`Unknown source "${sourceKey}". Options: ${Object.keys(SOURCES).join(', ')}`);
  process.exit(1);
}

const html = await readFile(filePath, 'utf8');
console.log(`Read ${html.length} bytes from ${filePath}`);

const raw = extractCards(html, config);
const matched = raw.filter(i => i.title && isRav4Hybrid(i.title, i.description ?? ''));
console.log(`Extracted ${raw.length} cards, ${matched.length} matched RAV4 hybrid filter`);

if (matched.length === 0) {
  console.log(`\nNo matches. Sample of raw cards extracted:`);
  raw.slice(0, 5).forEach((c, i) => {
    console.log(`\n  ${i + 1}. ${c.title?.slice(0, 80)}`);
    console.log(`     ${(c.description || '').slice(0, 120)}`);
  });
  console.log(`\nIf those look like listings, the HEV/4x4 filter may be too strict. If they look wrong, the selector for "${sourceKey}" needs adjustment.`);
  process.exit(0);
}

// Merge with existing manual.json: replace entries from this source, keep others
let existing = [];
try {
  existing = JSON.parse(await readFile(MANUAL, 'utf8'));
  if (!Array.isArray(existing)) existing = [];
} catch {}

const otherSources = existing.filter(e => e.source !== config.source);
const merged = [...otherSources, ...matched];
await writeFile(MANUAL, JSON.stringify(merged, null, 2));

console.log(`\nWrote ${merged.length} total entries to docs/data/manual.json`);
console.log(`  · ${matched.length} from ${config.source} (replaced)`);
console.log(`  · ${otherSources.length} from other sources (kept)`);
console.log(`\nNext: npm run search   (re-rank and write latest.json)`);
console.log(`      npm run publish   (commit + push to live site)`);
