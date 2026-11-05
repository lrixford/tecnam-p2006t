import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { componentWind_kt, fetchMETAR, parseMETAR } from '../src/metar.js';

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

test('parses the wind when the station ID contains digits', () => {
  const m = parseMETAR('K04V 051553Z AUTO 18011KT 10SM CLR 21/12 A2994');
  assert.equal(m.station, 'K04V');
  assert.equal(m.time_z, '051553Z');
  assert.equal(m.wind_dir_deg, 180);
  assert.equal(m.wind_speed_kt, 11);
});

test('keeps the temperature and altimeter when the dew point is missing', () => {
  for (const group of ['34/', '34///']) {
    const m = parseMETAR(`KAAA 051553Z 18010KT 10SM CLR ${group} A2992`);
    assert.equal(m.oat_c, 34);
    assert.equal(m.dp_c, null);
    assert.equal(m.altimeter_inhg, 29.92);
  }
});

test('reads past sky groups the station could not fully report', () => {
  for (const sky of ['BKN020 OVC///', 'BKN020///', '///020 BKN030']) {
    const m = parseMETAR(`KAAA 051553Z AUTO 18010KT 10SM ${sky} M05/M10 A3010`);
    assert.equal(m.oat_c, -5);
    assert.equal(m.dp_c, -10);
    assert.equal(m.altimeter_inhg, 30.1);
  }
});

test('reports a missing temperature or altimeter as null', () => {
  const noAltimeter = parseMETAR('KAAA 051553Z 18010KT 10SM CLR 34/20 A////');
  assert.equal(noAltimeter.oat_c, 34);
  assert.equal(noAltimeter.altimeter_inhg, null);

  const noTemp = parseMETAR('KAAA 051553Z 18010KT 10SM CLR ///// A2992');
  assert.equal(noTemp.oat_c, null);
  assert.equal(noTemp.altimeter_inhg, 29.92);
});

test('does not read remarks as weather', () => {
  const m = parseMETAR('KAAA 051553Z 18010KT 10SM CLR A2992 RMK 34/20 A3000');
  assert.equal(m.oat_c, null);
  assert.equal(m.altimeter_inhg, 29.92);
  assert.equal(m.remarks, '34/20 A3000');
});

test('parses sky layers with heights and cloud types', () => {
  const m = parseMETAR('KAAA 051553Z 18010KT 10SM FEW020 BKN030CB OVC/// 21/12 A2994');
  assert.deepEqual(m.sky, [
    { coverage: 'FEW', alt_ft: 2000, cb: false },
    { coverage: 'BKN', alt_ft: 3000, cb: true },
    { coverage: 'OVC', alt_ft: null, cb: false },
  ]);
});

test('component wind is the midpoint of steady and gust', () => {
  assert.equal(componentWind_kt(parseMETAR('KAAA 051553Z 18015G25KT 10SM CLR 21/12 A2994')), 20);
  assert.equal(componentWind_kt(parseMETAR('KAAA 051553Z 18015KT 10SM CLR 21/12 A2994')), 15);
  assert.equal(componentWind_kt(parseMETAR('KAAA 051553Z /////KT 10SM CLR 21/12 A2994')), null);
});

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
