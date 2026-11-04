# Venom playtest report

**Verdict:** the DoT engine is too strong on bosses and too weak on crowds, and the visuals swing between invisible (puddles, cloud) and too big (serpent at the lens, giant wasps).
**Crowd dps:** 164 (0.73x median 225.1) | **Boss dps:** 210.9 (1.57x median 134.3) | **Worst frame cost:** Plague Swarm, 191 ms avg / 611 ms worst (the next highest is Toxic Cloud at 127 / 708)

The first harness run timed out on `page.goto`. The retry worked. Frame times are inflated because 30 runs shared the machine, so read them relative to each other. Kit: 50 Spit, 5 Cloud, 5 Serpent, 3 Contagion and 5 ultimate casts in 30 s. Everything except the ultimate had under 10% cooldown ready time, so the bot was never short of things to cast.

## Balance overview
- Venom is out of band on both ends. Its strength is long stacking: 8 stacks x `dot: 2.5` = 20 dps per target, plus Contagion's `n * 7` burst, which deals 56 per target at 8 stacks. A boss lives long enough to reach 8 stacks; wave-5 crowd monsters die or respawn before they do. The fix is to move damage out of stacking and into the upfront hits (see the moves below).
- Projected effect of the changes below: crowd about +25% (to about 205, 0.9x), boss about -25% (to about 160, 1.2x).

## LMB: Venom Spit
- **[visual]** You cannot see the puddle once the glob lands (`m0_VenomSpit_045.jpg`, `m0_VenomSpit_074.jpg`). The zone circle is lost against the arena's gold rune disc and only a few motes rise from it. Proposed change: `zoneCircle('venom', n.r, .5)` -> `zoneCircle('venom', n.r, .8)`, and in `view.upd` change the emit chance `.3 * n.r` -> `.6 * n.r`. Impact: med, effort: S.
- **[visual]** On impact against the golem it flashes pure white for about 10 frames, and the burst reads as white rather than green (`m0_VenomSpit_022.jpg`). Proposed change: `fx.boom` `burst(..., 30, 0x9eff1e, ...)` -> 18 particles, plus a darker second burst `burst(e.x, e.y, e.z, 10, 0x5aa010, 4, .3, .5, 6)` so the splash stays green. Impact: low, effort: S.
- **[balance]** This is the main crowd tool (50 casts in 30 s), but it hits for only 20 into the 6-enemy pack (metrics `moves[0].dmg`). Proposed changes: `dmg: 8 * c.dmg` -> `dmg: 10 * c.dmg`, and puddle tick `hitEnemy(e, 'venom', 2 * n.mul, ...)` -> `3 * n.mul`. Impact: high, effort: S.

## RMB: Toxic Cloud
- **[visual]** The cloud body is close to invisible. No frame shows a distinct green gas volume (`m1_ToxicCloud_045.jpg`, `m1_ToxicCloud_074.jpg`); what you see is the enemies' orange hit glow. Proposed change: `fade(o, ... ) * .55` -> `* .75`, and add a ground zone such as Spit's (`zoneCircle('venom', n.r, .5)`) so its edge reads. Impact: med, effort: S.
- **[balance]** It dealt 0 damage into the pack. Most aim moves score 0 in this harness (20 of 25 across elements), so this is probably the harness's aim target and not the move. The cloud also drifts away from the target at `c.flat` (1 m/s), off a 4 m radius over its 6 s life. Proposed change: halve the drift, `dx: c.flat.x, dz: c.flat.z` -> `dx: c.flat.x * .5, dz: c.flat.z * .5`, so it stays on what you aimed at. Impact: med, effort: S.
- **[performance]** It peaks at 432 particles with 127 ms avg / 708 ms worst, the worst frame spike of the kit. It emits on 60% of frames at sizes .4-.8. Proposed change: `Math.random() < .6` -> `< .35` (the larger fade above makes up for it). Impact: low, effort: S.

## Q: Serpent
- **[visual]** It spawns 1 m in front of the camera, and for the first ~10 frames a big blurred green capsule fills the bottom middle of the view (`m2_Serpent_010.jpg`). Proposed change: `ent(p, c, p.x + f.x, p.z + f.z, ...)` -> `p.x + f.x * 2.5, p.z + f.z * 2.5`. Impact: med, effort: S.
- **[performance]** 507 particles peak, the highest single-cast move: 2 emits per frame for 1.6 s. Proposed change: the `for (let k = 0; k < 2; k++)` emit loop -> 1 emit. Impact: low, effort: S.
- **[balance]** It did 79 into the pack, the best of the kit, but `cd: 7` with 11 per bite. It is a crowd move and helps bosses little. Proposed change: `hitEnemy(e, 'venom', 11 * n.mul, ...)` -> `14 * n.mul`. Impact: med, effort: S.

## E: Contagion
- **[feel]** With no poisoned enemy nearby the cast does nothing: no damage, no feedback, full 10 s cooldown (`m3_Contagion_010.jpg` shows only the cast sigil, and metrics show 0 dmg). Proposed change: when `list` is empty, `fxe(c.m.key, 'fizzle', ...)` (a small `burst(p.x, 1, p.z, 10, 0x5aa010, 3, .2, .4)`) and refund half the cooldown, so the mistake is visible and cheap. Impact: med, effort: M.
- **[balance]** Its burst scales with stacks, which is what drives the 1.57x boss dps: 8 stacks x 7 = 56 per target, recast every 10 s, and the boss is refilled by the half-stack spread from its adds. Proposed change: `damage(e, n * 7 * c.dmg, ...)` -> `n * 5 * c.dmg`. Impact: high, effort: S.

## R: Plague Swarm
- **[visual]** The wasps read as huge green caterpillars. At `scale 1.25`, clinging close and with motion smear, they fill the screen edges (`m4_PlagueSwarm_074.jpg`, `kit_1199.jpg`, `boss_1199.jpg`) and hide the Tyrant and the crowd. Proposed change: `o.scale.setScalar(1.25)` -> `.85`. Impact: high, effort: S.
- **[performance]** 191 ms avg frame, 2x the kit's other moves (81-127), with 8 ents and 468 particles. The models are the cost, not the particles, so the scale cut above helps fill rate. If more is needed, `for (let i = 0; i < 8; i++)` -> 6 wasps with `6 * n.mul` -> `8 * n.mul`, which keeps the damage the same. Impact: med, effort: S.
- **[balance]** It did 27 into the pack in 74 frames (median ult 16). Fine; no change.

## Passive: Virulence
- **[balance]** `st: { dot: 2.5, stacks: 8 }` together with the on-kill spread (`ceil(stacks/2)` to everything within 4.5 m) is the snowball. It works on crowds only when the stacks get time to build. Keep the idea. With the Contagion trim, `dot` can stay at 2.5. If boss dps is still above 1.2x after the trims, lower `stacks: 8` -> `6`. Impact: med, effort: S.
- **[visual]** The death pop `burst(e.x, e.y, e.z, 24, ...)` reads fine but has no ring to show the 4.5 m spread radius. Proposed change: add `ringFx(e.x, .08, e.z, 4.5, 0x9eff1e, .3)` to `fx.pop`. Impact: low, effort: S.

## Top 3
1. Move boss damage into crowd damage: Contagion `n * 7` -> `n * 5`; Spit `dmg 8 -> 10` and puddle tick `2 -> 3`; Serpent bite `11 -> 14`.
2. Plague Swarm wasp `scale 1.25 -> .85`. They currently cover the screen and cost 2x the frame time.
3. Make the zones readable: Spit puddle `zoneCircle opacity .5 -> .8` and emit `.3 -> .6`; Toxic Cloud fade `.55 -> .75` with a ground circle; Serpent spawn `f * 1 -> f * 2.5` so it doesn't start at the lens.
