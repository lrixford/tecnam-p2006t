import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcPerformance, rankRunways } from '../src/performance.js';

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

// Turf and calm, so distances are raw table values.
function rawPerf({ elev_ft = 0, oat_c = 25, grossLb = 2712, altimeter_inhg = 29.92 }) {
  return calcPerformance({
    grossLb,
    landingLb: grossLb,
    airport: { elev_ft },
    runway: {
      surface: 'turf',
      length_ft: 9000,
      ends: { 18: { hdg_mag: 180, slope_pct: 0, tora_ft: 9000, lda_ft: 9000 } },
    },
    endId: '18',
    metar: { altimeter_inhg, oat_c, wind_dir_deg: 180, wind_speed_kt: 0 },
  });
}

test('pressure altitude interpolates between neighbouring table rows', () => {
  const r = rawPerf({ elev_ft: 500 });
  assert.equal(r.takeoff.gr, 347);       // midway between 328 (S.L.) and 366 (1000 ft)
  assert.equal(r.takeoff.to50ft, 454);   // midway between 429 and 479
});

test('weight interpolates between neighbouring tables', () => {
  const r = rawPerf({ grossLb: 1005 * 2.20462262 });
  assert.equal(r.takeoff.gr, 196);       // midway between 158 (930 kg) and 234 (1080 kg)
});

test('climb rate interpolates between neighbouring table rows', () => {
  const r = rawPerf({ grossLb: 1005 * 2.20462262, elev_ft: 500 });
  // 930 kg: (349 + 305) / 2 = 327. 1080 kg: (235 + 196) / 2 = 215.5. Midway: 271.25
  assert.equal(r.roc_oei_fpm, 271);
});

test('pressure altitude below sea level uses the sea-level row', () => {
  const r = rawPerf({ altimeter_inhg: 30.4 });
  assert.ok(r.pa_ft < 0);
  assert.equal(r.takeoff.gr, 328);
  assert.equal(r.takeoff.to50ft, 429);
});

test('takeoff above the published altitudes uses the top row', () => {
  assert.equal(rawPerf({ elev_ft: 12000 }).takeoff.gr, 1023);
});

for (const [field, metar] of [
  ['temperature', { oat_c: null, altimeter_inhg: 29.92 }],
  ['altimeter',   { oat_c: 25,   altimeter_inhg: null }],
]) {
  test(`performance is not calculated without a ${field}`, () => {
    assert.throws(() => calcPerformance({
      grossLb: 2712,
      airport: { elev_ft: 0 },
      runway: { surface: 'paved', length_ft: 6000, ends: { 18: { hdg_mag: 180, slope_pct: 0 } } },
      endId: '18',
      metar: { ...metar, wind_dir_deg: 180, wind_speed_kt: 0 },
    }));
  });
}

test('wind components use the true runway heading', () => {
  const runway = {
    surface: 'turf',
    length_ft: 9000,
    ends: { 16: { hdg_mag: 160, hdg_true: 180, slope_pct: 0 } },
  };
  const [ranked] = rankRunways([runway], 240, 20);
  assert.equal(ranked.xwind_kt, 17);
  assert.equal(ranked.headwind_kt, 10);

  const r = calcPerformance({
    grossLb: 2712, airport: { elev_ft: 0 }, runway, endId: '16',
    metar: { altimeter_inhg: 29.92, oat_c: 25, wind_dir_deg: 240, wind_speed_kt: 20 },
  });
  assert.equal(r.xwind_kt, 17);
  assert.equal(r.headwind_kt, 10);
});

// 142 fpm single-engine, 328 m ground roll, 84 kt.
function obstaclePerf(obstacle, length_ft = 3000) {
  return calcPerformance({
    grossLb: 2712,
    airport: { elev_ft: 0 },
    runway: { surface: 'turf', length_ft, ends: { 18: { hdg_mag: 180, slope_pct: 0, obstacle } } },
    endId: '18',
    metar: { altimeter_inhg: 29.92, oat_c: 25, wind_dir_deg: 180, wind_speed_kt: 0 },
  });
}

test('an obstacle above the climb rate removes accel-go and states the requirement', () => {
  const { accel_go } = obstaclePerf({ height_ft: 50, dist_ft: 500 });
  assert.equal(accel_go.dist_m, null);
  assert.equal(accel_go.level, 'warning');
  assert.equal(accel_go.message,
    'Predicted single-engine climb rate is 142 fpm. Required 176 fpm to clear obstacle.');
});

test('the caution band sits above the raised floor', () => {
  const { accel_go } = obstaclePerf({ height_ft: 30, dist_ft: 500 });
  assert.equal(typeof accel_go.dist_m, 'number');
  assert.equal(accel_go.level, 'caution');
  assert.equal(accel_go.message,
    'Predicted single-engine climb rate is 142 fpm. Required 106 fpm to clear obstacle.');
});

test('the obstacle note shows on its own when climb is comfortably above the floor', () => {
  const { accel_go } = obstaclePerf({ height_ft: 25, dist_ft: 500 });
  assert.equal(typeof accel_go.dist_m, 'number');
  assert.equal(accel_go.level, null);
  assert.equal(accel_go.message, 'Required 88 fpm to clear obstacle.');
});

test('an obstacle needing less than the floor changes nothing', () => {
  const { accel_go } = obstaclePerf({ height_ft: 10, dist_ft: 500 });
  assert.equal(accel_go.level, null);
  assert.equal(accel_go.message, null);
  assert.deepEqual(accel_go, obstaclePerf(null).accel_go);
});

test('an obstacle within the ground roll removes accel-go with no required figure', () => {
  const { accel_go } = obstaclePerf({ height_ft: 10, dist_ft: 0 }, 1000);
  assert.equal(accel_go.dist_m, null);
  assert.equal(accel_go.level, 'warning');
  assert.equal(accel_go.message, 'Predicted single-engine climb rate is 142 fpm.');
});

test('crosswind uses the gust midpoint, distances use the steady wind', () => {
  const runway = {
    surface: 'turf',
    length_ft: 9000,
    ends: { 18: { hdg_mag: 180, slope_pct: 0 } },
  };
  const calc = gust => calcPerformance({
    grossLb: 2712, airport: { elev_ft: 0 }, runway, endId: '18',
    metar: { altimeter_inhg: 29.92, oat_c: 25, wind_dir_deg: 270, wind_speed_kt: 12, wind_gust_kt: gust },
  });
  assert.equal(calc(null).xwind_kt, 12);
  assert.equal(calc(null).xwind_ok, true);
  assert.equal(calc(28).xwind_kt, 20);
  assert.equal(calc(28).xwind_ok, false);
  assert.equal(calc(28).end_id, '18');

  const headOn = gust => calcPerformance({
    grossLb: 2712, airport: { elev_ft: 0 }, runway, endId: '18',
    metar: { altimeter_inhg: 29.92, oat_c: 25, wind_dir_deg: 180, wind_speed_kt: 10, wind_gust_kt: gust },
  });
  assert.equal(headOn(30).headwind_kt, 10);
  assert.equal(headOn(30).takeoff.gr, headOn(null).takeoff.gr);
});

test('crosswind is null without a wind direction or runway heading', () => {
  const calc = (hdg_mag, wind_dir_deg) => calcPerformance({
    grossLb: 2712, airport: { elev_ft: 0 }, endId: '18',
    runway: { surface: 'turf', length_ft: 9000, ends: { 18: { hdg_mag, slope_pct: 0 } } },
    metar: { altimeter_inhg: 29.92, oat_c: 25, wind_dir_deg, wind_speed_kt: 10 },
  });
  assert.equal(calc(null, 180).xwind_kt, null);
  assert.equal(calc(180, null).xwind_kt, null);
  assert.equal(calc(null, 180).xwind_ok, true);
});

test('wind components fall back to the magnetic heading', () => {
  const runway = { ends: { 18: { hdg_mag: 180, hdg_true: null } } };
  assert.equal(rankRunways([runway], 180, 10)[0].headwind_kt, 10);
});

test('accel-stop is takeoff roll plus landing roll at landing weight, plus 30%', () => {
  const r = calcPerformance({
    grossLb: 2712,
    landingLb: 1080 * 2.20462262,
    airport: { elev_ft: 0 },
    runway: { surface: 'turf', length_ft: 9000, ends: { 18: { hdg_mag: 180, slope_pct: 0 } } },
    endId: '18',
    metar: { altimeter_inhg: 29.92, oat_c: 25, wind_dir_deg: 180, wind_speed_kt: 0 },
  });
  assert.equal(r.accel_stop.dist_m, Math.round((328 + 210) * 1.3));
});

test('takeoff and landing distances are still given when accel-go is unavailable', () => {
  const r = perfAt({ elev_ft: 5000, oat_c: 25 });
  assert.ok(r.takeoff.gr > 0);
  assert.ok(r.landing.gr > 0);
  assert.ok(r.accel_stop.dist_m > 0);
});
