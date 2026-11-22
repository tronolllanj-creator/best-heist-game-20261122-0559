import { seededRng } from './random.js';

const MUTE_KEY = 'vv_muted';

function readMuted() {
  try { return localStorage.getItem(MUTE_KEY) === '1'; }
  catch (e) { return false; }
}
function writeMuted(v) {
  try { localStorage.setItem(MUTE_KEY, v ? '1' : '0'); } catch (e) { /* ignore */ }
}

let _rng;

export function createAudio() {
  let ctx = null;
  let master = null;
  let muted = readMuted();
  const st = { locked: false, muted };   // locked: ctx known not-usable

  function ensure() {
    if (ctx || st.locked) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { st.locked = true; return null; }
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.35;
      master.connect(ctx.destination);
    } catch (e) { st.locked = true; ctx = null; }
    return ctx;
  }

  async function unlock() {
    if (ctx) { try { if (ctx.state === 'suspended') await ctx.resume(); } catch (e) {} return; }
    ensure();
    if (!ctx) return;
    try {
      const t = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = 60;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.02, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + 0.07);
    } catch (e) {}
  }

  function env(node, t, peak, a, d) {
    node.gain.setTargetAtTime(peak, t, a);
    node.gain.setTargetAtTime(0.0001, t + a + 0.005, d);
  }
  function tone(freq, when, dur, type, peak, slideTo) {
    if (!ctx || muted) return;
    try {
      const t = Math.max(ctx.currentTime, when);
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
      env(g, t, peak, 0.005, 0.08);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + dur + 0.12);
    } catch (e) {}
  }
  function blip(when, d, type, peak) {
    tone(140, when, d, type, peak, 55);
  }

  function footstep() { if (_rng) blip(_rng() * 0.02, 0.04, 'triangle', 0.052); else blip(0, 0.04, 'triangle', 0.052); }
  function coin() { if (!ctx || muted) return; const t = ctx.currentTime; tone(1850, t, 0.05, 'square', 0.11); tone(2500, t + 0.05, 0.08, 'square', 0.10); }
  function grab() { if (!ctx || muted) return; const t = ctx.currentTime; tone(660, t, 0.07, 'sine', 0.13, 880); tone(880, t + 0.08, 0.09, 'sine', 0.12, 1180); }
  function safeClick() { if (!ctx || muted) return; try { const t = ctx.currentTime; const f = ctx.createOscillator(); const g = ctx.createGain(); const fl = ctx.createBiquadFilter(); f.type = 'square'; f.frequency.value = 240; fl.type = 'lowpass'; fl.frequency.value = 900; g.gain.value = 0; f.connect(fl); fl.connect(g); g.connect(master); f.start(t); f.stop(t + 0.05); g.gain.setTargetAtTime(0.11, t, 0.004); g.gain.setTargetAtTime(0.0001, t + 0.02, 0.03); } catch (e) {} }
  function spotted() { if (!ctx || muted) return; const t = ctx.currentTime; tone(1150, t, 0.12, 'square', 0.15, 760); tone(1150, t + 0.13, 0.12, 'square', 0.15, 760); }
  function alarm() {
    if (!ctx || muted) return;
    const t = ctx.currentTime;
    const busy = _rng ? _rng() : 0.5;
    const f1 = busy < 0.5 ? 880 : 700, f2 = busy < 0.5 ? 700 : 880;
    tone(f1, t, 0.10, 'square', 0.11);
    tone(f2, t + 0.11, 0.10, 'square', 0.11);
    tone(f1, t + 0.22, 0.10, 'square', 0.09);
  }
  function levelClear() {
    if (!ctx || muted) return;
    const t = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, t + i * 0.09, 0.16, 'triangle', 0.12));
    tone(1318.5, t + 0.4, 0.3, 'sine', 0.1);
  }
  function caught() {
    if (!ctx || muted) return;
    const t = ctx.currentTime;
    tone(150, t, 0.4, 'sawtooth', 0.2, 55);
    blip(t + 0.02, 0.2, 'square', 0.14);
  }
  function win() {
    if (!ctx || muted) return;
    const t = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5, 1318.5, 2093.0].forEach((f, i) => tone(f, t + i * 0.11, 0.22, 'triangle', 0.12));
    tone(1567.98, t + 0.7, 0.5, 'sine', 0.1);
  }

  function setMuted(v) { muted = !!v; writeMuted(muted); }
  function isMuted() { return muted; }

  return { unlock, footstep, coin, grab, safeClick, spotted, alarm, levelClear, caught, win, setMuted, muted: isMuted };
}

let _setRng = null;
export function setAudioRng(fn) { _rng = fn || null; }
// used by sim: give audio the seeded generator so blips jitter procedurally
_setRng = (v) => { _rng = v; };
export { _setRng as setAudioRngInternal };
