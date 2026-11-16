// Flashcard content for the P2006T / multi-engine study decks.
//
// Answers follow the course quiz packet's answer key. Where the key is blank,
// incomplete or contradicts itself, the card carries a `note` saying so.
//
// Card shape:
//   id       stable key used for saved progress. Never rename an id.
//   q        the prompt
//   hint     optional short clarifier shown under the prompt
//   a        answer text; blank lines separate paragraphs
//   bullets  answer as a list (may be combined with `a`)
//   note     caveat shown under the answer
//   label    short name for the card's cell in its deck's reference table
//   figure   key of a drawing in diagrams.js, shown with the question
//   diagram  key or keys of drawings in diagrams.js, shown with the answer
//
// A deck with `table: true` shows all of its answers as a reference table on
// the back of each flashcard, filled column by column, five rows per column.
//
// Text markup: V_MC renders as V with a subscript; **text** renders bold.
//
// Units: imperial first with metric in parentheses, except for a value read
// off a gauge, which is given in the unit the gauge shows (for example the
// emergency landing gear accumulator in bar, temperatures in °C).

export const GROUPS = [
  { id: 'tecnam', title: 'P2006T Tecnam quiz' },
  { id: 'aero', title: 'Multi-engine aerodynamics quiz' },
];

const NOT_IN_KEY =
  'The packet leaves this table blank. This is the standard answer; confirm it with your instructor.';

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
        bullets: ['The emergency extension system', 'A pressurized accumulator forces the landing gear down'],
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
      { id: 'fc.rudder-trim', q: 'How is the rudder trim controlled?', a: 'Electrically.' },
      {
        id: 'fc.aileron-trim',
        q: 'Describe the aileron trim system.',
        a: 'A ground-adjustable tab on the left aileron.',
      },
      { id: 'fc.flaps', q: 'How are the flaps controlled?', a: 'Electrically.' },
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
        bullets: ['Forces oil through the system', 'Needed for an accurate oil quantity check'],
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
          '**B**ank of up to 5° towards the operating engine',
          '**A**ft CG',
          '**T**akeoff configuration: flaps in T/O position, landing gear up, trim set',
          '**S**tandard day temperature and pressure altitude',
        ],
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
    cards: [
      { id: 'vf.power', q: 'Effect of more power', a: 'V_MC goes **up**.\n\nPerformance goes **up**.', note: NOT_IN_KEY },
      { id: 'vf.temp', q: 'Effect of a temperature increase', a: 'V_MC goes **down**.\n\nPerformance goes **down**.', note: NOT_IN_KEY },
      { id: 'vf.pressure', q: 'Effect of a pressure decrease', a: 'V_MC goes **down**.\n\nPerformance goes **down**.', note: NOT_IN_KEY },
      { id: 'vf.da', q: 'Effect of a density altitude increase', a: 'V_MC goes **down**.\n\nPerformance goes **down**.', note: NOT_IN_KEY },
      { id: 'vf.bank0', q: 'Effect of a 0° bank angle, no turn', a: 'V_MC goes **up**.\n\nPerformance goes **down**.', note: NOT_IN_KEY },
      { id: 'vf.bank23', q: 'Effect of a 2 to 3° bank angle, no turn', a: 'V_MC goes **down**.\n\nPerformance goes **up**.', note: NOT_IN_KEY },
      { id: 'vf.windmill', q: 'Effect of a windmilling propeller', a: 'V_MC goes **up**.\n\nPerformance goes **down**.', note: NOT_IN_KEY },
      { id: 'vf.feather', q: 'Effect of a feathered propeller', a: 'V_MC goes **down**.\n\nPerformance goes **up**.', note: NOT_IN_KEY },
      { id: 'vf.aft-cg', q: 'Effect of an aft CG', a: 'V_MC goes **up**.\n\nPerformance goes **up**.', note: NOT_IN_KEY },
      { id: 'vf.weight', q: 'Effect of heavier weight', a: 'V_MC goes **down**.\n\nPerformance goes **down**.', note: NOT_IN_KEY },
      { id: 'vf.flaps', q: 'Effect of flaps down', a: 'V_MC goes **down**.\n\nPerformance goes **down**.', note: NOT_IN_KEY },
      { id: 'vf.gear', q: 'Effect of landing gear down', a: 'V_MC goes **down**.\n\nPerformance goes **down**.', note: NOT_IN_KEY },
      { id: 'vf.ground-effect', q: 'Effect of being in ground effect', a: 'V_MC goes **down**.\n\nPerformance goes **up**.', note: NOT_IN_KEY },
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
          'Rudder, plus bank towards the operating engine',
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
];
