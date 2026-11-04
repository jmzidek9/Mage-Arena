# Arcane playtest report

**Verdict:** A clear, readable kit. Polymorph is the best-looking crowd control in the game. The headline numbers are false, though: the ultimate refills itself and stacks rift on rift, so the boss fight becomes a white-out at 6.7x median. Once that loop is fixed, Arcane will likely fall below the band in crowds, because almost everything it has is single-target.

| | value |
|---|---|
| Crowd dps (kit, 30 s, wave-5 x8) | **278.4** (71 kills, 489 hp lost, 0 healed) |
| Boss dps (Tyrant, 30 s) | **913.2** (0 hp lost) |
| x-median (crowd 218.1 / boss 137.1, refreshed `median.json`) | **1.28x crowd / 6.66x boss**. Both inflated by the ult loop (Torrent cast 8x crowd, 25x boss, ready 100% of the time). |
| Worst frame | Arcane Familiar, 5634 ms single frame (first spawn of the owl model). Barrage has the highest average, 387 ms. Absolute ms are inflated by many parallel harnesses. |

**Estimate without the ult loop (from the code, not measured):** Missiles 50 casts x 18 x 1.32 ≈ 1.2k, Barrage 10 x 10 bolts x 12 x 1.32 ≈ 1.6k, Familiar ≈ 0.6k, Polymorph ≈ 0.05k, plus 10% spellbound. That comes to about **125-130 dps crowd (~0.6x)** and **~125 dps boss (~0.9x)**, plus one honest Torrent (~800 damage) every so often. So boss would be fine and crowd too low.

---

## LMB: Arcane Missiles (dmg 20 into pack, 242 ms avg, 285 particles, 8 fx)
- **[visual]** The three weaving missiles, the cast circle and the impact bloom read well and are clearly arcane purple (m0_ArcaneMissiles_010). On impact the golem flashes completely white (m0_ArcaneMissiles_022). That comes from the shared hit flash (`v.flash`, view.js:885) plus bloom, not from Arcane, so there is no Arcane change. impact low.
- **[balance] med.** 6 per missile, 18 per cast, single target. This is most of the kit's sustained damage, and its cooldown was ready only 7% of the time, so it is cast constantly. After the ult fix, crowd damage needs a lift. Proposed change: `dmg: 6 * c.dmg` -> `7.5 * c.dmg` (elements.js:2101). impact med, effort S.
- **[feel] low.** Every cast adds a charge (`onCast`, elements.js:2098), so 4 casts (2.2 s) always max the charges before Barrage's 3 s cooldown is back. Barrage is therefore always the full 10 bolts, and "spend your charges" is never a real choice. Possible change: grant the LMB charge only when a missile hits. Move `p.bd.arc++` for slot 0 out of `onCast` and into a `shot.hit` hook, so aiming is rewarded. impact low, effort S.

## RMB: Arcane Barrage (dmg 25 with 0 charges, 387 ms avg = the kit's highest, 418 particles, 14 fx)
- **[visual] med.** The bolts and the purple cast circle look good (m1_ArcaneBarrage_010). But 10 hits in 0.5 s keep the shared hit flash on, so the whole pack glows orange-gold (the golems' own emissive markings plus bloom; m1_ArcaneBarrage_022/045). The payoff reads as fire, not arcane. Proposed change: tint the impact to the element with a small purple `burst` at each bolt hit: add `shot: { hit(s, e) { ... burst(..., 0xe090ff, ...) } }` or reuse `fx.det` from Missiles. impact med, effort S.
- **[balance] med.** 12 per bolt x 10 x 1.32 ≈ 158 into one target every 3 s. That is strong single-target damage, but zero cleave. For crowds, give the bolts `pierce: 1` in the `shoot(...)` options (elements.js:2105), so a bolt that kills or passes through still hits the monster behind. Keep 12. impact med, effort S.
- **[performance]** The highest average frame cost of the kit (10 shots with `light: 3` each, plus trails). Proposed change: `light: 3` -> `light: 2` in `look` (elements.js:2106). impact low, effort S.

## Q: Arcane Familiar (dmg 22 in window, 257 ms avg, **5634 ms worst**, 467 particles, 1 ent)
- **[visual] high.** The owl ends up in your face. In m2_ArcaneFamiliar_074 a huge pale owl covers the lower right third of the screen. It spawns at your own position (`ent(p, c, p.x, p.z, { y: p.y + 2.4 })`) and circles at radius 2.6, height +3, at scale 1.5, so on the way back from a swoop it flies through the camera. Proposed changes (elements.js:2109/2116/2125): circle radius `2.6` -> `3.6`, height `p.y + 3` -> `p.y + 4`, spawn 2 m ahead (`p.x + c.flat.x * 2, p.z + c.flat.z * 2`), and `o.scale.setScalar(1.5)` -> `1.2`. impact high, effort S.
- **[visual] low.** During swoops (frames 010-045) you can barely see the owl, so its strikes read only as hit flashes. The `rake` fx (18 particles plus a flash) is small next to the hit flash. Proposed change: `burst(..., 18, ...)` -> `26`, and add a short `ringFx` under the target so the 20% mark is visible. impact low, effort S.
- **[performance] low.** The 5.6 s worst frame is the owl model's first use (shader compile). Possible change: prewarm `arcane__owl` with the other models when the kit is selected. effort M.
- **[balance]** 22 per strike, about 1 per second, plus the mark and a charge. Fine. Cooldown ready 1%. No change.

## E: Polymorph (dmg 15, 94 ms avg, 681 particles = highest non-ult peak, 15 fx)
- **[visual]** Excellent. Three sheep hop where the monsters stood, and you instantly know who is out of the fight (m3_Polymorph_074). Keep.
- **[visual] med.** In m3_Polymorph_010 the lower right is covered in large soft purple blobs. These are your own Arcane charge orbs, drawn very close to the camera (view.js:1063: `rr = mine ? .9`, height `+ .9`, scale `.35`). The same happens with every Arcane move at 3-4 charges. Proposed change for `mine`: `rr` .9 -> 1.3, height `.9` -> `.5`, add `fade(o, .7)` like the swords. impact med, effort S.
- **[performance] low.** `poof` is 60 particles per sheep (40 white + 20 purple), plus the orb's trail with `light: 5`. Proposed change: `burst(..., 40, 0xffffff, ...)` -> `28`. impact low, effort S.
- **[balance]** 4 s on 3 targets, damage doesn't break it, and bosses resist. Strong, but that is the point of a 12 s cooldown control move. No change.

## R: Arcane Torrent (dmg 67 in window, 95 ms avg, 588 particles, 25 fx). **Affected by the ult loop**
- **[balance] high.** 38 missiles x 16 = 608 base, ~800 with charges. Every missile hit refills the ultimate, so it was ready 100% of the time: 8 casts in the crowd, 25 on the boss. Besides the shared `noUlt` fix, it also needs **one rift at a time**. Nothing clears the old rift, so 25 overlapping rifts each rain 38 missiles. Proposed change: start `cast` with `for (const n of entsOf(p, c.m.key)) n.dead = true;` (the same line Familiar uses, elements.js:2109). After both fixes, keep 16 damage and re-bench. impact high, effort S.
- **[visual] high.** The boss run is a total white-out (boss_1199 is pure white, boss_599 is mostly white). The cause is stacked rifts, each missile with `light: 4` and `sc 1.3` (inherited from `arcane.0`'s look), all hitting one target. The one-rift fix above solves most of it. Also cap the light: torrent missiles should use a `light: 2` look of their own instead of borrowing `MOVE['arcane.0']`'s. impact high, effort S.
- **[visual] med.** In first person you can't see the rift: it sits 7.4 m straight above you (`u.rift.position.y = 7.4`), so you only see missiles streaking in from the top edge (m4_ArcaneTorrent_022/074). Meanwhile the r-3 zone circle at your feet paints the bottom of the screen pink (kit_1199, m4_ArcaneTorrent_074). Proposed changes: in `view.upd`, for your own rift only, offset it 4 m along your aim and lower it to `5.5` (and the missile origin `(n.y||0) + 7` -> `+ 5.5` to match). Set the zone opacity `a * .6` -> `a * .3` for `mine`. impact med, effort S/M.

## Passive: Arcane Charges (+8% per charge, up to 4) and Spellbound (+10% damage taken)
- **[feel]** The HUD's `CHARGES` pips plus the orbiting orbs make the mechanic easy to read. The only problem is the orb placement in your own view, covered under E above.
- **[balance]** Missile spam keeps the charges at 4 almost all the time, so in practice the passive is a flat +32% damage and Barrage is always full. That is fine as a number, but it removes the decision (see the LMB feel note). If you change charges to come from LMB hits, re-bench, because sustained damage drops a little.

## Top 3
1. **Torrent: one rift at a time** (`entsOf(p, c.m.key)` -> `dead` at the top of `cast`), plus the shared `noUlt` fix. This removes the 6.7x boss number, the 25 stacked rifts and the boss white-out.
2. **Familiar out of your face:** orbit 2.6 -> 3.6 m, height +3 -> +4, spawn 2 m ahead, scale 1.5 -> 1.2.
3. **Crowd damage after the loop fix (~0.6x estimated):** Missiles 6 -> 7.5, and Barrage bolts get `pierce: 1`. Then move your own charge orbs out of the camera (view.js:1063: rr 1.3, height .5, fade .7).
