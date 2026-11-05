#!/usr/bin/env node
/**
 * add-metar-alts.mjs
 *
 * Adds weather station alternates to an existing airports.json. Runway data and
 * all other airport fields are left untouched.
 *   metar_nm   — distance from the airport to its metar_id station, nautical miles
 *   metar_alts — the nearest other stations: [{ id, nm }], closest first
 * Also corrects metar_id where it holds a K-prefixed ID that is not a real station.
 *
 * Only stations with a current report on metar.vatsim.net are offered, so
 * re-running at a different time can give a slightly different list.
 *
 * Usage:
 *   node add-metar-alts.mjs path/to/APT.txt path/to/WXL.txt path/to/airports.json
 *
 * APT.txt and WXL.txt are the legacy TXT files in the FAA NASR 28-day subscription:
 *   https://www.faa.gov/air_traffic/flight_info/aeronav/aero_data/NASR_Subscription/
 */

import fs from 'node:fs';
import readline from 'node:readline';

const ALT_COUNT       = 3;
const EARTH_RADIUS_NM = 3440.065;
const BATCH_SIZE      = 100;

function lines(file) {
  return readline.createInterface({
    input: fs.createReadStream(file, { encoding: 'latin1' }),
    crlfDelay: Infinity,
  });
}

// APT coordinates: total arc-seconds plus hemisphere, e.g. "120403.200N"
function parseAptCoord(raw) {
  const s = raw.trim();
  const val = parseFloat(s.slice(0, -1));
  if (!isFinite(val)) return null;
  return /[SW]$/i.test(s) ? -val / 3600 : val / 3600;
}

// WXL coordinates: DDMMSSTH (lat) or DDDMMSSTH (lon), T = tenths of a second
function parseWxlCoord(raw, degDigits) {
  const deg = parseInt(raw.slice(0, degDigits), 10);
  const min = parseInt(raw.slice(degDigits, degDigits + 2), 10);
  const sec = parseInt(raw.slice(degDigits + 2, degDigits + 4), 10)
            + parseInt(raw.slice(degDigits + 4, degDigits + 5), 10) / 10;
  if (!isFinite(deg + min + sec)) return null;
  const val = deg + min / 60 + sec / 3600;
  return /[SW]/i.test(raw[degDigits + 5]) ? -val : val;
}

function distanceNm(a, b) {
  const rad  = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2
          + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_NM * Math.asin(Math.sqrt(h));
}

async function loadAirportCoords(aptPath) {
  const coords = new Map();   // FAA location ID → { lat, lon }
  for await (const line of lines(aptPath)) {
    if (!line.startsWith('APT')) continue;
    const lat = parseAptCoord(line.slice(538, 550));
    const lon = parseAptCoord(line.slice(565, 577));
    if (lat !== null && lon !== null) coords.set(line.slice(27, 31).trim(), { lat, lon });
  }
  return coords;
}

// WXL uses 3-letter FAA IDs. Most become ICAO with a K prefix, but Alaska, Hawaii
// and others do not (JNU is PAJN), so prefer the airport's own ICAO ID.
// `renamed` maps the K-prefixed form to the real ID for those stations.
async function loadStations(wxlPath, icaoByFaa) {
  const stations = new Map();   // station ID → { id, lat, lon }
  const renamed  = new Map();
  for await (const line of lines(wxlPath)) {
    if (!line || line[0] === '*') continue;
    const services = line.slice(73, 133);
    if (!services.includes('METAR') && !services.includes('SA')) continue;
    const raw = line.slice(0, 5).trim();
    const lat = parseWxlCoord(line.slice(5, 13), 2);
    const lon = parseWxlCoord(line.slice(13, 22), 3);
    if (!raw || lat === null || lon === null) continue;
    const kId = raw.length === 3 ? `K${raw}` : raw;
    const id  = raw.length === 3 ? (icaoByFaa.get(raw) ?? kId) : raw;
    if (id !== kId) renamed.set(kId, id);
    stations.set(id, { id, lat, lon });
  }
  return { stations, renamed };
}

async function loadReportingIds(ids) {
  const reporting = new Set();
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE).join(',');
    const res = await fetch(`https://metar.vatsim.net/${batch}?format=json`);
    if (!res.ok) throw new Error(`METAR check failed: ${res.status} ${res.statusText}`);
    for (const { id, metar } of await res.json()) if (metar) reporting.add(id);
  }
  return reporting;
}

const [aptPath, wxlPath, dbPath] = process.argv.slice(2);
if (!dbPath) {
  console.error('Usage: node add-metar-alts.mjs APT.txt WXL.txt airports.json');
  process.exit(1);
}

const db       = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const coords   = await loadAirportCoords(aptPath);
const icaoByFaa = new Map(Object.values(db).filter(a => a.icao_id).map(a => [a.faa_id, a.icao_id]));
const { stations, renamed } = await loadStations(wxlPath, icaoByFaa);
const reporting = await loadReportingIds([...stations.keys()]);
if (reporting.size < stations.size / 2) {
  throw new Error(`Only ${reporting.size} of ${stations.size} stations reporting; not writing`);
}
const candidates = [...stations.values()].filter(s => reporting.has(s.id));

let withAlts = 0, corrected = 0;
for (const apt of Object.values(db)) {
  if (renamed.has(apt.metar_id)) { apt.metar_id = renamed.get(apt.metar_id); corrected++; }
  const here = coords.get(apt.faa_id);
  const primary = stations.get(apt.metar_id);
  apt.metar_nm   = here && primary ? Math.round(distanceNm(here, primary)) : null;
  apt.metar_alts = !here ? [] : candidates
    .filter(s => s.id !== apt.metar_id)
    .map(s => ({ id: s.id, nm: distanceNm(here, s) }))
    .sort((a, b) => a.nm - b.nm)
    .slice(0, ALT_COUNT)
    .map(s => ({ id: s.id, nm: Math.round(s.nm) }));
  if (apt.metar_alts.length) withAlts++;
}

fs.writeFileSync(dbPath, JSON.stringify(db), 'utf8');
console.log(`Stations:  ${stations.size} (${reporting.size} reporting)`);
console.log(`Airports:  ${Object.keys(db).length} (${withAlts} with alternates, ${corrected} metar_id corrected)`);
