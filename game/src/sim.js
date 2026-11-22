import { CONFIG, LEVELS } from './config.js';

export function step(state, input, dt) {
  if (!state || !LEVELS[state.level]) return;
  if (CONFIG.phase) state.mode = CONFIG.phase;
  const mode = state.mode;
  const level = LEVELS[state.level];
  const walls = level.walls || level.cover || [];
  const allRects = walls.concat(level.shadows || []).concat(level.rugs || []);
  const shadows = level.shadows || [];

  const thief = state.thief;
  thief.dashCD = Math.max(0, thief.dashCD - dt);
  if (thief.hitCD > 0) thief.hitCD = Math.max(0, thief.hitCD - dt);

  if (state.ghost && thief.ghost) {
    let p = false;
    for (const s of shadows) {
      if (thief.x >= s.x && thief.x <= s.x + s.w && thief.y >= s.y && thief.y <= s.y + s.h) { p = true; break; }
    }
    if (!p) thief.ghost = false;
  }

  if (mode === 'play') state.elapsed += dt;

  const lockdownT = state._lockdownT || 0;
  const lockdownActive = state._lockdownT > 0;

  if (mode === 'play' || mode === 'attract' || mode === 'title') {
    let mvx = 0, mvy = 0;
    let grabbed = false;
    let wantDash = false;
    if (mode === 'play') {
      if (input.up) mvy -= 1;
      if (input.down) mvy += 1;
      if (input.left) mvx -= 1;
      if (input.right) mvx += 1;
      grabbed = !!input.grab;
      wantDash = !!input.dash;
    } else {
      const ml = mouseLike(state, walls, level);
      mvx = ml.x; mvy = ml.y; wantDash = ml.dash;
    }
    const len = Math.hypot(mvx, mvy);
    if (len > 1e-4) { mvx /= len; mvy /= len; }

    const snk = mode === 'play' ? !!input.sneak : configVal('sneakRangeAuto', state.level > 2);
    thief.sneak = snk;

    let speed = CONFIG.thiefSpeed !== undefined ? CONFIG.thiefSpeed : 170;
    if (snk) speed *= 0.5;

    if (mode === 'play') {
      if (wantDash && thief.dashCD <= 0 && !thief.channel && !thief.dashT) {
        thief.dashT = CONFIG.dashTime !== undefined ? CONFIG.dashTime : 0.14;
        thief.dashCD = CONFIG.dashCooldown !== undefined ? CONFIG.dashCooldown : 1.8;
        if (len > 1e-4) { thief.dashDirx = mvx; thief.dashDiry = mvy; }
        else if (thief.dashDirx || thief.dashDiry) {}
        else { thief.dashDirx = mvx; thief.dashDiry = mvy; }
      }
    } else {
      if (wantDash && thief.dashCD <= 0) {
        thief.dashT = CONFIG.dashTime !== undefined ? CONFIG.dashTime : 0.14;
        thief.dashCD = CONFIG.dashCooldown !== undefined ? CONFIG.dashCooldown : 1.8;
        if (len > 1e-4) { thief.dashDirx = mvx; thief.dashDiry = mvy; }
      }
    }

    if (thief.dashT > 0) {
      thief.dashT = Math.max(0, thief.dashT - dt);
      const dspeed = CONFIG.dashSpeed !== undefined ? CONFIG.dashSpeed : 520;
      thief.x += (thief.dashDirx || 0) * dspeed * dt;
      thief.y += (thief.dashDiry || 0) * dspeed * dt;
    } else {
      thief.x += mvx * speed * dt;
      thief.y += mvy * speed * dt;
    }

    if (len > 1e-4) { thief.vx = mvx; thief.vy = mvy; }

    const r = CONFIG.thiefRadius !== undefined ? CONFIG.thiefRadius : 14;
    const margin = 16;
    if (thief.x < margin + r) thief.x = margin + r;
    else if (thief.x > 1280 - margin - r) thief.x = 1280 - margin - r;
    if (thief.y < margin + r) thief.y = margin + r;
    else if (thief.y > 720 - margin - r) thief.y = 720 - margin - r;

    for (const w of walls) { pushOutRect(thief, w, r); }

    if (thief.dashT > 0) { /* keep dash */ }
    else if (thief.channel) {
      const moving = Math.abs(mvx) > 0.3 || Math.abs(mvy) > 0.3;
      const holding = mode === 'play' && !!input.grab;
      if (moving || !holding) { cancelChannel(state); }
    }

    if (mode === 'play' && input.mouse && input.mouse.held && len > 1e-4) {
      thief.moving = true;
    }

    const dist2 = (a, b) => { const dx = a.x - b.x, dy = a.y - b.y; return dx * dx + dy * dy; };

    if (thief.channel && !thief.dashT) {
      const l = thief.channel.l;
      l.t += dt;
      const cmax = l.kind === 'core' ? (CONFIG.vaultChannel !== undefined ? CONFIG.vaultChannel : 3) : (CONFIG.safeChannel !== undefined ? CONFIG.safeChannel : 2);
      if (l.t >= cmax) { takeLoot(state, l); }
    }

    if (mode === 'play' && grabbed && !thief.channel && !thief.dashT) {
      let bestL = null, bestD = 42 * 42;
      for (const l of state.loot) {
        if (l.taken) continue;
        const d = dist2(thief, l);
        if (d < bestD) { bestD = d; bestL = l; }
      }
      if (bestL) {
        if (bestL.kind === 'painting') { takeLoot(state, bestL); }
        else { startChannel(state, bestL); }
      } else {
        // nearby untaken loot within 42
        for (const l of state.loot) {
          if (l.taken) continue;
          if (dist2(thief, l) <= 42 * 42) {
            if (l.kind === 'painting') takeLoot(state, l);
            else startChannel(state, l);
            break;
          }
        }
      }
    }

    for (const g of state.guards) {
      if (!g.active) continue;
      const d = dist2(thief, g);
      if (d < 22 * 22) {
        if (state.alarm >= 50) {
          state.caught = true;
          return;
        } else {
          const ang = Math.atan2(thief.y - g.y, thief.x - g.x);
          thief.x += Math.cos(ang) * 44;
          thief.y += Math.sin(ang) * 44;
          for (const w of walls) { pushOutRect(thief, w, r); }
          g.state = 'pause'; g.pausedUntil = state.elapsed + 1.0; g.returning = !(g.returning);
          state.alarm = Math.min(100, state.alarm + 25);
          if (state.alarm > state.alarmPeak) state.alarmPeak = state.alarm;
          return;
        }
      }
    }

    const exit = level.exit;
    if (state.lootTaken >= level.quota) {
      state.exitOpen = true;
    }
    if (state.exitOpen) {
      if (thief.x >= exit.x && thief.x <= exit.x + exit.w && thief.y >= exit.y && thief.y <= exit.y + exit.h) {
        state.won = true;
      }
    }
  }

  // guards
  for (let i = 0; i < state.guards.length; i++) {
    const g = state.guards[i];
    if (g.active === false || g.state === 'idle') { g.state = 'patrol'; g.active = true; }
    if (lockdownT > 0) {
      g.state = 'CHASE';
      moveToward(g, thief.x, thief.y, CONFIG.guardSpeedChase !== undefined ? CONFIG.guardSpeedChase : 260, dt, walls);
    } else if (g.state === 'PATROL') {
      patrol(g, state, level, walls, dt);
    } else if (g.state === 'INVESTIGATE') {
      if (state.caught) continue;
      if (g.investigateT > 0) {
        g.investigateT -= dt;
        moveToward(g, g.targetX, g.targetY, CONFIG.guardSpeedInvestigate !== undefined ? CONFIG.guardSpeedInvestigate : 150, dt, walls);
        if (g.investigateT <= 0 || (Math.abs(g.targetX - g.x) < 10 && Math.abs(g.targetY - g.y) < 10)) { g.state = 'RETURN'; }
      } else { g.state = 'RETURN'; }
    } else if (g.state === 'RETURN') {
      moveToward(g, g.homeX, g.homeY, CONFIG.guardSpeedInvestigate !== undefined ? CONFIG.guardSpeedInvestigate : 150, dt, walls);
      if (Math.abs(g.homeX - g.x) < 12 && Math.abs(g.homeY - g.y) < 12) { g.state = 'PATROL'; }
    } else if (g.state === 'CHASE') {
      // not in lockdown but still chasing; handled by alert logic below
      if (!(g.alert && g.alertTarget)) { g.state = 'RETURN'; }
      else { moveToward(g, g.alertTargetX, g.alertTargetY, CONFIG.guardSpeedChase !== undefined ? CONFIG.guardSpeedChase : 260, dt, walls); if (Math.hypot(g.alertTargetX - g.x, g.altTargetY - g.y) < 30) g.state = 'RETURN'; }
    } else if (g.state === 'PAUSE') {
      if (state.elapsed >= (g.pausedUntil || 0)) { g.state = 'RETURN'; }
    }
  }

  // cameras
  let seenNow = false;
  for (const c of state.cameras) {
    if (lockdownT > 0) {
      c.ang = Math.atan2(thief.y - c.y, thief.x - c.x);
    } else {
      c.ang = c.base + Math.sin(state.atkT * 2 * Math.PI / (CONFIG.cameraSweepPeriod !== undefined ? CONFIG.cameraSweepPeriod : 3.2) + c.phase) * (CONFIG.cameraSweep !== undefined ? CONFIG.cameraSweep : 55) * Math.PI / 180;
    }
    if (mode === 'play') {
      const rate = viewRate(thief, c.x, c.y, c.ang, (CONFIG.cameraRange !== undefined ? CONFIG.cameraRange : 260), (CONFIG.cameraHalfAngle !== undefined ? CONFIG.cameraHalfAngle : 28) * Math.PI / 180, shadows, walls, 'camera');
      if (rate > state.seenRate) { state.seenRate = rate; state.seenType = 'camera'; }
      if (rate > 0) { seenNow = true; }
    }
  }

  // guards vision
  for (let i = 0; i < state.guards.length; i++) {
    const g = state.guards[i];
    if (g.active === false || g.state === 'idle') { g.state = 'patrol'; g.active = true; }
    if (mode === 'play') {
      const rate = viewRate(thief, g.x, g.y, g.facing, (CONFIG.guardVisionRange !== undefined ? CONFIG.guardVisionRange : 230), (CONFIG.guardVisionHalfAngle !== undefined ? CONFIG.guardVisionHalfAngle : 32) * Math.PI / 180, shadows, walls, 'guard');
      if (rate > state.seenRate) { state.seenRate = rate; state.seenType = 'guard'; state.seenGuard = i; }
      if (rate > 0) { seenNow = true; if (g.state === 'PATROL' || g.state === 'INVESTIGATE' || g.state === 'RETURN') g.state = 'CHASE'; }
    }
  }

  if (mode === 'play') {
    if (seenNow && state.seenRate > 0) {
      if (state.timesSpotted === 0) { state.timesSpotted++; }
      state.recentlySpotted = true;
      state.seenTime = state.elapsed;
      state.seenW = state.seenRate;
      state.seenWasGuard = state.seenType === 'guard';
      state.alarm = Math.min(100, state.alarm + state.seenRate * dt * 3.0);
      if (state.seenType === 'guard' && state.seenGuard != null) {
        const g = state.guards[state.seenGuard];
        if (g) { g.investigateT = 1.5; g.targetX = thief.x; g.targetY = thief.y; g.state = 'CHASE'; }
      }
    } else {
      state.seenTime = state.elapsed;
      state.recentlySpotted = false;
      state.seenW = 0;
    }
    if (!state.recentlySpotted) {
      state.alarm = Math.max(0, state.alarm - (CONFIG.alarmFall !== undefined ? CONFIG.alarmFall : 18) * dt);
    }
    if (state.alarm > state.alarmPeak) state.alarmPeak = state.alarm;
    if (state.alarmPeak >= 50) state.ghost = false;
    if (state.alarm >= 100) {
      state.lockdownUntil = state.elapsed + (CONFIG.lockdownDuration !== undefined ? CONFIG.lockdownDuration : 6);
      state.lockdownRise = true;
      state.alarmsTripped += 1;
    }
    if (state.lockdownUntil && state.elapsed >= state.lockdownUntil) { state.lockdownRise = false; state.lockdownUntil = 0; }
  }

  // coins
  if (state.thrownCoins && state.thrownCoins.length) {
    const coins = state.thrownCoins;
    for (const c of coins) {
      c.t += dt;
      const dur = 0.5;
      if (c.t >= dur) {
        if (!c.landed) {
          c.x = c.tx; c.y = c.ry;
          c.landed = true;
          for (const g of state.guards) {
            const dx = g.x - c.x, dy = g.y - c.y;
            if (Math.hypot(dx, dy) <= (CONFIG.coinInfluence !== undefined ? CONFIG.coinInfluence : 240)) {
              g.state = 'INVESTIGATE'; g.investigateT = 4; g.targetX = c.x; g.targetY = c.y;
            }
          }
        }
      } else {
        const k = c.t / dur;
        c.x = c.fx + (c.tx - c.fx) * k;
        c.y = c.fy + (c.ty - c.fy) * k;
      }
    }
    // cleanup landed? keep for 1s no remove; just cap
    if (coins.length > 80) coins.splice(0, coins.length - 80);
  }
  if (state.peakSeen && state.peakSeen > state.seenW) state.peakSeen = state.peakSeen * 0.99;

  // coins at start of play (thrown) are handled via input in caller? No coins not thrown here.

  // particles
  let ps = state.particles;
  if (!ps) ps = state.particles = [];
  for (let i = ps.length - 1; i >= 0; i--) {
    const p = ps[i];
    p.t += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.98; p.vy *= 0.98;
    if (p.t >= p.life) ps.splice(i, 1);
  }
  if (ps.length > 90) ps.splice(0, ps.length - 90);

  // update state.atkT and state.shake_decay, config.phase handling.
  state.atkT += dt;
  if (state.shake > 0) { state.shake *= 0.9; if (state.shake < 0.2) state.shake = 0; }

  // set mode based on flags
  if (state.won && mode === 'play') { state.won = false; CONFIG.phase = 'clear'; }
  if (state.caught && mode === 'play') { state.caught = false; CONFIG.phase = 'caught'; }
}

function mouseLike(state, walls, level) {
  // attract/title: target nearest untaken loot, else exit.
  let target = null;
  let best = Infinity;
  if (state.quotaMet == null) state.quotaMet = null;
  state.quotaMet = (state.lootTaken >= level.quota);
  const thief = state.thief;
  if (!state.quotaMet) {
    for (const l of state.loot) {
      if (l.taken) continue;
      const d = (l.x - thief.x) * (l.x - thief.x) + (l.y - thief.y) * (l.y - thief.y);
      if (d < best) { best = d; target = { x: l.x, y: l.y, loot: l, dist: Math.sqrt(d) }; }
    }
  }
  if (target) {
    const dx = target.x - thief.x, dy = target.y - thief.y;
    const len = Math.hypot(dx, dy) || 1;
    const grabRange = target.loot.kind === 'painting' ? 30 : 36;
    const near = Math.hypot(dx, dy) <= grabRange;
    if (near) {
      // nudge small to counter dash CD jitter, set sneak
      return { x: (Math.random() < 0.5 ? 0 : 0), y: 0, dash: false, grab: true };
    }
    return { x: dx / len, y: dy / len, dash: Math.hypot(dx, dy) > 400 && target.dist > 200, grab: false };
  } else {
    // heading to exit
    const ex = level.exit.x + level.exit.w * 0.5;
    const ey = level.exit.y + level.exit.h * 0.5;
    let dx = ex - thief.x, dy = ey - thief.y;
    const len = Math.hypot(dx, dy) || 1;
    return { x: dx / len, y: dy / len, dash: Math.hypot(dx, dy) > 500, grab: false };
  }
}

function configVal(name, fallback) {
  if (CONFIG[name] !== undefined) return CONFIG[name];
  return fallback;
}

function pushOutRect(thief, w, r) {
  const cx = Math.max(w.x, Math.min(thief.x, w.x + w.w));
  const cy = Math.max(w.y, Math.min(thief.y, w.y + w.h));
  const dx = thief.x - cx, dy = thief.y - cy;
  const d2 = dx * dx + dy * dy;
  if (d2 < r * r) {
    const d = Math.sqrt(d2) || 0.0001;
    const nx = dx / d, ny = dy / d;
    thief.x = cx + nx * r;
    thief.y = cy + ny * r;
  }
}

function moveToward(g, tx, ty, spd, dt, walls) {
  const dx = tx - g.x, dy = ty - g.y;
  const len = Math.hypot(dx, dy);
  if (len > 1e-4) {
    g.facing = Math.atan2(dy, dx);
    g.x += (dx / len) * spd * dt;
    g.y += (dy / len) * spd * dt;
  }
  const wr = 16;
  for (const w of (walls || [])) { pushOutRect(g, w, wr); }
}

function patrol(g, state, level, walls, dt) {
  const wps = level.waypoints || [];
  if (!wps.length) return;
  if (g.wp == null) g.wp = 0;
  const wp = wps[g.wp % wps.length];
  const dx = wp.x - g.x, dy = wp.y - g.y;
  const len = Math.hypot(dx, dy);
  const spd = CONFIG.guardSpeedPatrol !== undefined ? CONFIG.guardSpeedPatrol : 95;
  if (len < 8) {
    g.wp = (g.wp + 1) % wps.length;
  } else {
    g.facing = Math.atan2(dy, dx);
    g.x += (dx / len) * spd * dt;
    g.y += (dy / len) * spd * dt;
  }
  const wr = 16;
  for (const w of (walls || [])) { pushOutRect(g, w, wr); }
}

function segIntersectsRect(x1, y1, x2, y2, rect) {
  if (x1 >= rect.x && x1 <= rect.x + rect.w && y1 >= rect.y && y1 <= rect.y + rect.h) return true;
  if (x2 >= rect.x && x2 <= rect.x + rect.w && y2 >= rect.y && y2 <= rect.y + rect.h) return true;
  const X1 = rect.x, Y1 = rect.y, X2 = rect.x + rect.w, Y2 = rect.y + rect.h;
  return segSeg(x1, y1, x2, y2, X1, Y1, X2, Y1) || segSeg(x1, y1, x2, y2, X2, Y1, X2, Y2) ||
         segSeg(x1, y1, x2, y2, X1, Y2, X2, Y2) || segSeg(x1, y1, x2, y2, X1, Y1, X2, Y2);
}

function segSeg(x1, y1, x2, y2, x3, y3, x4, y4) {
  const r1 = orient(x1, y1, x2, y2, x3, y3) * orient(x1, y1, x2, y2, x4, y4);
  const r2 = orient(x3, y3, x4, y4, x1, y1) * orient(x3, y3, x4, y4, x2, y2);
  return r1 < 0 && r2 < 0 ||
         (r1 === 0 && onSeg(x1, y1, x2, y2, x3, y3)) ||
         (r2 === 0 && onSeg(x3, y3, x4, y4, x1, y1)) ||
         (r1 === 0 && onSeg(x1, y1, x2, y2, x4, y4)) ||
         (r2 === 0 && onSeg(x3, y3, x4, y4, x2, y2));
  function orient(ax, ay, bx, by, cx, cy) { return (by - ay) * (cx - ax) - (bx - ax) * (cy - ay); }
  function onSeg(ax, ay, bx, by, px, py) { return Math.min(ax, bx) <= px && px <= Math.max(ax, bx) && Math.min(ay, by) <= py && py <= Math.max(ay, by); }
}

function shadowAt(shadows, x, y) {
  for (const s of shadows) {
    if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) return true;
  }
  return false;
}

function viewRate(obj, ex, ey, ang, range, half, shadows, walls, kind) {
  const dx = obj.x - ex, dy = obj.y - ey;
  const d2 = dx * dx + dy * dy;
  if (d2 > range * range) return 0;
  const a = Math.atan2(dy, dx);
  let da = a - ang;
  while (da > Math.PI) da -= 2 * Math.PI;
  while (da < -Math.PI) da += 2 * Math.PI;
  // handle wrap for half near pi: use absolute mod
  let ad = Math.abs(da);
  if (ad > Math.PI) ad = 2 * Math.PI - ad;
  if (ad > half + 0.05) return 0;
  // LOS
  for (const w of walls) {
    // skip very small rects (rugs) and shadows
    if (w.w < 4 && w.h < 4) continue;
    if (segIntersectsRect(ex, ey, obj.x, obj.y, w)) {
      // if the whole segment is inside this rect? block only if not fully inside near endpoints
      // Simple: block if rect is not the rect containing both points or near the start
      return 0;
    }
  }
  // rate
  let rate;
  if (kind === 'camera') rate = CONFIG.detectionCamera !== undefined ? CONFIG.detectionCamera : 70;
  else rate = (obj.sneak ? (CONFIG.detectionSneak !== undefined ? CONFIG.detectionSneak : 30) : (CONFIG.detectionStand !== undefined ? CONFIG.detectionStand : 55));
  const d = Math.sqrt(d2);
  rate *= (1 - (d / range) * 0.5);
  if (shadowAt(shadows, obj.x, obj.y)) rate *= (CONFIG.shadowMultiplier !== undefined ? CONFIG.shadowMultiplier : 0.4);
  return Math.max(0, rate);
}

function startChannel(state, l) {
  state.thief.channel = { kind: l.kind, l: l };
  l.t = 0;
}

function cancelChannel(state) {
  if (state.thief.channel) { state.thief.channel = null; }
}

function takeLoot(state, l) {
  if (l.taken) return;
  l.taken = true;
  state.lootTaken += 1;
  let pts = 0;
  if (l.kind === 'painting') pts = CONFIG.lootPainting !== undefined ? CONFIG.lootPainting : 250;
  else if (l.kind === 'safe') pts = CONFIG.lootSafe !== undefined ? CONFIG.lootSafe : 500;
  else if (l.kind === 'core') pts = CONFIG.lootVault !== undefined ? CONFIG.lootVault : 1000;
  else pts = 250;
  state.score += Math.round(pts);
  state.coins += 1;
  state.best = state.best || 0;
  for (let i = 0; i < 14; i++) {
    const a = Math.random() * 6.283;
    state.particles.push({ x: l.x, y: l.y, vx: Math.cos(a) * (30 + Math.random() * 90), vy: Math.sin(a) * (30 + Math.random() * 90), t: 0, life: 0.7 + Math.random() * 0.5, kind: l.kind, size: 2 + Math.random() * 3 });
  }
  state.shake = Math.max(state.shake, l.kind === 'core' ? 0.9 : 0.4);
  if (state.thief.channel && state.thief.channel.l === l) state.thief.channel = null;
}
