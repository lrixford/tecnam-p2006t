import { test } from 'node:test';
import assert from 'node:assert/strict';
import { suggest } from '../src/suggest.js';
import { computeAll } from '../src/loadingCondition.js';

// ─── helpers ──────────────────────────────────────────────────────────────────

function baseState(overrides = {}) {
  return {
    empty:       { weight_lb: 1742, moment_lb_ft: 2778.49, note: '' },
    pilot:       { weight_lb: 176.3 },
    copilot:     { weight_lb: 176.3 },
    rearLH:      { weight_lb: 154.3 },
    rearRH:      { weight_lb: 154.3 },
    baggage:     { weight_lb: 39.7 },
    fuelL:       { volume_gal: 11.85 },
    fuelR:       { volume_gal: 11.85 },
    fuelTaxi:    { volume_gal: 1.0 },
    fuelBurnoff: { volume_gal: 10.5 },
    fuelReserve: { volume_gal: 8.0 },
    mtow:        { weight_lb: 2712 },
    ...overrides,
  };
}

// Apply a suggestion to a state and call suggest() again.
function applyAndRecheck(state, s) {
  const next = {
    ...state,
    fuelL: { volume_gal: s.fuelL_gal },
    fuelR: { volume_gal: s.fuelR_gal },
  };
  if (s.baggage_lb !== undefined) next.baggage = { weight_lb: s.baggage_lb };
  return suggest(next);
}

// ─── ok ───────────────────────────────────────────────────────────────────────

test('POH example state: status ok', () => {
  assert.equal(suggest(baseState()).status, 'ok');
});

test('ok with pilot only and full fuel', () => {
  // Empty CG is 1.595 ft (aft of envelope) — front seats pull it forward.
  // A single pilot with full tanks should place CG inside the envelope.
  const s = baseState({
    pilot:       { weight_lb: 176 },
    copilot:     { weight_lb: 0 },
    rearLH:      { weight_lb: 0 },
    rearRH:      { weight_lb: 0 },
    baggage:     { weight_lb: 0 },
    fuelL:       { volume_gal: 20 },
    fuelR:       { volume_gal: 20 },
    fuelBurnoff: { volume_gal: 5 },
    fuelReserve: { volume_gal: 8 },
  });
  assert.equal(suggest(s).status, 'ok');
});

// ─── adjust-fuel ──────────────────────────────────────────────────────────────

test('forward-cg: suggests more fuel', () => {
  // Heavy front seats, no rear, minimal fuel → forward CG
  const s = baseState({
    pilot:       { weight_lb: 220 },
    copilot:     { weight_lb: 220 },
    rearLH:      { weight_lb: 0 },
    rearRH:      { weight_lb: 0 },
    baggage:     { weight_lb: 0 },
    fuelL:       { volume_gal: 1 },
    fuelR:       { volume_gal: 1 },
    fuelBurnoff: { volume_gal: 5 },
    fuelReserve: { volume_gal: 8 },
  });
  const result = suggest(s);
  assert.equal(result.status, 'adjust-fuel');
  assert.equal(result.issue, 'forward-cg');
  assert.ok(result.fuelL_gal > 1, 'should suggest more fuel than current 1 gal');
  assert.equal(result.fuelL_gal, result.fuelR_gal, 'tanks should be balanced');
});

test('over-mtow: removes all baggage, then trims fuel', () => {
  // Fully loaded with max fuel → over MTOW even with no baggage
  const s = baseState({
    pilot:       { weight_lb: 200 },
    copilot:     { weight_lb: 200 },
    rearLH:      { weight_lb: 200 },
    rearRH:      { weight_lb: 200 },
    baggage:     { weight_lb: 50 },
    fuelL:       { volume_gal: 26 },
    fuelR:       { volume_gal: 26 },
    fuelBurnoff: { volume_gal: 5 },
    fuelReserve: { volume_gal: 8 },
  });
  const result = suggest(s);
  assert.equal(result.status, 'adjust-fuel-and-baggage');
  assert.equal(result.issue, 'over-mtow');
  assert.equal(result.baggage_lb, 0);
  assert.ok(result.fuelL_gal < 26, 'should suggest less fuel');
  assert.equal(result.fuelL_gal, result.fuelR_gal, 'tanks should be balanced');
  assert.equal(applyAndRecheck(s, result).status, 'ok');
});

test('over-mtow with no baggage: trims only the fuel that does not fit', () => {
  const s = baseState({
    baggage:     { weight_lb: 0 },
    fuelL:       { volume_gal: 26 },
    fuelR:       { volume_gal: 26 },
  });
  const result = suggest(s);
  assert.equal(result.status, 'adjust-fuel');
  assert.ok(result.fuelL_gal < 26 && result.fuelL_gal >= 25, `got ${result.fuelL_gal}`);
  assert.equal(applyAndRecheck(s, result).status, 'ok');
});

test('suggested fuel is within tank limits', () => {
  const s = baseState({
    pilot:   { weight_lb: 220 },
    copilot: { weight_lb: 220 },
    rearLH:  { weight_lb: 0 },
    rearRH:  { weight_lb: 0 },
    baggage: { weight_lb: 0 },
    fuelL:   { volume_gal: 1 },
    fuelR:   { volume_gal: 1 },
  });
  const result = suggest(s);
  if (result.status === 'adjust-fuel' || result.status === 'adjust-fuel-and-baggage') {
    assert.ok(result.fuelL_gal <= 26.42, `fuelL ${result.fuelL_gal} exceeds per-tank max`);
    assert.ok(result.fuelR_gal <= 26.42, `fuelR ${result.fuelR_gal} exceeds per-tank max`);
    assert.ok(result.fuelL_gal + result.fuelR_gal <= 51.35 + 0.01, 'combined fuel exceeds usable capacity');
  }
});

test('applying adjust-fuel suggestion gives ok', () => {
  const s = baseState({
    pilot:       { weight_lb: 220 },
    copilot:     { weight_lb: 220 },
    rearLH:      { weight_lb: 0 },
    rearRH:      { weight_lb: 0 },
    baggage:     { weight_lb: 0 },
    fuelL:       { volume_gal: 1 },
    fuelR:       { volume_gal: 1 },
  });
  const result = suggest(s);
  assert.ok(result.status === 'adjust-fuel' || result.status === 'adjust-fuel-and-baggage');
  const recheck = applyAndRecheck(s, result);
  assert.equal(recheck.status, 'ok', `after applying suggestion, expected ok but got ${recheck.status}`);
});

// ─── adjust-fuel-and-baggage ──────────────────────────────────────────────────

test('extreme forward-cg: suggests baggage addition', () => {
  // Max front pair (485 lb), no rear, large burnoff → infeasible without baggage
  const s = baseState({
    pilot:       { weight_lb: 242 },
    copilot:     { weight_lb: 243 },
    rearLH:      { weight_lb: 0 },
    rearRH:      { weight_lb: 0 },
    baggage:     { weight_lb: 0 },
    fuelL:       { volume_gal: 13 },
    fuelR:       { volume_gal: 13 },
    fuelBurnoff: { volume_gal: 35 },
    fuelReserve: { volume_gal: 8 },
  });
  const result = suggest(s);
  assert.equal(result.status, 'adjust-fuel-and-baggage');
  assert.equal(result.issue, 'forward-cg');
  assert.ok(result.baggage_lb > 0, 'should suggest positive baggage');
  assert.ok(result.baggage_delta_lb > 0, 'baggage delta should be positive');
  assert.ok(result.baggage_lb <= 176, 'baggage should not exceed POH max');
});

test('adjust-fuel-and-baggage: total_gal = fuelL + fuelR', () => {
  const s = baseState({
    pilot:       { weight_lb: 242 },
    copilot:     { weight_lb: 243 },
    rearLH:      { weight_lb: 0 },
    rearRH:      { weight_lb: 0 },
    baggage:     { weight_lb: 0 },
    fuelL:       { volume_gal: 13 },
    fuelR:       { volume_gal: 13 },
    fuelBurnoff: { volume_gal: 35 },
    fuelReserve: { volume_gal: 8 },
  });
  const result = suggest(s);
  if (result.status === 'adjust-fuel-and-baggage') {
    assert.ok(
      Math.abs(result.total_gal - (result.fuelL_gal + result.fuelR_gal)) < 0.01,
      `total_gal ${result.total_gal} != fuelL ${result.fuelL_gal} + fuelR ${result.fuelR_gal}`,
    );
  }
});

test('applying adjust-fuel-and-baggage suggestion gives ok', () => {
  const s = baseState({
    pilot:       { weight_lb: 242 },
    copilot:     { weight_lb: 243 },
    rearLH:      { weight_lb: 0 },
    rearRH:      { weight_lb: 0 },
    baggage:     { weight_lb: 0 },
    fuelL:       { volume_gal: 13 },
    fuelR:       { volume_gal: 13 },
    fuelBurnoff: { volume_gal: 35 },
    fuelReserve: { volume_gal: 8 },
  });
  const result = suggest(s);
  assert.equal(result.status, 'adjust-fuel-and-baggage');
  const recheck = applyAndRecheck(s, result);
  assert.equal(recheck.status, 'ok', `after applying suggestion, expected ok but got ${recheck.status}`);
});

// ─── removing baggage ─────────────────────────────────────────────────────────

test('minimum fuel over MTOW removes only the baggage needed', () => {
  // ZFW 2610 lb, 20 gal needed: 122 lb of fuel leaves the aircraft 20 lb over MTOW.
  const state = baseState({
    empty:       { weight_lb: 2000, moment_lb_ft: 2500, note: '' },
    pilot:       { weight_lb: 150 },
    copilot:     { weight_lb: 150 },
    rearLH:      { weight_lb: 130 },
    rearRH:      { weight_lb: 130 },
    baggage:     { weight_lb: 50 },
    fuelL:       { volume_gal: 10 },
    fuelR:       { volume_gal: 10 },
    fuelTaxi:    { volume_gal: 0 },
    fuelBurnoff: { volume_gal: 12 },
    fuelReserve: { volume_gal: 8 },
  });
  const s = suggest(state);
  assert.equal(s.status, 'adjust-fuel-and-baggage');
  assert.equal(s.issue, 'over-mtow');
  assert.ok(s.baggage_delta_lb < 0, 'should remove baggage');
  assert.ok(s.baggage_delta_lb >= -34, 'should keep as much baggage as possible');
  assert.ok(s.total_gal >= 20, 'should keep the required fuel');
  assert.equal(applyAndRecheck(state, s).status, 'ok');
});

test('over MZFW and MTOW: keeps the loaded fuel and removes baggage', () => {
  const state = baseState({
    empty:       { weight_lb: 1953, moment_lb_ft: 2442, note: '' },
    pilot:       { weight_lb: 225 },
    copilot:     { weight_lb: 0 },
    rearLH:      { weight_lb: 185 },
    rearRH:      { weight_lb: 125 },
    baggage:     { weight_lb: 150 },
    fuelL:       { volume_gal: 13.4 },
    fuelR:       { volume_gal: 13.4 },
    fuelTaxi:    { volume_gal: 1 },
    fuelBurnoff: { volume_gal: 15 },
    fuelReserve: { volume_gal: 8 },
  });
  const s = suggest(state);
  assert.equal(s.status, 'adjust-fuel-and-baggage');
  assert.equal(s.issue, 'over-mzfw');
  assert.equal(s.baggage_lb, 66);
  assert.equal(s.baggage_delta_lb, -84);
  assert.equal(s.total_gal, 26.8);
  assert.equal(applyAndRecheck(state, s).status, 'ok');
});

test('baggage removal stops at the forward CG limit at zero fuel', () => {
  // 40 lb of baggage holds zero-fuel CG inside the limit; any less breaks it.
  const state = baseState({
    empty:       { weight_lb: 2000, moment_lb_ft: 2070, note: '' },
    pilot:       { weight_lb: 200 },
    copilot:     { weight_lb: 200 },
    rearLH:      { weight_lb: 100 },
    rearRH:      { weight_lb: 100 },
    baggage:     { weight_lb: 40 },
    fuelL:       { volume_gal: 10 },
    fuelR:       { volume_gal: 10 },
    fuelTaxi:    { volume_gal: 0 },
    fuelBurnoff: { volume_gal: 12 },
    fuelReserve: { volume_gal: 8 },
  });
  const { zeroFuel } = computeAll(state);
  assert.ok(zeroFuel.weight_lb > 2635);
  const s = suggest(state);
  if (s.baggage_lb !== undefined) {
    const next = computeAll({ ...state, baggage: { weight_lb: s.baggage_lb } });
    assert.equal(next.zeroFuel.inEnvelope, true);
  } else {
    assert.equal(s.status, 'impossible');
  }
});

test('exactly minimum fuel is accepted', () => {
  const r = suggest(baseState({
    fuelL:       { volume_gal: 12 },
    fuelR:       { volume_gal: 12 },
    fuelTaxi:    { volume_gal: 1 },
    fuelBurnoff: { volume_gal: 15 },
    fuelReserve: { volume_gal: 8 },
  }));
  assert.equal(r.status, 'ok');
});

test('removing baggage is not offered when it would not help', () => {
  // Forward-CG limited: less baggage moves the CG further forward.
  const s = suggest(baseState({
    empty:       { weight_lb: 2000, moment_lb_ft: 2500, note: '' },
    pilot:       { weight_lb: 200 },
    copilot:     { weight_lb: 200 },
    rearLH:      { weight_lb: 80 },
    rearRH:      { weight_lb: 80 },
    baggage:     { weight_lb: 50 },
    fuelL:       { volume_gal: 10 },
    fuelR:       { volume_gal: 10 },
    fuelTaxi:    { volume_gal: 0 },
    fuelBurnoff: { volume_gal: 12 },
    fuelReserve: { volume_gal: 8 },
  }));
  assert.equal(s.status, 'impossible');
});

test('baggage comes off before fuel', () => {
  const state = baseState({
    fuelL: { volume_gal: 25 },
    fuelR: { volume_gal: 25 },
  });
  const s = suggest(state);
  assert.equal(s.status, 'adjust-fuel-and-baggage');
  assert.equal(s.total_gal, 50);
  assert.ok(s.baggage_delta_lb < 0 && s.baggage_delta_lb >= -31, `removed ${s.baggage_delta_lb}`);
  assert.equal(applyAndRecheck(state, s).status, 'ok');
});

test('fuel below the need is raised, not traded for baggage', () => {
  const s = suggest(baseState({ fuelL: { volume_gal: 5 }, fuelR: { volume_gal: 5 } }));
  assert.equal(s.status, 'adjust-fuel');
  assert.equal(s.total_gal, 19.6);   // need is 1 + 10.5 + 8 = 19.5 gal
});

// ─── impossible ───────────────────────────────────────────────────────────────

test('impossible: occupants exceed MTOW headroom for minimum fuel', () => {
  // Passengers so heavy that MTOW leaves no room for taxi+burnoff+reserve
  const s = baseState({
    pilot:       { weight_lb: 300 },
    copilot:     { weight_lb: 300 },
    rearLH:      { weight_lb: 250 },
    rearRH:      { weight_lb: 250 },
    baggage:     { weight_lb: 0 },
    fuelL:       { volume_gal: 5 },
    fuelR:       { volume_gal: 5 },
    fuelTaxi:    { volume_gal: 1 },
    fuelBurnoff: { volume_gal: 10 },
    fuelReserve: { volume_gal: 8 },
  });
  const result = suggest(s);
  assert.equal(result.status, 'impossible');
  assert.ok(result.reason.length > 0, 'impossible should carry a reason');
});

test('impossible returns reason string', () => {
  const s = baseState({
    pilot:       { weight_lb: 350 },
    copilot:     { weight_lb: 350 },
    rearLH:      { weight_lb: 300 },
    rearRH:      { weight_lb: 300 },
    baggage:     { weight_lb: 0 },
    fuelL:       { volume_gal: 1 },
    fuelR:       { volume_gal: 1 },
  });
  const result = suggest(s);
  assert.equal(result.status, 'impossible');
  assert.equal(typeof result.reason, 'string');
});

// ─── fuel quantity precision ───────────────────────────────────────────────────

test('suggested fuel quantities are multiples of 0.1 gal', () => {
  const cases = [
    baseState({ fuelL: { volume_gal: 1 }, fuelR: { volume_gal: 1 }, pilot: { weight_lb: 220 }, copilot: { weight_lb: 220 }, rearLH: { weight_lb: 0 }, rearRH: { weight_lb: 0 }, baggage: { weight_lb: 0 } }),
    baseState({ fuelL: { volume_gal: 26 }, fuelR: { volume_gal: 26 }, pilot: { weight_lb: 200 }, copilot: { weight_lb: 200 }, rearLH: { weight_lb: 200 }, rearRH: { weight_lb: 200 }, baggage: { weight_lb: 50 } }),
  ];
  for (const s of cases) {
    const r = suggest(s);
    if (r.fuelL_gal !== undefined) {
      assert.ok(Math.round(r.fuelL_gal * 10) === r.fuelL_gal * 10,
        `fuelL_gal ${r.fuelL_gal} is not a 0.1-gal multiple`);
      assert.ok(Math.round(r.fuelR_gal * 10) === r.fuelR_gal * 10,
        `fuelR_gal ${r.fuelR_gal} is not a 0.1-gal multiple`);
    }
  }
});

test('tanks are always balanced (fuelL == fuelR)', () => {
  const cases = [
    baseState({ fuelL: { volume_gal: 1 }, fuelR: { volume_gal: 1 }, pilot: { weight_lb: 220 }, copilot: { weight_lb: 220 }, rearLH: { weight_lb: 0 }, rearRH: { weight_lb: 0 }, baggage: { weight_lb: 0 } }),
    baseState({ fuelL: { volume_gal: 26 }, fuelR: { volume_gal: 26 }, pilot: { weight_lb: 200 }, copilot: { weight_lb: 200 }, rearLH: { weight_lb: 200 }, rearRH: { weight_lb: 200 }, baggage: { weight_lb: 50 } }),
    baseState({ fuelL: { volume_gal: 13 }, fuelR: { volume_gal: 13 }, pilot: { weight_lb: 242 }, copilot: { weight_lb: 243 }, rearLH: { weight_lb: 0 }, rearRH: { weight_lb: 0 }, baggage: { weight_lb: 0 }, fuelBurnoff: { volume_gal: 35 } }),
  ];
  for (const s of cases) {
    const r = suggest(s);
    if (r.fuelL_gal !== undefined) {
      assert.equal(r.fuelL_gal, r.fuelR_gal, `tanks unbalanced: L=${r.fuelL_gal} R=${r.fuelR_gal}`);
    }
  }
});

// ─── reserve fuel respects state value ────────────────────────────────────────

test('larger reserve requirement tightens feasible window', () => {
  const lowReserve  = baseState({ fuelL: { volume_gal: 5 }, fuelR: { volume_gal: 5 }, fuelReserve: { volume_gal: 2 } });
  const highReserve = baseState({ fuelL: { volume_gal: 5 }, fuelR: { volume_gal: 5 }, fuelReserve: { volume_gal: 20 } });
  const rLow  = suggest(lowReserve);
  const rHigh = suggest(highReserve);
  // With a much higher reserve the required minimum fuel increases,
  // so if high-reserve needs adjustment it should suggest at least as much fuel.
  if (rHigh.fuelL_gal !== undefined && rLow.fuelL_gal !== undefined) {
    assert.ok(rHigh.fuelL_gal >= rLow.fuelL_gal,
      `higher reserve should require at least as much fuel: high=${rHigh.fuelL_gal} low=${rLow.fuelL_gal}`);
  }
});

test('zero reserve still returns a valid status', () => {
  const s = baseState({ fuelReserve: { volume_gal: 0 } });
  const r = suggest(s);
  assert.ok(['ok', 'adjust-fuel', 'adjust-fuel-and-baggage', 'impossible'].includes(r.status));
});

// ─── custom MTOW ──────────────────────────────────────────────────────────────

test('lower custom MTOW turns previously-ok load into over-mtow', () => {
  const okState   = baseState();
  const lowMtow   = baseState({ mtow: { weight_lb: 2200 } });
  assert.equal(suggest(okState).status, 'ok');
  const r = suggest(lowMtow);
  assert.ok(r.status !== 'ok', 'lower MTOW should require adjustment');
  if (r.status === 'adjust-fuel') assert.equal(r.issue, 'over-mtow');
});

// ─── edge cases ───────────────────────────────────────────────────────────────

test('missing fuelTaxi defaults gracefully', () => {
  const s = baseState();
  delete s.fuelTaxi;
  const r = suggest(s);
  assert.ok(['ok', 'adjust-fuel', 'adjust-fuel-and-baggage', 'impossible'].includes(r.status));
});

test('missing fuelBurnoff defaults gracefully', () => {
  const s = baseState();
  delete s.fuelBurnoff;
  const r = suggest(s);
  assert.ok(['ok', 'adjust-fuel', 'adjust-fuel-and-baggage', 'impossible'].includes(r.status));
});

test('zero taxi and zero burnoff: ok on balanced load', () => {
  const s = baseState({ fuelTaxi: { volume_gal: 0 }, fuelBurnoff: { volume_gal: 0 } });
  assert.equal(suggest(s).status, 'ok');
});
