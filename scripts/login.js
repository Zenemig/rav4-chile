import { launchPersistentContext, PROFILE_DIR } from '../lib/browser.js';

const target = process.argv[2] || 'https://www.facebook.com/marketplace/category/vehicles';

console.log(`\nOpening ${target}`);
console.log(`Profile: ${PROFILE_DIR}`);
console.log(`\nLog in if prompted. Cookies will persist for future scrapes.`);
console.log(`Close the browser window when done.\n`);

const context = await launchPersistentContext({ headless: false });
const page = context.pages()[0] || (await context.newPage());
await page.goto(target);

// Wait for the user to close the window manually
await new Promise(resolve => context.on('close', resolve));
console.log('Session saved.');
