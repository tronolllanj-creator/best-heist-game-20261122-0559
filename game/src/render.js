import { PALETTE, LEVELS } from './config.js';

function cone(ctx, x, y, ang, half, range, color) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  const steps = 24;
  for (let i = 0; i <= steps; i++) {
    const a = ang - half + (i / steps) * (half * 2);
    const px = x + Math.cos(a) * range;
    const py = y + Math.sin(a) * range;
    if (i === 0) ctx.lineTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.18;
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawFloor(ctx, W, H) {
  const s = 64;
  for (let y = 0; y < H; y += s) {
    for (let x = 0; x < W; x += s) {
      const c = ((x / s) + (y / s)) % 2 === 0 ? PALETTE.floor : PALETTE.floorAlt;
      ctx.fillStyle = c;
      ctx.fillRect(x, y, s, s);
    }
  }
}

function drawRects(ctx, rects, color) {
  ctx.fillStyle = color;
  for (const r of rects) ctx.fillRect(r.x, r.y, r.w, r.h);
}

function drawWalls(ctx, walls) {
  // dark offset shadow
  ctx.fillStyle = PALETTE.shadow;
  for (const w of walls) ctx.fillRect(w.x + 5, w.y + 5, w.w, w.h);
  // wall fill
  ctx.fillStyle = PALETTE.wall;
  for (const w of walls) ctx.fillRect(w.x, w.y, w.w, w.h);
  // top strip
  ctx.fillStyle = PALETTE.wallTop;
  for (const w of walls) ctx.fillRect(w.x, w.y, w.w, 8);
}

function drawExit(ctx, exit, lootTaken, quota) {
  const open = lootTaken >= quota;
  ctx.fillStyle = open ? PALETTE.exit : '#173b23';
  ctx.fillRect(exit.x, exit.y, exit.w, exit.h);
  ctx.strokeStyle = open ? PALETTE.exit : '#0d2416';
  ctx.lineWidth = 3;
  ctx.strokeRect(exit.x + 2, exit.y + 2, exit.w - 4, exit.h - 4);
  ctx.fillStyle = open ? PALETTE.text : '#6fae84';
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('EXIT', exit.x + exit.w / 2, exit.y + exit.h / 2);
}

function drawLoot(ctx, loot) {
  for (const L of loot) {
    if (L.taken) continue;
    if (L.kind === 'painting') {
      ctx.fillStyle = '#caa24a';
      ctx.fillRect(L.x - L.w / 2, L.y - L.h / 2, L.w, L.h);
      ctx.fillStyle = PALETTE.panel;
      ctx.fillRect(L.x - L.w / 2 + 3, L.y - L.h / 2 + 3, L.w - 6, L.h - 6);
      ctx.fillStyle = PALETTE.loot;
      ctx.beginPath();
      const cx = L.x, cy = L.y, R = Math.min(L.w, L.h) * 0.28;
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI / 5);
        const rr = i % 2 === 0 ? R : R * 0.45;
        const px = cx + Math.cos(a) * rr;
        const py = cy + Math.sin(a) * rr;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    } else if (L.kind === 'safe') {
      const r = Math.min(L.w, L.h) / 2;
      ctx.fillStyle = '#52565a';
      ctx.beginPath();
      ctx.arc(L.x, L.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PALETTE.safe;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(L.x, L.y);
      ctx.lineTo(L.x + Math.cos(-Math.PI / 4) * r * 0.6, L.y + Math.sin(-Math.PI / 4) * r * 0.6);
      ctx.stroke();
      if (L.t > 0) {
        const w = L.w || 40;
        const p = Math.max(0, Math.min(1, L.t / (L.channelMax || 1)));
        ctx.fillStyle = PALETTE.panel;
        ctx.fillRect(L.x - w / 2, L.y + r + 4, w, 6);
        ctx.fillStyle = PALETTE.safe;
        ctx.fillRect(L.x - w / 2, L.y + r + 4, w * p, 6);
      }
    } else if (L.kind === 'vault') {
      const r = Math.min(L.w, L.h) / 2;
      ctx.fillStyle = '#484c50';
      ctx.beginPath();
      ctx.arc(L.x, L.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PALETTE.safe;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(L.x, L.y, r * 0.7, 0, Math.PI * 2);
      ctx.stroke();
      if (L.t > 0) {
        const w = L.w || 60;
        const p = Math.max(0, Math.min(1, L.t / (L.channelMax || 1)));
        ctx.fillStyle = PALETTE.panel;
        ctx.fillRect(L.x - w / 2, L.y + r + 5, w, 7);
        ctx.fillStyle = PALETTE.safe;
        ctx.fillRect(L.x - w / 2, L.y + r + 5, w * p, 7);
      }
    }
  }
}

function drawCameras(ctx, cameras) {
  for (const c of cameras) {
    cone(ctx, c.x, c.y, c.ang, c.half, c.range, PALETTE.coneCamera);
    ctx.fillStyle = PALETTE.camera;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 7, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGuards(ctx, guards) {
  for (const g of guards) {
    cone(ctx, g.x, g.y, g.facing, g.half, g.range, PALETTE.coneGuard);
    ctx.fillStyle = PALETTE.guard;
    ctx.beginPath();
    ctx.arc(g.x, g.y, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.guardDark;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = PALETTE.guardDark;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x + Math.cos(g.facing) * 14, g.y + Math.sin(g.facing) * 14);
    ctx.stroke();
    if (g.alert) {
      ctx.fillStyle = g.alert === 1 ? PALETTE.alarmMid : PALETTE.alarmHigh;
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(g.alert === 1 ? '?' : '!', g.x, g.y - 14);
    }
  }
}

function drawCoins(ctx, coins) {
  if (!coins) return;
  ctx.fillStyle = '#e6c351';
  for (const c of coins) {
    ctx.beginPath();
    ctx.arc(c.x, c.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawThief(ctx, thief) {
  ctx.fillStyle = PALETTE.shadow;
  ctx.beginPath();
  ctx.ellipse(thief.x, thief.y + 9, 11, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.thief;
  ctx.beginPath();
  ctx.arc(thief.x, thief.y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.thiefDark;
  ctx.lineWidth = 2;
  ctx.stroke();
  if (thief.sneak) {
    ctx.strokeStyle = PALETTE.thiefDark;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(thief.x, thief.y, 17, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawParticles(ctx, particles) {
  for (const p of particles) {
    const a = Math.max(0, Math.min(1, p.life / p.max));
    ctx.globalAlpha = a;
    ctx.fillStyle = p.col || PALETTE.text;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function render(ctx, state, W, H) {
  const lvl = LEVELS[state.level];
  drawFloor(ctx, W, H);
  drawRects(ctx, lvl.rugs, PALETTE.rug);
  drawRects(ctx, lvl.shadows, PALETTE.shadow);
  drawWalls(ctx, lvl.walls);
  drawExit(ctx, lvl.exit, state.lootTaken, state.quota);
  drawLoot(ctx, state.loot);
  drawCameras(ctx, state.cameras);
  drawGuards(ctx, state.guards);
  drawCoins(ctx, state.thrownCoins);
  drawThief(ctx, state.thief);
  drawParticles(ctx, state.particles);
}
