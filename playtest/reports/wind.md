# Wind playtest report

**Verdict:** Wind feels light and mobile, but it hits far too softly even for a control element, and its two big effects (Tornado, Gale Force) white out the player's own view at close range.
**Crowd dps:** 78 (kit, 30 s, wave-5 crowd of 8). **Boss dps:** 65.8 (Tyrant, 30 s).
**x-median:** crowd **0.35x** (median 225.1), boss **0.49x** (median 134.3), from 19 elements in `playtest/out/median.json`. This is the lowest crowd score of any finished element. Frost (0.47x) and Chrono (0.58x) are the next lowest.
**Worst frame cost:** Tornado has the highest average frame time of the five moves, 443 ms (Blades 111). The worst single frame was 2381 ms, on Gale Force. These absolute numbers are inflated because 30 headless runs were going at once. Compare the moves with each other, not with real play. The kit's sim cost was 2.93 ms per frame.

Data: `playtest/out/wind/metrics.json` and the screenshots in the same folder. The harness ran once, cleanly. The move scenario reports 0 damage for Updraft and Downburst. Updraft's 3.5 m radius did not reach the test pack, and Downburst slams 2.15 s after the cast, which is later than the last capture frame (frame 74). Read those two numbers as measurement artifacts, not as a sign the moves do nothing.

---

## LMB: Wind Blades (`js/elements.js` line 602)
- **[balance]** This move does about 60% of the kit's damage: 64 casts in 30 s, 17 per blade. It works out to 40 dps on a single target, the lowest basic attack I would expect in the roster, and it is the main reason the crowd score is 0.35x. **Change:** `dmg: 17 -> 24` and `cd: .42 -> .36`. That is about 1.65x more Blades output. Impact **high**, effort **S**.
- **[visual]** The blade reads clearly as a pale teal crescent that is distinct from other elements (`m0_WindBlades_010.jpg`). Hits have no feedback, though: an impact effect exists only for the `det`/`nova` upgrades. By `m0_WindBlades_022.jpg` the blade is gone and enemies show only a generic spark. **Change:** add a hit effect such as `fx: { hit: e => burst(e.x, e.y, e.z, 8, 0xe0fff4, 5, .1, .25) }` (a small 8-particle puff). Impact **med**, effort **S**.

## RMB: Gale Force (lines 605-614)
- **[visual]** At frame 3 the `gen__cone` mesh starts at the eye and points away from the camera. The player sees it end-on as a large milky sphere that hides the whole pack (`m1_GaleForce_003.jpg`). **Change:** start it 1.5 m ahead with `a = V(...e.o).addScaledVector(V(...e.d), 1.5)`, and lower the opacity with `fade(o, (1 - k) * .6) -> (1 - k) * .3`. Impact **high**, effort **S**.
- **[visual]** Enemies hit by the gust glow bright orange and gold (`m1_GaleForce_022.jpg`, `_045.jpg`). It reads like a fire hit, not wind. The glow looks like the shared hit or status tint, not this move's code, so check whether the "windswept" tint can use `0x9dffd6`. Impact **low**, effort **S**.
- **[performance]** Peak particles reach 459, against 283 for Blades, from a 5 s cooldown move. **Change:** `for (let i = 0; i < 40` -> `24`. Impact **low**, effort **S**.
- **[balance]** **Change:** `16 * c.dmg -> 26 * c.dmg`. The cone is 10 m by 70°, the cooldown is 5 s, and the move is used about 6 times per 30 s. Impact **med**, effort **S**.

## Q: Updraft (lines 615-618)
- **[feel]** The self-launch and glide work, and the view from the top is great for picking the next target (`m2_Updraft_045.jpg`). The lift ring only reaches 3.5 m, so the pack 5-6 m in front was never lifted, and the move did 0 damage in the move test. **Change:** in `boomAt(c, p.x, .2, p.z, 3.5, 15 * c.dmg, ...)`, raise the radius `3.5 -> 5` and the damage `15 -> 25`. Impact **med**, effort **S**.
- **[visual]** `wind__ring` plus 30 particles is enough, and it reads well (`m2_Updraft_010.jpg`). No change.

## E: Tornado (lines 619-638)
- **[visual]** Tornado spawns only 2 m in front of the player with radius 2.8, so the player stands inside its glowing funnel. With bloom, this whites out the screen in `m3_Tornado_022.jpg`, `kit_1199.jpg` and `boss_1199.jpg`, and `boss_1799.jpg` is almost entirely washed out. When it is further away it looks great and reads clearly as a tornado (`m3_Tornado_074.jpg`). **Change:** spawn it further out, `p.x + f.x * 2 -> * 5` (same for z). Lower the opacity in `upd`, `fade(o, ... * .5) -> * .3`. Impact **high**, effort **S**.
- **[balance]** Tornado does 6 damage per 0.25 s, which is 24 dps per enemy, and the end fling does nothing beyond knockback. The move dealt 102 into the pack. **Change:** `6 * n.mul -> 9 * n.mul` (both lines, 626 and 630). In `end`, add `hitEnemy(e, 'wind', 20 * n.mul, own(n), 0, 0, 0, { aoe: true })` before `push`. `cd: 12 -> 10`. Impact **high**, effort **S**.
- **[performance]** Peak particles reach 548, and the tornado emits 4 per frame for 4.5 s. Its average frame time is the highest of the five moves (443 ms). **Change:** in `upd`, `for (let k = 0; k < 4` -> `3`. Impact **low**, effort **S**.

## R: Downburst (lines 639-659)
- **[balance]** The filter `!ET[e.type].boss` means a boss is never lifted and never takes the slam, so against the Tyrant the ultimate only hits adds. That is part of the 0.49x boss score. **Change:** at cast time, deal `hitEnemy(e, 'wind', 120 * c.dmg, p, 0, 0, 0, { aoe: true })` to each boss within `15 * c.st.aoe`. The boss stays grounded, so the core idea holds. Impact **high**, effort **S**.
- **[feel]** Victims are carried toward `groundAt(p, 30)`, so the slam lands 30 m away, as a small dot at the arena edge (`m4_Downburst_074.jpg`). The payoff is hard to see. **Change:** `groundAt(p, 30) -> groundAt(p, 20)` (both lines, 641 and 646). It still covers ring-outs from mid-arena. Impact **med**, effort **S**.
- **[performance]** Downburst has the highest particle peak in the kit, 595. Each victim emits at 60% per frame (up to 12 victims), plus 3 per frame for the column. **Change:** `Math.random() < .6 -> < .35` on line 656. Impact **low**, effort **S**.
- **[visual]** The three counter-rotating rings plus the streaks on lifted victims read as wind and are distinct from other elements (`m4_Downburst_010.jpg`, `_045.jpg`). No change.

## Passive: Tailwind (`js/sim.js` lines 94 and 582)
- **[feel]** The 1.15x speed and the double jump (`vy = 8`, 14-particle puff) work. The puff is cheap and on-colour. No change. With the damage buffs above, the kit lost 420 HP, which is fine for a kiting element.

---

## Expected landing
Estimated: crowd about 2340 -> ~4200 damage, roughly **0.6-0.7x** median. Boss about **0.8-0.9x**, from the Blades buff plus the Tornado and Downburst boss damage. Both are inside the "control element sits lower on purpose" band. These are estimates, not measured; rerun `node playtest/run.js wind kit` and `boss` after the changes.

## Top 3
1. **Wind Blades** `dmg: 17 -> 24`, `cd: .42 -> .36`. This is the biggest lever on the 0.35x crowd score.
2. **Tornado** spawn distance `2 -> 5` and fade `.5 -> .3`, so it stops whiting out the player's view. Also raise its tick damage `6 -> 9`, add a 20-damage fling at the end, and set `cd 12 -> 10`.
3. **Downburst** deals 120 to bosses in range (it currently ignores them). Also move the Gale Force cone 1.5 m ahead and set its fade to `.3`, so the cast stops blinding the player.
