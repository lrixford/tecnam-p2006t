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
//
// Text markup: V_MC renders as V with a subscript; **text** renders bold.

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
    cards: [
      { id: 'vs.vso', q: 'V_SO', hint: 'Stall speed, landing configuration', a: '54 kt' },
      { id: 'vs.vmc', q: 'V_MC', hint: 'Minimum control speed, the red line', a: '62 kt' },
      { id: 'vs.vs1', q: 'V_S1', hint: 'Stall speed, clean', a: '66 kt' },
      { id: 'vs.vr', q: 'V_R', hint: 'Rotation speed', a: '70 kt' },
      { id: 'vs.vx', q: 'V_X', hint: 'Best angle of climb', a: '72 kt' },
      { id: 'vs.vxse', q: 'V_XSE', hint: 'Best angle of climb, one engine inoperative', a: '83 kt' },
      { id: 'vs.vy', q: 'V_Y', hint: 'Best rate of climb', a: '84 kt' },
      { id: 'vs.vyse', q: 'V_YSE', hint: 'Best rate of climb, one engine inoperative, the blue line', a: '84 kt' },
      { id: 'vs.vfe-full', q: 'V_FE, full flaps', hint: 'Maximum flaps-extended speed', a: '93 kt' },
      { id: 'vs.vfe-to', q: 'V_FE, takeoff flaps', hint: 'Maximum flaps-extended speed', a: '122 kt' },
      { id: 'vs.vlo-vle', q: 'V_LO and V_LE', hint: 'Landing gear operating and extended speeds', a: '122 kt' },
      { id: 'vs.va-vo', q: 'V_A and V_O', hint: 'Maneuvering and operating maneuvering speeds', a: '122 kt' },
      { id: 'vs.vno', q: 'V_NO', hint: 'Maximum structural cruising speed', a: '138 kt' },
      { id: 'vs.vne', q: 'V_NE', hint: 'Never-exceed speed', a: '171 kt' },
      { id: 'vs.xw', q: 'Maximum crosswind', a: '17 kt' },
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
        a: 'Liquid-cooled cylinder heads, air-cooled cylinders, lubricated with a dry-sump oil system. Crankshaft RPM is reduced through a reduction gearbox to lower propeller RPM.\n\nBoth engines rotate clockwise, which makes the left engine "critical" and leads to more asymmetry when operating OEI. Be ready to explain how with PAST.',
      },
      {
        id: 'eng.power',
        q: 'What is max RPM, and how much horsepower does each engine produce?',
        bullets: [
          '73.5 kW (98.6 hp) at 5800 rpm, 5 minutes maximum',
          '69.0 kW (92.5 hp) at 5500 rpm continuous (2250 LH, 2250 RH)',
        ],
        note: 'The packet gives "2250 LH, 2250 RH" without a unit. It matches propeller rpm after the reduction gearbox.',
      },
      {
        id: 'eng.how-rotax-works',
        q: 'Describe how a Rotax engine works.',
        a: 'Dual-path engine control units control the fuel injection, allowing fully automated, precise control over the fuel mixture. This improves fuel efficiency, reliability and longevity, and provides efficient lean-of-peak operations.',
        note: 'This is the packet answer, but it describes a fuel-injected engine. The packet also says the 912 S3 has two carburetors per engine. Ask your instructor which answer they expect.',
      },
      {
        id: 'eng.coolant',
        q: 'How does the coolant system operate?',
        bullets: [
          'Liquid cooling allows a smaller engine package.',
          'Coolant flows through the radiator, is cooled, and is recycled through the cylinders by the water pump.',
          'Use coolant compliant with the Rotax 912 manual.',
          'Cylinder heads are liquid cooled; cylinders are air cooled.',
          'The expansion tank allows coolant to expand and cool.',
        ],
      },
      {
        id: 'eng.overflow',
        q: 'What is the purpose of the coolant overflow container?',
        a: 'When pressure is too high in the expansion tank, excess coolant flows to the overflow container, where it can further expand and cool. As temperature and pressure drop, a vacuum forms and draws the coolant back to the expansion tank.',
      },
      {
        id: 'eng.carb-or-fi',
        q: 'Is this engine fuel injected or carbureted?',
        a: 'Carbureted.',
        bullets: [
          'Two carburetors per engine.',
          'Rotax uses constant-depression carburetors, a type of variable-venturi carburetor.',
          'In essence, the fuel/air ratio is adjusted automatically based on air pressure.',
        ],
      },
      { id: 'eng.carb-count', q: 'How many carburetors does each engine have?', a: 'Two.' },
      { id: 'eng.max-ct', q: 'What is the maximum coolant temperature (CT)?', a: '120 °C (248 °F)' },
      {
        id: 'eng.direct-drive',
        q: 'Are the engines direct drive?',
        a: 'No. They use a reduction gearbox to reduce propeller RPM.',
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
        a: 'An engine-driven oil pump pulls oil from the reservoir to the engine. Along the way some of it passes through the radiator and cools. After lubricating the engine, oil returns to the reservoir.',
      },
      {
        id: 'oil.capacity',
        q: 'What are the minimum, maximum and normal operating oil capacities?',
        a: 'Follow the placard on the engine oil reservoir access door: the level must sit between MIN and MAX. Do not fly with the oil level out of limits.',
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
        a: 'Oil with RON 424 classification. Check with maintenance for the specific oil.',
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
          'Each wing: 100 liters, 97 usable (26.4 gal, 25.7 usable)',
          'Total: 200 liters, 194 usable (52.8 gal, 51.35 usable)',
        ],
      },
      {
        id: 'fuel.drains',
        q: 'How many drain points must be drained before flight?',
        a: 'Four. One gascolator drain and one wing tank drain per side.',
      },
      {
        id: 'fuel.crossfeed',
        q: 'What is engine cross-feed, and how does it work?',
        a: 'Cross-feed lets a pilot supply an engine from the opposite-side tank, for example the left engine from the right tank. Start cross-feeding by turning that engine\'s fuel selector to the cross-side tank.',
      },
      {
        id: 'fuel.selectors',
        q: 'Describe the fuel selector positions.',
        a: 'Each selector has three positions: left, right and off. Left and right choose which tank supplies that engine. Off stops fuel flow to that engine.',
      },
      {
        id: 'fuel.feed',
        q: 'How is fuel fed from the tanks to the engine?',
        a: 'By engine-driven fuel pumps and, during critical phases, by electric auxiliary pumps.',
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
          'Two blades, constant speed, variable pitch, hydraulically controlled, with feathering capability',
          'Wood/composite construction, 70.08 in diameter, no reduction allowed',
          'Low pitch setting 10°, feather position 82°',
        ],
      },
      { id: 'prop.lever', q: 'Which lever regulates oil pressure in the propeller?', a: 'The prop lever (blue lever).' },
      {
        id: 'prop.pitch-control',
        q: 'How is propeller pitch controlled?',
        a: 'By a hydraulic-mechanical system. The propeller lever sets spring tension, which meters oil flow to and from the propeller hub to maintain a constant speed.',
      },
      {
        id: 'prop.oil-loss',
        q: 'If a propeller hub loses oil pressure, what pitch will the blades move to?',
        a: 'A high-pitch, feathered position.',
      },
      {
        id: 'prop.oil-loss-why',
        q: 'On oil pressure loss the blades feather. What drives this, and why is it built this way?',
        a: 'The blades move to a high-pitch, low-RPM position to reduce drag and prepare the engine to be secured.',
      },
      {
        id: 'prop.single-vs-multi',
        q: 'How does a single-engine constant-speed propeller differ from a multi-engine one?',
        bullets: [
          'Single-engine props use high oil pressure to achieve **high** pitch.',
          'Multi-engine props use high oil pressure to adjust to **low** pitch.',
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
          'Primary DC power comes from two engine-driven generators that normally operate in parallel.',
          'Each generator is rated at 14.2 to 14.8 Vdc, 40 A, with an integrated regulator that holds a constant output voltage and an automatic overvoltage device that protects the circuits.',
          'Either generator alone can supply the equipment needed to maintain flight safety.',
          'Secondary DC power comes from a 12 V, 38 Ah battery. An external DC power source can also be connected.',
        ],
      },
      {
        id: 'elec.buses',
        q: 'How many buses make up the electrical system, and what are they?',
        a: 'Five: Battery Bus, L Avionics Bus, L Generator Bus, R Avionics Bus, R Generator Bus.',
      },
      {
        id: 'elec.normal',
        q: 'Under normal conditions, how are the buses powered?',
        a: 'In parallel. Power is supplied by both generators and the battery.',
      },
      {
        id: 'elec.cross-bus',
        q: 'What do the cross-bus switches do?',
        a: 'They isolate the L or R side from the rest of the electrical system.',
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
        a: 'To allow the respective generator to supply power to the electrical system.',
      },
      {
        id: 'elec.regulator',
        q: 'What is the purpose of the integrated generator regulator?',
        a: 'To maintain a constant output voltage and provide automatic over-voltage protection.',
      },
      {
        id: 'elec.starters',
        q: 'Can the starters engage with the master switch off? Why or why not?',
        a: 'Yes, if the airplane is powered with external DC power. External power is supplied directly to the Battery Bus regardless of master switch position.',
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
        a: 'The gear is raised and lowered by a reversible electrical pump that pressurizes "up lines" or "down lines", which move a piston mechanically connected to the gear.',
      },
      { id: 'gear.pump', q: 'How is the hydraulic pump powered?', a: 'Electrically.' },
      { id: 'gear.held-up', q: 'How is the landing gear held up?', a: 'By hydraulic pressure.' },
      {
        id: 'gear.backup',
        q: 'If the landing gear fails to extend, what backup is available?',
        a: 'The emergency system. It pushes hydraulic fluid into the top of each gear\'s cylinder, which lowers the gear.',
      },
      { id: 'gear.green', q: 'What does a green landing gear light indicate?', a: 'The respective gear is down and locked.' },
      {
        id: 'gear.red',
        q: 'What does a red landing gear light indicate?',
        a: 'The gear are not all down and locked, nor all up.',
      },
      {
        id: 'gear.amber',
        q: 'What does an amber landing gear light indicate?',
        a: 'The electrical landing gear pump is being powered. It indirectly indicates an "in transit" status.',
      },
      {
        id: 'gear.horn',
        q: 'When will the gear warning horn sound?',
        a: 'When the flaps are lowered to FULL with the gear not down and locked.',
      },
      {
        id: 'gear.main-not-locked',
        q: 'What does the POH recommend if a main gear is not down and locked?',
        a: 'Land gear up if a single main is not down and locked. It also recommends shutting down the engines when landing is assured.',
      },
      {
        id: 'gear.emergency-control',
        q: 'Where is the emergency landing gear control located, and how does it operate?',
        a: 'Left seat floorboard. To activate:',
        bullets: [
          'Slow below V_LO / V_LE.',
          'Set the landing gear control lever to DOWN.',
          'Remove the emergency gear extension access door.',
          'Rotate the RH control lever counter-clockwise 90°.',
          'Wait at least 20 seconds.',
          'Rotate the LH control lever counter-clockwise 180°.',
        ],
        note: 'The packet words this question as emergency gear "retraction". The answer it gives is the emergency extension procedure.',
      },
      {
        id: 'gear.exception',
        q: 'The gear system is relatively standard, with one very big exception. What is it?',
        a: 'The emergency extension system, which uses a pressurized accumulator to force the gear down.',
      },
      {
        id: 'gear.accumulator',
        q: 'What is the minimum pressure for the emergency landing gear accumulator?',
        a: '20 bar',
        note: 'The packet gives no psi value. 20 bar is about 290 psi.',
      },
      {
        id: 'gear.squat',
        q: 'Where is the squat switch located, and what is its purpose?',
        a: 'On the right main gear. It keeps the gear from retracting if the gear is accidentally selected up while the aircraft is taxiing or stationary.',
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
        a: 'Flaps and trim. Flaps and rudder trim are electrically powered. Pitch trim is manual, with an electrical option. Aileron trim is a ground-adjustable tab on the left aileron.',
      },
      {
        id: 'fc.pitch-trim',
        q: 'Describe the pitch trim system.',
        a: 'The pitch trim wheel or switch moves the anti-servo tab, which increases or decreases pressure on the trailing edge of the stabilator.',
      },
      {
        id: 'fc.stabilator',
        q: 'What is a stabilator, and how does it differ from an elevator?',
        a: 'A stabilator is a movable horizontal stabilizer. When the pilot changes pitch, the entire stabilator moves.',
      },
      {
        id: 'fc.anti-servo',
        q: 'What is an anti-servo tab?',
        a: 'It dampens stabilator movement for precision and improved feel. It is mechanically linked to the stabilator and provides opposite pressure against stabilator movement.\n\nExample: when the pilot pulls back, the stabilator trailing edge moves up and the anti-servo tab trailing edge moves further up, counteracting the input.\n\nThe anti-servo tab also functions as a trim tab.',
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
        a: 'Rotating the propeller forces oil through the system and is required to accurately check oil quantity.',
      },
      {
        id: 'pre.fluids',
        q: 'What fluid levels must pilots check during preflight?',
        a: 'Oil, fuel and coolant quantity. Allow about 10 extra minutes between reservations for a thorough fluid check.',
      },
      {
        id: 'pre.oil-murmur',
        q: 'What indicates that oil has been pumped through the system?',
        a: 'A murmur from the open oil tank. It makes a flushing sound.',
      },
      {
        id: 'pre.gear-pressure',
        q: 'What is the minimum required pressure for the emergency gear extension system?',
        a: '20 bar',
        note: 'The packet gives no psi value. 20 bar is about 290 psi.',
      },
      {
        id: 'pre.towing',
        q: 'What unique procedures must be followed before towing the P2006T?',
        bullets: [
          'The master switch must be on, to ensure enough hydraulic pressure to hold the landing gear extended.',
          'Avoid moving the nose gear more than 20° left or right.',
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
          'Airspeed indicator, altimeter and vertical speed indicator',
          'Two pitot tubes: forward port and forward starboard',
          'Two static ports: left and right fuselage',
          'Alternate static: under the panel by the right choke, where your left knee would be from the right seat',
          'Rotate the dial forward to activate alternate static',
        ],
      },
      {
        id: 'gen.atomatoflames',
        q: 'Which ATOMATOFLAMES item is different for the P2006T than for most light trainers?',
        a: 'The temperature gauge, because the P2006T has a liquid-cooled engine.',
      },
      {
        id: 'gen.door-lock',
        q: 'Briefly explain the function and purpose of the door lock mechanism.',
        a: 'It uses an oil pressure sensor to lock the door while the engines are running, so pilots and passengers cannot injure themselves by exiting with engines running.',
      },
      {
        id: 'gen.metric',
        q: 'What unique aspect makes P2006T performance calculations likely to include error?',
        a: 'Metric units. Most pilots are used to weight, balance and performance in standard units, so double-check conversions and calculations.',
      },
      { id: 'gen.operations', q: 'What type of operations is the P2006T approved for?', a: 'Day and night VFR and IFR.' },
      {
        id: 'gen.icing',
        q: 'Is the P2006T rated to fly in icing conditions? What anti-icing or de-icing systems are available?',
        a: 'No. It has pitot heat and defrost only.',
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
        a: 'If severe damage or fire is present or suspected, the pilot should probably not restart the engine. Brief all checklist items and make sure memory items are chair-flown. See the POH for the panel configuration.\n\nThe L/R fuel selectors and pump switches are overhead, in the middle of the cockpit roof. In training, simulate fuel to off only.',
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
        a: 'The calibrated airspeed at which, following a sudden critical loss of thrust, it is possible to maintain control of the airplane. In other words, the slowest speed at which directional control can be maintained with one engine inoperative.',
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
          '**B**ank of up to 5° towards the good engine',
          '**A**ft CG',
          '**T**akeoff configuration: flaps in T/O position, gear up, trim set',
          '**S**tandard day temperature and pressure altitude',
        ],
      },
      {
        id: 'vmc.demo',
        q: 'What is the purpose of the V_MC demo?',
        a: 'It demonstrates the pilot\'s ability to maintain aircraft control in a low-speed regime with one engine inoperative, and to recover from a momentary loss of directional control.',
      },
      {
        id: 'vmc.changes',
        q: 'Does published V_MC ever change?',
        a: 'Yes. It can vary with weight, configuration and performance of the airplane.',
      },
      {
        id: 'vmc.slower',
        q: 'If V_MC is slower (decreases), is that good or bad, and why?',
        a: 'Good. More rudder is available and it is more effective.',
      },
      {
        id: 'vmc.faster',
        q: 'If V_MC is faster (increases), is that good or bad, and why?',
        a: 'Bad. Less rudder is available, or it is less effective.',
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
      { id: 'vf.windmill', q: 'Effect of a windmilling prop', a: 'V_MC goes **up**.\n\nPerformance goes **down**.', note: NOT_IN_KEY },
      { id: 'vf.feather', q: 'Effect of a feathered prop', a: 'V_MC goes **down**.\n\nPerformance goes **up**.', note: NOT_IN_KEY },
      { id: 'vf.aft-cg', q: 'Effect of an aft CG', a: 'V_MC goes **up**.\n\nPerformance goes **up**.', note: NOT_IN_KEY },
      { id: 'vf.weight', q: 'Effect of heavier weight', a: 'V_MC goes **down**.\n\nPerformance goes **down**.', note: NOT_IN_KEY },
      { id: 'vf.flaps', q: 'Effect of flaps down', a: 'V_MC goes **down**.\n\nPerformance goes **down**.', note: NOT_IN_KEY },
      { id: 'vf.gear', q: 'Effect of gear down', a: 'V_MC goes **down**.\n\nPerformance goes **down**.', note: NOT_IN_KEY },
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
        a: 'Rudder and bank towards the good engine. Bank gives the rudder some relief by using the horizontal component of lift.\n\nFlight tests have shown that V_MC can increase more than 3 knots for each degree of bank less than 5°.',
      },
      {
        id: 'ce.service-ceiling',
        q: 'Define service ceiling, and the difference with one engine inoperative.',
        a: 'The maximum altitude at which you can still climb 100 FPM with two engines, or 50 FPM with one, both in the clean configuration at V_Y / V_YSE.\n\nSingle engine, think of it as "drift down" altitude: the highest altitude you can maintain at your gross weight at that moment.',
      },
      {
        id: 'ce.accel-stop',
        q: 'Define accelerate-stop distance.',
        a: 'The distance required to accelerate to V_R / V_LOF, lose an engine, then bring the aircraft to a stop.',
      },
      {
        id: 'ce.accel-go',
        q: 'Define accelerate-go distance.',
        a: 'The distance required to accelerate to V_R / V_LOF, lose an engine, continue the takeoff and climb to 50 feet.',
      },
      {
        id: 'ce.manifold',
        q: 'What do you expect your manifold pressure to read with an engine failure?',
        a: 'Close to or slightly below the current pressure altitude of the aircraft, based on atmospherics.\n\nLoss of power on one engine is a 50 percent loss of thrust, but often an 80 to 90 percent loss of climb performance, and sometimes more.',
      },
      {
        id: 'ce.part23',
        q: 'Under 14 CFR 23, for aircraft of 6,000 lb or less with a V_SO of 61 knots or less, what single-engine climb rate is required for a reciprocating light twin at 5,000 MSL?',
        a: 'None. There is no requirement for a positive single-engine climb rate at any altitude. It must only be determined.\n\nAt preflight, instructor and student should verbally state that they accept the minimum.',
      },
      {
        id: 'ce.stall-altitude',
        q: 'With normally aspirated engines, V_MC decreases with altitude. What happens to stall speed (V_S)?',
        a: 'It remains the same.',
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
        a: 'It demonstrates the effect of airplane configuration changes on total drag and handling characteristics with one engine inoperative.',
      },
    ],
  },
];
