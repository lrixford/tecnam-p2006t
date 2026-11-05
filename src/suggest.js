import { P2006T } from './data/p2006t.js';

// Pure W&B suggestion engine.
// Immutable: passenger weights, taxi fuel, enroute (burnoff) fuel.
// Mutable:   baggage first, then fuel, which never goes below the need.
// Solves for a takeoff_fuel_lb that satisfies CG envelope at TO and LDG, and MTOW.

const ARMS    = P2006T.arms_ft;
const DENSITY = P2006T.fuel.density_lb_per_gal;
const FWD     = P2006T.envelope.fwd_arm_ft;   // 0.725 ft
const AFT     = P2006T.envelope.aft_arm_ft;   // 1.36  ft
const ARM_F   = ARMS.fuel;                    // 2.516 ft — always > FWD and > AFT
// MTOW and reserve fuel are read from state at call time (editable per aircraft).

function baseWeightMoment(state, baggage_lb) {
  const bag = baggage_lb ?? state.baggage.weight_lb;
  return {
    weight:
        state.empty.weight_lb
      + state.pilot.weight_lb   + state.copilot.weight_lb
      + state.rearLH.weight_lb  + state.rearRH.weight_lb
      + bag,
    moment:
        state.empty.moment_lb_ft
      + state.pilot.weight_lb   * ARMS.pilot
      + state.copilot.weight_lb * ARMS.copilot
      + state.rearLH.weight_lb  * ARMS.rearLH
      + state.rearRH.weight_lb  * ARMS.rearRH
      + bag * ARMS.baggage,
  };
}

// CG constraint on tf (takeoff fuel lb) rearranges to linear inequalities
// because ARM_F > FWD and ARM_F > AFT.
//
//   TO fwd:  cg ≥ FWD  →  tf ≥ (FWD·bw − bm) / (ARM_F − FWD)   [lower bound]
//   TO aft:  cg ≤ AFT  →  tf ≤ (AFT·bw − bm) / (ARM_F − AFT)   [upper bound]
//   LDG fwd: lf ≥ same lower → tf ≥ to_fwd_lo + burnoff         [more restrictive]
//   LDG aft: lf ≤ same upper → tf ≤ to_aft_hi + burnoff         [never binding]
//
// Returns { tf_lo, tf_hi, feasible }.
function tfRange(bw, bm, burnoff_lb, taxi_lb, mtow_lb, reserve_lb) {
  const to_fwd_lo  = (FWD * bw - bm) / (ARM_F - FWD);
  const to_aft_hi  = (AFT * bw - bm) / (ARM_F - AFT);
  const ldg_fwd_lo = to_fwd_lo + burnoff_lb;

  const mtow_hi = mtow_lb - bw;
  const tank_hi = P2006T.fuel.combined_usable_gal * DENSITY - taxi_lb;

  const tf_lo = Math.max(ldg_fwd_lo, burnoff_lb + reserve_lb, 0);
  const tf_hi = Math.min(to_aft_hi, mtow_hi, tank_hi);

  return { tf_lo, tf_hi, to_fwd_lo, to_aft_hi, feasible: tf_lo <= tf_hi };
}

// Tolerance absorbs floating-point error, so exactly minimum fuel passes.
function fuelFits(tf_lb, range) {
  return tf_lb >= range.tf_lo - 1e-6 && tf_lb <= range.tf_hi + 1e-6;
}

function splitFuel(tf_lb, taxi_lb, roundUp) {
  const tenths = (tf_lb + taxi_lb) / DENSITY / 2 * 10;
  const perTank = Math.min(
    (roundUp ? Math.ceil(tenths - 1e-6) : Math.floor(tenths + 1e-6)) / 10,
    Math.floor(P2006T.fuel.perTank_max_gal * 10) / 10,
  );
  return {
    fuelL_gal: perTank,
    fuelR_gal: perTank,
    total_gal: +(perTank * 2).toFixed(1),
  };
}

function takeoffFuel(split, taxi_lb) {
  return (split.fuelL_gal + split.fuelR_gal) * DENSITY - taxi_lb;
}

// Fuel split closest to `want` inside the range, or null if none fits.
function fitFuel(range, want, taxi_lb) {
  if (!range.feasible) return null;
  const tf = Math.min(Math.max(want, range.tf_lo), range.tf_hi);
  for (const roundUp of [true, false]) {
    const split = splitFuel(tf, taxi_lb, roundUp);
    if (fuelFits(takeoffFuel(split, taxi_lb), range)) return split;
  }
  return null;
}

function issueLabel(currentTf, range) {
  if (currentTf < range.tf_lo) return 'forward-cg';
  if (currentTf > range.to_aft_hi) return 'aft-cg';
  return 'over-mtow';
}

// Public API — returns one of:
//   { status: 'ok' }
//   { status: 'adjust-fuel',             issue, fuelL_gal, fuelR_gal, total_gal }
//   { status: 'adjust-fuel-and-baggage', issue, baggage_lb, baggage_delta_lb, fuelL_gal, fuelR_gal, total_gal }
//   { status: 'impossible',              reason }
export function suggest(state) {
  const taxi_lb    = (state.fuelTaxi?.volume_gal    ?? 0) * DENSITY;
  const burnoff_lb = (state.fuelBurnoff?.volume_gal ?? 0) * DENSITY;
  const currentTf  = Math.max(0,
    (state.fuelL.volume_gal + state.fuelR.volume_gal) * DENSITY - taxi_lb);

  const mtow_lb    = state.mtow?.weight_lb || P2006T.mtow_lb;
  const reserve_lb = (state.fuelReserve?.volume_gal ?? 8) * DENSITY;

  const rangeAt = (bag) => {
    const { weight, moment } = baseWeightMoment(state, bag);
    return tfRange(weight, moment, burnoff_lb, taxi_lb, mtow_lb, reserve_lb);
  };

  const { weight: bw } = baseWeightMoment(state);
  const currentBag = state.baggage.weight_lb;
  const bwNoBag    = bw - currentBag;
  const range      = rangeAt(currentBag);
  const overMzfw   = bw > P2006T.mzfw_lb;

  if (!overMzfw && range.feasible) {
    if (fuelFits(currentTf, range)) return { status: 'ok' };
    if (currentTf < range.tf_lo) {
      const split = fitFuel(range, range.tf_lo, taxi_lb);
      if (split) return { status: 'adjust-fuel', issue: issueLabel(currentTf, range), ...split };
    }
  }

  // Remove baggage before giving up fuel. Stops at the forward CG limit, then
  // settles for the most fuel that fits.
  let best = null;
  for (let bag = currentBag; bag >= 0; bag = Math.ceil(bag) - 1) {
    if (bwNoBag + bag > P2006T.mzfw_lb) continue;
    const { weight, moment } = baseWeightMoment(state, bag);
    if (bag < currentBag && moment / weight < FWD) break;
    const split = fitFuel(rangeAt(bag), currentTf, taxi_lb);
    if (!split) continue;
    const tf = takeoffFuel(split, taxi_lb);
    if (!best || tf > best.tf + 1e-6) best = { bag, split, tf };
    if (tf >= currentTf - 1e-6) break;
  }

  if (best?.bag === currentBag) {
    return { status: 'adjust-fuel', issue: issueLabel(currentTf, range), ...best.split };
  }
  if (best) {
    return {
      status:           'adjust-fuel-and-baggage',
      issue:            overMzfw ? 'over-mzfw' : currentTf > range.to_aft_hi ? 'aft-cg' : 'over-mtow',
      baggage_lb:       best.bag,
      baggage_delta_lb: best.bag - currentBag,
      ...best.split,
    };
  }

  if (overMzfw) {
    return {
      status: 'impossible',
      reason: `Zero-fuel weight ${Math.round(bw)} lb exceeds MZFW ${P2006T.mzfw_lb} lb.`,
    };
  }

  // Forward CG with no fuel solution — try adding baggage.
  // Baggage arm (5.533 ft) is very aft; adding it rotates CG aft, reducing
  // the required fuel to satisfy the forward-CG constraint.
  // Cap the baggage search: too much baggage eats into MTOW headroom and can
  // prevent meeting the minimum fuel requirement (burnoff + landing reserve).
  const effectiveMaxBag = Math.min(
    P2006T.baggage.max_lb,
    mtow_lb - bwNoBag - taxi_lb - burnoff_lb - reserve_lb,
    P2006T.mzfw_lb - bwNoBag,
  );

  if (effectiveMaxBag < currentBag) {
    return { status: 'impossible', reason: 'Aircraft cannot meet minimum fuel requirements within MTOW.' };
  }

  if (!rangeAt(effectiveMaxBag).feasible) {
    return { status: 'impossible', reason: 'CG cannot be resolved within MTOW and envelope limits.' };
  }

  // Binary search for the minimum baggage that opens a feasible tf window.
  // Feasibility is monotone within [currentBag, effectiveMaxBag].
  let lo = currentBag, hi = effectiveMaxBag;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (rangeAt(mid).feasible) hi = mid; else lo = mid;
  }

  // Bump baggage by 1 lb at a time until the rounded fuel lands inside the window.
  for (let bump = 0; bump <= 10; bump++) {
    const bag = Math.ceil(hi) + bump;
    if (bag > effectiveMaxBag) break;
    const split = fitFuel(rangeAt(bag), currentTf, taxi_lb);
    if (split) {
      return {
        status:           'adjust-fuel-and-baggage',
        issue:            'forward-cg',
        baggage_lb:       bag,
        baggage_delta_lb: bag - currentBag,
        ...split,
      };
    }
  }

  return { status: 'impossible', reason: 'CG cannot be resolved within W&B precision limits.' };
}
