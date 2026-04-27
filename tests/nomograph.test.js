import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LAYOUT, STRIPS,
  mapMomentY, mapMassX, mapFlightMassX,
  computeHops, computeTrajectory,
} from '../src/nomograph.js';

function pohState() {
  return {
    empty:       { weight_lb: 1742, moment_lb_ft: 2778.49, note: '' },
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

test('mapMomentY: chart bottom is the lowest moment', () => {
  assert.equal(mapMomentY(LAYOUT.chart.momentMin_lb_ft), LAYOUT.chart.yBottom);
});

test('mapMomentY: chart top is the highest moment', () => {
  assert.equal(mapMomentY(LAYOUT.chart.momentMax_lb_ft), LAYOUT.chart.yTop);
});

test('mapMomentY: midpoint moment is mid chart Y', () => {
  const mid = (LAYOUT.chart.momentMin_lb_ft + LAYOUT.chart.momentMax_lb_ft) / 2;
  const expectedY = (LAYOUT.chart.yTop + LAYOUT.chart.yBottom) / 2;
  assert.equal(mapMomentY(mid), expectedY);
});

test('mapMassX: zero load is at strip left edge', () => {
  for (const s of STRIPS) {
    assert.equal(mapMassX(s, 0), s.xLeft);
  }
});

test('mapMassX: full load is at strip right edge', () => {
  for (const s of STRIPS) {
    assert.equal(mapMassX(s, s.massMax_lb), s.xRight);
  }
});

test('mapFlightMassX: weightMin / weightMax map to xLeft / xRight', () => {
  assert.equal(mapFlightMassX(LAYOUT.flightMass.weightMin_lb), LAYOUT.flightMass.xLeft);
  assert.equal(mapFlightMassX(LAYOUT.flightMass.weightMax_lb), LAYOUT.flightMass.xRight);
});

test('computeHops: 4 hops in strip order', () => {
  const { hops } = computeHops(pohState(), undefined);
  assert.equal(hops.length, 4);
  assert.deepEqual(hops.map(h => h.id), ['front', 'rear', 'fuel', 'bag']);
});

test('computeHops: running moment increases as load is added at +arm stations', () => {
  const { hops } = computeHops(pohState(), undefined);
  // Front seats have negative arm → moment decreases going through front strip
  // Rear, fuel, baggage have positive arm → moment increases
  // Verify by checking that the diag.y2 at front is below (greater Y in canvas) the diag.y1
  const front = hops[0];
  assert.ok(front.diag.y2 > front.diag.y1, 'front strip rail descends in canvas (moment decreases)');
  const bag = hops[3];
  assert.ok(bag.diag.y2 < bag.diag.y1, 'baggage strip rail ascends in canvas (moment increases)');
});

test('computeHops with fuelOverride=0: fuel hop has zero mass and flat rail', () => {
  const { hops } = computeHops(pohState(), 0);
  const fuel = hops.find(h => h.id === 'fuel');
  assert.equal(fuel.mass_lb, 0);
  assert.equal(fuel.diag.y1, fuel.diag.y2);
});

test('computeTrajectory: TO/LDG/ZFW positions reflect their conditions', () => {
  const traj = computeTrajectory(pohState());
  assert.ok(traj.to.weight_lb > traj.zfw.weight_lb,
    'TO should weigh more than ZFW');
  // CG arm: ZFW is forward of TO (fuel arm > 0)
  assert.ok(traj.zfw.cg_arm_ft < traj.to.cg_arm_ft,
    'ZFW CG should be forward of TO CG (fuel arm is positive)');
});

test('computeTrajectory: terminal running moment matches TO total moment', () => {
  const traj = computeTrajectory(pohState());
  const tol = 1e-6;
  assert.ok(Math.abs(traj.to_path.runningMoment - traj.to.moment_lb_ft) < tol,
    `running moment ${traj.to_path.runningMoment} should equal TO moment ${traj.to.moment_lb_ft}`);
});
