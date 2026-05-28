import { writeFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { launchBrowser, newContext } from '../lib/browser.js';
import { rank, dedupe } from '../lib/ranker.js';
import { isRav4Hybrid } from '../lib/normalize.js';

import mercadolibre from '../scrapers/mercadolibre.js';
import chileautos from '../scrapers/chileautos.js';
import autonauta from '../scrapers/autonauta.js';
import kavak from '../scrapers/kavak.js';
import facebook from '../scrapers/facebook.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'docs', 'data', 'latest.json');
const MANUAL = path.join(__dirname, '..', 'docs', 'data', 'manual.json');

const SCRAPERS = [mercadolibre, chileautos, autonauta, kavak, facebook];

async function runScraper(scraper, context) {
  const start = Date.now();
  try {
    const raw = await scraper.search(context);
    const filtered = raw.filter(i => i.title && isRav4Hybrid(i.title, i.description ?? ''));
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`  ✓ ${scraper.name.padEnd(20)} ${String(raw.length).padStart(4)} raw → ${String(filtered.length).padStart(3)} match (${elapsed}s)`);
    return { source: scraper.name, raw: raw.length, count: filtered.length, items: filtered, error: null };
  } catch (e) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`  ✗ ${scraper.name.padEnd(20)} ERROR (${elapsed}s) — ${e.message}`);
    return { source: scraper.name, raw: 0, count: 0, items: [], error: e.message };
  }
}

async function main() {
  const t0 = Date.now();
  console.log(`\nRAV4 HEV 4×4 — Chile · ${new Date().toLocaleString('es-CL')}\n`);
  console.log(`Searching ${SCRAPERS.length} marketplaces with headless Chromium...\n`);

  const browser = await launchBrowser();
  const context = await newContext(browser);

  const results = await Promise.all(SCRAPERS.map(s => runScraper(s, context)));
  await browser.close();

  const all = results.flatMap(r => r.items);
  const manual = await loadManual();
  if (manual.length) {
    console.log(`\n  + ${manual.length} listings from manual.json`);
    results.push({ source: 'Manual', raw: manual.length, count: manual.length, error: null });
  }
  const deduped = dedupe([...all, ...manual]);
  const ranked = rank(deduped);

  const output = {
    generatedAt: new Date().toISOString(),
    elapsedMs: Date.now() - t0,
    sources: results.map(({ items, ...rest }) => rest),
    listings: ranked
  };

  await mkdir(path.dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(output, null, 2));

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n  Total: ${all.length} listings · ${deduped.length} unique · ${ranked.filter(l => l.score !== null).length} scored`);
  console.log(`  Wrote ${path.relative(process.cwd(), OUT)} in ${elapsed}s\n`);
  console.log(`  Preview locally:  npm run serve`);
  console.log(`  Publish to web:   npm run publish\n`);
}

async function loadManual() {
  try {
    const raw = await readFile(MANUAL, 'utf8');
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.map(item => ({
      source: item.source || 'Manual',
      title: item.title || '',
      description: item.description || '',
      price: Number.isFinite(item.price) ? item.price : null,
      km: Number.isFinite(item.km) ? item.km : null,
      year: Number.isFinite(item.year) ? item.year : null,
      awd: item.awd !== false,
      url: item.url || null,
      image: item.image || null,
      location: item.location || null
    }));
  } catch {
    return [];
  }
}

main().catch(e => {
  console.error('\nFatal:', e);
  process.exit(1);
});
