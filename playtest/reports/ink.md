# Ink playtest report

**Verdict:** a good-looking, readable control kit (mire, root, cage), but it hits too softly: both the crowd and the boss number sit far below the band, and the ultimate does almost nothing to a boss. **Crowd 124 dps (0.57x median 218.1), boss 75.1 dps (0.55x median 137.1)**. Worst frame: Ink Dragon, 12270 ms on one frame (average 654 ms; every run was slowed by 10+ parallel agents, see Performance).

Median from `playtest/out/median.json` (refreshed with `--median`). Ink is a control element, so landing a bit under the band is fine (target about 0.75-0.85x), but 0.57x / 0.55x puts it next to Abyss and Wind. The kit run lost 472 HP, which is mid-pack, so the control works. The damage is what's missing.

Harness notes (same as earlier reports): the showcase pack stands 10-12 m out. Brush Stroke (r 7.5) reached nobody, and both aim moves (Pool, Dragon) landed on the caster, so the per-move numbers for slots 1, 3 and 4 (0 dmg) say nothing. The Dragon's dive only lands at t = 4.45 s, after the 1.25 s window, so its `ultDmg 0` is also an artifact. The orange glowing runes on the enemies in most `m*` shots aren't from Ink. The white-out in `boss_599/1199.jpg` is the Tyrant's beam (orange rings), not an Ink effect.

## LMB: Ink Bolt
- **[visual]** The impact is too small to see at 11 m: `m0_InkBolt_022.jpg` shows only a few blue specks, and no ink stain stays on the floor by `m0_InkBolt_074.jpg`. That's because the splash decal is `inkDecal(e.x, e.z, e.r * .55, 1.6)`, which is 1.1 m and gone in 1.6 s. Change in `fx.splash`: `e.r * .55, 1.6` -> `e.r * .8, 2.5`, and the burst colour `0x5a70ff` -> `0x2a3cd0` so it reads as ink rather than glow. Impact med, effort S.
- **[balance]** This is the main single-target source (65 casts in 30 s), at `14.5 * c.dmg` plus a splash of `.5`. Change: `dmg: 14.5` -> `18`, and in `shot.end` `inkSplash(s, e, 2, .5)` -> `inkSplash(s, e, 2.2, .6)`. That adds about 20% to both boss and crowd damage. Impact high, effort S.
- **[feel]** The lob (`grav: 5`, speed 34) misses moving targets at range. `m0_InkBolt` hit 1 enemy for 15 out of a pack of 6. Change: `grav: 5` -> `3.5`. Impact low, effort S.

## RMB: Brush Stroke
- **[visual]** The painted brush sweep reads well and is clearly a brush (`m1_BrushStroke_003.jpg`, `kit_599.jpg`). The crescent of wet ink it leaves only shows as two thin lavender lines (`m1_BrushStroke_010/045.jpg`). It doesn't read as a 5 s mire zone. Change in `view.make`: `model('ink__stroke', 0x3a52ff, …)` -> `0x1e2a99` (darker, so it reads as ink), and add a short `inkDecal` along the arc at cast, the way Ink Pool does it. Impact med, effort S.
- **[balance]** 30 damage every 5 s in a 120° cone. Change: `30 * c.dmg` -> `40 * c.dmg`. The mire only applies on the outer band (`d > n.r * .62`), so enemies standing close to you aren't slowed. Change: `.62` -> `.35`. Impact med, effort S.

## Q: Ink Koi
- **[visual]** The three koi are visible as purple-white glows that swim low and hunt (`m2_InkKoi_010/022.jpg`). Their bloom makes them glow rather than look like ink: `look.light: 2` -> `1`, and the trail colour `0x9aa8ff` -> `0x3a52ff` only. Impact low, effort S.
- **[balance]** 141 damage into the pack, the best per-move result in the kit. Keep the damage. Change `cd: 9` -> `8` so it shows up more in the rotation (2% ready, cast 4x in 30 s). Impact low, effort S.

## E: Ink Pool
- **[visual]** Not judgeable from the showcase: the aim landed on the caster, and only blue bubble specks at the bottom edge show (`m3_InkPool_045.jpg`). Nothing covers the view, which is good.
- **[balance]** The seize (14 + a 1.5 s root) is strong control. The 8 per second while wading is low for a 12 s cooldown. Change: `hitEnemy(e, 'ink', 8 * n.mul, …)` -> `12 * n.mul`. Impact med, effort S.

## R: Ink Dragon (ultimate)
- **[balance]** On a boss the dragon does about 90 total. The cage skips bosses (`filter(e => !ET[e.type].boss)`), and the coil's `blast(n.x, n.z, 3, 16 * n.mul, …)` follows the head at radius 9 -> 5 m around the centre, so it never touches a boss standing in the middle. Only the dive lands. Change: in `tick`, inside the `pulse(n, dt, .25)` branch, also do `blast(n.cx, n.cz, n.r * .45, 6 * n.mul, ctxN(n), { raw: true })` (the "ink rains on them" from the desc), and raise the dive `90 * n.mul` -> `120 * n.mul`. Impact high, effort S.
- **[balance]** This ult is affected by the shared refill bug: `cooldownReadyPct 100`, cast 4x in the 30 s kit run and 3x on the boss. The numbers above assume that bug gets fixed. Without the fix the extra ring blast would make the recast loop worse, so ship it after the `addUlt` fix.
- **[visual]** The dragon body isn't visible in any `m4` shot, because it orbits the caster (aim on self). Only the ground circle (`m4_InkDragon_074.jpg`, blue arcs) and some glowing blobs near the hands (`m4_InkDragon_045.jpg`) show. Those blobs could be close segments blooming. If so, `light`/emissive on `ink__dragon_seg` should be lowered so the body reads as dark ink. Verify in a manual run with the target 15 m out. Impact med, effort S.
- **[performance]** Worst frame 12270 ms on the first frame of the cast, 30 `ink__dragon_seg` models + head built in `view.make`. That's most likely first-use shader compile / model build. Pre-warm `ink__dragon_seg` in the warm-up, or build the segments from one cloned geometry. Avg 654 ms is the highest of the kit, but it's inflated by parallel runs. Impact med, effort M.

## Passive: Bleeding Ink (kill splash 15 in 3 m, inked -25% speed)
- **[feel]** The chain splash on kill fits the element and the `kit` run got 38 kills. The slow is visible as enemies lag, but no shot shows an inked tint on enemies, so "inked" isn't readable. Not changed here (it needs a tint, like Frost's ice-blue).
- **[balance]** Change: `15 * c.dmg` -> `20 * c.dmg` in `onKill`. That's crowd only, and it chains better in dense waves. Impact med, effort S.

## Performance (measured)
Frame averages are dominated by the parallel runs: 128 / 274 / 449 / 424 / 654 ms for slots 0-4. Particles peak at 628 (Koi) > 499 (Pool) > 475 (Dragon) > 442 (Brush) > 285 (Bolt), all moderate. FX objects peak at 28 (Koi). The only outlier is the Dragon's 12 s first frame (see above). Ink Bolt also had a 2768 ms first frame, again likely first-use compile.

## Top 3
1. **Damage up across the kit (control element, aim ~0.8x):** Bolt `14.5 -> 18` with splash `.5 -> .6`; Brush `30 -> 40`; Pool tick `8 -> 12`; passive splash `15 -> 20`.
2. **Ink Dragon vs bosses:** add a centre rain `blast(n.cx, n.cz, n.r * .45, 6 * n.mul)` on the .25 s pulse, and dive `90 -> 120`. Land this after the shared `addUlt` refill fix.
3. **Make the ink read as ink on the floor:** Bolt decal `r * .55, 1.6 s -> r * .8, 2.5 s`; Brush crescent colour `0x3a52ff -> 0x1e2a99`; mire band `.62 -> .35`. Also pre-warm the dragon segments (12 s first frame).
