import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, save, clear, KEYS } from '../src/persistence.js';

// Node has no localStorage — verifies the in-memory fallback path.

test('save → load round-trips an object', () => {
  const key = 'test.roundtrip.v1';
  clear(key);
  save(key, { weight_lb: 1742, arm_ft: 1.595, note: 'N12345' });
  const got = load(key);
  assert.deepEqual(got, { weight_lb: 1742, arm_ft: 1.595, note: 'N12345' });
  clear(key);
});

test('load returns null for missing key', () => {
  clear('test.nonexistent.v1');
  assert.equal(load('test.nonexistent.v1'), null);
});

test('clear removes value', () => {
  const key = 'test.clear.v1';
  save(key, { x: 1 });
  clear(key);
  assert.equal(load(key), null);
});

test('KEYS.empty is the documented schema-versioned key', () => {
  assert.equal(KEYS.empty, 'tecnam.p2006t.empty.v2');
});
