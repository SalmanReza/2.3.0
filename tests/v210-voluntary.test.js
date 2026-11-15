import test from 'node:test';
import assert from 'node:assert/strict';
import { tickPlan, rakahsFromTicks, validateExtraRakahs, toggleTick, applyExtra, allowsExtraInput, MAX_TICKS, normalizeTicks } from '../src/voluntary-ticks.js';
import { VOLUNTARY_REWARDS, rewardFor, sanitizeVoluntarySeconds, VOLUNTARY_SECONDS_DEFAULT } from '../src/voluntary-rewards.js';

test('no voluntary event ever has more than six ticks, each worth two rak‘ahs', () => {
  for (const key of ['duha', 'awwabin', 'qiyam', 'tahajjud', 'tarawih', 'eid_prayer', 'witr']) {
    const plan = tickPlan(key);
    assert.ok(plan.length >= 1 && plan.length <= MAX_TICKS, key);
  }
  assert.deepEqual(tickPlan('duha'), [2, 2, 2, 2, 2, 2]);
  assert.equal(rakahsFromTicks('duha', [true, true, true, true, true, true]), 12);
  assert.equal(tickPlan('awwabin').length, 3);
  assert.deepEqual(tickPlan('witr'), [2, 1]);
});

test('toggling ticks adds and removes two rak‘ahs at a time and persists as plain arrays', () => {
  let r = toggleTick('qiyam', [], 0); assert.equal(r.total, 2);
  r = toggleTick('qiyam', r.ticks, 3); assert.equal(r.total, 4);
  r = toggleTick('qiyam', r.ticks, 0); assert.equal(r.total, 2);
  const saved = JSON.parse(JSON.stringify(r.ticks));
  assert.deepEqual(normalizeTicks('qiyam', saved), saved);
  assert.equal(r.ticks.length, 6);
});

test('the more-than-12 input is validated', () => {
  assert.equal(validateExtraRakahs('tarawih', '20').ok, true);
  assert.equal(validateExtraRakahs('tarawih', '20').count, 20);
  assert.equal(validateExtraRakahs('qiyam', '14').ok, true);
  assert.equal(validateExtraRakahs('qiyam', '12').error, 'min');
  assert.equal(validateExtraRakahs('qiyam', '15').error, 'even');
  assert.equal(validateExtraRakahs('qiyam', '').error, 'empty');
  assert.equal(validateExtraRakahs('qiyam', '1.5').error, 'whole');
  assert.equal(validateExtraRakahs('qiyam', '-4').error, 'whole');
  assert.equal(validateExtraRakahs('qiyam', 'abc').error, 'whole');
  assert.equal(validateExtraRakahs('qiyam', '102').error, 'max');
  assert.equal(validateExtraRakahs('witr', '14').ok, false);
  assert.equal(allowsExtraInput('eid_prayer'), false);
});

test('a large count fills the ticks and keeps the entered total', () => {
  const r = applyExtra('tarawih', 20);
  assert.equal(r.total, 20);
  assert.ok(r.ticks.every(Boolean));
  assert.equal(r.ticks.length, 6);
});

test('every voluntary prayer has its own reward text with a source, in both languages', () => {
  for (const key of ['duha', 'awwabin', 'qiyam', 'tahajjud', 'tarawih', 'eid_prayer', 'witr', 'other_nafl']) {
    const en = rewardFor(key, 'en'), bn = rewardFor(key, 'bn');
    assert.ok(en.text.length > 20 && en.ref, key);
    assert.ok(/[\u0980-\u09FF]/.test(bn.text) && /[\u0980-\u09FF]/.test(bn.ref), key + ' bn');
    assert.notEqual(en.text, bn.text);
  }
  const texts = new Set(Object.values(VOLUNTARY_REWARDS).map(item => item.en));
  assert.equal(texts.size, Object.keys(VOLUNTARY_REWARDS).length, 'no two prayers share a generic text');
  assert.equal(rewardFor('nope'), null);
});

test('recognition seconds for a voluntary prayer: whole seconds 1-120, otherwise the fallback', () => {
  assert.equal(sanitizeVoluntarySeconds('12'), 12);
  assert.equal(sanitizeVoluntarySeconds('0'), VOLUNTARY_SECONDS_DEFAULT);
  assert.equal(sanitizeVoluntarySeconds('121', 5), 5);
  assert.equal(sanitizeVoluntarySeconds('2.5', 5), 5);
  assert.equal(sanitizeVoluntarySeconds(undefined), VOLUNTARY_SECONDS_DEFAULT);
  assert.equal(sanitizeVoluntarySeconds(30), 30);
});
