import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { lookupAirport } from '../src/airportDB.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const realFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = realFetch;
  delete globalThis.window;
  delete globalThis.caches;
  delete globalThis.localStorage;
});

// Stub the browser, then import a fresh module so nothing is held in memory.
let importCount = 0;
async function freshLoader({ cached, ageDays, fetchResult }) {
  const puts = [];
  const store = new Map();
  if (ageDays !== undefined) store.set('airportdb_fetched_at', String(Date.now() - ageDays * DAY_MS));
  globalThis.localStorage = {
    getItem: k => store.get(k) ?? null,
    setItem: (k, v) => store.set(k, v),
  };
  globalThis.caches = {
    delete: async () => true,
    open: async () => ({
      match: async () => (cached ? new Response(JSON.stringify(cached)) : undefined),
      put: async (url, res) => puts.push(url),
    }),
  };
  globalThis.window = globalThis;

  let fetches = 0;
  globalThis.fetch = async () => {
    fetches++;
    if (fetchResult instanceof Error) throw fetchResult;
    return fetchResult;
  };
  const { loadAirports } = await import(`../src/airportDB.js?test=${++importCount}`);
  return { loadAirports, puts, store, fetchCount: () => fetches };
}

const OLD = { KAAA: { id: 'KAAA', name: 'Cached' } };
const NEW = { KAAA: { id: 'KAAA', name: 'Fresh' } };
const okResponse = () => new Response(JSON.stringify(NEW));

test('fresh cache is used without a download', async () => {
  const t = await freshLoader({ cached: OLD, ageDays: 1, fetchResult: okResponse() });
  assert.deepEqual(await t.loadAirports(), OLD);
  assert.equal(t.fetchCount(), 0);
});

test('stale cache is replaced when the download works', async () => {
  const t = await freshLoader({ cached: OLD, ageDays: 29, fetchResult: okResponse() });
  assert.deepEqual(await t.loadAirports(), NEW);
  assert.equal(t.puts.length, 1);
});

test('offline with a stale cache uses the cached copy and retries next time', async () => {
  const t = await freshLoader({ cached: OLD, ageDays: 29, fetchResult: new TypeError('Failed to fetch') });
  const before = t.store.get('airportdb_fetched_at');
  assert.deepEqual(await t.loadAirports(), OLD);
  assert.equal(t.store.get('airportdb_fetched_at'), before);
});

test('a server error with a stale cache uses the cached copy', async () => {
  const t = await freshLoader({ cached: OLD, ageDays: 29, fetchResult: new Response('', { status: 503 }) });
  assert.deepEqual(await t.loadAirports(), OLD);
});

test('offline with no cached copy reports the failure', async () => {
  const t = await freshLoader({ fetchResult: new TypeError('Failed to fetch') });
  await assert.rejects(t.loadAirports(), /Failed to fetch/);
});

const db = {
  KMCI:  { id: 'KMCI', faa_id: 'MCI' },
  '1C5': { id: '1C5',  faa_id: '1C5' },
  PAJN:  { id: 'PAJN', faa_id: 'JNU' },
};

test('finds an airport by ICAO or FAA identifier', () => {
  assert.equal(lookupAirport(db, 'kmci').id, 'KMCI');
  assert.equal(lookupAirport(db, 'MCI').id, 'KMCI');
  assert.equal(lookupAirport(db, ' 1c5 ').id, '1C5');
});

test('accepts a K prefix on an airport with no ICAO code', () => {
  assert.equal(lookupAirport(db, 'K1C5').id, '1C5');
  assert.equal(lookupAirport(db, 'k1c5').id, '1C5');
});

test('accepts a K prefix on a non-K ICAO airport', () => {
  assert.equal(lookupAirport(db, 'KJNU').id, 'PAJN');
});

test('an unknown identifier is not found', () => {
  assert.equal(lookupAirport(db, 'KZZZ'), null);
  assert.equal(lookupAirport(db, 'ZZZ'), null);
  assert.equal(lookupAirport(db, 'K'), null);
});
