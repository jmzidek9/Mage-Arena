# Cosmic playtest report

**Verdict:** looks the part, but the crowd number is broken by Supernova refilling its own ultimate meter, and the boss number is low. The visuals need contrast against the purple enemies and Moons that stay out of the view.

| | value |
|---|---|
| Crowd dps (kit, wave-5 x8, 30 s) | **712** (median 225.1, **3.16x**) |
| Boss dps (Tyrant, 30 s) | **98.7** (median 134.3, **0.73x**) |
| Worst frame cost | Supernova 1684.9 ms worst, Constellation 441.7 ms avg (headless, 30 runs at once, so compare moves with each other only) |
| Kit casts (crowd) | Star Shot 69, Moons 4, Constellation 11, Meteor 3, **Supernova 14** |

Run: `node playtest/run.js cosmic`, one run with no retry needed. Median from `playtest/out/median.json` (19 elements).
Note: the per-move dmg column reads 0 for Constellation, Meteor Shower and Supernova. Each one deals its damage after the 75-frame window (one star alone has no link, the meteors land 0.35 s+ after each spawn off the pack, and the nova goes off at 2.2 s), so these 0s are timing artefacts, not dead moves.

---

## Balance root cause: Supernova recharges itself
**[balance]** 14 Supernovas in 30 s against the crowd, against 3 in the boss fight. Damage charges the ult by `amount / (900*(1+.1*(wave-1)))` (js/sim.js:363), which is /1260 at wave 5. One nova is 140 raw x1.12 Starstruck across r=14 into 8 enemies, about 1250 dmg, about 0.99 of a full ult bar. Every nova pays for the next one almost by itself, and this one loop explains nearly all of the 3.16x.
- Fix (preferred, applies to every element): in js/sim.js:363, skip `addUlt` when the hit comes from slot 4 (an ultimate cannot charge the ultimate). Impact high, effort S.
- Cosmic-only fallback: Supernova `r: 14 * c.st.aoe -> 10 * c.st.aoe` and `140 * n.mul -> 110 * n.mul`. Impact high, effort S.
- Rerun kit after the fix. My expected crowd range is about 220-280 (1.0-1.25x).

## LMB: Star Shot
- **[visual]** The bolt is a small white-blue blur. Against the indigo/purple monsters it barely stands out (m0_StarShot_003/010), and the hit at frame 10 is a faint white pop. The giant 4th star is not clearly bigger in the frames captured. Change: trail colours `0xb0b8ff : 0xffffff -> 0xffe48a : 0xffffff` (a warm gold star read against cool enemies) and `light: 5 -> 7`. Impact med, effort S.
- **[balance]** Boss dps is 0.73x, and Star Shot is the main single-target source: (3x8.5 + 30)/4 / 0.38 s, about 36 dps base. Change: `dmg: (big ? 30 : 8.5) -> (big ? 36 : 10)`, about +18% on the bread-and-butter attack, which brings boss dps toward 0.85x. Impact high, effort S.
- **[feel]** The giant star on every 4th shot has no tell. Change: in `look`, scale the trail on big shots (`sc: (big ? 2.2 : 1) -> (big ? 2.6 : 1)`) and add `fxe(c.m.key,'det',...)`, or `sfx('cosmic')` on big. Impact low, effort S.

## RMB: Orbiting Moons
- **[visual]** The moons orbit at `p.y + 1.6`, which is eye height, at radius 3.2 and scale 1.5. A huge white moon fills a quarter of the screen as it passes the camera (m1_OrbitingMoons_003 top-left, m1_OrbitingMoons_074 bottom-right). Change: `n.y = p.y + 1.6 -> p.y + 2.6` and `o.scale.setScalar(1.5) -> 1.1`. Impact high, effort S.
- **[balance]** 30 dmg per moon plus a 2 m splash at 50%, 3 moons, on a 9 s cooldown. Only 4 casts per fight and a modest share. To help boss dps: `dmg: 30 * n.mul -> 36 * n.mul`. Impact med, effort S.
- **[performance]** Peak particles 604 against 272 for Star Shot: each moon emits 2 dust particles per frame for 12 s. Change: `for (let k = 0; k < 2; k++) -> k < 1`. Impact low, effort S.

## Q: Constellation
- **[visual]** One star on its own is barely visible: no clear node in m2_Constellation_010/045/074, and the beams only appear from the second star on. Change: `burst(n.x, 1.2, n.z, 20 -> 32, ...)` on placement, and a faint ground ring under each node (`zoneCircle('cosmic', 1, .4)`, the same helper Phantasmagoria uses) so the player can see where the line will go. Impact med, effort S.
- **[feel]** 0 dmg until a second star is placed, and the kit bot's 11 casts spread the links thin. A 2.5 s cooldown for 3 stars that live 12 s works, but the beam tick is `6 * n.mul` every 0.25 s per enemy per link (24 dps a link). That is fine as area denial. No balance change; it's a control move.
- **[performance]** Avg frame cost 441.7 ms, the highest of the kit (harness noise is large, so treat this as low confidence). `upd` runs a `filter` over every entity each frame per node. Cache the partner list on `tick` instead. Impact low, effort M.

## E: Meteor Shower
- **[visual]** The comets are thin white streaks that all come in on the same +8,+8 diagonal (m3_MeteorShower_045/074). They read as one falling line, not a shower, and land beside the pack. Change: random approach angle per meteor (`e.x + 8 -> e.x + Math.cos(a)*8` with `a = rand(0,TAU)` passed in the fxe payload) and larger comets (`modelFx(..., .36` plus `o.scale.setScalar(1.6)`). Impact med, effort S.
- **[balance]** 12 x 22 raw in a 6 m area on a 12 s cooldown is 264 dmg on paper, but scattered across `sqrt(rand)*6` most meteors miss a single target. Against the boss, tighten the spread: `R2 = 6 * c.st.aoe -> 4.5 * c.st.aoe` (aimR to match: `aimR: 6 -> 4.5`). Impact med, effort S.

## R: Supernova
- **[balance]** See the root cause above (14 casts in a 30 s crowd fight). Impact high, effort S.
- **[visual]** `whiteFx = 1` on every nova. In the crowd run the screen is washed out almost permanently (kit_1199, boss_1199 are near-white). Even after the recharge fix it is the strongest flash of any ult. Change: `whiteFx = 1 -> whiteFx = Math.max(whiteFx, .6)` and `flash(..., 150 -> 100, .6)`. Impact high, effort S.
- **[visual]** The charging star sits at `n.y + 5.5`, straight above the player and outside the first-person view, so the 2 s build-up is invisible (m4_Supernova_010/045 show only the cast glyph and stray particles). Change: put it ahead of the player, `o.position.y = n.y + 5.5 -> n.y + 3.5`, offset 4 m along the facing, so the player watches it grow. Impact med, effort S.
- **[performance]** Peak particles 732, the highest of the kit, from 6 inflow particles per frame. Change `i < 6 -> i < 4`. Impact low, effort S.

## Passive: Stellar Rhythm / Starstruck
- **[balance]** +12% vuln is on par with other damage-amp statuses. It also multiplies the Supernova self-charge, which the root-cause fix covers. No change.
- **[visual]** Enemy hit glow shows as orange/gold cracks (m1_OrbitingMoons_045, m2_Constellation_045), a warm colour that doesn't say "cosmic". If that is the Starstruck overlay, tint it to `0x9aa8ff`. Unverified whether it is the status overlay or the generic hit flash. Impact low, effort S.

---

## Top 3
1. Stop ultimates from charging the ultimate (js/sim.js:363 skip `addUlt` for slot-4 hits), or cosmic-only: Supernova `r 14 -> 10`, `140 -> 110`. This fixes the 3.16x crowd outlier.
2. Star Shot `8.5/30 -> 10/36` and Moons `30 -> 36` to lift boss dps from 0.73x toward 0.85x.
3. Supernova `whiteFx = 1 -> max(whiteFx,.6)` plus the charging star moved into view, and Moons orbit `+1.6 -> +2.6`, scale `1.5 -> 1.1`, so the screen stops getting blinded and blocked.
