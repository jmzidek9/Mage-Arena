# Chrono playtest report

**Verdict:** Looks great and plays well against bosses, but it is too weak against crowds. The kit kills mostly one target at a time, and two of its moves work against each other.
Crowd dps **129.9** (0.58x median 225.1) | Boss dps **137.1** (1.02x median 134.3) | Worst frame: Rewind, 7832 ms worst / 432 ms avg (30 runs at once, so this is mostly noise; see Performance)

Source: `playtest/out/chrono/metrics.json`, the screenshots, and `js/elements.js` lines 1264-1311 and `js/sim.js`.
Kit, 30 s: 72 bolts, 5 Stasis, 6 Rewind, 3 Slow Field, 4 Time Stop, 19 kills, 300 HP lost, 0 healed. Every cooldown except the ultimate was ready less than 10% of the time, so the kit is cast-limited and nothing sits idle.

Chrono is not on the list of control elements that are meant to score low (Wind, Sonic, Soul, Gravity), so 0.58x against crowds is below the 0.85 floor. The fixes below lift crowd damage and leave boss damage about where it is.

---

## LMB: Chrono Bolt (cd .45, 16 dmg + 16 echo after 1.2 s)
- **[balance]** On one target it is already strong: 32 damage per 0.37 s cast after the passive, about 87 dps, against Blood Bolt's 21 per 0.4 s. Against a crowd it only ever hits one enemy. The move test recorded 16 dmg because the 1.2 s echo lands after the 74-frame capture window. Proposal: give the echo a small splash, keeping the bolt itself the same. In `later(1.2, ...)` (line 1274), add `aoe(e.x, e.z, 2.5, d * .5, 'chrono', p, e.id, 0)` next to `damage(e, d, ...)`. This lifts crowd damage and leaves single-target damage unchanged. Impact high, effort S.
- **[visual]** The echo effect (`ringFx 1.2` plus `burst 12`) is a faint gold puff and does not show up in `m0_ChronoBolt_045/074`. Readers cannot tell the "second hit" happened. Proposal: `ringFx(..., 1.2 -> 1.8, ...)` and add a white core, `burst(e.x, e.y, e.z, 6, 0xffffff, 2, .15, .25)`. Impact med, effort S.

## RMB: Stasis (cd 8, 6 dmg, stores damage ×1.3 for 3 s)
- **[visual]** It reads well. The frozen target glows white-gold and stands out clearly in `m1_Stasis_045.jpg`. No change.
- **[balance]** The initial hit is tiny: 6 dmg in the move test, with the release landing outside the window. Bosses are immune to stasis and take the flat `30 * s.mul` instead (line 1281, `cc()` returns false for bosses in sim.js:236). That is fine. Proposal: `dmg: 6 -> 12` (line 1280) so the cast itself feels like a hit. Impact low, effort S.
- **[feel]** Stasis and Time Stop do not stack. `damage()` checks stasis before tstop (sim.js:341-342), so an enemy in stasis during Time Stop gets ×1.3 instead of ×1.5×1.3. This is design-acceptable. Note it in vault/Combos.md and do not change the code.

## Q: Rewind (cd 6, 8 mark dmg, snap 35 + 14/m up to +200, +150 vs boss)
- **[balance]** The move test recorded 48 dmg, which is 6 × the 8 mark damage. The snap comes after 2.5 s, outside the capture window. In the kit it works against Chrono's own moves: Slow Field (70% slower) and Time Stop (frozen) both stop enemies moving, so the per-metre bonus falls to about 0 exactly when the other moves are active. Proposal: raise the base and the reach so it pays off without movement: base `35 -> 55`, cone `coneHits(p, 14, 80) -> coneHits(p, 14, 100)` (line 1286). Boss damage barely changes, about +3 dps. Impact high, effort S.
- **[visual]** The mark is hard to see. The `chrono__clock` floor decal uses `0xffb43a`, the same gold as the arena's floor sigil, and it lies under the enemies. In `m2_Rewind_010.jpg` it cannot be told apart from the arena ring. Proposal: `o.scale.setScalar(.9 -> 1.3)` and colour `0xffb43a -> 0xfff0c0` (line 1296), plus a thin vertical `pillarFx(e.x, 0, e.z, .15, 2.5, 0xffd080, 2.5)` so each mark reads as a pin in time. Impact med, effort S.
- **[performance]** Rewind had the highest particle peak of the kit: **473**, against 290 for the bolt. The snap emits 24 trail particles plus a 30-particle `burst` per enemy, which is about 324 for 6 enemies. Proposal: `burst(e.x2, 1, e.z2, 30 -> 18, ...)` and `for (i < 24) -> (i < 16)` (lines 1298-1299). Impact low, effort S.

## E: Slow Field (cd 13, r 6, 6 s, 70% slow)
- **[visual]** It looks distinct: a clock face on the floor with spinning hands, under a faint dome (`m3_SlowField_022.jpg`). It is clear without hiding the enemies. No change.
- **[balance]** It does 0 dmg. It is pure control, but Chrono is not marked as a control element, and Slow Field actively reduces Rewind's damage. Proposal: deal a small tick on the existing 1 s pulse: `if (pulse(n, dt, 1)) for (const e of es) { applyStatus(e, 'chrono', own(n)); hitEnemy(e, 'chrono', 10 * n.mul, own(n), 0, 0, 0, { aoe: true, noCombo: true }); }` (line 1302). That is 60 dmg per enemy per field. Impact med, effort S.
- **[performance]** It had the highest average frame time, 525 ms, but only 1 ent and a 440 particle peak, which is in line with the other moves. The machine was loaded by 30 parallel runs, so there is no actionable finding.

## R: Time Stop (ult, 4 s, damage stored ×1.5)
- **[visual]** This is the best visual in the kit. The full-screen sepia freeze (`m4_TimeStop_074.jpg`, `kit_1199.jpg`) is instantly readable and unlike any other element's ultimate.
- **[feel/balance]** On its own it does nothing: `ultDmg 0` in the median table, and 0 dmg in the move test. Its value depends entirely on what you cast during it. The resume moment (`resume()`: flash and shake) has no damage of its own. Proposal: on resume, deal a flat 40 to every enemy that piled up damage, `damage(e, e.tsd * 1.5 + 40, ...)` (sim.js:816), so the ultimate always lands a hit. Impact med, effort S.
- **[visual]** At frame 10 (`m4_TimeStop_010.jpg`) the cast glyph and a leftover Slow Field dome together cover about 40% of the view. The cast glyph is shared by all elements, so this is not Chrono-specific. Low priority.

## Passive: Time Dilation (cooldowns ×0.82, timeworn slow .35)
- **[balance]** The faster cooldowns work (`cdMul` in sim.js:91), and every move stays under 10% ready, so the kit is always busy. Slowing timeworn enemies again cuts into Rewind's per-metre damage. That is acceptable once Rewind's base is raised. No change.

---

## Top 3
1. **Rewind**: base `35 -> 55` and cone `80 -> 100`, so it pays off even when Slow Field or Time Stop has stopped enemies moving. This is the biggest gain against crowds.
2. **Chrono Bolt echo splash**: `aoe(e.x, e.z, 2.5, d * .5, ...)` in the echo, which lifts crowd damage and leaves single-target damage unchanged.
3. **Slow Field tick**: 10 dmg per 1 s pulse to enemies inside, so the E move adds damage instead of only slowing.

Expected result: crowd goes from about 0.58x to about 0.85-0.95x of the median, and boss goes from 1.02x to about 1.1x.
