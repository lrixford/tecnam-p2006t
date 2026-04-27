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
  baseId:       [65, 68],    // e.g. "01 ", "18L", "N  "
  baseTrueHdg:  [68, 71],    // true heading, degrees (e.g. "184")

  // Base end geographic data
  baseElev:     [142, 149],  // elevation MSL at physical runway end (feet, e.g. "  19.5")

  // Base end additional data
  // NOTE: E40 gradient fields are defined in spec but not populated in current FAA APT.txt.
  baseTORA:     [698, 703],  // takeoff run available, feet
  baseLDA:      [713, 718],  // landing distance available, feet

  // Reciprocal end
  recipId:      [287, 290],  // e.g. "19 ", "36R", "S  "
  recipTrueHdg: [290, 293],  // true heading

  // Reciprocal end geographic data
  recipElev:    [364, 371],  // elevation MSL at physical runway end (feet)

  // Reciprocal end additional data
  recipTORA:    [989, 994],
  recipLDA:     [1004, 1009],
} as const;

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

// ---------------------------------------------------------------------------
// Output types
// ---------------------------------------------------------------------------

interface RunwayEnd {
  hdg_mag:      number | null;   // magnetic heading (degrees)
  hdg_true:     number | null;   // true heading from APT file
  elev_ft:      number | null;   // threshold elevation MSL (feet)
  tora_ft:      number | null;   // takeoff run available, feet
  lda_ft:       number | null;   // landing distance available, feet
  // Slope computed from end elevations and physical length.
  // Positive = upslope in the takeoff/departure direction from this end.
  // null if either end elevation or length is missing.
  slope_pct:    number | null;
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
  let currentSiteNo = '';

  const rl = readline.createInterface({
    input: fs.createReadStream(inputPath, { encoding: 'latin1' }),
    crlfDelay: Infinity,
  });

  let lineCount = 0;
  let aptCount  = 0;
  let rwyCount  = 0;

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
      };

      const recipEnd: RunwayEnd | null = recipIdRaw ? {
        hdg_mag:   rwyEndToMag(recipIdRaw),
        hdg_true:  intField(line, RWY_F.recipTrueHdg),
        elev_ft:   recipElev,
        tora_ft:   intField(line, RWY_F.recipTORA),
        lda_ft:    intField(line, RWY_F.recipLDA),
        slope_pct: baseSlope !== null ? -baseSlope : null,  // opposite sign
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

  // Assign nearest METAR station to each airport
  for (const [siteNo, apt] of airports) {
    const coords = aptCoords.get(siteNo);
    if (coords) apt.metar_id = nearestMetar(coords.lat, coords.lon, metarStations);
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
  console.log(`Runways:      ${rwyCount.toLocaleString()}`);
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
