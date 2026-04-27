// Departure performance calculations for the Tecnam P2006T.
// All POH tables use metric (metres, kg). Weight input accepted in lbs.

import { P2006T }                                          from './data/p2006t.js';
import { headwindComponent, crosswindComponent,
         pressureAlt as calcPA, densityAlt as calcDA }     from './metar.js';
import { lbToKg }                                          from './units.js';

export const XWIND_LIMIT_KT    = 17;     // POH §2 demonstrated crosswind
const ACCEL_STOP_MARGIN        = 1.30;   // 30 % buffer applied to accel-stop

// ---------------------------------------------------------------------------
// Runway selection
// ---------------------------------------------------------------------------

// Returns runways ranked best-first for the given wind.
// Each element: { runway, endId, end, headwind_kt, xwind_kt, xwind_ok }
export function rankRunways(runways, windDir_deg, windSpeed_kt) {
  if (windDir_deg === null || windSpeed_kt === null) return [];

  const results = [];
  for (const runway of runways) {
    for (const [endId, end] of Object.entries(runway.ends)) {
      if (end.hdg_mag === null) continue;
      const hw = headwindComponent(windDir_deg, windSpeed_kt, end.hdg_mag);
      const xw = crosswindComponent(windDir_deg, windSpeed_kt, end.hdg_mag);
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

// Interpolate a { gr, to50ft } result from one PA row at a given OAT.
function interpTemp(row, oat_c) {
  const t = clamp(oat_c, TEMP_COLS[0], TEMP_COLS[TEMP_COLS.length - 1]);
  let lo = TEMP_COLS[0], hi = TEMP_COLS[TEMP_COLS.length - 1];
  for (let i = 0; i < TEMP_COLS.length - 1; i++) {
    if (t >= TEMP_COLS[i] && t <= TEMP_COLS[i + 1]) { lo = TEMP_COLS[i]; hi = TEMP_COLS[i + 1]; break; }
  }
  if (lo === hi) {
    const idx = TEMP_COLS.indexOf(lo);
    return { gr: row.gr[idx], to50ft: row.to50ft[idx] };
  }
  const f  = (t - lo) / (hi - lo);
  const il = TEMP_COLS.indexOf(lo);
  const ih = TEMP_COLS.indexOf(hi);
  return { gr: lerp(row.gr[il], row.gr[ih], f), to50ft: lerp(row.to50ft[il], row.to50ft[ih], f) };
}

// Interpolate across PA brackets at a given OAT.
function interpPA(wtTable, pa_ft, oat_c) {
  const pas    = Object.keys(wtTable).map(Number).sort((a, b) => a - b);
  const paLo   = pas.reduce((a, b) => pa_ft >= b ? b : a, pas[0]);
  const paHi   = pas.reduce((a, b) => pa_ft <= b ? b : a, pas[pas.length - 1]);
  const lo     = interpTemp(wtTable[paLo], oat_c);
  if (paLo === paHi) return lo;
  const hi = interpTemp(wtTable[paHi], oat_c);
  const f  = (pa_ft - paLo) / (paHi - paLo);
  return { gr: lerp(lo.gr, hi.gr, f), to50ft: lerp(lo.to50ft, hi.to50ft, f) };
}

// Full bilinear interpolation: weight × PA × temp.
// Returns { gr, to50ft } in metres (unrounded floats for chaining corrections).
function interpolatePerf(tableData, weight_kg, pa_ft, oat_c) {
  const wts  = WEIGHT_KEYS.filter(w => tableData[w]);
  const wLo  = wts.reduce((a, b) => weight_kg >= b ? b : a, wts[0]);
  const wHi  = wts.reduce((a, b) => weight_kg <= b ? b : a, wts[wts.length - 1]);
  const lo   = interpPA(tableData[wLo], pa_ft, oat_c);
  if (wLo === wHi) return lo;
  const hi = interpPA(tableData[wHi], pa_ft, oat_c);
  const f  = (weight_kg - wLo) / (wHi - wLo);
  return { gr: lerp(lo.gr, hi.gr, f), to50ft: lerp(lo.to50ft, hi.to50ft, f) };
}

// ---------------------------------------------------------------------------
// Climb rate interpolation — rates: [oat_n25, oat_0, oat_25, oat_50, isa]
// ---------------------------------------------------------------------------

function interpClimbRow(row, oat_c) {
  const t  = clamp(oat_c, TEMP_COLS[0], TEMP_COLS[TEMP_COLS.length - 1]);
  let lo = TEMP_COLS[0], hi = TEMP_COLS[TEMP_COLS.length - 1];
  for (let i = 0; i < TEMP_COLS.length - 1; i++) {
    if (t >= TEMP_COLS[i] && t <= TEMP_COLS[i + 1]) { lo = TEMP_COLS[i]; hi = TEMP_COLS[i + 1]; break; }
  }
  const il = TEMP_COLS.indexOf(lo), ih = TEMP_COLS.indexOf(hi);
  if (il === ih) return row.rates[il];
  return lerp(row.rates[il], row.rates[ih], (t - lo) / (hi - lo));
}

function interpClimbPA(wtTable, pa_ft, oat_c) {
  const pas  = Object.keys(wtTable).map(Number).sort((a, b) => a - b);
  const paLo = pas.reduce((a, b) => pa_ft >= b ? b : a, pas[0]);
  const paHi = pas.reduce((a, b) => pa_ft <= b ? b : a, pas[pas.length - 1]);
  const lo   = interpClimbRow(wtTable[paLo], oat_c);
  if (paLo === paHi) return lo;
  return lerp(lo, interpClimbRow(wtTable[paHi], oat_c), (pa_ft - paLo) / (paHi - paLo));
}

function interpolateClimb(tableData, weight_kg, pa_ft, oat_c) {
  const wts = WEIGHT_KEYS.filter(w => tableData[w]);
  const wLo = wts.reduce((a, b) => weight_kg >= b ? b : a, wts[0]);
  const wHi = wts.reduce((a, b) => weight_kg <= b ? b : a, wts[wts.length - 1]);
  const lo  = interpClimbPA(tableData[wLo], pa_ft, oat_c);
  if (wLo === wHi) return Math.round(lo);
  return Math.round(lerp(lo, interpClimbPA(tableData[wHi], pa_ft, oat_c), (weight_kg - wLo) / (wHi - wLo)));
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
  const weight_kg     = lbToKg(grossLb);
  const ldgWeight_kg  = lbToKg(landingLb ?? grossLb);
  const end         = runway.ends[endId];
  const elev_ft     = airport.elev_ft ?? 0;
  const altimeter   = metar.altimeter_inhg ?? 29.92;
  const oat_c       = metar.oat_c ?? 15;
  const pa_ft       = calcPA(elev_ft, altimeter);
  const da_ft       = calcDA(pa_ft, oat_c);

  const windDir     = metar.wind_dir_deg;
  const windSpeed   = metar.wind_speed_kt ?? 0;
  const hdg         = end.hdg_mag;
  const headwind_kt = hdg !== null ? headwindComponent(windDir, windSpeed, hdg) : 0;
  const xwind_kt    = hdg !== null ? crosswindComponent(windDir, windSpeed, hdg) : 0;

  const surface     = runway.surface;
  const slope_pct   = end.slope_pct;
  const tora_ft     = end.tora_ft ?? runway.length_ft;
  const lda_ft      = end.lda_ft  ?? runway.length_ft;

  // Takeoff
  const toRaw  = interpolatePerf(P2006T.takeoff.data,  weight_kg, pa_ft, oat_c);
  const toCorr = applyCorrections(toRaw,  P2006T.takeoff.corrections,  headwind_kt, surface, slope_pct);

  // Landing — uses zero-fuel weight (conservative landing weight after fuel burn)
  const ldgRaw  = interpolatePerf(P2006T.landing.data,  ldgWeight_kg, pa_ft, oat_c);
  const ldgCorr = applyCorrections(ldgRaw, P2006T.landing.corrections, headwind_kt, surface, slope_pct);

  // Accel-stop: (T/O ground roll + landing ground roll) × margin
  const accelStop_m = Math.round((toCorr.gr + ldgCorr.gr) * ACCEL_STOP_MARGIN);

  // Climb rates (ft/min)
  const roc_fpm     = interpolateClimb(P2006T.climb.to_vy.data,    weight_kg, pa_ft, oat_c);
  const roc_oei_fpm = interpolateClimb(P2006T.climb.oei_vyse.data, weight_kg, pa_ft, oat_c);

  // Accel-go: takeoff ground roll + OEI climb to 50 ft obstacle
  // OEI climb distance = (50 ft / ROC_OEI) × groundspeed at VYSE
  const vyse_kt     = P2006T.speeds_kias.vyse;
  const oeiGs_kt    = Math.max(1, vyse_kt - headwind_kt);
  const oeiClimb_m  = (50 / roc_oei_fpm) * (oeiGs_kt * 30.867); // 30.867 m/min per kt
  const accelGo_m   = roc_oei_fpm >= 25 ? Math.round(toCorr.gr + oeiClimb_m) : null;

  // TORA/LDA fit checks
  const toraOk   = toCorr.to50ft <= (tora_ft * 0.3048);
  const ldaOk    = ldgCorr.to50ft <= (lda_ft  * 0.3048);
  const acStopOk = accelStop_m    <= (tora_ft * 0.3048);

  return {
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
    accel_go:    { dist_m: accelGo_m },
    roc_fpm,
    roc_oei_fpm,
  };
}
