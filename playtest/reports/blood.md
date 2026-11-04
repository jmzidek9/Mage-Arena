# Blood playtest report

**Verdict:** very strong against crowds because Blood Moon keeps refilling itself and its death-pops chain; in band against bosses. The new moves work in the sim, but Exsanguinate and Crimson Mire did no damage in the showcase test.
**Crowd dps 580.3 (2.58x median 225.1) · Boss dps 155.2 (1.16x median 134.3) · worst frame: Exsanguinate 8628.7 ms spike; highest average: Crimson Mire 491.4 ms** (headless SwiftShader with 30 runs at once, so only the ratios between moves mean anything).

Kit run: 173 kills, 77 HP lost and 77 healed, lowest HP 956/1000. Casts: Bolt 65, Fan 9, Exsanguinate 4, Mire 4, **Blood Moon 16 in 30 s**.
Boss run: 608 HP lost, 132 healed, lowest HP 524, Blood Moon 5 casts.

Note: the harness casts the ultimate first whenever `p.ult >= 1`, and ult charge comes from damage (`addUlt(p, amount / (900*(1+.1*(wave-1))))`, sim.js:363). Any element whose ult deals a lot of AoE damage loops, which also shows in storm (4.39x) and cosmic (3.16x). Blood still sits well above the band even allowing for that.

---

## LMB: Blood Bolt (cd .4, 21 dmg)
- **[visual]** The bolt is a small pink dot and its hit barely shows: at `m0_BloodBolt_010.jpg` there is only a faint spark on the golem, and nothing by `_022`. Next to Crimson Fan it doesn't read as "heavy blood". Change: `trail: [0xff2040, .18, .35, 2, 2]` -> `[0xff2040, .24, .35, 2, 2]`, and `look.sc` for non-mega 1 -> 1.2 (`sc: c.mega ? 1.8 : 1.2`). Impact med, effort S.
- **[balance]** 27 dmg into the pack, which fits a 0.4 s cd primary (65 casts per 30 s). No change.

## RMB: Crimson Fan (cd 3.5, 5 x 16, pierce 99)
- **[visual]** At frame 3 (`m1_CrimsonFan_003.jpg`) the 5 blades plus 5 lights blow out into one white horizontal bar, so the scythe shapes can't be seen. By `_010` it's still a white-pink beam. Change: `spread(c.d, i, 5, .16)` -> `.2` so the blades separate, `light: 3` -> `light: 1` (5 lights stack), and trail colour `0xff2040` -> `0xc0102a` so it stays red under bloom. Impact med, effort S.
- **[feel]** `fx: {}`: there's no hit effect of its own, only the generic hit flash. Add a `hit` splash like Bolt's `det` (`boomFx(e.x,e.y,e.z,1.5,0xe8102e,.4)`). Impact low, effort S.
- **[balance]** 136 dmg into the pack, the second highest in the kit. It is the main way bleed gets applied before Exsanguinate. No change.

## Q: Exsanguinate (cd 8)
- **[feel]** **0 dmg** in the showcase (metrics `dmg: 0`). The pack was outside the 8 m fallback radius and nothing was bleeding, so the cast did nothing and the 8 s cooldown was spent anyway. In real play it's often pressed before anything bleeds. Change: fallback radius `Math.hypot(...) < 8` -> `< 12`, and fallback damage `15 * c.dmg` -> `12 * c.dmg` to pay for the wider reach. Impact high, effort S.
- **[visual]** With nothing to rip, all you see is `ringFx(h.x, .1, h.z, 6, ...)`: thick flat red bands cut across the lower screen and look like a rendering glitch (`m2_Exsanguinate_010.jpg`, `_022.jpg`). Change: ring radius `6` -> `12` (it then marks the fallback range) and opacity `.5` -> `.3`. Impact med, effort S.
- **[performance]** Worst frame was 8628.7 ms, against 1.5-2.1 s for the other moves. It's a single spike while the screen was nearly empty (447 particles, 15 fx), so it is most likely contention from the 30 parallel runs and not this move. Worth one quiet re-measure before acting. Impact low.

## E: Crimson Mire (cd 9, 4 s pool, 10 dmg per .5 s, pull 22)
- **[visual/feel]** **0 dmg** in the showcase, and the pool doesn't appear in any frame (`m3_CrimsonMire_010.jpg` to `_074.jpg`). The camera swings left with the aim and the pack shows no pull or bleed. The aimed spot probably fell off-pack (or out of view) in the harness, so this is unverified. In the kit run it was cast 4 times. Check: `ent(p, c, c.tgt.x, c.tgt.z ...)` gets a target within `range: 20` that matches the aim ring. Impact med, effort S (investigate).
- **[performance]** Highest frame average in the kit (491.4 ms) with 506 peak particles, from `emit` ~0.85 per frame for bubbling and swirl over the whole 4 s. Change: bubbling `Math.random() < .6` -> `< .4`. Impact low, effort S.
- **[balance]** The pull (`pull(e, ..., 22 * dt)`) plus 20 dps per enemy in a 4.5 m pool is strong crowd damage on a 9 s cd, and it groups enemies for Blood Moon pops. Change: tick damage `10 * n.mul` -> `8 * n.mul`. Impact med, effort S.

## R: Blood Moon (ult, 4 s, 7 dmg per .25 s to 12 enemies, death pop 30 AoE)
- **[balance]** This is the source of the 2.58x crowd figure: 16 casts in 30 s. Each tick does up to 12 x 7 = 84 dmg (336 dps), and every kill pops for 30 AoE (`aoe(e.x, e.z, 3.5, 30 * n.mul, ...)`), which kills more and chains. All that damage refills the ult through the sim.js:363 charge. Changes: drain `7 * n.mul` -> `5 * n.mul`, pop `30 * n.mul` -> `18 * n.mul`, and target cap `.slice(0, 12)` -> `.slice(0, 8)`. If the harness ult loop is fixed globally, re-measure before cutting this hard. Impact high, effort S.
- **[visual]** The moon itself never shows on screen: it rises to `y = 1 + 8*...`, above the default view (`m4_BloodMoon_045.jpg` shows only the tethers as **white** columns going off the top). The tethers (`beamMesh(0xff1030, .07, true)` at width .06-.09) blow out to white under bloom, so they look like Light pillars, not blood. Changes: height `1 + 8 * easeOut` -> `1 + 5.5 * easeOut`, tether colour `0xff1030` -> `0xb00020`, tether width `.06 + .03*sin` -> `.04 + .02*sin`. Impact high, effort S.
- **[visual]** The 16 m red disc plus zoneCircle covers the whole floor in bright red-white stripes (`m4_BloodMoon_010.jpg`, `_074.jpg`). In the crowd fight (`kit_1199.jpg`) the screen washes out pink-white and enemies are hard to pick out. Change: `dm.uniforms.uA.value = a * (.5 + .15*sin)` -> `a * (.3 + .1*sin)`, circle opacity `a * .7` -> `a * .45`. Impact med, effort S.
- **[performance]** Most particles in the kit (822 peak) and most fx objects (24). It calls `flash(...)` on 70% of frames (a point light every frame), plus 3 rain emits per frame and up to 5 tether emits. Changes: `Math.random() < .7` flash -> `< .2`, rain `for (i < 3)` -> `i < 2`. Impact med, effort S.

## Passive: Bloodlust (2.5% steal, bleed leech .1, up to +50% dmg at low HP)
- **[balance]** With the healing cut it's fine: the crowd fight heals exactly what it loses (77/77) and the boss fight heals 132 of 608. lowHp (`sim.js:89`) barely matters at 1000 HP in these runs. No change.
- **[docs]** vault/Elements.md Balance still says "Blood sits higher because it pays for it in health". HP costs were removed today, so Blood should now aim for the normal 0.85-1.2x band. Update that sentence. Impact low, effort S.

---

## Top 3
1. **Blood Moon damage loop:** drain `7 -> 5`, death pop `30 -> 18`, target cap `12 -> 8` (crowd 2.58x is far over the band). Also flag the harness/sim ult refill from damage, which inflates storm and cosmic too.
2. **Make the Blood Moon readable:** moon height `1+8 -> 1+5.5` so it is on screen, tethers `0xff1030 -> 0xb00020` and thinner so they stop reading as white Light pillars, floor disc alpha `.5 -> .3`.
3. **Exsanguinate never wasted:** fallback radius `8 -> 12` m (damage `15 -> 12`), cast ring `6 -> 12` m at opacity `.3` so it marks the reach instead of glitchy red bands.
