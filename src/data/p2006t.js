// Tecnam P2006T constants — POH refs in comments.
// Configuration: MOD 2006/015 (MTOW 1230 kg / 2712 lb).

export const P2006T = {
  mtow_lb: 2712,                  // POH §2 §15
  mzfw_lb: 2635,                  // POH §2 §15
  mlw_lb:  2712,                  // POH §2 §15

  fuel: {
    density_lb_per_gal: 6.7,      // POH §6 W&B form
    perTank_max_gal: 26.42,       // POH §2 §20 — 100 L tank capacity
    combined_usable_gal: 51.35,   // POH §2 §20 — 194.4 L usable total
  },

  baggage: {
    max_lb: 176,                  // POH §2 baggage placard (80 kg)
  },

  arms_ft: {
    pilot:   -2.97,
    copilot: -2.97,
    rearLH:  +0.753,
    rearRH:  +0.753,
    baggage: +5.533,
    fuel:    +2.516,
  },

  // MAC reference & envelope (POH §2 §15 / Figure 6-2)
  mac: {
    chord_ft: 4.39,               // 1.339 m
  },

  envelope: {
    fwd_arm_ft: 0.725,            // 0.221 m / 16.5% MAC — constant for all weights ≤ MTOW
    aft_arm_ft: 1.36,             // 0.415 m / 31% MAC   — constant for all weights
    structural_arm_ft: 1.624,     // 37% MAC — reference only, not enforced
  },
};
