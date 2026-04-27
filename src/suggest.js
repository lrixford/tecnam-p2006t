import { P2006T } from './data/p2006t.js';

// Pure W&B suggestion engine.
// Immutable: passenger weights, taxi fuel, enroute (burnoff) fuel.
// Mutable:   fuel load (add/remove), baggage (add only).
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

function splitFuel(tf_lb, taxi_lb) {
  const total_gal = (tf_lb + taxi_lb) / DENSITY;
  // Floor to 0.1 gal so rounding never pushes us back over a limit.
  const perTank = Math.floor(Math.min(total_gal / 2, P2006T.fuel.perTank_max_gal) * 10) / 10;
  return {
    fuelL_gal: perTank,
    fuelR_gal: perTank,
    total_gal: +(perTank * 2).toFixed(1),
  };
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

  const { weight: bw, moment: bm } = baseWeightMoment(state);
  const range = tfRange(bw, bm, burnoff_lb, taxi_lb, mtow_lb, reserve_lb);

  if (range.feasible) {
    if (currentTf >= range.tf_lo && currentTf <= range.tf_hi) return { status: 'ok' };
    const suggestedTf = range.tf_hi;
    const split = splitFuel(suggestedTf, taxi_lb);
    // Verify the floor-rounded split actually lands inside the feasible window.
    const roundedTf = (split.fuelL_gal + split.fuelR_gal) * DENSITY - taxi_lb;
    if (roundedTf >= range.tf_lo && roundedTf <= range.tf_hi) {
      return { status: 'adjust-fuel', issue: issueLabel(currentTf, range), ...split };
    }
    // Window too narrow for 0.1-gal precision — fall through to baggage search.
  }

  // No feasible fuel at usable precision — try adding baggage.
  // Baggage arm (5.533 ft) is very aft; adding it rotates CG aft, reducing
  // the required fuel to satisfy the forward-CG constraint.
  // Cap the baggage search: too much baggage eats into MTOW headroom and can
  // prevent meeting the minimum fuel requirement (burnoff + landing reserve).
  const maxBag     = P2006T.baggage.max_lb;
  const currentBag = state.baggage.weight_lb;
  const bwNoBag    = bw - currentBag;
  const effectiveMaxBag = Math.min(
    maxBag,
    mtow_lb - bwNoBag - taxi_lb - burnoff_lb - reserve_lb,
  );

  if (effectiveMaxBag < currentBag) {
    return { status: 'impossible', reason: 'Aircraft cannot meet minimum fuel requirements within MTOW.' };
  }

  const { weight: bwEff, moment: bmEff } = baseWeightMoment(state, effectiveMaxBag);
  if (!tfRange(bwEff, bmEff, burnoff_lb, taxi_lb, mtow_lb, reserve_lb).feasible) {
    return { status: 'impossible', reason: 'CG cannot be resolved within MTOW and envelope limits.' };
  }

  // Binary search for the minimum baggage that opens a feasible tf window.
  // Feasibility is monotone within [currentBag, effectiveMaxBag].
  let lo = currentBag, hi = effectiveMaxBag;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    const { weight: bwM, moment: bmM } = baseWeightMoment(state, mid);
    if (tfRange(bwM, bmM, burnoff_lb, taxi_lb, mtow_lb, reserve_lb).feasible) hi = mid; else lo = mid;
  }

  // Bump baggage by 1 lb at a time until the 0.1-gal floored fuel lands inside
  // the feasible window (same precision validation as the fuel-only branch).
  for (let bump = 0; bump <= 10; bump++) {
    const bag = Math.ceil(hi) + bump;
    if (bag > effectiveMaxBag) break;
    const { weight: bwS, moment: bmS } = baseWeightMoment(state, bag);
    const rangeS = tfRange(bwS, bmS, burnoff_lb, taxi_lb, mtow_lb, reserve_lb);
    if (!rangeS.feasible) continue;
    const suggestedTf = rangeS.tf_hi;
    const split = splitFuel(suggestedTf, taxi_lb);
    const roundedTf = (split.fuelL_gal + split.fuelR_gal) * DENSITY - taxi_lb;
    if (roundedTf >= rangeS.tf_lo && roundedTf <= rangeS.tf_hi) {
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
