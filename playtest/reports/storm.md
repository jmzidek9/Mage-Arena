# Storm playtest report

**Verdict:** the biggest outlier so far. Thunderstorm pays for itself: one cast earns most of the next ult charge, so the bot cast it 25 times in 30 s (other elements: 3-16). The rest of the kit sits near the median. The stacked clouds also white out the screen.

| | value |
|---|---|
| Crowd dps (kit, wave-5 pack of 8) | **987.6** (234 kills, 37 hp lost) |
| Boss dps (Tyrant) | **907.6** |
| x-median (19 elements: crowd 225.1, boss 134.3) | **4.39x crowd, 6.76x boss** |
| Worst frame cost | Tesla Coil 934 ms worst / Thunderstorm 239 ms avg (swiftshader, so compare between moves only) |

**Where the damage comes from.** From the kit casts there were 25 Thunderstorms. Each cloud hits about 158 base dps (38 every 0.24 s) for 5 s, so roughly 800-900 damage per cast at wave 5, or about 22k of the kit's 29.6k total. Ult charge from damage is `amount / (900 * (1 + .1*(wave-1)))` (js/sim.js:363), which is amount/1260 at wave 5. That means one cloud gives back about 0.65-0.7 of an ult charge by itself, and Chain Lightning, Ball Lightning and Tesla Coil top up the rest. `cooldownReadyPct` for Thunderstorm is **100%**, so the ult is ready at every moment of the fight. Without the ult, the kit is about 7.1k damage over 30 s, around **237 dps, which is right on the crowd median**. So the fix belongs on R. Leave the other moves alone.

Harness notes: in the single-move showcase Thunderclap did 0 damage and Tesla Coil only 25. The aimed point landed behind the pack (m2_Thunderclap_045.jpg shows the sky bolt far behind the enemies). This comes from the harness aim (`groundAt` clamps to range 22 when the aim is near horizontal). It is not a Storm bug. Both moves land in the kit and boss fights.

---

## LMB: Chain Lightning (cd 0.36, 6 dmg, chains 2 at 75%)
- **[visual]** At frame 3 (m0_ChainLightning_003.jpg) the bolt is mostly a white bloom blob over the first target, and the violet barely shows. Every non-sky bolt endpoint calls `flash(..., col, 30, .15)` plus `burst(14, 0xd8c8ff)` (js/view.js:415). With 3 endpoints, three intensity-30 flashes saturate the bloom. Proposed change: for chained non-sky bolts, `flash(...p, col, 30, .15)` -> `flash(...p, col, 14, .12)` and the `burst` count `14 -> 8`. The bolt line then carries the read instead of a white puff. Impact med, effort S. This is shared by every `bolt` event, so Tesla Coil, Ball Lightning zaps (which already pass `q:1`) and other elements' bolts get cleaner too.
- **[balance]** 6 dmg per tap is 16.7 single-target dps (about 42 when all 3 links hit), which is weak for a primary. Hold any buff until the R fix is re-measured. If Storm then drops below 0.85x, use `6 * c.dmg -> 7 * c.dmg` (js/elements.js:427). Impact low, effort S.

## RMB: Ball Lightning (cd 6, orb 6 dmg pierce, zaps 2 targets x5 every 0.25 s, burst 20)
- **[performance]** This move has the highest particle and fx-object count in the kit: **802 particles, 91 fx objects** (other moves: 291-636 particles, 14-27 fx). Each 0.25 s pulse sends 2 `bolt` events, and each event spawns a `boltFx` object plus a burst at every endpoint, all on top of the orb trail and an 8-unit light. Proposed change: reduce the zap visuals, not the damage. In the shot tick at js/elements.js:432, send **one** bolt event that runs through both targets (`pts: [orb, e1, e2]`) instead of one event per target. That roughly halves the zap fx objects. Damage is unchanged. Impact med, effort S.
- **[visual]** Frame 10 (m1_BallLightning_010.jpg) is a near-whiteout around the orb (trail, light 8 and the zaps' flashes stacked together). Proposed change: `light: 8 -> 5` in `look` (js/elements.js:436). Impact low, effort S.
- **[balance]** 230 damage in the first 1.2 s, before the burst. It is strong but on a 6 s cd. Leave it as is.

## Q: Thunderclap (cd 7, 0.45 s delay, 38 dmg r3.5 + stun 0.8, then 3 jumps x20)
- **[feel]** The mark ring plus the 0.45 s delayed sky strike reads well: the strike column is clearly Storm's (m2_Thunderclap_045.jpg). The follow-up jumps reuse the same `strike` fx at r1.6 (`skyFx` + `shake(.12)` + `storm_big` sfx each), so one cast gives 4 full shakes in 0.6 s. Proposed change: give the jumps a lighter fx key, for example a new `fx.jump` = `skyFx` + `ringFx` with no `shake` and `sfx('storm')`, and pass `'jump'` instead of `'strike'` at js/elements.js:443. Impact med, effort S.
- **[balance]** No change. The showcase 0 damage is a harness aim artifact, explained in the notes above.

## E: Tesla Coil (cd 13, life 9, zaps 3 every 0.45 s for 10/7/7, fence 9 every 0.3 s)
- **[visual]** The coil model and fence read well and are clearly Storm. The enemies it hits glow orange/gold (m3_TeslaCoil_045.jpg, also in m4 and m1_045). Next to Storm's violet that reads like Fire. If that glow is the generic hit/stagger outline, this is a cross-element note, not Storm-specific. Impact low, effort M.
- **[performance]** It has the worst single frame of the run (934 ms with swiftshader). Its averages, 433 particles and 25 fx objects, are mid-pack, so this spike is probably the coil model and `dustFx` loading on the first frame. No change proposed until it is measured again.
- **[balance]** About 53 dps over 9 s on a 13 s cd, plus the fence when two are out. Fine.

## R: Thunderstorm (ult, cloud follows you for 5 s, a 38-dmg r1.6 sky bolt + 0.25 s stun every 0.24 s)
- **[balance] (the main issue)** The ult feeds itself: 25 casts in 30 s and 100% ready, against a median of about 6 casts for other elements. Proposed changes, together:
  1. `blast(e.x, e.z, 1.6, 38 * n.mul, ...)` -> **`22 * n.mul`** (js/elements.js:471). Per-cast damage drops to about 500, so one cloud gives back about 0.4 of an ult instead of about 0.7.
  2. Only one cloud at a time: in `cast`, set `life` on any existing `storm.4` ent you own to 0 before calling `ent(...)` (js/elements.js:465). Stacked clouds are where the 4x shows up and where the whiteout comes from.
  3. A cross-element guard worth considering in js/sim.js:363: don't charge ult from damage dealt by your own ultimate (skip `addUlt` when the damage comes from a slot-4 move). Storm shows the problem first, but any sustained-damage ult can loop the same way.
  Rough target: about 6-8 casts per 30 s, which puts crowd at roughly 1.1-1.3x the median. Re-measure after 1 and 2. If it is still above 1.2x, try `pulse .24 -> .3`. Impact high, effort S.
- **[visual]** boss_1199.jpg is a **full white screen**. Every sky bolt does `flash(30)` + `shake(.12)`, and the cloud's `upd` adds `flash(n.x, 8, n.z, col, 25, .1)` at 8 per second. With 3-4 clouds stacked that is about 17 sky flashes per second. Proposed change: cloud `upd` `Math.random() < dt * 8` -> `dt * 3`, and flash `25 -> 12` (js/elements.js:474). Fix 2 above (one cloud) does most of the rest. Impact high, effort S.
- **[performance]** It has the highest average frame cost of the moves (239 ms) and 636 particles. The `upd` emits 4 rain particles every frame (about 240 per second): change `for (let k = 0; k < 4; k++)` -> `k < 2` (js/elements.js:475). Impact med, effort S.

## Passive: Static (every 8th Storm hit drops a 16-dmg sky strike; Shocked takes +15%)
- **[feel]** Ball Lightning zaps, Tesla zaps and the fence all count as hits, so Static fires several times a second in a crowd. Every proc is a `sky: 1` bolt, which means `shake(.12)` + flash 30. That adds to the constant shaking in kit_1199.jpg. Proposed change: drop `sky: 1` from the passive's bolt event (js/elements.js:424) and keep it as a vertical bolt with no shake, so the screen shake stays reserved for Thunderclap and the ult. Impact med, effort S.
- **[balance]** 16 dmg per proc is small. Leave it as is.

---

## Top 3
1. **Stop Thunderstorm from charging itself:** `38 -> 22` dmg (js/elements.js:471) plus one cloud at a time (js/elements.js:465). This brings Storm down from 4.4x crowd and 6.8x boss toward about 1.2x. Also consider the sim-wide rule that ult damage gives no ult charge (js/sim.js:363).
2. **Fix the ult whiteout:** cloud `upd` flash `dt*8 -> dt*3` and `25 -> 12`, rain `k<4 -> k<2` (js/elements.js:474-475).
3. **Cut screen shake and fx spam:** passive Static without `sky: 1` (line 424), Thunderclap jumps on a light no-shake fx (line 443), and Ball Lightning as one bolt event per pulse (line 432, 91 -> about 45 fx objects).
