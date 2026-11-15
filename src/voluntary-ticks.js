/* Voluntary prayer completion ticks (v2.1.0). Each tick is one two-rak‘ah set, at most six ticks (12 rak‘ahs).
   More than 12 rak‘ahs are entered as a number instead of generating more ticks. Data is kept in the existing
   record fields: record.rakahSets[key] (array of booleans) and record.rakahs[key] (total). */
export const MAX_TICKS = 6;
export const MAX_COUNT = 100;
export const TICK_LIMIT = 12;

/** Rak‘ahs carried by each tick. Eid is one pair; Witr is its two parts (a pair, then the single). */
export function tickPlan(key) {
  if (key === 'eid_prayer') return [2];
  if (key === 'witr') return [2, 1];
  if (key === 'awwabin') return [2, 2, 2];
  return [2, 2, 2, 2, 2, 2];
}

export const allowsExtraInput = key => key !== 'eid_prayer' && key !== 'witr';

export function rakahsFromTicks(key, ticks = []) {
  const plan = tickPlan(key);
  return plan.reduce((sum, value, index) => sum + (ticks[index] ? value : 0), 0);
}

export function normalizeTicks(key, ticks) {
  const plan = tickPlan(key);
  return plan.map((_, index) => !!(Array.isArray(ticks) && ticks[index]));
}

/** Validate the "more than 12" input. Returns { ok, count, error }, error being a message key. */
export function validateExtraRakahs(key, raw) {
  const text = String(raw ?? '').trim();
  if (!allowsExtraInput(key)) return { ok: false, count: 0, error: 'not-allowed' };
  if (text === '') return { ok: false, count: 0, error: 'empty' };
  if (!/^\d+$/.test(text)) return { ok: false, count: 0, error: 'whole' };
  const count = Number(text);
  if (count <= TICK_LIMIT) return { ok: false, count, error: 'min' };
  if (count % 2) return { ok: false, count, error: 'even' };
  if (count > MAX_COUNT) return { ok: false, count, error: 'max' };
  return { ok: true, count, error: '' };
}

export const EXTRA_ERRORS = Object.freeze({
  empty: ['Enter the number of rak‘ahs.', 'রাকাতের সংখ্যা লিখুন।'],
  whole: ['Use whole numbers only.', 'শুধু পূর্ণসংখ্যা লিখুন।'],
  min: ['Use this box only for more than 12 rak‘ahs. Tick the sets for 12 or fewer.', 'এই ঘর শুধু ১২ রাকাতের বেশির জন্য। ১২ বা তার কম হলে সেট টিক দিন।'],
  even: ['Voluntary prayers are prayed in sets of two. Enter an even number.', 'নফল নামাজ দুই রাকাতের সেটে পড়া হয়। জোড় সংখ্যা লিখুন।'],
  max: ['The highest count accepted is 100.', 'সর্বোচ্চ ১০০ রাকাত গ্রহণযোগ্য।'],
  'not-allowed': ['This prayer has a fixed number of rak‘ahs.', 'এই নামাজের রাকাত নির্দিষ্ট।']
});

/** Apply a tick toggle: returns the new { ticks, total }. Un-ticking after a large count was entered falls back to the ticks. */
export function toggleTick(key, ticks, index) {
  const next = normalizeTicks(key, ticks);
  if (index < 0 || index >= next.length) return { ticks: next, total: rakahsFromTicks(key, next) };
  next[index] = !next[index];
  return { ticks: next, total: rakahsFromTicks(key, next) };
}

/** A large count fills every tick; the total keeps the entered number. */
export function applyExtra(key, count) {
  return { ticks: tickPlan(key).map(() => true), total: count };
}
