import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultState, computeViolations } from '../src/stationInput.js';

function blankState() {
  return {
    empty:       { weight_lb: 0, moment_lb_ft: 0, note: '' },
    pilot:       { weight_lb: 0 },
    copilot:     { weight_lb: 0 },
    rearLH:      { weight_lb: 0 },
    rearRH:      { weight_lb: 0 },
    baggage:     { weight_lb: 0 },
    fuelL:       { volume_gal: 0 },
    fuelR:       { volume_gal: 0 },
    fuelBurnoff: { volume_gal: 0 },
  };
}

test('blank state: no violations', () => {
  const v = computeViolations(blankState());
  for (const [target, { on }] of Object.entries(v)) {
    assert.equal(on, false, `${target} should not be flagged`);
  }
});

test('baggage over 176 lb flags', () => {
  const s = blankState();
  s.baggage.weight_lb = 200;
  const v = computeViolations(s);
  assert.equal(v.baggage.on, true);
  assert.match(v.baggage.message, /176 lb/);
});

test('baggage at exactly 176 lb does not flag', () => {
  const s = blankState();
  s.baggage.weight_lb = 176;
  assert.equal(computeViolations(s).baggage.on, false);
});

test('per-tank fuel limit (>26.42 gal in one tank)', () => {
  const s = blankState();
  s.fuelL.volume_gal = 27;
  s.fuelR.volume_gal = 0;
  const v = computeViolations(s);
  assert.equal(v.fuelL.on, true);
  assert.match(v.fuelL.message, /per tank/);
  assert.equal(v.fuelR.on, false);
});

test('combined-usable fuel limit triggers on both tanks when each within per-tank', () => {
  const s = blankState();
  s.fuelL.volume_gal = 26;
  s.fuelR.volume_gal = 26;  // 52 total > 51.35 usable
  const v = computeViolations(s);
  assert.equal(v.fuelL.on, true);
  assert.equal(v.fuelR.on, true);
  assert.match(v.fuelL.message, /combined/);
  assert.match(v.fuelR.message, /combined/);
});

test('per-tank message wins when both per-tank and combined would apply', () => {
  const s = blankState();
  s.fuelL.volume_gal = 30;  // over per-tank
  s.fuelR.volume_gal = 26;  // under per-tank but combined still over usable
  const v = computeViolations(s);
  assert.match(v.fuelL.message, /per tank/);
  // fuelR still gets combined message because it's within per-tank
  assert.match(v.fuelR.message, /combined/);
});

test('gross weight over MTOW (2712 lb) flags', () => {
  const s = blankState();
  s.empty.weight_lb = 1742;
  s.pilot.weight_lb = 200;
  s.copilot.weight_lb = 200;
  s.rearLH.weight_lb = 200;
  s.rearRH.weight_lb = 200;
  s.baggage.weight_lb = 100;
  s.fuelL.volume_gal = 25;
  s.fuelR.volume_gal = 25;
  // gross ≈ 1742 + 900 + 50*6.7 = 2977 lb — over MTOW
  const v = computeViolations(s);
  assert.equal(v['totals-gross'].on, true);
  assert.match(v['totals-gross'].message, /MTOW/);
});

test('zero-fuel weight over MZFW (2635 lb) flags', () => {
  const s = blankState();
  s.empty.weight_lb = 1742;
  s.pilot.weight_lb = 250;
  s.copilot.weight_lb = 250;
  s.rearLH.weight_lb = 250;
  s.rearRH.weight_lb = 250;
  s.baggage.weight_lb = 0;
  s.fuelL.volume_gal = 0;
  s.fuelR.volume_gal = 0;
  // zfw = 1742 + 1000 = 2742 > 2635
  const v = computeViolations(s);
  assert.equal(v['totals-zfw'].on, true);
  assert.match(v['totals-zfw'].message, /MZFW/);
});

test('defaultState() matches blankState shape (no localStorage in Node)', () => {
  // In Node there is no localStorage, so persistence falls back to in-memory
  // Map (empty on first run) → load() returns null → defaults apply.
  const s = defaultState();
  assert.deepEqual(s.empty,       { weight_lb: 0, moment_lb_ft: 0, note: '' });
  assert.deepEqual(s.pilot,       { weight_lb: 0 });
  assert.deepEqual(s.fuelL,       { volume_gal: 0 });
  assert.deepEqual(s.fuelBurnoff, { volume_gal: 0 });
});
