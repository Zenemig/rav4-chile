const CLP = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0
});
const NUM = new Intl.NumberFormat('es-CL');

async function load() {
  const meta = document.getElementById('meta');
  try {
    const res = await fetch(`./data/latest.json?t=${Date.now()}`);
    if (!res.ok) throw new Error('Sin datos. Ejecuta `npm run search` para generarlos.');
    const data = await res.json();
    render(data);
  } catch (e) {
    meta.textContent = e.message;
    meta.classList.add('error');
  }
}

function render(data) {
  const when = new Date(data.generatedAt);
  const ago = relativeTime(when);
  document.getElementById('meta').innerHTML =
    `Actualizado <strong>${ago}</strong> · ${when.toLocaleString('es-CL')} · ${data.listings.length} resultados totales`;

  const sources = document.getElementById('sources');
  sources.innerHTML = data.sources
    .map(
      s => `
        <span class="chip ${s.error ? 'chip-error' : s.count > 0 ? 'chip-ok' : 'chip-empty'}"
              title="${escapeAttr(s.error ?? '')}">
          ${s.source} · ${s.count}
        </span>`
    )
    .join('');

  const top = data.listings.slice(0, 10);
  const list = document.getElementById('listings');
  if (top.length === 0) {
    list.innerHTML = `<p class="empty">No se encontraron RAV4 Híbrido 4×4. Verifica los scrapers o intenta de nuevo.</p>`;
    return;
  }

  list.innerHTML = top
    .map(
      (l, i) => `
      <article class="card">
        <div class="rank">#${i + 1}</div>
        <a class="thumb" href="${escapeAttr(l.url)}" target="_blank" rel="noopener">
          ${l.image ? `<img src="${escapeAttr(l.image)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : '<div class="thumb-fallback">🚗</div>'}
        </a>
        <div class="body">
          <h2><a href="${escapeAttr(l.url)}" target="_blank" rel="noopener">${escapeHtml(l.title)}</a></h2>
          <div class="badges">
            ${badge('year', l.year ?? '—')}
            ${badge('km', l.km !== null ? `${NUM.format(l.km)} km` : '— km')}
            ${badge('price', l.price ? CLP.format(l.price) : '—')}
            ${badge('source', l.source)}
          </div>
          ${l.location ? `<div class="location">${escapeHtml(l.location)}</div>` : ''}
        </div>
        <div class="score ${scoreClass(l.score)}" title="Score: 40% precio · 30% km · 30% año">
          ${l.score ?? '—'}
        </div>
      </article>`
    )
    .join('');
}

function badge(kind, value) {
  return `<span class="badge badge-${kind}">${escapeHtml(String(value))}</span>`;
}

function scoreClass(s) {
  if (s === null || s === undefined) return 'score-na';
  if (s >= 75) return 'score-high';
  if (s >= 55) return 'score-mid';
  return 'score-low';
}

function relativeTime(date) {
  const diffMs = Date.now() - date.getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  const days = Math.round(hrs / 24);
  return `hace ${days} día${days === 1 ? '' : 's'}`;
}

function escapeHtml(s) {
  return String(s ?? '').replace(
    /[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

function escapeAttr(s) {
  return escapeHtml(s);
}

load();
