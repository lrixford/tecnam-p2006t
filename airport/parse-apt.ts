#!/usr/bin/env node
/**
 * parse-apt.ts
 *
 * Parses the FAA APT.txt fixed-width database and emits a compact JSON file
 * containing only the fields needed for takeoff/landing performance calculations:
 *   - Airport: ICAO/FAA ID, name, city, state, elevation
 *   - Runway: surface type, length, each end's TORA, LDA, heading, gradient
 *
 * Usage:
 *   npx ts-node parse-apt.ts [path/to/APT.txt] [output.json]
 *
 * Defaults:
 *   input  = ./APT.txt
 *   output = ./airports.json
 *
 * Reference: apt_rf.txt (fixed-width column layout, 1-based column numbers)
 */

import * as fs   from 'fs';
import * as path from 'path';
import * as readline from 'readline';

// ---------------------------------------------------------------------------
// Field slices — all 0-based, [start, end) exclusive
// ---------------------------------------------------------------------------

const APT_F = {
  recType:  [0,   3],    // "APT"
  siteNo:   [3,  14],    // unique site identifier
  facType:  [14, 27],    // "AIRPORT", "HELIPORT", etc.
  locId:    [27, 31],    // FAA location identifier (e.g. "KORD", "1C5 ")
  state:    [48, 50],    // 2-letter state/territory code
  city:     [93, 133],   // associated city name
  name:     [133, 183],  // official facility name
  use:      [185, 187],  // "PU" public / "PR" private
  elev:     [578, 585],  // elevation, nearest tenth of a foot MSL (right-justified)
  latSec:   [538, 550],  // latitude in total arc-seconds + N/S  e.g. "120403.200N"
  lonSec:   [565, 577],  // longitude in total arc-seconds + E/W  e.g. "397762.300W"
  magVar:   [586, 589],  // magnetic variation to nearest degree  e.g. "03W"
  status:   [840, 842],  // "O" operational / "CI" / "CP"
  icaoId:   [1210, 1217],// ICAO identifier (e.g. "KORD   ")
} as const;

const RWY_F = {
  recType:  [0,   3],    // "RWY"
  siteNo:   [3,  14],
  rwyId:    [16, 23],    // e.g. "01/19  ", "N/S    ", "18L/36R"
  length:   [23, 28],    // physical length, feet (right-justified)
  width:    [28, 32],    // physical width, feet
  surface:  [32, 44],    // e.g. "ASPH-G      ", "TURF        ", "CONC-ASPH   "

  // Base end (lower-numbered / lexically first)
  baseId:       [70, 73],    // e.g. "01 ", "18L", "N  "
  baseTrueHdg:  [73, 76],    // true heading, degrees (e.g. "184")

  // Base end geographic data
  baseElev:     [147, 154],  // elevation MSL at physical runway end (feet, e.g. "  19.5")

  // Base end additional data
  // NOTE: E40 gradient fields are defined in spec but not populated in current FAA APT.txt.
  baseTORA:     [703, 708],  // takeoff run available, feet
  baseLDA:      [718, 723],  // landing distance available, feet

  // Controlling object off this end, as seen on approach
  baseDisplaced: [222, 226],  // displaced threshold, feet from the runway end
  baseObjHeight: [275, 280],  // feet above the runway end
  baseObjDist:   [280, 285],  // feet from the threshold, despite what apt_rf.txt says
  baseObjOffset: [285, 292],  // feet off centerline, e.g. "50R"

  // Reciprocal end
  recipId:      [292, 295],  // e.g. "19 ", "36R", "S  "
  recipTrueHdg: [295, 298],  // true heading

  // Reciprocal end geographic data
  recipElev:    [369, 376],  // elevation MSL at physical runway end (feet)

  // Reciprocal end additional data
  recipTORA:    [994, 999],
  recipLDA:     [1009, 1014],

  recipDisplaced: [444, 448],
  recipObjHeight: [497, 502],
  recipObjDist:   [502, 507],
  recipObjOffset: [507, 514],
} as const;

// Objects further off centerline than this aren't straight ahead.
const MAX_OBSTACLE_OFFSET_FT = 500;

// A valid runway end ID, e.g. "01", "18L", "N", "NE". Used to catch column shifts.
const RWY_END_ID = /^(\d{1,2}[LRCW]?|[NSEW]{1,3})$/;
const MAX_BAD_END_ID_RATIO = 0.05;

// ---------------------------------------------------------------------------
// Surface classification
// ---------------------------------------------------------------------------

type SurfaceClass = 'paved' | 'turf' | 'gravel' | 'dirt' | 'water' | 'other';

function classifySurface(raw: string): SurfaceClass {
  const s = raw.trim().toUpperCase();
  if (/\bCONC\b/.test(s) || /\bASPH\b/.test(s)) return 'paved';
  if (/\bTURF\b/.test(s) || /\bGRASS\b/.test(s) || /\bSOD\b/.test(s)) return 'turf';
  if (/\bGRAVEL\b/.test(s) || /\bGRVL\b/.test(s) || /\bCINDER\b/.test(s) || /\bCORAL\b/.test(s)) return 'gravel';
  if (/\bDIRT\b/.test(s) || /\bSOIL\b/.test(s)) return 'dirt';
  if (/\bWATER\b/.test(s)) return 'water';
  return 'other';
}

// ---------------------------------------------------------------------------
// Runway heading helpers
// ---------------------------------------------------------------------------

const CARDINAL_HDGS: Record<string, number> = {
  N: 360, NNE: 23, NE: 45, ENE: 68,
  E: 90,  ESE: 113, SE: 135, SSE: 158,
  S: 180, SSW: 203, SW: 225, WSW: 248,
  W: 270, WNW: 293, NW: 315, NNW: 338,
};

/** Convert runway end designation to magnetic heading in degrees.
 *  Handles numeric (e.g. "18", "36R") and cardinal (e.g. "N", "SW"). */
function rwyEndToMag(endId: string): number | null {
  const s = endId.trim().replace(/[LRC]$/, '');  // strip L/R/C suffix
  if (/^\d+$/.test(s)) {
    const n = parseInt(s, 10);
    return n === 0 ? 360 : n * 10;
  }
  return CARDINAL_HDGS[s.toUpperCase()] ?? null;
}

/** Degrees, east positive. */
function parseMagVar(raw: string): number | null {
  const m = raw.trim().match(/^(\d{1,2})([EW])$/);
  if (!m) return null;
  return m[2] === 'E' ? parseInt(m[1], 10) : -parseInt(m[1], 10);
}

function fillTrueHeadings(apt: Airport, magVar: number): number {
  let filled = 0;
  for (const rwy of apt.runways) {
    for (const end of Object.values(rwy.ends)) {
      if (end.hdg_true !== null || end.hdg_mag === null) continue;
      end.hdg_true = (end.hdg_mag + magVar + 360) % 360;
      filled++;
    }
  }
  return filled;
}

// ---------------------------------------------------------------------------
// Parse helpers
// ---------------------------------------------------------------------------

function field(line: string, [start, end]: readonly [number, number]): string {
  return line.slice(start, end);
}

function numField(line: string, slice: readonly [number, number]): number | null {
  const s = field(line, slice).trim();
  if (!s) return null;
  const n = parseFloat(s);
  return isFinite(n) ? n : null;
}

function intField(line: string, slice: readonly [number, number]): number | null {
  const s = field(line, slice).trim();
  if (!s) return null;
  const n = parseInt(s, 10);
  return isFinite(n) ? n : null;
}

function obstacleField(
  line: string,
  height: readonly [number, number],
  dist: readonly [number, number],
  offset: readonly [number, number],
  displaced: readonly [number, number],
): Obstacle | null {
  const height_ft = intField(line, height);
  const fromThreshold_ft = intField(line, dist);
  if (height_ft === null || fromThreshold_ft === null) return null;
  if ((intField(line, offset) ?? 0) > MAX_OBSTACLE_OFFSET_FT) return null;
  const dist_ft = fromThreshold_ft - (intField(line, displaced) ?? 0);
  if (dist_ft < 0) return null;   // alongside the runway, not past it
  return { height_ft, dist_ft };
}

// ---------------------------------------------------------------------------
// Output types
// ---------------------------------------------------------------------------

interface Obstacle {
  height_ft: number;   // above the far runway end
  dist_ft:   number;   // past the far runway end
}

interface RunwayEnd {
  hdg_mag:      number | null;   // magnetic heading (degrees)
  hdg_true:     number | null;   // true heading from APT file, else hdg_mag + variation
  elev_ft:      number | null;   // threshold elevation MSL (feet)
  tora_ft:      number | null;   // takeoff run available, feet
  lda_ft:       number | null;   // landing distance available, feet
  // Slope computed from end elevations and physical length.
  // Positive = upslope in the takeoff/departure direction from this end.
  // null if either end elevation or length is missing.
  slope_pct:    number | null;
  obstacle:     Obstacle | null; // straight ahead when departing this end
}

interface Runway {
  id:       string;              // e.g. "18/36", "N/S"
  surface:  SurfaceClass;
  paved:    boolean;
  length_ft: number | null;
  width_ft:  number | null;
  ends: Record<string, RunwayEnd>;  // keyed by end ID (e.g. "18", "36", "N", "S")
}

interface Airport {
  id:       string;              // ICAO if available, else FAA
  faa_id:   string;
  icao_id:  string | null;
  name:     string;
  city:     string;
  state:    string;
  elev_ft:  number | null;
  metar_id: string | null;       // nearest METAR station from WXL cross-reference
  runways:  Runway[];
}

// ---------------------------------------------------------------------------
// WXL weather location helpers
// ---------------------------------------------------------------------------

interface MetarStation {
  id:  string;
  lat: number;
  lon: number;
}

// WXL lat format: DDMMSSTN (8 chars) — degrees, minutes, seconds, tenths, N/S
function parseWxlLat(s: string): number | null {
  if (s.length < 8) return null;
  const deg = parseInt(s.slice(0, 2), 10);
  const min = parseInt(s.slice(2, 4), 10);
  const sec = parseInt(s.slice(4, 6), 10) + parseInt(s.slice(6, 7), 10) / 10;
  const hemi = s[7].toUpperCase();
  if (!isFinite(deg + min + sec)) return null;
  const val = deg + min / 60 + sec / 3600;
  return hemi === 'S' ? -val : val;
}

// WXL lon format: DDDMMSSTC (9 chars) — degrees, minutes, seconds, tenths, E/W
function parseWxlLon(s: string): number | null {
  if (s.length < 9) return null;
  const deg = parseInt(s.slice(0, 3), 10);
  const min = parseInt(s.slice(3, 5), 10);
  const sec = parseInt(s.slice(5, 7), 10) + parseInt(s.slice(7, 8), 10) / 10;
  const hemi = s[8].toUpperCase();
  if (!isFinite(deg + min + sec)) return null;
  const val = deg + min / 60 + sec / 3600;
  return hemi === 'W' ? -val : val;
}

// APT lat/lon: total arc-seconds with decimal + hemisphere char  e.g. "120403.200N"
function parseAptCoord(raw: string): number | null {
  const s = raw.trim();
  if (!s || s.length < 2) return null;
  const hemi = s[s.length - 1].toUpperCase();
  const val  = parseFloat(s.slice(0, -1));
  if (!isFinite(val)) return null;
  const deg = val / 3600;
  return (hemi === 'S' || hemi === 'W') ? -deg : deg;
}

// Haversine `a` term — proportional to arc distance; no sqrt needed for comparison.
function haversineSq(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = Math.PI / 180;
  const dLat  = (lat2 - lat1) * toRad;
  const dLon  = (lon2 - lon1) * toRad;
  return Math.sin(dLat / 2) ** 2
       + Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLon / 2) ** 2;
}

async function loadMetarStations(wxlPath: string): Promise<MetarStation[]> {
  const stations: MetarStation[] = [];
  const rl = readline.createInterface({
    input: fs.createReadStream(wxlPath, { encoding: 'latin1' }),
    crlfDelay: Infinity,
  });
  for await (const line of rl) {
    if (!line || line[0] === '*') continue;       // skip continuation records
    // Include SA (Surface Observation) as well as METAR — both served by aviationweather.gov
    const svc = line.slice(73, 133);
    if (!svc.includes('METAR') && !svc.includes('SA')) continue;
    const id  = line.slice(0, 5).trim();
    const lat = parseWxlLat(line.slice(5, 13));
    const lon = parseWxlLon(line.slice(13, 22));
    if (!id || lat === null || lon === null) continue;
    // 3-char FAA IDs need K prefix for aviationweather.gov API (US domestic convention)
    const apiId = id.length === 3 ? `K${id}` : id;
    stations.push({ id: apiId, lat, lon });
  }
  return stations;
}

function nearestMetar(lat: number, lon: number, stations: MetarStation[]): string | null {
  let best: MetarStation | null = null;
  let bestDist = Infinity;
  for (const s of stations) {
    const d = haversineSq(lat, lon, s.lat, s.lon);
    if (d < bestDist) { bestDist = d; best = s; }
  }
  return best?.id ?? null;
}

// ---------------------------------------------------------------------------
// Main parser
// ---------------------------------------------------------------------------

async function parseAPT(inputPath: string, outputPath: string, wxlPath: string): Promise<void> {
  const metarStations = await loadMetarStations(wxlPath);
  console.log(`METAR stations: ${metarStations.length.toLocaleString()}`);

  const airports   = new Map<string, Airport>();   // keyed by site number
  const aptCoords  = new Map<string, { lat: number; lon: number }>();
  const magVars    = new Map<string, number>();    // keyed by site number
  let currentSiteNo = '';

  const rl = readline.createInterface({
    input: fs.createReadStream(inputPath, { encoding: 'latin1' }),
    crlfDelay: Infinity,
  });

  let lineCount = 0;
  let aptCount  = 0;
  let rwyCount  = 0;
  let badEndIds = 0;

  for await (const line of rl) {
    lineCount++;
    const recType = line.slice(0, 3);

    if (recType === 'APT') {
      // Only keep AIRPORT type, operational, not water-based
      const facType = field(line, APT_F.facType).trim();
      const status  = field(line, APT_F.status).trim();
      if (facType !== 'AIRPORT' || status !== 'O') continue;

      const siteNo  = field(line, APT_F.siteNo).trim();
      const faaId   = field(line, APT_F.locId).trim();
      const icaoRaw = field(line, APT_F.icaoId).trim();
      const icaoId  = icaoRaw || null;
      const id      = icaoId ?? faaId;

      currentSiteNo = siteNo;

      airports.set(siteNo, {
        id,
        faa_id:   faaId,
        icao_id:  icaoId,
        name:     field(line, APT_F.name).trim(),
        city:     field(line, APT_F.city).trim(),
        state:    field(line, APT_F.state).trim(),
        elev_ft:  numField(line, APT_F.elev),
        metar_id: null,
        runways:  [],
      });

      const lat = parseAptCoord(field(line, APT_F.latSec));
      const lon = parseAptCoord(field(line, APT_F.lonSec));
      if (lat !== null && lon !== null) aptCoords.set(siteNo, { lat, lon });

      const magVar = parseMagVar(field(line, APT_F.magVar));
      if (magVar !== null) magVars.set(siteNo, magVar);

      aptCount++;

    } else if (recType === 'RWY') {
      const siteNo = field(line, RWY_F.siteNo).trim();
      const apt = airports.get(siteNo);
      if (!apt) continue;  // parent APT was filtered out

      const surfaceRaw = field(line, RWY_F.surface);
      const surface    = classifySurface(surfaceRaw);
      if (surface === 'water' || surface === 'other') continue;

      const baseIdRaw  = field(line, RWY_F.baseId).trim();
      const recipIdRaw = field(line, RWY_F.recipId).trim();
      if (!RWY_END_ID.test(baseIdRaw)) badEndIds++;

      const length    = intField(line, RWY_F.length);
      const baseElev  = numField(line, RWY_F.baseElev);
      const recipElev = numField(line, RWY_F.recipElev);

      // Slope from base→recip as a percentage of physical length.
      // Positive means the runway rises in that direction.
      let baseSlope: number | null = null;
      if (baseElev !== null && recipElev !== null && length) {
        baseSlope = +((recipElev - baseElev) / length * 100).toFixed(2);
      }

      const baseEnd: RunwayEnd = {
        hdg_mag:   rwyEndToMag(baseIdRaw),
        hdg_true:  intField(line, RWY_F.baseTrueHdg),
        elev_ft:   baseElev,
        tora_ft:   intField(line, RWY_F.baseTORA),
        lda_ft:    intField(line, RWY_F.baseLDA),
        slope_pct: baseSlope,               // positive = upslope departing this end
        obstacle:  obstacleField(line, RWY_F.recipObjHeight, RWY_F.recipObjDist, RWY_F.recipObjOffset, RWY_F.recipDisplaced),
      };

      const recipEnd: RunwayEnd | null = recipIdRaw ? {
        hdg_mag:   rwyEndToMag(recipIdRaw),
        hdg_true:  intField(line, RWY_F.recipTrueHdg),
        elev_ft:   recipElev,
        tora_ft:   intField(line, RWY_F.recipTORA),
        lda_ft:    intField(line, RWY_F.recipLDA),
        slope_pct: baseSlope !== null ? -baseSlope : null,  // opposite sign
        obstacle:  obstacleField(line, RWY_F.baseObjHeight, RWY_F.baseObjDist, RWY_F.baseObjOffset, RWY_F.baseDisplaced),
      } : null;

      const ends: Record<string, RunwayEnd> = {};
      if (baseIdRaw)  ends[baseIdRaw]  = baseEnd;
      if (recipIdRaw) ends[recipIdRaw] = recipEnd!;

      apt.runways.push({
        id:        field(line, RWY_F.rwyId).trim(),
        surface,
        paved:     surface === 'paved',
        length_ft: length,
        width_ft:  intField(line, RWY_F.width),
        ends,
      });
      rwyCount++;
    }
  }

  // Stop before writing anything if the FAA layout has moved the runway columns.
  if (badEndIds > rwyCount * MAX_BAD_END_ID_RATIO) {
    throw new Error(`${badEndIds} of ${rwyCount} runway end IDs look wrong; `
      + `check RWY_F against the current apt_rf.txt. Nothing was written.`);
  }

  // Assign nearest METAR station to each airport
  for (const [siteNo, apt] of airports) {
    const coords = aptCoords.get(siteNo);
    if (coords) apt.metar_id = nearestMetar(coords.lat, coords.lon, metarStations);
  }

  // METAR winds are true. Airports with no variation use the nearest airport's.
  const varSources = [...magVars].flatMap(([siteNo, magVar]) => {
    const coords = aptCoords.get(siteNo);
    return coords ? [{ ...coords, magVar }] : [];
  });
  let trueHdgsFilled = 0;
  let varsBorrowed   = 0;
  for (const [siteNo, apt] of airports) {
    let magVar = magVars.get(siteNo) ?? null;
    const coords = aptCoords.get(siteNo);
    if (magVar === null && coords) {
      let bestDist = Infinity;
      for (const s of varSources) {
        const d = haversineSq(coords.lat, coords.lon, s.lat, s.lon);
        if (d < bestDist) { bestDist = d; magVar = s.magVar; }
      }
      varsBorrowed++;
    }
    if (magVar !== null) trueHdgsFilled += fillTrueHeadings(apt, magVar);
  }

  // Build output — keyed by preferred identifier (ICAO if present, else FAA)
  const output: Record<string, Airport> = {};
  for (const apt of airports.values()) {
    if (apt.runways.length === 0) continue;
    output[apt.id] = apt;
  }

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 0), 'utf8');

  console.log(`Lines read:   ${lineCount.toLocaleString()}`);
  console.log(`Airports:     ${aptCount.toLocaleString()}`);
  console.log(`Runways:      ${rwyCount.toLocaleString()} (${badEndIds} unusual end IDs)`);
  console.log(`True hdgs:    ${trueHdgsFilled.toLocaleString()} filled from variation (${varsBorrowed} airports used a neighbour's)`);
  console.log(`Output keys:  ${Object.keys(output).length.toLocaleString()}`);
  console.log(`Output file:  ${outputPath}`);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

const [,, inputArg, outputArg, wxlArg] = process.argv;
const inputPath  = inputArg  ?? path.join(__dirname, 'APT.txt');
const outputPath = outputArg ?? path.join(__dirname, 'airports.json');
const wxlPath    = wxlArg    ?? path.join(__dirname, '../docs/airport/WXL.txt');

parseAPT(inputPath, outputPath, wxlPath).catch((err) => {
  console.error(err);
  process.exit(1);
});
