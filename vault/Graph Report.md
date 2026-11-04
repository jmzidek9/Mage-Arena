# Graph Report - Test Game  (2026-11-04)

## Corpus Check
- 70 files · ~288,019 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 2)

## Summary
- 1358 nodes · 2510 edges · 75 communities (74 shown, 1 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 247 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1459acb4`
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
- Venom playtest report
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
- boomAt
- aim
- clamp
- build_foes.py
- renderLobby
- Elements
- Checklist: adding or changing a move or an element
- onEvent
- icons.js
- animEnemy
- blocks.js
- css
- MUSIC
- lib.py
- stepEnemies
- react
- build_assets.py
- grab
- dustFx
- Magma playtest report
- Explosion playtest report
- Steel playtest report
- Sonic playtest report
- Illusion playtest report
- Shadow playtest report
- Crystal playtest report
- Blades playtest report
- Cosmic playtest report
- Fire playtest report
- damage
- Nature playtest report
- Ink playtest report
- Plasma playtest report
- Soul playtest report
- Rune playtest report
- part
- Frost playtest report
- burst
- build_islands.py
- TRS
- hostStep
- Bone playtest report
- confine
- Arcane playtest report
- gainXP
- Laser playtest report
- Mage Arena playtest report (all 30 elements)
- Blood playtest report
- Earth playtest report
- Water playtest report
- puffTex
- Storm playtest report
- all.sh
- Chrono playtest report

## God Nodes (most connected - your core abstractions)
1. `TRS()` - 69 edges
2. `aim()` - 38 edges
3. `Elements` - 37 edges
4. `ell()` - 31 edges
5. `build_hell()` - 30 edges
6. `Mesh` - 30 edges
7. `crystal()` - 28 edges
8. `build_frost()` - 27 edges
9. `pol()` - 27 edges
10. `build_crypt()` - 26 edges

## Surprising Connections (you probably didn't know these)
- `Finishing pass` --references--> `bake_ao()`  [INFERRED]
  vault/Blender Assets.md → blender/lib.py
- `Q: Arcane Familiar (dmg 22 in window, 257 ms avg, **5634 ms worst**, 467 particles, 1 ent)` --references--> `ringFx()`  [INFERRED]
  playtest/reports/arcane.md → js/core.js
- `R: Bass Drop` --references--> `ringFx()`  [INFERRED]
  playtest/reports/sonic.md → js/core.js
- `RMB: Ball Lightning (cd 6, orb 6 dmg pierce, zaps 2 targets x5 every 0.25 s, burst 20)` --references--> `boltFx()`  [INFERRED]
  playtest/reports/storm.md → js/core.js
- `Q: Rewind (cd 6, 8 mark dmg, snap 35 + 14/m up to +200, +150 vs boss)` --references--> `burst()`  [INFERRED]
  playtest/reports/chrono.md → js/core.js

## Import Cycles
- None detected.

## Communities (75 total, 1 thin omitted)

### Community 0 - "sim.js"
Cohesion: 0.10
Nodes (25): aimOf(), BOSS_SKY, castAim(), coneHits(), ctxOf(), ELIST, endWave(), ET (+17 more)

### Community 1 - "core.js"
Cohesion: 0.02
Nodes (75): amb, ARENA_PILLARS, BH, BH_L, BIND, BIND_DEF, _c, camera (+67 more)

### Community 2 - "dungeon.js"
Cohesion: 0.07
Nodes (55): add(), anchor(), ARRIVE, block(), BUCKET, buildDungeonView(), buildFloor(), buildHall() (+47 more)

### Community 3 - "view.js"
Cohesion: 0.05
Nodes (38): BOSS_COL, BOSS_GAIT, buildBar(), CASTS, CC_OV, COMBO_FX, DIFF, ELMETA (+30 more)

### Community 4 - "build_hell"
Cohesion: 0.18
Nodes (17): blob_cloud(), build_crypt(), branch(), gravestone(), build_frost(), rim(), build_hell(), rim() (+9 more)

### Community 5 - "net.js"
Cohesion: 0.10
Nodes (37): applySettings(), autoQuality(), bfSnap(), bgTick(), BIND_NAMES, CHEAT_TOGGLES, cheatSpawn(), dropGuest() (+29 more)

### Community 6 - "Mesh"
Cohesion: 0.13
Nodes (8): spell_circle(), bridge(), bridge_gate(), bridge_pier(), bridge_post(), horn_(), area(), Mesh

### Community 7 - "elements.js"
Cohesion: 0.04
Nodes (21): _bgeo, chainBolt(), ELEMENTS, entangleRing(), FALL_GEO, HYDRA, hydraMat(), inkPool (+13 more)

### Community 8 - "Elements.md"
Cohesion: 0.07
Nodes (23): Blender Assets, Finishing pass, Enemies, Fighting them, Wave budget, Wave modifiers, Cross-platform, Known ceilings (`ponytail:` comments in the code) (+15 more)

### Community 9 - "Venom playtest report"
Cohesion: 0.18
Nodes (9): Balance overview, E: Contagion, LMB: Venom Spit, Passive: Virulence, Q: Serpent, R: Plague Swarm, RMB: Toxic Cloud, Top 3 (+1 more)

### Community 10 - "Audio credits"
Cohesion: 0.33
Nodes (5): Audio credits, Music (`audio/music/`), Sound effects (`audio/sfx/`, file names kept from the packs), pickSample(), SFX

### Community 11 - "build_elements.py"
Cohesion: 0.14
Nodes (15): arcpts(), crescent(), crescent_blade(), lens(), M(), mirror_shard(), plated_rock(), put() (+7 more)

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
Cohesion: 0.24
Nodes (16): arm(), boss_arm(), claws(), dkbody(), ellipsoid(), horn(), kbody(), leg() (+8 more)

### Community 18 - "ringFx"
Cohesion: 0.14
Nodes (19): addFx(), boltFx(), circleFx(), glowify(), glowMats(), makeCircle(), meshFx(), nearFade() (+11 more)

### Community 19 - "addShader"
Cohesion: 0.29
Nodes (8): addShader(), beamMat(), discMat(), easeOut(), fireMat(), flameMat(), pillarFx(), waveMat()

### Community 20 - "Wind playtest report"
Cohesion: 0.20
Nodes (9): E: Tornado (lines 619-638), Expected landing, LMB: Wind Blades (`js/elements.js` line 602), Passive: Tailwind (`js/sim.js` lines 94 and 582), Q: Updraft (lines 615-618), R: Downburst (lines 639-659), RMB: Gale Force (lines 605-614), Top 3 (+1 more)

### Community 21 - "boomAt"
Cohesion: 0.25
Nodes (8): boomAt(), ctxS(), fxe(), inkSplash(), summonAI(), RMB: Crush (cd 6, 55 dmg r3.5, stun 1 s, slams airborne), Q: Sigilfall, Q: Implosion

### Community 22 - "aim"
Cohesion: 0.13
Nodes (25): barm(), boss_body(), boss_sword(), brute_body(), cn_body(), ft_body(), golem(), hg_ring() (+17 more)

### Community 23 - "clamp"
Cohesion: 0.50
Nodes (4): clamp(), localInput(), pollPad(), setupTouch()

### Community 24 - "build_foes.py"
Cohesion: 0.11
Nodes (34): ba_arm(), bake_scale(), bd_body(), beast(), legq(), biped(), arm(), leg() (+26 more)

### Community 25 - "renderLobby"
Cohesion: 0.23
Nodes (12): bestFor(), PICKABLE(), pickMode(), pvShow(), renderDetail(), renderLobby(), renderModes(), runXP() (+4 more)

### Community 26 - "Elements"
Cohesion: 0.06
Nodes (36): 🐙 Abyss, 🔮 Arcane, Balance, 🗡️ Blades, Blocks, 🩸 Blood, 💀 Bone, ⏳ Chrono (+28 more)

### Community 27 - "Checklist: adding or changing a move or an element"
Cohesion: 0.25
Nodes (7): Checklist: adding or changing a move or an element, Don't lag the PC (this has happened twice), Knowledge, Mage Arena, Never lose data, Spell icons, ent()

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
Cohesion: 0.10
Nodes (6): apply_bevel(), apply_subsurf(), bake_ao(), pack_bundle(), Previewer, uv_ribbon()

### Community 35 - "stepEnemies"
Cohesion: 0.19
Nodes (25): bomberBlast(), bondMul(), bossCoast(), bossMeteors(), dropOrb(), enemyHits(), ev(), foeOrb() (+17 more)

### Community 36 - "react"
Cohesion: 0.17
Nodes (19): r2(), alive(), aoe(), blast(), center(), endShot(), enemiesNear(), launch() (+11 more)

### Community 37 - "build_assets.py"
Cohesion: 0.15
Nodes (9): digit(), finger(), fist(), limb(), open_hand(), palm(), sleeve(), chain() (+1 more)

### Community 38 - "grab"
Cohesion: 0.67
Nodes (3): grab(), sp(), Conventions

### Community 39 - "dustFx"
Cohesion: 0.11
Nodes (25): energyMat(), model(), bigBoltFx(), blastFx(), debrisFx(), dustFx(), fxRoom(), inkDecal() (+17 more)

### Community 40 - "Magma playtest report"
Cohesion: 0.20
Nodes (9): pulse(), E: Volcano (cd 15, 10 s, bomb 22 r 2.2 every 0.9 s, range 16), LMB: Magma Glob (cd 0.7, 14 dmg splash r 2.2, pool 4 / 0.5 s, cools to rock), Magma playtest report, Passive: Molten Core (dot 6, +10% damage taken; attackers turn molten), Q: Heat Wave (cd 10, 9 m wall, 6 per 0.15 s, melt 70 after 5 scorches), R: Meteor (ult, 135 raw r 7.5, kb 10 lift 9, then a 5 s field of 8 / 0.5 s at r 6), RMB: Eruption (cd 5, 50 raw r 3, lift 13, 3 s pool) (+1 more)

### Community 41 - "Explosion playtest report"
Cohesion: 0.22
Nodes (8): E: Proximity Mines, Explosion playtest report, Passive: Demolitions, Q: Rocket Jump, R: Carpet Bomb, RMB: Sticky Bomb, Root balance issue: Carpet Bomb recharges itself, Top 3

### Community 42 - "Steel playtest report"
Cohesion: 0.22
Nodes (8): E · Caltrops, LMB · Saw Blade, Passive · Armor Breaker, Q · Magnetize, R · Blade Storm, RMB · Railgun, Steel playtest report, Top 3

### Community 43 - "Sonic playtest report"
Cohesion: 0.17
Nodes (11): beamFx(), beamMesh(), laserFx(), LMB: Pulse Laser (line 2037), E: Harmonic Link, LMB: Sound Wave, Passive: Resonance, R: Bass Drop (+3 more)

### Community 44 - "Illusion playtest report"
Cohesion: 0.22
Nodes (8): E: Kaleidoscope (cd 7), Illusion playtest report, LMB: Phantom Moths (cd .45), Passive: Misdirection (`st: { weak: .2 }`, sim.js:435 1-in-3 miss), Q: Mesmerize (cd 10), R: Phantasmagoria (ultimate), RMB: Decoy (cd 8), Top 3

### Community 45 - "Shadow playtest report"
Cohesion: 0.11
Nodes (18): flash(), aimBeam(), swap(), E: Penance, Light playtest report, LMB: Radiant Orbs, Passive: Radiance, Q: Blinding Flash (+10 more)

### Community 46 - "Crystal playtest report"
Cohesion: 0.22
Nodes (8): Crystal playtest report, E: Crystal Spire (`crystal.3`, line 1135), LMB: Prism Shard (`crystal.0`, line 1097), Passive: Prismatic (`onKill`, line 1095), Q: Resonant Crystal (`crystal.2`, line 1123), R: Crystal Tomb (`crystal.4`, line 1153), RMB: Geode Bomb (`crystal.1`, line 1107), Top 3

### Community 47 - "Blades playtest report"
Cohesion: 0.12
Nodes (14): Blades playtest report, LMB: Flying Daggers (cd .35, 2 x 7.5, home 2), Passive: Sword Halo (+1 sword / 2.5 s, max 6; guard 18 dmg to anything within 3 m every .35 s, costs a sword), Q: Blade Dance (cd 8, 9 m dash, 32 dmg in a 1.8 m lane, +2 swords), R: Colossal Blade (ult, 130 impact r 6 + 5 x 26 waves, halo to 6), RMB: Sword Volley (cd 2.5, max(2, swords) x 24, pierce 3), Top 3, LMB: Soul Wisps (+6 more)

### Community 48 - "Cosmic playtest report"
Cohesion: 0.20
Nodes (9): Balance root cause: Supernova recharges itself, Cosmic playtest report, E: Meteor Shower, LMB: Star Shot, Passive: Stellar Rhythm / Starstruck, Q: Constellation, R: Supernova, RMB: Orbiting Moons (+1 more)

### Community 49 - "Fire playtest report"
Cohesion: 0.18
Nodes (11): fireBoom(), flameColor(), spread(), Balance summary, E: Ring of Fire (dmg 95, 476 ms avg = fire's slowest, 577 particles, 41 fx, 1 ent), Fire playtest report, LMB: Fireball (dmg 26 into pack, 170 ms avg, 339 particles, 27 fx), Passive: Kindling (death blast 20 x dmgMul, r 2.6) (+3 more)

### Community 50 - "damage"
Cohesion: 0.13
Nodes (22): addUlt(), applyStatus(), cc(), ccEnd(), damage(), elementPower(), hitEnemy(), hurt() (+14 more)

### Community 51 - "Nature playtest report"
Cohesion: 0.22
Nodes (8): E: Snaptrap, LMB: Thorn Volley, Nature playtest report, Q: Parasite Seed, R: World Tree, RMB: Entangle, Shared (not nature-specific), Top 3

### Community 52 - "Ink playtest report"
Cohesion: 0.22
Nodes (8): E: Ink Pool, Ink playtest report, LMB: Ink Bolt, Passive: Bleeding Ink (kill splash 15 in 3 m, inked -25% speed), Performance (measured), Q: Ink Koi, R: Ink Dragon (ultimate), Top 3

### Community 53 - "Plasma playtest report"
Cohesion: 0.18
Nodes (10): boomFx(), handPos(), E: Thermal Lance (cd 6, 40 pierce in a 12 m line, burn line 6 / .4 s above 50 Heat), LMB: Plasma Bolt (cd .28, 11 + 4 splash, heat 9), Passive: Heat (+0.5% dmg per Heat, overheat at 100 = 25 dmg vent + 2.5 s lock, cools 15/s), Plasma playtest report, Q: Vent (cd 7, 20 + .9 x Heat, r 4 + Heat/30), R: Fusion Beam (ult, 4 s, 15 per .1 s per enemy on a 40 m ray) (+2 more)

### Community 54 - "Soul playtest report"
Cohesion: 0.25
Nodes (7): E: Soulstorm (lines 1900-1909), LMB: Soulfire (`js/elements.js` line 1866), Passive: Soulbound (`js/sim.js` lines 106, 410, 424), Q: Soul Rend (lines 1892-1899), RMB: Reap (lines 1874-1891), Soul playtest report, Top 3

### Community 55 - "Rune playtest report"
Cohesion: 0.18
Nodes (12): dropFade(), tripped(), wardMake(), wardUpd(), wardView(), E: Binding Circle, LMB: Rune Bolt, Passive: Rune Mastery (+4 more)

### Community 56 - "part"
Cohesion: 0.19
Nodes (9): caster(), sbody(), floater(), tent(), keg(), knight(), kbody(), part() (+1 more)

### Community 57 - "Frost playtest report"
Cohesion: 0.25
Nodes (7): E: Frost Nova, Frost playtest report, LMB: Ice Shard, Passive: Permafrost (4 hits -> freeze 1.8 s, frozen take +40%), Performance (measured), R: Blizzard (ultimate), Top 3

### Community 58 - "burst"
Cohesion: 0.17
Nodes (13): animateArena(), burst(), emit(), popNum(), rand(), V(), RMB: Arcane Barrage (dmg 25 with 0 charges, 387 ms avg = the kit's highest, 418 particles, 14 fx), E: Crimson Mire (cd 9, 4 s pool, 10 dmg per .5 s, pull 22) (+5 more)

### Community 59 - "build_islands.py"
Cohesion: 0.20
Nodes (6): center(), hex_tiles(), lane_angle(), radial_tiles(), rot2(), coll()

### Community 60 - "TRS"
Cohesion: 0.12
Nodes (20): sbody(), tent(), ba_body(), bwing(), bz_arm(), cn_leg(), eyeball(), gz_body() (+12 more)

### Community 61 - "hostStep"
Cohesion: 0.25
Nodes (11): canCast(), castEv(), cdOf(), fire(), hostStep(), idleInput(), kitOf(), stepCast() (+3 more)

### Community 62 - "Bone playtest report"
Cohesion: 0.22
Nodes (8): easeOutBack(), Bone playtest report, E: Bone Cage, LMB: Bone Toss, Performance (measured), Q: Marrow Burst, RMB: Cackling Skull, Top 3

### Community 63 - "confine"
Cohesion: 0.29
Nodes (8): capNear(), clampArena(), collide(), confine(), inRects(), laserPath(), offMap(), startAttack()

### Community 64 - "Arcane playtest report"
Cohesion: 0.25
Nodes (7): Arcane playtest report, E: Polymorph (dmg 15, 94 ms avg, 681 particles = highest non-ult peak, 15 fx), LMB: Arcane Missiles (dmg 20 into pack, 242 ms avg, 285 particles, 8 fx), Passive: Arcane Charges (+8% per charge, up to 4) and Spellbound (+10% damage taken), Q: Arcane Familiar (dmg 22 in window, 257 ms avg, **5634 ms worst**, 467 particles, 1 ent), R: Arcane Torrent (dmg 67 in window, 95 ms avg, 588 particles, 25 fx). **Affected by the ult loop**, Top 3

### Community 65 - "gainXP"
Cohesion: 0.47
Nodes (6): gainXP(), needXP(), renderProg(), renderTalents(), saveProg(), xpBar()

### Community 66 - "Laser playtest report"
Cohesion: 0.24
Nodes (9): laserShot(), novaBeams(), E: Laser Drone (lines 2050-2063), Laser playtest report, Passive: Ricochet and Focus (laserShot, lines 35-61), Q: Refractor (lines 2042-2049), R: Prism Nova (lines 2064-2089, novaBeams line 63), RMB: Ricochet Beam (line 2040) (+1 more)

### Community 67 - "Mage Arena playtest report (all 30 elements)"
Cohesion: 0.29
Nodes (6): Balance (median of 30: crowd 218.1 dps, boss 137.1 dps), Harness caveats, Mage Arena playtest report (all 30 elements), Performance hot list (peak particles in one move; the pool holds 4000), Second theme: effects that blind your own view, Top changes by element

### Community 68 - "Blood playtest report"
Cohesion: 0.25
Nodes (7): Blood playtest report, LMB: Blood Bolt (cd .4, 21 dmg), Passive: Bloodlust (2.5% steal, bleed leech .1, up to +50% dmg at low HP), Q: Exsanguinate (cd 8), R: Blood Moon (ult, 4 s, 7 dmg per .25 s to 12 enemies, death pop 30 AoE), RMB: Crimson Fan (cd 3.5, 5 x 16, pierce 99), Top 3

### Community 69 - "Earth playtest report"
Cohesion: 0.22
Nodes (8): Earth playtest report, LMB: Stone Shot (cd .7, 5 x 10 dmg, spread ±.13), Other, Passive: Bedrock (15% less damage, poise x2, st vuln .1), Q: Stone Pillar (aim, cd 9, 26 dmg, lift 12, solid wall for 6 s), R: Tectonic Quake (ult, 4 quakes x 40 dmg, 12 m, stun 1.2), RMB: Boulder (cd 5, 38 dmg pierce + 20 AoE at end), Top 3

### Community 70 - "Water playtest report"
Cohesion: 0.25
Nodes (7): E - Surf (cd 9, 24 dmg per enemy, 14 m dash), LMB - Aqua Bullets (cd .14, 10.5 dmg, kb 4.5), Passive - Tidal Force (st.kb 1.6), Q - Bubble Prison (cd 9, 10 dmg, 3 s bubble, +30% damage taken), R - Tsunami (ultimate, 110 per enemy, 2.6 s), Top 3, Water playtest report

### Community 71 - "puffTex"
Cohesion: 0.67
Nodes (3): puffTex(), smokeCloud(), RMB: Blackout (cd 6, 16 dmg once, stun 1.5 s, 3 s cloud r 3)

### Community 73 - "Storm playtest report"
Cohesion: 0.22
Nodes (8): shake(), skyFx(), Passive: Static (every 8th Storm hit drops a 16-dmg sky strike; Shocked takes +15%), Q: Thunderclap (cd 7, 0.45 s delay, 38 dmg r3.5 + stun 0.8, then 3 jumps x20), R: Thunderstorm (ult, cloud follows you for 5 s, a 38-dmg r1.6 sky bolt + 0.25 s stun every 0.24 s), RMB: Ball Lightning (cd 6, orb 6 dmg pierce, zaps 2 targets x5 every 0.25 s, burst 20), Storm playtest report, Top 3

### Community 79 - "Chrono playtest report"
Cohesion: 0.25
Nodes (7): Chrono playtest report, E: Slow Field (cd 13, r 6, 6 s, 70% slow), LMB: Chrono Bolt (cd .45, 16 dmg + 16 echo after 1.2 s), Passive: Time Dilation (cooldowns ×0.82, timeworn slow .35), Q: Rewind (cd 6, 8 mark dmg, snap 35 + 14/m up to +200, +150 vs boss), R: Time Stop (ult, 4 s, damage stored ×1.5), Top 3

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Blender Assets` connect `Elements.md` to `grab`, `build_elements.py`, `Mesh`, `dustFx`?**
  _High betweenness centrality (0.247) - this node is a cross-community bridge._
- **Are the 14 inferred relationships involving `build_hell()` (e.g. with `rim()` and `cage()`) actually correct?**
  _`build_hell()` has 14 INFERRED edges - model-reasoned connections that need verification._
- **Should `sim.js` be split into smaller, more focused modules?**
  _Cohesion score 0.09879032258064516 - nodes in this community are weakly interconnected._
- **Why does `In-game look` connect `dustFx` to `Elements.md`?**
  _High betweenness centrality (0.168) - this node is a cross-community bridge._
- **Should `core.js` be split into smaller, more focused modules?**
  _Cohesion score 0.02271062271062271 - nodes in this community are weakly interconnected._
- **Why does `Mesh` connect `Mesh` to `lib.py`, `build_hell`, `Elements.md`, `Venom playtest report`, `build_elements.py`, `build_enemies.py`, `part`, `build_islands.py`?**
  _High betweenness centrality (0.165) - this node is a cross-community bridge._
- **Should `dungeon.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07486338797814207 - nodes in this community are weakly interconnected._