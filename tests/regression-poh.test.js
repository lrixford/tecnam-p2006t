import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeGrossLb, computeZfwLb, computeViolations } from '../src/stationInput.js';
import { P2006T } from '../src/data/p2006t.js';

// POH §6 Table 2-2 worked example (synthesis.md §5), in imperial.
// Empty 1742 @ 1.595 ft, two front 176.3, two rear 154.3, baggage 39.7,
// total fuel 23.7 US gal (split 11.85/11.85), density 6.7 lb/gal.
//   Gross  = 2601.5 lb
//   ZFW    = 2601.5 − 23.7×6.7 = 2442.71 lb
//   MTOW   = 2712, MZFW = 2635 → both inside.

const TOL = 0.5; // POH itself rounds inputs; ±0.5 lb is generous and safe.

function pohState() {
  return {
    // 1742 lb @ 1.595 ft = 2778.49 lb·ft moment
    empty:       { weight_lb: 1742, moment_lb_ft: 2778.49, note: 'POH worked example' },
    pilot:       { weight_lb: 176.3 },
    copilot:     { weight_lb: 176.3 },
    rearLH:      { weight_lb: 154.3 },
    rearRH:      { weight_lb: 154.3 },
    baggage:     { weight_lb: 39.7 },
    fuelL:       { volume_gal: 11.85 },
    fuelR:       { volume_gal: 11.85 },
    fuelBurnoff: { volume_gal: 0 },
  };
}

test('POH worked example: gross weight ≈ 2601.5 lb', () => {
  const gross = computeGrossLb(pohState());
  assert.ok(Math.abs(gross - 2601.5) <= TOL,
    `expected ~2601.5 lb, got ${gross.toFixed(2)} lb`);
});

test('POH worked example: zero-fuel weight ≈ 2442.2 lb', () => {
  const zfw = computeZfwLb(pohState());
  // 2601.5 − 23.7 × 6.7 = 2442.71
  assert.ok(Math.abs(zfw - 2442.71) <= TOL,
    `expected ~2442.71 lb, got ${zfw.toFixed(2)} lb`);
});

test('POH worked example: no warnings (within MTOW & MZFW)', () => {
  const v = computeViolations(pohState());
  assert.equal(v['totals-gross'].on, false, 'gross should be within MTOW');
  assert.equal(v['totals-zfw'].on, false, 'zfw should be within MZFW');
  assert.equal(v.baggage.on, false);
  assert.equal(v.fuelL.on, false);
  assert.equal(v.fuelR.on, false);
});

test('POH constants match published values', () => {
  assert.equal(P2006T.mtow_lb, 2712);
  assert.equal(P2006T.mzfw_lb, 2635);
  assert.equal(P2006T.fuel.density_lb_per_gal, 6.7);
  assert.equal(P2006T.baggage.max_lb, 176);
});
