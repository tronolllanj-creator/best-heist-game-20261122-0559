// mulberry32 seeded PRNG — deterministic, no Math.random / Date.
// Drives every patrol jitter and particle in the sim.
export function createRng(seed) {
  let a = seed >>> 0;
  // 32-bit state mulberry32
  const next = () => {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 0x80000000;
  };
  // uniform [0,1)
  const range = (min, max) => next() * (max - min) + min;
  // pick random element from array
  const pick = (arr) => arr[(next() * arr.length) | 0];
  // integer in [0, n) — low-bias trunc, fine for jitter/pool
  const int = (n) => (next() * n) | 0;
  return { next, range, pick, int };
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 0x80000000;
  };
}

export function seededRng(seed) { return mulberry32(seed); }
