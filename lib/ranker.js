const WEIGHTS = { price: 0.4, km: 0.3, year: 0.3 };

export function rank(listings) {
  const valid = listings.filter(
    l => Number.isFinite(l.price) && Number.isFinite(l.km) && Number.isFinite(l.year)
  );
  if (valid.length === 0) {
    return listings.map(l => ({ ...l, score: null })).sort(byKnownYear);
  }

  const prices = valid.map(l => l.price);
  const kms = valid.map(l => l.km);
  const years = valid.map(l => l.year);
  const minP = Math.min(...prices), maxP = Math.max(...prices);
  const minK = Math.min(...kms), maxK = Math.max(...kms);
  const minY = Math.min(...years), maxY = Math.max(...years);

  const norm = (v, mn, mx) => (mx === mn ? 0.5 : (v - mn) / (mx - mn));

  const scored = listings.map(l => {
    if (!Number.isFinite(l.price) || !Number.isFinite(l.km) || !Number.isFinite(l.year)) {
      return { ...l, score: null };
    }
    const priceScore = 1 - norm(l.price, minP, maxP);
    const kmScore = 1 - norm(l.km, minK, maxK);
    const yearScore = norm(l.year, minY, maxY);
    const base = WEIGHTS.price * priceScore + WEIGHTS.km * kmScore + WEIGHTS.year * yearScore;
    // The user explicitly wants HEV 4x4 — boost confirmed-AWD listings so they aren't
    // buried under high-mileage FWD bargains in the composite ranking.
    const awdBonus = l.awd ? 0.15 : 0;
    const score = Math.min(1, base + awdBonus);
    return { ...l, score: Math.round(score * 100) };
  });

  return scored.sort((a, b) => {
    if (a.score === null && b.score === null) return 0;
    if (a.score === null) return 1;
    if (b.score === null) return -1;
    return b.score - a.score;
  });
}

function byKnownYear(a, b) {
  return (b.year ?? 0) - (a.year ?? 0);
}

export function dedupe(listings) {
  const seen = new Map();
  for (const l of listings) {
    // Two listings with identical price+km+year on the same source are almost
    // certainly the same vehicle reposted — collapse by content fingerprint.
    const fingerprint = `${l.source}|${l.price ?? '?'}|${l.km ?? '?'}|${l.year ?? '?'}`;
    const key = l.price && l.km !== null && l.year ? fingerprint : l.url || fingerprint;
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, l);
    }
  }
  return [...seen.values()];
}
