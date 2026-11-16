import { P2006T } from './data/p2006t.js';
import { computeAll } from './loadingCondition.js';
import { lbToKg, galToL, formatNumber } from './units.js';

const DENSITY = P2006T.fuel.density_lb_per_gal;
const LB_FT_PER_KG_M = 7.23301;

function fuelRow(label, gal, cls = '') {
  const lb = gal * DENSITY;
  return `<tr class="${cls}">
    <td>${label}</td>
    <td>${formatNumber(gal, 1)}</td>
    <td>${formatNumber(galToL(gal), 1)}</td>
    <td>${formatNumber(lb, 1)}</td>
    <td>${formatNumber(lbToKg(lb), 1)}</td>
  </tr>`;
}

function condRow(label, cond, cls) {
  const warn = cond.inEnvelope ? '' : ' dt-warn';
  return `<tr class="dt-cond--${cls}${warn}">
    <td>${label}</td>
    <td>${formatNumber(cond.weight_lb, 0)}</td>
    <td>${formatNumber(lbToKg(cond.weight_lb), 0)}</td>
    <td>${formatNumber(cond.cg_pct_mac, 1)}%</td>
    <td class="dt-status">${cond.inEnvelope ? '✓' : '✗'}</td>
  </tr>`;
}

export function renderConditionTable(target, state) {
  const conds = computeAll(state);
  const section = document.createElement('section');
  section.className = 'data-table';
  section.innerHTML = `
    <table class="dt-table">
      <thead><tr>
        <th></th>
        <th>lb</th><th>kg</th>
        <th>lb·ft</th><th>kg·m</th>
        <th>CG ft</th><th>% MAC</th>
        <th></th>
      </tr></thead>
      <tbody>
        ${condRow('Ramp',      conds.ramp,     'ramp')}
        ${condRow('Takeoff',   conds.takeoff,  'to'  )}
        ${condRow('Landing',   conds.landing,  'ldg' )}
        ${condRow('Zero Fuel', conds.zeroFuel, 'zfw' )}
      </tbody>
    </table>
  `;
  target.replaceChildren(section);
}

export function renderFuelTable(target, state) {
  const totalGal   = state.fuelL.volume_gal + state.fuelR.volume_gal;
  const taxiGal    = state.fuelTaxi?.volume_gal    ?? 0;
  const burnoffGal = state.fuelBurnoff?.volume_gal ?? 0;
  const takeoffGal = Math.max(0, totalGal - taxiGal);

  const section = document.createElement('section');
  section.className = 'data-table';
  section.innerHTML = `
    <h2 class="dt-heading">Fuel</h2>
    <table class="dt-table">
      <thead><tr>
        <th></th>
        <th>gal</th><th>L</th>
        <th>lb</th><th>kg</th>
      </tr></thead>
      <tbody>
        ${fuelRow('Left',         state.fuelL.volume_gal)}
        ${fuelRow('Right',        state.fuelR.volume_gal)}
        ${fuelRow('Total',        totalGal,   'dt-subtotal')}
        ${fuelRow('Taxi',         taxiGal)}
        ${fuelRow('Planned burn', burnoffGal)}
        ${fuelRow('Takeoff fuel', takeoffGal, 'dt-subtotal')}
      </tbody>
    </table>
  `;
  target.replaceChildren(section);
}

function fmtFtM(m)   { return `${Math.round(m / 0.3048).toLocaleString()} ft (${Math.round(m)} m)`; }
function fmtFpmM(fpm){ return `${fpm.toLocaleString()} fpm (${Math.round(fpm * 0.3048)} m/min)`; }

function runwayLine(perf) {
  if (!perf) return '';
  const xwind = perf.xwind_kt !== null ? ` · Crosswind ${Math.abs(perf.xwind_kt)} kt` : '';
  return `<span class="print-summary__rwy${perf.xwind_ok ? '' : ' dt-oei-warn'}">Rwy ${perf.end_id}${xwind}</span>`;
}

function perfTable(perf) {
  return `<table class="dt-table">
          <thead><tr><th>Performance</th><th>GR / Dist</th><th>50 ft / OEI</th></tr></thead>
          <tbody>
            <tr><td>Takeoff</td><td>${fmtFtM(perf.takeoff.gr)}</td><td>${fmtFtM(perf.takeoff.to50ft)}</td></tr>
            <tr><td>Accelerate-Stop</td><td colspan="2"><span class="${perf.accel_stop.ok ? '' : 'dt-oei-warn'}">${fmtFtM(perf.accel_stop.dist_m)}</span></td></tr>
            <tr><td>Accelerate-Go</td><td>${perf.accel_go.dist_m !== null ? fmtFtM(perf.accel_go.dist_m) : '<span class="dt-oei-warn">N/A</span>'}</td><td><span class="${{ warning: 'dt-oei-warn', caution: 'dt-oei-caution' }[perf.accel_go.level] ?? ''}">${fmtFpmM(perf.roc_oei_fpm)}</span></td></tr>
            <tr><td>Landing</td><td>${fmtFtM(perf.landing.gr)}</td><td>${fmtFtM(perf.landing.to50ft)}</td></tr>
            <tr><td>Rate of Climb</td><td>${fmtFpmM(perf.roc_fpm)}</td><td>${fmtFpmM(perf.roc_oei_fpm)}</td></tr>
          </tbody>
        </table>`;
}

function windText(metar) {
  if (!metar || metar.wind_speed_kt === null) return '—';
  const gust = metar.wind_gust_kt ? ` G${metar.wind_gust_kt}` : '';
  if (metar.wind_speed_kt === 0) return 'Calm';
  if (metar.wind_variable) return `Variable ${metar.wind_speed_kt} kt${gust}`;
  if (metar.wind_dir_deg === null) return 'Calm';
  return `${String(metar.wind_dir_deg).padStart(3, '0')}° / ${metar.wind_speed_kt} kt${gust}`;
}

function printHeading(state) {
  return {
    aircraft: state.empty.note ? ` - ${state.empty.note}` : '',
    timestamp: new Date().toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }),
  };
}

const SURFACE_LABEL = { paved: 'Asphalt / Concrete', turf: 'Turf', gravel: 'Gravel', dirt: 'Dirt' };

const fmtFt = (ft) => `${Math.round(ft).toLocaleString()} ft`;
const fmtLbKg = (lb, kg) => `${formatNumber(lb, 0)} lb (${formatNumber(kg, 0)} kg)`;
const warnIf = (bad, html) => (bad ? `<span class="dt-oei-warn">${html}</span>` : html);

// Rows for the Inputs table: every condition the figures were computed from.
function performanceInputs(perf, metar) {
  const airport = [perf.airport_name, perf.airport_id ? `(${perf.airport_id})` : null].filter(Boolean).join(' ');
  const weather = perf.wx_station
    ? perf.wx_station + (perf.wx_station_nm !== null && perf.wx_station !== perf.airport_id ? `, ${perf.wx_station_nm} nm away` : '')
    : null;
  const dims = [perf.runway_length_ft, perf.runway_width_ft].filter(Boolean).map(fmtFt).join(' × ');
  const runway = [
    [perf.runway_id, `departing ${perf.end_id}`].filter(Boolean).join(', '),
    dims,
    SURFACE_LABEL[perf.surface] ?? perf.surface,
  ].filter(Boolean).join('; ');
  const slope = perf.slope_pct !== null && perf.slope_pct !== undefined
    ? `${perf.slope_pct > 0 ? '+' : ''}${perf.slope_pct}%`
    : null;
  const along = perf.headwind_kt >= 0 ? `Headwind ${perf.headwind_kt} kt` : `Tailwind ${Math.abs(perf.headwind_kt)} kt`;
  const cross = perf.xwind_kt === null
    ? null
    : perf.xwind_kt === 0
      ? '0 kt'
      : warnIf(!perf.xwind_ok, `${Math.abs(perf.xwind_kt)} kt from the ${perf.xwind_kt > 0 ? 'right' : 'left'}`);

  return [
    ['Airport', airport],
    ['Field elevation', fmtFt(perf.elev_ft)],
    ['Weather from', weather],
    ['Runway', runway],
    ['Takeoff run available', perf.tora_ft ? fmtFt(perf.tora_ft) : null],
    ['Landing distance available', perf.lda_ft ? fmtFt(perf.lda_ft) : null],
    ['Slope', slope],
    ['OAT', `${perf.oat_c} °C / ${Math.round(perf.oat_c * 9 / 5 + 32)} °F`],
    ['Altimeter', metar?.altimeter_inhg != null ? `${metar.altimeter_inhg.toFixed(2)} inHg` : null],
    ['Pressure altitude', fmtFt(perf.pa_ft)],
    ['Wind', windText(metar)],
    ['Wind used for distances', along],
    ['Crosswind, gust midpoint', cross],
    ['Weight for takeoff figures', `${fmtLbKg(perf.weight_lb, perf.weight_kg)}, ramp`],
    ['Weight for landing figures', `${fmtLbKg(perf.landing_weight_lb, perf.landing_weight_kg)}, planned landing`],
  ]
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .map(([label, value]) => `<tr><td>${label}</td><td>${value}</td></tr>`)
    .join('');
}

// The same warnings the performance panel shows, spelled out for a printed sheet.
function performanceNotes(perf) {
  return [
    !perf.takeoff.tora_ok && `Takeoff over 50 ft is longer than the ${fmtFt(perf.tora_ft)} takeoff run available.`,
    !perf.landing.lda_ok && `Landing from 50 ft is longer than the ${fmtFt(perf.lda_ft)} landing distance available.`,
    perf.accel_stop.message && `Accelerate-stop: ${perf.accel_stop.message}`,
    perf.accel_go.message && `Accelerate-go: ${perf.accel_go.message}`,
    perf.xwind_kt !== null && !perf.xwind_ok && `Crosswind is above the ${perf.xwind_limit_kt} kt maximum demonstrated.`,
    'Accelerate-stop and accelerate-go are estimates, not POH figures.',
  ]
    .filter(Boolean)
    .map((note) => `<li>${note}</li>`)
    .join('');
}

// Second printed page: the performance figures with everything they were
// computed from. Print only, and only once a performance result exists.
export function renderPerformancePage(target, state, metar = null, perf = null) {
  if (!perf) {
    target.replaceChildren();
    return;
  }
  const { aircraft, timestamp } = printHeading(state);
  const goClass = { warning: 'dt-oei-warn', caution: 'dt-oei-caution' }[perf.accel_go.level] ?? '';
  const section = document.createElement('section');
  section.className = 'print-page2';
  section.innerHTML = `
      <div class="print-summary__title">
        <div class="print-summary__title__row">
          <span class="print-summary__name">Tecnam P2006T Departure Performance${aircraft}</span>
          <span class="print-summary__ts">${timestamp}</span>
        </div>
        ${metar?.raw ? `<div class="print-summary__title__row">
          <span class="print-summary__metar">${metar.raw}</span>
          ${runwayLine(perf)}
        </div>` : ''}
      </div>
      <div class="print-page2__grid">
        <div>
          <table class="dt-table">
            <thead><tr><th>Inputs</th><th></th></tr></thead>
            <tbody>${performanceInputs(perf, metar)}</tbody>
          </table>
        </div>
        <div>
          <table class="dt-table">
            <thead><tr><th>Performance</th><th>GR / Dist</th><th>50 ft / OEI</th></tr></thead>
            <tbody>
              <tr><td>Takeoff</td><td>${fmtFtM(perf.takeoff.gr)}</td><td>${warnIf(!perf.takeoff.tora_ok, fmtFtM(perf.takeoff.to50ft))}</td></tr>
              <tr><td>Accelerate-Stop</td><td colspan="2">${warnIf(!perf.accel_stop.ok, fmtFtM(perf.accel_stop.dist_m))}</td></tr>
              <tr><td>Accelerate-Go</td><td>${perf.accel_go.dist_m !== null ? `<span class="${goClass}">${fmtFtM(perf.accel_go.dist_m)}</span>` : '<span class="dt-oei-warn">N/A</span>'}</td><td><span class="${goClass}">${fmtFpmM(perf.roc_oei_fpm)}</span></td></tr>
              <tr><td>Landing</td><td>${fmtFtM(perf.landing.gr)}</td><td>${warnIf(!perf.landing.lda_ok, fmtFtM(perf.landing.to50ft))}</td></tr>
              <tr><td>Rate of Climb</td><td>${fmtFpmM(perf.roc_fpm)}</td><td>${fmtFpmM(perf.roc_oei_fpm)}</td></tr>
            </tbody>
          </table>
          <ul class="print-page2__notes">${performanceNotes(perf)}</ul>
        </div>
      </div>`;
  target.replaceChildren(section);
}

export function renderPrintSummary(target, state, metar = null, perf = null) {
  const conds = computeAll(state);
  const totalGal      = state.fuelL.volume_gal + state.fuelR.volume_gal;
  const taxiGal       = state.fuelTaxi?.volume_gal    ?? 0;
  const burnoffGal    = state.fuelBurnoff?.volume_gal ?? 0;
  const departureGal  = Math.max(0, totalGal - taxiGal);
  const landingGal    = Math.max(0, departureGal - burnoffGal);

  const arms = P2006T.arms_ft;
  function wRow(label, lb, moment_lb_ft) {
    const hasVal = lb > 0;
    return `<tr>
      <td>${label}</td>
      <td>${hasVal ? formatNumber(lb, 0) : '—'}</td>
      <td>${hasVal ? formatNumber(lbToKg(lb), 0) : '—'}</td>
      <td>${hasVal ? formatNumber(moment_lb_ft, 0) + ' lb·ft' : '—'}</td>
    </tr>`;
  }

  const { aircraft, timestamp } = printHeading(state);

  const section = document.createElement('section');
  section.className = 'print-summary';
  section.innerHTML = `
    <div class="print-summary__title">
      <div class="print-summary__title__row">
        <span class="print-summary__name">Tecnam P2006T Weight &amp; Balance${aircraft}</span>
        <span class="print-summary__ts">${timestamp}</span>
      </div>
      ${metar?.raw ? `<div class="print-summary__title__row">
        <span class="print-summary__metar">${metar.raw}</span>
        ${runwayLine(perf)}
      </div>` : ''}
    </div>
    <h2 class="section-h2">Tables</h2>
    <div class="print-summary__grid">
      ${perf ? `<div>
        ${perfTable(perf)}
      </div>` : ''}
      <div>
        <table class="dt-table">
          <thead><tr><th>Loading</th><th>lb</th><th>kg</th><th>Moment</th></tr></thead>
          <tbody>
            ${wRow('Empty A/C', state.empty.weight_lb, state.empty.moment_lb_ft)}
            ${wRow('Pilot',     state.pilot.weight_lb,    state.pilot.weight_lb    * arms.pilot)}
            ${wRow('Co-pilot',  state.copilot.weight_lb,  state.copilot.weight_lb  * arms.copilot)}
            ${wRow('Rear Passengers',  state.rearLH.weight_lb + state.rearRH.weight_lb, (state.rearLH.weight_lb + state.rearRH.weight_lb) * arms.rearLH)}
            ${wRow('Baggage',   state.baggage.weight_lb,  state.baggage.weight_lb  * arms.baggage)}
          </tbody>
        </table>
      </div>
      <div>
        <table class="dt-table">
          <thead><tr><th>Fuel</th><th>gal</th><th>L</th><th>lb</th><th>kg</th></tr></thead>
          <tbody>
            ${fuelRow('Initial',    totalGal)}
            ${fuelRow('Taxi',       taxiGal)}
            ${fuelRow('Departure',  departureGal, 'dt-subtotal')}
            ${fuelRow('Enroute',    burnoffGal)}
            ${fuelRow('Landing',    landingGal, 'dt-subtotal')}
          </tbody>
        </table>
      </div>
      <div class="print-summary__wb">
        <table class="dt-table">
          <thead><tr>
            <th>W&amp;B</th><th>lb</th><th>kg</th><th>% MAC</th><th></th>
          </tr></thead>
          <tbody>
            <tr class="dt-cond--mtow">
              <td>MTOW</td>
              <td>${formatNumber(state.mtow?.weight_lb || P2006T.mtow_lb, 0)}</td>
              <td>${formatNumber(lbToKg(state.mtow?.weight_lb || P2006T.mtow_lb), 0)}</td>
              <td>—</td><td></td>
            </tr>
            ${condRow('Ramp',      conds.ramp,     'ramp')}
            ${condRow('Takeoff',   conds.takeoff,  'to'  )}
            ${condRow('Landing',   conds.landing,  'ldg' )}
            ${condRow('Zero Fuel', conds.zeroFuel, 'zfw' )}
          </tbody>
        </table>
      </div>
    </div>
  `;
  target.replaceChildren(section);
}
