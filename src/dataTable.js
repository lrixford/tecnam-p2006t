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

  const aircraft = state.empty.note ? ` - ${state.empty.note}` : '';
  const timestamp = new Date().toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const section = document.createElement('section');
  section.className = 'print-summary';
  section.innerHTML = `
    <div class="print-summary__title">
      <div class="print-summary__title__row">
        <span class="print-summary__name">Tecnam P2006T Weight &amp; Balance${aircraft}</span>
        <span class="print-summary__ts">${timestamp}</span>
      </div>
      ${metar?.raw ? `<span class="print-summary__metar">${metar.raw}</span>` : ''}
    </div>
    <h2 class="section-h2">Tables</h2>
    <div class="print-summary__grid">
      ${perf ? `<div>
        <table class="dt-table">
          <thead><tr><th>Performance</th><th>GR / Dist</th><th>50 ft / OEI</th></tr></thead>
          <tbody>
            <tr><td>Takeoff</td><td>${fmtFtM(perf.takeoff.gr)}</td><td>${fmtFtM(perf.takeoff.to50ft)}</td></tr>
            <tr><td>Accelerate-Stop</td><td colspan="2">${fmtFtM(perf.accel_stop.dist_m)}</td></tr>
            <tr><td>Accelerate-Go</td><td colspan="2">${perf.accel_go.dist_m !== null ? fmtFtM(perf.accel_go.dist_m) : '<span class="dt-oei-warn">Unable to maintain 25 fpm OEI</span>'}</td></tr>
            <tr><td>Landing</td><td>${fmtFtM(perf.landing.gr)}</td><td>${fmtFtM(perf.landing.to50ft)}</td></tr>
            <tr><td>Rate of Climb</td><td>${fmtFpmM(perf.roc_fpm)}</td><td>${fmtFpmM(perf.roc_oei_fpm)}</td></tr>
          </tbody>
        </table>
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
