# Magma playtest report

**Verdict:** In band and plays to its fantasy (slow, heavy, lava everywhere). The work is polish: pools you can barely see, a Heat Wave that seldom melts anything, and an orange/white wash in crowd fights.
**Crowd dps:** 206.3 (0.92x median 225.1) | **Boss dps:** 146.3 (1.09x median 134.3) | **Worst frame:** 2826 ms (Magma Glob, first frames: shader warm-up while 30 headless runs shared the machine). Steady-state average was 122-209 ms/frame for every move, so absolute frame times are not meaningful. Compare the moves by particles and fx objects instead.

Harness caveats:
- Per-move `dmg` only covers 75 frames (1.25 s).
  - Meteor (1.6 s fuse) and Volcano (first bomb at about 2 s) always read 0.
  - Eruption also read 0: the aim point landed beside the pack, and the geyser rises right of the enemies in `m1_Eruption_074.jpg`.
  - Heat Wave lasts 3 s, so its 45 dmg is undercounted.
- In the kit run, Meteor was cast 6 times in 30 s (5 vs the boss). Its huge AoE refills the ultimate meter almost by itself, so a large share of the crowd dps is the ultimate.

---

## LMB: Magma Glob (cd 0.7, 14 dmg splash r 2.2, pool 4 / 0.5 s, cools to rock)
- **[visual]** The lava pool is nearly invisible. In `m0_MagmaGlob_045.jpg` and `_074.jpg` only a faint red smear shows under the brute, drowned by the floor's gold pentagram decal. Its particle trickle is `Math.random() < .3` with size .1-.25.
  - Change: line 1018, `Math.random() < .3 -> .6`, size `rand(.1, .25) -> rand(.15, .35)`, and pulse amplitude `(1 + .2 * Math.sin(t * 6)) -> (1.2 + .3 * Math.sin(t * 6))` so the pool clearly glows.
  - Impact: med. Effort: S.
- **[feel]** A direct hit (`hit: () => 'end'`) skips the bounce, so against a crowd the "bounces once" identity rarely shows. The impact itself reads well: the bright splash in `m0_MagmaGlob_010.jpg` and `_022.jpg` is clearly magma-orange with black slag.
  - Keep the rule. Make the bounce visible on ground hits instead: `thud` at line 1020 `burst(..., 16, ...) -> 24` plus `flash(e.x, .3, e.z, 0xff5a1a, 10, .1)`.
  - Impact: low. Effort: S.
- **[balance]** No change. It cast 40 times in 30 s, so it is the backbone of the dps, and the overall numbers sit in band.

## RMB: Eruption (cd 5, 50 raw r 3, lift 13, 3 s pool)
- **[visual]** The telegraph is good: a spinning zone circle that grows, plus rising embers. The geyser column, though, is thin next to its 3 m blast. In `m1_Eruption_074.jpg` it reads as a narrow pillar, not a 6 m wide eruption.
  - Change: line 1028, `riseFx('magma__geyser', ..., e.r / 2.4, 1.2) -> e.r / 1.7, 1.4`.
  - Impact: med. Effort: S.
- **[feel]** The pool it leaves uses `MOVE['magma.0']`, so it cools into a rock that shares the Glob's 4-rock cap (line 1009 filters on `m.mv`). Spamming Glob silently deletes Eruption's rock.
  - Accept this, or give the pool its own `mv` by passing `{ ...c, m: MOVE['magma.0'], mv: 'magma.1' }` at line 1024.
  - Impact: low. Effort: S.
- **[balance]** No change. It was cast 6 times per 30 s at the cd cap (ready only 6% of the time), and 50 raw on a 5 s cd fits the band.

## Q: Heat Wave (cd 10, 9 m wall, 6 per 0.15 s, melt 70 after 5 scorches)
- **[balance/feel]** Melts are unreliable. The wall's band is `Math.abs(along) > 1.3`, which is 2.6 m thick and moving at 3.5 m/s. A stationary enemy sits in it for about 0.74 s, which is 4-5 ticks at 0.15 s, so many enemies leave one scorch short of the melt. Only 1 kill in the showcase (`metrics.json`: 45 dmg).
  - Change: line 1036, `Math.abs(along) > 1.3 -> 1.6` (about 0.9 s, 6 ticks), so a standing or approaching enemy reliably melts.
  - Impact: high. Effort: S.
- **[visual]** The melt flash whites out the whole pack: in `m2_HeatWave_074.jpg` the brute and three grunts are pure white silhouettes.
  - Change: line 1049, `flash(..., 0xff6a2a, 30, .2) -> flash(..., 0xff6a2a, 16, .15)`.
  - Impact: med. Effort: S.
- **[performance]** Highest particle peak of the kit: 669, against 339 for Glob. It comes from 6 emits/frame across the wall plus the 40-particle melt bursts.
  - Change: line 1047, `k < 6 -> k < 4`; line 1049, `burst(..., 40, ...) -> 28`.
  - Impact: low. Effort: S.
- **[visual]** The wall reads as a row of 7 hopping globs, not as "shimmering heat". In `m2_HeatWave_022.jpg` it is hard to find among the enemy glow.
  - Change: line 1044, `N = 7 -> 9` with `scale .9 -> .7` for a denser, lower wave.
  - Impact: low. Effort: S.

## E: Volcano (cd 15, 10 s, bomb 22 r 2.2 every 0.9 s, range 16)
- **[visual]** The cone is pale grey-white with almost no lava read: in `m3_Volcano_045.jpg` and `_074.jpg` it looks like a tent or a stone spire, not a volcano. It also has the highest fx-object peak of the kit (32), mostly the large dark smoke puffs (`Math.random() < .4`, size .4-.7, life 1.5).
  - Change: line 1062, `.4 -> .25`. Add a glowing crater: `if (Math.random() < .3) emit(n.x, 2.1, n.z, 0, rand(1,3), 0, 0xff6a2a, rand(.15,.3), .6, -1)`.
  - Tint the model darker: `model('magma__volcano', 0xff3a10, ...)` keeps the colour, but the base colour should go toward 0x2a1410 like the Glob's rock.
  - Impact: med. Effort: S.
- **[balance]** About 24 dps single target plus splash for 10 s on a 15 s cd is fine. The first bomb lands about 2 s after cast (0.9 s pulse plus 1.1 s flight). For snappier feedback, fire on spawn with `n.p = .9` in the cast's ent options, so the first `pulse` triggers immediately.
  - Impact: low. Effort: S.

## R: Meteor (ult, 135 raw r 7.5, kb 10 lift 9, then a 5 s field of 8 / 0.5 s at r 6)
- **[visual]** The warning is good: a pulsing zone circle and a flaming rock with a tail falling on a diagonal. The impact (`kit_1199.jpg`, `boss_1199.jpg`) floods the screen orange-white: boom ×3 scale, a 16-tall pillar, a 1.8r ring, and bloom. Near the player you see nothing for about half a second.
  - Change: line 1086, `boomFx(e.x, 1, e.z, e.r, 0xff3a10, 3) -> 2` and `pillarFx(..., 16, ...) -> 12`.
  - Impact: med. Effort: S.
- **[balance]** The ultimate self-refills. It was cast 6 times in the 30 s crowd run and 5 vs the boss, with cooldown ready 100%: 135 raw on up to 8 enemies plus the field pours charge back into the meter.
  - Change: line 1069, the field tick at line 1068, `8 * n.mul -> 6 * n.mul`. Field life `5 -> 4` at line 1069.
  - This trims about 30 field damage per enemy without touching the headline hit.
  - If the meter loop is engine-wide, the better fix belongs in `addUlt` (sim.js:115), outside this report's scope.
  - Impact: med. Effort: S.
- **[performance]** Particle peak is 663 in the 1.25 s window (6 flame emits/frame while falling). That is acceptable for an ultimate, so no change.

## Passive: Molten Core (dot 6, +10% damage taken; attackers turn molten)
- **[visual]** The molten status is very loud in crowds: in `kit_1199.jpg` and `kit_1799.jpg` every enemy is tinted saturated orange with glow, which combines with lava pools and bloom into one orange mass. Enemy types are hard to tell apart.
  - Change: lower the molten tint/emissive strength for the `magma` status by about 40% wherever the status tint is applied (core.js status colour). Code not changed here.
  - Impact: med. Effort: M.
- **[balance]** The retaliation hook (sim.js:421, `applyStatus(src, 'magma', p)` when hit) is a nice tank-ish touch. `vuln .1` is fine, so no change.

---

## Top 3
1. **Heat Wave band** `Math.abs(along) > 1.3 -> 1.6` (line 1036) so the 5-scorch melt actually triggers. Also `flash 30 -> 16`.
2. **Tame the Meteor/ult loop:** field `8 -> 6` dmg and `life 5 -> 4` (lines 1068-1069). Cut the impact whiteout with `boomFx ×3 -> ×2` and `pillar 16 -> 12`.
3. **Make the lava readable:**
   - Glob pool emit `.3 -> .6` and a stronger glow (line 1018).
   - Eruption geyser `e.r/2.4 -> e.r/1.7` (line 1028).
   - Darker Volcano cone with a glowing crater.
   - Molten tint about 40% softer in crowds.
