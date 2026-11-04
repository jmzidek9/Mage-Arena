# Blades playtest report

**Verdict:** a solid sword-saint fantasy that hits bosses hard but is weak against crowds (mostly single-target damage). Blade Dance drops the camera inside the pack, and the ultimate whites out the screen against bosses.
**Crowd dps 134.2 (0.62x median 218.1) · Boss dps 166.4 (1.21x median 137.1) · worst frame: Rain of Blades 6568.1 ms spike; highest average: Sword Volley 382.3 ms** (headless SwiftShader with many runs at once, so only the ratios between moves mean anything).

Kit run: 40 kills, **725 HP lost** (lowest 286/1000), 18 healed. Casts: Daggers 73, Volley 12, Dance 4, Rain 3, Colossal Blade 4.
Boss run: 341 HP lost, lowest 659, Colossal Blade 5 casts (ready 100% of the time).

Icons (`SPELL_ART.blades`, icons.js:467-477) match all five moves and each one looks different. No change.

---

## LMB: Flying Daggers (cd .35, 2 x 7.5, home 2)
- **[visual]** You can barely see the daggers. In `m0_FlyingDaggers_003/010.jpg` only a scatter of sparks reaches the pack, and the cast glyph on the left hand covers more of the screen than the shots do. At `look.s: .45` the dagger model is a few pixels wide at 10 m. Change line 2157: `s: .45` -> `s: .6`, trail `[0xffe08a, .09, .25, 0, 1]` -> `[0xffe08a, .12, .3, 0, 1]`. Impact med, effort S.
- **[balance]** 20 dmg into the 6-pack (73 casts in the kit run) gives about 43 single-target dps. Crowd is at 0.62x, so a small boost helps: `dmg: 7.5 * c.dmg` -> `8.5 * c.dmg` (line 2155). Boss is already 1.21x, so stop there. Impact med, effort S.
- **[feel]** Forging a sword (25% per hit) gives no feedback; the HUD pip just goes up. Add a small `flash(p.x, p.y + 1, p.z, 0xffcc33, 4, .1)` or `sfx('steel')` next to `p.bd.swords = ...` in `shot.hit` (line 2156), so you can tell your halo grew. Impact low, effort S.

## RMB: Sword Volley (cd 2.5, max(2, swords) x 24, pierce 3)
- **[visual]** The swords launch from a full 360° ring around the player (`a = TAU * i / n`, radius 1.3, line 2166), so some start behind the camera and cross the screen sideways. In `m1_SwordVolley_003.jpg` one large sword cuts across the left third of the view. They also don't come from where the halo swords are drawn (view.js:1057 orbits at y+.75 on a rotating angle). Change: spawn them on a front arc instead, `a = yaw + (i / (n - 1 || 1) - .5) * 2.2` with `o` 1 m forward of the eye, so they fan out in front of you. Impact med, effort S.
- **[balance]** Only 52 dmg into the pack: the halo is usually empty (Sword Halo's guard spends swords on anything within 3 m), so the volley fires the minimum 2 swords. Change line 2166: `Math.max(2, ...)` -> `Math.max(3, ...)` and `pierce: 3` -> `pierce: 5`. Extra pierce only helps against crowds, so boss dps stays where it is. Impact high, effort S.
- **[feel]** The hit sparks are good: the golem lights up gold in `_022`. No change.

## Q: Blade Dance (cd 8, 9 m dash, 32 dmg in a 1.8 m lane, +2 swords)
- **[visual/feel]** **The dash ends inside the enemies.** `p.mo` moves the player 9 m and `collide(p, .45)` (sim.js:602) only checks walls, so the camera lands inside the golem: `m2_BladeDance_022.jpg` is a solid orange frame, and `_045`/`_074` are the inside of enemy meshes. The kit run's 725 HP lost (lowest 286) fits with dancing into the pack with only `inv .35`. Change: at the end of the dance, if an enemy is within `ET[e.type].r * e.sc + .6`, keep going (`if (m.t >= m.T && m.through && overlapping) m.T += .05`, capped at +.25 s) so you always come out the far side, which is what the move promises. Also `buff(p, 'inv', .35)` -> `.6` (line 2172) to cover the exit. Impact high, effort S.
- **[visual]** Frames 3/10 look good: the sword whirl and fov kick read clearly. No change.
- **[balance]** 72 dmg into the pack (32 per enemy in the lane). Widen the lane to fit the whirl's 1.4 m sword radius plus a body: `lat < 1.8 + ...` -> `lat < 2.4 + ...` (line 2173). Crowd only. Impact med, effort S.

## E: Rain of Blades (cd 11, 12 x 20 in r 1.8 stabs, 6 s field, 30% slow, pick-up)
- **[balance/feel]** **0 dmg** in the showcase. `groundAt(p, range 20)` placed the ring well behind the pack: in `m3_RainofBlades_045/074.jpg` the planted swords stand beyond the golems. This looks like the same harness aim issue as Blood's Crimson Mire, so it's unverified rather than a bug in the move. In real play, the ring (`d = R * .55 / .9`) leaves the centre empty, and the 1.8 m stabs barely overlap at the inner radius of 2.5 m, so an enemy standing on the reticle centre takes little. Change line 2185: the stab radius `1.8` -> `2.2`. Impact med, effort S.
- **[visual]** The falling swords read well (glowing blades dropping in `_022`/`_045`), and the planted ring is clear in `_074`. The slow field's `zoneCircle` at `.55` opacity is fine. No change.
- **[performance]** Worst frame was 6568 ms with 67 fx objects. Each sword spawns a `modelFx` drop, then a `burst(16)`, `ringFx`, `dustFx` and `sfx` on landing (12 times in about 1 s). Most likely contention from the parallel runs, but `stab` could drop the `dustFx` or `burst` 16 -> 10 (line 2201). Impact low, effort S.

## R: Colossal Blade (ult, 130 impact r 6 + 5 x 26 waves, halo to 6)
- **[balance]** **Affected by the known ult-refill bug:** 4 casts in the kit run and 5 against the boss, ready 100% of the time. Against the Tyrant each cast deals about 260 (130 + 5 x 26), so roughly 1300 of the 4992 boss damage comes from the ult. That is why boss dps sits at 1.21x. Once the `addUlt` fix lands, boss should drop into the band without a change here; re-measure before tuning. If it doesn't land, `wave 26 * n.mul` -> `20 * n.mul` (line 2204). Impact med, effort S.
- **[visual]** **White-out.** `impact` stacks `flash(..., 90, .5)` + `boomFx(..., 2.6)` + a pillar and ring (line 2209). Against the boss (`boss_599.jpg`, `boss_1799.jpg`) the whole screen goes milky white and the boss is hard to see, and `kit_599.jpg` is about 70% white. Change: flash intensity `90` -> `40`, boomFx `2.6` -> `1.8`. Impact high, effort S.
- **[visual]** At aim range the sword is small: in `m4_ColossalBlade_045/074.jpg` it stands far behind the pack, about one golem tall on screen. That's fine at that distance, but the outer ring `ringFx(e.x, .1, e.z, e.r * 1.6, ...)` sweeps past the camera as bright yellow arcs at the bottom of the screen (`_045`, `_074`). Change: `e.r * 1.6` -> `e.r * 1.25`. Impact low, effort S.
- **[balance]** 18 dmg in the showcase, because the drop landed behind the pack (same harness aim issue as Rain). Not a bug in the move.

## Passive: Sword Halo (+1 sword / 2.5 s, max 6; guard 18 dmg to anything within 3 m every .35 s, costs a sword)
- **[balance/feel]** The guard and the Volley compete for the same swords. In a crowd, the guard spends each sword on whatever walks up, for 18 dmg, so Volley almost always fires its minimum 2 (52 showcase dmg). This is the main reason crowd damage is low. Change sim.js:1017: the guard costs a sword only every other strike (`if (p.bd.guardN = (p.bd.guardN || 0) + 1, p.bd.guardN % 2) p.bd.swords--`), or raise `guardT = .35` -> `.6`. Either way, swords stay in the halo for Volley. Impact high, effort S.
- **[visual]** The halo orbits at the waist (`y + .75`, `fade .7`, view.js:1057), so in first person you only see a sword now and then at the bottom edge (`m1_SwordVolley_010.jpg`, `m3_RainofBlades_045.jpg`). The `SWORDS` pips carry the info, so this is fine. Optional: `y + .75` -> `y + .95` so a sword passes across the bottom of the view more often. Impact low, effort S.
- **[visual]** `guard` fx (line 2158) reads well in the kit shots (gold slashes on enemies near you). No change.

---

## Top 3
1. **Blade Dance exits the pack:** keep dashing while overlapping an enemy (cap +.25 s) and `inv .35 -> .6`. Right now the camera ends inside the golem (`m2_BladeDance_022/045/074`) and the kit run loses 725 HP.
2. **Lift crowd damage from 0.62x without touching boss:** Volley `max(2 -> 3)` swords with `pierce 3 -> 5`, the Halo guard no longer drains every sword (or `guardT .35 -> .6`), Dance lane `1.8 -> 2.4`, Rain stab `1.8 -> 2.2`.
3. **Colossal Blade white-out:** impact `flash 90 -> 40`, `boomFx 2.6 -> 1.8`, outer ring `r*1.6 -> r*1.25`. Leave its damage alone until the shared ult-refill fix is in (that fix is what brings boss down from 1.21x).
