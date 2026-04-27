import { P2006T } from './data/p2006t.js';
import {
  lbToKg, kgToLb, galToL, lToGal, lbFtToKgM, kgMToLbFt, ftToM,
  formatNumber, parseNumber,
} from './units.js';
import { load, save, KEYS } from './persistence.js';

const LOADOUT_KEYS = [
  'mtow',
  'pilot', 'copilot', 'rearLH', 'rearRH', 'baggage',
  'fuelL', 'fuelR', 'fuelTaxi', 'fuelBurnoff', 'fuelReserve',
];

function saveLoadout(state) {
  const out = {};
  for (const k of LOADOUT_KEYS) if (state[k]) out[k] = state[k];
  save(KEYS.loadout, out);
}

export function defaultState() {
  const defaults = {
    empty:       load(KEYS.empty) ?? { weight_lb: 1953, moment_lb_ft: 2442, note: '' },
    mtow:        { weight_lb: P2006T.mtow_lb },
    pilot:       { weight_lb: 190 },  // FAA standard male
    copilot:     { weight_lb: 165 },  // FAA standard female
    rearLH:      { weight_lb: 0 },
    rearRH:      { weight_lb: 0 },
    baggage:     { weight_lb: 25 },
    fuelL:       { volume_gal: 20 },
    fuelR:       { volume_gal: 20 },
    fuelTaxi:    { volume_gal: 1.0 },
    fuelBurnoff: { volume_gal: 15 },
    fuelReserve: { volume_gal: 8.0 },  // 4 gal per side default
  };
  const stored = load(KEYS.loadout);
  if (stored) {
    for (const k of LOADOUT_KEYS) {
      if (stored[k] && typeof stored[k] === 'object') defaults[k] = stored[k];
    }
  }
  return defaults;
}

const SEAT_MAX_LB = 485; // combined front or rear pair limit: 220 kg per POH

const WEIGHT_STATIONS = [
  { id: 'pilot',   label: 'Pilot',     maxLb: SEAT_MAX_LB },
  { id: 'copilot', label: 'Co-pilot',  maxLb: SEAT_MAX_LB },
  { id: 'rearLH',  label: 'Rear LH',   maxLb: SEAT_MAX_LB },
  { id: 'rearRH',  label: 'Rear RH',   maxLb: SEAT_MAX_LB },
  { id: 'baggage', label: 'Baggage' },
];

const FUEL_TANKS = [
  { id: 'fuelL', label: 'Fuel L' },
  { id: 'fuelR', label: 'Fuel R' },
];

function weightCellHtml({ id, label, maxLb }) {
  const maxLbAttr  = maxLb ? ` max="${maxLb}"` : '';
  const maxKg      = maxLb ? lbToKg(maxLb) : null;
  const maxKgAttr  = maxKg ? ` max="${formatNumber(maxKg, 1)}"` : '';
  return `
    <fieldset class="station station--${id}" data-station="${id}">
      <legend>${label}</legend>
      <div class="dual-input">
        <label class="vh" for="in-${id}-lb">${label} weight in pounds</label>
        <input type="number" id="in-${id}-lb" data-field="${id}.weight_lb" data-unit="lb"
               min="0"${maxLbAttr} step="0.1" inputmode="decimal" placeholder="0">
        <span class="unit">lb</span>
        <label class="vh" for="in-${id}-kg">${label} weight in kilograms</label>
        <input type="number" id="in-${id}-kg" data-field="${id}.weight_lb" data-unit="kg"
               min="0"${maxKgAttr} step="0.1" inputmode="decimal" placeholder="0" tabindex="-1">
        <span class="unit">kg</span>
      </div>
      <p class="cell-warn" data-warn-for="${id}" hidden></p>
    </fieldset>`;
}

function fuelCellHtml({ id, label }) {
  return `
    <fieldset class="station station--fuel station--${id}" data-station="${id}">
      <legend>${label}</legend>
      <div class="dual-input">
        <label class="vh" for="in-${id}-gal">${label} volume in US gallons</label>
        <input type="number" id="in-${id}-gal" data-field="${id}.volume_gal" data-unit="gal"
               min="0" step="0.1" inputmode="decimal" placeholder="0">
        <span class="unit">gal</span>
        <label class="vh" for="in-${id}-L">${label} volume in litres</label>
        <input type="number" id="in-${id}-L" data-field="${id}.volume_gal" data-unit="L"
               min="0" step="0.1" inputmode="decimal" placeholder="0" tabindex="-1">
        <span class="unit">L</span>
      </div>
      <p class="cell-warn" data-warn-for="${id}" hidden></p>
    </fieldset>`;
}

function emptySectionHtml() {
  return `
    <div class="empty-grid">
      <fieldset class="station">
        <legend>Aircraft</legend>
        <input class="aircraft-input" type="text" data-field="empty.note"
               placeholder="e.g. N12345 — weighed 2024-03-15">
      </fieldset>
      <fieldset class="station">
        <legend>Empty weight</legend>
        <div class="dual-input">
          <label class="vh" for="in-empty-w-lb">Empty weight in pounds</label>
          <input type="number" id="in-empty-w-lb" data-field="empty.weight_lb" data-unit="lb"
                 min="0" step="0.1" inputmode="decimal" placeholder="1742">
          <span class="unit">lb</span>
          <label class="vh" for="in-empty-w-kg">Empty weight in kilograms</label>
          <input type="number" id="in-empty-w-kg" data-field="empty.weight_lb" data-unit="kg"
                 min="0" step="0.1" inputmode="decimal" placeholder="790" tabindex="-1">
          <span class="unit">kg</span>
        </div>
      </fieldset>
      <fieldset class="station station--mtow">
        <legend>MTOW</legend>
        <div class="dual-input">
          <label class="vh" for="in-mtow-lb">MTOW in pounds</label>
          <input type="number" id="in-mtow-lb" data-field="mtow.weight_lb" data-unit="lb"
                 min="0" step="1" inputmode="decimal" placeholder="2712">
          <span class="unit">lb</span>
          <label class="vh" for="in-mtow-kg">MTOW in kilograms</label>
          <input type="number" id="in-mtow-kg" data-field="mtow.weight_lb" data-unit="kg"
                 min="0" step="1" inputmode="decimal" placeholder="1230" tabindex="-1">
          <span class="unit">kg</span>
        </div>
      </fieldset>
      <fieldset class="station station--empty-moment">
        <legend>Empty moment</legend>
        <div class="dual-input">
          <label class="vh" for="in-empty-m-lbft">Empty moment in pound-feet</label>
          <input type="number" id="in-empty-m-lbft" data-field="empty.moment_lb_ft" data-unit="lb·ft"
                 step="0.1" inputmode="decimal" placeholder="2778">
          <span class="unit">lb·ft</span>
          <label class="vh" for="in-empty-m-kgm">Empty moment in kilogram-metres</label>
          <input type="number" id="in-empty-m-kgm" data-field="empty.moment_lb_ft" data-unit="kg·m"
                 step="0.01" inputmode="decimal" placeholder="378" tabindex="-1">
          <span class="unit">kg·m</span>
          <label class="vh" for="in-empty-m-pct">Empty CG as percent MAC</label>
          <input type="number" id="in-empty-m-pct" data-field="empty.moment_lb_ft" data-unit="pct-mac"
                 step="0.1" inputmode="decimal" placeholder="28.5" tabindex="-1">
          <span class="unit">% MAC</span>
        </div>
      </fieldset>
    </div>`;
}


function fuelPlanHtml() {
  return `
    <div class="fuel-plan">
      <fieldset class="station station--taxi" data-station="fuelTaxi">
        <legend>Taxi fuel</legend>
        <div class="dual-input">
          <label class="vh" for="in-taxi-gal">Taxi fuel in US gallons</label>
          <input type="number" id="in-taxi-gal" data-field="fuelTaxi.volume_gal" data-unit="gal"
                 min="0" step="0.1" inputmode="decimal" placeholder="1.0">
          <span class="unit">gal</span>
          <label class="vh" for="in-taxi-L">Taxi fuel in litres</label>
          <input type="number" id="in-taxi-L" data-field="fuelTaxi.volume_gal" data-unit="L"
                 min="0" step="0.1" inputmode="decimal" placeholder="3.8" tabindex="-1">
          <span class="unit">L</span>
        </div>
        <p class="cell-warn" data-warn-for="fuelTaxi" hidden></p>
      </fieldset>
      <fieldset class="station station--burnoff" data-station="fuelBurnoff">
        <legend>Enroute fuel</legend>
        <div class="dual-input">
          <label class="vh" for="in-burnoff-gal">Enroute fuel in US gallons</label>
          <input type="number" id="in-burnoff-gal" data-field="fuelBurnoff.volume_gal" data-unit="gal"
                 min="0" step="0.1" inputmode="decimal" placeholder="0">
          <span class="unit">gal</span>
          <label class="vh" for="in-burnoff-L">Enroute fuel in litres</label>
          <input type="number" id="in-burnoff-L" data-field="fuelBurnoff.volume_gal" data-unit="L"
                 min="0" step="0.1" inputmode="decimal" placeholder="0" tabindex="-1">
          <span class="unit">L</span>
        </div>
        <p class="cell-warn" data-warn-for="fuelBurnoff" hidden></p>
      </fieldset>
      <fieldset class="station station--reserve" data-station="fuelReserve">
        <legend>Reserve fuel</legend>
        <div class="dual-input">
          <label class="vh" for="in-reserve-gal">Reserve fuel in US gallons</label>
          <input type="number" id="in-reserve-gal" data-field="fuelReserve.volume_gal" data-unit="gal"
                 min="0" step="0.1" inputmode="decimal" placeholder="8.0">
          <span class="unit">gal</span>
          <label class="vh" for="in-reserve-L">Reserve fuel in litres</label>
          <input type="number" id="in-reserve-L" data-field="fuelReserve.volume_gal" data-unit="L"
                 min="0" step="0.1" inputmode="decimal" placeholder="30" tabindex="-1">
          <span class="unit">L</span>
        </div>
      </fieldset>
    </div>`;
}

function template() {
  return `
    ${emptySectionHtml()}
    <div class="plan-view">
      <div class="plan-view__fuel-col">${fuelCellHtml(FUEL_TANKS[0])}</div>
      <div class="plan-view__interior">
        ${weightCellHtml(WEIGHT_STATIONS[0])}
        ${weightCellHtml(WEIGHT_STATIONS[1])}
        ${weightCellHtml(WEIGHT_STATIONS[2])}
        ${weightCellHtml(WEIGHT_STATIONS[3])}
        ${weightCellHtml(WEIGHT_STATIONS[4])}
      </div>
      <div class="plan-view__fuel-col">${fuelCellHtml(FUEL_TANKS[1])}</div>
    </div>
    ${fuelPlanHtml()}`;
}

function getCanonical(state, field) {
  const [station, key] = field.split('.');
  return state[station][key];
}

function setCanonical(state, field, value) {
  const [station, key] = field.split('.');
  state[station][key] = value;
}

function toCanonical(value, unit) {
  switch (unit) {
    case 'kg':   return kgToLb(value);
    case 'L':    return lToGal(value);
    case 'kg·m': return kgMToLbFt(value);
    default:     return value; // lb, gal, lb·ft
  }
}

function fromCanonical(canonical, unit) {
  switch (unit) {
    case 'kg':   return lbToKg(canonical);
    case 'L':    return galToL(canonical);
    case 'kg·m': return lbFtToKgM(canonical);
    default:     return canonical; // lb, gal, lb·ft
  }
}

function totalFuelGal(state) {
  return state.fuelL.volume_gal + state.fuelR.volume_gal;
}

function totalFuelLb(state) {
  return totalFuelGal(state) * P2006T.fuel.density_lb_per_gal;
}

export function computeGrossLb(state) {
  return state.empty.weight_lb
    + state.pilot.weight_lb + state.copilot.weight_lb
    + state.rearLH.weight_lb + state.rearRH.weight_lb
    + state.baggage.weight_lb
    + totalFuelLb(state);
}

export function computeZfwLb(state) {
  return computeGrossLb(state) - totalFuelLb(state);
}

function renderMirror(root, field, sourceInput, state) {
  const canonical = getCanonical(state, field);
  const all = root.querySelectorAll(`[data-field="${CSS.escape(field)}"]`);
  for (const el of all) {
    if (el === sourceInput) continue;
    if (!el.dataset.unit) continue;
    if (el.dataset.unit === 'pct-mac') continue; // back-calculated separately
    const display = fromCanonical(canonical, el.dataset.unit);
    el.value = canonical === 0 ? '' : formatNumber(display, decimalsFor(el.dataset.unit));
  }
}

function renderPctMac(root, state) {
  const el = root.querySelector('[data-unit="pct-mac"]');
  if (!el) return;
  const w = state.empty.weight_lb;
  const m = state.empty.moment_lb_ft;
  if (w <= 0) { el.value = ''; return; }
  el.value = formatNumber((m / w / P2006T.mac.chord_ft) * 100, 1);
}

function decimalsFor(unit) {
  if (unit === 'ft' || unit === 'm') return 3;
  if (unit === 'kg·m') return 2;
  if (unit === 'lb' || unit === 'kg') return 0;
  return 1;
}

function renderInitial(root, state) {
  for (const el of root.querySelectorAll('[data-field][data-unit]')) {
    const canonical = getCanonical(state, el.dataset.field);
    if (canonical === 0) { el.value = ''; continue; }
    el.value = formatNumber(fromCanonical(canonical, el.dataset.unit), decimalsFor(el.dataset.unit));
  }
  const noteEl = root.querySelector('[data-field="empty.note"]');
  if (noteEl) noteEl.value = state.empty.note ?? '';
  renderPctMac(root, state);
  renderWarnings(root, state);
}

function renderEmptyDerived(root, state) {
  const el = root.querySelector('[data-derived="empty"]');
  if (!el) return;
  const w = state.empty.weight_lb;
  const m = state.empty.moment_lb_ft;
  if (w <= 0) {
    el.textContent = 'arm —  ·  — % MAC';
    return;
  }
  const arm_ft = m / w;
  const pct_mac = (arm_ft / P2006T.mac.chord_ft) * 100;
  el.textContent = `arm ${formatNumber(arm_ft, 3)} ft / ${formatNumber(ftToM(arm_ft), 3)} m  ·  ${formatNumber(pct_mac, 1)}% MAC`;
}

function renderFuelWeights(root, state) {
  const targets = [...FUEL_TANKS.map((t) => t.id), 'fuelTaxi', 'fuelBurnoff'];
  for (const id of targets) {
    const el = root.querySelector(`[data-weight-for="${id}"]`);
    if (!el) continue;
    const lb = state[id].volume_gal * P2006T.fuel.density_lb_per_gal;
    el.textContent = `→ ${formatNumber(lb, 1)} lb / ${formatNumber(lbToKg(lb), 1)} kg`;
  }
}

// Pure: compute the set of active violations for a given state.
// Returns { [target]: { on: bool, message: string } } for each warn target.
// Per-tank fuel limit takes precedence over combined-usable on a given tank.
export function computeViolations(state) {
  const v = {};

  v.baggage = {
    on: state.baggage.weight_lb > P2006T.baggage.max_lb,
    message: `max ${P2006T.baggage.max_lb} lb (80 kg)`,
  };

  const frontLb = state.pilot.weight_lb + state.copilot.weight_lb;
  const rearLb  = state.rearLH.weight_lb + state.rearRH.weight_lb;
  const frontOver = { on: frontLb > SEAT_MAX_LB, message: `front seats exceed ${SEAT_MAX_LB} lb (220 kg)` };
  const rearOver  = { on: rearLb  > SEAT_MAX_LB, message: `rear seats exceed ${SEAT_MAX_LB} lb (220 kg)` };
  v.pilot = v.copilot = frontOver;
  v.rearLH = v.rearRH = rearOver;

  const totalGal = totalFuelGal(state);
  const combinedOver = totalGal > P2006T.fuel.combined_usable_gal;
  for (const { id } of FUEL_TANKS) {
    const tankGal = state[id].volume_gal;
    if (tankGal > P2006T.fuel.perTank_max_gal) {
      v[id] = { on: true, message: `max ${P2006T.fuel.perTank_max_gal} gal per tank` };
    } else {
      v[id] = {
        on: combinedOver,
        message: `combined fuel exceeds ${P2006T.fuel.combined_usable_gal} gal usable`,
      };
    }
  }

  const gross = computeGrossLb(state);
  const zfw = computeZfwLb(state);
  const mtow_lb = state.mtow?.weight_lb || P2006T.mtow_lb;
  v['totals-gross'] = { on: gross > mtow_lb, message: `over MTOW (${mtow_lb} lb)` };
  v['totals-zfw']   = { on: zfw   > P2006T.mzfw_lb, message: `over MZFW (${P2006T.mzfw_lb} lb)` };

  const taxiGal = state.fuelTaxi?.volume_gal ?? 0;
  const burnoffGal = state.fuelBurnoff?.volume_gal ?? 0;
  v.fuelTaxi = {
    on: taxiGal > totalGal,
    message: 'taxi exceeds loaded fuel',
  };
  v.fuelBurnoff = {
    on: !v.fuelTaxi.on && (taxiGal + burnoffGal) > totalGal,
    message: 'taxi + burnoff exceeds loaded fuel',
  };

  return v;
}

const WARN_SELECTORS = {
  pilot:       '.station--pilot',
  copilot:     '.station--copilot',
  rearLH:      '.station--rearLH',
  rearRH:      '.station--rearRH',
  baggage:     '.station--baggage',
  fuelL:       '.station--fuelL',
  fuelR:       '.station--fuelR',
  fuelTaxi:    '.station--taxi',
  fuelBurnoff: '.station--burnoff',
  'totals-gross': '[data-totals-row="gross"]',
  'totals-zfw':   '[data-totals-row="zfw"]',
};

function renderWarnings(root, state) {
  const violations = computeViolations(state);
  for (const [target, { on, message }] of Object.entries(violations)) {
    const cell = root.querySelector(WARN_SELECTORS[target]);
    const warnEl = root.querySelector(`[data-warn-for="${target}"]`);
    if (cell) cell.classList.toggle('warn', on);
    if (warnEl) {
      warnEl.hidden = !on;
      if (on) warnEl.textContent = message;
    }
  }
}

function bind(root, state, onChange) {
  root.addEventListener('input', (e) => {
    const t = e.target;
    const field = t.dataset.field;
    if (!field) return;

    if (field === 'empty.note') {
      state.empty.note = t.value;
      save(KEYS.empty, state.empty);
      onChange?.(state);
      return;
    }

    if (t.dataset.unit === 'pct-mac') {
      // Back-calculate moment from % MAC using current empty weight
      const pct = parseNumber(t.value);
      const moment = (pct / 100) * P2006T.mac.chord_ft * state.empty.weight_lb;
      state.empty.moment_lb_ft = moment;
      save(KEYS.empty, state.empty);
      renderMirror(root, 'empty.moment_lb_ft', t, state);
      renderWarnings(root, state);
      onChange?.(state);
      return;
    }

    const value = parseNumber(t.value);
    const canonical = toCanonical(value, t.dataset.unit);
    setCanonical(state, field, canonical);

    if (field.startsWith('empty.')) save(KEYS.empty, state.empty);
    else saveLoadout(state);

    renderMirror(root, field, t, state);
    if (field.startsWith('empty.')) renderPctMac(root, state);
    renderWarnings(root, state);
    onChange?.(state);
  });
}

export function mountStationInput(target, { onChange } = {}) {
  const state = defaultState();
  const root = document.createElement('section');
  root.className = 'station-input';
  root.innerHTML = template();
  target.replaceChildren(root);
  bind(root, state, onChange);
  renderInitial(root, state);
  return {
    destroy:  () => root.remove(),
    getState: () => state,
    patch: (fields) => {
      for (const [station, vals] of Object.entries(fields)) {
        Object.assign(state[station], vals);
      }
      saveLoadout(state);
      renderInitial(root, state);
      onChange?.(state);
    },
  };
}
