// Departure performance panel — airport lookup, METAR fetch, runway selection,
// and POH distance calculations.

import { loadAirports, lookupAirport }  from './airportDB.js';
import { fetchMETAR, pressureAlt }      from './metar.js';
import { rankRunways, calcPerformance,
         XWIND_LIMIT_KT }               from './performance.js';

function fmtFt(ft) { return `${Math.round(ft).toLocaleString()} ft`; }
function fmtM(m)   { return `${Math.round(m)} m`; }

function arrowSvg(dir) {
  const S = 17, mid = S / 2, tip = S - 2, tail = 2, aw = 5, as = 6.5;
  let line, head;
  if (dir === 'down') {
    line = `<line x1="${mid}" y1="${tail}" x2="${mid}" y2="${tip - as}"`;
    head = `<polygon points="${mid},${tip} ${mid - aw},${tip - as} ${mid + aw},${tip - as}"`;
  } else if (dir === 'up') {
    line = `<line x1="${mid}" y1="${tip}" x2="${mid}" y2="${tail + as}"`;
    head = `<polygon points="${mid},${tail} ${mid - aw},${tail + as} ${mid + aw},${tail + as}"`;
  } else if (dir === 'left') {
    line = `<line x1="${tip}" y1="${mid}" x2="${tail + as}" y2="${mid}"`;
    head = `<polygon points="${tail},${mid} ${tail + as},${mid - aw} ${tail + as},${mid + aw}"`;
  } else {
    line = `<line x1="${tail}" y1="${mid}" x2="${tip - as}" y2="${mid}"`;
    head = `<polygon points="${tip},${mid} ${tip - as},${mid - aw} ${tip - as},${mid + aw}"`;
  }
  return `<svg class="rwy-arrow" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}" aria-hidden="true">`
       + `${line} stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>`
       + `${head} fill="currentColor"/></svg>`;
}

// ---------------------------------------------------------------------------
// Template
// ---------------------------------------------------------------------------

function template() {
  return `
    <div class="perf-panel">
      <div class="perf-row perf-row--airport" id="perf-lookup-row">
        <label class="perf-label" for="perf-apt-id">Airport</label>
        <div class="perf-input-group">
          <input class="perf-input" type="text" id="perf-apt-id"
                 placeholder="KMCI or K1C5" maxlength="7"
                 autocapitalize="characters" spellcheck="false">
          <button class="perf-btn" id="perf-load-apt">Load</button>
        </div>
        <span class="perf-status" id="perf-apt-status"></span>
      </div>
      <div class="perf-spinner" id="perf-spinner" hidden>
        <span class="perf-spinner__ring"></span>
        <span class="perf-spinner__label" id="perf-spinner-label"></span>
      </div>

      <div id="perf-metar-section" hidden>
        <div class="perf-apt-header">
          <div class="perf-apt-name" id="perf-apt-info"></div>
          <button class="perf-apt-clear" id="perf-clear-apt" aria-label="Clear airport">✕</button>
        </div>
        <span class="perf-status" id="perf-metar-status" hidden></span>

        <div id="perf-alt-section" hidden>
          <div class="perf-row">
            <label class="perf-label" for="perf-alt-id">Alt. station</label>
            <div class="perf-input-group">
              <input class="perf-input" type="text" id="perf-alt-id"
                     placeholder="e.g. KMCI" maxlength="7"
                     autocapitalize="characters" spellcheck="false">
              <button class="perf-btn" id="perf-fetch-alt">Fetch</button>
            </div>
          </div>
        </div>
      </div>

      <div id="perf-results" hidden>
        <div class="perf-conditions">
          <div class="perf-cond-row">
            <span class="perf-cond-label">OAT</span>
            <span class="perf-cond-val" id="perf-oat"></span>
          </div>
          <div class="perf-cond-row">
            <span class="perf-cond-label">Altimeter</span>
            <span class="perf-cond-val" id="perf-altim"></span>
          </div>
          <div class="perf-cond-row">
            <span class="perf-cond-label">Press. Alt</span>
            <span class="perf-cond-val" id="perf-pa"></span>
          </div>
          <div class="perf-cond-row">
            <span class="perf-cond-label">Wind</span>
            <span class="perf-cond-val" id="perf-wind"></span>
          </div>
        </div>

        <div class="perf-runway-header">Select runway</div>
        <div id="perf-runway-list" class="perf-runway-list"></div>

        <div id="perf-distances" hidden>
          <div class="perf-accel-grid">
            <div class="perf-accel-card" id="perf-acstop-card">
              <div class="perf-accel-label">Accelerate-Stop Distance</div>
              <div class="perf-accel-val" id="perf-acstop"></div>
            </div>
            <div class="perf-accel-card" id="perf-acgo-card">
              <div class="perf-accel-label">Accelerate-Go Distance</div>
              <div class="perf-accel-val" id="perf-acgo"></div>
            </div>
          </div>

          <div class="perf-dist-grid">
            <div class="perf-dist-section">
              <div class="perf-dist-heading">Takeoff</div>
              <div class="perf-dist-row">
                <span class="perf-dist-label">Ground roll</span>
                <span class="perf-dist-val" id="perf-to-gr"></span>
              </div>
              <div class="perf-dist-row">
                <span class="perf-dist-label">To 50 ft obstacle</span>
                <span class="perf-dist-val" id="perf-to-50"></span>
              </div>
            </div>
            <div class="perf-dist-section">
              <div class="perf-dist-heading">Landing</div>
              <div class="perf-dist-row">
                <span class="perf-dist-label">Ground roll</span>
                <span class="perf-dist-val" id="perf-ldg-gr"></span>
              </div>
              <div class="perf-dist-row">
                <span class="perf-dist-label">From 50 ft obstacle</span>
                <span class="perf-dist-val" id="perf-ldg-50"></span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>`;
}

// ---------------------------------------------------------------------------
// Mount
// ---------------------------------------------------------------------------

export function mountPerformancePanel(target, { getGrossLb, getLandingLb, onMetarLoad, onResultChange }) {
  const root = document.createElement('div');
  root.innerHTML = template();
  target.replaceChildren(root);

  let db       = null;
  let airport  = null;
  let metar    = null;
  let ranked   = [];
  let selected = null;   // { runway, endId }
  let perfResult = null;

  const $ = id => root.querySelector(`#${id}`);

  const aptIdEl       = $('perf-apt-id');
  const loadAptBtn    = $('perf-load-apt');
  const aptStatusEl   = $('perf-apt-status');
  const lookupRowEl   = $('perf-lookup-row');
  const metarSection  = $('perf-metar-section');
  const aptInfoEl     = $('perf-apt-info');
  const metarStatusEl = $('perf-metar-status');
  const altSection    = $('perf-alt-section');
  const altIdEl       = $('perf-alt-id');
  const fetchAltBtn   = $('perf-fetch-alt');
  const resultsEl     = $('perf-results');
  const distancesEl   = $('perf-distances');
  const runwayListEl  = $('perf-runway-list');
  const spinnerEl     = $('perf-spinner');
  const spinnerLabel  = $('perf-spinner-label');

  function showSpinner(label) { spinnerLabel.textContent = label; spinnerEl.hidden = false; }
  function hideSpinner()      { spinnerEl.hidden = true; }

  // Warm the cache in background
  loadAirports().then(data => { db = data; }).catch(() => {});

  function clearAirport() {
    airport = null; metar = null; selected = null; perfResult = null;
    lookupRowEl.hidden  = false;
    metarSection.hidden = true;
    resultsEl.hidden    = true;
    hideSpinner();
    setStatus(aptStatusEl, '');
    aptIdEl.value = '';
  }

  $('perf-clear-apt').addEventListener('click', clearAirport);

  // ── Airport load ──────────────────────────────────────────────────────────

  async function loadAirport() {
    const id = aptIdEl.value.trim();
    if (!id) return;
    showSpinner('Loading airport…');
    setStatus(aptStatusEl, '');
    try {
      if (!db) db = await loadAirports();
      airport = lookupAirport(db, id);
      if (!airport) {
        hideSpinner();
        setStatus(aptStatusEl, 'Airport not found', 'error');
        return;
      }
      aptInfoEl.textContent = `${airport.name} — ${airport.city}, ${airport.state}`;
      lookupRowEl.hidden  = true;
      metarSection.hidden = false;
      resultsEl.hidden    = true;
      metar = null; selected = null;
      doFetch(airport.metar_id ?? airport.id);
    } catch (e) {
      hideSpinner();
      setStatus(aptStatusEl, `Error: ${e.message}`, 'error');
    }
  }

  loadAptBtn.addEventListener('click', loadAirport);
  aptIdEl.addEventListener('keydown', e => { if (e.key === 'Enter') loadAirport(); });

  // ── METAR fetch ───────────────────────────────────────────────────────────

  async function doFetch(stationId) {
    if (!stationId) return;
    showSpinner('Fetching weather…');
    setStatus(metarStatusEl, '', '');
    try {
      const result = await fetchMETAR(stationId);
      hideSpinner();
      if (!result) {
        setStatus(metarStatusEl,
          'No METAR for this station — enter an alternate station below', 'warn');
        altSection.hidden = false;
        return;
      }
      metar = result;
      altSection.hidden = true;
      setStatus(metarStatusEl, '');
      renderResults();
      onMetarLoad?.();
    } catch (e) {
      hideSpinner();
      setStatus(metarStatusEl, `Error: ${e.message}`, 'error');
    }
  }

  fetchAltBtn.addEventListener('click', () => doFetch(altIdEl.value.trim()));
  altIdEl.addEventListener('keydown', e => { if (e.key === 'Enter') doFetch(altIdEl.value.trim()); });

  // ── Render conditions + runway list ───────────────────────────────────────

  function renderResults() {
    if (!metar || !airport) return;

    resultsEl.hidden   = false;
    distancesEl.hidden = true;
    selected = null;

    const elev    = airport.elev_ft ?? 0;
    const pa      = pressureAlt(elev, metar.altimeter_inhg ?? 29.92);
    const windDesc = metar.wind_variable
      ? `Variable ${metar.wind_speed_kt} kt`
      : metar.wind_dir_deg !== null
        ? `${String(metar.wind_dir_deg).padStart(3, '0')}° / ${metar.wind_speed_kt} kt`
          + (metar.wind_gust_kt ? ` G${metar.wind_gust_kt}` : '')
        : 'Calm';

    $('perf-oat').textContent   = metar.oat_c !== null
      ? `${metar.oat_c} °C / ${Math.round(metar.oat_c * 9/5 + 32)} °F` : '—';
    $('perf-altim').textContent = metar.altimeter_inhg !== null
      ? `${metar.altimeter_inhg.toFixed(2)} inHg`  : '—';
    $('perf-pa').textContent    = fmtFt(pa);
    $('perf-wind').textContent  = windDesc;

    ranked = rankRunways(
      airport.runways,
      metar.wind_variable ? null : metar.wind_dir_deg,
      metar.wind_speed_kt ?? 0,
    );

    renderRunwayList();
  }

  function renderRunwayList() {
    runwayListEl.innerHTML = '';

    // Build per-runway entry lists preserving best-first order
    const source = ranked.length
      ? ranked
      : airport.runways.flatMap(rwy =>
          Object.keys(rwy.ends).map(endId => ({
            runway: rwy, endId, end: rwy.ends[endId],
            headwind_kt: null, xwind_kt: null, xwind_ok: true,
          })));

    const byRwy = new Map();
    for (const r of source) {
      if (!byRwy.has(r.runway.id)) byRwy.set(r.runway.id, []);
      byRwy.get(r.runway.id).push(r);
    }

    // "Best Wind" badge on globally best end only. Suppressed for variable wind.
    // Parallel runways with the same numeric (35L/35R/35C) all qualify if equally viable.
    const bestNum  = source[0]?.endId.replace(/[LRCrc]$/, '') ?? '';
    const bestOk   = source[0]?.xwind_ok ?? true;
    const bestKeys = metar?.wind_variable ? new Set() : new Set(
      source
        .filter(r => r.endId.replace(/[LRCrc]$/, '') === bestNum && r.xwind_ok === bestOk)
        .map(r => `${r.runway.id}::${r.endId}`)
    );

    let autoSelect = null;
    for (const entries of byRwy.values()) {
      const card = buildRunwayCard(entries, bestKeys);
      runwayListEl.appendChild(card);
      if (!autoSelect) autoSelect = entries[0];
    }

    if (autoSelect) selectEnd(autoSelect.runway, autoSelect.endId);
  }

  function selectEnd(runway, endId) {
    selected = { runway, endId };
    root.querySelectorAll('.rwy-end-row').forEach(el => el.classList.remove('rwy-end-row--active'));
    root.querySelector(`.rwy-end-row[data-rwy-id="${CSS.escape(runway.id)}"][data-end-id="${CSS.escape(endId)}"]`)
        ?.classList.add('rwy-end-row--active');
    renderDistances();
  }

  function buildRunwayCard(entries, bestKeys) {
    const rwy     = entries[0].runway;
    const bestEntry = entries.find(e => e.xwind_ok) ?? entries[0];
    const hasWind   = entries[0].headwind_kt !== null;

    const SURF_LABEL = { paved: 'Asphalt / Concrete', turf: 'Turf', gravel: 'Gravel', dirt: 'Dirt' };
    const dims = [
      rwy.length_ft ? `${rwy.length_ft.toLocaleString()}'` : null,
      rwy.width_ft  ? `${rwy.width_ft}'` : null,
    ].filter(Boolean).join(' × ');

    const card = document.createElement('div');
    card.className = 'rwy-card';

    // ── Left info panel ────────────────────────────────────────────
    const infoEl = document.createElement('div');
    infoEl.className = 'rwy-card__info';
    infoEl.innerHTML =
      `<div class="rwy-card__designation">${rwy.id}</div>` +
      (dims ? `<div class="rwy-card__dims">${dims}</div>` : '') +
      `<div class="rwy-card__surface">${SURF_LABEL[rwy.surface] ?? rwy.surface}</div>`;

    // ── End rows ───────────────────────────────────────────────────
    const endsEl = document.createElement('div');
    endsEl.className = 'rwy-card__ends';

    for (const r of entries) {
      const isBest = bestKeys?.has(`${rwy.id}::${r.endId}`) ?? false;
      const hw = r.headwind_kt, xw = r.xwind_kt;

      let hwHtml = '';
      if (hw !== null) {
        const isHead = hw >= 0;
        hwHtml = `<span class="rwy-end__hw rwy-end__hw--${isHead ? 'head' : 'tail'}">${arrowSvg(isHead ? 'down' : 'up')} ${Math.abs(hw)} kt</span>`;
      }

      let xwHtml = '';
      if (xw !== null) {
        const xwAbs = Math.abs(xw);
        const xdir  = xw > 0 ? 'left' : 'right';
        const cls   = r.xwind_ok ? 'rwy-end__xw' : 'rwy-end__xw rwy-end__xw--warn';
        xwHtml = xwAbs > 0
          ? `<span class="${cls}">${arrowSvg(xdir)} ${xwAbs} kt${r.xwind_ok ? '' : ' ⚠'}</span>`
          : `<span class="rwy-end__xw rwy-end__xw--nil">0 kt</span>`;
      }

      const slopeHtml = r.end.slope_pct !== null
        ? `<span class="rwy-end__slope">${r.end.slope_pct > 0 ? '+' : ''}${r.end.slope_pct}% slope</span>`
        : '';

      const row = document.createElement('div');
      row.className = `rwy-end-row${isBest ? ' rwy-end-row--best' : ''}${!r.xwind_ok ? ' rwy-end-row--warn' : ''}`;
      row.dataset.rwyId = rwy.id;
      row.dataset.endId = r.endId;
      row.innerHTML =
        `<span class="rwy-end__id">Rwy ${r.endId}</span>` +
        (isBest ? '<span class="rwy-end__badge">Best Wind</span>' : '') +
        `<span class="rwy-end__wind">${hwHtml}${xwHtml}</span>` +
        slopeHtml;

      row.addEventListener('click', () => selectEnd(rwy, r.endId));
      endsEl.appendChild(row);
    }

    // ── Wind vector SVG ────────────────────────────────────────────
    const svgEl = document.createElement('div');
    svgEl.className = 'rwy-card__vector';
    svgEl.innerHTML = buildWindSVG(bestEntry);

    card.appendChild(infoEl);
    card.appendChild(endsEl);
    card.appendChild(svgEl);
    return card;
  }

  // Top-down runway schematic with wind arrow + wind sock.
  // Runway always drawn vertically; base end at bottom, recip at top.
  // Wind arrow: from source toward runway centre. Wind sock: opposite side, streaming downwind.
  function buildWindSVG(entry) {
    const hw  = entry.headwind_kt ?? 0;
    const xw  = entry.xwind_kt    ?? 0;
    const spd = Math.sqrt(hw * hw + xw * xw);

    const W = 80, H = 88;
    const cx = W / 2, cy = H / 2;   // 40, 44
    const R  = 30;

    const nx = spd > 0 ? xw / spd : 0;
    const ny = spd > 0 ? hw / spd : 0;
    const tx = cx + R * nx;
    const ty = cy - R * ny;
    const tipR = 6;
    const ax   = cx + tipR * nx;
    const ay   = cy - tipR * ny;

    const headLen = 8, headW = 5;
    const dx = ax - tx, dy = ay - ty;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const ux = dx / len, uy = dy / len;
    const p1x = ax - headLen * ux + headW * uy, p1y = ay - headLen * uy - headW * ux;
    const p2x = ax - headLen * ux - headW * uy, p2y = ay - headLen * uy + headW * ux;

    const color = entry.xwind_ok ? '#1f5fa8' : '#b3261e';
    const baseId  = entry.endId;
    const recipId = Object.keys(entry.runway.ends).find(id => id !== baseId) ?? '';

    // Wind sock: on the downwind side (opposite of arrow tail), streaming downwind.
    // Clamp away from runway strip (cx ± 4) by nudging laterally if too central.
    const sockAngle = Math.atan2(ay - ty, ax - tx) * 180 / Math.PI;
    const sockR = 24;
    let sockX = Math.max(10, Math.min(W - 10, cx - sockR * nx));
    let sockY = Math.max(16, Math.min(H - 16, cy + sockR * ny));
    if (Math.abs(sockX - cx) < 14) sockX = nx >= 0 ? cx - 18 : cx + 18;
    const f = n => n.toFixed(1);
    const hasDirection = entry.headwind_kt !== null && spd > 0;
    const sockSvg = hasDirection ? buildWindSock(sockX, sockY, sockAngle) : '';
    const arrowSvg = hasDirection
      ? `<line x1="${f(tx)}" y1="${f(ty)}" x2="${f(ax - headLen * ux)}" y2="${f(ay - headLen * uy)}" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
         <polygon points="${f(ax)},${f(ay)} ${f(p1x)},${f(p1y)} ${f(p2x)},${f(p2y)}" fill="${color}"/>`
      : '';
    return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true">
      <rect x="${cx - 4}" y="12" width="8" height="${H - 24}" rx="1" fill="#c8c8c8"/>
      <rect x="${cx - 4}" y="12" width="8" height="4" fill="#666"/>
      <rect x="${cx - 4}" y="${H - 16}" width="8" height="4" fill="#666"/>
      <text x="${cx}" y="10" text-anchor="middle" font-size="8" font-weight="700" fill="#555">${recipId}</text>
      <text x="${cx}" y="${H - 2}" text-anchor="middle" font-size="8" font-weight="700" fill="#555">${baseId}</text>
      ${sockSvg}${arrowSvg}
    </svg>`;
  }

  function buildWindSock(px, py, angleDeg) {
    const L = 15, r0 = 5, r1 = 1.2, gap = 4;
    const f = n => n.toFixed(1);
    const bands = [];
    for (let i = 0; i < 3; i++) {
      const x0 = gap + L * i / 3, x1 = gap + L * (i + 1) / 3;
      const h0 = r0 - (r0 - r1) * i / 3;
      const h1 = r0 - (r0 - r1) * (i + 1) / 3;
      const fill = i % 2 === 0 ? '#FF6600' : '#ffffff';
      bands.push(`<path d="M${f(x0)},${f(-h0)} L${f(x1)},${f(-h1)} L${f(x1)},${f(h1)} L${f(x0)},${f(h0)} Z" fill="${fill}"/>`);
    }
    const sockEnd = gap + L;
    const outline = `<path d="M${f(gap)},${f(-r0)} L${f(sockEnd)},${f(-r1)} L${f(sockEnd)},${f(r1)} L${f(gap)},${f(r0)}" fill="none" stroke="#000" stroke-width="0.7" stroke-linejoin="round" stroke-linecap="round"/>`;
    const pole = `<circle cx="0" cy="0" r="1" fill="#000"/>`
      + `<line x1="0" y1="0" x2="${f(gap)}" y2="${f(-r0)}" stroke="#000" stroke-width="1" stroke-linecap="round"/>`
      + `<line x1="0" y1="0" x2="${f(gap)}" y2="${f(r0)}" stroke="#000" stroke-width="1" stroke-linecap="round"/>`;
    return `<g transform="translate(${f(px)},${f(py)}) rotate(${f(angleDeg)})">`
      + pole + bands.join('') + outline + `</g>`;
  }

  // ── Distance results ──────────────────────────────────────────────────────

  function renderDistances() {
    if (!selected || !metar || !airport) return;

    let result;
    try {
      result = calcPerformance({
        grossLb:   getGrossLb(),
        landingLb: getLandingLb(),
        airport,
        runway:    selected.runway,
        endId:     selected.endId,
        metar,
      });
    } catch {
      perfResult = null;
      distancesEl.hidden = true;
      return;
    }

    perfResult = result;
    onResultChange?.();
    distancesEl.hidden = false;

    function distVal(m, ok) {
      const cls = ok ? 'perf-dist-val' : 'perf-dist-val perf-dist-val--warn';
      return `<span class="${cls}">${fmtFt(m / 0.3048)} <span class="perf-dist-ft">(${fmtM(m)})</span></span>`;
    }

    $('perf-to-gr').innerHTML  = distVal(result.takeoff.gr,      true);
    $('perf-to-50').innerHTML  = distVal(result.takeoff.to50ft,  result.takeoff.tora_ok);
    $('perf-ldg-gr').innerHTML = distVal(result.landing.gr,      true);
    $('perf-ldg-50').innerHTML = distVal(result.landing.to50ft,  result.landing.lda_ok);

    $('perf-acstop-card').classList.toggle('perf-accel-card--warn', !result.accel_stop.ok);
    $('perf-acstop').innerHTML = `${fmtFt(result.accel_stop.dist_m / 0.3048)} <span class="perf-dist-ft">(${fmtM(result.accel_stop.dist_m)})</span>`;
    $('perf-acgo').innerHTML   = result.accel_go.dist_m !== null
      ? `${fmtFt(result.accel_go.dist_m / 0.3048)} <span class="perf-dist-ft">(${fmtM(result.accel_go.dist_m)})</span>`
      : '<span class="perf-oei-warn">N/A</span>';

  }

  return {
    refresh:    () => { if (selected && metar) renderDistances(); },
    getMetar:   () => metar,
    getResult:  () => perfResult,
  };
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function setStatus(el, text, type = '') {
  el.textContent = text;
  el.className   = `perf-status${type ? ` perf-status--${type}` : ''}`;
}
