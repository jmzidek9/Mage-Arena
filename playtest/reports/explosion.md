# Explosion playtest report

**Verdict:** strong, readable demolition kit, but Carpet Bomb feeds itself and makes boss damage the second-worst outlier after storm/spirit. Visual noise (whiteouts, smoke wall) at the big end.

| | value |
|---|---|
| Crowd dps (kit, wave-5 x8) | **282.1** (1.25x median 225.1) |
| Boss dps (Tyrant) | **298.8** (2.22x median 134.3) |
| Kit hp lost / healed | 303 / 0 (lowest hp 697) |
| Worst frame cost | Grenade 3254.9 ms worst (first-cast hitch), 157.7 ms avg Sticky Bomb; peak 910 particles / 252 fx objects (Carpet Bomb) |

Notes: the harness was run under 30-way contention (first run timed out on page load, the retry passed), so absolute frame ms are noisy; relative particle and fx-object counts are the reliable perf signal. Median from playtest/out/median.json covers 19 elements.

## Root balance issue: Carpet Bomb recharges itself
Ult casts in 30 s: **7 (kit), 9 (boss)**, ult ready 100% of the time (metrics.json `cooldownReadyPct.Carpet Bomb: 100`). Cause: `js/sim.js:363` `addUlt(p, amount / (900 * (1 + .1 * (S.wave - 1))))` charges ult from every hit, including the ult's own. One Carpet Bomb into a crowd does 14 x 130 raw dmg (radius 4.5 x 1.2 passive = 5.4 m, bombs 2 m apart so any target sits in ~5 blasts); at wave 5 the divisor is 1260, so one run that lands ~1300+ dmg refunds a full ult. In the move test alone it did 454 dmg / 6 kills into the 6-pack, ultDmg 454 vs median 16.

## LMB: Grenade
- **[visual]** Frame 22 (`m0_Grenade_022.jpg`) the blast overexposes the whole target pack to white silhouettes for a moment; frame 45 the fireball is already gone and only faint smoke remains. Impact reads, but it is a flash, not a fireball. Proposal: in `blastFx` (elements.js:221) lower the flash by passing a smaller k to boomFx for the small blast: `boomFx(e.x, e.y, e.z, e.r, 0xffa020, .8 * k)` -> `.65 * k` and raise the fire-puff life `smokeFx(..., 0xffa040, .55, 5, 2.2)` -> `.75` so the orange ball lingers instead of the white pop. Impact med, effort S.
- **[balance]** 63 dmg into the pack per throw (21 x ~3 targets), 47 casts / 30 s. Healthy for a spammable LMB. No change.
- **[performance]** worst frame 3254.9 ms on the first cast is a one-time shader/model compile hitch (Sticky 2558.5 ms, same pattern; later moves 177-377 ms). Proposal: prewarm `explosion__grenade`, `explosion__sticky`, `explosion__bomb` models at element select. Impact med, effort M.

## RMB: Sticky Bomb
- **[feel]** Move test measured **0 dmg** in the 74-frame window: travel ~0.3 s + stuck fuse `s.fuse = Math.min(s.fuse, 1.2)` (elements.js:1554) means the blast lands after the capture window (`m1_StickyBomb_074.jpg` shows no blast yet). In play this reads as sluggish for a 3 s cd move. Proposal: `Math.min(s.fuse, 1.2)` -> `Math.min(s.fuse, .9)`. Keeps the "stick, then boom" idea and still leaves time to stack a second bomb. Impact med, effort S.
- **[visual]** `m1_StickyBomb_045.jpg`: the primed glyphs on enemies are clear and orange, distinct from fire. Good. No change.
- **[balance]** 10 casts / 30 s (cd-capped), merge stacking works. No change.

## Q: Rocket Jump
- **[feel]** 0 dmg in the move test: the 4.2 m blast (3.5 x 1.2) is at your feet while the pack is ahead, so the damage only lands when cast inside a crowd. Fine as a mobility move, but the jump then carries you forward (`vx: f.x * 16`, T .45) straight into the pack: `m2_RocketJump_074.jpg` is the camera clipped inside a monster model (full-screen orange/purple). Proposal: forward speed `f.x * 16, vz: f.z * 16` -> `* 12` so you land at the edge of a pack 7-9 m away rather than inside it. Impact med, effort S.
- **[visual]** `m2_RocketJump_022.jpg` shows the arena from the air with the scorch ring below; readable. 539 peak particles for one blast is the highest per-blast of the kit (blastFx 1.1 plus `mo.trail`). No change needed.

## E: Proximity Mines
- **[visual]** `m3_ProximityMines_010.jpg`: the four mines fly in an arc from the player's own head (`from = V(n.fx0, 1.4, n.fz0)`, arc `Math.sin(k * PI) * 2.5`, elements.js:1572-1573) and fill the top third of the screen as huge dark discs. Proposal: start height `1.4` -> `1.0` and arc `* 2.5` -> `* 1.5`, so they lob low in front of the camera. Impact med, effort S.
- **[visual]** `m3_ProximityMines_074.jpg`: the chain reaction reads great: multiple overlapping blasts, debris, scorch. Clear identity.
- **[balance]** 311 dmg / 4 kills per cast into the pack, 3 casts / 30 s. In band for a 12 s setup move. No change.
- **[performance]** 799 peak particles, 174 fx objects (4 blasts within ~0.5 s). Acceptable; it falls out of the Carpet Bomb fix below if blastFx is trimmed.

## R: Carpet Bomb
- **[balance]** The outlier (see root issue). Proposals, both needed:
  1. elements.js:1578 `130 * c.dmg` -> `75 * c.dmg`. A boss standing in ~5 overlapping blasts still takes ~375 per run; crowd runs still wipe wave-5 trash.
  2. Stop ult damage from charging the ult: in the Carpet Bomb boomAt opts add `noUlt: true`, and in js/sim.js:363 guard `if (!o.noUlt) addUlt(...)` (blast() needs to forward the flag to damage()). This is a shared hook; other ults (fire 249, water 328, steel 199 ultDmg) benefit from the same flag.
  Expected result: ~2-3 ults per 30 s instead of 7-9; crowd ~0.95-1.05x, boss ~1.1-1.3x median. Impact high, effort S (1) / M (2).
- **[visual]** `m4_CarpetBomb_045.jpg`: a solid orange-brown smoke wall covers the whole centre of the screen; you cannot see the targets for ~1 s. `boss_1199.jpg` is a full white-out (overlapping flashes at point-blank). Proposal: `boom: e => blastFx(e, 1.2)` -> `blastFx(e, .8)` for Carpet Bomb, and in blastFx scale the grey smoke count `Math.round(4 + e.r * 1.5)` -> `Math.round(2 + e.r * .6)`. 14 bombs already read as a carpet; fewer puffs per bomb keeps the line visible. Impact high, effort S.
- **[performance]** Highest of the kit: 910 peak particles, 252 fx objects (14 x blastFx = 3 bursts + 3 smokeFx + debris + scar each). The blastFx(.8) + smoke-count change above should cut fx objects by roughly 40%. Impact med, effort S.
- **[visual]** `m4_CarpetBomb_074.jpg`: scorch decals (`scarFx(e.x, e.z, e.r * .6, ...)`) merge into one big black floor patch; reads fine as aftermath.

## Passive: Demolitions
- **[balance]** `aoe x1.2` (sim.js:95) and `st: { kb: 1.5 }`. It multiplies every radius above, which is why Carpet Bomb overlaps so heavily. Keep it as is: with the Carpet Bomb nerf, the passive becomes a fair identity bonus. No change.
- **[feel]** The bigger radius is visible in the screenshots (rings clearly wider than the enemy footprint). Good.

## Top 3
1. Carpet Bomb dmg `130 -> 75` (elements.js:1578): biggest single lever on the 2.22x boss dps.
2. Ult damage must not charge the ult (`noUlt` flag in Carpet Bomb's boomAt, guard at sim.js:363): stops 7-9 ults per 30 s.
3. Carpet Bomb visuals: `blastFx(e, 1.2) -> .8` and grey smoke `4 + e.r * 1.5 -> 2 + e.r * .6`: fixes the smoke wall / white-out and cuts 910 particles / 252 fx objects.
