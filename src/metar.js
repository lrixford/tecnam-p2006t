// METAR parser — extracts fields relevant to performance calculations.
// Returns null for any field that is absent or unparseable.

export function parseMETAR(raw) {
  const tokens = raw.trim().toUpperCase().split(/\s+/);
  let i = 0;

  const result = {
    raw,
    station:          null,
    auto:             false,
    cor:              false,
    time_z:           null,
    wind_dir_deg:     null,   // null = calm or variable
    wind_speed_kt:    null,
    wind_gust_kt:     null,
    wind_variable:    false,  // VRB
    wind_var_from_deg: null,  // e.g. 240V300 sector
    wind_var_to_deg:   null,
    visibility_sm:    null,
    sky:              [],     // [{ coverage, alt_ft, cb }]
    oat_c:            null,
    dp_c:             null,
    altimeter_inhg:   null,
    altimeter_hpa:    null,
    remarks:          null,
  };

  // Optional type prefix
  if (tokens[i] === 'METAR' || tokens[i] === 'SPECI') i++;

  // COR may appear before or after station
  if (tokens[i] === 'COR') { result.cor = true; i++; }

  // Station ID — 4-letter ICAO
  if (/^[A-Z]{4}$/.test(tokens[i])) result.station = tokens[i++];

  // Observation time: DDHHmmZ
  if (/^\d{6}Z$/.test(tokens[i])) result.time_z = tokens[i++];

  // AUTO / COR (second position)
  if (tokens[i] === 'AUTO') { result.auto = true; i++; }
  if (tokens[i] === 'COR')  { result.cor  = true; i++; }

  // Wind: dddssKT  dddssGggKT  VRBssKT  00000KT
  const windRe = /^(VRB|\d{3})(\d{2,3})(G(\d{2,3}))?(KT|MPS)$/;
  const wm = tokens[i]?.match(windRe);
  if (wm) {
    const toKt = wm[5] === 'MPS' ? 1.94384 : 1;
    result.wind_speed_kt = Math.round(parseFloat(wm[2]) * toKt);
    if (wm[1] === 'VRB') {
      result.wind_variable = true;
    } else {
      result.wind_dir_deg = parseInt(wm[1], 10);
    }
    if (wm[4]) result.wind_gust_kt = Math.round(parseFloat(wm[4]) * toKt);
    i++;

    // Variable sector: dddVddd
    const vm = tokens[i]?.match(/^(\d{3})V(\d{3})$/);
    if (vm) {
      result.wind_var_from_deg = parseInt(vm[1], 10);
      result.wind_var_to_deg   = parseInt(vm[2], 10);
      i++;
    }
  }

  // Visibility — handles: "10SM", "1/2SM", "M1/4SM", "1 1/2SM" (two tokens), "9999" (metres)
  if (tokens[i]) {
    // Two-token fraction: whole-number + fraction+SM  e.g. "1" "1/2SM"
    if (/^\d+$/.test(tokens[i]) && tokens[i + 1]?.endsWith('SM')) {
      const whole = parseInt(tokens[i], 10);
      const fracStr = tokens[i + 1].replace('SM', '');
      result.visibility_sm = whole + parseFraction(fracStr);
      i += 2;
    } else if (tokens[i].endsWith('SM')) {
      const s = tokens[i].replace('SM', '').replace(/^M/, ''); // M = "less than"
      result.visibility_sm = parseFraction(s);
      i++;
    } else if (/^\d{4}$/.test(tokens[i])) {
      // Metric metres (international)
      result.visibility_sm = parseInt(tokens[i], 10) / 1609.34;
      i++;
    }
  }

  // Skip RVR, present weather, and anything else until visibility / sky / temp / altimeter
  while (i < tokens.length) {
    const t = tokens[i];
    if (/^(FEW|SCT|BKN|OVC|VV)\d{3}/.test(t)) break;
    if (t === 'SKC' || t === 'CLR' || t === 'CAVOK') break;
    if (/^M?\d{2}\/M?\d{2}$/.test(t)) break;
    if (/^[AQ]\d{4}$/.test(t)) break;
    if (t === 'RMK') break;
    // Visibility not yet captured — try again from here
    if (result.visibility_sm === null) {
      if (/^\d+$/.test(t) && tokens[i + 1]?.endsWith('SM')) {
        const whole = parseInt(t, 10);
        result.visibility_sm = whole + parseFraction(tokens[i + 1].replace('SM', ''));
        i += 2; continue;
      }
      if (t.endsWith('SM')) {
        result.visibility_sm = parseFraction(t.replace('SM', '').replace(/^M/, ''));
        i++; continue;
      }
      if (/^\d{4}$/.test(t)) {
        result.visibility_sm = parseInt(t, 10) / 1609.34;
        i++; continue;
      }
    }
    i++;
  }

  // CAVOK shorthand: visibility ≥ 10 km, no cloud below 5000 ft, no significant wx
  if (tokens[i] === 'CAVOK') {
    result.visibility_sm = result.visibility_sm ?? 6.21; // ≥ 10 km
    result.sky.push({ coverage: 'CLR', alt_ft: null, cb: false });
    i++;
  }

  // Sky condition layers
  while (i < tokens.length) {
    const t = tokens[i];
    if (t === 'SKC' || t === 'CLR') {
      result.sky.push({ coverage: t, alt_ft: null, cb: false });
      i++;
      continue;
    }
    const sm = t.match(/^(FEW|SCT|BKN|OVC|VV)(\d{3})(CB|TCU)?$/);
    if (sm) {
      result.sky.push({
        coverage: sm[1],
        alt_ft:   parseInt(sm[2], 10) * 100,
        cb:       sm[3] === 'CB',
      });
      i++;
      continue;
    }
    break;
  }

  // Temperature / dew point: TT/DD, M-prefix for negative values
  const tm = tokens[i]?.match(/^(M?\d{2})\/(M?\d{2})$/);
  if (tm) {
    result.oat_c = parseTempToken(tm[1]);
    result.dp_c  = parseTempToken(tm[2]);
    i++;
  }

  // Altimeter: A2992 (in Hg ×100) or Q1013 (hPa)
  const am = tokens[i]?.match(/^(A|Q)(\d{4})$/);
  if (am) {
    if (am[1] === 'A') {
      result.altimeter_inhg = parseInt(am[2], 10) / 100;
    } else {
      result.altimeter_hpa  = parseInt(am[2], 10);
      result.altimeter_inhg = result.altimeter_hpa / 33.8639;
    }
    i++;
  }

  // Remarks
  if (tokens[i] === 'RMK') result.remarks = tokens.slice(i + 1).join(' ');

  return result;
}

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

const METAR_API    = 'https://aviationweather.gov/api/data/metar';
const CORS_PROXY   = 'https://corsproxy.io/?';
const METAR_TTL_MS = 15 * 60 * 1000;

const _cache = new Map();  // id → { ts, data }

// Fetch and parse the latest METAR for a station ID via corsproxy.io.
// Results are cached for 15 minutes. Returns null if the station has no report.
export async function fetchMETAR(stationId) {
  const raw = stationId.trim().toUpperCase();
  // 3-char FAA IDs need K prefix for the aviationweather.gov API
  const id = raw.length === 3 ? `K${raw}` : raw;
  const hit = _cache.get(id);
  if (hit && Date.now() - hit.ts < METAR_TTL_MS) return hit.data;

  const src = `${METAR_API}?ids=${encodeURIComponent(id)}&format=json`;
  const res = await fetch(`${CORS_PROXY}${encodeURIComponent(src)}`);
  if (!res.ok) throw new Error(`METAR fetch failed: ${res.status} ${res.statusText}`);
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) { _cache.delete(id); return null; }
  const parsed = parseMETAR(data[0].rawOb);
  _cache.set(id, { ts: Date.now(), data: parsed });
  return parsed;
}

// ---------------------------------------------------------------------------
// Derived values
// ---------------------------------------------------------------------------

// Pressure altitude in feet.
// Standard: PA = field_elev + (29.92 - altimeter_inhg) × 1000
export function pressureAlt(fieldElev_ft, altimeter_inhg) {
  return Math.round(fieldElev_ft + (29.92 - altimeter_inhg) * 1000);
}

// Density altitude in feet (ISA approximation).
export function densityAlt(pressureAlt_ft, oat_c) {
  const isaTemp_c = 15 - pressureAlt_ft * (1.98 / 1000);
  return Math.round(pressureAlt_ft + 118.8 * (oat_c - isaTemp_c));
}

// Headwind component relative to a runway heading (positive = headwind).
export function headwindComponent(windDir_deg, windSpeed_kt, runwayHdg_deg) {
  if (windDir_deg === null || windSpeed_kt === null) return null;
  const rad = ((windDir_deg - runwayHdg_deg) * Math.PI) / 180;
  return Math.round(windSpeed_kt * Math.cos(rad));
}

// Crosswind component (positive = from the right).
export function crosswindComponent(windDir_deg, windSpeed_kt, runwayHdg_deg) {
  if (windDir_deg === null || windSpeed_kt === null) return null;
  const rad = ((windDir_deg - runwayHdg_deg) * Math.PI) / 180;
  return Math.round(windSpeed_kt * Math.sin(rad));
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function parseTempToken(s) {
  return s.startsWith('M') ? -parseInt(s.slice(1), 10) : parseInt(s, 10);
}

function parseFraction(s) {
  if (s.includes('/')) {
    const [n, d] = s.split('/').map(Number);
    return d ? n / d : 0;
  }
  return parseFloat(s) || 0;
}
