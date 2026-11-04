# Abyss playtest report

**Verdict:** strong theme and the best-looking tentacle work in the game, but it is under the band on both crowds and bosses, the tentacles get between you and what you are aiming at (Ring always, Kraken when you stand in it), and Maw is invisible.
**Crowd dps:** 143.8 (0.66x median 218.1) | **Boss dps:** 86.4 (0.63x median 137.1) | **Worst frame cost:** Kraken, 159 ms avg / 529 ms worst (Void Bolt's 1155 ms worst is the first-frame warm-up, not the move)

The harness ran first time (127 s). Frame times are inflated because about 10 runs shared the machine, so read them relative to each other. Kit: 62 Void Bolt, 5 Grasp, 3 Maw, 3 Tentacle Ring and 4 Kraken casts in 30 s. Every non-ultimate had 12% or less cooldown ready time. Kraken was ready 100% of the time with 4 casts in 30 s on a 6 s life: **the known ultimate-refill bug hits Kraken** (each crush and the haul go through `hitEnemy` -> `addUlt`), so it recasts almost back to back.

## Balance overview
- Abyss is a control element (lift, pull, 25% slow, swallow), so it can sit a little low, about 0.8x. It is currently 0.66x / 0.63x, below that.
- The boss number is low because three of the five moves skip bosses: Grasp's throw ignores them (`!ET[e.type].boss`), Maw cannot swallow them, and Kraken's pull skips them. Against the Tyrant the kit falls back to Void Bolt plus the passive.
- The Kraken share of both numbers is inflated by the refill bug. Once that is fixed, Abyss drops further, so the buffs below are sized with that in mind.
- Projected effect of the changes below: crowd about +20% (to about 175, 0.8x), boss about +30% (to about 112, 0.82x).

## LMB: Void Bolt
- **[balance]** It is the kit's backbone (62 casts) but does 13 into the pack (`moves[0].dmg`), 31 dps single target. Proposed change: `dmg: 13 * c.dmg` -> `dmg: 16 * c.dmg`, and the splash `boomAt(..., 1.8, 5 * s.mul, ...)` -> `7 * s.mul`. This is the main boss-dps lever. Impact: high, effort: S.
- **[visual]** The impact barely reads against the dark-purple monsters: the splash is `0x2a1a80` (dark indigo) on dark-indigo bodies (`m0_VoidBolt_010.jpg`, `m0_VoidBolt_022.jpg`). Proposed change: in `fx.splash`, swap the counts so the bright one leads, `burst(..., 8, 0x8a7aff, ...)` -> `14`, `burst(..., 16, 0x2a1a80, ...)` -> `10`, and add `ringFx(e.x, e.y, e.z, 1.8, 0x8a7aff, .2)` so the 1.8 m splash radius shows. Impact: med, effort: S.

## RMB: Grasp of the Deep
- **[visual]** Only one tentacle spawns. `view.make` loops `for (let i = 0; i < 1; i++)`, so the small-tentacle branch (`big = i === 0` false, `TAU * i / 5`) is dead code. Seized enemies float with nothing holding them (`m1_GraspoftheDeep_022.jpg`, `_045.jpg`: one thin spike behind the pack). Proposed change: `i < 1` -> `i < 4`, which brings back 3 small tentacles at `n.r * .75` around the big one. Impact: med, effort: S.
- **[balance]** Against a boss it does 16 + the 30 slam, and the 45+45 throw never happens (bosses are filtered out of `held`). Proposed change: in `ent.end`, if a boss was in `n.ids`, `hitEnemy(boss, 'abyss', 45 * n.mul, ...)` (the tentacle crushes what it cannot lift). Impact: med, effort: S.
- **[balance]** It did 0 into the pack in the 1.25 s window: the harness aim target landed behind the pack (`m1_GraspoftheDeep_022.jpg`) and the slam fires at 1.5 s. This is the harness, not the move. No change.

## Q: Maw of the Deep
- **[visual]** The armed maw cannot be seen in any frame (`m2_MawoftheDeep_010/045/074.jpg`). While waiting it is `scale(1.3k, .08, 1.3k)` at `fade(o, .35)` with 8% emit chance, dark on a dark floor. Hidden is the idea, but you need to find your own trap. Proposed change: `fade(o, .35)` -> `.55`, and add a faint `zoneCircle('abyss', n.r, .35)` while `!n.s` (removed at the gulp). Impact: med, effort: S.
- **[balance]** It does nothing against bosses (`!ET[e.type].boss`) and sits idle for up to 12 s on a 10 s cooldown. Proposed change: if a boss steps on it, the maw snaps shut on its foot: `hitEnemy(boss, 'abyss', 50 * n.mul, ...)`, the `snap` fx, `n.life = 0`. That keeps "too big to swallow" and still pays out. Impact: med, effort: M.

## E: Tentacle Ring
- **[visual]** **A tentacle stands dead centre in the first-person view for the whole 6 s, with two more at the screen edges** (`m3_TentacleRing_010.jpg`, `_022.jpg`, `_074.jpg`, and `kit_1199.jpg`, `kit_1799.jpg`). The 8 tentacles are fixed at world angles `TAU * i / 8` on a 2.4 m ring, so one of them is usually in front of you. Proposed change: radius `2.4` -> `3.4`, and offset the angles by the caster's yaw plus half a step, `a = TAU * i / 8 + p.yaw + TAU / 16` (store the yaw on the ent at cast), so the forward gap stays clear. Also thin them a little: `tt.scale.set(.38 * k, ...)` -> `.3 * k`. Impact: high, effort: S.
- **[visual]** The screen darkens heavily while it is up (`m3_TentacleRing_010.jpg` vs `m3_TentacleRing_074.jpg`). The tentacles cast shadows (`{ shadow: true }`) across the camera from 2.4 m. Proposed change: drop `shadow: true` for Ring's tentacles (Kraken keeps it). It is also cheaper. Impact: med, effort: S.
- **[balance]** 18 per lash, 3 targets per 0.55 s, but only enemies within 6 m and for 6 s on a 14 s cooldown. Proposed change: `18 * n.mul` -> `22 * n.mul`. Impact: med, effort: S.

## R: Kraken
- **[visual]** When you cast it near you, or fight the Tyrant in melee, the 2.3-scale tentacles and the haul `flash(..., 60, .4)` whiteout fill the screen (`boss_1199.jpg`: nothing readable; `m4_Kraken_010.jpg`: a tentacle in front of the hands). Proposed changes: `flash(e.x, 2, e.z, 0x8a7aff, 60, .4)` -> `30, .3`, and in `view.upd` fade any tentacle within 3 m of the camera to 0.35. Impact: high, effort: S.
- **[balance]** The description says "100 damage" but the haul does `85 * n.mul`. Proposed change: `85` -> `100` to match. Crushes are one random target per 0.35 s at 19, so a 6-enemy pack takes 19 in the 1.25 s window (`moves[4].dmg`, same as the median ultimate). Fine. Impact: low, effort: S.
- **[balance]** Affected by the known ultimate-refill bug (100% ready, 4 casts in 30 s). Fix it in `damage()`, not here. Impact: high (shared), effort: S.
- **[performance]** It is the most expensive move: 159 ms avg, 505 particles. `view.upd` emits a sucker particle for each of the 7 tentacles at 60% per frame, plus the floor emit at 50%. Proposed change: sucker chance `< .6` -> `< .3`. The suckers are also baked into the model's glowing dots (`kit_1799.jpg`), so this costs little. Impact: med, effort: S.

## Passive: Lurker Below
- **[feel]** The 20% lash on hit works well and reads well (the curling tentacle under the enemy). It goes through `damage()`, not `hitEnemy`, so it cannot chain into itself. Good. No change.
- **[balance]** 18 at 20% = +3.6 per hit, about +25% on Void Bolt. With the Void Bolt buff it does not need to change. If boss dps is still under 0.8x afterwards, `18 * stats(p).dmgMul` -> `22`. Impact: low, effort: S.

## Icons
`SPELL_ART.abyss` has 5 entries (js/icons.js:426). None of the changes above alter what a move is, so no icon needs redrawing. If the Grasp change brings back the small tentacles, check that its icon still matches.

## Top 3
1. **Tentacle Ring: clear the view.** Radius `2.4` -> `3.4`, angles offset by the caster's yaw + `TAU/16` so no tentacle stands in front of you, and no shadows on the Ring tentacles.
2. **Raise Abyss toward the band.** Void Bolt `13` -> `16` (splash `5` -> `7`), Ring `18` -> `22`, Grasp crushes a boss for 45, Maw bites a boss for 50, Kraken haul `85` -> `100` to match its text.
3. **Kraken readability and cost.** Haul flash `60, .4` -> `30, .3`, fade tentacles near the camera, sucker emit `.6` -> `.3`. Also make Maw findable (`fade .35` -> `.55` plus a faint zone ring).
