# Illusion playtest report

**Verdict:** the control fantasy works (charm masks read clearly, nothing touches you), but it is a control element that out-damages the median in crowds. The ultimate and Mesmerize wash out the screen, and the basic attack is hard to see.

| | value | x median |
|---|---|---|
| Crowd dps (kit, 30 s vs wave-5 x8) | 295.9 (54 kills, **0 HP lost**) | **1.31x** (median 225.1) |
| Boss dps (Tyrant, 30 s) | 121.9 (72 HP lost) | 0.91x (median 134.3) |
| Worst frame | 3213 ms (Phantom Moths, first cast) | see note |

Median comes from 19 elements (`playtest/out/median.json`). Frame times are inflated across the board because many harness runs were going at once. The 3 s worst frames on the first two moves look like first-cast shader compiles, not the moves themselves. Only particles, fx objects and ents are used for performance below.

Measurement note: Decoy and Phantasmagoria show 0 move damage because the 74-frame capture ends before their 5 s life runs out and they shatter. That is not a bug.

---

## LMB: Phantom Moths (cd .45)
- **[visual]** The moths are almost invisible. In `m0_PhantomMoths_010.jpg` and `_022.jpg` you only see a few pink specks over a pink-lit floor, and the cast circle on the hand is the most visible thing. The two homing phantoms (sc .7) can't be told apart from stray particles. **Change** (elements.js:1593 and :1592): `look.s: 1.3 -> 1.6`; phantom `sc: .7 -> .85`; trail size `.06 -> .09`. Impact med, effort S.
- **[feel]** The hit feedback `det: boomFx(..., 2.5, ..., .6)` is barely visible on the pack. **Change** (elements.js:1594): add a small `burst(e.x, e.y, e.z, 6, 0xb8f0ff, 3, .12, .3)` to `det` so each moth pops in two colours. Impact low, effort S.
- **[balance]** 30 dmg into the pack per cast; 60 casts in the kit run. In line with its role. No change.

## RMB: Decoy (cd 8)
- **[visual]** The double is hard to find. In `m1_Decoy_074.jpg` it is a faint white silhouette near the horizon (around 480,255), and monsters walk toward something you can barely see. `fade(o, ... * (.6 + .15*sin))` with the shimmer tint washes it out to white. **Change** (elements.js:1599): base alpha `.6 -> .8`; add a small ground marker in `make`, `zoneCircle('illusion', 1.2, .5)`, so its spot reads at range. Impact med, effort S.
- **[feel]** The shatter is the best moment in the kit (`m1_Decoy_022.jpg`: shards, flash, lit enemies). Keep it as is.
- **[performance]** 444 peak particles, 14 fx objects, mostly from the 40-particle make burst plus the per-frame emit (.35 chance). That is fine.

## Q: Mesmerize (cd 10)
- **[visual]** In `m2_Mesmerize_010.jpg` a white bloom fills the centre third of the screen for several frames. The 4 `sonic__rings` spawn at the caster (`(k + i*.12)*11` starts at 0 m) at alpha .7 and stack into bloom right in front of the camera, so the cone you just charmed is hidden. **Change** (elements.js:1611): start the rings 2 m out, `addScaledVector(d, 2 + (k + i*.12) * 11)`, and lower alpha `fade(o, (1-k)*.7) -> (1-k)*.45`. Impact high, effort S.
- **[visual]** The charm masks bobbing above heads (`m2_Mesmerize_045.jpg`) are clear and distinct from every other element. Keep them.
- **[performance]** 596 peak particles, 21 fx objects. The 50-particle cast spray is acceptable. Optional `50 -> 35`.

## E: Kaleidoscope (cd 7)
- **[balance]** This is the biggest burst in the kit: 238 dmg and 5 kills from one cast into the 6-pack (3 x 50 AoE pops + 20). It is part of why the crowd score is 1.31x. **Change** (elements.js:1629): `50 * n.mul -> 44 * n.mul`. Bosses also lose a little (boss dps around 0.88x, still in band). Impact med, effort S.
- **[performance]** It has the highest particle and fx-object peaks of all five moves: 844 particles and 84 fx objects (Moths 8, Decoy 14, Mesmerize 21, ult 80). Sources: each mask emits 2 particles per frame for 2 s, and each pop throws `debrisFx(... 8 ...)` plus the split burst of 30. **Change** (elements.js:1632 / :1635 / :1634): emit loop `k < 2 -> k < 1`; `debrisFx(..., 8, ...) -> 5`; split `burst(..., 30, ...) -> 20`. Impact med, effort S.
- **[visual]** In `m3_Kaleidoscope_022.jpg` and `_045.jpg` the three "false images" read as generic glitter. The masks are small and flicker (`fade .55 + .3*sin(t*30)`). **Change** (elements.js:1630-1631): mask scale `1.3 -> 1.7`, flicker `sin(t*30) -> sin(t*14)` so the eye can follow each copy to its target. Impact med, effort S.

## R: Phantasmagoria (ultimate)
- **[visual]** The worst readability problem in the kit. While the hall of mirrors is up the whole screen goes pastel white: `m4_Phantasmagoria_010.jpg`, `_074.jpg`, `kit_1199.jpg`, and `boss_1199.jpg`, where the Tyrant is an orange smear. You stand at the centre of a 14 m by 2.6 m-tall ring of bright mirrors, so they fill the view for the full 5 s. On top of that come 4 particles per frame and the `whiteFx = .6` at the end. **Change** (elements.js:1641): cap the mirror opacity, `tint(u.m, shimmer(t)); fade(u.m, .45)`; emit loop `k < 4 -> k < 2`. Keep the shatter's `whiteFx` but lower it, `.6 -> .4` (elements.js:1646). Impact high, effort S.
- **[balance]** 120 damage to everything within 14 m, plus 5 s of charmed infighting. Fine for an ultimate; see the passive section for the charm multiplier.
- **[performance]** 665 peak particles, 80 fx objects (the 36 shatter shards). Acceptable for an ultimate. Optional shards `36 -> 28`.

## Passive: Misdirection (`st: { weak: .2 }`, sim.js:435 1-in-3 miss)
- **[balance]** **0 HP lost** in 30 s against a respawning wave-5 crowd. Between the miss chance, the -20% damage, two charm sources and the Decoy lure, nothing gets through. That is fine for a control element, but then its damage should sit at or below the median, not at 1.31x. Much of the crowd damage is charmed monsters hitting each other, which is credited to the player at **1.6x** the monster's own damage (sim.js:904, `Math.max(10, t.dmg) * 1.6`; charm is Illusion-only, and bosses are immune, so this only affects crowds). **Change** (sim.js:904): `* 1.6 -> * 1.2`. Expected crowd score around 1.1x together with the Kaleidoscope trim. Impact high, effort S.
- **[feel]** The 'miss' event is the only feedback that a phantom took the hit. Optional: a brief pink afterimage at the player on `miss`. Impact low, effort M.

---

## Top 3
1. **Phantasmagoria readability:** mirror opacity `fade(u.m, .45)`, emit `4 -> 2`, `whiteFx .6 -> .4` (elements.js:1641/1646). The ultimate currently whites out the screen for 5 s.
2. **Crowd balance for a control element:** charm infighting `1.6 -> 1.2` (sim.js:904) and Kaleidoscope pop `50 -> 44` (elements.js:1629), aiming for 1.31x -> about 1.1x crowd while boss stays about 0.88x.
3. **Mesmerize cast bloom:** start the rings 2 m out and alpha `.7 -> .45` (elements.js:1611); also Kaleidoscope fx diet (emit 2 -> 1, debris 8 -> 5) for the kit's highest 844-particle / 84-fx peak.
