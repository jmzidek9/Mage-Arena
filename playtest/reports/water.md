# Water playtest report

**Verdict:** balanced and on-identity (push/pull reads well), but two moves hide the player's own view: Whip drags big monsters into your face and Tsunami spawns on top of the camera.
**Crowd dps:** 258.1 (1.15x median 225.1) | **Boss dps:** 119.9 (0.89x median 134.3) | **Worst frame:** 1762.5 ms (Water Whip; frame ms is noisy with 30 parallel runs, Surf avg 14.1 ms vs others 84-238 ms) | **Peak particles:** 1031 / 67 fx objects (Tsunami)

Source: `playtest/out/water/metrics.json`, screenshots in the same folder. Code: `js/elements.js` lines 480-552.

Kit run note: Tsunami was cast 7 times in 30 s (cooldownReady 100%), so the crowd number leans on the ultimate. Without it Water is likely nearer the median, which is fine for a control element.

## LMB - Aqua Bullets (cd .14, 10.5 dmg, kb 4.5)
- **[visual]** The bullet is a tiny pale orb that is hard to pick out against the bright cast circle and the gold spawn ring (m0_AquaBullets_003/010). Impact pops (frame 10) are small. Proposal: line 488 `trail: [0x7fc8ff, .14, .3, 3, 1] -> [0x4aa0ff, .2, .3, 3, 1]` (deeper blue, wider trail) so the stream reads as water, not generic sparks. Impact med, effort S.
- **[feel]** kb 4.5 x passive 1.6 = 7.2 per bullet at 7 shots/s pushes the target out of Whip's 10 m reach and Surf's lane (kit: Whip ready only 2%, so it is used, but often whiffs on pushed targets; not measured directly). Proposal: `kb: 4.5 -> 3.5`. Keeps "heavy knockback" while letting the pull/push loop work. Impact med, effort S.
- **[balance]** 11 dmg into the pack per tap is fine; no change.

## RMB - Water Whip (cd 3.5, 22 / 44 tip + .5 s stun)
- **[visual]** Whip chain and crack fire as intended (m1_WaterWhip_003/010), but the crack flash `flash(..., 0x9fd8ff, 20, .12)` plus enemy hit-flash blooms to near white/orange; blue is lost. Proposal: line 509 `flash(q.x, q.y, q.z, 0x9fd8ff, 20, .12) -> flash(q.x, q.y, q.z, 0x4aa0ff, 12, .12)` and `burst(... 24 ...) -> burst(... 16 ...)`. Impact med, effort S.
- **[feel] high** The drag lands every non-boss right 2.2 m in front of you. A Brute then fills the whole screen (m1_WaterWhip_045, m1_WaterWhip_074, carried over into m2_BubblePrison_003-022, and kit_1799 is the camera inside a monster). Proposal: line 497 `p.x + f.x * 2.2` / `p.z + f.z * 2.2` -> `3.5`, and for big enemies add their radius (`2.2 -> 3 + (ET[e.type].r || 1)` if a radius field exists). Impact high, effort S.
- **[performance]** Highest worst frame (1762.5 ms) and 462 particles / 17 fx objects for a single whip. The per-frame `emit` at 70% chance on 20 segments is cheap; the spike is the crack burst + flash. Covered by the burst cut above. Impact low, effort S.

## Q - Bubble Prison (cd 9, 10 dmg, 3 s bubble, +30% damage taken)
- **[visual]** Once it lands it is the most readable move in the kit: a clear blue bubble with the Brute floating inside (m2_BubblePrison_045/074). Good, keep.
- **[visual]** At point blank (target pulled in by Whip) the hit produces large warm blooming blobs covering ~60% of the screen for ~0.5 s (m2_BubblePrison_010/022/045). Proposal: pop/hit burst line 519 `burst(e.x, e.y, e.z, 30, 0xbfe8ff, 6, .25, .4, 6) -> burst(..., 18, 0x7fc8ff, 6, .18, .4, 6)` so the pop is bluer and smaller. Fixing the Whip drag distance removes most of this too. Impact med, effort S.
- **[balance]** On bosses the bubble fails and falls back to `damage(e, 30 * s.mul)`. 10 + 30 every 9 s is weak but Water is control; proposal `30 -> 45` in the boss fallback (line 517) to lift boss dps slightly toward the median. Impact low, effort S.

## E - Surf (cd 9, 24 dmg per enemy, 14 m dash)
- **[visual] high** From your own view the wave is barely visible: `fade(... n.own === myId ? .35 : .8)` (line 527). In m3_Surf_003/010 there is no blue wave at all, only the cast circle; m3_Surf_022 is the camera clipping inside the Brute, and 045/074 show empty arena 14 m later with no sign of the thrown crowd. Proposal: own opacity `.35 -> .6`, and on end add a spray `burst(n.x, 1, n.z, 20, 0x9fd8ff, 7, .2, .4, 8)` so you see where you landed. Impact high, effort S.
- **[feel]** Dashing through a large enemy puts the camera inside it (m3_Surf_022). Proposal: raise the sideways shove so the lane is cleared before you arrive: line 524 kb `8 -> 11`, or widen `r: 2.6 -> 3.2` (line 522) so enemies are hit earlier. Impact med, effort S.
- **[performance]** 675 particle peak from 6 emits per frame for .6 s. Proposal: `for (let k = 0; k < 6 ...` -> `4`. Impact low, effort S.
- **[balance]** 96 into the pack (4 hits x 24) is fine.

## R - Tsunami (ultimate, 110 per enemy, 2.6 s)
- **[visual] high** Spawned only 1.5 m in front (line 531), so the 14 m wide wave mesh swallows the camera for the first ~0.4 s: full-screen pale blue wash with bokeh particles (m4_Tsunami_003/010/022, kit_599). From 045 on it looks great (clear wall of water carrying monsters, m4_Tsunami_045/074). Proposal: line 531 `p.x + f.x * 1.5` / `p.z + f.z * 1.5` -> `* 4`, and in `upd` fade own view like Surf: `fade(o, Math.min(1, n.l * 5) * (n.own === myId && n.t < .4 ? .4 : 1))`. Impact high, effort S.
- **[performance]** Highest particle peak (1031) and fx objects (67) of the kit; 10 emits per frame for 2.6 s. Proposal: line 549 `k < 10 -> k < 6` and size `rand(.25, .5) -> rand(.3, .55)` to keep the density look. Impact med, effort S.
- **[balance]** 328 dmg / 5 kills into the 6-pack, and it is the main crowd damage source. Crowd 1.15x is inside the band; no change.

## Passive - Tidal Force (st.kb 1.6)
- **[feel]** Works (enemies visibly fly back, m0_AquaBullets_045/074 show the pack pushed off), but stacks with Aqua Bullets so hard that Water spends a lot of time out of range (lowest crowd move count after LMB: Whip 9, Bubble 4, Surf 4 casts in 30 s, cooldown-limited, so not proven). Leave `kb: 1.6`; tune LMB kb instead (see above). Impact low.

## Top 3
1. **Whip drag distance** `2.2 -> 3.5` m (line 497): stops Brutes filling the screen after every whip (m1_045/074, kit_1799).
2. **Tsunami spawn offset** `1.5 -> 4` m plus reduced own-view opacity for the first .4 s (lines 531/548): no more full-screen blue wash on cast.
3. **Surf own-view wave opacity** `.35 -> .6` + landing spray (line 527): the dash currently has almost no visible water from your own eyes.
