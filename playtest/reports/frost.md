# Frost playtest report

**Verdict:** looks clearly icy and the freeze tint reads well, but it is the second-weakest crowd element and its two big effects (Lance, Blizzard) blow out the screen. **Crowd 105.6 dps (0.47x median 225.1), boss 116.8 dps (0.87x median 134.3)**, worst frame cost Glacial Lance 8112 ms on one frame (the average was 221 ms, inflated by 30 parallel runs; see Performance).

Median from `playtest/out/median.json` (19 elements). Frost is a control element, so a crowd score under the band is expected, but at 0.47x it sits below Chrono (0.58) and Crystal (0.73) and only beats Wind (0.35). It also lost the most HP of any frost scenario (529 in the kit run), so the control isn't keeping the crowd off either. Boss dps is in the band.

Harness notes: the showcase pack stands 10-12 m in front of the caster, in a row with a gap on the centre line. Frost Nova (r 6.5) reached nobody (0 dmg), and the Ice Shard and Lance shots went through that gap (12 and 27 dmg). The Blizzard aim also landed on the caster, not on the pack (16 dmg). Those per-move damage figures say nothing about balance; only the kit and boss numbers do. The orange glowing runes on the enemies in almost every `m*` shot are not from Frost (they appear before any frost hit lands).

## LMB: Ice Shard
- **[visual]** The shard is too small and fast (speed 44) to see at frames 3/10, and the hit shows up as a white-peach bloom blob covering the whole brute (`m0_IceShard_010.jpg`), not as ice. The chill tint afterwards is very readable (the brute turns ice blue, `m0_IceShard_022/045/074.jpg`). Change: `burst(e.x, e.y, e.z, 14, 0xaef0ff, 5, .18, .4, 6)` -> `burst(..., 10, 0x7fd8ff, 5, .14, .35, 6)` and `look.light: 5 -> 3`, so the impact stays blue and doesn't bloom white. Impact med, effort S.
- **[balance]** The shard does the single-target work: 67 casts in 30 s. Leave it alone (the boss score is already fine), and buff crowd damage through Nova and Blizzard instead (see below). Impact low, effort S.

## RMB: Glacial Lance
- **[visual]** At release the lance spawns at full size right in front of the camera: two huge overexposed white slabs cover about 40% of the view (`m1_GlacialLance_074.jpg`). Change: `sc: .7 + .8 * k -> sc: .6 + .5 * k`, and drop the trail alpha `trail: [0xaef0ff, .25, ...] -> [0xaef0ff, .18, ...]`. Impact high, effort S.
- **[visual]** At full charge the charge circle (view.js `renderAim`, `chargeCircle.scale.setScalar(.05 + .14 * k)`) covers the left third of the screen (`m1_GlacialLance_045.jpg`). This is shared code and affects every charge move: `.14 -> .09`. Impact med, effort S.
- **[visual]** The "slick ice strip" is only a few particles rising from the floor (`segView(0xaef0ff, .5)`, 4 emits/frame). No screenshot shows a strip you could read as a floor hazard that adds 20% damage taken. Change: in `cast`, also lay a ground decal along the strip, e.g. 4-5 `scarFx(x, z, .9, 0x9feaff, 4)` calls spaced along `fx0 -> x` (`scarFx` already exists and Fire uses it), so the strip shows as frosted floor for its 4 s life. Impact med, effort S.
- **[feel]** The full-charge shatter (double damage, consumes the freeze) is the best combo in the kit and has a good effect (`T.shatter` + 50 particles + shake). Keep it.

## Q: Ice Wall
- **[visual]** The aim reticle is the generic gold `makeCircle` ring (`m2_IceWall_003/010.jpg`). It reads as Light, not Frost, and looks the same as every other element's aim. The cast also throws big soft cyan blobs over the hands (`m2_IceWall_010.jpg`). Once up, the wall is a faint, low, pale strip that is hard to pick out at 14 m (`m2_IceWall_074.jpg`). Change: `model('frost__wall', 0x4cc8ff, ...)` -> `0x7fe0ff` plus a one-off `ringFx(n.x, .1, n.z, 3.5, 0x4cc8ff, .5)` in `make`, so the wall pops when it rises, and `dustFx(n.x, n.z, 3, ...)` -> `dustFx(n.x, n.z, 2, ...)`. Impact med, effort S.
- **[balance]** The chill deals `4 * n.mul` per 0.5 s, only to enemies touching the wall, and the wall is up 3 times in 30 s (3% ready). It does nothing measurable to crowd dps. Raise the chill to `4 -> 7` so leaning on the wall builds Permafrost stacks (and so freezes) faster. Impact low, effort S.

## E: Frost Nova
- **[visual]** This is Frost's best visual: a ring of 14 ice spikes, a double ring and a burst, unmistakably frost, and it clears in about 1 s (`m3_FrostNova_022/045/074.jpg`). The only problem is the cast-frame flash, which washes the hands and lower screen white (`m3_FrostNova_003.jpg`): `flash(e.x, 1, e.z, 0x4cc8ff, 40, .3)` -> `flash(..., 24, .25)`. Impact low, effort S.
- **[balance]** The nova is the crowd tool, but at `20 * c.dmg` in r 6.5 every 11 s it adds almost nothing (3 casts in 30 s). Change: `boomAt(c, p.x, .5, p.z, 6.5, 20 * c.dmg, ...)` -> `boomAt(c, p.x, .5, p.z, 7.5, 34 * c.dmg, ...)`. Because the nova freezes, this damage also gets the +40% frozen bonus on the next hits. Doesn't touch boss dps. Impact high, effort S.

## R: Blizzard (ultimate)
- **[visual]** Cast on or near yourself, the cloud (`water__cloud` at `y = 10`, opacity `.9`) fills the top half of the screen with an overexposed warm-white haze for the whole 7 s (`m4_Blizzard_022/045/074.jpg`). The hail can't be seen under it, and the haze reads as Light more than ice. Change: `cl.position.y = 10 -> 13`, `fade(o.userData.cloud, ... * .9) -> ... * .55`, cloud colour `0xbfe8ff -> 0x8fc4e8`. Impact high, effort S.
- **[performance]** Blizzard peaks at **900 particles**, the most of any frost move (the others: 275 / 394 / 533 / 568). That comes from 9 snow emits per frame plus a shard mesh and an 8-particle burst for each hail stone. Change: `for (let k = 0; k < 9; k++)` -> `k < 6`, and `Math.random() < dt * 14` -> `dt * 10`. Impact med, effort S.
- **[balance]** `8 * n.mul` per 0.5 s = 16 dps per enemy for 7 s. That is the main source of crowd damage and it's low for an ultimate. Change: `8 -> 12`. On the boss it's a single target, so the boss score barely moves. Impact high, effort S.

## Passive: Permafrost (4 hits -> freeze 1.8 s, frozen take +40%)
- **[feel]** The chill and freeze read well: enemies go ice blue (`m0_IceShard_022.jpg`, `kit_1199.jpg`), and the freeze plays a `tink` and a 24-particle puff. Bosses only freeze for 0.63 s (`t *= .35`), which suits a control element against bosses. No change.
- **[balance]** The kit run lost 529 HP: melee closes in faster than 4 shard hits (about 1.1 s at cd .28) can freeze it (`kit_1199.jpg` is the camera inside a brute). Change: `st: { slow: .45, stacks: 4 }` -> `stacks: 3`, which freezes 25% sooner and raises crowd dps through the +40%. Impact med, effort S.

## Performance (measured)
The frame times are dominated by 30 headless runs sharing the machine (avg 173-222 ms for every move), so only the relative numbers count. The Lance's 8112 ms single-frame spike is the largest worst-frame of the kit, ten times the next one (Ice Wall 892). It probably comes from the first use of the `frost__lance` model or material (shader compile), not from the effect itself. Worth checking that it's included in the warm-up. Particles: Blizzard 900 > Nova 568 > Wall 533 > Lance 394 > Shard 275. FX objects peak at 36 (Wall), fine.

## Top 3
1. **Crowd damage up, boss untouched:** Frost Nova `r 6.5 -> 7.5, dmg 20 -> 34`; Blizzard hail `8 -> 12`; Permafrost `stacks: 4 -> 3`. Aim: about 0.75x crowd median (a control element). Confirm with `node playtest/run.js frost kit`.
2. **Glacial Lance release blocks the screen:** `sc: .7 + .8 * k -> .6 + .5 * k`, trail alpha `.25 -> .18`, and the shared charge circle `.14 -> .09`.
3. **Blizzard cloud blows out the view:** `y 10 -> 13`, opacity `.9 -> .55`, colour `0xbfe8ff -> 0x8fc4e8`. Cut the particles too (`9 -> 6` snow emits, hail `dt * 14 -> dt * 10`).
