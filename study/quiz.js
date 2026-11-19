// Multiple-choice material for the graded quiz.
//
// The flashcard answers in cards.js are often too long to be an answer choice,
// so each entry here gives a short correct choice and three wrong ones. The
// wrong choices are invented distractors.
//
// Entry shape, keyed by card id:
//   q      optional quiz wording, when the flashcard prompt is too open-ended
//   right  the correct choice (defaults to the card's own answer)
//   wrong  three wrong choices; when omitted, the quiz borrows the correct
//          answers of other cards in the same deck
//   all    used in place of `right` for a select-all-that-apply question:
//          every correct choice. The reader must pick all of them and none
//          of `wrong`, which may then hold any number of choices.
//
// Decks with no entries at all (V-speeds) work entirely by borrowing.
// A card with `steps` needs no entry: the quiz asks for its steps in order.

const FACTOR_CHOICES = {
  uu: 'V_MC goes up, performance goes up',
  ud: 'V_MC goes up, performance goes down',
  du: 'V_MC goes down, performance goes up',
  dd: 'V_MC goes down, performance goes down',
};

// Which way actual V_MC and performance go, per card in the "factors" deck.
const FACTORS = {
  'vf.power': 'uu',
  'vf.temp': 'dd',
  'vf.pressure': 'dd',
  'vf.da': 'dd',
  'vf.bank0': 'ud',
  'vf.bank23': 'du',
  'vf.windmill': 'ud',
  'vf.feather': 'du',
  'vf.aft-cg': 'uu',
  'vf.weight': 'dd',
  'vf.flaps': 'dd',
  'vf.gear': 'dd',
  'vf.ground-effect': 'du',
};

const factorEntries = Object.fromEntries(
  Object.entries(FACTORS).map(([id, code]) => [
    id,
    {
      right: FACTOR_CHOICES[code],
      wrong: Object.keys(FACTOR_CHOICES)
        .filter((k) => k !== code)
        .map((k) => FACTOR_CHOICES[k]),
    },
  ]),
);

// Picture cards: name the PAST factor in the drawing and the motion it causes.
const PAST = {
  p: ['P-factor', 'yaw'],
  a: ['Accelerated slipstream', 'roll'],
  s: ['Spiraling slipstream', 'yaw'],
  t: ['Torque', 'roll'],
};
// For each factor: the look-alike drawn from the same view, then one from the other view.
const PAST_DECOYS = { p: ['s', 't'], a: ['t', 'p'], s: ['p', 'a'], t: ['a', 's'] };

const pastChoice = (k, flip = false) => {
  const [name, motion] = PAST[k];
  return `${name}: ${flip ? (motion === 'yaw' ? 'roll' : 'yaw') : motion}`;
};

const pictureEntries = Object.fromEntries(
  Object.keys(PAST).flatMap((k) =>
    ['left', 'right'].map((side) => [
      `past.${k}-${side}`,
      { right: pastChoice(k), wrong: [pastChoice(k, true), ...PAST_DECOYS[k].map((d) => pastChoice(d))] },
    ]),
  ),
);

export const QUIZ = {
  ...factorEntries,
  ...pictureEntries,

  'vs.xw': { wrong: ['12 kt', '15 kt', '20 kt'] },

  /* Engines and cooling */
  'eng.describe': {
    q: 'Which of these describe the Rotax 912 S3 engines?',
    all: ['Liquid-cooled cylinder heads', 'Air-cooled cylinders', 'Dry-sump oil system'],
    wrong: [
      'Direct drive to the propeller',
      'Wet-sump oil system',
    ],
  },
  'eng.power': {
    q: "What is each engine's maximum takeoff power, and for how long?",
    right: '98.6 hp (73.5 kW), 5 minutes maximum',
    wrong: ['92.5 hp (69.0 kW), 5 minutes maximum', '98.6 hp (73.5 kW), continuous', '115 hp (85.8 kW), 5 minutes maximum'],
  },
  'eng.rpm': {
    q: 'What is the maximum RPM shown on the gauge, and for how long?',
    right: '2388 rpm, 5 minutes maximum',
    wrong: ['2265 rpm, 5 minutes maximum', '2388 rpm, continuous', '2700 rpm, 5 minutes maximum'],
  },
  'eng.how-rotax-works': {
    q: 'In the expected answer, how does a Rotax engine manage its fuel mixture?',
    right: 'Dual-path engine control units control the fuel injection',
    wrong: [
      'Magnetos and a manual mixture lever meter the fuel',
      'A single float carburetor that the pilot leans by hand',
      'A turbocharger wastegate controller sets the mixture',
    ],
  },
  'eng.coolant': {
    q: 'Which parts of the engine are liquid cooled?',
    right: 'The cylinder heads; the cylinders are air cooled',
    wrong: [
      'The cylinders; the cylinder heads are air cooled',
      'Both the cylinder heads and the cylinders',
      'Only the oil; cylinder heads and cylinders are air cooled',
    ],
  },
  'eng.overflow': {
    right: 'Takes excess coolant from the expansion tank, then returns it as the system cools',
    wrong: [
      'Holds reserve coolant that the pilot adds in flight with a hand pump',
      'Vents excess coolant overboard when expansion tank pressure is too high',
      'Separates air bubbles from the coolant before it reaches the radiator',
    ],
  },
  'eng.carb-or-fi': {
    right: 'Carbureted, with constant-depression carburetors',
    wrong: [
      'Fuel injected, with a mechanical fuel servo',
      'Carbureted, with one float carburetor and manual mixture',
      'Fuel injected, with electronic injectors on each cylinder',
    ],
  },
  'eng.carb-count': { right: 'Two', wrong: ['One', 'Four', 'None, it is fuel injected'] },
  'eng.max-ct': { wrong: ['130 °C (266 °F)', '110 °C (230 °F)', '150 °C (302 °F)'] },
  'eng.direct-drive': {
    right: 'No, a reduction gearbox lowers propeller RPM',
    wrong: [
      'Yes, the propeller turns at crankshaft speed',
      'No, a belt drive raises propeller RPM',
      'Yes, with a torsional damper on the crankshaft',
    ],
  },
  'eng.gear-ratio': {
    right: '2.43 to 1',
    wrong: [
      '1.5 to 1',
      '3.14 to 1',
      '4.86 to 1',
    ],
  },
  'eng.water-pump': {
    right: 'The engine camshaft, mechanically',
    wrong: [
      'An electric motor on the battery bus',
      'A belt from the alternator',
      'Oil pressure from the propeller governor',
    ],
  },
  'eng.expansion-tank': {
    right: 'The expansion tank on top of the engine; a relief valve in its cap',
    wrong: [
      'The overflow bottle; a relief valve in the radiator',
      'The radiator; a thermostat in the water pump',
      'The expansion tank behind the firewall; the oil pressure regulator',
    ],
  },

  /* Oil */
  'oil.describe': {
    right: 'Dry-sump, with an engine-driven oil pump',
    wrong: [
      'Wet-sump, with an engine-driven oil pump',
      'Dry-sump, with an electric oil pump',
      'Wet-sump, splash lubricated with no pump',
    ],
  },
  'oil.transit': {
    q: 'How does oil move through the system?',
    right: 'The engine-driven pump pulls it from the reservoir, some passes through the radiator, and it returns to the reservoir',
    wrong: [
      'It drains by gravity from the crankcase sump, through the radiator, and back to the sump',
      'An electric pump pushes it from the sump to the propeller hub, and it returns through the gearbox',
      'The engine-driven pump pulls it from the crankcase sump and all of it passes through the radiator',
    ],
  },
  'oil.capacity': {
    q: 'How do you know the oil quantity is acceptable?',
    right: 'The level is between MIN and MAX, per the reservoir door placard',
    wrong: [
      'The dipstick shows at least 6 quarts',
      'The sight gauge on the cowling shows full',
      'The level is within an inch of the filler neck',
    ],
  },
  'oil.temps': {
    q: 'What is the normal oil temperature range?',
    right: '90 to 110 °C (190 to 230 °F)',
    wrong: ['50 to 90 °C (122 to 190 °F)', '110 to 130 °C (230 to 266 °F)', '70 to 100 °C (158 to 212 °F)'],
  },
  'oil.pressure': {
    q: 'What is the normal oil pressure range?',
    right: '2 to 5 bar (29 to 72.5 psi)',
    wrong: ['0.8 to 2 bar (11.6 to 29 psi)', '5 to 7 bar (72.5 to 102 psi)', '1 to 3 bar (14.5 to 43.5 psi)'],
  },
  'oil.type': {
    right: 'Oil with RON 424 classification',
    wrong: [
      'Straight 100-weight aviation mineral oil',
      'Any SAE 20W-50 aviation oil',
      'Two-stroke oil premixed with the fuel',
    ],
  },
  'oil.liters': {
    right: 'Max 3, min 2, operating 2.5',
    wrong: [
      'Max 4, min 3, operating 3.5',
      'Max 6, min 4, operating 5',
      'Max 2, min 1, operating 1.5',
    ],
  },
  'oil.thermostat': {
    right: 'Sends oil through the oil radiator only once it is hot, about 75 °C',
    wrong: [
      'Shuts the engine down if oil temperature passes 130 °C',
      'Opens the cowl flaps as the oil warms',
      'Sends oil through the radiator only while it is cold, below 50 °C',
    ],
  },
  'oil.regulator': {
    right: 'A pressure regulator built into the engine-driven oil pump',
    wrong: [
      'The propeller governor',
      'The thermostatic valve',
      'An electric boost pump',
    ],
  },
  'oil.tank': {
    right: 'Behind the firewall, away from heat sources',
    wrong: [
      'In the lower cowling, next to the oil radiator',
      'In the wing root, inboard of the fuel tank',
      'On top of the engine, under a pressure cap',
    ],
  },

  /* Fuel */
  'fuel.types': {
    q: 'Which fuels can be used in the P2006T?',
    all: ['MoGas, minimum RON 95', 'AvGas 100LL'],
    wrong: [
      'Jet A',
      'MoGas, RON 87',
      'Diesel',
    ],
  },
  'fuel.mogas': {
    right: 'Improved engine wear over time',
    wrong: ['Higher power output', 'Longer range per gallon', 'Lower risk of vapor lock'],
  },
  'fuel.capacity': {
    q: 'What is the total fuel capacity?',
    right: '52.8 gallons, 51.35 usable (200 liters)',
    wrong: [
      '26.4 gallons, 25.7 usable (100 liters)',
      '52.8 gallons, all usable (200 liters)',
      '63.4 gallons, 60.8 usable (240 liters)',
    ],
  },
  'fuel.drains': {
    right: 'Four: a gascolator drain and a wing tank drain per side',
    wrong: [
      'Two: one wing tank drain per side',
      'Six: two wing tank drains and a gascolator drain per side',
      'Three: one per wing tank and one cross-feed drain',
    ],
  },
  'fuel.crossfeed': {
    q: 'What does engine cross-feed do?',
    right: 'Supplies an engine from the opposite-side tank',
    wrong: [
      'Pumps fuel from one tank into the other',
      'Supplies both engines from both tanks at once',
      'Returns unused fuel to the opposite-side tank',
    ],
  },
  'fuel.selectors': {
    right: 'Each selector has left, right and off',
    wrong: [
      'Each selector has on, cross-feed and off',
      'Each selector has left, right, both and off',
      'Each selector has on and off only',
    ],
  },
  'fuel.feed': {
    q: 'What moves fuel from the tanks to the engines?',
    all: ['Engine-driven fuel pumps', 'Electric auxiliary pumps in critical phases'],
    wrong: [
      'Gravity feed alone, with no pumps',
      'One electric pump shared by both engines',
    ],
  },
  'fuel.sensor': {
    right: 'On the inboard side of each tank',
    wrong: ['On the outboard side of each tank', 'In each gascolator', 'In the fuselage, at the fuel selectors'],
  },
  'fuel.transfer': {
    right: 'No, cross-feed only',
    wrong: [
      'Yes, with an electric transfer pump',
      'Yes, by gravity through a balance line',
      'Yes, but only on the ground',
    ],
  },

  /* Propellers */
  'prop.describe': {
    q: 'Which describes the P2006T propellers?',
    right: 'MT, two-blade, wood/composite, constant speed, full feathering',
    wrong: [
      'Hartzell, two-blade, aluminum, constant speed, full feathering',
      'MT, three-blade, wood/composite, constant speed, non-feathering',
      'Sensenich, two-blade, composite, ground-adjustable pitch',
    ],
  },
  'prop.lever': {
    right: 'The propeller lever (blue)',
    wrong: ['The throttle', 'The carburetor heat lever', 'The choke lever'],
  },
  'prop.pitch-control': {
    right: 'The propeller lever sets spring tension, which meters oil to and from the hub',
    wrong: [
      'The propeller switch drives an electric pitch motor in the hub',
      'Counterweights alone set pitch; the lever moves a mechanical stop',
      'Manifold pressure acts directly on the piston in the hub',
    ],
  },
  'prop.oil-loss': {
    right: 'High pitch, feathered',
    wrong: ['Low pitch, high RPM', 'They stay at the last selected pitch', 'A mid-pitch position held by the start locks'],
  },
  'prop.oil-loss-why': {
    q: 'Why are the blades built to feather when the hub loses oil pressure?',
    all: ['To reduce drag', 'To prepare the engine to be secured'],
    wrong: [
      'To keep RPM high for a restart attempt',
      'To protect the reduction gearbox from overspeed',
      'To keep the generator on that engine turning',
    ],
  },
  'prop.single-vs-multi': {
    q: 'On a multi-engine constant-speed propeller, what does high oil pressure do?',
    right: 'Moves the blades to low pitch',
    wrong: ['Moves the blades to high pitch', 'Feathers the blades', 'Locks the blades at their current pitch'],
  },
  'prop.governor': {
    q: 'Which three parts make up the working chain of the propeller governor?',
    right: 'Speeder spring, flyweights and pilot valve',
    wrong: [
      'Shuttle valve, accumulator and squat switch',
      'Thermostatic valve, relief valve and return valve',
      'Voltage regulator, overvoltage relay and field switch',
    ],
  },
  'prop.gov-forward': {
    right: 'Flyweights fall in, oil pressure up, blade angle down, RPM up',
    wrong: [
      'Flyweights fall out, oil pressure down, blade angle up, RPM down',
      'Flyweights fall in, oil pressure down, blade angle up, RPM up',
      'Flyweights fall out, oil pressure up, blade angle down, RPM down',
    ],
  },
  'prop.gov-aft': {
    right: 'Flyweights fall out, oil pressure down, blade angle up, RPM down',
    wrong: [
      'Flyweights fall in, oil pressure up, blade angle down, RPM up',
      'Flyweights fall out, oil pressure up, blade angle down, RPM down',
      'Flyweights fall in, oil pressure down, blade angle up, RPM up',
    ],
  },
  'prop.gov-climb': {
    right: 'Flyweights fall in, oil pressure up, blade angle down',
    wrong: [
      'Flyweights fall out, oil pressure down, blade angle up',
      'Flyweights fall in, oil pressure down, blade angle up',
      'Nothing moves until the prop lever is moved',
    ],
  },
  'prop.gov-dive': {
    right: 'Flyweights fall out, oil pressure down, blade angle up',
    wrong: [
      'Flyweights fall in, oil pressure up, blade angle down',
      'Flyweights fall out, oil pressure up, blade angle down',
      'Nothing moves until the prop lever is moved',
    ],
  },
  'prop.feather-lock': {
    right: 'Below about 600 to 800 rpm the propeller cannot feather, so feather before then',
    wrong: [
      'Above 2265 rpm the propeller cannot feather, so reduce power first',
      'It holds the propeller feathered until oil pressure returns',
      'It stops the prop lever moving to feather on the ground',
    ],
  },
  'prop.feather-force': {
    right: 'Counterweights and a heavy-duty spring',
    wrong: [
      'High oil pressure from the governor',
      'Nitrogen pressure from an accumulator',
      'An electric feathering motor',
    ],
  },

  /* Electrical */
  'elec.components': {
    q: 'What provides primary DC power?',
    right: 'Two engine-driven generators operating in parallel',
    wrong: [
      'One engine-driven alternator on the left engine',
      'Two batteries, charged by a single generator',
      'Two generators, one on line and one on standby',
    ],
  },
  'elec.buses': {
    q: 'Which of these are buses in the P2006T electrical system?',
    all: ['Battery Bus', 'L and R Generator Buses', 'L and R Avionics Buses'],
    wrong: [
      'Essential Bus',
      'Main Bus',
    ],
  },
  'elec.normal': {
    right: 'In parallel, by both generators and the battery',
    wrong: [
      'Each side is isolated on its own generator',
      'By the battery, which the generators only recharge',
      'By the left generator, with the right on standby',
    ],
  },
  'elec.cross-bus': {
    right: 'Isolate the L or R side from the rest of the electrical system',
    wrong: [
      'Connect the avionics buses directly to the battery',
      'Swap the generators between the left and right buses',
      'Let a running generator crank the opposite starter',
    ],
  },
  'elec.battery-time': { right: '30 minutes', wrong: ['15 minutes', '45 minutes', '60 minutes'] },
  'elec.ac-dc': {
    right: 'DC',
    wrong: ['AC', 'AC, rectified to DC for the avionics', 'DC, inverted to AC for the main buses'],
  },
  'elec.battery': { right: '12 V and 38 Ah', wrong: ['24 V and 38 Ah', '12 V and 18 Ah', '24 V and 11 Ah'] },
  'elec.avionics': {
    right: 'By their respective generator bus',
    wrong: ['Directly by the battery bus', 'By the opposite-side generator bus', 'By a dedicated standby battery'],
  },
  'elec.field': {
    right: 'Let the respective generator supply the electrical system',
    wrong: [
      'Connect the battery to the battery bus',
      'Tie the left and right generator buses together',
      'Supply power to the avionics buses',
    ],
  },
  'elec.regulator': {
    q: 'What does the integrated generator regulator do?',
    all: ['Holds a constant output voltage', 'Gives automatic over-voltage protection'],
    wrong: [
      'Shares the load evenly between two batteries',
      'Steps generator output up to 28 volts for the avionics',
      'Disconnects the battery once it is fully charged',
    ],
  },
  'elec.starters': {
    right: 'Yes, on external DC power, which feeds the Battery Bus directly',
    wrong: [
      'No, the starter relays are always powered through the master switch',
      'Yes, the starters are wired straight to the battery terminals',
      'No, unless both cross-bus switches are on',
    ],
  },

  /* Landing gear */
  'gear.describe': {
    right: 'A reversible electric pump pressurizes hydraulic up or down lines',
    wrong: [
      'Electric motors drive a jackscrew at each landing gear leg',
      'An engine-driven hydraulic pump on the left engine',
      'A manual hand pump, with an electric pump as backup',
    ],
  },
  'gear.pump': { right: 'Electrically', wrong: ['By the left engine', 'By the right engine', 'By hand'] },
  'gear.held-up': {
    right: 'By hydraulic pressure',
    wrong: ['By mechanical uplocks', 'By over-center springs', 'By electric brakes on the actuators'],
  },
  'gear.backup': {
    right: 'An emergency system pushes hydraulic fluid into the top of each landing gear cylinder',
    wrong: [
      'A dump valve releases pressure and the landing gear free-falls',
      'A hand crank between the seats winds the landing gear down',
      'A manual hand pump under the right seat',
    ],
  },
  'gear.green': {
    right: 'That landing gear is down and locked',
    wrong: ['That landing gear is up and locked', 'The landing gear pump is running', 'That landing gear is in transit'],
  },
  'gear.red': {
    right: 'The landing gear are not all down and locked, nor all up',
    wrong: ['All landing gear are up and locked', 'The landing gear pump has failed', 'Hydraulic pressure is low'],
  },
  'gear.amber': {
    right: 'The landing gear pump is powered, so the landing gear is in transit',
    wrong: [
      'One landing gear is not down and locked',
      'Emergency accumulator pressure is low',
      'The aircraft weight is on the wheels',
    ],
  },
  'gear.horn': {
    right: 'Flaps lowered to FULL with the landing gear not down and locked',
    wrong: [
      'Airspeed below V_MC with the landing gear up',
      'Any time the landing gear is in transit',
      'Flaps at takeoff with the landing gear down',
    ],
  },
  'gear.main-not-locked': {
    right: 'Land with the landing gear up, and shut down the engines when landing is assured',
    wrong: [
      'Land on the locked landing gear and hold the other wing up as long as possible',
      'Recycle the landing gear until fuel is nearly gone, then land with the landing gear down',
      'Land with the landing gear up, keeping both engines at idle for a go-around',
    ],
  },
  'gear.emergency-control': {
    q: 'Where is the emergency landing gear control?',
    right: 'Left seat floorboard',
    wrong: ['Center console, between the seats', 'Overhead panel, by the fuel selectors', 'Right seat floorboard'],
  },
  'gear.exception': {
    right: 'Emergency extension uses a pressurized accumulator to force the landing gear down',
    wrong: [
      'Emergency extension relies on free fall alone',
      'Retraction is powered by engine-driven pumps',
      'The main gear is fixed and only the nose gear retracts',
    ],
  },
  'gear.accumulator': { wrong: ['10 bar', '30 bar', '5 bar'] },
  'gear.squat': {
    right: 'Right main gear; it prevents landing gear retraction on the ground',
    wrong: [
      'Nose gear; it prevents landing gear retraction on the ground',
      'Left main gear; it silences the stall warning on the ground',
      'Right main gear; it shuts off the hydraulic pump after landing',
    ],
  },
  'gear.type': {
    right: 'Electrically activated, hydraulically actuated',
    wrong: [
      'Hydraulically activated, electrically actuated',
      'Mechanically activated, pneumatically actuated',
      'Electrically activated and electrically actuated',
    ],
  },
  'gear.pressure': {
    right: 'Retracting',
    wrong: [
      'Extending',
      'Both take the same pressure',
      'Neither; the pump only runs for emergency extension',
    ],
  },
  'gear.shuttle': {
    right: 'Nitrogen from the accumulator reaches the gear jacks through the shuttle valves',
    wrong: [
      'The electric pump reverses and runs from the emergency battery',
      'The up locks release and the landing gear free-falls',
      'Engine oil pressure is routed to the gear jacks',
    ],
  },
  'gear.unsafe': {
    right: 'Gear selector up on the ground, or gear not down and locked with flaps FULL',
    wrong: [
      'Gear selector down in flight above 122 KIAS',
      'Gear down with flaps up',
      'Either alternator field switched off',
    ],
  },

  /* Flight controls */
  'fc.primary': {
    q: 'Which of these are primary flight controls on the P2006T?',
    all: ['Stabilator', 'Ailerons', 'Rudder'],
    wrong: [
      'Elevator',
      'Flaps',
      'Rudder trim',
    ],
  },
  'fc.mechanism': {
    right: 'Push-pull rods',
    wrong: ['Cables and pulleys', 'Hydraulic actuators', 'Electric servos'],
  },
  'fc.secondary': {
    q: 'How are the three trims operated?',
    right: 'Rudder electric; pitch manual with an electric option; aileron ground-adjustable',
    wrong: [
      'Rudder electric; pitch electric only; aileron electric',
      'Rudder manual; pitch manual with an electric option; aileron electric',
      'Rudder ground-adjustable; pitch manual only; aileron electric',
    ],
  },
  'fc.pitch-trim': {
    right: 'The trim wheel or switch moves the anti-servo tab',
    wrong: [
      'The trim wheel changes the incidence of a fixed stabilizer',
      'The trim switch changes the tension of a bungee spring',
      'The trim wheel moves a servo tab on the elevator',
    ],
  },
  'fc.stabilator': {
    right: 'A movable horizontal stabilizer; the whole surface moves',
    wrong: [
      'A fixed horizontal stabilizer with a hinged elevator behind it',
      'A V-tail surface that combines rudder and elevator',
      'A fixed horizontal stabilizer whose incidence changes only for trim',
    ],
  },
  'fc.anti-servo': {
    right: 'A tab that moves the same way as the stabilator, opposing its movement',
    wrong: [
      'A tab that moves opposite to the stabilator, lightening control forces',
      'A fixed tab that is bent on the ground to correct trim',
      'A spring that returns the control column to center',
    ],
  },
  'fc.rudder-trim': {
    right: 'Electrically',
    wrong: ['Manually, by cables from a trim wheel', 'It is not: the tab is ground-adjustable', 'Hydraulically'],
  },
  'fc.aileron-trim': {
    right: 'A ground-adjustable tab on the left aileron',
    wrong: [
      'An electric tab on the right aileron',
      'A manual trim wheel on the center console',
      'A ground-adjustable tab on each aileron',
    ],
  },
  'fc.flaps': { right: 'Electrically', wrong: ['Manually, by a lever and cables', 'Hydraulically', 'Pneumatically'] },

  /* Preflight, towing and fueling */
  'pre.rotate-prop': {
    right: 'It forces oil through the system so the quantity reads accurately',
    wrong: [
      'It checks the compression of each cylinder',
      'It primes the carburetors with fuel',
      'It confirms the propeller is not feathered',
    ],
  },
  'pre.fluids': {
    q: 'Which fluid levels must pilots check during preflight?',
    all: ['Oil', 'Fuel', 'Coolant'],
    wrong: [
      'Hydraulic fluid',
      'Brake fluid',
    ],
  },
  'pre.oil-murmur': {
    right: 'A murmur from the open oil tank',
    wrong: [
      'A rise on the oil pressure gauge',
      'Oil appearing at the breather line',
      'The dipstick reading above MAX',
    ],
  },
  'pre.gear-pressure': { wrong: ['10 bar', '30 bar', '12 bar'] },
  'pre.towing': {
    q: 'What must be done before towing the P2006T?',
    all: ['Master switch on', 'Keep the nose gear within 20° left or right'],
    wrong: [
      'Master switch off',
      'Install the landing gear pins',
      'Keep the nose gear within 45° left or right',
    ],
  },

  /* Limitations and general */
  'gen.pitot-static': {
    q: 'How many pitot tubes and static ports does the P2006T have?',
    right: 'Two pitot tubes and two static ports, plus alternate static',
    wrong: [
      'One pitot tube and two static ports, plus alternate static',
      'Two pitot tubes and one static port, with no alternate static',
      'One pitot tube and one static port, plus alternate static',
    ],
  },
  'gen.atomatoflames': {
    right: 'The temperature gauge, because the engine is liquid cooled',
    wrong: [
      'The manifold pressure gauge, because of the reduction gearbox',
      'The oil pressure gauge, because of the dry sump',
      'The fuel gauge, because of cross-feed',
    ],
  },
  'gen.door-lock': {
    right: 'An oil pressure sensor locks the door while the engines run',
    wrong: [
      'A squat switch locks the door once airborne',
      'An airspeed switch locks the door above 40 knots',
      'The master switch locks the door whenever it is on',
    ],
  },
  'gen.metric': {
    right: 'Metric units',
    wrong: ['Reduction-gearbox RPM', 'Liquid cooling', 'The high-wing fuel system'],
  },
  'gen.operations': {
    right: 'Day and night VFR and IFR',
    wrong: ['Day VFR only', 'Day and night VFR only', 'Day and night VFR, IFR and known icing'],
  },
  'gen.icing': {
    q: 'The P2006T is not rated for icing conditions. Which ice protection does it have?',
    all: ['Pitot heat', 'Defrost'],
    wrong: [
      'De-ice boots',
      'TKS fluid',
      'Heated propellers',
    ],
  },
  'gen.max-altitude': { wrong: ['10,000 ft', '12,500 ft', '18,000 ft'] },
  'gen.load-factors': {
    q: 'What are the flaps-up load factor limits?',
    right: '+3.8 G and -1.78 G',
    wrong: ['+4.4 G and -1.76 G', '+3.8 G and -1.52 G', '+2 G and 0 G'],
  },
  'gen.mtow': { wrong: ['2,600 lb (1,180 kg)', '2,950 lb (1,338 kg)', '2,550 lb (1,157 kg)'] },
  'gen.restart': {
    q: 'When should a pilot probably not attempt to restart a failed engine?',
    right: 'When severe damage or fire is present or suspected',
    wrong: [
      'When the airspeed is below V_YSE',
      "When the failure happened above 3,000' AGL",
      'When the propeller is still windmilling',
    ],
  },

  /* Brakes, instruments and heating */
  'brk.toe': {
    right: 'Toe brakes on both sets of rudder pedals',
    wrong: [
      'A hand lever on the center pedestal',
      'Toe brakes on the left seat only',
      'Heel brakes below the rudder pedals',
    ],
  },
  'brk.master': {
    right: 'A single vented reservoir feeds the pilot side, with hoses to the co-pilot side',
    wrong: [
      'Each pedal has its own sealed reservoir',
      'The landing gear hydraulic pump supplies them',
      'The emergency accumulator supplies them',
    ],
  },
  'brk.wheels': {
    right: 'Hydraulic calipers on Cleveland 6.00-6 wheels',
    wrong: [
      'Drum brakes on Cleveland 5.00-5 wheels',
      'Hydraulic calipers on all three wheels',
      'Cable-operated calipers on Cleveland 6.00-6 wheels',
    ],
  },
  'brk.parking': {
    right: 'A valve traps hydraulic pressure in the brake lines',
    wrong: [
      'A pin locks the nose wheel',
      'A cable clamps the brake calipers',
      'The electric pump holds pressure with the master switch on',
    ],
  },
  'ins.adahrs': {
    right: 'Air Data, Attitude and Heading Reference System; it combines the ADC and the AHRS',
    wrong: [
      'Automatic Dependent Altitude and Heading Reporting System; it replaces the transponder',
      'Air Data and Autopilot Heading Reference System; it replaces the flight director',
      'Attitude Display and Horizontal Reference System; it replaces the magnetometer',
    ],
  },
  'ins.ahrs': {
    right: 'Solid-state accelerometers and tilt sensors, with no moving parts',
    wrong: [
      'A vacuum-driven gyro',
      'An electrically spun gyro',
      'GPS track and ground speed only',
    ],
  },
  'ins.magnetometer': {
    right: 'Senses the magnetic field for heading; in the wingtip',
    wrong: [
      'Senses the magnetic field for heading; behind the instrument panel',
      'Measures outside air temperature; in the wingtip',
      'Measures yaw rate; in the tail cone',
    ],
  },
  'ins.adc': {
    right: 'Pitot and static pressure; airspeed, altitude and vertical speed',
    wrong: [
      'Magnetic flux; heading and track',
      'Acceleration; pitch, roll and yaw',
      'Manifold pressure; engine power',
    ],
  },
  'ins.oat': {
    right: 'True airspeed and density altitude',
    wrong: [
      'Indicated airspeed and pressure altitude',
      'Heading and track',
      'Fuel flow and endurance',
    ],
  },
  'env.heat': {
    right: 'Ram air warmed by engine exhaust in a heat exchanger',
    wrong: [
      'An electric heater on the avionics bus',
      'Hot engine coolant in a cabin radiator',
      'Warm air drawn from the oil radiator',
    ],
  },
  'env.pitot-heat': {
    right: 'The left main pitot tube; left side of the instrument panel',
    wrong: [
      'Both pitot tubes; overhead panel',
      'The right pitot tube; center pedestal',
      'The left main pitot tube; overhead panel',
    ],
  },

  /* Minimum control speed */
  'vmc.define': {
    right: 'The slowest speed at which directional control can be maintained with one engine inoperative',
    wrong: [
      'The slowest speed at which the airplane can still climb with one engine inoperative',
      'The speed that gives the best rate of climb with one engine inoperative',
      'The speed at which the airplane stalls with one engine inoperative',
    ],
  },
  'vmc.who': { right: 'The manufacturer', wrong: ['The FAA', 'The pilot in command', 'The flight school'] },
  'vmc.combats': {
    q: 'Which of these are COMBATS conditions for V_MC?',
    all: ['Critical engine failed and windmilling', 'Aft CG', 'Landing gear up'],
    wrong: ['Maximum takeoff weight', 'Wings level', 'Flaps up'],
  },
  'vmc.combats-c': {
    right: 'Critical engine failed and windmilling',
    wrong: [
      'Critical engine failed and feathered',
      'Cowl flaps closed',
      'CG at the forward limit',
    ],
  },
  'vmc.combats-o': {
    right: 'Operating engine at max takeoff power',
    wrong: [
      'Operating engine at max continuous power',
      'Operating engine at cruise power',
      'Operating engine at idle',
    ],
  },
  'vmc.combats-m': {
    right: 'Most adverse weight, normally the lighter one',
    wrong: [
      'Maximum takeoff weight',
      'Maximum landing weight',
      'Mixture full rich',
    ],
  },
  'vmc.combats-b': {
    right: 'Bank of up to 5° toward the operating engine',
    wrong: [
      'Bank of up to 5° toward the inoperative engine',
      'Ball centered with the wings level',
      'Both engines at max takeoff power',
    ],
  },
  'vmc.combats-a': {
    right: 'Aft CG',
    wrong: [
      'Forward CG',
      'Airspeed at the blue line',
      'Altitude of 5,000 ft',
    ],
  },
  'vmc.combats-t': {
    right: 'Takeoff configuration: flaps T/O, landing gear up, trim set',
    wrong: [
      'Takeoff configuration: flaps up, landing gear down, trim set',
      'Landing configuration: flaps FULL, landing gear down',
      'Clean configuration: flaps up, landing gear up',
    ],
  },
  'vmc.combats-s': {
    right: 'Standard day temperature and pressure altitude',
    wrong: [
      'Service ceiling on one engine',
      'Stall speed in the landing configuration',
      'Sideslip of zero',
    ],
  },
  'vmc.combats-lowers': {
    right: 'Bank of up to 5° toward the operating engine',
    wrong: ['Critical engine failed and windmilling', 'Operating engine at max takeoff power', 'Aft CG'],
  },
  'vmc.pattern': {
    q: 'Every COMBATS condition raises both V_MC and performance, with one exception each. What are the exceptions?',
    right: 'The bank lowers V_MC; the windmilling propeller lowers performance',
    wrong: [
      'The aft CG lowers V_MC; the light weight lowers performance',
      'The windmilling propeller lowers V_MC; the bank lowers performance',
      'The light weight lowers V_MC; the takeoff power lowers performance',
    ],
  },
  'vmc.demo': {
    q: 'What does the V_MC demo show?',
    all: ['Control at low speed on one engine', 'Recovery from a momentary loss of directional control'],
    wrong: [
      'That the airplane can climb at V_MC on one engine',
      'A full stall and recovery on one engine',
      'How configuration changes affect drag on one engine',
    ],
  },
  'vmc.changes': {
    right: 'Yes, with weight, configuration and performance',
    wrong: ['No, it is fixed at certification', 'Only with outside air temperature', 'Only if the propellers are changed'],
  },
  'vmc.slower': {
    right: 'Good: more rudder is available and it is more effective',
    wrong: [
      'Bad: less rudder is available',
      'Good: the airplane stalls at a lower speed',
      'Bad: single-engine climb performance drops',
    ],
  },
  'vmc.faster': {
    right: 'Bad: less rudder is available, or it is less effective',
    wrong: [
      'Good: more rudder is available',
      'Good: the airplane carries more energy',
      'Bad: the stall speed rises with it',
    ],
  },

  /* Critical engine and performance */
  'ce.define': {
    right: 'The engine whose failure most adversely affects performance and controllability',
    wrong: [
      'The engine that produces the most thrust at takeoff power',
      'The engine that drives the hydraulic pump and generator',
      'The engine most likely to fail first, by the maintenance record',
    ],
  },
  'ce.past': {
    q: 'Which factors determine the critical engine?',
    all: ['P-factor', 'Accelerated slipstream', 'Spiraling slipstream', 'Torque'],
    wrong: [
      'Adverse yaw',
      'Aft CG',
    ],
  },
  'ce.past-p': {
    q: 'With one engine inoperative, what does P-factor do, and why is losing the left engine worse?',
    right: "Yaw: the right engine's descending blade is farther from the centerline",
    wrong: [
      "Roll: the right engine's descending blade is farther from the centerline",
      "Yaw: the left engine's descending blade is farther from the centerline",
      'Roll: clockwise propellers twist the airframe to the left',
    ],
  },
  'ce.past-a': {
    q: 'With one engine inoperative, what does accelerated slipstream do, and why is losing the left engine worse?',
    right: "Roll: the right engine's extra wing lift is farther from the centerline",
    wrong: [
      "Yaw: the right engine's extra wing lift is farther from the centerline",
      "Roll: the left engine's extra wing lift is farther from the centerline",
      "Yaw: the right engine's slipstream pushes on the vertical stabilizer",
    ],
  },
  'ce.past-s': {
    q: 'With one engine inoperative, what does spiraling slipstream do, and why is losing the left engine worse?',
    right: "Yaw: only the left engine's slipstream reaches the vertical stabilizer to oppose the yaw",
    wrong: [
      "Roll: only the left engine's slipstream reaches the vertical stabilizer to oppose the roll",
      "Yaw: only the right engine's slipstream reaches the vertical stabilizer to oppose the yaw",
      "Roll: the right engine's slipstream adds lift farther out on the wing",
    ],
  },
  'ce.past-t': {
    q: 'With one engine inoperative, what does torque do, and why is losing the left engine worse?',
    right: 'Roll: clockwise propellers roll the airplane left, toward a failed left engine',
    wrong: [
      'Yaw: clockwise propellers yaw the airplane left, toward a failed left engine',
      'Roll: clockwise propellers roll the airplane right, toward a failed right engine',
      "Yaw: the right engine's descending blade is farther from the centerline",
    ],
  },
  'ce.sideslip': {
    q: 'What is used to counter the sideslip with one engine inoperative?',
    right: 'Rudder, and bank toward the operating engine',
    wrong: [
      'Rudder, and bank toward the inoperative engine',
      'Rudder only, with wings level and the ball centered',
      'Aileron only, toward the operating engine',
    ],
  },
  'ce.service-ceiling': {
    q: 'What climb rates define service ceiling?',
    right: '100 FPM on two engines, or 50 FPM on one',
    wrong: [
      '50 FPM on two engines, or 0 FPM on one',
      '500 FPM on two engines, or 100 FPM on one',
      '100 FPM on two engines, or 100 FPM on one',
    ],
  },
  'ce.accel-stop': {
    right: 'Accelerate to V_R / V_LOF, lose an engine, then stop',
    wrong: [
      'Accelerate to V_MC, lose an engine, then stop',
      'Accelerate to V_R / V_LOF, lose an engine, then climb to 50 feet',
      'Accelerate to V_YSE, lose an engine, then stop',
    ],
  },
  'ce.accel-go': {
    right: 'Accelerate to V_R / V_LOF, lose an engine, continue and climb to 50 feet',
    wrong: [
      'Accelerate to V_R / V_LOF, lose an engine, then bring the aircraft to a stop',
      'Accelerate to V_YSE, lose an engine, continue and climb to 400 feet',
      'Accelerate to V_MC, lose an engine, continue and climb to 35 feet',
    ],
  },
  'ce.manifold': {
    right: 'Close to ambient pressure for the current altitude',
    wrong: ['Close to zero', 'Unchanged from before the failure', 'About half that of the operating engine'],
  },
  'ce.part23': {
    right: 'None. It must only be determined',
    wrong: ['At least 50 FPM', 'At least 100 FPM', 'A positive rate of 0.027 × V_SO²'],
  },
  'ce.stall-altitude': {
    right: 'It remains the same',
    wrong: ['It increases with altitude', 'It decreases at the same rate as V_MC', 'It decreases, but more slowly than V_MC'],
  },

  /* MEI only */
  'mei.shutdown-alt': {
    right: "3,000' AGL, unless the POH says higher",
    wrong: ["1,500' AGL, unless the POH says higher", "5,000' AGL in all cases", "3,000' MSL in all cases"],
  },
  'mei.low-alt-failure': { wrong: ["200' AGL", "500' AGL", "1,000' AGL"] },
  'mei.reject-speed': {
    right: 'Half of published V_MC',
    wrong: ['Published V_MC', 'V_R', 'V_MC plus 5 knots'],
  },
  'mei.drag-demo': {
    right: 'To show how configuration changes affect drag and handling on one engine',
    wrong: [
      'To show the loss of directional control as speed nears V_MC',
      'To show stall behavior with landing gear and flaps extended',
      'To show how to feather and secure a failed engine',
    ],
  },
};
