# Spirit playtest report

**Verdict:** a weak summoner on crowds, but a broken boss-killer: Army of the Dead recharges itself on bosses, so the ultimate is cast 16 times in 30 s and the screen turns white.
Crowd **139.2 dps (0.62x median 225.1)** · Boss **566.4 dps (4.22x median 134.3)** · Worst frame: Banshee, 446.8 ms avg / 5850 ms worst (headless and contended, so compare it only against the other moves). Peak particles: Army, 664.

Note: the per-move "dmg into a 6-pack" numbers for summons (Command 0, Army 0, Wolf 27) understate them. Summons wind up for 0.5-0.9 s before their first swing, so most of their damage lands after the 74-frame window. Screenshots m4_045 and m3_045 show the pack being hit.

## LMB: Soul Wisps
- **[visual]** The wisp shows as a white orb with no green core or silhouette (m0_SoulWisps_003/010). Bloom washes the 0x5effc8 tint out, and the impact flash is also white (m0_022), so it reads like any light/arcane bolt. Change: `look.light: 4 -> 2` and `fx.det: boomFx(..., 2.5, 0x5effc8, .6)` -> `boomFx(..., 2.5, 0x2fd6a0, .6)` (a deeper green that survives bloom). Impact med, effort S.
- **[balance]** Wisps do about a third of the kit damage (59 casts x 24 = 1416 of 4175). Crowd dps is 0.62x, below the band, and spirit is a summoner, not a control element. Change: `dmg: 24 * c.dmg -> 30 * c.dmg`. Impact high, effort S.

## RMB: Command
- **[feel]** With no summons, it raises a wandering spirit 1.6 m to your right. That spirit fills about 20% of the right side of the screen for the first ~0.3 s (m1_Command_010). Change: in `cast`, spawn at `p.x + c.flat.x * 2.5 - c.flat.z * 1.6, p.z + c.flat.z * 2.5 + c.flat.x * 1.6` so it rises ahead and to the side. Impact low, effort S.
- **[balance]** A 7 s cooldown for a 20-damage strike per summon is a weak button, at 5 casts per 30 s. Change: `hitEnemy(e, 'spirit', 20 * c.dmg ...) -> 30 * c.dmg`. Impact med, effort S.
- **[performance]** The order fx peaks at 464 particles and 14 fx objects, which is the 2nd-heaviest move. Change: `burst(e.x, e.y, e.z, 30 -> 18, ...)`. Impact low, effort S.

## Q: Banshee
- **[visual]** The skull is small and sits behind the pack (m2_Banshee_045/074). The 5 m zone circle cannot be seen at all in any frame, and only one enemy was hit in the window (dmg 18). The shriek ring is the move's only feedback, and it lasts 0.5 s. Change: `zoneCircle('spirit', n.r, .35 -> .6)` and `setOpacity(..., Math.min(.35 -> .55, n.l * 2))`, and scale the skull `(1.8 -> 2.4 + u.wail * 1.2)`. Impact med, effort S.
- **[performance]** The shriek emits 36 particles per wail on top of the per-frame trail. This gives a peak of 508 particles and the worst frame time of the kit (446.8 ms avg / 5850 ms worst). Change: `for (let i = 0; i < 36 -> 20; i++)` in `upd`. Impact med, effort S.
- **[balance]** It is a control move (fear 1.5 s) and stays as one. No dmg change.

## E: Spirit Wolf
- **[visual]** The wolf spawns at `p.x + 1.5, p.z`, a fixed world-space offset rather than one relative to your facing, so it can appear on top of the camera. In m3_SpiritWolf_003/010 a giant translucent wolf covers the right third of the screen. Change: `ent(p, c, p.x + 1.5, p.z, ...)` -> `ent(p, c, p.x + c.flat.x * 2.5, p.z + c.flat.z * 2.5, { ..., yaw: Math.atan2(c.flat.x, c.flat.z) })`. Impact high, effort S.
- **[balance]** Change: `30 * n.mul -> 36 * n.mul` to help crowd dps (cd 12, cast 3 times per 30 s). Impact med, effort S.
- **[performance]** It peaks at 502 particles, mostly from the 40-particle `burst` in `make`. Change: `burst(n.x, 1, n.z, 40 -> 24, ...)`. Impact low, effort S.

## R: Army of the Dead
- **[balance] (critical)** The ultimate refills itself. Each cast is 6 knights x ~10 swings x 20 dmg, about 1200 damage on a single big target. Every damage point charges ult at `amount / 900` (js/sim.js:363), so one cast pays back about 1.3 ults. In the boss run that is 16 casts in 30 s and 566 dps, 4.2x the median. Knights also stack, because `cast` does not clear old ones. Changes:
  1. Ult summons should not charge ult. In the knight attack, pass `{ aoe: true, noUlt: true }`. In js/sim.js:363, change it to `if (!o.noUlt) addUlt(p, ...)`. The same guard likely explains storm's 6.76x boss result.
  2. Cap the knights: add `for (const n of entsOf(p, c.m.key)) n.dead = true;` at the top of `cast`.
  3. If it is still high, change the knight `20 * n.mul -> 16 * n.mul`.
  Impact high, effort S.
- **[visual]** The rise burst (80 particles) plus 6 knights at 0.55 opacity plus bloom wash the centre of the screen to white for about 0.4 s (m4_ArmyoftheDead_003/010/022). With chain-casting, the whole screen is white (kit_1199.jpg, boss_1199.jpg). Change: `burst(e.x, .5, e.z, 80 -> 40, ...)` and `fade(o, ... * .55 -> .4)`. Fix 1 above also ends the chain-casting. Impact high, effort S.
- **[performance]** It has the highest peaks of the kit: 664 particles and 27 fx objects for 6 entities. Change: knight trail `Math.random() < .25 -> .12`. Impact med, effort S.

## Passive: Restless Dead (+ Haunted)
- **[feel]** Raised spirits are the same model as Soul Wisps (`spirit.0` ent), so you cannot tell a spirit from a wisp. Kills in the kit run: 35. Change: in `view.make`, `u.w.scale.setScalar(1.5 * k)` -> `2 * k` for ents (the passive spirits), so the allies read as bigger than shots. Impact low, effort S.
- **[balance]** Spirit damage is `9 * n.mul` every 0.8 s, about 11 dps each, 45 dps at the cap of 4. It is fine as a passive. No change. Haunted (`weak: .25`, `slow: .15`) has no visible tell in any screenshot. Consider a faint green tint on haunted enemies (in core status visuals). Impact low, effort M.

## Top 3
1. **Stop Army of the Dead from recharging the ultimate** with `noUlt` on knight hits (js/sim.js:363 guard), and kill old knights on cast. This takes boss dps from 4.2x down toward the band and ends the whiteout.
2. **Spawn the Spirit Wolf in front of you** (`p.x + c.flat.x * 2.5`) instead of on top of the camera.
3. **Lift crowd damage into the band:** Soul Wisps `24 -> 30`, Wolf `30 -> 36`, Command strike `20 -> 30` (0.62x -> about 0.85x).
