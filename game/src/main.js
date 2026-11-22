import { CONFIG, PALETTE, LEVELS, makeGuard, makeCamera, makeLoot } from './config.js';
import { mulberry32 } from './random.js';
import { render } from './render.js';
import { step } from './sim.js';
import { createAudio } from './audio.js';

const sound = createAudio();

const W = 1280;
const H = 720;
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

export function getCanvas() { return canvas; }
export function getCtx() { return ctx; }
export function getConfig() { return CONFIG; }
export function getLevels() { return LEVELS; }
export function getSound() { return sound; }

const state = {
  mode: 'attract',      // attract, title, play, clear, pause, caught, win
  level: 0,
  score: 0,
  best: 0,
  elapsed: 0,
  stepCount: 0,
  thief: null,
  guards: [],
  cameras: [],
  loot: [],
  particles: [],
  coins: 3,
  alarm: 0,
  lootTaken: 0,
  quota: 0,
  timesSpotted: 0,
  coinsThrown: 0,
  alarmsTripped: 0,
  alarmPeak: 0,
  seenTime: 0,
  phase: null,
  ghost: false,
  mute: false,
  shake: 0,
  atkT: 0,
  clearT: 0,
  endReason: null,
  seed: 1337,
  rand: null,
};

const keys = {};
const mouse = { x: 0, y: 0, held: false, clicked: false };

function loadBest() {
  try { return parseInt(localStorage.getItem('vv_best') || '0', 10) || 0; }
  catch (e) { return 0; }
}
function saveBest() {
  try { localStorage.setItem('vv_best', String(state.best)); } catch (e) {}
}

function newThief() {
  return { x: 120, y: 620, vx: 0, vy: 0, fx: 1, fy: 0, sneak: false, dashT: 0, dashCD: 0, dashDirx: 0, dashDiry: 0, channel: null, channelT: 0, feet: 0, seen: false, hitCD: 0 };
}

export function startLevel(idx) {
  const L = LEVELS[idx];
  state.level = idx;
  state.rand = mulberry32(state.seed * 9176 + idx * 7919);
  state.thief = newThief();
  state.guards = L.guards.map(g => makeGuard(g, state.rand));
  state.cameras = L.cameras.map(c => makeCamera(c, state.rand));
  state.loot = L.loot.map(l => makeLoot(l, state.rand));
  state.particles = [];
  state.coins = 3;
  state.alarm = 0;
  state.lootTaken = 0;
  state.quota = L.quota;
  state.timesSpotted = 0;
  state.coinsThrown = 0;
  state.alarmsTripped = 0;
  state.alarmPeak = 0;
  state.seenTime = 0;
  state.elapsed = 0;
  state.stepCount = 0;
  state.phase = null;
  state.shake = 0;
  state.clearT = 0;
  state.endReason = null;
  state.mode = 'play';
}

function addScore(n) { state.score += n; if (state.score > state.best) state.best = state.score; }

function clearLevel() {
  const L = LEVELS[state.level];
  state.ghost = state.alarmPeak < 50;
  let bonus = 500 * (state.level + 1);
  const timeBonus = Math.max(0, L.parTime - state.elapsed) * 10;
  bonus += timeBonus;
  if (state.ghost) bonus += 1000;
  addScore(bonus);
  saveBest();
  if (state.level >= LEVELS.length - 1) {
    state.mode = 'win';
    sound.win();
  } else {
    state.mode = 'clear';
    state.clearT = 0;
    sound.levelClear();
  }
}

function caught() {
  state.mode = 'caught';
  state.shake = 1;
  sound.caught();
}

function autopilot() {
  const t = state.thief;
  if (!t) return;
  const nearest = state.guards.reduce((a, g) => g.x + g.y < a.x + a.y ? g : a, { x: t.x, y: t.y });
  const dx = nearest.x - t.x;
  const dy = nearest.y - t.y;
  const d = Math.hypot(dx, dy) || 1;
  t.vx = (dx / d) * CONFIG.thiefSpeed;
  t.vy = (dy / d) * CONFIG.thiefSpeed;
}

export function update(dt) {
  state.atkT += dt;
  switch (state.mode) {
    case 'attract':
      if (state.rand) { step(state, getInput(), dt); state.stepCount++; }
      state.onAttract && (state.onAttract += dt);
      break;
    case 'title':
      state.stepCount++;
      if (state.rand) { step(state, getInput(), dt); state.stepCount++; }
      break;
    case 'play':
      if (state.stepCount < 1) state.rand = mulberry32(state.seed * 9176 + state.level * 7919);
      step(state, getInput(), dt);
      state.stepCount++;
      if (CONFIG.phase) {
        state.phase = CONFIG.phase;
        if (state.phase === 'caught' && CONFIG.onCaught) { state.mode = 'caught'; sound.caught(); state.shake = 1; if (CONFIG.freeze) CONFIG.freeze = false; }
        if (state.phase === 'clear' && !CONFIG.done) { clearLevel(); CONFIG.done = true; if (CONFIG.freezeOnClear) CONFIG.freeze = true; }
      }
      break;
    case 'clear':
      state.clearT += dt;
      break;
    case 'caught':
      state.shake = Math.max(0, state.shake - dt * 2);
      break;
    case 'win':
      break;
    case 'pause':
      break;
  }
}

function drawHUD() {
  const L = LEVELS[state.level] || {};
  ctx.save();
  ctx.font = 'bold 20px monospace';
  ctx.textBaseline = 'top';
  // score + best
  ctx.fillStyle = PALETTE.text;
  ctx.textAlign = 'left';
  ctx.fillText('SCORE ' + String(state.score).padStart(6, '0'), 16, 12);
  ctx.fillStyle = PALETTE.muted;
  ctx.fillText('BEST  ' + String(state.best).padStart(6, '0'), 16, 36);
  // level + loot
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 18px monospace';
  ctx.fillText(L ? L.name : '', W / 2, 12);
  ctx.font = 'bold 14px monospace';
  ctx.fillStyle = state.lootTaken >= state.quota ? PALETTE.alarmOk : PALETTE.loot;
  ctx.fillText('LOOT ' + state.lootTaken + '/' + state.quota, W / 2, 34);
  // alarm
  ctx.textAlign = 'right';
  ctx.font = 'bold 15px monospace';
  const col = state.alarm < 35 ? PALETTE.alarmOk : state.alarm < 70 ? PALETTE.alarmMid : PALETTE.alarmHigh;
  ctx.fillStyle = col;
  ctx.fillText('ALARM ' + Math.round(state.alarm), W - 16, 14);
  ctx.fillStyle = PALETTE.panel;
  ctx.fillRect(W - 16 - 160, 30, 160, 10);
  ctx.fillStyle = col;
  ctx.fillRect(W - 16 - 160, 30, 160 * Math.min(1, state.alarm / 100), 10);
  // coins
  ctx.textAlign = 'left';
  ctx.font = 'bold 15px monospace';
  ctx.fillStyle = PALETTE.muted;
  ctx.fillText('COINS ' + state.coins, 16, H - 26);
  // context prompt
  ctx.textAlign = 'center';
  ctx.font = 'bold 16px monospace';
  let prompt = '';
  const t = state.thief;
  const L2 = L;
  let open = L2 && state.lootTaken >= L2.quota;
  if (t && t.channel && t.channel.kind === 'painting') prompt = 'E GRAB PAINTING';
  else if (t && t.channel && t.channel.kind === 'safe') prompt = 'HOLD E CRACKING SAFE ' + Math.round(t.channel.l.t / 2 * 100) + '%';
  else if (t && t.channel && t.channel.kind === 'core') prompt = 'HOLD E CRACKING CORE ' + Math.round(t.channel.l.t / 3 * 100) + '%';
  else if (open && t && Math.hypot(t.x - L2.exit.x, t.y - L2.exit.y) < 60) prompt = 'EXIT OPEN - GO';
  else if (open) prompt = 'FIND THE EXIT';
  if (prompt) { ctx.fillStyle = PALETTE.text; ctx.fillText(prompt, W / 2, H - 20); }
  // status banner
  let ban, bcol;
  if (state.phase === 'lockdown') { ban = 'LOCKDOWN'; bcol = PALETTE.alarmHigh; }
  else if (t && t.seen) { ban = 'SPOTTED'; bcol = PALETTE.alarmMid; }
  else { ban = 'HIDDEN'; bcol = PALETTE.alarmOk; }
  if (state.mode === 'play') {
    ctx.textAlign = 'left';
    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = bcol;
    ctx.fillText(ban + (t && t.sneak ? ' · SNEAK' : ''), 16, H - 48);
  }
  ctx.restore();
}

function overlay(alpha) {
  ctx.save();
  ctx.fillStyle = 'rgba(9,7,5,' + alpha + ')';
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function drawScreen() {
  if (state.mode === 'attract' || state.mode === 'title') render(ctx, state, W, H);
  else if (state.mode === 'play') { render(ctx, state, W, H); drawHUD(); }
  else { render(ctx, state, W, H); }

  if (state.mode === 'title') {
    overlay(0.55);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.thief;
    ctx.font = 'bold 64px monospace';
    ctx.fillText('VELVET VAULT', W / 2, 250);
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 40px monospace';
    ctx.fillText('MIDNIGHT HEIST', W / 2, 300);
    ctx.font = '16px monospace';
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText('CROSS THE MUSEUM. DODGE CONES. GRAB THE PLUNDER.', W / 2, 360);
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 18px monospace';
    if (Math.floor(state.atkT * 2) % 2) ctx.fillText('PRESS ENTER TO START', W / 2, 420);
    ctx.font = '13px monospace';
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText('WASD MOVE · SHIFT SNEAK · SPACE DASH · E GRAB · CLICK COIN · P PAUSE', W / 2, 500);
    ctx.restore();
  } else if (state.mode === 'clear') {
    overlay(0.6);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.alarmOk;
    ctx.font = 'bold 48px monospace';
    ctx.fillText('HEIST COMPLETE', W / 2, 280);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '20px monospace';
    ctx.fillText('BONUS +500' + (state.level + 1), W / 2, 340);
    if (state.ghost) { ctx.fillStyle = PALETTE.alarmOk; ctx.fillText('GHOST BONUS +1000', W / 2, 370); }
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '16px monospace';
    ctx.fillText('PRESS ENTER FOR NEXT HEIST', W / 2, 430);
    ctx.restore();
  } else if (state.mode === 'pause') {
    overlay(0.6);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 56px monospace';
    ctx.fillText('PAUSED', W / 2, 340);
    ctx.font = '15px monospace';
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText('PRESS P / ESC TO RESUME', W / 2, 400);
    if (state.mute) ctx.fillText('MUTED', W / 2, 430);
    ctx.restore();
  } else if (state.mode === 'caught') {
    overlay(0.5);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.alarmHigh;
    ctx.font = 'bold 64px monospace';
    ctx.fillText('CAUGHT', W / 2, 300);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '18px monospace';
    ctx.fillText('THE YARDIES GOT YOU', W / 2, 360);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '16px monospace';
    ctx.fillText('PRESS R TO RESTART · ENTER TO TITLE', W / 2, 420);
    ctx.restore();
  } else if (state.mode === 'win') {
    overlay(0.7);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.thief;
    ctx.font = 'bold 56px monospace';
    ctx.fillText('VAULT CLEARED', W / 2, 240);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '24px monospace';
    ctx.fillText('FINAL SCORE ' + String(state.score).padStart(6, '0'), W / 2, 320);
    ctx.font = '15px monospace';
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText('LOOT ' + state.lootTaken + '  SPOTTED ' + state.timesSpotted + '  COINS ' + state.coinsThrown + '  ALARMS ' + state.alarmsTripped, W / 2, 360);
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = PALETTE.text;
    if (Math.floor(state.atkT * 2) % 2) ctx.fillText('PRESS R TO RUN IT AGAIN', W / 2, 420);
    ctx.restore();
  }
}

function paint() {
  ctx.save();
  if (state.mode === 'caught' && state.shake > 0) {
    const s = state.shake * 12;
    ctx.translate((Math.sin(state.atkT * 60) * s), (Math.cos(state.atkT * 53) * s));
  }
  drawScreen();
  ctx.restore();
}

let last = 0;
let acc = 0;
const STEP = 1 / 60;
function loop(ts) {
  requestAnimationFrame(loop);
  if (!last) last = ts;
  let dt = (ts - last) / 1000;
  last = ts;
  if (dt > 0.2) dt = 0.2;
  acc += dt;
  let n = 0;
  while (acc >= STEP && n < 5) { update(STEP); acc -= STEP; n++; }
  paint();
  if (mouse.clicked) mouse.clicked = false;
}
function boot() {
  state.best = loadBest();
  // attract play
  startLevel(1);
  state.mode = 'attract';
  requestAnimationFrame(loop);
}

function gotoTitle() { startLevel(1); state.mode = 'title'; }

// input
window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  keys[k] = true;
  if (k === 'm') { state.mute = !state.mute; sound.setMuted(state.mute); e.preventDefault(); return; }
  if (k === 'p' || k === 'escape') {
    if (state.mode === 'play') state.mode = 'pause';
    else if (state.mode === 'pause') state.mode = 'play';
    e.preventDefault(); return;
  }
  if (k === 'enter') {
    if (state.mode === 'title' || state.mode === 'attract') { CONFIG.autopilot = false; CONFIG.freeze = false; state.seed = (Math.floor(state.atkT * 100) % 3) + 1; startLevel(0); state.mode = 'play'; }
    else if (state.mode === 'clear') { startLevel(state.level + 1); state.mode = 'play'; }
    else if (state.mode === 'caught') { gotoTitle(); }
    e.preventDefault();
  }
  if (k === 'r') {
    if (state.mode === 'caught' || state.mode === 'win') { CONFIG.autopilot = false; CONFIG.freeze = false; startLevel(0); state.mode = 'play'; }
    else if (state.mode === 'play' || state.mode === 'pause') { startLevel(state.level); state.mode = 'play'; }
    e.preventDefault();
  }
  if ([ 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ' ].includes(k)) e.preventDefault();
});
window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });
window.addEventListener('mousemove', (e) => {
  const r = canvas.getBoundingClientRect();
  mouse.x = (e.clientX - r.left) / r.width * W;
  mouse.y = (e.clientY - r.top) / r.height * H;
});
window.addEventListener('mousedown', (e) => {
  mouse.held = true;
  mouse.clicked = true;
  if (state.mode === 'title' || state.mode === 'attract') { CONFIG.autopilot = false; CONFIG.freeze = false; state.seed = (Math.floor(state.atkT * 100) % 3) + 1; startLevel(0); state.mode = 'play'; }
});
window.addEventListener('mouseup', () => { mouse.held = false; });

// current input snapshot for sim
export function getInput() {
  return {
    up: !!(keys['w'] || keys['arrowup']),
    down: !!(keys['s'] || keys['arrowdown']),
    left: !!(keys['a'] || keys['arrowleft']),
    right: !!(keys['d'] || keys['arrowright']),
    sneak: !!(keys['shift']),
    dash: !!(keys[' ']),
    grab: !!(keys['e']),
    mouse: { x: mouse.x, y: mouse.y, held: mouse.held, clicked: mouse.clicked },
  };
}

// screenshot staging
export function runShot(shot) {
  CONFIG.autopilot = false;
  CONFIG.freeze = false;
  CONFIG.done = false;
  CONFIG.freezeOnClear = false;
  CONFIG.onCaught = false;
  CONFIG.phase = null;
  let seed = 1337;
  if (shot === 'start') { startLevel(1); state.mode = 'attract'; state.atkT = 8; }
  else if (shot === 'play') { startLevel(0); state.mode = 'play'; state.alarm = 35; state.lootTaken = 1; state.seenTime = 0.2; }
  else if (shot === 'vault') { startLevel(1); state.mode = 'play'; state.alarm = 55; }
  else if (shot === 'end') { startLevel(0); state.mode = 'play'; state.alarm = 95; CONFIG.phase = 'caught'; CONFIG.onCaught = true; CONFIG.freeze = false; }
  // paint twice
  paint(); paint();
  window.__shotReady = true;
  if (shot === 'end') { CONFIG.freeze = true; }
}

window.onerror = function (msg, src, line, col, err) {
  window.__shotError = { msg: String(msg), src: src, line: line, col: col, stack: err && err.stack ? err.stack : '' };
  return false;
};

boot();

// Screenshot staging: ?shot=start|play|vault|end stages a deterministic scene.
const _shot = new URLSearchParams(window.location.search).get('shot');
if (_shot) runShot(_shot);
