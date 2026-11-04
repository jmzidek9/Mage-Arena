# Rune playtest report

**Verdict:** a clear, good-looking trapper kit that lands in band against crowds only because Word of Ruin refills itself, and is far too weak on bosses (0.38x).
**Crowd dps** 208.8 (0.96x median 218.1) | **Boss dps** 51.5 (0.38x median 137.1) | median from playtest/out/median.json (30 elements) | **Worst frame:** Sigilfall, 1864.8 ms worst / Word of Ruin 551.5 ms avg (frame times are inflated by ~11 harnesses running at once; only compare between moves)

Kit (30 s, wave-5 crowd): 44 kills, 740 HP lost, 18 healed. Casts: Bolt 62, Glyph Trap 7, Sigilfall 5, Binding Circle 3, Word of Ruin 6. Boss: 641 HP lost, 2 kills (adds), Word of Ruin 2 casts.

Harness note: all four ward moves show 0 dmg in the 1.25 s "moves" window. The cast fires at frame 12 (0.2 s), the ward arms only after `n.t > 1` (`tripped`, js/elements.js line 239), and Sigilfall/Word of Ruin then add 0.4-1.5 s of delays. So the window ends before anything lands; that is a harness limit, not proof the wards fail (the kit fight shows them working: 44 kills). It does mean the per-move screenshots never show the payoff (m3_BindingCircle_074 has no circle or stones yet).

Rune is not listed as a control/defence element in vault/Elements.md (Balance), so 0.38x on the boss is a real gap. The crowd figure is propped up by the ultimate loop (see R), so after the shared `addUlt` fix the crowd number will drop too, likely to ~0.6-0.7x.

## LMB: Rune Bolt
- **[visual]** The spinning flat rune with a teal trail reads well and is clearly Rune-coloured (m0_RuneBolt_003). No change to the bolt.
- **[visual]** The Empowered marker (`circleFx('rune', V(-.26, -.17, -.85), .26, { parent: camera ... life: .55 })`, line 1744) stacks on top of the hand sigil and makes a bright circle about a quarter of the screen tall, sitting over the left-centre of the view where the pack is (m0_RuneBolt_003, _010). It fires every third cast, so it flickers over the target constantly. Proposal: radius `.26` -> `.17`, life `.55` -> `.35`, and position `V(-.26, -.17, -.85)` -> `V(-.3, -.24, -.85)` so it sits on the hand, not the target. Impact med, effort S.
- **[balance]** The bolt is ~60% of boss damage (62 casts x 13 x ~1.2 Empowered avg ~ 970 of 1544). 13 dmg every 0.4 s is ~33 dps, low for a main single-target tool. Proposal: `dmg: 13 * c.dmg` -> `16 * c.dmg` (line 1742). Impact high, effort S.

## RMB: Glyph Trap
- **[visual]** It is the only ward with no floating top model (`view: wardView()`, line 1749), so it is just a flat decal on the floor. Under a pack it disappears completely (m1_GlyphTrap_003/074: no teal visible under the enemies; Sigilfall/Binding/Ruin at least have a floating stone/glyph). Proposal: `wardView()` -> `wardView('rune__glyph', .35)` so every ward is visible and they still differ by size. Impact med, effort S.
- **[feel]** The trip effect (boom + pillar + rising glyph, line 1750) and the lift/stun look great in the crowd fight. The 1 s arm time (line 239) is long when you drop it under an enemy that is already moving at you: it often walks off before arming. Proposal: `n.t > 1` -> `n.t > .6` (shared by all wards; the arming flicker in `wardUpd` line 250 `n.t < 1` should change to match). Impact med, effort S.
- **[balance]** 45 dmg + lift + 1 s stun every 4 s. On a boss that is ~11 dps if it ever triggers. Proposal: `45 * n.mul` -> `55 * n.mul` (line 1748). Impact med, effort S.

## Q: Sigilfall
- **[visual]** The three falling runestones with teal trails and the slam (dust, ring, burst, shake) are the strongest-looking move in the kit and clearly different from Glyph Trap (m2_Sigilfall_045 shows the pack lit up after the chains). No change.
- **[balance] (bug)** The final stone's radius is scaled by area twice: `R: 3.5 * c.st.aoe` in `cast` (line 1752), then `boomAt` multiplies by `stats(c.p).aoe` again (line 17). With area upgrades it grows with aoe squared. Proposal: `R: 3.5 * c.st.aoe` -> `R: 3.5`, and keep `enemiesNear(t.x, t.z, R)` for the root using `R * c.st.aoe`. Impact low (only with area upgrades), effort S.
- **[balance]** 30+30+50 = 110 over 6 s is fine against crowds; it is a big part of the boss gap only because the boss must walk onto it. No number change; the shorter arm time above helps.
- **[performance]** Each falling stone emits 2 particles per frame (line 1764), peak 440 particles / 14 fx objects. Acceptable. No change.

## E: Binding Circle
- **[visual]** The six stones rising round the circle and the spinning zone (lines 1780-1785) are not seen in the move window (m3_BindingCircle_045/074 show only the pack; the ward has not tripped yet). In the kit fight the circle reads (kit_599, teal circle underfoot). No change, but the ward needs the visibility fix shared with Glyph Trap.
- **[balance]** `e.fv = .25` (line 1774) overwrites any stronger damage-taken mark from another source (Snare, Levitate in co-op / second element). Proposal: `e.fv = Math.max(e.fvU > S.t ? e.fv : 0, .25)`. Impact low, effort S.
- **[balance]** 10 per second for 6 s plus +25% taken and 40% slow, on a 12 s cooldown: good value, and the +25% is the best boss tool in the kit if the Tyrant steps in. Proposal: tick `10 * n.mul` -> `12 * n.mul` (line 1774). Impact low, effort S.

## R: Word of Ruin
- **[balance] (shared bug, affected)** Yes, it is hit by the ultimate refill loop: 6 casts in the 30 s crowd fight (cooldownReady 100%), because 90 dmg on up to 12 targets refills the meter. In the crowd fight it is probably 40%+ of all damage, so the 0.96x crowd figure is inflated. Rerun after the `noUlt` fix before tuning crowd numbers.
- **[balance]** On a lone boss it is one 90-dmg slam: `es.slice(0, 12)` with one target (line 1792), so the ultimate is nearly worthless in a boss fight (2 casts, ~180 dmg out of 1544). Proposal: scale per-target damage when few enemies are hit, e.g. `90 * c.dmg` -> `90 * c.dmg * Math.min(3, 4 / Math.max(1, es.length))` (lone boss 270, 2 targets 180, 4+ targets 90 as now). Impact high, effort S.
- **[visual]** On the boss the 'speak' pillar (`pillarFx(..., 2.5, 10, 0x22e6b8, 1)` + `flash(..., 60, .5)`, line 1796) plus the per-target `ruin` pillar and boom (line 1798) fill most of the screen white when the boss is close (boss_599: a giant white pillar in the centre; boss_1199 almost fully white; kit_1199 too). Proposal: speak pillar opacity `1` -> `.55`, flash `60` -> `30`; in `ruin` change `boomFx(..., 3, 0x22e6b8, 1)` -> `(..., 2.2, 0x22e6b8, .6)`. Impact high, effort S.
- **[visual]** The large teal arcs that sweep across the bottom of the view while aiming/after casting (m4_WordofRuin_022, _074) are readable but busy; with the hand sigil they add a lot of teal near the camera. Low priority, no change.

## Passive: Rune Mastery
- **[feel]** Every-third-spell Empowered (x1.6, line 1739) works and the bolt grows `x1.5` when empowered. Because the bolt is cast so often, Empowered almost always lands on a bolt instead of a ward, which is the less exciting choice. Proposal (keeps the idea): skip counting the bolt (`if (m.cd >= 1)` around the counter), or count it as half (`p.bd.runeN += m === this.moves[0] ? .5 : 1` with `>= 3` reset). Impact med, effort S. Rerun the bench after; it shifts damage into wards.
- **[balance]** Inscribed +10% taken (`st: { vuln: .1 }`) is fine. No change.

## Top 3
1. Boss dps 0.38x: Word of Ruin focuses on few targets (`90 * c.dmg * Math.min(3, 4 / Math.max(1, es.length))`, line 1793), Rune Bolt `13 -> 16` (line 1742), Glyph Trap `45 -> 55` (line 1748), ward arm time `n.t > 1 -> .6` (line 239).
2. Word of Ruin white-out on close targets (boss_599, boss_1199, kit_1199): speak pillar opacity `1 -> .55`, flash `60 -> 30`, ruin boom `3/1 -> 2.2/.6` (lines 1796, 1798).
3. Glyph Trap ward invisible under a pack: `wardView()` -> `wardView('rune__glyph', .35)` (line 1749), and shrink/move the Empowered hand circle `.26 -> .17` (line 1744). Then rerun crowd after the shared ult-loop fix, which is inflating Rune's 0.96x.
