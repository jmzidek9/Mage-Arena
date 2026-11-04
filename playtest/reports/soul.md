# Soul playtest report

**Verdict:** The reaper fantasy is strong (the scythe sweep, the soul being torn out, the summoned Reaper), but Soul is the weakest crowd element on the roster. Its Soul economy almost never gets going, because every hit you take strips 2 Souls. The ultimate also whites out the player's view when it is cast close to the player.
**Crowd dps:** 53 (kit, 30 s, wave-5 crowd of 8). **Boss dps:** 90.5 (Tyrant, 30 s).
**x-median:** crowd **0.24x** (median 218.1), boss **0.66x** (median 137.1), from `playtest/out/median.json` (30 elements). This is the lowest crowd score of all 30 elements. Wind (0.36x) and Frost (0.48x) are the next lowest.
**Worst frame:** Soulstorm has the highest average frame time of the five moves, 501.9 ms, and the worst single frame, 1608 ms. It also has the highest particle peak, 685. These absolute numbers are inflated because about 10 headless runs were going at once. Compare the moves with each other, not with real play. Kit sim cost was 0.88 ms per frame.

Data: `playtest/out/soul/metrics.json` and the screenshots in the same folder. The harness ran once, cleanly (414 s). In the move scenario, Reap reports **0 dmg**: the showcase pack stands 10-12 m in front of the player (`MP.setup`, `js/net.js:526`) and Reap only reaches 6.5 m. Read that as a measurement artifact. The Reaper scenario reports 42: its first sweep lands 1 s after the cast (about frame 72 of 74), so the test only catches the start of one sweep.

Kit evidence: 63 Soulfire, 6 Reap, 4 Soul Rend, 3 Soulstorm and 2 Reaper casts. The player lost 992 of 1000 HP (lowest 26), which means a hit landed roughly every 0.5 s and each one dropped 2 Souls. Souls stayed near 0, so the +4%/Soul damage, Soulstorm's missile count and the Reaper's extra sweeps barely ever applied.

---

## LMB: Soulfire (`js/elements.js` line 1866)
- **[balance]** At 12 per bolt, Soulfire is the lowest basic-attack damage of any element I checked (Abyss Void Bolt is 13 plus a splash, Wind 17 was flagged as too low). Soulfire is about half the kit's casts, about 25 dps. **Change:** `dmg: 12 * c.dmg -> 16 * c.dmg`. Impact **high**, effort **S**.
- **[visual]** The bolt reads clearly as a pale blue flame with a two-tone trail (`m0_Soulfire_010.jpg`). On impact there is no effect; there are only the `det`/`nova` upgrade effects. By `m0_Soulfire_022.jpg` the hit shows nothing but a few blue sparks. The move description says "burn whatever they touch", but nothing shows a burn. **Change:** add `hit: e => burst(e.x, e.y, e.z, 10, 0x8cb4ff, 4, .12, .3, -1)` to the `fx` block (an upward, flame-like puff). Impact **med**, effort **S**.

## RMB: Reap (lines 1874-1891)
- **[balance]** This is a melee cone (6.5 m) on a 5 s cooldown for 30 damage. That is too little for a move that has to be used in contact range, where the player takes hits and loses Souls. The execute below 20% rarely fires, because 30 damage seldom brings anything into the window. **Change:** `30 * c.dmg -> 45 * c.dmg`, and raise the reach a little, `coneHits(p, 6.5, 160) -> coneHits(p, 7.5, 160)`. If you change the reach, update the "6.5 m" in the description and the outer radius `6.4` in `REAP_ARC` (line 107) to match. Impact **high**, effort **S**.
- **[visual]** The `REAP_ARC` crescent is 4.6-6.4 m wide, centred on the player and tilted (`-.3`). From eye height it reads as a flat, milky band across the whole horizon (`m1_Reap_022.jpg`), not as a blade edge. The four `soul__scythe` ghosts sit at `e.y + .75` and mostly show as a dark shaft between the hands (`m1_Reap_010.jpg`). The swing itself is hard to see. **Change:** in the arc fade, `fade(o, (1 - a) * .5) -> (1 - a) * .3`. Raise the scythe ghosts to eye level and push them forward, `V(e.x, e.y + .75, e.z) -> V(e.x + e.d[0] * 1.2, e.y + 1.3, e.z + e.d[2] * 1.2)`, so the blade crosses the view. Impact **med**, effort **S**.
- **[feel]** The 0.16 s wind-up, the 0.05 hitstop, the steel sfx and the "REAPED" tag are a good payoff. No change.

## Q: Soul Rend (lines 1892-1899)
- **[visual]** This is the best-looking move in the kit. The beam from the hand, the pale silhouette pulled out of the enemy and the "HOLLOWED" tag read clearly (`m2_SoulRend_022.jpg`). No change.
- **[balance]** 35 damage, a 1 s stun and +2 Souls on an 8 s cooldown is fine as a utility move. It is the only reliable source of Souls in the kit, though, and with the passive drop the 2 Souls are usually gone within a second. **Change:** `dmg: 35 * c.dmg -> 45 * c.dmg`. Impact **low**, effort **S**.

## E: Soulstorm (lines 1900-1909)
- **[balance]** Souls are almost always at 0, so Soulstorm almost always fires the minimum of 4 missiles × 14 = 56 damage on a 10 s cooldown. In the pack test it did 46 damage, about the same as one Soul Rend. **Change:** `Math.max(4, ...) -> Math.max(8, ...)`. Update the description ("at least 8"). Impact **high**, effort **S**.
- **[feel]** The missiles leave from a ring 2.7 m up at speed 16 with weak homing (`home: 7`). At frame 45 (0.75 s) they are still arcing out at the edges of the screen, far from the pack (`m3_Soulstorm_045.jpg`). The move feels slow to land. **Change:** `shoot(p, c, 16, ...) -> 22`, `home: 7 -> 10`. Impact **med**, effort **S**.
- **[performance]** This move has the highest particle peak in the kit (685) and the highest average frame time (501.9 ms). The `storm` column emits `40 + e.n * 3` particles at once (up to 130 with 15 Souls). **Change:** `40 + e.n * 3 -> 24 + e.n * 2`. Impact **low**, effort **S**.

## R: The Reaper (lines 1910-1926)
- **[visual]** When the Reaper is cast close to the player, its bright 1.5x model (`o.scale.setScalar(n.r / 6)`), the 9 m zone and 60 bloom particles per sweep fill the screen with white. The player cannot see anything (`kit_599.jpg`, `kit_1199.jpg`, `boss_1199.jpg`). In the kit the aim lands on an adjacent enemy, so the player stands inside the zone. When it is cast at range it looks great: the hooded Reaper holding a scythe is distinct and on theme (`m4_TheReaper_074.jpg`). **Change:** in `upd`, fade by camera distance, `fade(o, Math.min(1, n.l * 5) * clamp(dist(cam, o) / 8, .25, 1))`. In `sweep`, `for (let i = 0; i < 60` -> `36`, and particle size `rand(.15, .35) -> rand(.1, .25)`. Impact **high**, effort **S**.
- **[feel]** The first sweep only comes 1 s after the cast (`n.t < 1 + n.s * .6`), so the ultimate feels slow to respond. **Change:** `1 + n.s * .6 -> .6 + n.s * .6`, and in `cast` `life: 1.6 + sw * .6 -> 1.2 + sw * .6` to keep the same number of sweeps. Impact **med**, effort **S**.
- **[balance]** This move is affected by the known shared bug where ultimate hits refill the ultimate (`addUlt` in `damage()`). It does 50 per enemy per sweep for 3-8 sweeps, so the ultimate is fully recharged before the Reaper even leaves. Ultimate ready time was 100% in both the kit and the boss fight, and it was cast 3 times in 30 s against the Tyrant. Fix that globally, not here. If the shared fix makes this ultimate rare, its damage is fine. Impact **high** (shared), effort **S**.

## Passive: Soulbound (`js/sim.js` lines 106, 410, 424)
- **[balance]** This is the root cause of the 0.24x crowd score. Line 424 removes 2 Souls on every hit the player takes, and in a wave-5 crowd the player is hit about every 0.5 s. One kill gives only 1 Soul, so the stack never grows. That means the +4%/Soul bonus (up to +60%), Soulstorm's missile count and the Reaper's extra sweeps all stay at their minimum. **Change:** `p.bd.souls - 2 -> p.bd.souls - 1`, plus a short grace window so a single swarm cannot strip the whole stack: `if (p.cur === 'soul' && p.bd.souls > 0 && !(p.bd.soulT > S.t)) { p.bd.souls--; p.bd.soulT = S.t + .5; }`. Update the passive text in `js/elements.js` line 1863 ("drop 1"). Impact **high**, effort **S**.
- **[visual]** The harvest effect (`fx.harvest`, a flame that arcs from the corpse to the player) and the souls orbiting the player (`js/view.js` line 1058) are a good resource read. No change.
- **[visual]** Enemies hit by Soul flash orange and gold, not pale blue (`m1_Reap_003.jpg`, `m2_SoulRend_010.jpg`, `m4_TheReaper_022.jpg`). This is the same shared hit tint other reports noted. Check whether the hit tint can use the element colour `0x8cb4ff`. Impact **low**, effort **S**.

---

## Top 3
1. **Passive Soul drop: 2 per hit becomes 1, with a 0.5 s grace** (`js/sim.js:424`). This lets Souls actually build, which unlocks the passive's +4%/Soul, Soulstorm and the Reaper's extra sweeps. It is the main fix for the 0.24x crowd score.
2. **Raw damage on the core moves:** Soulfire `12 -> 16`, Reap `30 -> 45` with reach `6.5 -> 7.5`, Soulstorm minimum `4 -> 8` missiles. The goal is roughly 0.85x median crowd dps.
3. **Stop the Reaper whiteout when it is cast close:** fade by camera distance and cut the sweep particles `60 -> 36` (`kit_599.jpg`, `kit_1199.jpg`, `boss_1199.jpg`). Also bring the first sweep forward from 1 s to 0.6 s.
