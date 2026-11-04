# Light playtest report

**Verdict:** a good-looking, readable holy kit, but it sits low against crowds and the Solar Beam covers almost half the screen while you channel it.
**Crowd dps** 171.3 (0.76x median 225.1) | **Boss dps** 133.4 (0.99x median 134.3) | median from 19 elements | **Worst frame cost:** Divine Judgment, 478.6 ms avg / Solar Beam 2221.9 ms worst (all frame times are inflated because 30 harnesses ran at once, so only compare them between moves)

Kit (30 s, wave-5 crowd): 51 kills, 427 HP lost, 184 healed. Casts: Orbs 42, Beam 4, Flash 4, Penance 3, Judgment 5. Boss: 392 HP lost, 125 healed.

Light is not a control or defence element in vault/Elements.md (Balance), so 0.76x against crowds is below the 0.85-1.2x band. The boss number is on target, so any buff should go to area damage, not single-target damage.

## LMB: Radiant Orbs
- **[visual]** The bolt is small but reads clearly: there is a gold trail and a light on each bolt. The spinning sun-sigil in the casting hand makes it clear Light is the active element (m0_RadiantOrbs_010/022). The impact flash on the target is bright and readable (m0_010). No change.
- **[balance]** This move does most of Light's damage (42 casts) but hits only one target and does not home. It is a big part of why crowd dps is low while boss dps is on target. Proposal: `dmg: 17 * c.dmg` -> `19 * c.dmg` (line 816). This is a small single-target bump. The area buffs below are the main fix. Impact med, effort S.

## RMB: Solar Beam
- **[visual] (high)** For the whole channel, the outer beam tube is drawn starting at the eye. Seen end-on it is a huge flat white decagon that covers about 40% of the screen and hides the targets (m1_SolarBeam_010, _045, _074). The same blob also shows in kit_1199. The cause is `aimBeam(o.children[1], a, b, .35 * w)` with `w = 1.8` at the start of the channel, giving a radius of about 0.63 m right at the camera (line 826). Proposal: start both beams about 1.2 m ahead of the eye, `const a2 = a.clone().addScaledVector(d, 1.2)`, and pass `a2` to both `aimBeam` calls. Also shrink the start width: `w = 1.8 - 1.2 * f` -> `w = 1.2 - .7 * f`. Impact high, effort S.
- **[feel]** The beam visibly narrows as you hold it, but in first person you cannot see that because of the decagon. The fix above makes the focusing readable.
- **[balance]** 182 damage into the pack. This is the best move against groups and fits its 6 s cooldown. No change.
- **[performance]** It spawns a `burst(..., 3, ...)` at the end point every frame, plus a 40% chance of a `flash` every frame: 471 peak particles and 22 fx objects. That is acceptable. Optionally lower the flash chance `Math.random() < .4` -> `< .2`. Impact low, effort S.

## Q: Blinding Flash
- **[visual]** On frames 3-10 the `gen__cone` model is placed at the eye (`o.position.copy(a)`), scaled to 14 and faded at 0.8. Together with `flash(..., 80, .3)` this whites out the whole screen (m2_BlindingFlash_003). It blinds the player more than the enemies. The aftermath looks great: enemies glow with crackling gold (m2_BlindingFlash_022). Proposal: start the cone 1.5 m ahead, `o.position.copy(a).addScaledVector(d, 1.5)`, and lower its opacity `fade(o, (1 - k) * .8)` -> `(1 - k) * .4` (line 832). Impact high, effort S.
- **[performance]** This move has the highest particle peak in the kit: 658 particles and 40 fx objects. That comes from `burst(..., 50, ...)` plus one `lit` modelFx per hit enemy, each emitting at 20% per frame for 5 s. Proposal: `burst(a.x + d.x*2, ..., 50 -> 30, ...)` and in `lit` change `Math.random() < .2` -> `< .1`. Impact med, effort S.
- **[balance]** It deals 65 damage into 6 enemies, i.e. 12 per enemy. Its real value is the 20% damage taken it applies. Proposal: `cd: 9` -> `8` so Illuminated (5 s) is up more often. Impact med, effort S.

## E: Penance
- **[visual]** The halos are hard to see at range: tiny specks over the pack (m3_Penance_010), and only one halo is readable floating far off (m3_Penance_045). The move's whole point is "these enemies are branded", so the brand has to read. Proposal: `o.scale.setScalar(.45)` -> `.8` and the height `V(0, 2.6, 0)` -> scaled with the enemy, e.g. `V(0, ET[e.type]?.h * 1.1 || 2.6, 0)` so it sits over tall enemies too (line 846). Impact med, effort S.
- **[balance]** 54 damage on cast (8 per target). Smites only fire when a branded enemy attacks, so against crowds they are spread out in time. The kit shows only 3 casts and 1% cooldown-ready, so it is used fully. Proposal: smite `60` -> `70` (line 842). This raises crowd damage without touching the 8 s brand or the 2 smites per brand. Impact med, effort S.

## R: Divine Judgment
- **[visual]** The pillar, the halo on the floor and the falling spears look strong, unmistakable and distinct from Fire and Laser (m4_DivineJudgment_010/045). Enemies inside light up. No change.
- **[feel / balance]** The moves scenario recorded 0 damage in the 74-frame window. The cast uses `groundAt(p, 30)`. When the camera looks nearly level, that point lands about 30 m out, behind the pack at about 12 m, and the pillar then only slides at 14 m/s (m4_010 shows it behind the pack). A player aiming at a pack straight ahead gets the same delayed landing. Proposal: `groundAt(p, 30)` -> `groundAt(p, 20)` in both `cast` and `tick` (lines 851, 854), and track speed `14 * dt` -> `20 * dt`. Impact med, effort S. The ultimate median is only 16, so many ultimates measure low in this window, and the harness is part of the cause.
- **[performance]** This move has the highest average frame cost in the kit: 478.6 ms against 198-412 ms for the others. Each frame it runs `burst(..., 4, ...)`, a 50% chance of a `flash`, and spear modelFx. Proposal: flash chance `Math.random() < .5` -> `< .25` (line 860). Impact low, effort S.

## Passive: Radiance
- **[balance]** Solo it heals 4% of damage dealt: 184 HP over 30 s in the crowd fight against 427 lost, and 125 against the boss. That is modest and fits after the Blood rework. Radiant enemies dealing 30% less damage (`st: { weak: .3 }`) is a strong defensive layer, which may be part of why the damage is tuned low. No change.

## Top 3
1. Solar Beam: start both beams 1.2 m ahead of the eye and narrow the start width `1.8 - 1.2*f` -> `1.2 - .7*f`. This removes the screen-covering decagon (m1_SolarBeam_*).
2. Blinding Flash: move the cone 1.5 m forward and set its fade `.8` -> `.4`, plus `burst 50 -> 30` (whiteout in m2_003, 658-particle peak).
3. Crowd dps 0.76x: Penance smite `60 -> 70`, Flash `cd 9 -> 8`, Orbs `17 -> 19`, and Judgment `groundAt(p, 30) -> 20` so it lands on the pack.
