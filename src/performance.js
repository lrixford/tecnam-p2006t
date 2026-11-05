// Departure performance calculations for the Tecnam P2006T.
// All POH tables use metric (metres, kg). Weight input accepted in lbs.

import { P2006T }                                          from './data/p2006t.js';
import { headwindComponent, crosswindComponent, componentWind_kt,
         pressureAlt as calcPA, densityAlt as calcDA }     from './metar.js';
import { lbToKg }                                          from './units.js';

export const XWIND_LIMIT_KT    = 17;     // POH §2 demonstrated crosswind
const ACCEL_STOP_MARGIN        = 1.30;   // allows for a delayed decision
const MIN_OEI_ROC_FPM          = 50;     // below this, no accel-go distance is given
const CAUTION_OEI_ROC_FPM      = 100;    // up to and including this, accel-go shows a caution

// ---------------------------------------------------------------------------
// Runway selection
// ---------------------------------------------------------------------------

// METAR winds are true
function windHdg(end) {
  return end.hdg_true ?? end.hdg_mag ?? null;
}

// Returns runways ranked best-first for the given wind.
// Each element: { runway, endId, end, headwind_kt, xwind_kt, xwind_ok }
export function rankRunways(runways, windDir_deg, windSpeed_kt) {
  if (windDir_deg === null || windSpeed_kt === null) return [];

  const results = [];
  for (const runway of runways) {
    for (const [endId, end] of Object.entries(runway.ends)) {
      const hdg = windHdg(end);
      if (hdg === null) continue;
      const hw = headwindComponent(windDir_deg, windSpeed_kt, hdg);
      const xw = crosswindComponent(windDir_deg, windSpeed_kt, hdg);
      results.push({ runway, endId, end, headwind_kt: hw, xwind_kt: xw,
                     xwind_ok: Math.abs(xw) <= XWIND_LIMIT_KT });
    }
  }

  results.sort((a, b) => {
    if (a.xwind_ok !== b.xwind_ok) return a.xwind_ok ? -1 : 1;
    return b.headwind_kt - a.headwind_kt;
  });

  return results;
}

// ---------------------------------------------------------------------------
// POH table interpolation
// ---------------------------------------------------------------------------

const WEIGHT_KEYS  = [930, 1080, 1230];   // kg, ascending
const TEMP_COLS    = [-25, 0, 25, 50];    // index 0-3; index 4 is ISA (not used for interp)

function lerp(a, b, t) { return a + (b - a) * t; }

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// Table keys either side of v, clamped to the table
function bracket(keys, v) {
  const x = clamp(v, keys[0], keys[keys.length - 1]);
  const i = keys.findIndex(k => k >= x);
  if (keys[i] === x) return { lo: x, hi: x, f: 0 };
  const lo = keys[i - 1], hi = keys[i];
  return { lo, hi, f: (x - lo) / (hi - lo) };
}

// Weight × PA × temp. `columns` picks the temperature array from a row.
function interpolate(table, weight_kg, pa_ft, oat_c, columns) {
  const atTemp = row => {
    const { lo, hi, f } = bracket(TEMP_COLS, oat_c);
    const cols = columns(row);
    return lerp(cols[TEMP_COLS.indexOf(lo)], cols[TEMP_COLS.indexOf(hi)], f);
  };
  const atPA = wtTable => {
    const pas = Object.keys(wtTable).map(Number).sort((a, b) => a - b);
    const { lo, hi, f } = bracket(pas, pa_ft);
    return lerp(atTemp(wtTable[lo]), atTemp(wtTable[hi]), f);
  };
  const { lo, hi, f } = bracket(WEIGHT_KEYS.filter(w => table[w]), weight_kg);
  return lerp(atPA(table[lo]), atPA(table[hi]), f);
}

// { gr, to50ft } in metres, unrounded
function interpolatePerf(table, weight_kg, pa_ft, oat_c) {
  return {
    gr:     interpolate(table, weight_kg, pa_ft, oat_c, row => row.gr),
    to50ft: interpolate(table, weight_kg, pa_ft, oat_c, row => row.to50ft),
  };
}

// ft/min
function interpolateClimb(table, weight_kg, pa_ft, oat_c) {
  return Math.round(interpolate(table, weight_kg, pa_ft, oat_c, row => row.rates));
}

// ---------------------------------------------------------------------------
// POH corrections
// ---------------------------------------------------------------------------

// Apply POH corrections to raw { gr, to50ft } distances (metres).
// headwind_kt: positive = headwind, negative = tailwind
// surface: 'paved' | 'turf' | 'gravel' | 'dirt'
// slope_pct: positive = upslope in departure direction
function applyCorrections(raw, corr, headwind_kt, surface, slope_pct) {
  let { gr, to50ft } = raw;

  // Wind — applied to ground roll only; to50ft shares the same delta
  if (headwind_kt > 0) {
    const d = corr.headwind_m_per_kt * headwind_kt;
    gr += d; to50ft += d;
  } else if (headwind_kt < 0) {
    const d = corr.tailwind_m_per_kt * Math.abs(headwind_kt);
    gr += d; to50ft += d;
  }

  // Surface — percentage adjustment to ground roll portion
  if (surface === 'paved') {
    const d = gr * (corr.paved_gr_pct / 100);
    gr += d; to50ft += d;
  }

  // Slope — percentage per 1 % upslope, ground roll only
  if (slope_pct !== null && slope_pct !== undefined) {
    const d = gr * (corr.slope_gr_pct_per_upslope / 100) * slope_pct;
    gr += d; to50ft += d;
  }

  return { gr: Math.round(gr), to50ft: Math.round(to50ft) };
}

// ---------------------------------------------------------------------------
// Main calculation
// ---------------------------------------------------------------------------

// Compute all departure performance figures.
//
// Parameters:
//   grossLb     — aircraft gross weight in lbs (from W&B state)
//   airport     — Airport object from airports.json (must include elev_ft)
//   runway      — Runway object
//   endId       — selected end ID string (e.g. "27", "N")
//   metar       — parsed METAR object from parseMETAR()
//
// Returns an object with all computed values, or throws if data is missing.
export function calcPerformance({ grossLb, landingLb, airport, runway, endId, metar }) {
  const altimeter   = metar.altimeter_inhg;
  const oat_c       = metar.oat_c;
  if (altimeter === null || oat_c === null) {
    throw new Error('METAR has no temperature or altimeter setting');
  }

  const weight_kg     = lbToKg(grossLb);
  const ldgWeight_kg  = lbToKg(landingLb ?? grossLb);
  const end         = runway.ends[endId];
  const elev_ft     = airport.elev_ft ?? 0;
  const pa_ft       = calcPA(elev_ft, altimeter);
  const da_ft       = calcDA(pa_ft, oat_c);

  const windDir     = metar.wind_dir_deg;
  const windSpeed   = metar.wind_speed_kt ?? 0;
  const hdg         = windHdg(end);
  // Steady wind, so distances take no credit for gusts
  const headwind_kt = hdg !== null ? headwindComponent(windDir, windSpeed, hdg) : 0;
  const xwind_kt    = hdg !== null ? crosswindComponent(windDir, componentWind_kt(metar) ?? 0, hdg) : null;

  const surface     = runway.surface;
  const slope_pct   = end.slope_pct;
  const tora_ft     = end.tora_ft ?? runway.length_ft;
  const lda_ft      = end.lda_ft  ?? runway.length_ft;

  // Takeoff
  const toRaw  = interpolatePerf(P2006T.takeoff.data,  weight_kg, pa_ft, oat_c);
  const toCorr = applyCorrections(toRaw,  P2006T.takeoff.corrections,  headwind_kt, surface, slope_pct);

  // Landing
  const ldgRaw  = interpolatePerf(P2006T.landing.data,  ldgWeight_kg, pa_ft, oat_c);
  const ldgCorr = applyCorrections(ldgRaw, P2006T.landing.corrections, headwind_kt, surface, slope_pct);

  // Accel-stop: training rule of thumb, not a POH figure
  const accelStop_m = Math.round((toCorr.gr + ldgCorr.gr) * ACCEL_STOP_MARGIN);

  // Climb rates (ft/min)
  const roc_fpm     = interpolateClimb(P2006T.climb.to_vy.data,    weight_kg, pa_ft, oat_c);
  const roc_oei_fpm = interpolateClimb(P2006T.climb.oei_vyse.data, weight_kg, pa_ft, oat_c);

  // Accel-go: takeoff ground roll + OEI climb to 50 ft obstacle
  // OEI climb distance = (50 ft / ROC_OEI) × groundspeed at VYSE
  const vyse_kt     = P2006T.speeds_kias.vyse;
  const oeiGs_kt    = Math.max(1, vyse_kt - headwind_kt);
  const oeiClimb_m  = (50 / roc_oei_fpm) * (oeiGs_kt * 30.867); // 30.867 m/min per kt
  const canAccelGo  = roc_oei_fpm >= MIN_OEI_ROC_FPM;
  const accelGo_m   = canAccelGo ? Math.round(toCorr.gr + oeiClimb_m) : null;
  const accelGoLevel = !canAccelGo ? 'warning'
    : roc_oei_fpm <= CAUTION_OEI_ROC_FPM ? 'caution'
    : null;
  const accelGoMessage = accelGoLevel === null ? null
    : `Predicted single-engine climb rate is ${roc_oei_fpm} fpm.`;

  // TORA/LDA fit checks
  const toraOk   = toCorr.to50ft <= (tora_ft * 0.3048);
  const ldaOk    = ldgCorr.to50ft <= (lda_ft  * 0.3048);
  const acStopOk = accelStop_m    <= (tora_ft * 0.3048);

  return {
    end_id:      endId,
    weight_kg:   Math.round(weight_kg),
    pa_ft,
    da_ft,
    oat_c,
    headwind_kt,
    xwind_kt,
    xwind_ok:    Math.abs(xwind_kt) <= XWIND_LIMIT_KT,
    surface,
    slope_pct,
    tora_ft,
    lda_ft,
    takeoff:     { ...toCorr, tora_ok: toraOk },
    landing:     { ...ldgCorr, lda_ok: ldaOk },
    accel_stop:  { dist_m: accelStop_m, ok: acStopOk },
    accel_go:    { dist_m: accelGo_m, level: accelGoLevel, message: accelGoMessage },
    roc_fpm,
    roc_oei_fpm,
  };
}
