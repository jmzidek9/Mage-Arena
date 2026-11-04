# Crystal playtest report

**Verdict:** looks good and is readable, but it is under-tuned in both scenarios and Crystal is not one of the elements meant to sit low (Wind, Sonic, Soul, Gravity). It needs about +25% damage, mostly on LMB and the Spire.

| Metric | Value |
|---|---|
| Crowd dps (kit, 30 s, wave-5 x8) | **163.8**, 38 kills, 533 hp lost, 36 healed |
| Boss dps (Tyrant, 30 s) | **95.9** |
| x-median (median of 19 elements: crowd 225.1, boss 134.3) | crowd **0.73x**, boss **0.71x**. Both are below the 0.85-1.2 band. |
| Worst frame cost | Resonant Crystal 4216 ms worst / 206 ms avg; Geode Bomb 2763 ms worst / 231.5 ms avg (the highest average). 30 parallel headless runs make worst-case numbers noisy, so compare averages only. |

Cast mix in the kit run: LMB 58, Geode 5, Resonant 3, Spire 3, Tomb 5. LMB was ready only 11% of the time, so the bot cast it nearly back to back. Most of the dps comes from LMB.

Note on the moves scenario: Resonant Crystal (0 dmg) and Crystal Tomb (0 dmg) show nothing because of the capture window. The crystal lives 6 s and the tomb shatters after 2.5 s, but the frames stop at 74 (about 1.2 s). Also, the harness aimed both moves close to the player, not on the pack. Their damage only appears in the kit and boss numbers.

---

## LMB: Prism Shard (`crystal.0`, line 1097)

- **[balance]** Damage per cast is 14 + 3x5 splits, and in a pack usually only the main shard and one split connect (moves run: 19 dmg into 6 enemies). On the boss the splits never land, because `hit: [e.id]` excludes the boss they split from. LMB carries the kit, so it is the best place to close the gap.
  Change line 1098: `dmg: 14 * c.dmg -> 17 * c.dmg`. Change line 1101 (split): `dmg: 5 * s.mul -> 6 * s.mul`. That is about +20% on the main lever for both crowd and boss. Impact high, effort S.
- **[visual]** The projectile itself is hard to read. In `m0_PrismShard_003/010.jpg` the casting sigil at the hand dominates and the shard is a small pink speck. The impact (`m0_PrismShard_022.jpg`) is a few faint pink sparks that are lost against the gold floor sigil.
  Change line 1098: `sc: c.mega ? 1.8 : 1 -> sc: c.mega ? 1.8 : 1.25`. Change line 1105 `crack`: `burst(..., 8, 0xffd0f6, 4, .1, .25) -> burst(..., 12, 0xffd0f6, 5, .12, .25)`. Impact med, effort S.
- **[performance]** Peak 282 particles, 11 fx objects, 92.9 ms avg: the cheapest move in the kit. No change needed.

## RMB: Geode Bomb (`crystal.1`, line 1107)

- **[performance]** This is the most expensive move measured: 559 peak particles (next highest is 481), 32 fx objects, 7 shots, 231.5 ms avg frame. The boom fires 14 child shards, each with a trail and `light: 4` from the `crystal.0` look, plus 11 debris pieces and a burst.
  Change line 1112: `for (let i = 0; i < 14; i++) ... TAU * i / 14 -> 10 ... TAU * i / 10`, with `dmg: 12 * s.mul -> 15 * s.mul` to keep the total about the same (168 -> 150). Change line 1122: `debrisFx(..., 9, 'crystal__prism', ...) -> 6`. Impact med, effort S.
- **[visual]** The crack-open reads very well (`m1_GeodeBomb_003/022.jpg`): a big pink geode, then a shard spray. But the 4 s spike field is nearly invisible afterwards. In `m1_GeodeBomb_074.jpg` it shows as a few tiny pink chips on the floor, so players won't know the area is dangerous.
  Change line 1117: `o.scale.setScalar(rand(.35, .6)) -> rand(.55, .85)`. Keep the 12 spikes. Impact med, effort S.
- **[balance]** 134 dmg into the pack, the strongest pack hit in the kit. The spike field at 6 once per enemy is fine. No change.

## Q: Resonant Crystal (`crystal.2`, line 1123)

- **[balance]** On its 12 s cooldown the payout is low: 15 base + 8% of soaked damage, capped at 50. In a 30 s kit with only 3 casts, the base is what reaches most enemies.
  Change line 1129: `15 * n.mul -> 25 * n.mul`. Keep the 8% and the 50 cap so the "soak then shatter" idea stays. Impact med, effort S.
- **[visual]** I could not pick the planted crystal out in any `m2_ResonantCrystal_*` frame. The pack is lit by hit flashes, and the 1.4-scale prism at y 1.4 blends in with the enemies. The pink zone ring is faint (`m2_ResonantCrystal_010.jpg`).
  Change line 1130: `o.scale.setScalar(1.4) -> 1.8` and `zoneCircle('crystal', n.r, .35) -> .5`. In `upd` (line 1131), base scale `1.4 + k * 1.2 -> 1.8 + k * 1.2`. Impact med, effort S.
- **[performance]** 427 particles and 29 fx objects. The 4216 ms worst frame is a single spike, probably from shader compile or parallel load, because the average (206 ms) is in line with the other moves. No change; re-measure if it repeats.

## E: Crystal Spire (`crystal.3`, line 1135)

- **[balance]** It fires 10 dmg every 0.5 s (20 dps for 10 s, 200 per 14 s cooldown) at the nearest enemy. It is the only crystal damage besides LMB that works on the boss.
  Change line 1147: `dmg: 10 * n.mul -> 13 * n.mul`. Impact high (boss), effort S.
- **[visual]** It reads well: a distinct pink spire with a growth pop (`m3_CrystalSpire_074.jpg`). The turret shots are hard to see, though; frames 10 and 45 show only the enemies' orange hit flashes. No change needed. Optional: give the spire shot `sc: 1.2` on line 1147.
- **[feel]** Refraction only triggers within 1.4 m of the spire axis (line 1139), so players have to thread shots almost through the model.
  Change: `> 1.4 -> > 2`. Impact low, effort S.

## R: Crystal Tomb (`crystal.4`, line 1153)

- **[visual]** The tombs themselves look great (pink crystal blocks, `m4_CrystalTomb_074.jpg`). But the cast flash `flash(e.x, 2, e.z, 0xff5ad8, 50, .4)` plus bloom whites out most of the screen when the target is near the player (`m4_CrystalTomb_022.jpg`).
  Change line 1160: `flash(..., 50, .4) -> flash(..., 30, .3)`. Impact med, effort S.
- **[balance]** 180 per encased enemy after 2.5 s is right for an ultimate. On bosses, `encase` is refused (sim.js line 236) but the shatter still hits, which is fine. No change.
- **[performance]** 481 particles at peak; each shatter is `burst(... 60 ...)` per enemy, so 8 encased enemies means 480 particles in one frame.
  Change line 1161: `burst(e.x, e.y, e.z, 60, ...) -> 40`. Impact low, effort S.

## Passive: Prismatic (`onKill`, line 1095)

- **[balance]** Each kill releases 4 shards at 10 dmg, and they can chain-kill (each kill spawns 4 more). That gives a nice crowd snowball, and it is bounded by the number of enemies. No change.
- **[visual]** Kill shards reuse the small LMB child shard (`sc: .6`) and get lost in the crowd (`kit_*.jpg`). The LMB `sc` bump above helps a little. Optional: `sc: .6 -> .8` on line 1095. Impact low, effort S.
- **[feel/doc]** The element blurb (line 1092) still promises "diamond-hard defence", but there is no defensive move left since Diamond Shell was removed. Reword it, for example "...turrets, and crystal tombs." Impact low, effort S.

---

## Top 3

1. **Prism Shard `dmg: 14 -> 17`, split `5 -> 6`** (lines 1098, 1101). This is the main lever for both crowd and boss, which sit at 0.73x and 0.71x of the median.
2. **Crystal Spire turret `dmg: 10 -> 13`** (line 1147) and **Resonant Crystal base `15 -> 25`** (line 1129). Together with #1 these should bring Crystal to about 0.9x crowd and about 0.9x boss.
3. **Geode Bomb: 14 shards -> 10 at 15 dmg, debris 9 -> 6, bigger spikes `rand(.55, .85)`** (lines 1112, 1117, 1122). This cuts the heaviest particle and fx load in the kit (559 particles, 32 fx objects), and the spike field becomes visible.
