# Calculation Methodology

This document explains how the Tecnam P2006T calculator produces its numbers, where each input comes from, and why each decision was made. It is written for pilots who want to check the work rather than take it on trust.

The calculator is a planning aid. The Pilot's Operating Handbook (POH) and the pilot in command remain the authority. Some figures below are published POH data, and others are estimates that the POH does not provide. Section 1 separates the two, because that distinction matters more than any formula here.

## 1. Sources and their standing

| Figure | Basis | Standing |
|---|---|---|
| Weight, moment, CG | POH arms and limits, aircraft weighing record | POH method |
| Takeoff and landing distances | POH tables SW5-7 to SW5-9 and SW5-19 to SW5-21 | POH data, interpolated |
| Climb rates | POH tables SW5-10 and SW5-14 | POH data, interpolated |
| Accelerate-stop distance | Training rule of thumb | Estimate, not in the POH |
| Accelerate-go distance | Derived from POH ground roll and climb rate | Estimate, not in the POH |
| Required climb to clear an obstacle | FAA runway data and simple geometry | Estimate, not in the POH |
| Weather | VATSIM METAR API | Not an official weather source |
| Airport and runway data | FAA NASR 28-day subscription | Official data, partial for obstacles |

The aircraft data follows POH 4th Edition, Rev. 21, Doc. No. 2006/044, in the MOD 2006/015 configuration (MTOW 1230 kg / 2712 lb).

Every takeoff, landing and climb table in `src/data/p2006t.js` was compared with the POH text: 276 rows across 24 tables, with no differences. The corrections and the principal limits were checked the same way.

## 2. Weight and balance

### Method

Each station's moment is its weight multiplied by its arm. Total moment divided by total weight gives the CG arm, measured in feet aft of the datum.

```
moment  = weight × arm
CG arm  = total moment ÷ total weight
% MAC   = CG arm ÷ 4.39 ft × 100
```

| Station | Arm (ft) |
|---|---|
| Front seats | −2.970 |
| Rear seats | +0.753 |
| Fuel | +2.516 |
| Baggage | +5.533 |

Empty weight and moment are entered from the aircraft's own weighing record. Fuel is converted at 6.7 lb/gal.

### Loading conditions

| Condition | Fuel on board | Weight limit checked |
|---|---|---|
| Ramp | All loaded fuel | None |
| Takeoff | Loaded fuel less taxi fuel | MTOW |
| Landing | Takeoff fuel less enroute fuel | MTOW, which equals maximum landing weight |
| Zero fuel | None | MZFW, 2635 lb |

Each condition must also sit between the forward limit of 0.725 ft (16.5% MAC) and the aft limit of 1.36 ft (31% MAC). Both limits are constant for all weights.

### Worked example

The default load is a 190 lb pilot, a 165 lb co-pilot, 25 lb of baggage and 40 gal of fuel, with 1 gal for taxi and 15 gal enroute.

| Condition | Weight (lb) | Moment (lb·ft) | CG (ft) | % MAC |
|---|---|---|---|---|
| Ramp | 2601.0 | 2200.3 | 0.846 | 19.3 |
| Takeoff | 2594.3 | 2183.4 | 0.842 | 19.2 |
| Landing | 2493.8 | 1930.5 | 0.774 | 17.6 |
| Zero fuel | 2333.0 | 1526.0 | 0.654 | 14.9 |

The zero-fuel condition falls forward of the 16.5% limit, so it is flagged. Fuel has an aft arm in this aircraft, so burning fuel moves the CG forward.

### Suggestion engine

When a load is out of limits, the app looks for a fix. It treats passenger weights, taxi fuel and enroute fuel as fixed, and may change only the fuel load or add baggage.

Because fuel has a single arm, each CG limit reduces to a simple bound on takeoff fuel. The engine combines those bounds with MTOW, tank capacity and required reserve to find a usable fuel range. If no fuel quantity works, it searches for the least baggage that opens a range, because baggage moves the CG aft.

Suggested fuel is rounded down to 0.1 gal and rechecked, so rounding cannot push the load back out of limits. Baggage is capped so the suggestion cannot exceed MZFW. A load already over MZFW is reported as having no solution, because fuel cannot fix it.

The engine solves for the takeoff and landing conditions only. It does not try to bring the zero-fuel CG inside the envelope, so a load can show no advisory while the zero-fuel row is flagged, as in the example above.

## 3. Atmosphere

```
pressure altitude = field elevation + (29.92 − altimeter) × 1000
```

The POH tables are entered with pressure altitude and outside air temperature, so those are the two values used. Density altitude is calculated, but no distance depends on it.

If a report has no temperature or altimeter, the app calculates no distances and asks for another station. Earlier versions assumed 15 °C and 29.92 inHg, which at 5,000 ft and a real 34 °C understated the distance to 50 ft by about 15%. A missing dew point alone does not matter; the temperature is still used.

## 4. Reading the POH tables

The tables give values at fixed weights, altitudes and temperatures. The app interpolates linearly between the two neighbouring values along each axis in turn: temperature, then pressure altitude, then weight.

**Table edges.** Values outside a table use its nearest edge. The POH publishes nothing beyond those edges, and no extrapolation is attempted.

| Axis | Range | Note |
|---|---|---|
| Weight | 930 to 1230 kg | |
| Temperature | −25 to 50 °C | |
| Pressure altitude, takeoff and landing | Sea level to 10,000 ft | |
| Pressure altitude, VY climb | Sea level to 14,000 ft | |
| Pressure altitude, single-engine climb | Sea level to 7,000 ft | |

Using the edge is conservative below sea level, because a high altimeter setting cannot produce a figure better than the sea-level row. It is **not** conservative above the top of a table. Above 7,000 ft pressure altitude, the single-engine climb rate stays at the 7,000 ft value, although the real rate keeps falling.

**ISA column.** The POH tables include an ISA column. The app does not use it, because the actual temperature is always available.

**Normal and short field.** The POH does not differentiate between normal and short-field performance. It publishes one takeoff table and one landing table for each weight, so a planning form's normal and short-field rows take the same figures.

**A POH oddity.** The landing "At 50 ft AGL" rows for 3,000 ft and 4,000 ft are identical at all three weights. It looks like a printing error, but the app reproduces the POH as published.

## 5. Takeoff and landing corrections

The tables assume a grass runway. Corrections are applied in this order.

| Correction | Takeoff | Landing |
|---|---|---|
| Headwind | −2.5 m per kt | −5 m per kt |
| Tailwind | +10 m per kt | +11 m per kt |
| Paved runway | −6% of ground roll | −2% of ground roll |
| Slope, per +1% upslope | +5% of ground roll | −2.5% of ground roll |

The POH applies these to ground roll. The app adds the same number of metres to the 50 ft distance, on the reasoning that a change on the ground leaves the airborne segment unchanged.

Only paved runways receive a surface correction. Turf, gravel and dirt all use the grass figures unchanged. There is no allowance for wet or contaminated surfaces.

Runway slope is calculated from FAA end elevations and runway length, and is positive when departing uphill. It can be unreliable where those elevations are poor.

Takeoff distances use the ramp weight, which is conservative by the weight of the taxi fuel. Landing distances use the planned landing weight. Landing figures use the selected departure runway end, because the app has no separate landing runway.

## 6. Wind

### True and magnetic

METAR winds are referenced to true north, while runway numbers are magnetic. Mixing the two introduces an error equal to the local variation, which is about 16° at Seattle and 15° at Boston.

All wind components therefore use true runway headings. The FAA publishes a true heading for about 40% of runway ends. The rest are calculated as the runway number × 10 plus the published magnetic variation. Where an airport has no published variation, the nearest airport's value is used.

These calculated headings can be several degrees out, because a runway number is rounded to 10° and FAA variation values can be old. The wind displayed in the Conditions section is the METAR wind, in degrees true.

### Components

```
headwind  = wind speed × cos(wind direction − runway true heading)
crosswind = wind speed × sin(wind direction − runway true heading)
```

### Gusts

A gusting wind has no single correct value, so the app applies a policy chosen to err in the safe direction.

| Use | Wind speed used |
|---|---|
| Crosswind figure and warning | Midpoint of steady and gust |
| Runway card headwind or tailwind | Midpoint |
| Runway ranking | Midpoint |
| Headwind in distance calculations | Steady |
| Tailwind in distance calculations | Midpoint |

The midpoint gives the pilot one representative figure. In the distance calculations, gusts can only lengthen the result: a gust earns no headwind credit, and a gusting tailwind counts for more than its steady value. As a result, a runway card can show more headwind than the distances assume.

Variable winds have no direction, so no components are shown and no wind correction is applied.

### Crosswind

The POH gives 17 kt as the maximum demonstrated crosswind. Runway ends above 17 kt are shown in red with a warning symbol and rank below every runway within the figure. The comparison uses the rounded value, so 17.4 kt shows as 17 kt and is not flagged.

Runways are ranked by whether they are within the crosswind figure, then by headwind. The best end is selected automatically, and the pilot can select any other.

There is no tailwind warning. Tailwind is shown as a figure and ranks lower.

## 7. Engine failure on takeoff

A multi-engine pilot needs two answers before takeoff. If an engine fails at the critical moment, can the airplane stop on the remaining runway, and can it continue and climb away?

**Accelerate-stop distance** is the distance to accelerate to the failure point, recognize the problem, reject the takeoff and stop.

**Accelerate-go distance** is the distance to continue after the failure and reach a defined height on the remaining engine. Here that height is 50 ft.

These are separate questions with separate answers. Small training twins do not have airline-style balanced-field performance, so a runway can be long enough for a normal takeoff and still leave poor margins for either outcome. Temperature, pressure altitude, weight, wind, runway condition and obstacles all change the result.

Not every light twin publishes this data, and the terms do not appear in the searchable text of this aircraft's POH. Multi-engine planning forms still ask for both, so the calculator supplies estimates by the methods below. See [Accelerate-Stop and Accelerate-Go](https://www.pilot-desk.com/guides/accelerate-stop-accelerate-go.html) for a general introduction.

**Why only one figure carries a margin.** The 30% allowance for a delayed decision applies to accelerate-stop only. A rejected takeoff happens on the ground, so every moment of delay at speed uses runway the airplane needs for stopping. Accelerate-go carries no such factor, because the airplane is already flying. Its distance is set by climb performance.

## 8. Accelerate-stop

```
accelerate-stop = (takeoff ground roll + landing ground roll) × 1.30
```

This is a training rule of thumb and is **not** a POH figure. The 1.30 factor allows for a delayed decision. The landing roll is taken at planned landing weight as part of that rule.

| Data point | Source | Conditions |
|---|---|---|
| Takeoff ground roll | POH SW5-7 to SW5-9 | Ramp weight, pressure altitude, OAT, then wind, surface and slope corrections |
| Landing ground roll | POH SW5-19 to SW5-21 | Planned landing weight, pressure altitude, OAT, then wind, surface and slope corrections |
| Decision margin | Training rule | Fixed at 1.30 |
| Runway available | FAA TORA | Physical runway length where no TORA is published |

If the result is longer than the runway, the card turns red and states the runway length. The distance stays visible, and it shows in red on the print sheet.

## 9. Accelerate-go

The POH publishes no accelerate-go data. The app gives an estimate:

```
groundspeed       = 84 kt − headwind
climb to 50 ft    = (50 ÷ single-engine climb rate) × groundspeed × 30.867
accelerate-go     = takeoff ground roll + climb to 50 ft
```

The factor of 30.867 converts knots to metres per minute.

| Data point | Source | Conditions |
|---|---|---|
| Takeoff ground roll | POH SW5-7 to SW5-9 | Ramp weight, pressure altitude, OAT, then wind, surface and slope corrections |
| Single-engine climb rate | POH SW5-14, VYSE | Ramp weight, pressure altitude, OAT |
| Climb speed | POH VYSE, 84 KIAS | Fixed value for 1230 kg, sea level, ISA |
| Wind | METAR | Steady headwind, or tailwind at the gust midpoint |
| Height reached | Fixed | 50 ft above the runway |
| Object height and distance | FAA runway record | Used only for the required climb rate |
| Runway length | FAA runway record | Used only for the required climb rate |

The POH table for VYSE assumes maximum continuous power, the failed propeller feathered, and gear and flaps up. The table lists a lower VYSE at lighter weights and higher altitudes, but the calculation keeps 84 KIAS, which slightly lengthens the distance.

That assumption flatters the result. The estimate allows no time for recognition, for feathering, or for retracting gear and flaps. It treats indicated airspeed as true airspeed, which understates the distance at altitude. The accelerate-go distance is not compared with runway length.

### Climb floor and caution

| Predicted single-engine climb | Result |
|---|---|
| Below the floor | Distance shows N/A with the predicted rate |
| At the floor, up to 50 fpm above it | Distance shows with an amber caution |
| More than 50 fpm above the floor | Distance shows normally |

The floor is 50 fpm, unless an obstacle requires more. A climb rate near zero gives a distance so long that it stops meaning anything, and the pilot is better served by the rate itself. The messages state the numbers and draw no conclusion. The go or no-go decision belongs to the pilot.

### Obstacles

The FAA records a "controlling object" for each runway end. The app uses the object beyond the departure end to work out the climb rate needed from liftoff to the top of that object:

```
distance available = runway length + distance past end − takeoff ground roll
time available     = distance available ÷ groundspeed
required climb     = object height ÷ time available
```

If this is above 50 fpm, it becomes the floor, and the accelerate-go card adds a note such as "Required 121 fpm to clear obstacle." The obstacle details themselves are not displayed.

Four decisions shape this calculation.

**No added margin.** The requirement is to reach the top of the object. Part 91 sets no numeric obstacle margin for this aircraft, so none is added. The pilot can add one mentally.

**Only straight-ahead objects count.** Objects more than 500 ft from the extended centerline are ignored, on the basis that a pilot does not turn until clear of obstacles. Without this limit, a power line 2,500 ft to the side could set the floor.

**Distance is taken from the threshold.** The FAA layout guide says the distance is measured from the runway end. The published clearance slopes show otherwise. On displaced-threshold runways, they match a distance from the threshold in 75% of cases and from the physical end in 5%. The app therefore subtracts the displacement. Objects that then fall alongside the runway are ignored, because they are not past it.

**Runway slope is ignored.** An upsloping runway needs slightly more than the figure shown.

**This is not an obstacle survey.** About a third of runway ends carry a usable object. Most lie within 2,000 ft of the runway and most are trees, roads and power lines. Towers further out, general terrain and published departure procedures are not included. No note means no object is listed. It does not mean the departure is clear.

## 10. Worked performance example

Parker County (KWEA), Runway 36, using the default load from Section 2 and an illustrative report: `KNFW 051553Z 34010G20KT 10SM CLR 25/12 A2992`.

The field is 991 ft, the runway is 3,298 ft of pavement with a 0.18% upslope, and the weight is 2601 lb (1180 kg).

**Wind.** The runway's true heading is 000° and the wind is 340° at 10 gusting 20, so the midpoint is 15 kt.

| Component | Value |
|---|---|
| Crosswind, midpoint | 5 kt from the left |
| Headwind on the runway card, midpoint | 14 kt |
| Headwind in distances, steady | 9 kt |

**Takeoff and landing.** The table values at these conditions are shown first. Results are rounded to the metre.

| Step | Takeoff roll | To 50 ft | Landing roll | From 50 ft |
|---|---|---|---|---|
| Table value | 331 | 432 | 228 | 340 |
| Headwind, 9 kt | −22.5 | −22.5 | −45 | −45 |
| Paved | −18.5 | −18.5 | −3.7 | −3.7 |
| Slope, 0.18% | +2.6 | +2.6 | −0.8 | −0.8 |
| **Result (m)** | **292** | **394** | **179** | **291** |

The landing figures use the 2494 lb landing weight.

**Accelerate-stop.** (292 + 179) × 1.30 = **612 m**, which fits the 1,005 m runway.

**Accelerate-go.** The predicted climb rate is 136 fpm. Groundspeed is 84 − 9 = 75 kt, so the climb to 50 ft takes 851 m, and the total is 292 + 851 = **1,143 m**.

**Obstacle.** A tree stands 42 ft high, 313 ft past the end. Distance available is 3,298 + 313 ft, or 1,101 m, less the 292 m ground roll, leaving 809 m. At 75 kt that takes 0.349 minutes, so the required climb is 42 ÷ 0.349 = **121 fpm**.

The floor rises from 50 to 121 fpm. The predicted 136 fpm is above the floor but within 50 fpm of it, so the card shows a caution: *"Predicted single-engine climb rate is 136 fpm. Required 121 fpm to clear obstacle."*

## 11. Data sources and currency

**Weather.** Reports come from the VATSIM METAR API and are held for 15 minutes in the browser. This feed exists for flight simulation and is not an official weather source. Check official weather before flight.

Where an airport has no station, the nearest one is used, and the panel names it. Up to three alternates are offered, because the nearest station is not always the most representative. Only stations that were reporting when the data was built are offered.

**Airports.** `airports.json` is built from the FAA's `APT.txt` and `WXL.txt` files, which change every 28 days. The data is the Oct 29, 2026 cycle. It must be rebuilt by hand, so it goes out of date unless that is done:

```
cd airport
npm run parse
npm run alts
```

After a rebuild, the `CACHE_NAME` in `src/airportDB.js` must be bumped so browsers download the new data. Where the FAA gives no TORA or LDA, the physical runway length is used.

## 12. Known limitations

**Not confirmed against the POH**
- The 6.7 lb/gal fuel density and the 220 kg (485 lb) seat limit were not found in the POH's searchable text. They may be in a form or image.

**Not modelled**
- Wet or contaminated runways, and runway condition generally.
- Published climb gradients, departure procedures and terrain.
- Balked landing performance, cruise and fuel burn.
- Separate landing runway selection.

**Known defects**
- A METAR with missing wind displays as "Calm", and a real calm report displays as "000° / 0 kt".
- Typing a K-prefixed identifier for an airport that has no ICAO code, such as K1C5, returns "Airport not found". Use 1C5.
- After 28 days the airport data is downloaded again, and the lookup fails if the device is offline at that moment, even though a cached copy exists.
- A stalled weather request has no timeout, so the spinner keeps running.
- Clearing the MTOW field flags every condition until a value is entered.
- METAR text and the aircraft note are not escaped on the print sheet.

## 13. Disclaimer

This tool is for planning and reference only. All figures must be verified against the approved Aircraft Flight Manual and POH before flight. The accelerate-stop, accelerate-go and obstacle figures are estimates with no POH basis. The pilot in command is responsible for the safe operation of the aircraft.
