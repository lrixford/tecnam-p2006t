import { P2006T } from './data/p2006t.js';
import { computeAll } from './loadingCondition.js';
import { lbToKg, ftToM, formatNumber } from './units.js';

// Chart layout in SVG user units. viewBox: 0 0 1200 620.
export const LAYOUT = {
  viewBox: { w: 1200, h: 634 },

  chart: {
    xLeft: 80, xRight: 1180,
    yTop: 40,  yBottom: 540,
    momentMin_lb_ft: 1100,
    momentMax_lb_ft: 3700,
  },

  flightMass: {
    xLeft: 880, xRight: 1180,
    weightMin_lb: 1700,
    weightMax_lb: 2800,
  },
};

// Per-strip metadata. `sum(state)` produces the strip's combined mass in lb.
// Strips are drawn in order (front → rear → fuel → bag).
const FUEL_DENSITY = P2006T.fuel.density_lb_per_gal;

export const STRIPS = [
  {
    id: 'front', label: 'OCCUPANTS FRONT SEATS',
    xLeft: 80,  xRight: 300,
    massMax_lb: 485, arm_ft: P2006T.arms_ft.pilot,
    sum: (s) => s.pilot.weight_lb + s.copilot.weight_lb,
  },
  {
    id: 'rear', label: 'OCCUPANTS REAR SEATS',
    xLeft: 310, xRight: 510,
    massMax_lb: 485, arm_ft: P2006T.arms_ft.rearLH,
    sum: (s) => s.rearLH.weight_lb + s.rearRH.weight_lb,
  },
  {
    id: 'fuel', label: 'FUEL',
    xLeft: 520, xRight: 700,
    massMax_lb: 345, arm_ft: P2006T.arms_ft.fuel,
    sum: (s) => (s.fuelL.volume_gal + s.fuelR.volume_gal) * FUEL_DENSITY,
  },
  {
    id: 'bag', label: 'BAGGAGE',
    xLeft: 710, xRight: 850,
    massMax_lb: 176, arm_ft: P2006T.arms_ft.baggage, axisStepKg: 20,
    sum: (s) => s.baggage.weight_lb,
  },
];

// ─────────── Pure coordinate helpers ───────────

// Clip a line segment to an axis-aligned rectangle using parametric clipping.
// Returns the clipped endpoints, or null if entirely outside.
function clipLineToRect(x1, y1, x2, y2, xMin, xMax, yMin, yMax) {
  const dx = x2 - x1, dy = y2 - y1;
  let tMin = 0, tMax = 1;
  if (Math.abs(dx) > 1e-9) {
    const ta = (xMin - x1) / dx, tb = (xMax - x1) / dx;
    tMin = Math.max(tMin, Math.min(ta, tb));
    tMax = Math.min(tMax, Math.max(ta, tb));
  }
  if (Math.abs(dy) > 1e-9) {
    const ta = (yMin - y1) / dy, tb = (yMax - y1) / dy;
    tMin = Math.max(tMin, Math.min(ta, tb));
    tMax = Math.min(tMax, Math.max(ta, tb));
  }
  if (tMin >= tMax) return null;
  return {
    x1: x1 + tMin * dx, y1: y1 + tMin * dy,
    x2: x1 + tMax * dx, y2: y1 + tMax * dy,
  };
}

export function mapMomentY(moment_lb_ft) {
  const { yTop, yBottom, momentMin_lb_ft, momentMax_lb_ft } = LAYOUT.chart;
  const span = momentMax_lb_ft - momentMin_lb_ft;
  const t = (moment_lb_ft - momentMin_lb_ft) / span;
  return yBottom - t * (yBottom - yTop);
}

export function mapMassX(strip, mass_lb) {
  const t = mass_lb / strip.massMax_lb;
  return strip.xLeft + t * (strip.xRight - strip.xLeft);
}

export function mapFlightMassX(weight_lb) {
  const { xLeft, xRight, weightMin_lb, weightMax_lb } = LAYOUT.flightMass;
  const t = (weight_lb - weightMin_lb) / (weightMax_lb - weightMin_lb);
  return xLeft + t * (xRight - xLeft);
}

// ─────────── Trajectory builder (pure) ───────────

// Walk the strips cumulatively. Returns one hop per strip plus the final
// running moment (= takeoff total moment). `fuelOverride_lb` lets the
// caller produce the no-fuel trajectory using the same code.
export function computeHops(state, fuelOverride_lb) {
  let runningMoment = state.empty.moment_lb_ft;
  const entryY = mapMomentY(runningMoment);
  const hops = [];

  for (const strip of STRIPS) {
    let mass = strip.sum(state);
    if (strip.id === 'fuel' && fuelOverride_lb !== undefined) mass = fuelOverride_lb;

    const armDelta = mass * strip.arm_ft;
    const exitMoment = runningMoment + armDelta;

    const startY = mapMomentY(runningMoment);
    const exitY = mapMomentY(exitMoment);
    const exitX = mapMassX(strip, mass);

    hops.push({
      id: strip.id, mass_lb: mass,
      diag: { x1: strip.xLeft, y1: startY, x2: exitX, y2: exitY },
      rest: { x1: exitX, y1: exitY, x2: strip.xRight, y2: exitY },
      plumb: { x: exitX, y1: exitY, y2: LAYOUT.chart.yBottom },
    });

    runningMoment = exitMoment;
  }

  return { hops, runningMoment, entryY };
}

export function computeTrajectory(state) {
  const conditions = computeAll(state);
  const fuel_lb_total = conditions.takeoff.fuel_lb;

  const to_path  = computeHops(state, fuel_lb_total);
  const ldg_path = computeHops(state, conditions.landing.fuel_lb);
  const zfw_path = computeHops(state, 0);

  const project = (cond) => ({
    x: mapFlightMassX(cond.weight_lb),
    y: mapMomentY(cond.moment_lb_ft),
    ...cond,
  });

  return {
    to_path,
    ldg_path,
    zfw_path,
    to:  project(conditions.takeoff),
    ldg: project(conditions.landing),
    zfw: project(conditions.zeroFuel),
  };
}

// ─────────── SVG rendering ───────────

const SVG_NS = 'http://www.w3.org/2000/svg';

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

function text(x, y, klass, content) {
  return el('text', { x, y, class: klass }, [content]);
}

// Generate a parallel rail family for a strip, clipped to the strip box.
function railFamily(strip, intervalLbFt = 200) {
  const yPerLbFt =
    (LAYOUT.chart.yBottom - LAYOUT.chart.yTop) /
    (LAYOUT.chart.momentMax_lb_ft - LAYOUT.chart.momentMin_lb_ft);
  const dy_full = -strip.arm_ft * strip.massMax_lb * yPerLbFt;
  const stepY = intervalLbFt * yPerLbFt;
  const yMargin = Math.abs(dy_full) + 50;
  const lines = [];
  for (let y0 = LAYOUT.chart.yTop - yMargin; y0 <= LAYOUT.chart.yBottom + yMargin; y0 += stepY) {
    lines.push(line(strip.xLeft, y0, strip.xRight, y0 + dy_full, 'nm-rail'));
  }
  return el('g', { 'clip-path': `url(#nm-clip-${strip.id})` }, lines);
}

function buildClipDefs() {
  const clips = STRIPS.map((s) =>
    el('clipPath', { id: `nm-clip-${s.id}` }, [
      el('rect', {
        x: s.xLeft, y: LAYOUT.chart.yTop,
        width: s.xRight - s.xLeft,
        height: LAYOUT.chart.yBottom - LAYOUT.chart.yTop,
      }),
    ]),
  );
  // Also a clip for the CG strip (so MAC diagonals don't leak outside)
  clips.push(
    el('clipPath', { id: 'nm-clip-cg' }, [
      el('rect', {
        x: LAYOUT.flightMass.xLeft, y: LAYOUT.chart.yTop,
        width: LAYOUT.flightMass.xRight - LAYOUT.flightMass.xLeft,
        height: LAYOUT.chart.yBottom - LAYOUT.chart.yTop,
      }),
    ]),
  );
  return el('defs', {}, clips);
}

function buildYAxis() {
  const { yTop, yBottom } = LAYOUT.chart;
  const lbFtPerKgM = 7.23301;
  const ticks = [];
  for (let m = 1100; m <= 3700; m += 400) {
    const y = mapMomentY(m);
    ticks.push(text(60, y + 4, 'nm-axis-tick', String(m)));
    ticks.push(text(36, y + 4, 'nm-axis-tick-secondary', formatNumber(m / lbFtPerKgM, 0)));
  }
  const midY = (yTop + yBottom) / 2;
  return el('g', {}, [
    line(LAYOUT.chart.xLeft, yTop, LAYOUT.chart.xLeft, yBottom, 'nm-axis'),
    text(60, 35, 'nm-axis-label', 'lb·ft'),
    text(36, 35, 'nm-axis-label-secondary', 'kg·m'),
    el('text', { x: 8, y: midY, class: 'nm-axis-vert-label', transform: `rotate(-90, 8, ${midY})` },
      ['EMPTY A/C MOMENT TO DATUM']),
    ...ticks,
  ]);
}

function buildStripBox(strip) {
  return el('rect', {
    x: strip.xLeft, y: LAYOUT.chart.yTop,
    width: strip.xRight - strip.xLeft,
    height: LAYOUT.chart.yBottom - LAYOUT.chart.yTop,
    class: 'nm-strip-box',
  });
}

function buildStripHeader(strip) {
  const cx = (strip.xLeft + strip.xRight) / 2;
  return text(cx, LAYOUT.chart.yTop + 15, 'nm-strip-header', strip.label);
}

function buildCgStripHeader() {
  const { xLeft, xRight } = LAYOUT.flightMass;
  const cx = (xLeft + xRight) / 2;
  return text(cx, LAYOUT.chart.yTop + 15, 'nm-strip-header', 'C.G LIMITS');
}

function buildStripXAxis(strip) {
  const { yTop, yBottom } = LAYOUT.chart;
  const cx = (strip.xLeft + strip.xRight) / 2;
  const KG_TO_LB = 2.20462;
  const maxKg = lbToKg(strip.massMax_lb);
  const stepKg = strip.axisStepKg ?? 40;
  const elements = [
    line(strip.xLeft, yBottom, strip.xRight, yBottom, 'nm-axis'),
    line(strip.xLeft, yTop,    strip.xRight, yTop,    'nm-axis'),
  ];

  for (let kg = 0; kg < maxKg; kg += stepKg) {
    const mass_lb = kg * KG_TO_LB;
    const x = mapMassX(strip, mass_lb);
    if (kg > 0) {
      elements.push(line(x, yTop, x, yBottom, 'nm-tick-grid'));
      elements.push(line(x, yBottom, x, yBottom + 2, 'nm-axis-tick-mark'));
      elements.push(line(x, yTop,    x, yTop    - 2, 'nm-axis-tick-mark'));
    }
    elements.push(text(x, yBottom + 16, 'nm-axis-tick',     formatNumber(mass_lb, 0)));
    elements.push(text(x, yTop    -  4, 'nm-axis-tick-top', String(kg)));
  }
  elements.push(text(cx, yBottom + 30, 'nm-axis-label',     'lb'));
  elements.push(text(cx, yTop    - 16, 'nm-axis-label-top', 'kg'));

  return el('g', {}, elements);
}

function buildCgStrip(traj, mtow_lb) {
  const { xLeft, xRight, weightMin_lb, weightMax_lb } = LAYOUT.flightMass;
  const { yTop, yBottom } = LAYOUT.chart;
  const cx = (xLeft + xRight) / 2;

  const elements = [
    el('rect', {
      x: xLeft, y: yTop,
      width: xRight - xLeft,
      height: yBottom - yTop,
      class: 'nm-strip-box',
    }),
  ];

  // Out-of-bounds CG shading — drawn before MAC lines so lines paint on top
  const fwdArm = P2006T.envelope.fwd_arm_ft;
  const aftArm = P2006T.envelope.aft_arm_ft;
  const fwdX1 = mapFlightMassX(weightMin_lb), fwdY1 = mapMomentY(weightMin_lb * fwdArm);
  const fwdX2 = mapFlightMassX(weightMax_lb), fwdY2 = mapMomentY(weightMax_lb * fwdArm);
  const aftX1 = mapFlightMassX(weightMin_lb), aftY1 = mapMomentY(weightMin_lb * aftArm);
  const aftX2 = mapFlightMassX(weightMax_lb), aftY2 = mapMomentY(weightMax_lb * aftArm);
  // Forward violation: below fwd limit line (low moment = forward CG)
  elements.push(el('polygon', {
    points: `${fwdX1},${fwdY1} ${fwdX2},${fwdY2} ${xRight},${yBottom} ${xLeft},${yBottom}`,
    class: 'nm-cg-shade',
    'clip-path': 'url(#nm-clip-cg)',
  }));
  // Aft violation: above aft limit line (high moment = aft CG)
  elements.push(el('polygon', {
    points: `${aftX1},${aftY1} ${aftX2},${aftY2} ${xRight},${yTop} ${xLeft},${yTop}`,
    class: 'nm-cg-shade',
    'clip-path': 'url(#nm-clip-cg)',
  }));

  // MAC diagonals: moment = weight × arm_ft. Label centered on the visible (clipped) segment.
  const macLines = [
    { arm: fwdArm,                            klass: 'nm-mac-fwd',    label: '16.5% MAC' },
    { arm: 0.23 * P2006T.mac.chord_ft,        klass: 'nm-mac-ref',    label: '23% MAC'   },
    { arm: aftArm,                            klass: 'nm-mac-aft',    label: '31% MAC'   },
    { arm: P2006T.envelope.structural_arm_ft, klass: 'nm-mac-struct', label: '37% MAC'   },
  ];
  for (const mac of macLines) {
    const m1 = weightMin_lb * mac.arm;
    const m2 = weightMax_lb * mac.arm;
    const x1s = mapFlightMassX(weightMin_lb), y1s = mapMomentY(m1);
    const x2s = mapFlightMassX(weightMax_lb), y2s = mapMomentY(m2);
    const angle = Math.atan2(y2s - y1s, x2s - x1s) * 180 / Math.PI;
    // Center the label on the visible clipped segment so it doesn't drift off the line
    const clipped = clipLineToRect(x1s, y1s, x2s, y2s, xLeft, xRight, yTop, yBottom);
    const lx = clipped ? (clipped.x1 + clipped.x2) / 2 : x1s + 0.5 * (x2s - x1s);
    const ly = clipped ? (clipped.y1 + clipped.y2) / 2 : y1s + 0.5 * (y2s - y1s);
    elements.push(
      el('g', { 'clip-path': 'url(#nm-clip-cg)' }, [
        line(x1s, y1s, x2s, y2s, mac.klass),
      ]),
      el('text', {
        x: lx, y: ly - 5,
        class: `nm-mac-label ${mac.klass}-label`,
        transform: `rotate(${angle.toFixed(1)}, ${lx}, ${ly - 5})`,
      }, [mac.label]),
    );
  }

  // MTOW vertical reference line
  const mtowX = mapFlightMassX(mtow_lb);
  const refLabelY = yTop + (yBottom - yTop) / 3;
  elements.push(
    line(mtowX, yTop, mtowX, yBottom, 'nm-mass-ref'),
    el('text', {
      x: mtowX + 6, y: refLabelY, class: 'nm-mass-ref-label',
      transform: `rotate(90, ${mtowX + 6}, ${refLabelY})`,
    }, [`MTOW ${mtow_lb} lb`]),
  );

  // X-axis: lb at bottom, kg at top
  elements.push(line(xLeft, yBottom, xRight, yBottom, 'nm-axis'));
  elements.push(line(xLeft, yTop, xRight, yTop, 'nm-axis'));
  for (let w = weightMin_lb; w <= weightMax_lb; w += 200) {
    const x = mapFlightMassX(w);
    elements.push(text(x, yBottom + 14, 'nm-axis-tick', String(w)));
    elements.push(text(x, yTop - 4,     'nm-axis-tick-top', formatNumber(lbToKg(w), 0)));
  }
  elements.push(text(cx, yBottom + 30, 'nm-axis-label', 'FLIGHT MASS — lb'));
  elements.push(text(cx, yTop - 16,    'nm-axis-label-top', 'kg'));

  return el('g', {}, elements);
}

function buildPath(hops, klass) {
  // Skip degenerate hops (zero mass produces a zero-length diag, which is fine but visually noisy)
  const segs = [];
  for (const h of hops) {
    segs.push(line(h.diag.x1, h.diag.y1, h.diag.x2, h.diag.y2, klass));
    segs.push(line(h.rest.x1, h.rest.y1, h.rest.x2, h.rest.y2, klass));
  }
  return el('g', {}, segs);
}

function buildPlumbs(hops) {
  const { yTop, yBottom } = LAYOUT.chart;
  const labelY = yTop + (yBottom - yTop) / 3;
  const elements = [];

  for (const h of hops) {
    if (h.mass_lb <= 0) continue;
    const strip = STRIPS.find((s) => s.id === h.id);
    const midX = strip ? (strip.xLeft + strip.xRight) / 2 : h.plumb.x;
    // Left half of strip → label to the right; right half → label to the left
    const lx = h.plumb.x + (h.plumb.x <= midX ? 8 : -13);
    elements.push(
      line(h.plumb.x, yTop, h.plumb.x, yBottom, 'nm-plumb'),
      el('text', {
        x: lx, y: labelY, class: 'nm-plumb-label',
        transform: `rotate(90, ${lx}, ${labelY})`,
      }, [`${formatNumber(h.mass_lb, 0)} lb / ${formatNumber(lbToKg(h.mass_lb), 0)} kg`]),
    );
  }
  return el('g', {}, elements);
}

function buildCgPoints(traj) {
  const elements = [];
  const { to, ldg, zfw } = traj;
  const xL = LAYOUT.flightMass.xLeft;
  const burnoff = ldg.weight_lb !== to.weight_lb;

  // Horizontal arrival lines across the CG/Flight Mass strip
  elements.push(line(xL, to.y, to.x, to.y,
    traj.to.inEnvelope ? 'nm-to-line' : 'nm-violation-line'));
  if (burnoff) {
    elements.push(line(xL, ldg.y, ldg.x, ldg.y,
      traj.ldg.inEnvelope ? 'nm-ldg-line' : 'nm-violation-line'));
  }
  elements.push(line(xL, zfw.y, zfw.x, zfw.y,
    traj.zfw.inEnvelope ? 'nm-zfw-line' : 'nm-violation-line'));

  // Burnoff line from TO through LDG to ZFW
  elements.push(line(to.x, to.y, zfw.x, zfw.y, 'nm-burnoff'));

  // Plumb from TO circle to bottom
  elements.push(line(to.x, to.y, to.x, LAYOUT.chart.yBottom, 'nm-cg-plumb'));

  // Circles (drawn last so they sit on top of the lines)
  elements.push(el('circle', {
    cx: to.x, cy: to.y, r: 6,
    class: traj.to.inEnvelope ? 'nm-to-circle' : 'nm-to-circle nm-violation',
  }));
  elements.push(el('circle', {
    cx: zfw.x, cy: zfw.y, r: 6,
    class: traj.zfw.inEnvelope ? 'nm-zfw-circle' : 'nm-zfw-circle nm-violation',
  }));
  if (burnoff) {
    elements.push(el('circle', {
      cx: ldg.x, cy: ldg.y, r: 6,
      class: traj.ldg.inEnvelope ? 'nm-ldg-circle' : 'nm-ldg-circle nm-violation',
    }));
  }

  // Condition labels centered on each horizontal line in the CG strip
  elements.push(el('text', {
    x: (xL + to.x) / 2, y: to.y - 4, class: 'nm-cond-label nm-cond-label--to',
  }, [`Takeoff  ${formatNumber(to.cg_pct_mac, 1)}% MAC`]));
  elements.push(el('text', {
    x: (xL + zfw.x) / 2, y: zfw.y - 4, class: 'nm-cond-label nm-cond-label--zfw',
  }, [`Zero Fuel  ${formatNumber(zfw.cg_pct_mac, 1)}% MAC`]));
  if (burnoff) {
    elements.push(el('text', {
      x: (xL + ldg.x) / 2, y: ldg.y - 4, class: 'nm-cond-label nm-cond-label--ldg',
    }, [`Landing  ${formatNumber(ldg.cg_pct_mac, 1)}% MAC`]));
  }

  // Vertical weight lines + rotated labels for each condition
  const { yTop, yBottom } = LAYOUT.chart;
  const wtLabelY = yTop + (yBottom - yTop) / 3;

  const wtLines = [
    { x: to.x,  label: `${formatNumber(to.weight_lb,  0)} lb / ${formatNumber(lbToKg(to.weight_lb),  0)} kg`, cls: 'nm-wt-line--to'  },
    { x: zfw.x, label: `${formatNumber(zfw.weight_lb, 0)} lb / ${formatNumber(lbToKg(zfw.weight_lb), 0)} kg`, cls: 'nm-wt-line--zfw' },
  ];
  if (burnoff) {
    wtLines.push({ x: ldg.x, label: `${formatNumber(ldg.weight_lb, 0)} lb / ${formatNumber(lbToKg(ldg.weight_lb), 0)} kg`, cls: 'nm-wt-line--ldg' });
  }

  for (const wt of wtLines) {
    elements.push(
      line(wt.x, yTop, wt.x, yBottom, `nm-wt-line ${wt.cls}`),
      el('text', {
        x: wt.x - 12, y: wtLabelY, class: `nm-wt-label ${wt.cls}`,
        transform: `rotate(90, ${wt.x - 12}, ${wtLabelY})`,
      }, [wt.label]),
    );
  }

  return el('g', {}, elements);
}

function buildTitle() {
  return text(LAYOUT.viewBox.w / 2, 8, 'nm-title',
    'MASS & BALANCE — LOADING CONDITION');
}

export function buildSvg(state) {
  const traj = computeTrajectory(state);

  const svg = el('svg', {
    viewBox: `0 -10 ${LAYOUT.viewBox.w} ${LAYOUT.viewBox.h + 10}`,
    class: 'nomograph',
    role: 'img',
    'aria-label': 'Tecnam P2006T loading condition nomograph',
  });

  svg.appendChild(buildClipDefs());
  svg.appendChild(buildTitle());
  svg.appendChild(buildYAxis());

  // Strips (boxes + rails + x-axes) — headers deferred to paint last
  const headers = [];
  for (let i = 0; i < STRIPS.length; i++) {
    const strip = STRIPS[i];
    const g = el('g', {});
    g.appendChild(buildStripBox(strip));
    g.appendChild(railFamily(strip));
    g.appendChild(buildStripXAxis(strip));
    svg.appendChild(g);
    headers.push(buildStripHeader(strip));
  }

  // CG strip
  svg.appendChild(buildCgStrip(traj, state.mtow?.weight_lb || P2006T.mtow_lb));

  // Trajectories — ZFW and LDG first, TO last so blue overpaints in shared regions.
  // Only draw fuel + bag hops for ZFW/LDG (front/rear coincide with TO path).
  const zfwHopsToDraw = traj.zfw_path.hops.filter((h) => h.id === 'fuel' || h.id === 'bag');
  svg.appendChild(buildPath(zfwHopsToDraw, 'nm-zfw-path'));

  const ldgHopsToDraw = traj.ldg_path.hops.filter((h) => h.id === 'fuel' || h.id === 'bag');
  svg.appendChild(buildPath(ldgHopsToDraw, 'nm-ldg-path'));

  svg.appendChild(buildPath(traj.to_path.hops, 'nm-to-path'));
  svg.appendChild(buildPlumbs(traj.to_path.hops));

  // Empty-moment entry dot, tick, and label at left edge
  const emY      = traj.to_path.entryY;
  const emMoment = state.empty.moment_lb_ft;
  const lbFtPerKgM = 7.23301;
  svg.appendChild(el('circle', { cx: LAYOUT.chart.xLeft, cy: emY, r: 3, class: 'nm-entry' }));
  svg.appendChild(el('g', {}, [
    line(LAYOUT.chart.xLeft - 14, emY, LAYOUT.chart.xLeft, emY, 'nm-em-tick'),
    el('text', { x: LAYOUT.chart.xLeft - 16, y: emY - 8, class: 'nm-em-label', 'text-anchor': 'end' }, ['Empty Moment']),
    el('text', { x: LAYOUT.chart.xLeft - 16, y: emY + 1, class: 'nm-em-value', 'text-anchor': 'end' }, [`${formatNumber(emMoment, 0)} lb·ft`]),
    el('text', { x: LAYOUT.chart.xLeft - 16, y: emY + 9, class: 'nm-em-value', 'text-anchor': 'end' }, [`${formatNumber(emMoment / lbFtPerKgM, 0)} kg·m`]),
  ]));

  svg.appendChild(buildCgPoints(traj));

  // Draw all strip headers last so they sit on top of rails, plumbs, and trajectories
  for (const h of headers) svg.appendChild(h);
  svg.appendChild(buildCgStripHeader());

  svg.appendChild(text(
    LAYOUT.viewBox.w / 2, LAYOUT.chart.yBottom + 46,
    'nm-disclaimer',
    'For reference only, your AFM/POH is the final authority. Always verify before flight.',
  ));

  return svg;
}

export function renderNomograph(target, state) {
  const svg = buildSvg(state);
  target.replaceChildren(svg);
}

// ─────────── Output panel ───────────

function buildConditionRow(label, cond) {
  const row = document.createElement('div');
  row.className = `lc-row lc-row--${label.toLowerCase()}` + (cond.inEnvelope ? '' : ' warn');

  row.innerHTML = `
    <span class="lc-label">${label}</span>
    <span class="lc-values">
      <span class="lc-w">${formatNumber(cond.weight_lb, 0)} lb / ${formatNumber(lbToKg(cond.weight_lb), 0)} kg</span>
      <span class="lc-sep">·</span>
      <span class="lc-m">${formatNumber(cond.moment_lb_ft, 0)} lb·ft / ${formatNumber(cond.moment_lb_ft / 7.23301, 0)} kg·m</span>
      <span class="lc-sep">·</span>
      <span class="lc-cg">${formatNumber(cond.cg_arm_ft, 3)} ft / ${formatNumber(ftToM(cond.cg_arm_ft), 3)} m</span>
    </span>
    <span class="lc-mac">${formatNumber(cond.cg_pct_mac, 1)}% MAC</span>
    <span class="lc-status">${cond.inEnvelope ? '✓ in envelope' : '✗ out of envelope'}</span>
  `;
  return row;
}

export function renderOutputPanel(target, state) {
  const conditions = computeAll(state);
  const panel = document.createElement('section');
  panel.className = 'loading-condition';
  panel.setAttribute('aria-live', 'polite');
  panel.innerHTML = `<header class="lc-header">LOADING CONDITION</header>`;
  panel.appendChild(buildConditionRow('RAMP', conditions.ramp));
  panel.appendChild(buildConditionRow('TO',    conditions.takeoff));
  panel.appendChild(buildConditionRow('LDG',   conditions.landing));
  panel.appendChild(buildConditionRow('ZFW',   conditions.zeroFuel));
  target.replaceChildren(panel);
}
