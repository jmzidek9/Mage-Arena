# Fire playtest report

**Verdict:** Strong, readable, on-theme kit sitting at the top of the target band. Balance can stay as it is. The real problems are visual: the ultimate's eruptions and the Flamethrower white-out the screen at close range.

| | value |
|---|---|
| Crowd dps (kit, 30 s, wave-5 x8) | **257.1** (73 kills, 273 hp lost, 0 healed) |
| Boss dps (Tyrant, 30 s) | **156.8** (539 hp lost) |
| x-median (19 elements: crowd 225.1 / boss 134.3) | **1.14x crowd / 1.17x boss** |
| Worst frame cost | Ring of Fire, 476 ms avg (Flamethrower worst single frame 7347 ms). Absolute ms are inflated because 30 harnesses ran at once, so compare moves only against each other. |

Note on per-move `dmg`: the move window is about 75 frames. Fire Brand's detonation (`later(1.2, ...)`) and Conflagration's eruptions (`later(1.55, ...)`) land at or after the end of that window. So `Fire Brand: 37` and `Conflagration: 249` leave out most of their real damage, and they are not balance signals. The kit and boss numbers include everything.

---

## LMB: Fireball (dmg 26 into pack, 170 ms avg, 339 particles, 27 fx)
- **[visual]** The best-looking move. The cast circle, the bright ball, a clean impact bloom with flame tongues (m0_Fireball_022), and embers that fade by frame 74 so the view clears (m0_Fireball_045/074). Readable, and clearly fire-orange, not yellow or white. **No change.** impact low.
- **[feel]** Flare (`hot` = 3 stacks) is hard to trigger when you only use Fireball, because each hit adds one burn (`st.dotStacks: 1`), so it takes three hits on one target within the burn duration. It works well after Fire Brand or Flamethrower, which is the intended combo. Possible change: show the third stack more clearly, e.g. in `fx.flare` raise `fireBoom(..., .8, true)` to `1.0`, so players learn the payoff. impact low, effort S.
- **[balance]** Fine. Fireball was cast 34 times in 30 s and its cooldown was ready 43% of the time, so it fills the gaps as it should. No change.

## RMB: Flamethrower (dmg 118, 381 ms avg, 7347 ms worst, 812 particles, 40 fx)
- **[visual] high.** From first person, the outer cone reads as a large pink translucent dome that covers the target area (m1_Flamethrower_003/010). At full heat the pack turns into white silhouettes and you can't see who is hurt or what is coming (m1_Flamethrower_045, m1_Flamethrower_074). Proposed changes in `chv.upd`:
  - `fade(u.outer, (.2 + heat * .12) * (mine ? .7 : 1))` -> `(mine ? .4 : 1)`
  - `fade(u.core, (.12 + heat * .3) * (mine ? .6 : 1))` -> `(mine ? .4 : 1)`
  - `u.outer.scale.set(3.2 + heat * .8, ...)` -> `2.6 + heat * .6`. This is the visible width only. The hit cone (`coneHits(p, 7.5, 50)`) stays the same.

  Effort S.
- **[performance]** The second-highest particle peak among fire moves (812), and the worst single frame (7347 ms). It emits `8 + heat * 6` flame particles every frame, plus 2 sparks. Proposed change: `for (let k = 0; k < 8 + heat * 6; k++)` -> `k < 6 + heat * 4`, and raise the size `rand(.28, .62)` -> `rand(.32, .7)` so the stream keeps its volume with about 30% fewer particles. impact med, effort S.
- **[balance]** Fine. The ramp (`1 + p.chT * .45`) rewards holding, and the cooldown was ready 44% of the time. No change.

## Q: Fire Brand (dmg 37 measured, see note; 386 ms avg, 883 particles = fire's highest, 30 fx)
- **[feel] med.** The 1.2 s fuse feels long next to a 0.5 s Fireball. In m2_FireBrand_074 the sigil is still hanging over the golem with nothing happening yet. Proposed change: `later(1.2, () => ...)` -> `later(.9, ...)`, and make the sigil `addFx(c, 1.2, ...)` -> `addFx(c, .9, ...)` to match. The flicker speeds up through `k`, so it still reads as counting down. impact med, effort S.
- **[performance]** It has the highest particle peak of the kit (883). The cost comes from `spread`: 15 trail emits plus a 16-particle burst for each enemy caught, so a 6-pack makes about 155 particles at once, on top of the frame's `fireBoom` at scale 1.25. Proposed change in `fx.spread`: `i <= 14` / `i / 14` -> `i <= 8` / `i / 8`, and `burst(b.x, b.y, b.z, 16, ...)` -> `10`. impact med, effort S.
- **[visual]** The burn overlays on the whole pack after detonation are very readable (m2_FireBrand_022/045). Keep.
- **[balance]** Its cooldown was ready 1% of the time, so it is always cast as soon as it's up. That is fine for the setup move. No number change.

## E: Ring of Fire (dmg 95, 476 ms avg = fire's slowest, 577 particles, 41 fx, 1 ent)
- **[visual] med.** The wall's flames render as pale cream or white cones, not fire orange, and wash into the light floor (m3_RingofFire_010, m3_RingofFire_022, m3_RingofFire_074). It reads more like Light or Crystal than Fire. Proposed change: `ringOf('fire__flame', 0xff5a1a, ...)` -> `0xff3a0a`. Because heat comes from the swirling embers, also lower the per-flame height bob `1.35 * f.userData.h` -> `1.15 * f.userData.h` so the near-side flames hide less of the lower view (m3_RingofFire_003). impact med, effort S.
- **[performance]** It has the highest average frame cost of the five moves, with 40 flame meshes scaled every frame. Proposed change: `ringOf(..., 40, n.r, ...)` -> `28`. At r = 5.5 that still puts a flame every 1.2 m. impact med, effort S.
- **[balance]** 11 damage per crossing (with a 0.3 s gate) plus knockback 9 gave 95 dmg in the move test. Its cooldown was ready 1% of the time. This is defensive zone control, so no change.

## R: Conflagration (dmg 249 measured, eruptions not in window; 436 ms avg, 819 particles, 56 fx = fire's highest)
- **[visual] high.** On cast the screen goes almost fully white (m4_Conflagration_003): `flash(e.x, 2, e.z, 0xff6a1a, 35, .5)` at your feet, plus `fovKick = 1.6`. Against the boss it was a complete white-out (boss_599). Proposed change: `flash(..., 35, .5)` -> `flash(..., 20, .4)`. impact high, effort S.
- **[visual] high.** Eruptions next to the player fill half the screen with a giant flame mesh (kit_599 and kit_1199: a huge cone on the right side). The pillar is `6 + n * 2.5` m tall right in your face. The wave already hides flames within 3.5 m of the camera (`f.visible = Math.hypot(...) > 3.5`). Proposed change: apply the same rule in `fx.erupt`. Compute `const near = distTo(e.x, e.z) < 3.5` once, and when `near` is true, skip the `modelFx('fire__flame' ...)` loop and use `pillarFx(..., .9)` -> `.35` opacity. impact high, effort S.
- **[visual]** The wave and the staggered pillars read very well at mid range (m4_Conflagration_010/022/045). Keep.
- **[balance]** (40 + 25 x stacks), and the wave applies 3 stacks first, so it is about 115 per enemy plus a 15 wave hit. Strong but fair for an ultimate. No change.

## Passive: Kindling (death blast 20 x dmgMul, r 2.6)
- **[balance]** The chain explosions are a large part of the 73 kills in 30 s. With Fire Brand putting 3 burns on the whole pack, they cascade. This is what makes fire 1.14x on crowds. It fits fire's "blow it all up" identity, so no change.
- **[performance]** Each death runs `fireBoom` at `s: .7`, which was fine in the kit run (sim 4.4 ms/frame). No change.

---

## Balance summary
Fire sits at **1.14x crowd and 1.17x boss**: inside the 0.85-1.2 band, near the top, which is right for the pure-damage element. No number changes are proposed. If fire later goes above 1.2x once all 30 elements finish, the first knob is `onKill` blast `20 * stats(p).dmgMul` -> `16`.

## Top 3
1. **Conflagration white-out:** `flash(..., 35, .5)` -> `(20, .4)`, and hide or fade eruption flame meshes within 3.5 m of the camera in `fx.erupt` (high, S).
2. **Flamethrower own-view clarity:** own-view opacity `.7/.6` -> `.4/.4`, outer width `3.2+heat*.8` -> `2.6+heat*.6`, emits `8+heat*6` -> `6+heat*4` (high, S).
3. **Fire Brand fuse and particles:** fuse `1.2` -> `.9` s, spread trail `14` -> `8` emits, burst `16` -> `10` (med, S).
