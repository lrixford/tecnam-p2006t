import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { fetchMETAR } from '../src/metar.js';

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

// Stub fetch with a JSON body and record the URLs requested.
function stubFetch(body, { ok = true, status = 200, statusText = 'OK' } = {}) {
  const urls = [];
  globalThis.fetch = async url => {
    urls.push(url);
    return { ok, status, statusText, json: async () => body };
  };
  return urls;
}

// fetchMETAR caches per station for the life of the module, so each test
// uses its own station ID.

test('requests the VATSIM JSON endpoint', async () => {
  const urls = stubFetch([{ id: 'KAAA', metar: '051553Z 18011KT 10SM FEW095 21/12 A2994' }]);
  await fetchMETAR('KAAA');
  assert.deepEqual(urls, ['https://metar.vatsim.net/KAAA?format=json']);
});

test('adds the K prefix to 3-character FAA IDs', async () => {
  const urls = stubFetch([{ id: 'KBBB', metar: '051553Z 18011KT 10SM FEW095 21/12 A2994' }]);
  await fetchMETAR(' bbb ');
  assert.deepEqual(urls, ['https://metar.vatsim.net/KBBB?format=json']);
});

test('parses a report that omits the station, and restores it in raw', async () => {
  stubFetch([{ id: 'KCCC', metar: '051553Z 18011KT 10SM FEW095 21/12 A2994 RMK AO2' }]);
  const m = await fetchMETAR('KCCC');
  assert.equal(m.station, 'KCCC');
  assert.equal(m.raw, 'KCCC 051553Z 18011KT 10SM FEW095 21/12 A2994 RMK AO2');
  assert.equal(m.time_z, '051553Z');
  assert.equal(m.wind_dir_deg, 180);
  assert.equal(m.wind_speed_kt, 11);
  assert.equal(m.oat_c, 21);
  assert.equal(m.altimeter_inhg, 29.94);
});

test('does not double the station if the report already includes it', async () => {
  stubFetch([{ id: 'KDDD', metar: 'KDDD 051553Z 18011KT 10SM CLR 21/12 A2994' }]);
  const m = await fetchMETAR('KDDD');
  assert.equal(m.raw, 'KDDD 051553Z 18011KT 10SM CLR 21/12 A2994');
  assert.equal(m.wind_speed_kt, 11);
});

test('returns null when the station has no report', async () => {
  stubFetch([]);
  assert.equal(await fetchMETAR('KEEE'), null);
});

test('returns null when the report text is empty', async () => {
  stubFetch([{ id: 'KFFF', metar: '' }]);
  assert.equal(await fetchMETAR('KFFF'), null);
});

test('throws on an HTTP error', async () => {
  stubFetch(null, { ok: false, status: 403, statusText: 'Forbidden' });
  await assert.rejects(fetchMETAR('KGGG'), /METAR fetch failed: 403 Forbidden/);
});

test('serves repeat lookups from the cache', async () => {
  const urls = stubFetch([{ id: 'KHHH', metar: '051553Z 18011KT 10SM CLR 21/12 A2994' }]);
  await fetchMETAR('KHHH');
  await fetchMETAR('KHHH');
  assert.equal(urls.length, 1);
});
