# Laser playtest report

**Verdict:** the ultimate loop carries the whole kit. Prism Nova was cast 35 times in 30 s, and the screen washes out. Underneath, the basic kit is weak and hard to see: the beams from your own hand barely show up in first person.
**Crowd dps** 1455.9 (6.68x median 218.1) | **Boss dps** 195.9 (1.43x median 137.1) | median from `playtest/out/median.json` | **Worst frame:** Prism Nova, 619.6 ms avg / 2295.8 ms worst (inflated: 11 harnesses ran at once, so only compare between moves)

Kit (30 s, wave-5 crowd): 357 kills, 11 HP lost, 0 healed. Casts: Pulse 69, Ricochet 7, Refractor 6, Drone 2, **Prism Nova 35** (ready 100% of the time). Boss: 464 HP lost, Nova 6 casts, ready 100% of the time.

**The ult loop hits Laser hard (known shared bug, `addUlt` in `damage()`).** Nova fires 8 beams with 3 bounces, which is about 32 segments sweeping a 34 m radius every 0.1 s. Every hit refills the meter. A rough estimate of the kit **without** Nova, from cast counts × per-hit numbers (6.5 Pulse, 18-58 Ricochet, 9 per Drone zap every 0.4 s, 25 Refractor burst, then ×1.12 Targeted and the bounce/Focus bonuses): about **90 crowd dps (0.4x)** and **55 boss dps (0.4x)**. So after the shared fix, Laser will be one of the weakest elements. It is not a control or defence element, so the buffs below are sized to bring the base kit to roughly 0.85x before the Nova is added back. Rerun the bench after the `noUlt` fix before applying them.

## LMB: Pulse Laser (line 2037)
- **[visual] (high)** The pulse is almost invisible from your own eyes. In m0_PulseLaser_003 and _010 the only feedback is the white hit flash on the golem. No green line is visible from hand to target. The cause is `laserFx` (line 146), which already shrinks your own beam to `w *= .55`. With `w: .05` that leaves a white core of about 0.012 m and a glow of 0.047 m, shown for only 0.16 s. Proposal: in the Pulse cast, `w: (c.mega ? .12 : .05)` -> `(c.mega ? .14 : .08)`, and pass a life of `.22` (`laserFx(e.pts, 0x2cff6a, e.w, .22)` in `fx.beam`). Impact high, effort S.
- **[balance] (high)** 6.5 damage per 0.3 s is about 22 dps on paper, the lowest LMB measured (Fireball does 26 per hit, Radiant Orbs 17). Focus only reaches +36% after 6 consecutive hits on one target. This move makes up most of the casts (69 crowd / 71 boss), so it drives the low base kit. Proposal: `6.5 * c.dmg` -> `9 * c.dmg`. Impact high, effort S.
- **[feel]** Beam thickness reads `p.bd.foc.n` even after Focus has expired (more than 1.5 s since the last hit). The beam stays thick while the damage bonus is gone. Proposal: `(1 + .12 * (S.t - p.bd.foc.t < 1.5 ? p.bd.foc.n : 0))`. Impact low, effort S.

## RMB: Ricochet Beam (line 2040)
- **[visual]** The charge circle on the hand reads well (m1_RicochetBeam_045). The beam itself falls between the screenshot frames: it is released around frame 50 and lives 0.3 s, so frames 45 and 74 miss it. Its width is capped at `Math.min(e.w, .2)` and then shrunk by 0.55 again for your own view, about 0.11 m. That should read, but it could not be confirmed. Low-risk polish: add a short fov kick on release (`if (isMe(...)) fovKick = .4`, like Barrage) so the big shot feels weighty. Impact med, effort S.
- **[balance]** 58 damage into the 6-pack at full charge (0.8 s charge, 4 s cooldown). That is low next to Railgun 120 and Flamethrower 118, even with up to 4 bounces at +25% each. Proposal: `(18 + 40 * c.k)` -> `(24 + 56 * c.k)`. Impact med, effort S.

## Q: Refractor (lines 2042-2049)
- **[visual]** The lens is placed at 1.6 m height up to 24 m away. In m2_Refractor_045 it is a small green ring above the spider, easy to lose in the pack. Proposal: `u.lens.scale.setScalar(1.6)` -> `2.2` and `u.prism.scale.setScalar(.45)` -> `.6`. Impact med, effort S.
- **[balance]** 0 damage in the solo test, which is expected: it only pays off when another laser passes through it, so the harness under-measures it. The expiry burst `25 * n.mul` is the only damage it deals on its own. Proposal: `25` -> `40`, so placing a lens and walking away is still worth the slot. Impact low, effort S.
- **[feel] (med)** The split beams call `laserShot(p, ...)` with the player, so they overwrite Focus (line 54). Each split's first hit becomes the new Focus target and resets the stacks you built with Pulse. Using the lens therefore destroys your Focus. Proposal: give `laserShot` a `foc = true` flag, pass `false` from the split (line 58) and from the drone (line 2058), and only run the line 54 update when it is set. Impact med, effort S.

## E: Laser Drone (lines 2050-2063)
- **[visual] (med)** The drone orbits only 1.8 m from you at +2.6 m height. Looking slightly up, it fills a corner of the view: in boss_599 a big green/orange saucer covers the top-right of the screen. Looking ahead, it is out of sight and its 0.045 m zaps are not readable (m3_LaserDrone_045 shows no drone and no beams). Proposal: orbit radius `1.8` -> `2.8` and height `2.6` -> `3.2` (both on line 2054), and zap width `.045` -> `.07`. Impact med, effort S.
- **[balance]** 9 damage every 0.4 s is about 22 dps on one target for 12 s, on a 15 s cooldown (47 damage in the 1.25 s window). Proposal: `9 * n.mul` -> `12 * n.mul`. Impact med, effort S.
- **[feel]** Drone shots also reset your Focus whenever the drone picks a different enemy than you (same `laserShot(p, ...)` issue as Refractor). The fix is the one under Refractor.

## R: Prism Nova (lines 2064-2089, novaBeams line 63)
- **[balance] (high)** Affected by the shared ult loop: 35 casts in 30 s against the crowd, 6 against the boss, ready 100% of the time. One cast does 220 damage into the 6-pack (28 per hit, ×1.25 per bounce, 0.25 s per-enemy gate). That is fine for an ultimate once it stops refilling itself. Fix it through the shared `noUlt` flag; no number change here.
- **[visual] (high)** With the loop, overlapping Novas wash the whole screen out to pale green-white (kit_599, kit_1199). Even a single Nova reads as white rather than Laser green. The beams start at -0.3 pitch, hit the floor and bounce straight up, so you see vertical white columns (m4_PrismNova_045/074) rather than a spinning green star. On your own Nova the glow tube is faded to `.35` and the white core to `.45` (line 2083), so the core dominates. Proposal: on your own Nova, swap the two fades, glow `.55` and core `.3`, and flatten the angle `-.3` -> `-.12` in `novaBeams` so the first segment travels further before it bounces, which makes the star shape read across the arena. Impact high, effort S.
- **[performance]** 544 peak particles and 28 fx objects for a single cast; this is acceptable. It reuses 64 beam meshes (8 beams × 4 segments × 2), which is good. The real cost comes from the loop stacking casts. Optionally lower the per-segment `burst` chance `.15` -> `.08` (line 2084). Impact low, effort S.

## Passive: Ricochet and Focus (laserShot, lines 35-61)
- **[balance]** Bounce +25%, head crits ×1.75, Focus +6% per stack up to +36%, and Targeted +12% are all multipliers on base numbers that are too small (see Pulse). The fix is the base damage above, not the passive.
- **[feel]** The `FOCUS` pips on the HUD (view.js line 1155) are good, but Focus is shared with the drone and lens shots and gets reset by them (see Refractor). With that fixed, the passive does what its text says.
- **[visual]** Enemies hit by Laser glow orange/gold (m1_RicochetBeam_010/022, m3_LaserDrone_045), not green. This looks like the shared hit glow, so it was not investigated further. A green tint would tie hits to the element. Impact low.

## Top 3
1. **Ult loop (shared `noUlt` fix), plus Nova readability:** 35 Nova casts per 30 s whites out the screen. On your own Nova, swap the fades to glow `.55` / core `.3` and set the `novaBeams` pitch `-.3` -> `-.12`.
2. **Base kit buff for after the fix (about 0.4x without Nova):** Pulse `6.5` -> `9`, Ricochet `(18 + 40k)` -> `(24 + 56k)`, Drone `9` -> `12`, Refractor burst `25` -> `40`.
3. **Make your own lasers visible and keep Focus intact:** Pulse `w .05` -> `.08` with life `.22`; drone orbit `1.8` -> `2.8` at height `3.2`; drone and lens shots must not overwrite Focus (a `foc` flag on `laserShot`).
