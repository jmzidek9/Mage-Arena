# Steel playtest report

**Verdict:** the damage is spot on: it is the median element, so leave the numbers alone. The fixes needed are about visibility and camera: the Railgun beam is hard to see, Magnetize drags monsters into your face, and the Blade Storm swords read as planks.
Crowd dps **225.1** (1.00x median 225.1) · Boss dps **134.3** (1.00x median 134.3) · median from 19 elements · worst frame **1186 ms** (Blade Storm; headless Edge with 30 runs in parallel, so compare moves only with each other).

Source: `playtest/out/steel/metrics.json` and screenshots, run of 2026-11-03. Kit: 49 kills, 280 HP lost, 0 healed. Casts per 30 s: Saw 42, Rail 6, Magnetize 4, Caltrops 3. Cooldowns ready: Saw 17%, Rail 20%, Q/E 1% (all used fully).

## LMB · Saw Blade
- **[balance]** It did 29 dmg into the 6-monster pack, which is only 2 hits. The saw turns back at `ret: .42` × speed 30 = 12.6 m, so the pack (~12-14 m away) is mostly out of reach. The m0_*_045 shot shows the saw turning around right at the front of the pack. **Change:** `ret: .42 -> .5` (about 15 m of reach). Leave `dmg: 14`, since kit dps is already at the median. Impact med, effort S.
- **[visual]** In m0_SawBlade_045 the saw at range shows as a flat, wide, glowing hoop lying on its side. It reads as a ring or portal, not a saw. **Change:** tilt the saw about 20° toward the camera so its teeth show: `look: { ..., spin: [0, 24, 0] }` plus a fixed tilt (add `rot: [.35, 0, 0]` if `look` supports it, otherwise set `o.rotation.x = .35` in the model). Also make it brighter: `trail: [0xdfe8ff, .1, .2, 0, 1] -> [0xdfe8ff, .14, .28, 0, 1]`. Impact med, effort S.
- **[visual]** In frames 003 and 010 the cast circle at the hand covers about a quarter of the screen and hides the saw as it leaves. This is shared hand FX, so it is only noted here.

## RMB · Railgun
- **[visual]** The beam is almost invisible in first person. m1_Railgun_003, _010 and _022 show glowing monsters but no line, because the beam runs straight away from the eye and gets foreshortened. Only the hit flash tells you it fired. **Change** (`rail` fx): give the beam more width and time, `beamFx(a, b, 0x9ab8ff, .2 + .3 * e.ck, .45) -> (.3 + .4 * e.ck, .6)`. Add a muzzle flash, `flash(a.x, a.y, a.z, 0xdfe8ff, 20, .12)`. Make it shake harder, `shake(.08 + .2 * e.ck) -> shake(.12 + .25 * e.ck)`. Impact high, effort S.
- **[feel]** The recoil `self()` pushes the player by `16 * c.k`. In m1_Railgun_074 the full-charge shot shoved the camera right into a brazier, and the screen is all flame. **Change:** `16 * c.k -> 10 * c.k`. Impact med, effort S.
- **[balance]** 120 dmg into the pack is fine. Leave `30 + 90 * c.k` as it is.

## Q · Magnetize
- **[visual/feel]** Monsters are pulled to `p + c.flat * 2.5`. Big monsters (golem) then fill the whole view: m2_Magnetize_045 and _074 show only golem. They also stayed inside the camera for the next capture (m3_Caltrops_003, _022 and _045 are solid orange or white blobs). **Change:** pull to a distance that scales with size, `c.flat.x * 2.5 -> c.flat.x * (3 + ET[e.type].r * 1.5)` (and the same for z). Impact high, effort S.
- **[performance]** Particle peak is 580, the highest of the five moves (Saw 288, Rail 409), from `for (let i = 0; i < 10; i++) emit(...)` per monster pulled. **Change:** `i < 10 -> i < 6`. Impact low, effort S.
- **[visual]** The magnet model (`modelFx('steel__magnet' ...)`, scale `.35` in first person) is half hidden behind the hand's cast circle in m2_*_003 and _010. **Change:** `isMe(e.id) ? .35 : .8 -> isMe(e.id) ? .5 : .8`. Impact low, effort S.

## E · Caltrops
- **[visual]** The caltrops never show up in any capture. Frames 003 to 045 are blocked by the leftover Magnetize monsters, and in 074 they are hidden behind monsters, about 6 m away. Even with a clear view, a 1.3x grey model on a grey floor will be hard to spot. **Change:** in `view.make`, `o.scale.setScalar(1.3) -> 1.6`. Add a scatter puff on landing, in `upd`: when `n.t` first passes .6, call `burst(n.x, .2, n.z, 4, 0xdfe8ff, 2, .1, .2)`. Impact med, effort S.
- **[performance]** It has the highest average frame cost of the kit: 275 ms (worst 911), 25 fx objects and 12 ents. The camera sitting inside a monster probably inflates this, so re-measure once the Magnetize fix is in before changing anything here. Impact low.
- **[balance]** 151 dmg and 2 kills into the pack is good. Leave `18 * n.mul`.

## R · Blade Storm
- **[visual]** The swords sit at `n.y + 1.1` (eye height), lie flat and are seen edge-on. In m4_BladeStorm_045 and _074 they show as thin orange slabs on the horizon, not swords, and they don't look silver at all. **Change:** lower them to `o.position.y = n.y + .6` and tip each blade toward the player with `s.rotation.set(Math.PI / 2, 0, -Math.PI / 2) -> (Math.PI / 2 - .5, 0, -Math.PI / 2)` so the flat side shows. Add a white edge-trail emit per sword every frame instead of the single 50% random emit. Impact high, effort M.
- **[performance]** Worst frame is 1186 ms, the highest of the kit, with a 36 fx-object peak (10 sword models). Particles (573) are fine. If the trail change goes in, keep the per-sword emit at `Math.random() < .3` so particles stay under about 600. Impact low.
- **[balance]** 199 dmg into the pack over 5 s, 3rd of 19 ultimates (Explosion 454, Water 328). Keep `20 * n.mul` and the `.35` re-hit.

## Passive · Armor Breaker
- **[balance]** Rend stacks to 3 × `vuln: .06` = +18%, and at 3 stacks shield blocking is ignored (`sim.js:317`). The full-charge Railgun adds 2 stacks, so the design holds. Crowd and boss are both exactly at the median, so no change.
- **[visual]** There is no on-screen sign that a monster has hit 3 stacks (shields now ignored), and players can't tell when the passive is active. **Change:** when the stack count reaches 3, call `popNum(..., 'RENT', '#dfe8ff', 'tag')` once per monster, the same way Heat Wave shows MELT. Impact med, effort S.

## Top 3
1. **Magnetize pull distance** `2.5 -> 3 + ET[e.type].r * 1.5`: stops big monsters landing inside the camera and blinding you (m2_*_045/074, m3_*_003-045).
2. **Railgun readability:** outer beam `.2 + .3k / .45 s -> .3 + .4k / .6 s` plus a muzzle flash, and recoil `16k -> 10k` (beam invisible in m1_*_003-022, camera in a brazier in m1_*_074).
3. **Blade Storm swords:** lower to `n.y + .6` and tilt `-.5` rad so they read as silver blades instead of orange planks (m4_*_045/074).
