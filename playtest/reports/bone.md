# Bone playtest report

**Verdict:** a strong theme with very good models (skeletons, rib cage, dragon). Damage sits under the band on both axes, the self-cast skeleton and cage block the view, and the ultimate recasts itself. **Crowd 163.6 dps (0.75x median 218.1), boss 91.0 dps (0.66x median 137.1)**. Worst frame: Bone Cage 2551 ms (avg 638 ms; inflated by ~10 parallel runs, see Performance).

Median from `playtest/out/median.json` (refreshed this run). Bone is a summoner/damage element, not control, so 0.75x crowd and 0.66x boss are both too low. It also lost 620 HP in the kit run (lowest 380) and 603 against the Tyrant, so the skeletons aren't taking much pressure off you.

Harness notes: in the 1.25 s showcase, Marrow Burst (no skeletons yet, so it only raises one), Bone Cage (aim landed off to the side of the pack, `m3_BoneCage_074.jpg` shows an empty cage) and Bone Dragon (first strafe starts at 0.6 s from 9 m out) all show 0 dmg. Those zeros say nothing about balance. The orange glowing runes on enemies in most `m*` shots are harness/other effects, not Bone. The full-screen whiteout in `boss_1199.jpg` / `boss_1799.jpg` comes from the Tyrant, not from Bone.

## LMB: Bone Toss
- **[visual]** The spinning bone reads well in flight (`m0_BoneToss_003.jpg`, big white bone with a dust trail), but the hit barely shows: `crack` is 10 small particles, and by frame 22/45 nothing is left (`m0_BoneToss_045.jpg`). The root that pins the last target has no visual at all. Change `fx.crack`: `burst(..., 10, 0xe9dcc0, 4, .12, .3, 6)` -> `burst(..., 16, 0xe9dcc0, 5, .14, .35, 6)` plus `debrisFx(e.x, e.y, e.z, 3, 'bone__bone', 0xe9dcc0, .15, 6)` (the Marrow Burst helper, smaller). Impact med, effort S.
- **[balance]** Bone Toss is the boss damage: 53 casts in 30 s, about 1000 of the 2729 boss damage. `17 * c.dmg` at cd .5 is 34 dps, under Rune Bolt's per-cast pace with pierce. Change `dmg: 17 * c.dmg` -> `dmg: 21 * c.dmg`. That alone moves boss dps to about 0.75x and pierce helps the crowd too. Impact high, effort S.

## RMB: Cackling Skull
- **[visual]** The green-lit skull is the most readable projectile in the kit (`m1_CacklingSkull_010.jpg`, green glow on the brute). The `bite` effect is small (10 + 6 particles) and the bounce path is hard to follow once it's in the pack (`m1_CacklingSkull_022.jpg` is all orange bloom). Change: `look.light: 3` -> `4`, and in `bite` add `flash(e.x, e.y, e.z, 0x6affc8, 10, .12)` so each bite pops green, not orange. Impact med, effort S.
- **[balance]** 5 bounces x 18 = 90 into a crowd every 4 s is fine. Against a lone boss it bites once (18 dmg every 4 s, 8 casts = ~160 of 2729). Change: `dmg: 18 * c.dmg` -> `22 * c.dmg` and `cd: 4` -> `3.5`. Leave the bounce count alone. Impact med, effort S.

## Q: Marrow Burst
- **[visual]** With no skeletons the cast raises one at `p.x - c.flat.z * 1.6` (1.6 m to your side). It rises right next to the camera and covers the right third of the screen for several frames (`m2_MarrowBurst_010.jpg`). Change the offset to beside-and-ahead: `raiseBone(p, p.x - c.flat.z * 1.6, p.z + c.flat.x * 1.6, ...)` -> `raiseBone(p, p.x + c.flat.x * 2.5 - c.flat.z * 1.5, p.z + c.flat.z * 2.5 + c.flat.x * 1.5, p.yaw, c.dmg)`. It then rises in view and facing forward (now `p.yaw + Math.PI` faces you). Impact high, effort S.
- **[visual]** Skeletons render tan/orange under the arena's warm light (`m2_MarrowBurst_045.jpg`, `kit_1799.jpg`) and blend into the floor. Change `model('bone__skeleton', 0xe9dcc0, ...)` -> `0xf4ecdc` (whiter) in `bone.0` `view.make`. Impact low, effort S.
- **[feel]** The explosion (`fx.marrow`) is good: 40 particles, bone debris, ring, shake. Only 3 casts in 30 s (2% ready), so it's on cooldown almost all the time, as intended. No change.
- **[balance]** Skeletons do `13 * n.mul` per 0.9 s (~14 dps each, max 3). Raised from 25% of kills, they rarely stack up. Change `onKill` chance `.25` -> `.35`. That feeds Marrow Burst and raises crowd dps without touching the boss score. Impact med, effort S.

## E: Bone Cage
- **[visual]** The cage is a clear, distinctive rib cage that rises with `easeOutBack` (`m3_BoneCage_022/074.jpg`). But it reads as brown wood when lit from behind (`m3_BoneCage_074.jpg`). Change `model('bone__cage', 0xe9dcc0, ...)` -> `0xf4ecdc` and add `ringFx(n.x, .1, n.z, n.r, 0xe9dcc0, .4)` in `make` so the footprint shows when it bursts up. Impact med, effort S.
- **[visual]** Cast on or near yourself, the bars stand right around the camera and cover the left half of the screen (`kit_1799.jpg`). Change: when the caster is inside (`Math.hypot(p.x - t.x, p.z - t.z) < R`), have `view.upd` fade the cage to `fade(o, .35)`. Impact med, effort S.
- **[balance]** `22 * c.dmg` on cast plus 6 per 0.5 s on the bars is a control tool; 4 casts in 30 s. No damage change. The `ids` lock is the best part. Keep it.

## R: Bone Dragon (ultimate)
- **[visual]** The dragon model is great and reads at range (`m4_BoneDragon_045.jpg`), but the ghostfire breath is a thin line of wisps that doesn't read as a 3.5 m burning strip. Change: in `upd`, `if (Math.random() < .5) burst(bx, .2, bz, 4, ...)` -> `burst(bx, .2, bz, 7, 0xb8ffe8, 5, .3, .5, -2)` every frame, and `emit` count `7` -> `5` so the total stays similar. Impact med, effort S.
- **[balance]** The three chords miss the target centre by `R * cos((π - .7) / 2)` = 3.1 m, and the blast is r 3.5 two and a half metres ahead of the dragon. So monsters at the exact target point are barely clipped on each pass. Change the angle step `Math.PI - .7` -> `Math.PI - .4` (the miss drops to 1.8 m). Impact med, effort S.
- **[balance]** Hit by the known ult-refill bug: 5 casts in the 30 s kit run and 3 against the boss, `cooldownReadyPct` 100%. `30 * n.mul` every 0.2 s across a crowd refills the bar in one pass. No separate fix here; once `addUlt` ignores ultimate hits, recheck. Impact high (shared), effort S.

## Passive: Raise Dead (25% raise, Brittle +12%)
- **[feel]** Raised skeletons look and animate well (walk cycle, sword swing, `drop` collapse). A raise in the middle of a pack is easy to miss though: `dustFx` + 30 particles. Add `ringFx(n.x, .1, n.z, 1.2, 0x7affb0, .35)` in `bone.0` `view.make` so a new ally pops in ghost-green. Impact low, effort S.
- **[balance]** Chance `.25` -> `.35` (see Marrow Burst). Cap of 3 (passive) / 4 (Marrow) / 5 (Dragon) is fine.
- **[docs]** `vault/Elements.md` line 450 says Bone shows armor **plates** above the bar, but no Bone code builds plates. Remove that mention or add the HUD. Impact low, effort S.

## Performance (measured)
Frame times are dominated by ~10 headless runs sharing the machine (avg 113-638 ms per move), so only the relative numbers count. Worst frames: Bone Cage 2551 ms and Marrow Burst 2512 ms, likely first-use compile of `bone__cage` / `bone__skeleton` (both first spawned in those moves). Worth adding them to the warm-up. Particles peak: Dragon 602 > Skull 510 = Marrow 510 > Cage 506 > Toss 279; FX objects peak 39 (Dragon). Nothing out of line. Sim cost 2.67 ms/frame in the crowd kit.

## Top 3
1. **Damage up into the band:** Bone Toss `17 -> 21`, Cackling Skull `18 -> 22` and `cd 4 -> 3.5`, Raise Dead chance `.25 -> .35`. Aim: ~0.9x crowd, ~0.85x boss. Confirm with `node playtest/run.js bone`.
2. **Self-cast summons block the view:** Marrow Burst's lone skeleton spawns 2.5 m ahead and 1.5 m to the side, facing forward (not 1.6 m to your side). Bone Cage fades to .35 when you are inside it.
3. **Bone Dragon passes hit the target:** angle step `Math.PI - .7 -> Math.PI - .4`, plus a stronger ground burn burst. Then recheck after the shared ult-refill fix (5 casts in 30 s now).
