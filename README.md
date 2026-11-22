# VELVET VAULT: MIDNIGHT HEIST

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/tronolllanj-creator/best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/tronolllanj-creator/best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

> **make.fun** — best-heist-game-20261122-0559
> **Repo:** [`tronolllanj-creator/best-heist-game-20261122-0559`](https://github.com/tronolllanj-creator/best-heist-game-20261122-0559)

[VHF badge: best-heist-game-20261122-0559](https://make.fun/game/best-heist-game-20261122-0559)

---

## What it is

**VELVET VAULT: MIDNIGHT HEIST** is an original, top-down 2-D stealth heist game drawn entirely on a `<canvas>` element. You are a thief crossing a string of high-security night buildings — a gallery, a vault, and a penthouse — snatching paintings, cracking safes, and lifting vault cores while dodging patrolling guards and sweeping surveillance cameras.

It is **completely original** and is **not** a re-skin of any commercial title or any starter kit. It is built as **plain ES modules** — no build step, no bundler, no library, no network calls, no `Date`, no `Math.random` in the simulation. Everything is deterministic and driven by a single seeded generator.

- **Top-down 2-D**, canvas rendering, fixed logical field of **1280×720**, scaled to the window.
- **Fixed simulation step.** 0–300 ms of idle wait, or:
    - **WASD / Arrow keys** — move (normal speed).
    - **Shift** (hold) — **sneak** (half speed, quieter, lower detection).
    - **Space** — **dash / roll** burst (0.14 s, 300 ms afterwards).
    - **E** — **grab** loot when near; **hold** E to **crack** a safe or vault core.
    - **Click / LMB** — **throw a coin** (3 per level) to distract guards.
    - **P** or **Esc** — **pause**.
    - **Enter** or **click** — start / restart from a screen.
    - **R** — restart on end screens.
    - **M** — mute.

## How it plays

Each heist is a single room with walls, cover blocks, rugs, shadow zones, loot, guard waypoints, and camera mounts. Your job: **collect enough loot to meet the quota, then reach the exit** before the alarm locks you down.

### The three heists

| # | Name | Guards | Cameras | Loot | Quota | Exit |
|---|------|--------|---------|------|-------|------|
| 1 | **THE GALLERY** | 2 | 2 | 3 paintings + 1 safe | 4 (all loot) | north-east door |
| 2 | **THE VAULT** | 3 | 3 | 2 safes + 1 vault core + 2 paintings | 5 | vault door |
| 3 | **THE PENTHOUSE** | 4 | 4 | 3 paintings + 2 safes + 1 vault core | 6 | penthouse door |

The **exit opens only when the quota is met**. Reaching it clears the level and pays a level-clear bonus plus a time bonus. Clearing level 3 wins the game and shows a full score breakdown.

### Vision cones

- **Guards** have a facing direction, a **cone range of 230** and a **half-angle of 32°**. They patrol waypoints and cycle through states: `patrol → investigate → chase → return`.
- **Cameras** are fixed to the walls and **rotate their cones back and forth** with a **range of 260** and a **half-angle of 28°**.
- **Line of sight** is blocked by walls (segment-vs-rectangle tests). You are only detected when you are *inside a cone* **and** line of sight is *clear*.

### The alarm meter

The alarm is the heart of the tension. It rises while you are seen and falls while you are hidden.

- **Standing in a guard cone:** +55/s
- **Sneaking in a guard cone:** +30/s
- **In a camera cone:** +70/s
- **Closer is faster:** rate scales by `1 − (dist/range) × 0.5`
- **In a shadow zone:** detection rate ×0.4
- **Hidden (unseen for 1.5 s):** alarm falls 18/s

**At 100 the alarm triggers LOCKDOWN for 6 s:** every guard chases you, every camera locks onto your position, and the alarm holds at 100 before decaying. If a guard touches you **while the alarm is ≥ 50**, you are **CAUGHT** (game over). If a guard touches you **while the alarm is < 50**, you are shoved back, the alarm jumps **+25**, and the guard pauses 1 s.

### Coins

You carry **3 coins per level**. Click to throw one; it lands at a point and any guard within **240 units** of the landing spot will **investigate it for 4 s** (a `?` floats above them). Coins are your primary tool for repositioning guards away from a safe or a camera blind spot.

### Loot & grabbing

- **Paintings** — instant grab with **E** when you are close.
- **Safes** — hold **E** to **crack** for **2.0 s**.
- **Vault cores** — hold **E** to **crack** for **3.0 s**.
- **Moving or taking a hit cancels the channel.** Stay put and keep the hold, or lose progress.

### Dash

The **Space** dash/roll is a fast burst of movement that makes you harder to pin down — but it is **noisy**: if *any* guard or camera can see the thief during the dash, the alarm jumps **+12**. Dash to reposition quickly behind cover, not to cross a camera's cone.

### Shadow zones & cover

Rugs, drop-ceiling shadow zones, and blocks of cover break line of sight. In a **shadow zone** your detection rate is cut to 40%, and hiding behind a block puts you fully out of cone until you leave cover and re-enter a cone with clear line of sight.

## Controls (summary)

| Key / Input | Action |
|-------------|--------|
| **W/A/S/D** or **Arrow Keys** | Move |
| **Shift** (hold) | Sneak (half speed, quieter) |
| **Space** | Dash / roll burst |
| **E** | Grab loot / hold to crack a safe or vault core |
| **Click / LMB** | Throw a coin (3 per level) |
| **P** / **Esc** | Pause |
| **Enter** / **Click** | Start, or restart from a screen |
| **R** | Restart on end screens |
| **M** | Mute |

## Rules

1. **Meet the quota** (all loot on level 1; a partial set on levels 2–3) to unlock the exit.
2. **Don't let the alarm hit 100** — LOCKDOWN sends every guard and camera after you for 6 s.
3. **A guard touching you at alarm ≥ 50 = CAUGHT.** At alarm < 50 you're shoved and the alarm spikes +25.
4. **Cracking is fragile.** A safe (2.0 s) or vault core (3.0 s) is interrupted by movement or a hit.
5. **Coins are limited.** Spend them to lure guards away from your crack.
6. **Dash is loud.** A dash seen by any cone adds +12 alarm.
7. **Reach the open exit** to clear the level and bank your score + time bonus.

## Loot values & score

| Item | Points |
|------|--------|
| Painting | 250 |
| Safe | 500 |
| Vault core | 1000 |
| Level clear | 500 × level number |
| Time bonus | (par time − elapsed seconds, min 0) × 10 |
| Ghost bonus | +1000 if the alarm never exceeded 50 the whole level |

Score is tracked in the HUD (top-left: **score + best**) and accumulated across the three heists. Stats tracked throughout the run: **lootTaken, timesSpotted, coinsThrown, alarmsTripped.**

**Best score** is saved to `localStorage` (wrapped in `try/catch` so the game still runs where storage is blocked).

## The palette

The whole game shares one hand-tuned night palette:

| Role | Hex |
|------|-----|
| floor | `#2a2118` |
| floorAlt | `#241c14` |
| wall | `#4a3b2c` |
| wallTop | `#6b563e` |
| shadow | `#0d0b09` |
| rug | `#5e2f2f` |
| thief | `#ffd94d` |
| thiefDark | `#8a6d1f` |
| guard | `#e05a4e` |
| guardDark | `#8f2f28` |
| camera | `#9fb4c7` |
| coneGuard | `rgba(224,90,78,0.28)` |
| coneCamera | `rgba(255,210,90,0.24)` |
| loot | `#f0c040` |
| safe | `#b8c4cc` |
| painting | `#c9a227` |
| alarmOk | `#59d867` |
| alarmMid | `#f0a040` |
| alarmHigh | `#e05a4e` |
| text | `#efe6d0` |
| muted | `#9a8f7a` |
| panel | `#12100d` |
| exit | `#59d867` |

## HUD

- **Top-left:** score + best.
- **Top-centre:** level name + loot `n / quota`.
- **Top-right:** labelled **ALARM** meter, coloured green → amber → red.
- **Bottom-left:** coin count + SNEAK indicator.
- **Bottom-centre:** context prompt (`E GRAB PAINTING`, `HOLD E CRACKING SAFE`, `EXIT OPEN`).
- **Banner:** stealth state — `HIDDEN` / `SPOTTED` / `LOCKDOWN`.
- A `!` floats above a guard that sees you; a `?` floats above an investigating guard.

## Screens

`title` (with attract mode running behind it) → `play` → `level clear` → `caught` / `win` (full score breakdown), plus a `paused` overlay. Screen shake fires on being caught.

## Sounds

Procedural **WebAudio** only — no audio files. Footstep tick, coin clink, grab chime, safe-crack clicks, spotted sting, alarm-siren blips, level-clear fanfare, caught thud, win arpeggio. Master gain 0.35. Toggle with **M**.

## Run instructions

There is **no build step** and **no dependencies**. It runs from static files.

### From the repo

```bash
# 1. Clone
 git clone https://github.com/tronolllanj-creator/best-heist-game-20261122-0559.git
 cd best-heist-game-20261122-0559

# 2. Serve the game/ folder with any static server
 #    pick one — Python, Node, or npx serve
 python3 -m http.server 8080
 # or:  npx serve game
```

Then open:

```
http://localhost:8080/game/
```

> **Note:** the game uses **ES modules** and **localStorage**, which require a proper origin. If you open `index.html` straight from the file system the page may fail to load modules — serve it over `http://` instead.

### File layout

```
game/
  index.html
  main.js          # entry point, runShot() staging, window hooks
  src/
    config.js      # palette + all 3 level layouts
    random.js      # seeded mulberry32 generator
    sim.js         # fixed-step simulation (thief, guards, cameras, alarm)
    render.js      # canvas renderer (scales 1280x720 to window)
    audio.js       # procedural WebAudio
    hud.js         # HUD + screens
    main.js        # game loop, input, state machine
```

### Screenshot staging

`main.js` exposes `runShot()` for deterministic captures. Query params:

```
?shot=start|play|vault|end&seed=N
```

- **start** — title over an 8 s attract play.
- **play** — level 1 staged mid-heist: thief mid-room, 2 guards with cones, 1 camera cone, 2 loot targets, alarm at 35, all in one frame.
- **vault** — level 2 staged at the vault core with 3 guards and cameras, alarm 55.
- **end** — thief placed in a guard cone at alarm 95, light autopilot until caught (or 60 s sim), freezes on the caught screen.

It paints twice, sets `window.__shotReady = true`, and freezes the sim; `window.onerror` sets `window.__shotError`.

### Code rules (this project)

- **ES modules only.** No imports except the game's own `./src` files.
- **No `fetch`, no network, no `Date`, no `Math.random` in the sim** — one **seeded mulberry32** generator drives every patrol jitter and particle.
- Object pools are plain arrays with swap-remove.
- Short comments, no dead code, no duplicated blocks.

---

## make.fun badge lines

For the [make.fun](https://make.fun) entry **best-heist-game-20261122-0559**:

- **Entry ID:** `best-heist-game-20261122-0559`
- **Repo:** [`tronolllanj-creator/best-heist-game-20261122-0559`](https://github.com/tronolllanj-creator/best-heist-game-20261122-0559)
- **Entry URL:** [`https://make.fun/game/best-heist-game-20261122-0559`](https://make.fun/game/best-heist-game-20261122-0559)
- **Badge (image):** `[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)`
- **Badge (markdown link):** `[make.fun · best-heist-game-20261122-0559](https://make.fun/game/best-heist-game-20261122-0559)`

---

*VELVET VAULT: MIDNIGHT HEIST — an original top-down canvas stealth heist. No build step, no library, no network. Just you, the night, and the alarm.*
