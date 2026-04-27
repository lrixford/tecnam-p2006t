import { P2006T } from './data/p2006t.js';

// Pure W&B calc engine. No DOM, no I/O.

const ARMS = P2006T.arms_ft;
const DENSITY = P2006T.fuel.density_lb_per_gal;

function fuelLb(state) {
  return (state.fuelL.volume_gal + state.fuelR.volume_gal) * DENSITY;
}

function fuelMoment(weight_lb) {
  return weight_lb * ARMS.fuel;
}

// Compute weight + moment for a state. `fuelOverride_lb` lets us synthesize
// the landing/zero-fuel conditions without mutating the input state.
export function computeCondition(state, fuelOverride_lb, checkMtow = true) {
  const fuel_lb = fuelOverride_lb !== undefined ? fuelOverride_lb : fuelLb(state);

  const stationMoment =
      state.empty.moment_lb_ft
    + state.pilot.weight_lb   * ARMS.pilot
    + state.copilot.weight_lb * ARMS.copilot
    + state.rearLH.weight_lb  * ARMS.rearLH
    + state.rearRH.weight_lb  * ARMS.rearRH
    + state.baggage.weight_lb * ARMS.baggage;

  const weight_lb =
      state.empty.weight_lb
    + state.pilot.weight_lb + state.copilot.weight_lb
    + state.rearLH.weight_lb + state.rearRH.weight_lb
    + state.baggage.weight_lb
    + fuel_lb;

  const moment_lb_ft = stationMoment + fuelMoment(fuel_lb);
  const cg_arm_ft = weight_lb > 0 ? moment_lb_ft / weight_lb : 0;
  const cg_pct_mac = (cg_arm_ft / P2006T.mac.chord_ft) * 100;

  return {
    weight_lb,
    moment_lb_ft,
    cg_arm_ft,
    cg_pct_mac,
    fuel_lb,
    inEnvelope: isInEnvelope(weight_lb, cg_arm_ft, state.mtow?.weight_lb, checkMtow),
  };
}

export function isInEnvelope(weight_lb, cg_arm_ft, mtow_lb = P2006T.mtow_lb, checkMtow = true) {
  if (checkMtow && weight_lb > mtow_lb) return false;
  if (weight_lb <= 0) return false;
  if (cg_arm_ft < P2006T.envelope.fwd_arm_ft) return false;
  if (cg_arm_ft > P2006T.envelope.aft_arm_ft) return false;
  return true;
}

// Four loading conditions for a given state + taxi + planned burn.
//   ramp      = full loaded fuel  (block / "gross above TO")
//   takeoff   = ramp − taxi fuel
//   landing   = takeoff − planned burn
//   zeroFuel  = no fuel
export function computeAll(state) {
  const fuel_lb_total = fuelLb(state);
  const taxi_lb    = (state.fuelTaxi?.volume_gal    ?? 0) * DENSITY;
  const burnoff_lb = (state.fuelBurnoff?.volume_gal ?? 0) * DENSITY;
  const takeoff_fuel_lb = Math.max(0, fuel_lb_total - taxi_lb);
  const landing_fuel_lb = Math.max(0, takeoff_fuel_lb - burnoff_lb);

  return {
    ramp:     computeCondition(state, fuel_lb_total, false),
    takeoff:  computeCondition(state, takeoff_fuel_lb),
    landing:  computeCondition(state, landing_fuel_lb),
    zeroFuel: computeCondition(state, 0),
  };
}
