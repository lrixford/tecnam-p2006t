// Airport database loader with 28-day browser cache.
// airports.json is ~6 MB so we use the Cache API rather than localStorage.

const AIRPORTS_URL  = './airport/airports.json';
const CACHE_NAME    = 'airportdb-v1';
const META_KEY      = 'airportdb_fetched_at';
const TTL_MS        = 28 * 24 * 60 * 60 * 1000;

let _db = null;

export async function loadAirports() {
  if (_db) return _db;

  const fetchedAt = localStorage.getItem(META_KEY);
  const stale     = !fetchedAt || (Date.now() - Number(fetchedAt)) > TTL_MS;

  if ('caches' in window) {
    const cache = await caches.open(CACHE_NAME);
    if (!stale) {
      const hit = await cache.match(AIRPORTS_URL);
      if (hit) {
        _db = await hit.json();
        return _db;
      }
    }
    const res = await fetch(AIRPORTS_URL);
    if (!res.ok) throw new Error(`Failed to load airports: ${res.status}`);
    await cache.put(AIRPORTS_URL, res.clone());
    localStorage.setItem(META_KEY, String(Date.now()));
    _db = await res.json();
  } else {
    const res = await fetch(AIRPORTS_URL);
    if (!res.ok) throw new Error(`Failed to load airports: ${res.status}`);
    _db = await res.json();
  }

  return _db;
}

// Look up airport by ICAO or FAA ID (case-insensitive).
export function lookupAirport(db, id) {
  const key = id.trim().toUpperCase();
  if (db[key]) return db[key];
  for (const apt of Object.values(db)) {
    if (apt.faa_id === key) return apt;
  }
  return null;
}
