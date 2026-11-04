# Gravity playtest report

**Verdict:** solid crowd control kit that lands right on the crowd median, but bosses shrug it off (0.54x); polish Repulsor's in-face rings and trim Singularity's particle spray.

| Metric | Value |
|---|---|
| Crowd dps (30 s, wave-5 crowd) | **231** (49 kills, 461 HP lost, 36 healed) |
| Boss dps (30 s, Tyrant) | **72.5** |
| x-median (19 elements: crowd 225.1, boss 134.3) | crowd **1.03x**, boss **0.54x** |
| Worst frame cost | Repulsor 173 ms avg / 3328 ms worst; Levitate 3084 ms worst (all frame times inflated ~10x by 30 parallel runs, compare only relatively) |

**Harness caveats (read before trusting per-move dmg):**
- First run timed out on `page.goto` under load; the retry finished in 150 s.
- Crush, Levitate, Singularity show **0 dmg** in the move test because `MP.aim()` pitches at the nearest enemy's chest (near horizontal), so `groundAt()` (js/sim.js:192) clamps the aim target to max range, 20-22 m out, *behind* the pack. You can see it in `m4_Singularity_045.jpg`/`_074.jpg`, where the hole opens far right-back of the lineup. The kit/boss bot uses the same aim, so gravity's three aimed moves are **under-counted** in both dps numbers. This hits every aim-mode element.
- Repulsor 0 dmg is real: the showcase pack stands 10-12 m away and Repulsor reaches 7 m.
- `kit_*.jpg`/`boss_*.jpg` are blank or blown-out frames (sim runs unrendered), so no visual evidence there.
- drawCalls/triangles peak = 1 for every move (the counter resets per frame), so they're unusable.

---

## LMB: Graviton (cd .55, 22 dmg implosion r2, pulls in 3.5 m)
- **[visual]** Readable and on theme. `m0_Graviton_010.jpg` shows a bright violet orb with a swirling ring and ground suck particles, clearly gravity. The orb reads pink-white rather than the "black core" the vault note promises, because `light: 5` plus the white suck particles wash it out. Proposal: `look.light: 5 -> 3` and `suck: [0xc080ff, 2.4] -> [0x8040d0, 2.4]` so the core reads darker. Impact low, effort S.
- **[feel]** The implosion is over before it registers: by `m0_Graviton_045.jpg` (0.75 s) nothing is left, because the hole model lives only .35 s. Proposal: `modelFx('gravity__hole', ..., .35 -> .5, ...)` and `burst(... 30 -> 20 particles)` to keep the cost level. Impact low, effort S.
- **[balance]** Graviton carries the boss fight: 48 casts x 22 is about 1056 of the 2175 boss damage. Proposal: `dmg: 22 -> 25` (boss about +5 dps; crowd about +8, still about 1.07x). Impact med, effort S.

## RMB: Crush (cd 6, 55 dmg r3.5, stun 1 s, slams airborne)
- **[balance]** Against the Tyrant the stun is cut to .35 s (`cc` boss `t *= .35`, sim.js:236) and there's no slam, so Crush is a plain 55 hit every 6 s. Proposal: give it a boss rider in `cast`: after the `boomAt` loop, `if (ET[e.type].boss) damage(e, 45 * c.dmg, 'gravity', p);` (about +225 dmg / 30 s, +7.5 boss dps). Impact med, effort S.
- **[feel]** The combo works in code: Crush on a Levitated enemy replaces the `lift` cc with a stun, so `vy = -26` slams it. Fall damage is about (29-13)x2.4x1.5 = 58, on top of 55 x2 (passive) x1.25 (Levitate vuln) = 137. That's a strong payoff. No change.
- **[visual]** Not judgeable from screenshots (the target landed behind the pack, `m1_Crush_022.jpg`). Code layers falling rings, ground ring, dust, scar and 6 debris, which should be enough. Peak 446 particles / 34 fx objects is in line with the kit. No change.

## Q: Levitate (cd 9, 22 dmg r4.5, lift 2.2 s, +25% dmg taken)
- **[balance]** Bosses are lift-immune (`cc` returns false, sim.js:236), and `e.fv` is only set inside `if (cc(...))`, so against a boss Levitate is a bare 22 dmg. Proposal: in `cast`, move `e.fv = .25; e.fvU = S.t + 2.2;` out of the `if`, so bosses still take +25% for 2.2 s. Keep the lift itself gated. Impact med, effort S.
- **[performance]** Each cast spawns 10 `modelFx` pebbles plus 40 `emit` particles. 476 peak particles and 32 fx objects, with a 3084 ms worst frame (a load spike, but the second worst in the kit). Proposal: `for (let i = 0; i < 40; ...) -> 24` emits. Impact low, effort S.
- **[visual]** Not visible in the move shots (aimed at 20 m, behind the pack). The `circleFx` + rising rubble design is distinctive on paper. No change.

## E: Repulsor (cd 9, 24 dmg r7, kb 18, reflects shots within 9 m)
- **[visual]** Clutter: the two `ringFx` around the player (r7 at y .3 and r5.6 at y 1.2) sweep through the first-person camera as thick purple bands across the lower third of the screen (`m3_Repulsor_010.jpg`, `_022.jpg`). Proposal: drop the y 1.2 ring (`ringFx(e.x, 1.2, e.z, e.r * .8, 0xe0c0ff, .3)` -> delete), or lower it to `y .6`. The dome already sells the blast. Impact med, effort S.
- **[performance]** Highest avg frame cost in the kit (173 ms vs Graviton 80 under the same load) and 496 peak particles, from `burst(e.x, 1, e.z, 50, ...)`. Proposal: `burst(... 50 -> 30 particles)`. Impact low, effort S.
- **[feel]** The 7 m reach is short next to the 9 m reflect radius: in the showcase it whiffed the whole pack at 10-12 m (0 dmg). Proposal: `boomAt(c, p.x, .8, p.z, 7 -> 8, ...)`. Impact low, effort S.

## R: Singularity (life 4.5 s, pull r15, grind 4-14 per .25 s within 3.2 m, 100 dmg collapse r6)
- **[performance]** Heaviest particle load in the kit: **689 peak** (2.2x Graviton). `view.upd` emits 8 particles every rendered frame, so the cost scales with fps rather than time. Proposal: `for (let k = 0; k < 8; k++) -> k < 5`. Impact med, effort S.
- **[visual]** The hole is readable even at 20 m (`m4_Singularity_045.jpg`: purple accretion disc with a white ring) and clearly unlike other ults. At 1.2 s (`_074.jpg`) no enemy has visibly moved yet, because pull scales with `1.3 - d/15` and is weak at the rim. Proposal: `pull(e, n.x, n.z, 30 -> 36 * dt * ...)` so the drag reads in the first second. Impact med, effort S.
- **[balance]** Bosses don't get pulled, and the grind radius (3.2 m) is smaller than the Tyrant's footprint, so a hole aimed at the boss's feet only grinds when it is near dead centre. Proposal: `enemiesNear(n.x, n.z, 3.2 -> 4)` in the pulse. Impact med, effort S.

## Passive: Crushing Weight (x2 dmg vs `e.y > .4`; slams +50% fall dmg)
- **[balance]** sim.js:331 doubles damage against *anything* above .4 m, so permanently flying enemies (fliers, levitating drones) always take x2 from gravity, not only lifted ones. That's probably unintended, though it helps vs the crowd. Proposal: `e.y > .4 -> e.y > .4 && !ET[e.type].fly && !e.fly`. Impact low, effort S. If crowd dps then drops below 0.95x, take Graviton to 26 instead of 25.
- **[feel]** The fall-damage bonus is keyed on the gravity status (`e.st` has `gravity`, sim.js:872), which every gravity hit applies, so it works as described. No change.

---

## Top 3
1. **Levitate vuln on bosses:** set `e.fv = .25; e.fvU = S.t + 2.2` even when `cc(e,'lift')` fails. Add the **Crush boss rider** `+45 * c.dmg` and **Graviton `dmg: 22 -> 25`**. Together about +18 boss dps (0.54x -> about 0.68x, still under median as a control element).
2. **Repulsor:** delete the y 1.2 `ringFx` that bands across the first-person view, and cut `burst 50 -> 30`.
3. **Singularity:** emit `8 -> 5` particles per frame (689 peak, the kit's worst), and widen the grind `3.2 -> 4` m so it bites big bosses.

Also: fix the harness aim (aim at the enemy's feet, or set `tgt` to the enemy position for `mode: 'aim'`), then rerun. Gravity's real dps is higher than measured, because three of its five moves land 20 m behind the target.
