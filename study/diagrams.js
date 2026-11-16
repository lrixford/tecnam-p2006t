// Schematic diagrams for the critical-engine (PAST) cards.
//
// These are deliberately plain: bars and circles standing in for a conventional
// twin whose propellers both turn clockwise as seen from behind. They show
// where each force acts, not what the airplane looks like.
//
// There are eight: each of the four PAST factors, drawn once with the left
// engine failed and once with the right engine failed. The drawings and their
// captions never name the factor or say "yaw" or "roll", because the picture
// cards ask the reader to work that out.
//
// Colours come from study.css through the d-* classes, so the drawings follow
// the light and dark themes.

const CENTER = 160;
const ENGINE_X = { left: 100, right: 220 };
const other = (side) => (side === 'left' ? 'right' : 'left');

const DEFS = `
  <defs>
    <marker id="d-head-force" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5.5" markerHeight="5.5" orient="auto-start-reverse"><path class="d-fill-force" d="M0 0 10 5 0 10z"/></marker>
    <marker id="d-head-warn" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5.5" markerHeight="5.5" orient="auto-start-reverse"><path class="d-fill-warn" d="M0 0 10 5 0 10z"/></marker>
    <marker id="d-head-ink" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path class="d-fill-ink" d="M0 0 10 5 0 10z"/></marker>
  </defs>`;

const svg = (height, label, body) =>
  `<svg viewBox="0 0 320 ${height}" role="img" aria-label="${label}">${DEFS}${body}</svg>`;

const text = (x, y, s, cls = '') => `<text class="d-text ${cls}" x="${x}" y="${y}" text-anchor="middle">${s}</text>`;

const cross = (x, y, r) =>
  `<path class="d-warn" d="M${x - r} ${y - r}L${x + r} ${y + r}M${x + r} ${y - r}L${x - r} ${y + r}" stroke-width="3"/>`;

const engineLabels = (failed, y, leftX = ENGINE_X.left, rightX = ENGINE_X.right) =>
  text(leftX, y, failed === 'left' ? 'left, failed' : 'left, running') +
  text(rightX, y, failed === 'right' ? 'right, failed' : 'right, running');

/* Looking down on the airplane, nose toward the top of the drawing. */
function topView(failed, labelY, extra) {
  const engines = ['left', 'right']
    .map((side) => {
      const cx = ENGINE_X[side];
      const dead = side === failed;
      return `
  <rect class="d-air" x="${cx - 7}" y="76" width="14" height="30" rx="3"/>
  <line class="${dead ? 'd-dead' : 'd-ink'}" x1="${cx - 22}" y1="74" x2="${cx + 22}" y2="74" stroke-width="3"/>
  ${dead ? cross(cx, 74, 9) : ''}`;
    })
    .join('');
  return `
  <rect class="d-air" x="152" y="44" width="16" height="140" rx="8"/>
  <rect class="d-air" x="40" y="92" width="240" height="14" rx="3"/>
  <rect class="d-air" x="125" y="168" width="70" height="9" rx="3"/>
  ${engines}
  ${engineLabels(failed, labelY)}
  ${extra}`;
}

/* Looking forward from behind the airplane, so the left engine is on the left. */
function rearView(failed, extra) {
  const engines = ['left', 'right']
    .map((side) => {
      const cx = ENGINE_X[side];
      if (side === failed) return `<circle class="d-dead d-disc" cx="${cx}" cy="112" r="26"/>${cross(cx, 112, 13)}`;
      return `
  <circle class="d-ink d-disc" cx="${cx}" cy="112" r="26"/>
  <path class="d-ink" d="M${cx - 20} 88.3A31 31 0 0 1 ${cx + 4} 81.3" stroke-width="1.6" marker-end="url(#d-head-ink)"/>`;
    })
    .join('');
  return `
  <rect class="d-air" x="30" y="108" width="260" height="8" rx="3"/>
  <rect class="d-air" x="157" y="60" width="6" height="36" rx="2"/>
  <circle class="d-air" cx="${CENTER}" cy="112" r="19"/>
  ${engines}
  ${extra}`;
}

/* The distance from the centerline out to where a force acts. */
function arm(y, x, labelY) {
  const long = x - CENTER > CENTER - (ENGINE_X.left + 14);
  return `
  <line class="d-ink" x1="${CENTER}" y1="${y - 6}" x2="${CENTER}" y2="${y + 6}" stroke-width="1.6"/>
  <line class="${long ? 'd-warn' : 'd-ink'}" x1="${CENTER}" y1="${y}" x2="${x}" y2="${y}" stroke-width="${long ? 3.5 : 2}"/>
  ${text((CENTER + x) / 2 + (long ? 4 : -6), labelY, long ? 'long arm' : 'short arm', long ? 'd-text-warn' : '')}`;
}

/* Thrust acting at the descending blade of the running engine. */
function thrust(failed) {
  const x = ENGINE_X[other(failed)] + 13;
  return svg(
    196,
    `Top view of a twin with the ${failed} engine failed. An arrow shows the thrust of the running engine and its distance from the centerline.`,
    topView(
      failed,
      126,
      `
  <line class="d-leader" x1="${x}" y1="40" x2="${x}" y2="30"/>
  <line class="d-force" x1="${x}" y1="70" x2="${x}" y2="44" stroke-width="3" marker-end="url(#d-head-force)"/>
  <circle class="d-fill-force" cx="${x}" cy="74" r="3.5"/>
  ${arm(30, x, 18)}`,
    ),
  );
}

/* Extra lift on the wing behind the running engine's descending blade. */
function lift(failed) {
  const x = ENGINE_X[other(failed)] + 14;
  return svg(
    198,
    `Rear view of a twin with the ${failed} engine failed. An arrow shows the extra lift behind the running propeller and its distance from the centerline.`,
    rearView(
      failed,
      `
  <line class="d-leader" x1="${x}" y1="118" x2="${x}" y2="158"/>
  <line class="d-force" x1="${x}" y1="104" x2="${x}" y2="54" stroke-width="3" marker-end="url(#d-head-force)"/>
  ${arm(158, x, 176)}
  ${engineLabels(failed, 46, ENGINE_X.left - 24, ENGINE_X.right + 30)}`,
    ),
  );
}

/* The running engine's slipstream, which either reaches the vertical tail or not. */
function slipstream(failed) {
  const running = other(failed);
  const flow =
    running === 'left'
      ? `<path class="d-force d-flow" d="M100 110C100 140 128 150 153 160" stroke-width="3" marker-end="url(#d-head-force)"/>${text(76, 160, 'reaches the tail')}`
      : `<path class="d-warn d-flow" d="M220 110C220 142 262 150 290 176" stroke-width="3" marker-end="url(#d-head-warn)"/>${text(236, 194, 'misses the tail', 'd-text-warn')}`;
  return svg(
    200,
    `Top view of a twin with the ${failed} engine failed. The slipstream of the running engine ${running === 'left' ? 'reaches' : 'misses'} the vertical tail.`,
    topView(failed, 54, `<rect class="d-fill-ink" x="158" y="146" width="4" height="40" rx="2"/>${flow}`),
  );
}

/* The airframe's reaction to the running propeller. */
function reaction(failed) {
  return svg(
    166,
    `Rear view of a twin with the ${failed} engine failed. An arrow shows the airframe reacting against the clockwise propeller.`,
    rearView(
      failed,
      `
  <path class="d-warn" d="M212 58A64 64 0 0 0 110 56" stroke-width="3.5" marker-end="url(#d-head-warn)"/>
  ${text(CENTER, 22, 'airframe reaction', 'd-text-warn')}
  ${engineLabels(failed, 158)}`,
    ),
  );
}

const DRAW = { p: thrust, a: lift, s: slipstream, t: reaction };
const VIEW = { p: 'Top view, nose up.', a: 'View from behind.', s: 'Top view, nose up.', t: 'View from behind.' };

export const DIAGRAMS = {};
for (const factor of Object.keys(DRAW)) {
  for (const failed of ['left', 'right']) {
    DIAGRAMS[`${factor}-${failed}`] = {
      svg: DRAW[factor](failed),
      caption: `${failed === 'left' ? 'Left' : 'Right'} engine failed. ${VIEW[factor]}`,
    };
  }
}
