// VELVET VAULT: MIDNIGHT HEIST — config
// Palette, field, entities, and 3 hand-laid-out heists. The renderer reuses these hexes
// and the sim reads all gameplay tuning from here. No Date, no Math.random in this file.
export const CONFIG = {
  palette: {
    floor: '#2a2118',
    floorAlt: '#241c14',
    wall: '#4a3b2c',
    wallTop: '#6b563e',
    shadow: '#0d0b09',
    rug: '#5e2f2f',
    thief: '#ffd94d',
    thiefDark: '#8a6d1f',
    guard: '#e05a4e',
    guardDark: '#8f2f28',
    camera: '#9fb4c7',
    coneGuard: 'rgba(224,90,78,0.28)',
    coneCamera: 'rgba(255,210,90,0.24)',
    loot: '#f0c040',
    safe: '#b8c4cc',
    painting: '#c9a227',
    alarmOk: '#59d867',
    alarmMid: '#f0a040',
    alarmHigh: '#e05a4e',
    text: '#efe6d0',
    muted: '#9a8f7a',
    panel: '#12100d',
    exit: '#59d867',
  },
  field: { w: 1280, h: 720 },
  thief: {
    speed: 170,
    sneak: 85,
    dashSpeed: 520,
    dashTime: 0.14,
    dashCooldown: 1.8, // seconds
    hitRadius: 14,
    coinsPerLevel: 3,
    coinRange: 140,
    coinProbe: 240,
    grabPaintingRadius: 42,
    grabSafeRadius: 46,
    channelSafe: 2.0,
    channelVault: 3.0,
  },
  guard: {
    range: 230,       // vision cone length
    halfAngle: 32,    // degrees
    speedPatrol: 95,
    speedInvestigate: 150,
    speedChase: 215,
    investigateTime: 4.0,
    returnTime: 1.4,
    hitRadius: 16,
    pauseAfterShove: 1.0,
  },
  camera: {
    range: 260,
    halfAngle: 28,
    sweepAngle: 55,   // degrees from centre each side
    sweepPeriod: 3.2, // seconds for a full sweep cycle
  },
  detection: {
    stand: 55,
    sneak: 30,
    camera: 70,
    lerpAlpha: 0.5,   // closer is faster: scale 1 - dist/range*0.5
    shadowMul: 0.4,
    hideTime: 1.5,
    fall: 18,
    dash: 12,
    shove: 25,
    threshold: 50,
    lockdownAt: 100,
    lockdownTime: 6.0,
    spotDelay: 0.35,  // seconds inside a cone before the '!' flag sticks
  },
  alarm: { min: 0, max: 100 },
  scoring: { painting: 250, safe: 500, vault: 1000, clearPerLevel: 500, ghost: 1000, timeBonus: 10 },
  // Geometry helpers share the collision convention used across sim/render.
  rect: (x, y, w, h) => ({ x, y, w, h }),
  circles: [],
  LEVELS: [
    {
      name: 'THE GALLERY',
      parTime: 75,
      quota: 4,
      walls: [
        { x: 60, y: 150, w: 20, h: 220 },   // west pillar
        { x: 260, y: 120, w: 220, h: 20 },  // north wall of east wing
        { x: 480, y: 120, w: 20, h: 240 },  // wing left column
        { x: 700, y: 200, w: 200, h: 20 },  // centre shelf
        { x: 900, y: 120, w: 20, h: 260 },  // east column
      ],
      cover: [
        { x: 180, y: 300, w: 60, h: 60 },
        { x: 360, y: 420, w: 80, h: 50 },
        { x: 600, y: 340, w: 70, h: 70 },
        { x: 860, y: 430, w: 60, h: 60 },
      ],
      rugs: [
        { x: 300, y: 260, w: 180, h: 90 },
        { x: 680, y: 480, w: 220, h: 90 },
      ],
      shadows: [
        { x: 120, y: 380, w: 120, h: 120 },
        { x: 520, y: 180, w: 100, h: 100 },
        { x: 760, y: 300, w: 140, h: 90 },
      ],
      loot: [
        { kind: 'painting', x: 300, y: 80 },
        { kind: 'painting', x: 820, y: 80 },
        { kind: 'painting', x: 1180, y: 360 },
        { kind: 'safe', x: 560, y: 620, channel: 2.0 },
      ],
      guards: [
        { waypoints: [{ x: 200, y: 550 }, { x: 200, y: 250 }, { x: 500, y: 200 }, { x: 500, y: 560 }] },
        { waypoints: [{ x: 900, y: 560 }, { x: 1200, y: 560 }, { x: 1200, y: 300 }] },
      ],
      cameras: [
        { x: 1120, y: 120, base: -90 },
        { x: 420, y: 640, base: -45 },
      ],
      exit: { x: 1200, y: 40, w: 60, h: 70 },
      start: { x: 180, y: 660 },
    },
    {
      name: 'THE VAULT',
      parTime: 100,
      quota: 5,
      walls: [
        { x: 100, y: 200, w: 260, h: 20 },    // north room top
        { x: 360, y: 200, w: 20, h: 200 },    // divider L
        { x: 560, y: 400, w: 20, h: 180 },    // middle pillar
        { x: 760, y: 200, w: 20, h: 300 },    // east room divider
        { x: 760, y: 500, w: 200, h: 20 },    // south shelf
        { x: 960, y: 200, w: 20, h: 200 },    // east room inner
      ],
      cover: [
        { x: 200, y: 360, w: 70, h: 70 },
        { x: 440, y: 300, w: 60, h: 90 },
        { x: 640, y: 560, w: 90, h: 60 },
        { x: 1050, y: 460, w: 70, h: 70 },
      ],
      rugs: [
        { x: 240, y: 460, w: 200, h: 100 },
        { x: 820, y: 300, w: 160, h: 80 },
      ],
      shadows: [
        { x: 140, y: 240, w: 140, h: 120 },
        { x: 500, y: 340, w: 120, h: 120 },
        { x: 1080, y: 240, w: 160, h: 140 },
      ],
      // Loot: 2 safes + 1 vault core + 2 paintings = 5, quota 5 (take all).
      loot: [
        { kind: 'painting', x: 400, y: 320 },
        { kind: 'painting', x: 1000, y: 420 },
        { kind: 'safe', x: 660, y: 240, channel: 2.0 },
        { kind: 'safe', x: 1000, y: 620, channel: 2.0 },
        { kind: 'vault', x: 700, y: 360, channel: 3.0 },
      ],
      guards: [
        { waypoints: [{ x: 180, y: 620 }, { x: 360, y: 560 }, { x: 360, y: 380 }] },
        { waypoints: [{ x: 620, y: 240 }, { x: 720, y: 560 }, { x: 560, y: 640 }] },
        { waypoints: [{ x: 1000, y: 240 }, { x: 1180, y: 560 }, { x: 820, y: 480 }] },
      ],
      cameras: [
        { x: 500, y: 180, base: -90 },
        { x: 300, y: 660, base: -180 },
        { x: 1180, y: 640, base: 90 },
      ],
      exit: { x: 1200, y: 120, w: 60, h: 70 },
      start: { x: 160, y: 680 },
    },
    {
      name: 'THE PENTHOUSE',
      parTime: 140,
      quota: 6,
      walls: [
        { x: 120, y: 160, w: 400, h: 20 },    // long north wall
        { x: 520, y: 160, w: 20, h: 240 },    // west col
        { x: 200, y: 400, w: 20, h: 240 },    // inner pillar
        { x: 640, y: 380, w: 240, h: 20 },    // centre bench
        { x: 880, y: 160, w: 20, h: 300 },    // east col
        { x: 1080, y: 200, w: 180, h: 20 },   // top-right wall
      ],
      cover: [
        { x: 280, y: 500, w: 80, h: 80 },
        { x: 560, y: 240, w: 60, h: 100 },
        { x: 700, y: 560, w: 90, h: 70 },
        { x: 1000, y: 460, w: 80, h: 80 },
      ],
      rugs: [
        { x: 160, y: 340, w: 220, h: 100 },
        { x: 720, y: 300, w: 200, h: 90 },
        { x: 980, y: 160, w: 180, h: 70 },
      ],
      shadows: [
        { x: 160, y: 540, w: 140, h: 140 },
        { x: 460, y: 240, w: 120, h: 120 },
        { x: 900, y: 560, w: 160, h: 120 },
        { x: 1120, y: 340, w: 140, h: 140 },
      ],
      // Loot: 3 paintings + 2 safes + 1 vault core = 6, quota 6 (take all).
      loot: [
        { kind: 'painting', x: 300, y: 140 },
        { kind: 'painting', x: 980, y: 120 },
        { kind: 'painting', x: 640, y: 500 },
        { kind: 'safe', x: 120, y: 300, channel: 2.0 },
        { kind: 'safe', x: 1180, y: 580, channel: 2.0 },
        { kind: 'vault', x: 820, y: 300, channel: 3.0 },
      ],
      guards: [
        { waypoints: [{ x: 200, y: 620 }, { x: 400, y: 560 }, { x: 200, y: 300 }] },
        { waypoints: [{ x: 500, y: 220 }, { x: 700, y: 300 }, { x: 500, y: 460 }] },
        { waypoints: [{ x: 900, y: 520 }, { x: 1100, y: 640 }, { x: 1180, y: 360 }] },
        { waypoints: [{ x: 1000, y: 180 }, { x: 1180, y: 280 }] },
      ],
      cameras: [
        { x: 400, y: 140, base: -90 },
        { x: 700, y: 440, base: 180 },
        { x: 60, y: 640, base: 0 },
        { x: 1220, y: 100, base: -45 },
      ],
      exit: { x: 1200, y: 620, w: 60, h: 70 },
      start: { x: 120, y: 680 },
    },
  ],
};

export const PALETTE = CONFIG.palette;
export const LEVELS = CONFIG.LEVELS;

export function makeGuard(spec, rand) {
  const wp = spec.waypoints;
  const x = wp[0].x, y = wp[0].y;
  const nx = wp[1] || wp[0];
  const facing = Math.atan2(nx.y - y, nx.x - x);
  return {
    x, y, wp, seg: 0, facing,
    dir: { x: Math.cos(facing), y: Math.sin(facing) },
    vx: 0, vy: 0, state: 'patrol', target: null, pausing: 0,
    investigateT: 0, alert: null, range: 230, half: 32 * Math.PI / 180, speed: 95,
  };
}

export function makeCamera(spec, rand) {
  const base = spec.base * Math.PI / 180;
  return {
    x: spec.x, y: spec.y, base, ang: base,
    sweep: 55 * Math.PI / 180, period: 3.2, phase: rand() * Math.PI * 2,
    range: 260, half: 28 * Math.PI / 180,
  };
}

export function makeLoot(spec, rand) {
  if (spec.kind === 'painting') return { kind: 'painting', x: spec.x, y: spec.y, w: 46, h: 34, taken: false, t: 0, channelMax: 0, spawnT: 0 };
  if (spec.kind === 'safe') return { kind: 'safe', x: spec.x, y: spec.y, w: 40, h: 40, taken: false, t: 0, channelMax: 2.0 };
  return { kind: 'vault', x: spec.x, y: spec.y, w: 44, h: 44, taken: false, t: 0, channelMax: 3.0 };
}