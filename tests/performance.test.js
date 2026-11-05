import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcPerformance } from '../src/performance.js';

// Standard altimeter and calm wind, so pressure altitude equals field elevation.
function perfAt({ elev_ft, oat_c, grossLb = 2712 }) {
  return calcPerformance({
    grossLb,
    landingLb: grossLb,
    airport: { elev_ft },
    runway: {
      surface: 'paved',
      length_ft: 6000,
      ends: { 18: { hdg_mag: 180, slope_pct: 0, tora_ft: 6000, lda_ft: 6000 } },
    },
    endId: '18',
    metar: { altimeter_inhg: 29.92, oat_c, wind_dir_deg: 180, wind_speed_kt: 0 },
  });
}

test('accel-go has a distance and no message when OEI climb is sufficient', () => {
  const r = perfAt({ elev_ft: 0, oat_c: 25 });
  assert.equal(r.roc_oei_fpm, 142);
  assert.equal(typeof r.accel_go.dist_m, 'number');
  assert.equal(r.accel_go.level, null);
  assert.equal(r.accel_go.message, null);
});

test('accel-go warns with no distance when OEI climb is negative', () => {
  const r = perfAt({ elev_ft: 5000, oat_c: 25 });
  assert.equal(r.roc_oei_fpm, -38);
  assert.equal(r.accel_go.dist_m, null);
  assert.equal(r.accel_go.level, 'warning');
  assert.equal(r.accel_go.message,
    'Predicted single-engine climb rate is -38 fpm.');
});

test('accel-go cautions with a distance when OEI climb is marginal', () => {
  const r = perfAt({ elev_ft: 2000, oat_c: 25 });
  assert.equal(r.roc_oei_fpm, 69);
  assert.equal(typeof r.accel_go.dist_m, 'number');
  assert.equal(r.accel_go.level, 'caution');
  assert.equal(r.accel_go.message,
    'Predicted single-engine climb rate is 69 fpm.');
});

// At 3000 ft and 2712 lb, these temperatures land on either side of each limit.
for (const [oat_c, fpm, level] of [
  [20.5, 49,  'warning'],
  [20.1, 50,  'caution'],
  [5.75, 100, 'caution'],
  [5.4,  101, null],
]) {
  test(`accel-go level at ${fpm} fpm is ${level}`, () => {
    const r = perfAt({ elev_ft: 3000, oat_c });
    assert.equal(r.roc_oei_fpm, fpm);
    assert.equal(r.accel_go.level, level);
    assert.equal(r.accel_go.dist_m === null, level === 'warning');
  });
}

test('takeoff and landing distances are still given when accel-go is unavailable', () => {
  const r = perfAt({ elev_ft: 5000, oat_c: 25 });
  assert.ok(r.takeoff.gr > 0);
  assert.ok(r.landing.gr > 0);
  assert.ok(r.accel_stop.dist_m > 0);
});
