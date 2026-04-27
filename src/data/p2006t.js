// Tecnam P2006T constants — POH 4th Edition Rev. 21, Doc. No. 2006/044.
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

  // Speed limitations — POH §2 SW2-5 (Increased MTOW 1230 kg supplement)
  speeds_kias: {
    vne:      171,   // never exceed
    vno:      138,   // max structural cruise
    va:       122,   // design maneuvering
    vo:        93,   // operating maneuvering
    vle:       93,   // max landing gear extended
    vlo:       93,   // max landing gear operating
    vfe_to:   122,   // max flaps T/O extended
    vfe_full:  93,   // max flaps FULL extended
    vmc:       62,   // min control, OEI flaps T/O
    vso:       54,   // stall, gear/flaps FULL (white band lower)
    vs1:       66,   // stall, clean (green band lower)
    vyse:      84,   // best ROC, OEI — MTOW 1230 kg, SL ISA (blue line)
    vxse:      83,   // best gradient, OEI — MTOW 1230 kg, SL ISA
    vyse_1180: 80,   // VYSE at MTOW 1180 kg (standard supplement)
    vxse_1180: 79,   // VXSE at MTOW 1180 kg
  },

  // Powerplant — POH §2.4 / §7.3 (Rotax 912 S3, each engine)
  powerplant: {
    model:          'Rotax 912 S3',
    engines:         2,
    to_power_kw:     73.5,   // max takeoff, 5 min limit
    to_power_hp:     98.6,
    to_prop_rpm:     2388,   // 5800 engine rpm via reduction gear
    cont_power_kw:   69.0,   // max continuous
    cont_power_hp:   92.5,
    cont_prop_rpm:   2265,   // 5500 engine rpm
  },

  // Takeoff performance — POH §5 SW5-7 to SW5-9
  // Conditions: grass runway, flaps T/O, liftoff 65 KIAS, obstacle speed 70 KIAS, full throttle.
  // Distances in metres. Temperature columns: OAT = -25, 0, 25, 50 °C; last value is ISA.
  // Corrections (apply to grass figures):
  //   Headwind:     −2.5 m per kt on ground roll
  //   Tailwind:     +10 m per kt on ground roll
  //   Paved runway: −6 % on ground roll
  //   Runway slope: +5 % on ground roll per each +1 % upslope
  takeoff: {
    corrections: {
      headwind_m_per_kt:        -2.5,  // ground roll only
      tailwind_m_per_kt:       +10,    // ground roll only
      paved_gr_pct:              -6,   // % adjustment to ground roll
      slope_gr_pct_per_upslope: +5,    // % per each +1% upslope, ground roll only
    },
    // data[weight_kg][pressure_alt_ft] = { gr, to50ft }
    // Each array: [oat_n25, oat_0, oat_25, oat_50, isa]
    data: {
      1230: {
          0: { gr: [207, 263, 328, 401, 301],    to50ft: [271,  345,  429,  525,  394] },
       1000: { gr: [231, 294, 366, 447, 330],    to50ft: [303,  385,  479,  586,  432] },
       2000: { gr: [258, 328, 409, 500, 362],    to50ft: [338,  430,  535,  654,  474] },
       3000: { gr: [289, 367, 457, 559, 398],    to50ft: [378,  480,  598,  731,  521] },
       4000: { gr: [323, 411, 511, 625, 438],    to50ft: [423,  537,  669,  818,  573] },
       5000: { gr: [362, 460, 572, 700, 481],    to50ft: [473,  602,  749,  916,  630] },
       6000: { gr: [405, 515, 642, 785, 530],    to50ft: [531,  675,  840, 1027,  694] },
       7000: { gr: [455, 578, 720, 880, 584],    to50ft: [595,  757,  942, 1152,  765] },
       8000: { gr: [511, 650, 809, 989, 645],    to50ft: [669,  850, 1059, 1295,  844] },
       9000: { gr: [575, 730, 909, 1112, 712],   to50ft: [752,  956, 1190, 1456,  932] },
      10000: { gr: [647, 822, 1023, 1252, 786],  to50ft: [847, 1076, 1340, 1638, 1029] },
      },
      1080: {
          0: { gr: [148, 188, 234, 286, 215],   to50ft: [193, 246, 306, 374, 281] },
       1000: { gr: [165, 210, 261, 319, 235],   to50ft: [216, 274, 341, 418, 308] },
       2000: { gr: [184, 234, 291, 356, 258],   to50ft: [241, 306, 381, 466, 338] },
       3000: { gr: [206, 262, 326, 398, 284],   to50ft: [269, 342, 426, 521, 372] },
       4000: { gr: [230, 293, 364, 446, 312],   to50ft: [301, 383, 477, 583, 409] },
       5000: { gr: [258, 328, 408, 499, 343],   to50ft: [338, 429, 534, 653, 449] },
       6000: { gr: [289, 368, 457, 559, 378],   to50ft: [378, 481, 599, 732, 495] },
       7000: { gr: [324, 412, 513, 628, 417],   to50ft: [425, 540, 672, 822, 545] },
       8000: { gr: [364, 463, 577, 705, 460],   to50ft: [477, 606, 755, 923, 602] },
       9000: { gr: [410, 521, 648, 793, 508],   to50ft: [536, 682, 849, 1038, 664] },
      10000: { gr: [461, 586, 730, 893, 561],   to50ft: [604, 767, 955, 1168, 734] },
      },
      930: {
          0: { gr: [100, 127, 158, 194, 146],   to50ft: [131, 167, 207, 254, 190] },
       1000: { gr: [112, 142, 177, 216, 160],   to50ft: [146, 186, 231, 283, 209] },
       2000: { gr: [125, 159, 197, 242, 175],   to50ft: [163, 208, 258, 316, 229] },
       3000: { gr: [140, 177, 221, 270, 192],   to50ft: [183, 232, 289, 353, 252] },
       4000: { gr: [156, 198, 247, 302, 212],   to50ft: [204, 260, 323, 395, 277] },
       5000: { gr: [175, 222, 277, 338, 233],   to50ft: [229, 291, 362, 443, 305] },
       6000: { gr: [196, 249, 310, 379, 256],   to50ft: [257, 326, 406, 496, 335] },
       7000: { gr: [220, 280, 348, 426, 282],   to50ft: [288, 366, 455, 557, 370] },
       8000: { gr: [247, 314, 391, 478, 312],   to50ft: [323, 411, 512, 626, 408] },
       9000: { gr: [278, 353, 440, 538, 344],   to50ft: [364, 462, 575, 704, 450] },
      10000: { gr: [313, 397, 495, 605, 380],   to50ft: [409, 520, 648, 792, 498] },
      },
    },
  },

  // Landing performance — POH §5 SW5-19 to SW5-22
  // Conditions: grass runway, flaps LAND, approach 70 KIAS, throttle idle.
  // Distances in metres. Temperature columns: OAT = -25, 0, 25, 50 °C; last value is ISA.
  // Corrections (apply to grass figures):
  //   Headwind:     −5 m per kt on ground roll; similar reduction on 50ft distance
  //   Tailwind:     +11 m per kt on ground roll
  //   Paved runway: −2 % on ground roll
  //   Runway slope: −2.5 % on ground roll per each +1 % upslope
  landing: {
    corrections: {
      headwind_m_per_kt:        -5,    // ground roll only
      tailwind_m_per_kt:       +11,    // ground roll only
      paved_gr_pct:              -2,   // % adjustment to ground roll
      slope_gr_pct_per_upslope: -2.5,  // % per each +1% upslope, ground roll only
    },
    // data[weight_kg][pressure_alt_ft] = { gr, to50ft }
    // Each array: [oat_n25, oat_0, oat_25, oat_50, isa]
    data: {
      1230: {
          0: { gr: [199, 219, 239, 259, 231], to50ft: [308, 334, 359, 384, 349] },
       1000: { gr: [206, 227, 248, 269, 238], to50ft: [318, 344, 370, 396, 358] },
       2000: { gr: [214, 236, 257, 279, 245], to50ft: [328, 355, 382, 408, 367] },
       3000: { gr: [222, 244, 267, 289, 252], to50ft: [348, 377, 406, 434, 385] },
       4000: { gr: [230, 254, 277, 300, 260], to50ft: [348, 377, 406, 434, 385] },
       5000: { gr: [239, 263, 287, 311, 268], to50ft: [359, 389, 419, 448, 395] },
       6000: { gr: [248, 273, 298, 323, 276], to50ft: [371, 402, 432, 463, 405] },
       7000: { gr: [258, 284, 310, 336, 285], to50ft: [382, 415, 446, 478, 416] },
       8000: { gr: [268, 295, 322, 349, 294], to50ft: [395, 428, 461, 494, 427] },
       9000: { gr: [278, 306, 334, 362, 303], to50ft: [408, 442, 476, 510, 438] },
      10000: { gr: [289, 318, 348, 377, 313], to50ft: [421, 457, 492, 527, 450] },
      },
      1080: {
          0: { gr: [175, 192, 210, 227, 203], to50ft: [271, 293, 315, 337, 306] },
       1000: { gr: [181, 199, 218, 236, 209], to50ft: [279, 302, 325, 348, 314] },
       2000: { gr: [188, 207, 226, 245, 215], to50ft: [288, 311, 335, 358, 322] },
       3000: { gr: [195, 215, 234, 254, 222], to50ft: [306, 331, 356, 381, 338] },
       4000: { gr: [202, 223, 243, 263, 228], to50ft: [306, 331, 356, 381, 338] },
       5000: { gr: [210, 231, 252, 273, 235], to50ft: [315, 342, 368, 394, 347] },
       6000: { gr: [218, 240, 262, 284, 243], to50ft: [325, 353, 380, 406, 356] },
       7000: { gr: [226, 249, 272, 295, 250], to50ft: [336, 364, 392, 420, 365] },
       8000: { gr: [235, 259, 283, 306, 258], to50ft: [347, 376, 405, 434, 375] },
       9000: { gr: [244, 269, 294, 318, 266], to50ft: [358, 388, 418, 448, 385] },
      10000: { gr: [254, 280, 305, 331, 275], to50ft: [370, 401, 432, 463, 395] },
      },
      930: {
          0: { gr: [150, 166, 181, 196, 175], to50ft: [233, 252, 271, 290, 264] },
       1000: { gr: [156, 172, 187, 203, 180], to50ft: [240, 260, 280, 299, 270] },
       2000: { gr: [162, 178, 194, 211, 185], to50ft: [248, 268, 288, 309, 277] },
       3000: { gr: [168, 185, 202, 219, 191], to50ft: [263, 285, 307, 328, 291] },
       4000: { gr: [174, 192, 209, 227, 197], to50ft: [263, 285, 307, 328, 291] },
       5000: { gr: [181, 199, 217, 235, 203], to50ft: [272, 294, 317, 339, 299] },
       6000: { gr: [188, 207, 226, 244, 209], to50ft: [280, 304, 327, 350, 307] },
       7000: { gr: [195, 215, 234, 254, 215], to50ft: [289, 313, 338, 361, 315] },
       8000: { gr: [203, 223, 243, 264, 222], to50ft: [299, 324, 349, 373, 323] },
       9000: { gr: [210, 232, 253, 274, 229], to50ft: [308, 334, 360, 386, 331] },
      10000: { gr: [219, 241, 263, 285, 237], to50ft: [319, 346, 372, 399, 340] },
      },
    },
  },

  // Balked landing climb gradient — POH §5 SW5-22
  balked_landing: {
    weight_kg:           1230,
    flaps:               'T/O',
    gear:                'DOWN',
    speed_kias:           72,
    climb_gradient_pct:   9.4,
    climb_gradient_deg:   5.4,
  },

  // Climb performance — POH §5 SW5-10 to SW5-15
  // Max continuous power. Rates in ft/min. Temperature columns: -25, 0, 25, 50 °C, ISA.
  // data[weight_kg][pa_ft] = { speed_kias, rates: [oat_n25, oat_0, oat_25, oat_50, isa] }
  climb: {
    // Takeoff climb at VY — flaps T/O, gear up (SW5-10)
    to_vy: { data: {
      1230: {
          0: { speed_kias: 86, rates: [1276, 1088,  920,  768,  985] },
       2000: { speed_kias: 83, rates: [1133,  948,  783,  634,  873] },
       4000: { speed_kias: 79, rates: [ 990,  809,  646,  500,  761] },
       6000: { speed_kias: 76, rates: [ 848,  670,  510,  366,  649] },
       8000: { speed_kias: 73, rates: [ 707,  531,  374,  233,  537] },
      10000: { speed_kias: 70, rates: [ 565,  393,  239,  100,  425] },
      12000: { speed_kias: 67, rates: [ 425,  256,  104,  -32,  313] },
      14000: { speed_kias: 64, rates: [ 285,  118,  -30, -164,  201] },
      },
      1080: {
          0: { speed_kias: 85, rates: [1507, 1302, 1119,  954, 1190] },
       2000: { speed_kias: 82, rates: [1351, 1150,  970,  808, 1068] },
       4000: { speed_kias: 79, rates: [1196,  998,  822,  662,  946] },
       6000: { speed_kias: 76, rates: [1041,  847,  674,  517,  825] },
       8000: { speed_kias: 73, rates: [ 887,  696,  526,  372,  703] },
      10000: { speed_kias: 69, rates: [ 734,  546,  379,  228,  581] },
      12000: { speed_kias: 66, rates: [ 581,  397,  232,   84,  459] },
      14000: { speed_kias: 63, rates: [ 428,  248,   86,  -59,  338] },
      },
      930: {
          0: { speed_kias: 85, rates: [1803, 1575, 1372, 1189, 1451] },
       2000: { speed_kias: 82, rates: [1630, 1406, 1206, 1026, 1315] },
       4000: { speed_kias: 79, rates: [1457, 1238, 1041,  864, 1180] },
       6000: { speed_kias: 75, rates: [1286, 1070,  877,  703, 1045] },
       8000: { speed_kias: 72, rates: [1114,  902,  713,  542,  909] },
      10000: { speed_kias: 69, rates: [ 944,  735,  549,  382,  774] },
      12000: { speed_kias: 65, rates: [ 774,  569,  387,  222,  639] },
      14000: { speed_kias: 62, rates: [ 604,  404,  224,   63,  503] },
      },
    }},

    // Takeoff climb at VX — flaps T/O, gear up (SW5-11)
    to_vx: { data: {
      1230: {
          0: { speed_kias: 78, rates: [1214, 1037,  880,  738,  941] },
       1000: { speed_kias: 76, rates: [1147,  972,  816,  675,  888] },
       2000: { speed_kias: 75, rates: [1080,  906,  751,  612,  836] },
       3000: { speed_kias: 74, rates: [1013,  841,  687,  549,  783] },
       4000: { speed_kias: 73, rates: [ 946,  776,  623,  486,  731] },
       5000: { speed_kias: 72, rates: [ 879,  710,  560,  424,  678] },
       6000: { speed_kias: 71, rates: [ 813,  645,  496,  361,  626] },
       7000: { speed_kias: 70, rates: [ 746,  580,  432,  299,  574] },
      },
      1080: {
          0: { speed_kias: 78, rates: [1283, 1102,  940,  794, 1002] },
       1000: { speed_kias: 76, rates: [1214, 1034,  874,  729,  949] },
       2000: { speed_kias: 75, rates: [1145,  967,  808,  664,  895] },
       3000: { speed_kias: 74, rates: [1076,  900,  742,  600,  841] },
       4000: { speed_kias: 73, rates: [1008,  833,  676,  535,  787] },
       5000: { speed_kias: 72, rates: [ 939,  766,  611,  471,  733] },
       6000: { speed_kias: 71, rates: [ 871,  699,  545,  407,  679] },
       7000: { speed_kias: 70, rates: [ 803,  632,  480,  342,  625] },
      },
      930: {
          0: { speed_kias: 78, rates: [1435, 1243, 1072,  918, 1138] },
       1000: { speed_kias: 76, rates: [1362, 1172, 1002,  849, 1081] },
       2000: { speed_kias: 75, rates: [1289, 1101,  932,  780, 1024] },
       3000: { speed_kias: 74, rates: [1216, 1030,  863,  712,  967] },
       4000: { speed_kias: 73, rates: [1144,  958,  793,  644,  910] },
       5000: { speed_kias: 72, rates: [1071,  888,  724,  576,  853] },
       6000: { speed_kias: 71, rates: [ 999,  817,  654,  508,  796] },
       7000: { speed_kias: 69, rates: [ 927,  746,  585,  440,  739] },
      },
    }},

    // Enroute climb at VY — flaps up, gear up (SW5-12)
    enroute_vy: { data: {
      1230: {
          0: { speed_kias: 84, rates: [1317, 1135,  973,  827, 1036] },
       2000: { speed_kias: 83, rates: [1179, 1000,  841,  697,  928] },
       4000: { speed_kias: 81, rates: [1041,  865,  709,  568,  819] },
       6000: { speed_kias: 80, rates: [ 904,  731,  577,  439,  711] },
       8000: { speed_kias: 78, rates: [ 767,  598,  446,  310,  603] },
      10000: { speed_kias: 77, rates: [ 631,  464,  316,  182,  495] },
      12000: { speed_kias: 75, rates: [ 495,  332,  186,   54,  387] },
      14000: { speed_kias: 73, rates: [ 360,  199,   56,  -73,  279] },
      },
      1080: {
          0: { speed_kias: 83, rates: [1560, 1360, 1182, 1022, 1251] },
       2000: { speed_kias: 82, rates: [1408, 1212, 1037,  879, 1132] },
       4000: { speed_kias: 80, rates: [1257, 1064,  892,  737, 1014] },
       6000: { speed_kias: 78, rates: [1106,  917,  748,  595,  895] },
       8000: { speed_kias: 76, rates: [ 956,  770,  604,  454,  776] },
      10000: { speed_kias: 74, rates: [ 807,  624,  461,  314,  658] },
      12000: { speed_kias: 72, rates: [ 657,  478,  318,  173,  539] },
      14000: { speed_kias: 70, rates: [ 509,  333,  175,   34,  420] },
      },
      930: {
          0: { speed_kias: 82, rates: [1873, 1649, 1449, 1269, 1527] },
       2000: { speed_kias: 81, rates: [1703, 1483, 1286, 1109, 1393] },
       4000: { speed_kias: 79, rates: [1533, 1317, 1124,  950, 1260] },
       6000: { speed_kias: 77, rates: [1364, 1151,  962,  791, 1127] },
       8000: { speed_kias: 75, rates: [1196,  987,  800,  632,  994] },
      10000: { speed_kias: 73, rates: [1028,  823,  639,  474,  861] },
      12000: { speed_kias: 71, rates: [ 860,  659,  479,  317,  727] },
      14000: { speed_kias: 69, rates: [ 693,  496,  319,  160,  594] },
      },
    }},

    // Enroute climb at VX — flaps up, gear up (SW5-13)
    enroute_vx: { data: {
      1230: {
          0: { speed_kias: 72, rates: [1241, 1073,  924,  789,  982] },
       1000: { speed_kias: 72, rates: [1177, 1011,  863,  729,  932] },
       2000: { speed_kias: 72, rates: [1114,  949,  802,  669,  882] },
       3000: { speed_kias: 72, rates: [1050,  887,  741,  609,  832] },
       4000: { speed_kias: 72, rates: [ 986,  825,  680,  550,  782] },
       5000: { speed_kias: 72, rates: [ 923,  763,  619,  490,  732] },
       6000: { speed_kias: 71, rates: [ 860,  701,  559,  431,  682] },
       7000: { speed_kias: 71, rates: [ 797,  639,  498,  371,  632] },
      },
      1080: {
          0: { speed_kias: 72, rates: [1480, 1295, 1130,  981, 1194] },
       1000: { speed_kias: 72, rates: [1410, 1226, 1062,  915, 1139] },
       2000: { speed_kias: 72, rates: [1340, 1158,  995,  848, 1084] },
       3000: { speed_kias: 72, rates: [1269, 1089,  928,  782, 1029] },
       4000: { speed_kias: 71, rates: [1199, 1020,  861,  717,  973] },
       5000: { speed_kias: 71, rates: [1129,  952,  794,  651,  918] },
       6000: { speed_kias: 71, rates: [1059,  884,  727,  585,  863] },
       7000: { speed_kias: 71, rates: [ 990,  815,  660,  520,  808] },
      },
      930: {
          0: { speed_kias: 72, rates: [1787, 1578, 1391, 1223, 1463] },
       1000: { speed_kias: 72, rates: [1707, 1500, 1315, 1148, 1401] },
       2000: { speed_kias: 71, rates: [1628, 1422, 1239, 1074, 1339] },
       3000: { speed_kias: 71, rates: [1549, 1345, 1163,  999, 1277] },
       4000: { speed_kias: 71, rates: [1470, 1268, 1087,  925, 1215] },
       5000: { speed_kias: 71, rates: [1391, 1190, 1012,  851, 1153] },
       6000: { speed_kias: 71, rates: [1312, 1113,  936,  777, 1090] },
       7000: { speed_kias: 70, rates: [1233, 1036,  861,  703, 1028] },
      },
    }},

    // OEI climb at VYSE — prop feathered (inop), flaps up, gear up (SW5-14)
    oei_vyse: { data: {
      1230: {
          0: { speed_kias: 84, rates: [ 330,  230,  142,   62,  176] },
       1000: { speed_kias: 83, rates: [ 292,  193,  106,   26,  147] },
       2000: { speed_kias: 82, rates: [ 254,  157,   69,   -9,  117] },
       3000: { speed_kias: 81, rates: [ 216,  120,   33,  -44,   87] },
       4000: { speed_kias: 80, rates: [ 179,   83,   -3,  -80,   58] },
       5000: { speed_kias: 79, rates: [ 141,   46,  -38, -115,   28] },
       6000: { speed_kias: 79, rates: [ 104,   10,  -74, -150,   -1] },
       7000: { speed_kias: 78, rates: [  67,  -27, -110, -185,  -31] },
      },
      1080: {
          0: { speed_kias: 80, rates: [ 436,  330,  235,  149,  271] },
       1000: { speed_kias: 80, rates: [ 396,  290,  196,  111,  240] },
       2000: { speed_kias: 79, rates: [ 355,  251,  157,   73,  208] },
       3000: { speed_kias: 79, rates: [ 315,  211,  118,   35,  176] },
       4000: { speed_kias: 79, rates: [ 275,  172,   80,   -3,  145] },
       5000: { speed_kias: 79, rates: [ 234,  132,   41,  -41,  113] },
       6000: { speed_kias: 78, rates: [ 194,   93,    3,  -78,   81] },
       7000: { speed_kias: 78, rates: [ 154,   54,  -35, -116,   50] },
      },
      930: {
          0: { speed_kias: 79, rates: [ 574,  455,  349,  253,  390] },
       1000: { speed_kias: 79, rates: [ 529,  411,  305,  211,  355] },
       2000: { speed_kias: 79, rates: [ 483,  367,  262,  168,  319] },
       3000: { speed_kias: 78, rates: [ 438,  322,  219,  126,  284] },
       4000: { speed_kias: 78, rates: [ 393,  278,  176,   83,  248] },
       5000: { speed_kias: 78, rates: [ 348,  235,  133,   41,  213] },
       6000: { speed_kias: 78, rates: [ 304,  191,   90,   -1,  178] },
       7000: { speed_kias: 77, rates: [ 259,  147,   47,  -43,  142] },
      },
    }},

    // OEI climb at VXSE — prop feathered (inop), flaps up, gear up (SW5-15)
    oei_vxse: { data: {
      1230: {
          0: { speed_kias: 83, rates: [ 325,  227,  140,   61,  174] },
       1000: { speed_kias: 82, rates: [ 288,  191,  104,   26,  145] },
       2000: { speed_kias: 81, rates: [ 251,  155,   69,   -9,  116] },
       3000: { speed_kias: 81, rates: [ 214,  118,   33,  -44,   86] },
       4000: { speed_kias: 80, rates: [ 177,   82,   -2,  -78,   57] },
       5000: { speed_kias: 79, rates: [ 140,   46,  -38, -113,   28] },
       6000: { speed_kias: 78, rates: [ 103,   10,  -73, -148,   -1] },
       7000: { speed_kias: 77, rates: [  66,  -26, -108, -183,  -30] },
      },
      1080: {
          0: { speed_kias: 79, rates: [ 424,  321,  229,  147,  265] },
       1000: { speed_kias: 79, rates: [ 385,  283,  192,  110,  234] },
       2000: { speed_kias: 79, rates: [ 346,  245,  155,   73,  204] },
       3000: { speed_kias: 79, rates: [ 307,  207,  117,   37,  173] },
       4000: { speed_kias: 79, rates: [ 268,  169,   80,    0,  143] },
       5000: { speed_kias: 78, rates: [ 229,  131,   43,  -36,  112] },
       6000: { speed_kias: 78, rates: [ 190,   93,    6,  -73,   81] },
       7000: { speed_kias: 78, rates: [ 152,   55,  -31, -109,   51] },
      },
      930: {
          0: { speed_kias: 78, rates: [ 556,  442,  341,  249,  380] },
       1000: { speed_kias: 78, rates: [ 513,  400,  299,  209,  346] },
       2000: { speed_kias: 78, rates: [ 469,  358,  258,  168,  312] },
       3000: { speed_kias: 78, rates: [ 426,  316,  217,  128,  279] },
       4000: { speed_kias: 78, rates: [ 383,  274,  176,   87,  245] },
       5000: { speed_kias: 78, rates: [ 340,  232,  134,   47,  211] },
       6000: { speed_kias: 78, rates: [ 298,  190,   93,    7,  177] },
       7000: { speed_kias: 77, rates: [ 255,  148,   52,  -34,  143] },
      },
    }},
  },

  // Cruise performance — POH §5 SW5-16 to SW5-19
  // Weight 1150 kg (2535 lb). F.C. = fuel consumption per engine (L/hr); double for total.
  // Each entry: [rpm, map_inhg, pwr_pct, tas_ktas, fc_lhr_per_eng]
  cruise: {
    // Pressure altitude 0 ft, ISA (15 °C / 59 °F)
    alt_0_ft_isa: [
      [2250, 29.5, 97, 145, 27.1],
      [2250, 28,   83, 136, 23.2],
      [2250, 26,   65, 124, 18.2],
      [2250, 24,   56, 116, 15.7],
      [2250, 22,   43, 103, 12.1],
      [2250, 20,   37,  95, 10.4],
      [2100, 28,   80, 134, 22.2],
      [2100, 26,   63, 122, 17.5],
      [2100, 24,   54, 114, 15.1],
      [2100, 22,   41, 100, 11.5],
      [2100, 20,   35,  91,  9.7],
      [1900, 26,   58, 118, 16.2],
      [1900, 24,   50, 111, 14.1],
      [1900, 22,   39,  97, 10.8],
      [1900, 20,   33,  88,  9.1],
    ],
    // Pressure altitude 3000 ft, ISA (9 °C / 48 °F)
    alt_3000_ft_isa: [
      [2388, 26.4, 87, 143, 24.3],
      [2250, 26.4, 85, 141, 23.6],
      [2250, 26,   81, 138, 22.6],
      [2250, 24,   68, 129, 18.9],
      [2250, 22,   54, 117, 15.1],
      [2250, 20,   45, 108, 12.7],
      [2100, 26.4, 81, 138, 22.6],
      [2100, 26,   77, 136, 21.6],
      [2100, 24,   65, 127, 18.1],
      [2100, 22,   51, 114, 14.3],
      [2100, 20,   43, 104, 11.9],
      [1900, 26.4, 74, 134, 20.7],
      [1900, 26,   71, 131, 19.8],
      [1900, 24,   60, 122, 16.7],
      [1900, 22,   48, 110, 13.3],
      [1900, 20,   40, 101, 11.1],
    ],
    // Pressure altitude 6000 ft, ISA (3 °C / 37 °F)
    alt_6000_ft_isa: [
      [2388, 23.6, 79, 141, 22.0],
      [2250, 23.6, 76, 139, 21.4],
      [2250, 22,   65, 130, 18.1],
      [2250, 20,   54, 120, 14.9],
      [2250, 18,   44, 108, 12.2],
      [2100, 23.6, 73, 137, 20.4],
      [2100, 22,   62, 127, 17.2],
      [2100, 20,   51, 116, 14.1],
      [2100, 18,   42, 106, 11.7],
      [1900, 23.6, 67, 132, 18.7],
      [1900, 22,   57, 123, 15.8],
      [1900, 20,   47, 112, 13.1],
      [1900, 18,   39, 102, 10.9],
    ],
    // Pressure altitude 9000 ft, ISA (−3 °C / 27 °F)
    alt_9000_ft_isa: [
      [2388, 21.1, 71, 139, 19.7],
      [2250, 21.1, 69, 137, 19.2],
      [2250, 20,   62, 131, 17.2],
      [2250, 18,   50, 119, 14.0],
      [2100, 21.1, 65, 134, 18.3],
      [2100, 20,   59, 128, 16.4],
      [2100, 18,   48, 116, 13.4],
      [1900, 21.1, 60, 129, 16.8],
      [1900, 20,   54, 123, 15.1],
      [1900, 18,   44, 112, 12.4],
    ],
    // Pressure altitude 12000 ft, ISA (−9 °C / 16 °F)
    alt_12000_ft_isa: [
      [2388, 18.8, 63, 136, 17.7],
      [2250, 18.8, 61, 134, 17.2],
      [2250, 18,   57, 129, 15.9],
      [2100, 18.8, 59, 131, 16.4],
      [2100, 18,   54, 126, 15.2],
      [1900, 18.8, 54, 126, 15.0],
      [1900, 18,   50, 121, 13.9],
    ],
  },
};
