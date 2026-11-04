# Earth playtest report

**Verdict:** right in the band on both fights and the kit plays well. The problems are visual: big stone objects spawn right in front of the camera and block the view (Boulder, the first Fissure spike), the Quake dust washes the whole screen beige, and Stone Shot's pebbles can't be seen.
**Crowd dps 226.5 (1.04x median 218.1) · Boss dps 139 (1.01x median 137.1) · worst frame: Boulder 2968.5 ms spike; highest average: Fissure 934.9 ms** (headless SwiftShader with parallel runs, so only the ratios between moves mean anything).

Kit run: 54 kills, 382 HP lost, 0 healed, lowest HP 618. Casts: Stone Shot 41, Boulder 6, Pillar 4, Fissure 3, **Tectonic Quake 6 in 30 s** (ult ready 100%).
Boss run: 209 HP lost, lowest HP 791, Quake 4 casts.

Affected by the known ult refill bug: Tectonic Quake hits up to every enemy in 12 m four times, so it refills itself and was cast 6 times in 30 s. That loop inflates the crowd number. With the bug fixed, Earth will probably drop to about 0.8-0.9x crowd. Re-measure before buffing anything.

---

## LMB: Stone Shot (cd .7, 5 x 10 dmg, spread ±.13)
- **[visual]** The pebbles can't be seen. In `m0_StoneShot_010.jpg` there is only orange sparkle on the pack, and by `_022` just a few dots. The cast sigil on the left hand is the brightest thing on screen, and nothing reads as "stone shotgun". Change (line 561): pebble `r: .22` -> `.3` and `sc: c.mega ? 1.8 : 1` -> `c.mega ? 1.8 : 1.35`. Also make the trail more like dust: `trail: [0xc8a070, .12, .2, 2, 1]` -> `[0x9a8a78, .16, .25, 2, 1]` (line 562). Impact med, effort S.
- **[feel]** Each pellet's `det` fires a full `boomFx(..., 2.5, ..., .6)` plus `dustFx(e.x, e.z, 2.5)`. With 5 pellets that is 5 point-light flashes and 5 smoke clouds per shot, and it ends up looking like glowing sparks, not stones hitting. Change (line 563): replace it with `debrisFx(e.x, e.y, e.z, 2, 'earth__pebble', 0xd9913a, .2, 5); dustFx(e.x, e.z, 1.2)`. This drops the flash (boomFx) for each pellet, gives a crunchier hit and costs less. Impact med, effort S.
- **[balance]** 50 dmg into the pack. 41 casts per 30 s, the main damage source. No change.

## RMB: Boulder (cd 5, 38 dmg pierce + 20 AoE at end)
- **[visual]** The boulder spawns 1.3 m ahead at head height (`o: V(p.x + f.x * 1.3, 1.1, ...)`, r 1.1, sc 1.1), so for the first ~10 frames it fills the middle of the screen (`m1_Boulder_003.jpg`: the pack is completely hidden; `_010`: still covers half the view). Change (line 565): spawn offset `1.3` -> `2.4`. Impact high, effort S.
- **[visual]** The impact reads well (`m1_Boulder_022.jpg`: enemies lit up, boulder visible ploughing through). No change.
- **[performance]** Worst single frame of the kit (2968.5 ms) and 425 peak particles. The `boom` fx stacks boomFx + dustFx + 9 debris pieces at the end. This is probably a one-off spike from parallel runs. If it repeats: debris `9` -> `6`. Impact low, effort S.
- **[balance]** 76 dmg into the pack on a 5 s cd. Fine.

## Q: Stone Pillar (aim, cd 9, 26 dmg, lift 12, solid wall for 6 s)
- **[feel]** **0 dmg** in the showcase. The aim turned the camera right, away from the pack (`m2_StonePillar_010.jpg` to `_045.jpg`: the pack is on the left and no pillar is in view). It looks like the same harness aim problem seen for Blood's Crimson Mire, so it's unverified, not a confirmed bug. In the kit it was cast 4 times. Impact med, effort S (investigate).
- **[feel]** Launch never turns into a slam. `launch(e, 12)` sets vy 12, gravity is 26, so the enemy lands at 12 m/s, under the `v > 13` slam threshold (sim.js:871). There is no landing damage and no 0.5 s landing stun, even though this is Earth's signature launch. Change (line 571): `lift: 12` -> `lift: 15`. That gives a slam of about 4.8 dmg plus a 0.5 s stun, and a higher, more readable launch. Impact med, effort S.
- **[balance]** 26 dmg on a 9 s cd is low, but this is a control and terrain move. Leave the damage as it is; the lift change above adds the slam payoff.

## E: Fissure (cd 10, 12 spikes x 28 dmg, line from 3 m to 16.75 m)
- **[visual]** The first spike rises 3 m in front of you on the crosshair line, and every following spike is directly behind it. From first person the move looks like one tall spike blocking the centre of the view (`m3_Fissure_010.jpg`, `_022.jpg`, `_045.jpg`). The "line ripping across the ground" never shows. Change (line 580): start `3 + i * 1.25` -> `4.5 + i * 1.25`, and in `spike` fx scale the first ones down: `riseFx(..., rand(.9, 1.3), ...)` -> `rand(.7, 1) + Math.min(.4, distTo(e.x, e.z) * .03)`. Also offset each spike sideways by `rand(-.35, .35)` along the perpendicular so the line zig-zags and you can see past it. Impact high, effort S.
- **[performance]** Highest frame average in the kit (934.9 ms) and 141 fx objects. Each of the 12 spikes runs riseFx + dustFx (about 6 smoke puffs + 7 grit) + 2 debris + scarFx + shake. Change (line 584): call `dustFx` only on even spikes (`if (Math.random() < .5) dustFx(...)` or pass an index) and replace `shake(.06)` on every spike with one `shake(.25)` in cast. Impact med, effort S.
- **[balance]** 56 dmg into the pack. The line is 1.6 m wide, so it only clips 2 enemies of a spread pack. The kit cast it every time it was ready (1% ready). Fine for a launch/control move. No change.

## R: Tectonic Quake (ult, 4 quakes x 40 dmg, 12 m, stun 1.2)
- **[balance]** Affected by the ult refill bug: 6 casts per 30 s in the crowd fight. 4 x 40 into everything in 12 m refills the bar almost instantly. No Earth-side change. Once the global fix lands, re-measure; 241 dmg into the pack for 1.25 s is a fair ultimate.
- **[visual]** The quake dust buries the whole view. `dustFx(e.x, e.z, e.r * .6)` = a 7.2 m smoke cloud at the player's feet, 4 times. `m4_TectonicQuake_010.jpg` and `kit_1199.jpg` are beige fog with the pack barely visible behind the bright ring bands. Change (line 590): `dustFx(e.x, e.z, e.r * .6)` -> a ring of small puffs at the edge, e.g. `for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; dustFx(e.x + Math.cos(a) * e.r * .7, e.z + Math.sin(a) * e.r * .7, 1.5); }`. The centre stays clear and the wave reads as rolling outward. Impact high, effort S.
- **[visual]** The ring bands sit right across the lower screen as thick bright stripes (`m4_TectonicQuake_010.jpg`, `kit_1199.jpg`). Change (line 588): inner ring `ringFx(e.x, .2, e.z, e.r * .6, 0xffd08a, .6)` opacity `.6` -> `.35`. Impact med, effort S.
- **[visual]** The spike field afterwards looks good (`m4_TectonicQuake_074.jpg`: rocks and spikes scattered across the arena). No change.

## Passive: Bedrock (15% less damage, poise x2, st vuln .1)
- **[balance]** Works (`dr: .85` sim.js:100, `poise: 2`). The lowest HP stayed at 618 in the crowd run and 791 against the boss, which is comfortable with no healing. No change.
- **[feel]** Poise stagger x2 is invisible to the player unless a stagger event shows. Nothing to change in this pass. Impact low.

## Other
- `boss_1199.jpg`: the Tyrant fills the whole screen in melee range with a bright orange tint, so you can't read anything. This is a harness/positioning issue, not Earth's. Impact low.

---

## Top 3
1. **Fissure:** start the line at 4.5 m, scale the near spikes down and zig-zag them sideways so the line reads and doesn't block the view (line 580/584).
2. **Tectonic Quake:** replace the 7.2 m central dust cloud with puffs around the ring edge, and dim the inner ring to .35 (lines 588-590).
3. **Boulder:** spawn it 2.4 m ahead instead of 1.3 m so it stops filling the screen for the first 10 frames (line 565).
