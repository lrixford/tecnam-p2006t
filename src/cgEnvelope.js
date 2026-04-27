import { P2006T } from './data/p2006t.js';
import { computeAll } from './loadingCondition.js';
import { formatNumber, lbToKg } from './units.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

// Unit conversions
const KGM_TO_LBFT = 7.23301;
const KG_TO_LB    = 2.20462;
const FT_TO_M     = 0.3048;

// Arm in metres
const FWD_ARM_M = P2006T.envelope.fwd_arm_ft * FT_TO_M;
const AFT_ARM_M = P2006T.envelope.aft_arm_ft * FT_TO_M;
const MZFW_KG   = P2006T.mzfw_lb / KG_TO_LB;

// Rounds up to the next clean 25 kg mark at least ~50 lb above MTOW.
function dynamicMaxKg(mtow_kg) {
  return Math.ceil((mtow_kg + 15) / 25) * 25;
}

// Rounds down to the nearest 25 kg mark ~25 kg below BEW.
function dynamicMinKg(ew_kg) {
  return Math.floor((ew_kg - 25) / 25) * 25;
}

const LAYOUT = {
  viewBox:  { w: 640, h: 440 },
  margin:   { top: 36, right: 68, bottom: 40, left: 68 },
  moment:   { min_kgm: 150, max_kgm: 550 },
  weight:   { min_kg:  790, max_kg: 1315 },
};

function cr() {
  const { viewBox: vb, margin: m } = LAYOUT;
  const x  = m.left;
  const y  = m.top;
  const x2 = vb.w - m.right;
  const y2 = vb.h - m.bottom;
  return { x, y, x2, y2, w: x2 - x, h: y2 - y };
}

function mapMomentX(kgm) {
  const { x, w } = cr();
  const { min_kgm, max_kgm } = LAYOUT.moment;
  return x + (kgm - min_kgm) / (max_kgm - min_kgm) * w;
}

function mapWeightY(kg) {
  const { y, y2, h } = cr();
  const { min_kg, max_kg } = LAYOUT.weight;
  return y2 - (kg - min_kg) / (max_kg - min_kg) * h;
}

// ─── SVG helpers ───────────────────────────────────────────────────────────

function el(tag, attrs = {}, children = []) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null) continue;
    node.setAttribute(k, String(v));
  }
  for (const c of children) {
    if (c == null) continue;
    if (typeof c === 'string') node.appendChild(document.createTextNode(c));
    else node.appendChild(c);
  }
  return node;
}

function line(x1, y1, x2, y2, klass) {
  return el('line', { x1, y1, x2, y2, class: klass });
}

function txt(x, y, klass, content, extra = {}) {
  return el('text', { x, y, class: klass, ...extra }, [content]);
}

// ─── Envelope ──────────────────────────────────────────────────────────────

function limitLabel(x1, y1, x2, y2, label, klass, offset = -11, t = 1/3) {
  const mx = x1 + (x2 - x1) * t;
  const my = y1 + (y2 - y1) * t;
  const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
  const oy = my + offset;
  return el('text', {
    x: mx, y: oy,
    class: `cge-limit-label ${klass}`,
    transform: `rotate(${angle.toFixed(1)}, ${mx}, ${oy})`,
    'text-anchor': 'middle',
  }, [label]);
}

function buildEnvelope(mtow_kg) {
  const { min_kg } = LAYOUT.weight;

  const pts = [
    [min_kg  * FWD_ARM_M, min_kg ],
    [mtow_kg * FWD_ARM_M, mtow_kg],
    [mtow_kg * AFT_ARM_M, mtow_kg],
    [min_kg  * AFT_ARM_M, min_kg ],
  ].map(([kgm, kg]) => `${mapMomentX(kgm)},${mapWeightY(kg)}`).join(' ');

  const fwdX1 = mapMomentX(min_kg  * FWD_ARM_M), fwdY1 = mapWeightY(min_kg);
  const fwdX2 = mapMomentX(mtow_kg * FWD_ARM_M), fwdY2 = mapWeightY(mtow_kg);
  const aftX1 = mapMomentX(min_kg  * AFT_ARM_M), aftY1 = mapWeightY(min_kg);
  const aftX2 = mapMomentX(mtow_kg * AFT_ARM_M), aftY2 = mapWeightY(mtow_kg);

  const { x, y, x2, y2 } = cr();
  return el('g', {}, [
    el('rect', { x, y, width: x2 - x, height: y2 - y, class: 'cge-chart-bg' }),
    el('polygon', { points: pts, class: 'cge-envelope' }),
    line(fwdX1, fwdY1, fwdX2, fwdY2, 'cge-limit-line cge-limit-line--fwd'),
    line(aftX1, aftY1, aftX2, aftY2, 'cge-limit-line cge-limit-line--aft'),
    limitLabel(fwdX1, fwdY1, fwdX2, fwdY2, '16.5% MAC', 'cge-limit-label--fwd', -11),
    limitLabel(aftX1, aftY1, aftX2, aftY2, '31% MAC',   'cge-limit-label--aft',  20),
  ]);
}

// ─── Axes ──────────────────────────────────────────────────────────────────

function buildAxes() {
  const { x, y, x2, y2 } = cr();
  const elements = [];

  // Chart border
  elements.push(el('rect', { x, y, width: cr().w, height: cr().h, class: 'cge-border' }));

  // ── Bottom axis: moment in kg·m (150–550, minor 25, mid 50, major 100) ──
  for (let kgm = LAYOUT.moment.min_kgm; kgm <= LAYOUT.moment.max_kgm; kgm += 25) {
    const px = mapMomentX(kgm);
    const isMajor = kgm % 100 === 0;
    const isMid   = !isMajor && kgm % 50 === 0;
    const len = isMajor ? 7 : isMid ? 5 : 3;
    elements.push(line(px, y2, px, y2 + len, 'cge-tick'));
    if (isMid)   elements.push(line(px, y, px, y2, 'cge-grid-minor'));
    if (isMajor) elements.push(line(px, y, px, y2, 'cge-grid'));
  }
  for (let kgm = 200; kgm <= LAYOUT.moment.max_kgm; kgm += 100) {
    const px = mapMomentX(kgm);
    elements.push(txt(px, y2 + 17, 'cge-axis-tick', String(kgm), { 'text-anchor': 'middle' }));
  }
  elements.push(txt(x + cr().w / 2, y2 + 32, 'cge-axis-label', 'Moment kg·m', { 'text-anchor': 'middle' }));

  // ── Top axis: lb·ft ticks mirroring bottom ──
  for (let kgm = LAYOUT.moment.min_kgm; kgm <= LAYOUT.moment.max_kgm; kgm += 25) {
    const px = mapMomentX(kgm);
    const isMajor = kgm % 100 === 0;
    const isMid   = !isMajor && kgm % 50 === 0;
    const len = isMajor ? 7 : isMid ? 5 : 3;
    elements.push(line(px, y, px, y - len, 'cge-tick'));
  }
  for (let kgm = 200; kgm <= LAYOUT.moment.max_kgm; kgm += 100) {
    const px   = mapMomentX(kgm);
    const lbft = Math.round(kgm * KGM_TO_LBFT / 50) * 50;
    elements.push(txt(px, y - 9, 'cge-axis-tick', String(lbft), { 'text-anchor': 'middle' }));
  }
  elements.push(txt(x + cr().w / 2, y - 22, 'cge-axis-label', 'Moment lb·ft', { 'text-anchor': 'middle' }));

  // ── Left axis: minor (25 kg), mid (50 kg), major (100 kg) ──
  const minKg     = LAYOUT.weight.min_kg;                                   // always multiple of 25
  const majorStart = Math.ceil(minKg / 100) * 100;
  const midStart   = (majorStart - 50 >= minKg) ? majorStart - 50 : majorStart + 50;

  for (let kg = minKg; kg <= LAYOUT.weight.max_kg; kg += 25) {
    elements.push(line(x - 3, mapWeightY(kg), x, mapWeightY(kg), 'cge-tick'));
  }
  for (let kg = midStart; kg <= LAYOUT.weight.max_kg; kg += 100) {
    const py = mapWeightY(kg);
    elements.push(line(x - 5, py, x, py, 'cge-tick'));
    elements.push(line(x, py, x2, py, 'cge-grid-minor'));
  }
  for (let kg = majorStart; kg <= LAYOUT.weight.max_kg; kg += 100) {
    const py = mapWeightY(kg);
    elements.push(line(x - 7, py, x, py, 'cge-tick'));
    elements.push(line(x, py, x2, py, 'cge-grid'));
    elements.push(txt(x - 5, py + 4, 'cge-axis-tick', String(kg), { 'text-anchor': 'end' }));
  }
  const midY = y + cr().h / 2;
  elements.push(el('text', {
    x: 22, y: midY, class: 'cge-axis-vert-label',
    transform: `rotate(-90, 22, ${midY})`, 'text-anchor': 'middle',
  }, ['Weight kg']));

  // ── Right axis: mirroring left ──
  for (let kg = minKg; kg <= LAYOUT.weight.max_kg; kg += 25) {
    elements.push(line(x2, mapWeightY(kg), x2 + 3, mapWeightY(kg), 'cge-tick'));
  }
  for (let kg = midStart; kg <= LAYOUT.weight.max_kg; kg += 100) {
    elements.push(line(x2, mapWeightY(kg), x2 + 5, mapWeightY(kg), 'cge-tick'));
  }
  for (let kg = majorStart; kg <= LAYOUT.weight.max_kg; kg += 100) {
    const py = mapWeightY(kg);
    const lb = Math.round(kg * KG_TO_LB / 10) * 10;
    elements.push(line(x2, py, x2 + 7, py, 'cge-tick'));
    elements.push(txt(x2 + 5, py + 4, 'cge-axis-tick-secondary', String(lb), { 'text-anchor': 'start' }));
  }
  elements.push(el('text', {
    x: LAYOUT.viewBox.w - 22, y: midY, class: 'cge-axis-vert-label',
    transform: `rotate(90, ${LAYOUT.viewBox.w - 22}, ${midY})`, 'text-anchor': 'middle',
  }, ['lb']));

  return el('g', {}, elements);
}

// ─── Reference lines ───────────────────────────────────────────────────────

function buildReferenceLines(mtow_lb, mtow_kg, ew_lb, ew_kg) {
  const { x, x2 } = cr();
  const elements = [];

  const refs = [
    { kg: mtow_kg, label: `MTOW ${formatNumber(mtow_lb, 0)} lb / ${formatNumber(mtow_kg, 0)} kg`, klass: 'cge-ref-mtow', right: false },
    { kg: MZFW_KG, label: `MZFW ${P2006T.mzfw_lb} lb / ${formatNumber(MZFW_KG, 0)} kg`,           klass: 'cge-ref-mzfw', right: false },
    { kg: ew_kg,   label: `BEW ${formatNumber(ew_lb, 0)} lb / ${formatNumber(ew_kg, 0)} kg`,       klass: 'cge-ref-ew',   right: true  },
  ];
  for (const ref of refs) {
    const py = mapWeightY(ref.kg);
    const lx = ref.right ? x2 - 4 : x + 4;
    const anchor = ref.right ? 'end' : 'start';
    elements.push(line(x, py, x2, py, ref.klass));
    elements.push(txt(lx, py - 4, `cge-ref-label ${ref.klass}`, ref.label, { 'text-anchor': anchor }));
  }

  return el('g', {}, elements);
}

// ─── Markers ───────────────────────────────────────────────────────────────

const R = 6;

function cross(cx, cy) {
  return el('g', {}, [
    line(cx - R, cy, cx + R, cy, 'cge-cross'),
    line(cx, cy - R, cx, cy + R, 'cge-cross'),
  ]);
}

function markerKlass(inEnvelope) {
  return `cge-marker ${inEnvelope ? 'cge-marker--ok' : 'cge-marker--warn'}`;
}

// TOW: circle + cross
function towMarker(cx, cy, inEnvelope) {
  return el('g', { class: markerKlass(inEnvelope) }, [
    el('circle', { cx, cy, r: R, class: 'cge-marker-shape' }),
    cross(cx, cy),
  ]);
}

// LDW: axis-aligned square + cross
function ldwMarker(cx, cy, inEnvelope) {
  return el('g', { class: markerKlass(inEnvelope) }, [
    el('rect', { x: cx - R, y: cy - R, width: R * 2, height: R * 2, class: 'cge-marker-shape' }),
    cross(cx, cy),
  ]);
}

// ZFW: diamond (rotated square) + cross
function zfwMarker(cx, cy, inEnvelope) {
  const pts = `${cx},${cy - R} ${cx + R},${cy} ${cx},${cy + R} ${cx - R},${cy}`;
  return el('g', { class: markerKlass(inEnvelope) }, [
    el('polygon', { points: pts, class: 'cge-marker-shape' }),
    cross(cx, cy),
  ]);
}


function markerLabel(cx, cy, label) {
  return txt(cx + R + 5, cy + 4, 'cge-marker-label', label);
}

function buildWeightLine(px, py, weight_lb, condKlass) {
  const { x, x2 } = cr();
  const label = `${formatNumber(weight_lb, 0)} lb / ${formatNumber(lbToKg(weight_lb), 0)} kg`;
  const lx = x + (x2 - x) * 0.75;
  return el('g', {}, [
    line(x, py, x2, py, `cge-wt-line ${condKlass}`),
    el('text', {
      x: lx, y: py + 10, class: `cge-wt-label ${condKlass}`,
      'text-anchor': 'middle',
    }, [label]),
  ]);
}

// ─── Public API ────────────────────────────────────────────────────────────

export function renderCgEnvelope(target, state) {
  const mtow_lb = state.mtow?.weight_lb || P2006T.mtow_lb;
  const mtow_kg = mtow_lb / KG_TO_LB;

  const ew    = state.empty;
  const ewKg  = ew.weight_lb / KG_TO_LB;

  LAYOUT.weight.max_kg = dynamicMaxKg(mtow_kg);
  LAYOUT.weight.min_kg = dynamicMinKg(ewKg);

  const conds = computeAll(state);
  const { takeoff: to, landing: ldw, zeroFuel: zfw } = conds;

  function pt(cond) {
    const kgm = cond.moment_lb_ft / KGM_TO_LBFT;
    const kg  = cond.weight_lb    / KG_TO_LB;
    return { x: mapMomentX(kgm), y: mapWeightY(kg), inEnvelope: cond.inEnvelope };
  }

  const towPt = pt(to);
  const ldwPt = pt(ldw);
  const zfwPt = pt(zfw);

  const { w, h } = LAYOUT.viewBox;
  const svg = el('svg', {
    viewBox: `0 0 ${w} ${h}`,
    class: 'cg-envelope-svg',
    role: 'img',
    'aria-label': 'Tecnam P2006T CG envelope — weight vs moment',
  });

  svg.appendChild(buildEnvelope(mtow_kg));
  svg.appendChild(buildAxes());
  svg.appendChild(buildReferenceLines(mtow_lb, mtow_kg, ew.weight_lb, ewKg));

  // Weight lines (drawn before markers so markers sit on top)
  svg.appendChild(buildWeightLine(towPt.x, towPt.y, to.weight_lb,  'cge-wt-line--tow'));
  svg.appendChild(buildWeightLine(ldwPt.x, ldwPt.y, ldw.weight_lb, 'cge-wt-line--ldw'));
  svg.appendChild(buildWeightLine(zfwPt.x, zfwPt.y, zfw.weight_lb, 'cge-wt-line--zfw'));

  // Burnoff line: TOW → LDW → ZFW
  svg.appendChild(el('polyline', {
    points: `${towPt.x},${towPt.y} ${ldwPt.x},${ldwPt.y} ${zfwPt.x},${zfwPt.y}`,
    class: 'cge-burnoff',
  }));

  // Markers first, then all labels on top
  svg.appendChild(zfwMarker(zfwPt.x, zfwPt.y, zfwPt.inEnvelope));
  svg.appendChild(ldwMarker(ldwPt.x, ldwPt.y, ldwPt.inEnvelope));
  svg.appendChild(towMarker(towPt.x, towPt.y, towPt.inEnvelope));
  svg.appendChild(markerLabel(zfwPt.x, zfwPt.y, 'ZFW'));
  svg.appendChild(markerLabel(ldwPt.x, ldwPt.y, 'LDW'));
  svg.appendChild(markerLabel(towPt.x, towPt.y, 'TOW'));

  target.replaceChildren(svg);
}
