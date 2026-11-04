# Graph Report - Test Game  (2026-11-04)

## Corpus Check
- 70 files · ~273,598 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 2)

## Summary
- 1327 nodes · 2462 edges · 71 communities (65 shown, 6 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 240 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ecd5e09a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- sim.js
- core.js
- dungeon.js
- view.js
- build_hell
- net.js
- Mesh
- elements.js
- Elements.md
- aim
- Audio credits
- build_elements.py
- areas.js
- modes.js
- renderWorld
- city.js
- run.js
- build_enemies.py
- ringFx
- addShader
- Wind playtest report
- part
- Light playtest report
- clamp
- build_foes.py
- renderLobby
- Elements
- Venom playtest report
- onEvent
- icons.js
- animEnemy
- blocks.js
- css
- MUSIC
- lib.py
- initAudio
- keyName
- lockMouse
- grab
- stepEnemies
- addUlt
- Explosion playtest report
- Steel playtest report
- Sonic playtest report
- Illusion playtest report
- burst
- Crystal playtest report
- Blades playtest report
- stats
- Fire playtest report
- ev
- Bone playtest report
- Plasma playtest report
- Rune playtest report
- Similar moves (reviewed 2026-10-27)
- Frost playtest report
- Mage Arena
- Enemies
- TRS
- Mage Arena
- confine
- build_islands.py
- bake_scale
- gainXP
- Laser playtest report
- push
- Earth playtest report
- stepCast
- Gravity playtest report
- Abyss playtest report
- all.sh

## God Nodes (most connected - your core abstractions)
1. `TRS()` - 69 edges
2. `aim()` - 38 edges
3. `Elements` - 36 edges
4. `ell()` - 31 edges
5. `build_hell()` - 30 edges
6. `Mesh` - 30 edges
7. `crystal()` - 28 edges
8. `build_frost()` - 27 edges
9. `pol()` - 27 edges
10. `build_crypt()` - 26 edges

## Surprising Connections (you probably didn't know these)
- `Top 3` --references--> `ringFx()`  [INFERRED]
  playtest/reports/gravity.md → js/core.js
- `R: Bass Drop` --references--> `ringFx()`  [INFERRED]
  playtest/reports/sonic.md → js/core.js
- `R: Colossal Blade (ult, 130 impact r 6 + 5 x 26 waves, halo to 6)` --references--> `addUlt()`  [INFERRED]
  playtest/reports/blades.md → js/sim.js
- `R: Thunderstorm (ult, cloud follows you for 5 s, a 38-dmg r1.6 sky bolt + 0.25 s stun every 0.24 s)` --references--> `addUlt()`  [INFERRED]
  playtest/reports/storm.md → js/sim.js
- `E: Tornado (lines 619-638)` --references--> `push()`  [INFERRED]
  playtest/reports/wind.md → js/sim.js

## Import Cycles
- None detected.

## Communities (71 total, 6 thin omitted)

### Community 0 - "sim.js"
Cohesion: 0.10
Nodes (20): BOSS_SKY, coneHits(), ELIST, endWave(), ET, flatAim(), HARD, hostStep() (+12 more)

### Community 1 - "core.js"
Cohesion: 0.02
Nodes (69): amb, ARENA_PILLARS, BH, BH_L, BIND, BIND_DEF, _c, camera (+61 more)

### Community 2 - "dungeon.js"
Cohesion: 0.07
Nodes (55): add(), anchor(), ARRIVE, block(), BUCKET, buildDungeonView(), buildFloor(), buildHall() (+47 more)

### Community 3 - "view.js"
Cohesion: 0.05
Nodes (38): BOSS_COL, BOSS_GAIT, buildBar(), CASTS, CC_OV, COMBO_FX, DIFF, ELMETA (+30 more)

### Community 4 - "build_hell"
Cohesion: 0.19
Nodes (16): build_crypt(), branch(), gravestone(), build_frost(), rim(), build_hell(), rim(), build_void() (+8 more)

### Community 5 - "net.js"
Cohesion: 0.10
Nodes (37): applySettings(), autoQuality(), bfSnap(), bgTick(), BIND_NAMES, CHEAT_TOGGLES, cheatSpawn(), dropGuest() (+29 more)

### Community 6 - "Mesh"
Cohesion: 0.12
Nodes (10): spell_circle(), part(), bridge(), bridge_gate(), bridge_pier(), bridge_post(), horn_(), apply_subsurf() (+2 more)

### Community 7 - "elements.js"
Cohesion: 0.07
Nodes (17): aimBeam(), beamFx(), beamMesh(), _bgeo, ctxS(), ELEMENTS, fxe(), inkPool (+9 more)

### Community 9 - "aim"
Cohesion: 0.13
Nodes (25): barm(), boss_body(), boss_sword(), brute_body(), cn_body(), ft_body(), golem(), hg_ring() (+17 more)

### Community 10 - "Audio credits"
Cohesion: 0.33
Nodes (5): Audio credits, Music (`audio/music/`), Sound effects (`audio/sfx/`, file names kept from the packs), pickSample(), SFX

### Community 11 - "build_elements.py"
Cohesion: 0.07
Nodes (22): digit(), finger(), fist(), limb(), open_hand(), palm(), sleeve(), arcpts() (+14 more)

### Community 12 - "areas.js"
Cohesion: 0.08
Nodes (34): addPool(), AREAS, aroundIsle(), bridgeEnds(), bsc(), die(), easeBack(), FOE_ATK (+26 more)

### Community 13 - "modes.js"
Cohesion: 0.27
Nodes (7): applyMap(), DUEL_SPOTS, duelReset(), showScenery(), startDuel(), startMode(), stepDuel()

### Community 14 - "renderWorld"
Cohesion: 0.21
Nodes (12): makeEnt(), makeShot(), makeWizard(), me(), renderAuras(), renderChannels(), renderEnts(), renderPartner() (+4 more)

### Community 15 - "city.js"
Cohesion: 0.05
Nodes (73): arenaMat(), arenaObj(), blockAt(), buildCityView(), buildKit(), cboxGeo(), CBX, CITY (+65 more)

### Community 16 - "run.js"
Cohesion: 0.06
Nodes (29): all, { execFile }, fs, OUT, path, src, browser(), { chromium } (+21 more)

### Community 17 - "build_enemies.py"
Cohesion: 0.22
Nodes (17): arm(), boss_arm(), claws(), dkbody(), ellipsoid(), horn(), kbody(), leg() (+9 more)

### Community 18 - "ringFx"
Cohesion: 0.10
Nodes (26): addFx(), animateArena(), boltFx(), circleFx(), easeOut(), easeOutBack(), glowify(), glowMats() (+18 more)

### Community 19 - "addShader"
Cohesion: 0.33
Nodes (7): addShader(), beamMat(), discMat(), fireMat(), flameMat(), pillarFx(), waveMat()

### Community 20 - "Wind playtest report"
Cohesion: 0.20
Nodes (9): E: Tornado (lines 619-638), Expected landing, LMB: Wind Blades (`js/elements.js` line 602), Passive: Tailwind (`js/sim.js` lines 94 and 582), Q: Updraft (lines 615-618), R: Downburst (lines 639-659), RMB: Gale Force (lines 605-614), Top 3 (+1 more)

### Community 21 - "part"
Cohesion: 0.16
Nodes (11): beast(), legq(), caster(), sbody(), floater(), tent(), keg(), knight() (+3 more)

### Community 22 - "Light playtest report"
Cohesion: 0.20
Nodes (10): flash(), E: Penance, Light playtest report, LMB: Radiant Orbs, Passive: Radiance, Q: Blinding Flash, R: Divine Judgment, RMB: Solar Beam (+2 more)

### Community 23 - "clamp"
Cohesion: 0.50
Nodes (4): clamp(), localInput(), pollPad(), setupTouch()

### Community 24 - "build_foes.py"
Cohesion: 0.13
Nodes (32): ba_arm(), bd_body(), biped(), arm(), leg(), claws(), cn_arm(), cn_head() (+24 more)

### Community 25 - "renderLobby"
Cohesion: 0.23
Nodes (12): bestFor(), PICKABLE(), pickMode(), pvShow(), renderDetail(), renderLobby(), renderModes(), runXP() (+4 more)

### Community 26 - "Elements"
Cohesion: 0.06
Nodes (36): 🐙 Abyss, 🔮 Arcane, Balance, 🗡️ Blades, 🩸 Blood, 💀 Bone, ⏳ Chrono, 🌠 Cosmic (+28 more)

### Community 27 - "Venom playtest report"
Cohesion: 0.18
Nodes (9): Balance overview, E: Contagion, LMB: Venom Spit, Passive: Virulence, Q: Serpent, R: Plague Swarm, RMB: Toxic Cloud, Top 3 (+1 more)

### Community 28 - "onEvent"
Cohesion: 0.24
Nodes (17): arcFx(), bossAnim(), bossArrive(), bossAura(), bossCol(), bossDeath(), bossIntro(), bossTransform() (+9 more)

### Community 29 - "icons.js"
Cohesion: 0.15
Nodes (3): moveIcon(), paintKit, SPELL_ART

### Community 30 - "animEnemy"
Cohesion: 0.83
Nodes (4): animEnemy(), bossGait(), heavyGait(), legLen()

### Community 31 - "blocks.js"
Cohesion: 0.23
Nodes (8): BLOCK, BLOCK_LOOK, guardFrame(), guardMake(), guardParticles(), guardPose(), GV, myGuard()

### Community 32 - "css"
Cohesion: 0.67
Nodes (3): comboText(), css(), tintRig()

### Community 33 - "MUSIC"
Cohesion: 1.00
Nodes (3): MUSIC, playMood(), track()

### Community 34 - "lib.py"
Cohesion: 0.11
Nodes (8): apply_bevel(), bake_ao(), pack_bundle(), Previewer, runes(), uv_ribbon(), Blender Assets, Finishing pass

### Community 38 - "grab"
Cohesion: 0.67
Nodes (3): grab(), sp(), Conventions

### Community 39 - "stepEnemies"
Cohesion: 0.31
Nodes (10): bossCoast(), cc(), ccEnd(), damage(), heavyStep(), spawnEnemy(), statusMods(), stepEnemies() (+2 more)

### Community 40 - "addUlt"
Cohesion: 0.04
Nodes (42): addUlt(), pulse(), Balance (median of 30: crowd 218.1 dps, boss 137.1 dps), Harness caveats, Mage Arena playtest report (all 30 elements), Performance hot list (peak particles in one move; the pool holds 4000), Second theme: effects that blind your own view, The one big bug: ultimates recharge themselves (+34 more)

### Community 41 - "Explosion playtest report"
Cohesion: 0.13
Nodes (19): energyMat(), model(), blastFx(), debrisFx(), fxRoom(), scarFx(), smokeFx(), renderAim() (+11 more)

### Community 42 - "Steel playtest report"
Cohesion: 0.22
Nodes (8): E · Caltrops, LMB · Saw Blade, Passive · Armor Breaker, Q · Magnetize, R · Blade Storm, RMB · Railgun, Steel playtest report, Top 3

### Community 43 - "Sonic playtest report"
Cohesion: 0.18
Nodes (10): boomAt(), RMB: Crush (cd 6, 55 dmg r3.5, stun 1 s, slams airborne), Q: Sigilfall, LMB: Sound Wave, Passive: Resonance, Q: Implosion, R: Bass Drop, RMB: Sonic Boom (+2 more)

### Community 44 - "Illusion playtest report"
Cohesion: 0.22
Nodes (8): E: Kaleidoscope (cd 7), Illusion playtest report, LMB: Phantom Moths (cd .45), Passive: Misdirection (`st: { weak: .2 }`, sim.js:435 1-in-3 miss), Q: Mesmerize (cd 10), R: Phantasmagoria (ultimate), RMB: Decoy (cd 8), Top 3

### Community 45 - "burst"
Cohesion: 0.05
Nodes (35): burst(), swap(), Arcane playtest report, E: Polymorph (dmg 15, 94 ms avg, 681 particles = highest non-ult peak, 15 fx), LMB: Arcane Missiles (dmg 20 into pack, 242 ms avg, 285 particles, 8 fx), Passive: Arcane Charges (+8% per charge, up to 4) and Spellbound (+10% damage taken), R: Arcane Torrent (dmg 67 in window, 95 ms avg, 588 particles, 25 fx). **Affected by the ult loop**, RMB: Arcane Barrage (dmg 25 with 0 charges, 387 ms avg = the kit's highest, 418 particles, 14 fx) (+27 more)

### Community 46 - "Crystal playtest report"
Cohesion: 0.22
Nodes (8): Crystal playtest report, E: Crystal Spire (`crystal.3`, line 1135), LMB: Prism Shard (`crystal.0`, line 1097), Passive: Prismatic (`onKill`, line 1095), Q: Resonant Crystal (`crystal.2`, line 1123), R: Crystal Tomb (`crystal.4`, line 1153), RMB: Geode Bomb (`crystal.1`, line 1107), Top 3

### Community 47 - "Blades playtest report"
Cohesion: 0.20
Nodes (9): zoneCircle(), Blades playtest report, E: Rain of Blades (cd 11, 12 x 20 in r 1.8 stabs, 6 s field, 30% slow, pick-up), LMB: Flying Daggers (cd .35, 2 x 7.5, home 2), Passive: Sword Halo (+1 sword / 2.5 s, max 6; guard 18 dmg to anything within 3 m every .35 s, costs a sword), Q: Blade Dance (cd 8, 9 m dash, 32 dmg in a 1.8 m lane, +2 swords), R: Colossal Blade (ult, 130 impact r 6 + 5 x 26 waves, halo to 6), RMB: Sword Volley (cd 2.5, max(2, swords) x 24, pierce 3) (+1 more)

### Community 48 - "stats"
Cohesion: 0.38
Nodes (7): bondMul(), elementPower(), mate(), players(), shoot(), stats(), stepRevive()

### Community 49 - "Fire playtest report"
Cohesion: 0.18
Nodes (11): fireBoom(), flameColor(), spread(), Balance summary, E: Ring of Fire (dmg 95, 476 ms avg = fire's slowest, 577 particles, 41 fx, 1 ent), Fire playtest report, LMB: Fireball (dmg 26 into pack, 170 ms avg, 339 particles, 27 fx), Passive: Kindling (death blast 20 x dmgMul, r 2.6) (+3 more)

### Community 50 - "ev"
Cohesion: 0.15
Nodes (25): r2(), chainBolt(), alive(), applyStatus(), blast(), center(), endShot(), enemiesNear() (+17 more)

### Community 51 - "Bone playtest report"
Cohesion: 0.05
Nodes (33): emit(), Blood playtest report, E: Crimson Mire (cd 9, 4 s pool, 10 dmg per .5 s, pull 22), LMB: Blood Bolt (cd .4, 21 dmg), Passive: Bloodlust (2.5% steal, bleed leech .1, up to +50% dmg at low HP), Q: Exsanguinate (cd 8), R: Blood Moon (ult, 4 s, 7 dmg per .25 s to 12 enemies, death pop 30 AoE), RMB: Crimson Fan (cd 3.5, 5 x 16, pierce 99) (+25 more)

### Community 53 - "Plasma playtest report"
Cohesion: 0.18
Nodes (10): boomFx(), handPos(), E: Thermal Lance (cd 6, 40 pierce in a 12 m line, burn line 6 / .4 s above 50 Heat), LMB: Plasma Bolt (cd .28, 11 + 4 splash, heat 9), Passive: Heat (+0.5% dmg per Heat, overheat at 100 = 25 dmg vent + 2.5 s lock, cools 15/s), Plasma playtest report, Q: Vent (cd 7, 20 + .9 x Heat, r 4 + Heat/30), R: Fusion Beam (ult, 4 s, 15 per .1 s per enemy on a 40 m ray) (+2 more)

### Community 55 - "Rune playtest report"
Cohesion: 0.18
Nodes (12): dropFade(), tripped(), wardMake(), wardUpd(), wardView(), E: Binding Circle, LMB: Rune Bolt, Passive: Rune Mastery (+4 more)

### Community 56 - "Similar moves (reviewed 2026-10-27)"
Cohesion: 0.25
Nodes (6): Alike within one element, Similar moves (reviewed 2026-10-27), Similar (same role, different twist), Very similar (near-duplicates), Done (2026-10-27), To-do (noted 2026-10-26)

### Community 57 - "Frost playtest report"
Cohesion: 0.25
Nodes (7): E: Frost Nova, Frost playtest report, LMB: Ice Shard, Passive: Permafrost (4 hits -> freeze 1.8 s, frozen take +40%), Performance (measured), R: Blizzard (ultimate), Top 3

### Community 58 - "Mage Arena"
Cohesion: 0.33
Nodes (6): Controls, Core loop (Arena), Mage Arena, Progression, Why it's replayable, Why it's satisfying

### Community 59 - "Enemies"
Cohesion: 0.50
Nodes (4): Enemies, Fighting them, Wave budget, Wave modifiers

### Community 60 - "TRS"
Cohesion: 0.14
Nodes (16): ba_body(), bwing(), bz_arm(), cn_leg(), eyeball(), gz_body(), ho_arm(), ig_leg() (+8 more)

### Community 61 - "Mage Arena"
Cohesion: 0.33
Nodes (5): Don't lag the PC (this has happened twice), Knowledge, Mage Arena, Never lose data, Spell icons

### Community 62 - "confine"
Cohesion: 0.16
Nodes (13): capNear(), clampArena(), collide(), confine(), inRects(), laserPath(), offMap(), startAttack() (+5 more)

### Community 63 - "build_islands.py"
Cohesion: 0.14
Nodes (8): center(), chain(), hex_tiles(), lane_angle(), radial_tiles(), rot2(), basis(), coll()

### Community 65 - "gainXP"
Cohesion: 0.47
Nodes (6): gainXP(), needXP(), renderProg(), renderTalents(), saveProg(), xpBar()

### Community 66 - "Laser playtest report"
Cohesion: 0.24
Nodes (9): laserShot(), novaBeams(), E: Laser Drone (lines 2050-2063), Laser playtest report, Passive: Ricochet and Focus (laserShot, lines 35-61), Q: Refractor (lines 2042-2049), R: Prism Nova (lines 2064-2089, novaBeams line 63), RMB: Ricochet Beam (line 2040) (+1 more)

### Community 68 - "push"
Cohesion: 0.19
Nodes (16): aoe(), bomberBlast(), bossMeteors(), dropOrb(), enemyHits(), ent(), foeOrb(), inCone() (+8 more)

### Community 69 - "Earth playtest report"
Cohesion: 0.15
Nodes (12): dustFx(), Passive: Raise Dead (25% raise, Brittle +12%), E: Fissure (cd 10, 12 spikes x 28 dmg, line from 3 m to 16.75 m), Earth playtest report, LMB: Stone Shot (cd .7, 5 x 10 dmg, spread ±.13), Other, Passive: Bedrock (15% less damage, poise x2, st vuln .1), Q: Stone Pillar (aim, cd 9, 26 dmg, lift 12, solid wall for 6 s) (+4 more)

### Community 70 - "stepCast"
Cohesion: 0.30
Nodes (12): aimOf(), canCast(), castAim(), castEv(), cdOf(), ctxOf(), eyeOf(), fire() (+4 more)

### Community 73 - "Gravity playtest report"
Cohesion: 0.20
Nodes (9): inkDecal(), modelFx(), Gravity playtest report, LMB: Graviton (cd .55, 22 dmg implosion r2, pulls in 3.5 m), Passive: Crushing Weight (x2 dmg vs `e.y > .4`; slams +50% fall dmg), Q: Levitate (cd 9, 22 dmg r4.5, lift 2.2 s, +25% dmg taken), R: Singularity (life 4.5 s, pull r15, grind 4-14 per .25 s within 3.2 m, 100 dmg collapse r6), Top 3 (+1 more)

### Community 75 - "Abyss playtest report"
Cohesion: 0.20
Nodes (9): Abyss playtest report, Balance overview, E: Tentacle Ring, Icons, LMB: Void Bolt, Passive: Lurker Below, R: Kraken, RMB: Grasp of the Deep (+1 more)

## Knowledge Gaps
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Blender Assets` connect `lib.py` to `grab`, `Mesh`, `Elements.md`, `Explosion playtest report`, `build_elements.py`?**
  _High betweenness centrality (0.273) - this node is a cross-community bridge._
- **Are the 14 inferred relationships involving `build_hell()` (e.g. with `rim()` and `cage()`) actually correct?**
  _`build_hell()` has 14 INFERRED edges - model-reasoned connections that need verification._
- **Should `sim.js` be split into smaller, more focused modules?**
  _Cohesion score 0.09971509971509972 - nodes in this community are weakly interconnected._
- **Why does `In-game look` connect `Explosion playtest report` to `lib.py`, `Earth playtest report`?**
  _High betweenness centrality (0.194) - this node is a cross-community bridge._
- **Should `core.js` be split into smaller, more focused modules?**
  _Cohesion score 0.023529411764705882 - nodes in this community are weakly interconnected._
- **Why does `Mesh` connect `Mesh` to `lib.py`, `build_hell`, `build_elements.py`, `part`, `Venom playtest report`, `build_islands.py`?**
  _High betweenness centrality (0.172) - this node is a cross-community bridge._
- **Should `dungeon.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07486338797814207 - nodes in this community are weakly interconnected._