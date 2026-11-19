// Flashcard content for the P2006T / multi-engine study decks.
//
// Answers follow the course quiz packet's answer key. Where the key is
// incomplete or contradicts itself, the card carries a `note` saying so. The
// key leaves the "Factors affecting V_MC" table blank; that deck holds the
// standard answers. The "Maneuvers and drills" decks follow the packet's
// emergency checklist and maneuver guide.
// Cards on the gearbox ratio, coolant and oil plumbing, propeller governor,
// landing gear hydraulics, brakes, instruments and heating follow a separate
// systems summary sheet.
//
// Card shape:
//   id       stable key used for saved progress. Never rename an id.
//   q        the prompt
//   hint     optional short clarifier shown under the prompt
//   a        answer text; blank lines separate paragraphs
//   bullets  answer as a list (may be combined with `a`)
//   steps    answer as a sequence. The quiz asks for these to be put in order
//            instead of offering choices. Any `bullets` are shown after them.
//            A step ending in * is marked; the card note says what it means.
//   note     caveat shown under the answer
//   off      true keeps the card in this file but leaves it out of the page
//   why      the reasoning behind the answer, as short lines (filled in from WHY)
//   label    short name for the card's cell in its deck's reference table
//   figure   key of a drawing in diagrams.js, shown with the question
//   diagram  key or keys of drawings in diagrams.js, shown with the answer
//
//   letter   the COMBATS letter a V_MC factor belongs to, or '' for none
//   governor one row of the propeller governor table: speeder spring, flyweights,
//            pilot valve, then 'up' or 'down' for oil pressure, blade angle and RPM.
//            Cards with a row show the whole table, with their own row marked
//
// A deck with `table: true` shows all of its answers as a reference table on
// the back of each flashcard, filled column by column, five rows per column.
// A deck with `table: 'factors'` shows one row per card instead, grouped by
// COMBATS letter, with the direction of V_MC and of performance.
//
// Text markup: V_MC renders as V with a subscript; **text** renders bold.
//
// Units: imperial first with metric in parentheses, except for a value read
// off a gauge, which is given in the unit the gauge shows (for example the
// emergency landing gear accumulator in bar, temperatures in °C).

export const GROUPS = [
  { id: 'tecnam', title: 'P2006T Tecnam quiz' },
  { id: 'aero', title: 'Multi-engine aerodynamics quiz' },
  { id: 'flying', title: 'Maneuvers and drills' },
];

// The reasoning behind an answer, keyed by card id and shown under the answer
// as "Why". These explanations are additions; they are not in the packet.
const WHY = {
  'eng.direct-drive': [
    'The Rotax makes its power at high crankshaft speed, up to 5800 rpm.',
    'A propeller turning that fast would be inefficient and loud, with its tips near the speed of sound.',
    'The 2.43:1 gearbox brings 5800 rpm down to about 2388 rpm at the propeller.',
  ],
  'oil.describe': [
    'Dry sump means the oil lives in a separate tank, not in the bottom of the engine.',
    'Crankcase pressure pushes the used oil back to that tank.',
    'That is why the oil level is checked only after turning the propeller by hand.',
  ],
  'fuel.mogas': [
    'The Rotax is designed for unleaded fuel.',
    'The lead in 100LL leaves deposits on the spark plugs and valves and in the oil, which also lubricates the reduction gearbox.',
    'Running mostly on 100LL means more frequent oil changes.',
  ],
  'fuel.crossfeed': [
    'With one engine shut down, the fuel on that side would otherwise be dead weight.',
    'Cross-feed lets the operating engine burn it, which extends range and keeps the wings balanced.',
  ],
  'prop.single-vs-multi': [
    'A twin with a failed engine needs that propeller feathered. A windmilling propeller is a lot of drag on one side.',
    'So the hub is built to drive the blades toward feather, and oil pressure holds them out of it. Lose the oil and the propeller feathers by itself.',
    'A single has no second engine, so it needs thrust, not feather. Its blades default to low pitch (high RPM), and oil pressure is used to coarsen them.',
  ],
  'gear.main-not-locked': [
    'A main gear that is not locked can collapse on touchdown.',
    'With one main gear holding and the other collapsed, a wing drops and the airplane swings off the runway.',
    'Landing with all the landing gear up keeps the airplane level and tracking straight.',
  ],
  'fc.anti-servo': [
    'A stabilator pivots as one piece, so it takes very little force to move and gives little natural feel.',
    'Without help it would be easy to over-control in pitch.',
    'The tab moves the same way as the stabilator, only further, so the control force grows the more you deflect it.',
  ],
  'pre.rotate-prop': [
    'After shutdown some oil settles in the crankcase, so the tank reads low.',
    'Turning the propeller by hand builds crankcase pressure that pushes that oil back to the tank.',
    'The gurgle from the open tank is air arriving behind the oil. The crankcase is empty and the reading is now good.',
    'Ignition off, and turn only in the normal direction of rotation.',
  ],
  'gen.atomatoflames': [
    '14 CFR 91.205 requires a temperature gauge for each liquid-cooled engine.',
    'Most trainers are air cooled, so that item does not apply to them. On the P2006T it does.',
  ],
  'vmc.combats': [
    'These are the conditions the manufacturer uses to set the red line (14 CFR 23.149).',
    'Most are the worst case for control, so they give the highest V_MC: full power at sea level, critical engine windmilling, aft CG, light weight.',
    'The bank is the exception. Banking 5° toward the operating engine lowers V_MC, so with the wings level the real figure is higher than the red line.',
  ],
  'vmc.combats-c': [
    'The critical engine is the one whose loss yaws the airplane hardest.',
    'A windmilling propeller adds drag on that same side.',
    'Both push V_MC up, so the red line covers the worst case.',
  ],
  'vmc.combats-o': [
    'Full power on one side is the most asymmetric thrust the rudder will ever have to stop.',
    'That gives the highest V_MC.',
  ],
  'vmc.combats-m': [
    'In a bank, the sideways part of lift helps the rudder.',
    'A lighter airplane makes less lift, so it gets less of that help.',
    'So the lightest weight gives the highest V_MC.',
  ],
  'vmc.combats-b': [
    'Banking toward the operating engine tilts lift sideways to help the rudder, which lowers V_MC.',
    'The manufacturer may use up to 5° and no more.',
    'With the wings level, the real V_MC is higher than the red line.',
  ],
  'vmc.combats-a': [
    'The rudder works around the CG. An aft CG shortens its arm, so it has less leverage against the yaw.',
    'That gives the highest V_MC.',
  ],
  'vmc.combats-t': [
    'An engine failure matters most just after takeoff, so that is the configuration tested.',
    'Landing gear up takes away the keel effect that steadies the airplane against yaw.',
  ],
  'vmc.combats-s': [
    'Standard sea-level air is dense, so a normally aspirated engine makes its full power.',
    'Full power is the most asymmetric thrust, so V_MC is highest there.',
    'V_MC falls as density altitude rises.',
  ],
  'vf.power': [
    'More thrust on one side is more yaw for the rudder to stop, so it takes more airspeed to hold heading.',
    'More thrust also means more climb.',
  ],
  'vf.temp': [
    'Warmer air is thinner, so a normally aspirated engine makes less power.',
    'Less power on the operating engine is less yaw to counter, and less climb.',
  ],
  'vf.pressure': [
    'Lower pressure is thinner air, so the engine makes less power.',
    'Less asymmetric thrust lowers V_MC. Less thrust lowers performance.',
  ],
  'vf.da': [
    'Density altitude combines temperature and pressure. Higher means thinner air and less power.',
    'V_MC falls but stall speed does not, so up high the airplane can stall before it reaches V_MC.',
  ],
  'vf.bank0': [
    'With the wings level the rudder has to stop the yaw by itself, so it runs out sooner.',
    'The airplane also flies in a sideslip, and that drag costs climb.',
  ],
  'vf.bank23': [
    'Banking toward the operating engine tilts lift sideways to help the rudder.',
    'Zero sideslip comes at about 2° of bank, which is the least drag and the best climb.',
  ],
  'vf.windmill': [
    'A windmilling propeller is a big disc of drag on the inoperative side.',
    'It adds to the yaw the rudder must stop and takes away climb.',
  ],
  'vf.feather': [
    'Feathered blades sit edge-on to the airflow, so the drag on the inoperative side nearly disappears.',
    'Less yaw to stop, and more climb.',
  ],
  'vf.aft-cg': [
    'The rudder works around the CG. An aft CG shortens its arm, so it has less leverage against the yaw.',
    'Performance improves a little: the tail carries less down-load, so the wing makes less lift and less induced drag.',
  ],
  'vf.weight': [
    'In a bank, a heavier airplane is making more lift, so the sideways part of that lift is larger and helps the rudder more.',
    'More weight always costs climb.',
  ],
  'vf.flaps': [
    'Flaps add drag. The flap behind the operating engine sits in its propeller wash and drags the most, which opposes the yaw.',
    'The extra drag costs climb.',
  ],
  'vf.gear': [
    'Extended landing gear adds drag low on the airframe and acts like a keel, which steadies the airplane against yaw.',
    'The drag costs climb.',
    'How much this helps varies by airplane.',
  ],
  'vf.ground-effect': [
    'Close to the ground the wing makes less induced drag, so the airplane performs better.',
    'V_MC is usually taught as slightly lower here too.',
    'Do not count on either: both are gone as soon as you climb out of ground effect.',
  ],
  'ce.sideslip': [
    'With the wings level and the ball centered, the airplane is actually slipping sideways toward the inoperative engine.',
    'That sideslip adds drag and makes the rudder work harder, which raises V_MC.',
    'About 2° of bank toward the operating engine, with the ball a third to a half out toward that side, gives zero sideslip.',
  ],
  'ce.manifold': [
    'A normally aspirated engine that has stopped making power still has outside air in its intake.',
    'Its gauge shows roughly ambient pressure, much like the operating engine at full throttle.',
    'So manifold pressure cannot tell you which engine failed. Use "dead foot, dead engine".',
  ],
  'ce.stall-altitude': [
    'Indicated stall speed depends on weight, configuration and load factor, not on engine power.',
    'V_MC depends on power, so it falls as you climb.',
    'At some altitude the two meet. Above it the airplane stalls before it loses directional control, and a stall with asymmetric power can become a spin.',
  ],
};

export const DECKS = [
  {
    id: 'vspeeds',
    group: 'tecnam',
    title: 'V-speeds',
    blurb: 'Knots, at max takeoff weight',
    table: true,
    cards: [
      { id: 'vs.vso', q: 'V_SO', hint: 'Stall speed, landing configuration', a: '54 kt' },
      { id: 'vs.vmc', q: 'V_MC', hint: 'Minimum control speed, the red line', a: '62 kt' },
      { id: 'vs.vs1', q: 'V_S1', hint: 'Stall speed, clean', a: '66 kt' },
      { id: 'vs.vr', q: 'V_R', hint: 'Rotation speed', a: '70 kt' },
      { id: 'vs.vx', q: 'V_X', hint: 'Best angle of climb', a: '72 kt' },
      { id: 'vs.vxse', q: 'V_XSE', hint: 'Best angle of climb, one engine inoperative', a: '83 kt' },
      { id: 'vs.vy', q: 'V_Y', hint: 'Best rate of climb', a: '84 kt' },
      { id: 'vs.vyse', q: 'V_YSE', hint: 'Best rate of climb, one engine inoperative, the blue line', a: '84 kt' },
      { id: 'vs.vfe-full', label: 'V_FE (full)', q: 'V_FE, full flaps', hint: 'Maximum flaps-extended speed', a: '93 kt' },
      { id: 'vs.vfe-to', label: 'V_FE (t/o)', q: 'V_FE, takeoff flaps', hint: 'Maximum flaps-extended speed', a: '122 kt' },
      { id: 'vs.vlo-vle', label: 'V_LO, V_LE', q: 'V_LO and V_LE', hint: 'Landing gear operating and extended speeds', a: '122 kt' },
      { id: 'vs.va-vo', label: 'V_A & V_O', q: 'V_A and V_O', hint: 'Maneuvering and operating maneuvering speeds', a: '122 kt' },
      { id: 'vs.vno', q: 'V_NO', hint: 'Maximum structural cruising speed', a: '138 kt' },
      { id: 'vs.vne', q: 'V_NE', hint: 'Never-exceed speed', a: '171 kt' },
      { id: 'vs.xw', label: 'Max XW', q: 'Maximum crosswind', a: '17 kt' },
    ],
  },
  {
    id: 'engine',
    group: 'tecnam',
    title: 'Engines and cooling',
    cards: [
      {
        id: 'eng.describe',
        q: 'Describe the Bombardier Rotax 912 S3 engines (LH and RH).',
        bullets: [
          'Liquid-cooled cylinder heads',
          'Air-cooled cylinders',
          'Dry-sump oil system',
          'Reduction gearbox lowers propeller RPM',
          'Both turn clockwise, so the left engine is critical',
          'More asymmetry OEI. Explain it with PAST',
        ],
      },
      {
        id: 'eng.power',
        q: 'How much horsepower does each engine produce?',
        bullets: ['Max takeoff: 98.6 hp (73.5 kW), 5 minutes maximum', 'Max continuous: 92.5 hp (69.0 kW)'],
      },
      {
        id: 'eng.rpm',
        q: 'What is max RPM?',
        hint: 'The RPM gauges read propeller rpm',
        bullets: [
          'Max takeoff: 2388 rpm, 5 minutes maximum',
          'Max continuous: 2265 rpm (packet: 2250)',
          'Engine itself: 5800 and 5500 rpm, ahead of the gearbox',
        ],
      },
      {
        id: 'eng.how-rotax-works',
        q: 'Describe how a Rotax engine works.',
        bullets: [
          'Dual-path engine control units run the fuel injection',
          'Mixture is controlled automatically and precisely',
          'Better fuel efficiency, reliability and longevity',
          'Efficient lean-of-peak operation',
        ],
        note: 'This is the packet answer, but it describes a fuel-injected engine. The packet also says the 912 S3 has two carburetors per engine. Ask your instructor which answer they expect.',
      },
      {
        id: 'eng.coolant',
        q: 'How does the coolant system operate?',
        bullets: [
          'Liquid cooling allows a smaller engine package',
          'Radiator cools it; the water pump recycles it through the cylinders',
          'Cylinder heads liquid cooled, cylinders air cooled',
          'Expansion tank lets coolant expand and cool',
          'Use coolant that meets the Rotax 912 manual',
        ],
      },
      {
        id: 'eng.overflow',
        q: 'What is the purpose of the coolant overflow container?',
        bullets: [
          'Takes excess coolant when expansion tank pressure is too high',
          'Coolant expands and cools there',
          'As the system cools, a vacuum draws it back',
        ],
      },
      {
        id: 'eng.carb-or-fi',
        q: 'Is this engine fuel injected or carbureted?',
        a: '**Carbureted.**',
        bullets: [
          'Two carburetors per engine',
          'Constant-depression type, a variable-venturi carburetor',
          'Fuel/air ratio adjusts automatically with air pressure',
        ],
      },
      { id: 'eng.carb-count', q: 'How many carburetors does each engine have?', a: 'Two.' },
      { id: 'eng.max-ct', q: 'What is the maximum coolant temperature (CT)?', a: '120 °C (248 °F)' },
      {
        id: 'eng.direct-drive',
        q: 'Are the engines direct drive?',
        a: '**No.** A reduction gearbox lowers propeller RPM.',
      },
      {
        id: 'eng.gear-ratio',
        q: 'What is the reduction ratio of the propeller gearbox?',
        a: '**2.43 : 1**',
        bullets: [
          '5800 engine rpm gives 2388 propeller rpm',
          '5500 engine rpm gives 2265 propeller rpm',
        ],
      },
      {
        id: 'eng.water-pump',
        q: 'What drives the coolant pump?',
        a: 'The engine **camshaft**. It is a mechanical water pump.',
        bullets: [
          'Forces coolant from the radiator through the cylinder heads',
        ],
      },
      {
        id: 'eng.expansion-tank',
        q: 'Where does hot coolant go after the cylinder heads, and what limits its pressure?',
        bullets: [
          'To the expansion tank on top of the engine, under a pressure cap',
          'Too much pressure: the relief valve opens and coolant flows to the overflow bottle',
          'As the engine cools, the return valve lets a vacuum pull it back',
        ],
      },
    ],
  },
  {
    id: 'oil',
    group: 'tecnam',
    title: 'Oil system',
    cards: [
      { id: 'oil.describe', q: 'Describe the oil system.', a: 'Dry-sump, with an engine-driven oil pump.' },
      {
        id: 'oil.transit',
        q: 'Describe the transit of a drop of oil, starting at the radiator.',
        bullets: [
          'Engine-driven pump pulls oil from the reservoir',
          'Some passes through the radiator and cools',
          'Oil lubricates the engine',
          'Oil returns to the reservoir',
        ],
      },
      {
        id: 'oil.capacity',
        q: 'What are the minimum, maximum and normal operating oil capacities?',
        bullets: [
          'Follow the placard on the oil reservoir access door',
          'Level must sit between MIN and MAX',
          'Do not fly with the level out of limits',
        ],
      },
      {
        id: 'oil.temps',
        q: 'What are the operating engine oil temperatures?',
        bullets: ['Max: 130 °C (266 °F)', 'Min: 50 °C (122 °F)', 'Normal: 90 to 110 °C (190 to 230 °F)'],
      },
      {
        id: 'oil.pressure',
        q: 'What are the operating oil pressures?',
        bullets: ['Max: 7.0 bar (102 psi)', 'Min: 0.8 bar (11.6 psi)', 'Normal: 2 to 5.0 bar (29 to 72.5 psi)'],
      },
      {
        id: 'oil.type',
        q: 'What oil is to be used?',
        bullets: ['Oil with RON 424 classification', 'Check with maintenance for the specific oil'],
        note: 'The oil tank placard reads: use only oil with API classification SG or higher.',
      },
      {
        id: 'oil.liters',
        q: 'What are the maximum, minimum and operating oil quantities in liters?',
        bullets: [
          'Maximum: 3 liters',
          'Minimum: 2 liters',
          'Operating: 2.5 liters',
        ],
      },
      {
        id: 'oil.thermostat',
        q: 'What does the oil thermostatic valve do?',
        bullets: [
          'Regulates oil flow to the oil radiator by oil temperature',
          'Cold oil: valve closed, oil bypasses the radiator so the engine warms quickly',
          'About 75 °C (167 °F): valve opens, oil goes through the radiator in the lower cowling',
          'Ram air cools it before it returns to the tank',
        ],
      },
      {
        id: 'oil.regulator',
        q: 'What keeps oil pressure consistent as engine RPM changes?',
        a: 'A **pressure regulator** built into the engine-driven oil pump.',
        bullets: [
          'The pump pulls oil from the external tank and forces it through the regulator',
          'Bearings and other parts get steady pressure at any RPM',
        ],
      },
      {
        id: 'oil.tank',
        q: 'Where is the oil tank?',
        a: 'Behind the **firewall**, protected from heat sources.',
        bullets: [
          'Holes allow air ventilation',
        ],
      },
    ],
  },
  {
    id: 'fuel',
    group: 'tecnam',
    title: 'Fuel system',
    cards: [
      {
        id: 'fuel.types',
        q: 'What types of fuel can be used with the P2006T?',
        bullets: ['MoGas, minimum RON 95', 'AvGas 100LL'],
      },
      { id: 'fuel.mogas', q: 'What advantage does MoGas provide over 100LL?', a: 'Improved engine wear over time.' },
      {
        id: 'fuel.capacity',
        q: 'Describe the fuel capacity.',
        bullets: [
          'Each wing: 26.4 gal, 25.7 usable (100 L, 97 usable)',
          'Total: 52.8 gal, 51.35 usable (200 L, 194 usable)',
        ],
      },
      {
        id: 'fuel.drains',
        q: 'How many drain points must be drained before flight?',
        a: '**Four.**',
        bullets: ['One gascolator drain per side', 'One wing tank drain per side'],
      },
      {
        id: 'fuel.crossfeed',
        q: 'What is engine cross-feed, and how does it work?',
        bullets: [
          'Feeds an engine from the opposite-side tank',
          'Example: left engine from the right tank',
          'Turn that engine\'s fuel selector to the cross-side tank',
        ],
      },
      {
        id: 'fuel.selectors',
        q: 'Describe the fuel selector positions.',
        bullets: [
          'Three positions each: left, right, off',
          'Left or right picks the tank feeding that engine',
          'Off stops fuel to that engine',
        ],
      },
      {
        id: 'fuel.feed',
        q: 'How is fuel fed from the tanks to the engine?',
        bullets: ['Engine-driven fuel pumps', 'Electric auxiliary pumps in critical phases'],
      },
      { id: 'fuel.sensor', q: 'Where is the fuel-sensing unit located?', a: 'On the inboard side of each tank.' },
      { id: 'fuel.transfer', q: 'Does the P2006T use fuel transfer?', a: 'No. Fuel cross-feed only.' },
    ],
  },
  {
    id: 'props',
    group: 'tecnam',
    title: 'Propellers',
    cards: [
      {
        id: 'prop.describe',
        q: 'Describe the propeller system.',
        hint: 'Manufacturer, material, diameter',
        bullets: [
          'Two MT propellers',
          'Two blades, constant speed, full feathering',
          'Hydraulically controlled variable pitch',
          'Wood/composite, 70.08 in (1780 mm), no reduction allowed',
          'Low pitch 10°, feather 82°',
        ],
      },
      { id: 'prop.lever', q: 'Which lever regulates oil pressure in the propeller?', a: 'The propeller lever (blue lever).' },
      {
        id: 'prop.pitch-control',
        q: 'How is propeller pitch controlled?',
        bullets: [
          'Hydraulic-mechanical system',
          'Propeller lever sets spring tension',
          'Spring tension meters oil to and from the hub',
          'Result: constant speed',
        ],
      },
      {
        id: 'prop.oil-loss',
        q: 'If a propeller hub loses oil pressure, what pitch will the blades move to?',
        a: 'High pitch, feathered.',
      },
      {
        id: 'prop.oil-loss-why',
        q: 'On oil pressure loss the blades feather. What drives this, and why is it built this way?',
        bullets: ['Blades go to high pitch, low RPM', 'Reduces drag', 'Readies the engine to be secured'],
      },
      {
        id: 'prop.single-vs-multi',
        q: 'How does a single-engine constant-speed propeller differ from a multi-engine one?',
        bullets: [
          'Single-engine propellers use high oil pressure to achieve **high** pitch.',
          'Multi-engine propellers use high oil pressure to adjust to **low** pitch.',
        ],
      },
      {
        id: 'prop.governor',
        q: 'What are the working parts of the propeller governor, and what does each do?',
        bullets: [
          '**Speeder spring:** the prop lever sets its tension',
          '**Flyweights:** spin faster and sling out, spin slower and fall in',
          '**Pilot valve:** moves up or down to meter engine oil into and out of the hub',
          'Result: constant RPM at any power setting',
        ],
      },
      {
        id: 'prop.gov-forward',
        q: 'Prop lever forward: what happens in the governor?',
        label: 'Lever forward',
        governor: ['More', 'In', 'Down', 'up', 'down', 'up'],
        a: 'Blade angle **decreases** and RPM **increases**.',
      },
      {
        id: 'prop.gov-aft',
        q: 'Prop lever aft: what happens in the governor?',
        label: 'Lever aft',
        governor: ['Less', 'Out', 'Up', 'down', 'up', 'down'],
        a: 'Blade angle **increases** and RPM **decreases**.',
      },
      {
        id: 'prop.gov-climb',
        q: 'You pitch up into a climb without touching the prop lever. How does the governor hold RPM?',
        label: 'Climb',
        governor: ['', 'In', 'Down', 'up', 'down', 'up'],
        a: 'Blade angle **decreases**, which brings RPM back up.',
      },
      {
        id: 'prop.gov-dive',
        q: 'You pitch down into a dive without touching the prop lever. How does the governor hold RPM?',
        label: 'Dive',
        governor: ['', 'Out', 'Up', 'down', 'up', 'down'],
        a: 'Blade angle **increases**, which brings RPM back down.',
      },
      {
        id: 'prop.feather-lock',
        q: 'What is the feathering lock, and what does it mean for the pilot?',
        bullets: [
          'It stops the propeller feathering once engine speed falls below about 600 to 800 rpm',
          'Move the prop lever to feather before RPM drops that far',
        ],
      },
      {
        id: 'prop.feather-force',
        q: 'What moves the blades toward feather?',
        a: '**Counterweights** and a heavy-duty **spring**.',
        bullets: [
          'The counterweights want to move into the plane of rotation',
          'Oil pressure works against them, toward low pitch',
        ],
      },
    ],
  },
  {
    id: 'electrical',
    group: 'tecnam',
    title: 'Electrical system',
    cards: [
      {
        id: 'elec.components',
        q: 'Describe the major components of the electrical system.',
        bullets: [
          'Two engine-driven generators, normally in parallel',
          'Each: 14.2 to 14.8 Vdc, 40 A',
          'Integrated regulator holds constant voltage',
          'Automatic overvoltage protection',
          'One generator alone can keep the flight safe',
          'Backup: 12 V, 38 Ah battery',
          'External DC power can be connected',
        ],
      },
      {
        id: 'elec.buses',
        q: 'How many buses make up the electrical system, and what are they?',
        a: '**Five.**',
        bullets: ['Battery Bus', 'L Generator Bus', 'R Generator Bus', 'L Avionics Bus', 'R Avionics Bus'],
      },
      {
        id: 'elec.normal',
        q: 'Under normal conditions, how are the buses powered?',
        a: '**In parallel.**',
        bullets: ['Both generators', 'The battery'],
      },
      {
        id: 'elec.cross-bus',
        q: 'What do the cross-bus switches do?',
        a: 'Isolate the L or R side from the rest of the system.',
      },
      {
        id: 'elec.battery-time',
        q: 'How long can the battery provide electrical power in an emergency?',
        a: '30 minutes.',
      },
      { id: 'elec.ac-dc', q: 'Is the P2006T electrical system AC or DC?', a: 'DC (direct current).' },
      { id: 'elec.battery', q: 'What is the battery voltage and amperage?', a: '12 V and 38 Ah.' },
      {
        id: 'elec.avionics',
        q: 'How are the avionics buses powered?',
        a: 'By their respective generator bus. See the checklist.',
      },
      {
        id: 'elec.field',
        q: 'What is the function of the field switches?',
        a: 'Let the respective generator supply the electrical system.',
      },
      {
        id: 'elec.regulator',
        q: 'What is the purpose of the integrated generator regulator?',
        bullets: ['Holds a constant output voltage', 'Automatic over-voltage protection'],
      },
      {
        id: 'elec.starters',
        q: 'Can the starters engage with the master switch off? Why or why not?',
        a: '**Yes, on external DC power.**',
        bullets: ['External power feeds the Battery Bus directly', 'Master switch position does not matter'],
      },
    ],
  },
  {
    id: 'gear',
    group: 'tecnam',
    title: 'Landing gear',
    cards: [
      {
        id: 'gear.describe',
        q: 'Describe the landing gear system.',
        bullets: [
          'Reversible electric pump',
          'Pressurizes the "up lines" or "down lines"',
          'Pressure moves a piston connected to the landing gear',
        ],
      },
      { id: 'gear.pump', q: 'How is the hydraulic pump powered?', a: 'Electrically.' },
      { id: 'gear.held-up', q: 'How is the landing gear held up?', a: 'By hydraulic pressure.' },
      {
        id: 'gear.backup',
        q: 'If the landing gear fails to extend, what backup is available?',
        a: '**The emergency system.**',
        bullets: ['Pushes hydraulic fluid into the top of each landing gear cylinder', 'That lowers the landing gear'],
      },
      { id: 'gear.green', q: 'What does a green landing gear light indicate?', a: 'The respective landing gear is down and locked.' },
      {
        id: 'gear.red',
        q: 'What does a red landing gear light indicate?',
        a: 'The landing gear are not all down and locked, nor all up.',
      },
      {
        id: 'gear.amber',
        q: 'What does an amber landing gear light indicate?',
        bullets: ['The electric landing gear pump is powered', 'Indirectly: landing gear in transit'],
      },
      {
        id: 'gear.horn',
        q: 'When will the landing gear warning horn sound?',
        a: 'Flaps set to FULL with the landing gear not down and locked.',
      },
      {
        id: 'gear.main-not-locked',
        q: 'What does the POH recommend if a main gear is not down and locked?',
        bullets: [
          'Land with the landing gear up if a single main landing gear is not down and locked',
          'Shut down the engines when landing is assured',
        ],
      },
      {
        id: 'gear.emergency-control',
        q: 'Where is the emergency landing gear control located, and how does it operate?',
        a: '**Left seat floorboard.**',
        bullets: [
          'Slow below V_LO / V_LE',
          'Gear lever DOWN',
          'Remove the emergency extension access door',
          'RH lever: 90° counter-clockwise',
          'Wait at least 20 seconds',
          'LH lever: 180° counter-clockwise',
        ],
        note: 'The packet words this question as emergency landing gear "retraction". The answer it gives is the emergency extension procedure.',
      },
      {
        id: 'gear.exception',
        q: 'The landing gear system is relatively standard, with one very big exception. What is it?',
        bullets: ['The emergency extension system', 'A nitrogen-pressurized accumulator forces the landing gear down'],
      },
      {
        id: 'gear.accumulator',
        q: 'What is the minimum pressure for the emergency landing gear accumulator?',
        a: '20 bar',
      },
      {
        id: 'gear.squat',
        q: 'Where is the squat switch located, and what is its purpose?',
        bullets: ['On the right main gear', 'Stops the landing gear retracting on the ground if selected up by accident'],
      },
      {
        id: 'gear.type',
        q: 'How is the landing gear activated and actuated?',
        a: '**Electrically** activated, **hydraulically** actuated.',
        bullets: [
          'Fully retractable',
          'Tricycle configuration',
          'The gear switch runs an electric, reversible hydraulic pump',
        ],
      },
      {
        id: 'gear.pressure',
        q: 'Which takes the higher hydraulic pressure: retracting the landing gear or extending it?',
        a: '**Retracting.** Extension uses lower pressure.',
        bullets: [
          'Fluid is pumped both ways, through the up lines and the down lines',
          'Once the up limit switches are pressed, pressure stops building',
        ],
      },
      {
        id: 'gear.shuttle',
        q: 'What happens in the system when the emergency gear extension levers are used?',
        bullets: [
          'Nitrogen pressure is released from the accumulator',
          'It travels down the emergency extension line to the shuttle valves',
          'Each shuttle valve moves to block the unused line and open the path to the gear jacks',
          'That stops the pressure flowing back to the main pump reservoir',
        ],
      },
      {
        id: 'gear.unsafe',
        q: 'What can cause a gear unsafe message?',
        bullets: [
          'Gear selector up with the airplane on the ground',
          'Landing gear not down and locked with flaps FULL',
        ],
      },
    ],
  },
  {
    id: 'controls',
    group: 'tecnam',
    title: 'Flight controls',
    cards: [
      {
        id: 'fc.primary',
        q: 'Describe the primary flight control system.',
        a: 'The stabilator, ailerons and rudder.',
      },
      {
        id: 'fc.mechanism',
        q: 'What mechanism allows the pilot to move the primary flight controls?',
        a: 'Push-pull rods.',
      },
      {
        id: 'fc.secondary',
        q: 'Describe the secondary flight control system.',
        bullets: [
          'Flaps: electric',
          'Rudder trim: electric',
          'Pitch trim: manual, with an electric option',
          'Aileron trim: ground-adjustable tab on the left aileron',
        ],
      },
      {
        id: 'fc.pitch-trim',
        q: 'Describe the pitch trim system.',
        bullets: [
          'Trim wheel or switch moves the anti-servo tab',
          'The tab changes pressure on the stabilator trailing edge',
        ],
      },
      {
        id: 'fc.stabilator',
        q: 'What is a stabilator, and how does it differ from an elevator?',
        bullets: ['A movable horizontal stabilizer', 'The whole surface moves with pitch input'],
      },
      {
        id: 'fc.anti-servo',
        q: 'What is an anti-servo tab?',
        bullets: [
          'Dampens stabilator movement for precision and feel',
          'Mechanically linked to the stabilator',
          'Presses against stabilator movement',
          'Pull back: stabilator trailing edge up, tab further up',
          'Also works as the trim tab',
        ],
      },
      {
        id: 'fc.rudder-trim',
        q: 'How is the rudder trim actuated?',
        a: '**Electrically.**',
        bullets: ['An electric actuator moves the trim', 'The pilot commands it with a switch'],
      },
      {
        id: 'fc.aileron-trim',
        q: 'Describe the aileron trim system.',
        a: 'A ground-adjustable tab on the left aileron.',
      },
      {
        id: 'fc.flaps',
        q: 'How are the flaps actuated?',
        a: '**Electrically.**',
        bullets: ['An electric actuator moves the flaps', 'The pilot commands it with the flap switch'],
      },
    ],
  },
  {
    id: 'preflight',
    group: 'tecnam',
    title: 'Preflight, towing and fueling',
    blurb: 'What makes the P2006T different from other light twins',
    cards: [
      {
        id: 'pre.rotate-prop',
        q: 'Why must pilots rotate the propeller during preflight?',
        bullets: [
          'Forces oil through the system',
          'Needed for an accurate oil quantity check',
          'Ignition off, and turn the propeller by hand',
        ],
      },
      {
        id: 'pre.fluids',
        q: 'What fluid levels must pilots check during preflight?',
        bullets: ['Oil', 'Fuel', 'Coolant', 'Allow about 10 extra minutes for the check'],
      },
      {
        id: 'pre.oil-murmur',
        q: 'What indicates that oil has been pumped through the system?',
        a: 'A murmur, or flushing sound, from the open oil tank.',
      },
      {
        id: 'pre.gear-pressure',
        q: 'What is the minimum required pressure for the emergency landing gear extension system?',
        a: '20 bar',
      },
      {
        id: 'pre.towing',
        q: 'What unique procedures must be followed before towing the P2006T?',
        bullets: [
          'Master switch on: keeps hydraulic pressure holding the landing gear extended',
          'Nose gear no more than 20° left or right',
        ],
      },
    ],
  },
  {
    id: 'general',
    group: 'tecnam',
    title: 'Limitations and general',
    cards: [
      {
        id: 'gen.pitot-static',
        q: 'Which instruments are part of the pitot/static system? How many pitot tubes and static ports are there, and where?',
        bullets: [
          'Instruments: airspeed indicator, altimeter, vertical speed indicator',
          'Two pitot tubes: forward port and starboard',
          'Two static ports: left and right fuselage',
          'Alternate static: under the panel by the right choke',
          'Rotate the dial forward to activate it',
        ],
      },
      {
        id: 'gen.atomatoflames',
        q: 'Which ATOMATOFLAMES item is different for the P2006T than for most light trainers?',
        bullets: ['Temperature gauge', 'Because the engines are liquid cooled'],
      },
      {
        id: 'gen.door-lock',
        q: 'Briefly explain the function and purpose of the door lock mechanism.',
        bullets: [
          'An oil pressure sensor locks the door while engines run',
          'Keeps people from exiting with engines running',
        ],
      },
      {
        id: 'gen.metric',
        q: 'What unique aspect makes P2006T performance calculations likely to include error?',
        bullets: [
          'Metric units',
          'Most pilots work weight and balance and performance in standard units',
          'Double-check conversions and calculations',
        ],
      },
      { id: 'gen.operations', q: 'What type of operations is the P2006T approved for?', a: 'Day and night VFR and IFR.' },
      {
        id: 'gen.icing',
        q: 'Is the P2006T rated to fly in icing conditions? What anti-icing or de-icing systems are available?',
        a: '**No.**',
        bullets: ['Pitot heat', 'Defrost'],
      },
      { id: 'gen.max-altitude', q: 'What is the maximum operating altitude?', a: '14,000 ft' },
      {
        id: 'gen.load-factors',
        q: 'What are the load factor limits, flaps up and flaps down?',
        bullets: ['Flaps up: +3.8 G and -1.78 G', 'Flaps down: +2 G and 0 G'],
      },
      { id: 'gen.mtow', q: 'What is the maximum takeoff weight?', a: '2,712 lb (1,230 kg)' },
      {
        id: 'gen.restart',
        q: 'What considerations influence whether a pilot should attempt to restart a failed engine?',
        bullets: [
          'Severe damage or fire, present or suspected: probably do not restart',
          'Brief all checklist items',
          'Chair-fly the memory items',
          'Fuel selectors and pump switches are overhead, mid-cockpit',
          'In training, simulate fuel off only',
        ],
      },
    ],
  },
  {
    id: 'cabin',
    group: 'tecnam',
    title: 'Brakes, instruments and heating',
    cards: [
      {
        id: 'brk.toe',
        q: 'How are the brakes applied?',
        a: '**Toe brakes.** Press the top of the rudder pedals.',
        bullets: [
          'Fitted for both the pilot and the co-pilot',
        ],
      },
      {
        id: 'brk.master',
        q: 'How are the brake master cylinders supplied?',
        bullets: [
          'Each set of rudder pedals connects to master cylinders',
          'One vented reservoir feeds the pilot-side cylinders',
          'Hoses connect them to the co-pilot side',
        ],
      },
      {
        id: 'brk.wheels',
        q: 'What brakes and wheels are on the main landing gear?',
        bullets: [
          'Cleveland wheels, size 6.00-6',
          'Master cylinder pressure runs through lines to the brake calipers',
        ],
      },
      {
        id: 'brk.parking',
        q: 'How does the parking brake work?',
        bullets: [
          'A valve near the cabin floor locks hydraulic pressure in the lines',
          'Controlled by a knob on the center pedestal',
        ],
      },
      {
        id: 'ins.adahrs',
        q: 'What does ADAHRS stand for, and what does it replace?',
        a: '**Air Data, Attitude and Heading Reference System.**',
        bullets: [
          'Used by the Garmin G1000 NXi',
          'Combines two formerly separate units: the Air Data Computer (ADC) and the AHRS',
        ],
      },
      {
        id: 'ins.ahrs',
        q: 'How does the ADAHRS sense attitude?',
        bullets: [
          'Solid-state gyros: accelerometers and tilt sensors',
          'No moving parts',
          'Measures pitch, roll and yaw',
        ],
      },
      {
        id: 'ins.magnetometer',
        q: 'What does the magnetometer do, and where is it?',
        bullets: [
          'Senses the magnetic field of the Earth in three axes',
          'Solid state, no moving parts',
          'Sends digital data to the ADAHRS, which works out heading',
          'Usually in the wingtip, away from electrical interference',
        ],
      },
      {
        id: 'ins.adc',
        q: 'What does the air data side of the ADAHRS measure, and what does it work out?',
        bullets: [
          'Pressure sensors connect to the pitot and static lines',
          'Gives airspeed, altitude and vertical speed',
        ],
      },
      {
        id: 'ins.oat',
        q: 'What does the OAT probe let the system calculate?',
        a: '**True airspeed** (TAS) and **density altitude**.',
        bullets: [
          'It supplies outside air temperature',
        ],
      },
      {
        id: 'env.heat',
        q: 'Where does cabin heat and windshield defrost air come from?',
        bullets: [
          'A heat exchanger: cold ram air is warmed by engine exhaust gases',
          'Hoses carry it to the cabin and the windshield',
        ],
      },
      {
        id: 'env.pitot-heat',
        q: 'Which pitot tube does pitot heat warm, and where is the switch?',
        bullets: [
          'Heats the left main pitot tube',
          'Switch on the left side of the instrument panel',
        ],
      },
    ],
  },

  {
    id: 'vmc',
    group: 'aero',
    title: 'Minimum control speed',
    cards: [
      {
        id: 'vmc.define',
        q: 'Define V_MC.',
        bullets: [
          'Calibrated airspeed at which control can be kept after a sudden critical loss of thrust',
          'Put simply: the slowest speed with directional control on one engine',
        ],
      },
      { id: 'vmc.who', q: 'Who determines V_MC for any given aircraft?', a: 'The manufacturer.' },
      {
        id: 'vmc.combats',
        q: 'What are the factors that determine V_MC?',
        hint: 'COMBATS',
        bullets: [
          '**C**ritical engine failed and windmilling',
          '**O**perating engine at max takeoff power',
          '**M**ost adverse (unfavorable) weight, normally lighter',
          '**B**ank of up to 5° toward the operating engine',
          '**A**ft CG',
          '**T**akeoff configuration: flaps in T/O position, landing gear up, trim set',
          '**S**tandard day temperature and pressure altitude',
        ],
      },
      {
        id: 'vmc.combats-c',
        q: 'In COMBATS, what does the C stand for?',
        a: '**C**ritical engine failed and windmilling.',
      },
      {
        id: 'vmc.combats-o',
        q: 'In COMBATS, what does the O stand for?',
        a: '**O**perating engine at max takeoff power.',
      },
      {
        id: 'vmc.combats-m',
        q: 'In COMBATS, what does the M stand for?',
        a: '**M**ost adverse (unfavorable) weight, normally lighter.',
      },
      {
        id: 'vmc.combats-b',
        q: 'In COMBATS, what does the B stand for?',
        a: '**B**ank of up to 5° toward the operating engine.',
      },
      {
        id: 'vmc.combats-a',
        q: 'In COMBATS, what does the A stand for?',
        a: '**A**ft CG.',
      },
      {
        id: 'vmc.combats-t',
        q: 'In COMBATS, what does the T stand for?',
        a: '**T**akeoff configuration.',
        bullets: ['Flaps in T/O position', 'Landing gear up', 'Trim set'],
      },
      {
        id: 'vmc.combats-s',
        q: 'In COMBATS, what does the S stand for?',
        a: '**S**tandard day temperature and pressure altitude.',
      },
      {
        id: 'vmc.combats-lowers',
        q: 'Which COMBATS condition lowers V_MC instead of raising it?',
        a: 'The **bank** of up to 5° toward the operating engine.',
        bullets: [
          'Every other condition is the worst case, so it raises V_MC',
          'With the wings level, actual V_MC is higher than the red line',
        ],
        note: 'This card is not from the course packet.',
      },
      {
        id: 'vmc.pattern',
        q: 'What is the pattern for how the COMBATS conditions move V_MC and performance?',
        a: 'Every condition pushes **both up**, with one exception each.',
        bullets: [
          'V_MC: all up, except the **bank**, which lowers it',
          'Performance: all up, except the **windmilling** propeller, which lowers it',
          'The opposite of a condition flips both arrows. Heavier, hotter, flaps down: both down',
          'Ground effect is not in COMBATS: V_MC down, performance up',
        ],
        note: 'This card is not from the course packet.',
      },
      {
        id: 'vmc.demo',
        q: 'What is the purpose of the V_MC demo?',
        bullets: [
          'Shows control at low speed on one engine',
          'Shows recovery from a momentary loss of directional control',
        ],
      },
      {
        id: 'vmc.changes',
        q: 'Does published V_MC ever change?',
        a: '**Yes.** It varies with:',
        bullets: ['Weight', 'Configuration', 'Performance of the airplane'],
      },
      {
        id: 'vmc.slower',
        q: 'If V_MC is slower (decreases), is that good or bad, and why?',
        a: '**Good.**',
        bullets: ['More rudder available', 'Rudder more effective'],
      },
      {
        id: 'vmc.faster',
        q: 'If V_MC is faster (increases), is that good or bad, and why?',
        a: '**Bad.**',
        bullets: ['Less rudder available', 'Or rudder less effective'],
      },
    ],
  },
  {
    id: 'vmc-factors',
    group: 'aero',
    title: 'Factors affecting V_MC',
    blurb: 'Which way actual V_MC and performance go',
    table: 'factors',
    // In COMBATS order, so the reference table reads as the mnemonic
    cards: [
      {
        id: 'vf.windmill',
        q: 'Effect of a windmilling propeller',
        label: 'Windmilling propeller',
        letter: 'C',
        a: 'V_MC goes **up**.\n\nPerformance goes **down**.',
      },
      {
        id: 'vf.feather',
        q: 'Effect of a feathered propeller',
        label: 'Feathered propeller',
        letter: 'C',
        a: 'V_MC goes **down**.\n\nPerformance goes **up**.',
      },
      {
        id: 'vf.power',
        q: 'Effect of more power',
        label: 'More power',
        letter: 'O',
        a: 'V_MC goes **up**.\n\nPerformance goes **up**.',
      },
      {
        id: 'vf.weight',
        q: 'Effect of heavier weight',
        label: 'Heavier weight',
        letter: 'M',
        a: 'V_MC goes **down**.\n\nPerformance goes **down**.',
      },
      {
        id: 'vf.bank0',
        q: 'Effect of a 0° bank angle, no turn',
        label: '0° bank',
        letter: 'B',
        a: 'V_MC goes **up**.\n\nPerformance goes **down**.',
      },
      {
        id: 'vf.bank23',
        q: 'Effect of a 2 to 3° bank angle, no turn',
        label: '2 to 3° bank',
        letter: 'B',
        a: 'V_MC goes **down**.\n\nPerformance goes **up**.',
      },
      {
        id: 'vf.aft-cg',
        q: 'Effect of an aft CG',
        label: 'Aft CG',
        letter: 'A',
        a: 'V_MC goes **up**.\n\nPerformance goes **up**.',
      },
      {
        id: 'vf.flaps',
        q: 'Effect of flaps down',
        label: 'Flaps down',
        letter: 'T',
        a: 'V_MC goes **down**.\n\nPerformance goes **down**.',
      },
      {
        id: 'vf.gear',
        q: 'Effect of landing gear down',
        label: 'Gear down',
        letter: 'T',
        a: 'V_MC goes **down**.\n\nPerformance goes **down**.',
      },
      {
        id: 'vf.temp',
        q: 'Effect of a temperature increase',
        label: 'Hotter',
        letter: 'S',
        a: 'V_MC goes **down**.\n\nPerformance goes **down**.',
      },
      {
        id: 'vf.pressure',
        q: 'Effect of a pressure decrease',
        label: 'Lower pressure',
        letter: 'S',
        a: 'V_MC goes **down**.\n\nPerformance goes **down**.',
      },
      {
        id: 'vf.da',
        q: 'Effect of a density altitude increase',
        label: 'Higher density altitude',
        letter: 'S',
        a: 'V_MC goes **down**.\n\nPerformance goes **down**.',
      },
      {
        id: 'vf.ground-effect',
        q: 'Effect of being in ground effect',
        label: 'In ground effect',
        letter: '',
        a: 'V_MC goes **down**.\n\nPerformance goes **up**.',
      },
    ],
  },
  {
    id: 'critical-engine',
    group: 'aero',
    title: 'Critical engine and performance',
    cards: [
      {
        id: 'ce.define',
        q: 'Define critical engine.',
        a: 'The engine whose failure most adversely affects performance and controllability.',
      },
      {
        id: 'ce.past',
        q: 'What factors determine the critical engine?',
        hint: 'PAST',
        bullets: [
          '**P**-factor (asymmetrical thrust)',
          '**A**ccelerated slipstream',
          '**S**piraling slipstream',
          '**T**orque',
        ],
      },
      {
        id: 'ce.sideslip',
        q: 'What is used to counter the sideslip situation, and why is it important?',
        bullets: [
          'Rudder, plus bank toward the operating engine',
          'Bank relieves the rudder using the horizontal component of lift',
          'V_MC can rise more than 3 knots per degree of bank short of 5°',
        ],
      },
      {
        id: 'ce.service-ceiling',
        q: 'Define service ceiling, and the difference with one engine inoperative.',
        bullets: [
          'Highest altitude with a 100 FPM climb on two engines',
          'Or 50 FPM on one engine',
          'Clean configuration at V_Y / V_YSE',
          'Single engine: the "drift down" altitude you can hold at your current weight',
        ],
      },
      {
        id: 'ce.accel-stop',
        q: 'Define accelerate-stop distance.',
        bullets: ['Accelerate to V_R / V_LOF', 'Lose an engine', 'Bring the aircraft to a stop'],
      },
      {
        id: 'ce.accel-go',
        q: 'Define accelerate-go distance.',
        bullets: ['Accelerate to V_R / V_LOF', 'Lose an engine', 'Continue the takeoff', 'Climb to 50 feet'],
      },
      {
        id: 'ce.manifold',
        q: 'What do you expect your manifold pressure to read with an engine failure?',
        bullets: [
          'Close to or slightly below the current pressure altitude, based on atmospherics',
          'One engine inoperative is a 50 percent loss of thrust',
          'But often an 80 to 90 percent loss of climb performance',
        ],
      },
      {
        id: 'ce.part23',
        q: 'Under 14 CFR 23, for aircraft of 6,000 lb or less with a V_SO of 61 knots or less, what single-engine climb rate is required for a reciprocating light twin at 5,000 MSL?',
        a: '**None.**',
        bullets: [
          'No positive single-engine climb rate is required at any altitude',
          'It only has to be determined',
          'At preflight, instructor and student state that they accept the minimum',
        ],
      },
      {
        id: 'ce.stall-altitude',
        q: 'With normally aspirated engines, V_MC decreases with altitude. What happens to stall speed (V_S)?',
        a: 'It remains the same.',
      },
    ],
  },
  {
    id: 'past',
    group: 'aero',
    title: 'PAST in pictures',
    blurb: 'Yaw or roll, and why the left engine is critical',
    cards: [
      {
        id: 'ce.past-p',
        diagram: ['p-left', 'p-right'],
        q: 'P-factor: does it yaw or roll the airplane, and why does it make the left engine critical?',
        a: '**Yaw.**',
        bullets: [
          'High angle of attack: the descending blade makes more thrust',
          'So each engine pulls from the right side of its propeller disc',
          'On the right engine that point is farther from the centerline',
          'Left engine inoperative: the longer arm yaws harder toward the inoperative engine',
        ],
      },
      {
        id: 'ce.past-a',
        diagram: ['a-left', 'a-right'],
        q: 'Accelerated slipstream: does it yaw or roll the airplane, and why does it make the left engine critical?',
        a: '**Roll.**',
        bullets: [
          'Each propeller pushes accelerated air over the wing behind it, adding lift',
          'The descending blade pushes hardest, so the lift sits right of each engine',
          'On the right wing that is farther from the centerline',
          'Left engine inoperative: the longer arm rolls harder toward the inoperative engine',
        ],
      },
      {
        id: 'ce.past-s',
        diagram: ['s-left', 's-right'],
        q: 'Spiraling slipstream: does it yaw or roll the airplane, and why does it make the left engine critical?',
        a: '**Yaw.**',
        bullets: [
          'The slipstream spirals back from each propeller',
          'Left engine\'s slipstream hits the left of the vertical stabilizer and opposes a yaw to the right',
          'Right engine\'s slipstream spirals away from the vertical stabilizer',
          'Left engine inoperative: nothing opposes the yaw toward the inoperative engine',
        ],
      },
      {
        id: 'ce.past-t',
        diagram: ['t-left', 't-right'],
        q: 'Torque: does it yaw or roll the airplane, and why does it make the left engine critical?',
        a: '**Roll.**',
        bullets: [
          'Clockwise propellers roll the airframe left, by reaction',
          'Left engine inoperative: the airplane already rolls left, and torque adds to it',
          'Right engine inoperative: torque opposes the roll',
        ],
      },
      {
        id: 'past.p-left',
        figure: 'p-left',
        q: 'Left engine inoperative. Which PAST factor does this show, and does it yaw or roll the airplane?',
        a: '**P-factor: yaw.**',
        bullets: [
          'Right engine operating',
          'Thrust at its descending blade, far from the centerline',
          'Long arm: strong yaw toward the inoperative left engine',
        ],
      },
      {
        id: 'past.p-right',
        figure: 'p-right',
        q: 'Right engine inoperative. Which PAST factor does this show, and does it yaw or roll the airplane?',
        a: '**P-factor: yaw.**',
        bullets: [
          'Left engine operating',
          'Descending blade close to the centerline',
          'Short arm: less yaw toward the inoperative right engine',
        ],
      },
      {
        id: 'past.a-left',
        figure: 'a-left',
        q: 'Left engine inoperative. Which PAST factor does this show, and does it yaw or roll the airplane?',
        a: '**Accelerated slipstream: roll.**',
        bullets: [
          'Right propeller adds lift behind its descending blade',
          'Far from the centerline',
          'Long arm: strong roll toward the inoperative left engine',
        ],
      },
      {
        id: 'past.a-right',
        figure: 'a-right',
        q: 'Right engine inoperative. Which PAST factor does this show, and does it yaw or roll the airplane?',
        a: '**Accelerated slipstream: roll.**',
        bullets: [
          'Left propeller adds lift behind its descending blade',
          'Close to the centerline',
          'Short arm: less roll toward the inoperative right engine',
        ],
      },
      {
        id: 'past.s-left',
        figure: 's-left',
        q: 'Left engine inoperative. Which PAST factor does this show, and does it yaw or roll the airplane?',
        a: '**Spiraling slipstream: yaw.**',
        bullets: [
          'Right engine\'s slipstream spirals away from the vertical stabilizer',
          'Nothing opposes the yaw toward the inoperative left engine',
        ],
      },
      {
        id: 'past.s-right',
        figure: 's-right',
        q: 'Right engine inoperative. Which PAST factor does this show, and does it yaw or roll the airplane?',
        a: '**Spiraling slipstream: yaw.**',
        bullets: [
          'Left engine\'s slipstream hits the left of the vertical stabilizer',
          'Pushes the nose left',
          'Opposes the yaw toward the inoperative right engine',
        ],
      },
      {
        id: 'past.t-left',
        figure: 't-left',
        q: 'Left engine inoperative. Which PAST factor does this show, and does it yaw or roll the airplane?',
        a: '**Torque: roll.**',
        bullets: [
          'Clockwise propeller: airframe reacts by rolling left',
          'That is toward the inoperative left engine',
          'Torque adds to the roll',
        ],
      },
      {
        id: 'past.t-right',
        figure: 't-right',
        q: 'Right engine inoperative. Which PAST factor does this show, and does it yaw or roll the airplane?',
        a: '**Torque: roll.**',
        bullets: [
          'Clockwise propeller: airframe reacts by rolling left',
          'That is away from the inoperative right engine',
          'Torque opposes the roll',
        ],
      },
    ],
  },
  {
    id: 'mei',
    group: 'aero',
    title: 'MEI only',
    blurb: 'Instructor candidates',
    mei: true,
    cards: [
      {
        id: 'mei.shutdown-alt',
        q: 'What is the minimum altitude for a full, actual engine shutdown in flight?',
        hint: 'See the ACS',
        a: "3,000' AGL, unless the POH says higher.",
      },
      {
        id: 'mei.low-alt-failure',
        q: 'What is the minimum altitude for a simulated low-altitude engine failure on takeoff?',
        hint: 'See the ACS',
        a: "400' AGL",
      },
      {
        id: 'mei.reject-speed',
        q: 'What is the maximum airspeed for aborted or rejected takeoff scenarios?',
        hint: 'See the ACS',
        a: 'Half of published V_MC.',
      },
      {
        id: 'mei.drag-demo',
        q: 'What is the purpose of the drag demo?',
        a: 'Shows how configuration changes affect total drag and handling with one engine inoperative.',
      },
    ],
  },
  {
    id: 'drills',
    group: 'flying',
    title: 'Engine-out drills',
    blurb: 'Emergency checklist steps, in order',
    cards: [
      {
        id: 'drill.the-drill',
        q: 'Engine failure: "The Drill"',
        hint: 'Steps in order',
        steps: [
          'Autopilot: OFF',
          'Directional Control: MAINTAIN',
          'Pitch: 84 KIAS',
          'Props: FULL FWD',
          'Throttles: FULL FWD',
          'Flaps: UP',
          'Gear: UP',
          'Identify: dead foot, dead engine',
          'Verify Suspected Throttle: IDLE',
          'Dead Engine Prop: FEATHER',
        ],
        bullets: [
          'Below 3,000 ft AGL: secure the engine',
          'Above 3,000 ft AGL: engine restart',
          'At a safe altitude: report, then the secure checklist',
        ],
      },
      {
        id: 'drill.before-rotation',
        q: 'Engine failure prior to rotation',
        hint: 'Steps in order',
        steps: ['Throttles: BOTH IDLE', 'Directional Control: MAINTAIN', 'Brakes: AS REQUIRED'],
      },
      {
        id: 'drill.secure',
        q: 'Engine secure in flight',
        hint: 'Steps in order',
        steps: [
          'Inoperative Engine Throttle: IDLE',
          'Inoperative Engine Ignition Switches: OFF',
          'Inoperative Engine Prop: FEATHER',
          'Inoperative Engine Fuel Selector: OFF*',
          'Inoperative Engine Fuel Pump: OFF*',
          'Inoperative Engine ALT Field: OFF',
          'Operating Engine Fuel Pump: ON',
          'Fuel Crossfeed: CONSIDER',
        ],
        bullets: ['Inoperative throttle to 13" to silence the gear warning horn'],
        note: '* On a training flight, say this step aloud and do not do it.',
      },
      {
        id: 'drill.restart',
        q: 'Engine restart in flight',
        hint: 'Steps in order',
        steps: [
          'Carburetor Heat: ON IF REQUIRED',
          'Fuel Pump: ON',
          'Fuel Quantity: CHECK',
          'Fuel Selector: FULLEST TANK',
          'ALT Field: OFF',
          'Ignitions: ON',
          'Inoperative Engine Throttle: IDLE',
          'Inoperative Engine Prop: FULL FWD',
          'Inoperative Engine Starter: ENGAGE',
          'Throttle: 13" MP',
          'Prop: 2250 RPM',
          'ALT Field: ON',
          'Fuel Pump: AS REQUIRED',
        ],
        bullets: ['If the restart is unsuccessful: emergency starting battery ON, then repeat the checklist'],
      },
      {
        id: 'drill.fire',
        q: 'Engine fire in flight',
        hint: 'Steps in order',
        steps: [
          'Directional Control: MAINTAIN',
          'Pitch: 84 KIAS',
          'Autopilot: OFF',
          'Cabin Heat / Defrost: OFF',
          'Fire Affected Fuel Selector: OFF',
          'Fire Affected Ignition Switch: OFF',
          'Throttles: FULL FWD',
          'Fire Affected Prop: FEATHER',
          'Fire Affected Fuel Pump: OFF',
          'Fire Affected ALT Field: OFF',
          'Cabin Ventilation: OPEN',
          'Land as soon as possible.',
        ],
      },
      {
        id: 'drill.oei-landing',
        q: 'One engine inoperative landing',
        hint: 'Steps in order',
        steps: [
          '"The Drill": COMPLETE',
          'Operating Engine Fuel Pump: ON',
          'Flaps on Final: T/O',
          'Landing Gear on Final: DOWN, VERIFIED',
          'Approach Speed: V_YSE (84 KIAS)',
          'Touchdown Speed: 70 KIAS',
        ],
      },
    ],
  },
  {
    id: 'maneuvers',
    group: 'flying',
    title: 'Maneuvers',
    blurb: 'Setup and recovery, in order',
    cards: [
      {
        id: 'man.pre',
        q: 'Pre-maneuver checks',
        hint: 'ACDCS',
        steps: [
          'Altitude: 3,000 ft AGL or higher',
          'Configuration: fuel pumps on, fuel selectors, landing light on, instruments green',
          'Diversions: nearby airports',
          'Clearing Turns: clear the area',
          'Standards: recite',
        ],
      },
      {
        id: 'man.steep',
        q: 'Steep turns',
        hint: 'Steps in order',
        steps: ['Prop: 2250', 'Throttles: 21" to 23.5"', 'Airspeed: 110 knots', 'Bank: roll to 50°', 'Turn: 360° both ways'],
      },
      {
        id: 'man.slow',
        q: 'Slow flight',
        hint: 'Steps in order',
        steps: [
          'Prop: 2250',
          'Throttles: 15"',
          'Gear: down',
          'Flaps: full',
          'Throttles Approaching 70 Knots: 20"',
          'Airspeed: 65 knots',
          'Bank: as instructed',
        ],
      },
      {
        id: 'man.power-off',
        q: 'Power-off stall',
        hint: 'Setup, then recovery',
        steps: [
          'Gear: down',
          'Flaps: full',
          'Airspeed: 75 knots',
          'Descent: 500 FPM',
          'Throttles: idle',
          'Pitch: landing attitude',
          'Recovery: reduce AOA',
          'Throttles: full forward',
          'Flaps: T/O',
          'Pitch: 72 knots (V_X)',
          'Accelerate: 84 knots (V_Y)',
          'Flaps at 84 Knots, Positive Rate: UP',
          'Gear: UP',
        ],
      },
      {
        id: 'man.power-on',
        q: 'Power-on stall',
        hint: 'Setup, then recovery',
        steps: [
          'Prop: 2250',
          'Throttles: 17"',
          'Airspeed: 80 knots',
          'Throttles: 20"',
          'Pitch: takeoff attitude',
          'Bank: as instructed',
          'Recovery: reduce AOA',
          'Wings if Banked: LEVEL',
          'Throttles: full forward',
          'Pitch: 84 knots (V_Y)',
        ],
      },
      {
        id: 'man.accelerated',
        off: true,
        q: 'Accelerated stall',
        hint: 'Setup, then recovery',
        steps: [
          'Prop: 2250',
          'Throttles: 15"',
          'Airspeed: 100 knots',
          'Bank: 45°, to the stall',
          'Recovery: reduce AOA',
          'Wings if Banked: LEVEL',
          'Throttles: full forward',
          'Pitch: 84 knots (V_Y)',
        ],
      },
      {
        id: 'man.vmc-demo',
        q: 'V_MC demo',
        hint: 'Setup, then recovery',
        steps: [
          'Prop: 2250',
          'Throttles: 15"',
          'Flaps: T/O',
          'Airspeed: slow to 84 knots',
          'LH Throttle: idle',
          'RH Throttle: full forward',
          'Bank Toward Operating Engine: 3°-5°',
          'Heading and Altitude: maintain',
          'Airspeed: reduce 1 knot per second',
          'Heading as Instructor Limits Rudder: HOLD',
          'Throttles at First Sign of Loss of Control: BOTH IDLE',
          'AOA: REDUCE',
          'RH Throttle Above V_MC, in Control: FULL',
          'Airspeed: 84 knots',
          'Flaps: up',
        ],
      },
      {
        id: 'man.drag-demo',
        off: true,
        q: 'Drag demo',
        hint: 'Steps in order',
        steps: [
          'Props: 2250',
          'Throttles: 15"',
          'Airspeed: 84 knots',
          'LH Throttle: idle',
          'RH Throttle: full forward',
          'Bank Toward Operating Engine: 3°-5°',
          'Gear: down (note the VSI)',
          'Flaps: T/O (note the VSI)',
          'Flaps: full (note the VSI)',
          'LH Throttle: 13.5" (zero thrust)',
          'Gear: up (note the VSI)',
          'Flaps: back to T/O (note the VSI)',
          'Flaps: up (note the VSI)',
          'Airspeed: 83 knots (note the VSI)',
          'Airspeed: 94 knots (note the VSI)',
          'Throttles: recover',
        ],
      },
      {
        id: 'man.emergency-descent',
        off: true,
        q: 'Emergency descent',
        hint: 'Steps in order',
        steps: [
          'Props: 2250',
          'Throttles: idle',
          'Gear: down',
          'Pitch: 15° down',
          'Airspeed: 115 knots (122 max)',
          'Bank: 30° to 45°',
          'Simulated Emergency: DECLARE',
        ],
        note: 'This is the maneuver guide. The emergency checklist gives props FULL FWD, flaps UP and landing gear down below 122 KIAS.',
      },
    ],
  },
];

for (const deck of DECKS) {
  deck.cards = deck.cards.filter((card) => !card.off);
  for (const card of deck.cards) {
    if (WHY[card.id]) card.why = WHY[card.id];
  }
}
