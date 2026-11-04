# Plasma playtest report

**Verdict:** the kit reads well and hits hard, but its own blasts go off at eye height and white out the screen (Vent, and the automatic overheat vent), and Fusion Beam refills itself on the boss through the known ultimate loop.
**Crowd dps 292.9 (1.34x median 218.1) · Boss dps 349.8 (2.55x median 137.1) · worst frame: Plasma Cannon 12579.8 ms spike; highest average: Plasma Cannon 581.7 ms** (headless SwiftShader with many runs at once, so only the ratios between moves mean anything).

Kit run: 79 kills, 436 HP lost, lowest HP 564/1000. Casts: Bolt 70, Cannon 7, Vent 5, Lance 5, **Fusion Beam 7 in 30 s**. Bolt was ready but idle 34% of the time, which is mostly the 2.5 s overheat lock.
Boss run: 503 HP lost, lowest 497. **Fusion Beam 10 casts in 30 s**, so the beam is on for about 40 of the 30 seconds (overlapping casts).

**The ultimate loop applies here.** One beam on the boss alone is 40 ticks x 15 = 600 dmg, and that damage refills the ultimate through `addUlt(p, amount / (900*...))` (sim.js:363). Ten casts are worth about 6000 of the 10494 boss damage. Without the loop, boss dps is roughly (10494 - 6000) / 30 ≈ 150, about 1.1x, which is in band. Crowd dps would drop to about 1.0x. There is also a side effect: while `fusion` is up, `onCast` returns early (elements.js:1808), so the bolts build no Heat. In the boss run that means Plasma fights almost the whole time with no Heat bonus.

---

## LMB: Plasma Bolt (cd .28, 11 + 4 splash, heat 9)
- **[visual]** It reads well. There is a small pink bolt and a white-pink pop on impact (`m0_PlasmaBolt_010.jpg`), gone cleanly by `_022`. No change.
- **[feel]** Heat comes in at 9 / .28 s = 32 per s, and cooling takes off 15 per s (sim.js:1012), so holding LMB overheats in about 6 s. That means the +50% damage peak lasts under a second before the 2.5 s lock, and holding the main button punishes you. Change: `heat: 9` -> `heat: 7` (net +10/s, about 10 s to overheat), so you have time to Vent on purpose before the auto-vent. Impact med, effort S.
- **[balance]** 17 dmg in the 1.25 s showcase, which is about one bolt plus a pop. That's fine for a .28 s primary. No change.

## RMB: Plasma Cannon (charge 1.1 s, cd 3.5, 25-85 dmg, blast r 2-4.5)
- **[visual]** Good payoff: at `m1_PlasmaCannon_010.jpg` / `_045.jpg` the whole pack lights up and a ring scar stays on the floor. Distinct from Bolt. No change.
- **[performance]** It has the highest frame average (581.7 ms) and one 12.6 s spike. Peaks were 629 particles and 49 fx objects, which is ordinary for a blast, so the spike is most likely contention from the parallel runs. The one cheap cut is `meshFx(T.overload, ..., .45, .3, e.r * .9, 2)`: change the last arg `2` -> `1`. Re-measure on its own before doing more. Impact low, effort S.
- **[balance]** 261 dmg and 4 kills into the pack, the best non-ultimate move, as a charged 3.5 s cd move should be. No change.

## Q: Vent (cd 7, 20 + .9 x Heat, r 4 + Heat/30)
- **[visual]** **It whites out the first-person view.** `boomAt(c, p.x, p.y + 1, p.z, ...)` puts the `boomFx` burst, its flash (`35 * k` intensity, k 1.2) and the star sprite right on the camera. `m2_Vent_003.jpg`, `_010.jpg` and `_022.jpg` are almost solid white-pink for ~20 frames, and the hands vanish at `_010`. The same `'vent'` fx fires on the automatic overheat (elements.js:1812), so mid-fight you get blinded with no input of your own (probably the fully white `boss_1199.jpg`). Change in `fx.vent`: put the burst at the feet with `boomFx(e.x, e.y - .9, e.z, e.r, 0xff3ca8, .6)` (was `e.y`, `1.2`) and lower the ring with `ringFx(e.x, e.y - .95, ...)`. Keep the 40 outward sparks, which already read as a shockwave in `_045`. Impact high, effort S.
- **[performance]** It has the most particles in the kit (872 peak) and the joint-most fx objects (61), because boomFx k 1.2 adds 70 particles on top of the 40 sparks. The k 1.2 -> .6 change above cuts this to about 35. Impact med, effort S.
- **[balance/feel]** 0 dmg in the showcase. With 0 Heat the reach is only 4 m and the pack stood further out. In play you only fire Vent with Heat, so this is fine. If it should never whiff, use a 5 m minimum: `4 + h / 30` -> `5 + h / 40` (same 7.5 m at full Heat). Impact low, effort S.

## E: Thermal Lance (cd 6, 40 pierce in a 12 m line, burn line 6 / .4 s above 50 Heat)
- **[visual]** The "thin" lance starts at chest height on your own position (`a = V(e.x, e.y + 1, e.z)`), so in first person it fills the lower middle of the screen as a wide white wedge between the hands (`m3_ThermalLance_003.jpg`, `_010.jpg`). It reads as a cone, not a lance. Change: start it from the hand and a step forward, with `a = handPos(e.id).addScaledVector(f, 1)`, or keep `a` but add `.addScaledVector(f, 1.5)` and `e.y + .7`. Also change the outer beam `beamFx(a, b, 0xff3ca8, .22, .3)` -> `.14`. Impact high, effort S.
- **[balance]** 46 dmg in the showcase, so only one enemy was in the .8 m line. The burn line never shows in the shots because it needs >50 Heat. Line width 0.8 m is tight for a 6 s cd: `rayHits(..., 12, .8)` -> `1.1`. Impact med, effort S.

## R: Fusion Beam (ult, 4 s, 15 per .1 s per enemy on a 40 m ray)
- **[visual]** In your own view the charge ball `u.ball` sits at `handPos` at scale `.5 * w` and shows as a huge white disc over the lower-left quarter of the screen, covering the casting hand and part of the pack (`m4_FusionBeam_010.jpg`, `_045.jpg`). Change: own-view scale `(n.own === myId ? .5 : .6)` -> `(n.own === myId ? .18 : .6)`. Impact high, effort S.
- **[balance]** **Affected by the known ultimate loop** (7 casts in the crowd, 10 on the boss). Even with the loop fixed, 150 dps per target for 4 s on a piercing 40 m ray is 600+ per enemy per cast. Showcase damage was 323 against a median ultimate damage of 19. Fix the shared loop first, then if it is still high: `15 * n.mul` -> `12 * n.mul`. Impact high, effort S.
- **[feel]** `buff(p, 'fusion', 4)` plus the `onCast` early return means no Heat at all for 4 s, and with the loop that becomes most of the fight. After the loop fix this is fine. No change.

## Passive: Heat (+0.5% dmg per Heat, overheat at 100 = 25 dmg vent + 2.5 s lock, cools 15/s)
- **[visual]** The automatic overheat vent uses the same eye-height whiteout as Vent (see Q). The Vent fix covers it. Impact high, effort S.
- **[feel]** Overheat locks every Plasma move for 2.5 s, including the 3.5 s Cannon, and the harness hit it about every 6 s (Bolt 34% idle). Together with the Bolt heat change (9 -> 7) it fits the "push your luck" idea without being a constant stall. Optional: give the forced vent the Heat-scaled damage of a manual Vent (`25 * c.dmg` -> `(20 + .9 * 100) * c.dmg * .5`) so overheating feels like a payoff, not only a penalty. Impact low, effort S.
- **[icons]** All 5 icons in `SPELL_ART.plasma` match their moves and look distinct. No change.

---

## Top 3
1. **Vent / overheat whiteout:** in `fx.vent`, `boomFx(e.x, e.y, ...,1.2)` -> `boomFx(e.x, e.y - .9, ..., .6)`. That stops the screen going fully white on every manual and automatic vent, and halves its 872-particle peak.
2. **Clear the first-person view on the beams:** Fusion Beam own-view ball scale `.5` -> `.18`, and start Thermal Lance from the hand a step forward (`handPos(e.id).addScaledVector(f, 1)`, outer width `.22` -> `.14`) so it reads as a lance, not a white wedge.
3. **Fusion Beam balance:** affected by the shared ultimate refill loop (10 casts on the boss, 2.55x). Fix the loop globally, re-measure (expected ~1.1x), then trim the tick `15` -> `12` only if it is still high. Also Bolt `heat: 9` -> `7` so holding LMB doesn't overheat every 6 s.
