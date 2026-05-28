export function parsePrice(text) {
  if (!text) return null;
  const cleaned = String(text).replace(/[^\d]/g, '');
  if (!cleaned) return null;
  const n = parseInt(cleaned, 10);
  if (n < 5_000_000 || n > 200_000_000) return null;
  return n;
}

export function parseKm(text) {
  if (!text) return null;
  // Match grouped formats (12.345 / 12,345 / 123.456) or bare 1-6 digit runs, immediately followed by km
  const m = String(text).match(/(\d{1,3}(?:[.,]\d{3}){0,2}|\d{1,6})\s*(?:km|kms|kilometros|kilómetros)\b/i);
  if (!m) return null;
  const n = parseInt(m[1].replace(/[^\d]/g, ''), 10);
  if (isNaN(n) || n < 0 || n > 500_000) return null;
  return n;
}

export function parseYear(text) {
  if (!text) return null;
  const matches = String(text).match(/\b(20[12]\d)\b/g);
  if (!matches) return null;
  const years = matches.map(Number).filter(y => y >= 2018 && y <= 2026);
  if (!years.length) return null;
  return Math.max(...years);
}

export function isRav4Hybrid(title, description = '') {
  const t = `${title} ${description}`.toLowerCase();
  const isRav4 = /rav.?4/.test(t);
  const isHybrid = /(hybrid|h[íi]brid|\bhev\b|\bhv\b)/.test(t);
  const isFwdExplicit = /(\b2x4\b|\b4x2\b|\bfwd\b|\b2wd\b|tracci[oó]n delantera)/.test(t);
  const isAwd = /(4x4|\bawd\b|\b4wd\b|all.?wheel|tracci[oó]n integral|tracci[oó]n total)/.test(t);
  if (isFwdExplicit && !isAwd) return false;
  return isRav4 && isHybrid;
}

export function isAwdConfirmed(title, description = '') {
  const t = `${title} ${description}`.toLowerCase();
  return /(4x4|\bawd\b|\b4wd\b|all.?wheel|tracci[oó]n integral|tracci[oó]n total)/.test(t);
}
