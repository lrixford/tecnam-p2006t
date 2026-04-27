import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  lbToKg, kgToLb, galToL, lToGal, ftToM, mToFt,
  formatNumber, parseNumber,
} from '../src/units.js';

const close = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;

test('lb ↔ kg round-trip', () => {
  for (const lb of [0, 1, 100, 176, 2712, 12345.67]) {
    assert.ok(close(kgToLb(lbToKg(lb)), lb), `lb=${lb}`);
  }
});

test('gal ↔ L round-trip', () => {
  for (const gal of [0, 1, 26.42, 51.35, 100]) {
    assert.ok(close(lToGal(galToL(gal)), gal), `gal=${gal}`);
  }
});

test('ft ↔ m round-trip', () => {
  for (const ft of [0, 1, 1.595, 5.533, 100]) {
    assert.ok(close(mToFt(ftToM(ft)), ft), `ft=${ft}`);
  }
});

test('known conversion: 176 lb ≈ 79.83 kg', () => {
  assert.ok(close(lbToKg(176), 79.8321915, 1e-4));
});

test('known conversion: 1.595 ft ≈ 0.4862 m', () => {
  assert.ok(close(ftToM(1.595), 0.4862, 1e-3));
});

test('known conversion: 26.42 gal ≈ 100 L', () => {
  assert.ok(close(galToL(26.42), 100.011, 0.05));
});

test('formatNumber handles blanks', () => {
  assert.equal(formatNumber(null), '');
  assert.equal(formatNumber(undefined), '');
  assert.equal(formatNumber(NaN), '');
  assert.equal(formatNumber(0), '0.0');
  assert.equal(formatNumber(176.34, 2), '176.34');
});

test('parseNumber handles blanks and bad input', () => {
  assert.equal(parseNumber(''), 0);
  assert.equal(parseNumber(null), 0);
  assert.equal(parseNumber(undefined), 0);
  assert.equal(parseNumber('abc'), 0);
  assert.equal(parseNumber('176'), 176);
  assert.equal(parseNumber('176.5'), 176.5);
  assert.equal(parseNumber(176), 176);
});

test('zero round-trips cleanly', () => {
  assert.equal(lbToKg(0), 0);
  assert.equal(kgToLb(0), 0);
  assert.equal(galToL(0), 0);
  assert.equal(ftToM(0), 0);
});
