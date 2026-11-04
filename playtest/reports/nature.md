# Nature playtest report

**Verdict:** a well-rounded kit with good crowd numbers. Against bosses it is too strong, because World Tree's vines all land on the one target and the ultimate recharges fast enough to overlap itself.
Crowd **217.5 dps (0.97x median 225.1)**, boss **208.5 dps (1.55x median 134.3)**, ult pack dmg 182. Worst frame 3693.6 ms (Parasite Seed). That number comes from 30 harnesses sharing one machine, so only the relative numbers mean anything.

Harness caveats (these come from the bot, not the game):
- **Entangle and Snaptrap show 0 dmg.** The aim point landed beside the pack. In m1_Entangle_045 and m1_Entangle_074 the roots sit behind the pack on the right, and the trap never appears in the m3 shots.
- **Parasite Seed shows 8 dmg.** It bursts after 3 s, but the last screenshot (frame 74) is taken at about 1.2 s, so the 30 x 4 burst is missed.

Kit casts in 30 s: Thorn Volley 52, Entangle 5, Seed 3, Snaptrap 3, **World Tree 6** (the same in both the crowd and the boss runs).

## LMB: Thorn Volley
- **[visual]** The thorns are hard to pick out in flight. In m0_ThornVolley_010 and m0_ThornVolley_022 the only feedback is the white hit-flash bloom on the big enemy, and no green streaks are visible. Change: thicken the trail, `look.trail: [0x9aff80, .12, .25, 0, 1]` -> `[0x9aff80, .18, .3, 0, 1]` (js/elements.js:673). Impact med, effort S.
- **[feel]** The 6-thorn burst is the move's signature, but it fires only once every 2 casts on one enemy and was not caught on camera. The `thorns` fx currently uses `debrisFx(..., 8, ...)` and `burst(..., 20, ...)`. Change: add `ringFx(e.x, e.y, e.z, 1.2, 0x4ee04a, .25)` to that fx so the pop reads. Impact low, effort S.
- **[balance]** Leave as is. It gives about 72 single-target dps (60 + the 12 burst every 2 casts), in line with other basic attacks.

## RMB: Entangle
- **[visual]** The roots read as dark brown spikes with little green. In m1_Entangle_074 the zone is hard to see at range. Change: `zoneCircle('nature', n.r, .6)` -> `.75`, and spread emit chance `Math.random() < .3` -> `< .45` (line 685). Peak particles are 428, under World Tree's 589, so there is room. Impact med, effort S.
- **[balance]** This is the root/control move, and its damage of `6 * n.mul` every 0.5 s (12 dps per enemy) is light for the move that sets up the rest of the kit. If World Tree is trimmed (see R), compensate here: `hitEnemy(e, 'nature', 6 * n.mul ...)` -> `8 * n.mul` (line 681). Impact med, effort S.

## Q: Parasite Seed
- **[visual]** The growing flower over the host is hard to see. In m2_ParasiteSeed_074, about 1.2 s into the growth, no flower can be made out over the pack. It starts at scale 0.25. Change: `o.scale.setScalar(.25 + 1.1 * (1 - n.l))` -> `(.45 + .9 * (1 - n.l))` (line 698). Impact med, effort S.
- **[feel]** Frame 22 (m2_ParasiteSeed_022) shows the seed hit and the pack glowing, which looks fine. The 3 s wait has no ticking cue. Change: raise emit chance `< .3` -> `< .5` in `view.upd` so the host visibly sheds sparks. Impact low, effort S.
- **[performance]** Worst frame 3693.6 ms, against 955-2355 ms for the other moves. Peak particles (444) and fx objects (26) are no higher than Entangle's, so this is most likely contention between the 30 parallel runs and not the move itself. Re-measure solo before acting. Impact low, effort S.

## E: Snaptrap
- **[visual]** The trap model could not be judged because the bot's aim point missed the frame. The code has a good bite animation (the jaw rotation in `upd`) and a 16-particle bite burst.
- **[balance]** The 45 dmg bite every 1.1 s for 12 s comes to about 490 per cast on a boss, roughly 35 dps over its 14 s cooldown. That is fine for a pin move, so leave it as is. If boss dps is still high after the R change, use `45 * n.mul` -> `40 * n.mul` (line 710). Impact low, effort S.

## R: World Tree
- **[balance]** This move is the source of the 1.55x boss result. The vines strike a random enemy in range, `25 * n.mul` every 0.4 s (62.5 dps). Against a lone boss every vine lands on the boss, for about 560 per tree plus the 40 blast. The ultimate was cast 6 times in 30 s, which means the trees overlap. Two changes:
  1. Vine damage against bosses: `hitEnemy(e, 'nature', 25 * n.mul, ...)` -> `hitEnemy(e, 'nature', (ET[e.type].boss ? 14 : 25) * n.mul, ...)` (line 725). Boss vine dps drops to 35 and crowd play is unchanged.
  2. Vine interval: `pulse(n, dt, .4, 'v')` -> `pulse(n, dt, .5, 'v')`, which trims overlap and the self-feeding ult charge.

  Expected result: boss around 145-160 dps (about 1.1x) and crowd about 0.9x, with the +2 on Entangle making up the crowd loss. Impact high, effort S.
- **[visual]** The tree is the most readable and most distinct visual in the kit (m4_WorldTree_074, boss_1199). However, the r=10 zone circle at 0.55 opacity plus the falling leaves wash the screen green when you stand inside it (kit_1199, boss_1199). Change: `zoneCircle('nature', n.r, .55)` -> `.35` (line 727). Impact med, effort S.
- **[performance]** Peak particles **589** and fx objects **43** are the highest in the kit; the next highest are 444 and 26. Change: leaf emit `Math.random() < .5` -> `< .3` (line 729) and vine `burst(..., 14, ...)` -> `10` (line 731). Impact med, effort S.

## Passive: Regrowth (1.5 HP/s)
- **[balance]** It healed 38 in the crowd run and 37 in the boss run, against 418 and 286 HP lost: small but steady, which fits "patient and resilient". Leave as is.
- **[visual]** The heal had no visible cue in the kit shots. This is optional and low priority: a faint green `emit` at the hands every 1 s while healing. Impact low, effort S.

## Shared (not nature-specific)
- **[visual]** The large green cast rune at the left hand covers the centre of the screen right after aimed casts (m3_Snaptrap_022, m4_WorldTree_022, kit_1199, boss_1199). This belongs to the hand cast rune in the view code, not to js/elements.js. Worth a smaller scale or a faster fade there. Impact med, effort S.

## Top 3
1. World Tree vines against bosses: `25 * n.mul` -> `(ET[e.type].boss ? 14 : 25) * n.mul`, and the vine pulse `.4` -> `.5`. Brings boss dps from 1.55x to about 1.1x.
2. World Tree clutter and cost: zone circle opacity `.55` -> `.35`, leaf emit `.5` -> `.3`, vine burst `14` -> `10` (589 particles is the kit's peak).
3. Readability: Thorn Volley trail `.12` -> `.18`, Parasite Seed flower start scale `.25` -> `.45`, Entangle zone circle `.6` -> `.75`, and Entangle tick `6` -> `8` to offset the trim in item 1.
