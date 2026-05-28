import { writeFile } from 'node:fs/promises';
import { launchBrowser, newContext, fetchHtml } from '../lib/browser.js';

const url = process.argv[2];
const file = process.argv[3] || 'debug.html';
if (!url) {
  console.error('Usage: node scripts/debug.js <url> [outfile]');
  process.exit(1);
}

const browser = await launchBrowser();
const context = await newContext(browser);
const html = await fetchHtml(context, url);
await writeFile(file, html);
await browser.close();
console.log(`Wrote ${html.length} bytes to ${file}`);
