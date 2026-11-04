# Graph Report - Test Game  (2026-11-04)

## Corpus Check
- 70 files · ~277,036 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 2)

## Summary
- 1337 nodes · 2479 edges · 86 communities (80 shown, 6 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 246 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bd52ea1f`
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
- Checklist: adding or changing a move or an element
- clamp
- build_foes.py
- renderLobby
- Elements
- build_assets.py
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
- In-game look
- Magma playtest report
- Explosion playtest report
- Steel playtest report
- Sonic playtest report
- Illusion playtest report
- Light playtest report
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
- Similar moves (reviewed 2026-10-27)
- Frost playtest report
- Mage Arena
- Enemies
- TRS
- Mage Arena
- confine
- .__init__
- bake_scale
- gainXP
- Laser playtest report
- Mage Arena playtest report (all 30 elements)
- stepEnemies
- Earth playtest report
- hostStep
- Storm playtest report
- stepShots
- Gravity playtest report
- Shadow playtest report
- addUlt
- all.sh
- Arcane playtest report
- Blood playtest report
- Spirit playtest report
- Water playtest report
- Bone playtest report
- Chrono playtest report
- modelFx
- burst
- emit

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
- `Q: Arcane Familiar (dmg 22 in window, 257 ms avg, **5634 ms worst**, 467 particles, 1 ent)` --references--> `ringFx()`  [INFERRED]
  playtest/reports/arcane.md → js/core.js
- `E: Repulsor (cd 9, 24 dmg r7, kb 18, reflects shots within 9 m)` --references--> `ringFx()`  [INFERRED]
  playtest/reports/gravity.md → js/core.js
- `Top 3` --references--> `ringFx()`  [INFERRED]
  playtest/reports/gravity.md → js/core.js
- `R: Bass Drop` --references--> `ringFx()`  [INFERRED]
  playtest/reports/sonic.md → js/core.js
- `RMB: Ball Lightning (cd 6, orb 6 dmg pierce, zaps 2 targets x5 every 0.25 s, burst 20)` --references--> `boltFx()`  [INFERRED]
  playtest/reports/storm.md → js/core.js

## Import Cycles
- None detected.

## Communities (86 total, 6 thin omitted)

### Community 0 - "sim.js"
Cohesion: 0.12
Nodes (23): aimOf(), BOSS_SKY, canCast(), castAim(), castEv(), cdOf(), coneHits(), ctxOf() (+15 more)

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
Cohesion: 0.15
Nodes (21): blob_cloud(), build_crypt(), branch(), gravestone(), build_frost(), rim(), build_hell(), rim() (+13 more)

### Community 5 - "net.js"
Cohesion: 0.10
Nodes (37): applySettings(), autoQuality(), bfSnap(), bgTick(), BIND_NAMES, CHEAT_TOGGLES, cheatSpawn(), dropGuest() (+29 more)

### Community 6 - "Mesh"
Cohesion: 0.08
Nodes (18): spell_circle(), part(), bridge(), bridge_gate(), bridge_pier(), bridge_post(), horn_(), area() (+10 more)

### Community 7 - "elements.js"
Cohesion: 0.06
Nodes (13): _bgeo, ctxS(), ELEMENTS, fxe(), inkPool, inkSplash(), JET_GEO, REAP_ARC (+5 more)

### Community 9 - "aim"
Cohesion: 0.13
Nodes (25): barm(), boss_body(), boss_sword(), brute_body(), cn_body(), ft_body(), golem(), hg_ring() (+17 more)

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
Cohesion: 0.22
Nodes (17): arm(), boss_arm(), claws(), dkbody(), ellipsoid(), horn(), kbody(), leg() (+9 more)

### Community 18 - "ringFx"
Cohesion: 0.16
Nodes (19): addFx(), animateArena(), boltFx(), circleFx(), easeOut(), easeOutBack(), glowify(), glowMats() (+11 more)

### Community 19 - "addShader"
Cohesion: 0.40
Nodes (6): addShader(), beamMat(), discMat(), fireMat(), pillarFx(), waveMat()

### Community 20 - "Wind playtest report"
Cohesion: 0.20
Nodes (9): E: Tornado (lines 619-638), Expected landing, LMB: Wind Blades (`js/elements.js` line 602), Passive: Tailwind (`js/sim.js` lines 94 and 582), Q: Updraft (lines 615-618), R: Downburst (lines 639-659), RMB: Gale Force (lines 605-614), Top 3 (+1 more)

### Community 21 - "part"
Cohesion: 0.16
Nodes (11): beast(), legq(), caster(), sbody(), floater(), tent(), keg(), knight() (+3 more)

### Community 22 - "Checklist: adding or changing a move or an element"
Cohesion: 0.22
Nodes (9): Checklist: adding or changing a move or an element, energyMat(), flameMat(), flash(), model(), nearOff(), ent(), R: Divine Judgment (+1 more)

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
Cohesion: 0.05
Nodes (37): 🐙 Abyss, 🔮 Arcane, Balance, 🗡️ Blades, Blocks, 🩸 Blood, 💀 Bone, ⏳ Chrono (+29 more)

### Community 27 - "build_assets.py"
Cohesion: 0.18
Nodes (8): digit(), finger(), fist(), limb(), open_hand(), palm(), sleeve(), basis()

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
Cohesion: 0.09
Nodes (8): apply_bevel(), apply_subsurf(), bake_ao(), pack_bundle(), Previewer, uv_ribbon(), Blender Assets, Finishing pass

### Community 38 - "grab"
Cohesion: 0.67
Nodes (3): grab(), sp(), Conventions

### Community 39 - "In-game look"
Cohesion: 0.22
Nodes (13): blastFx(), debrisFx(), dustFx(), fxRoom(), puffTex(), scarFx(), smokeCloud(), smokeFx() (+5 more)

### Community 40 - "Magma playtest report"
Cohesion: 0.20
Nodes (9): pulse(), E: Volcano (cd 15, 10 s, bomb 22 r 2.2 every 0.9 s, range 16), LMB: Magma Glob (cd 0.7, 14 dmg splash r 2.2, pool 4 / 0.5 s, cools to rock), Magma playtest report, Passive: Molten Core (dot 6, +10% damage taken; attackers turn molten), Q: Heat Wave (cd 10, 9 m wall, 6 per 0.15 s, melt 70 after 5 scorches), R: Meteor (ult, 135 raw r 7.5, kb 10 lift 9, then a 5 s field of 8 / 0.5 s at r 6), RMB: Eruption (cd 5, 50 raw r 3, lift 13, 3 s pool) (+1 more)

### Community 41 - "Explosion playtest report"
Cohesion: 0.20
Nodes (9): E: Proximity Mines, Explosion playtest report, LMB: Grenade, Passive: Demolitions, Q: Rocket Jump, R: Carpet Bomb, RMB: Sticky Bomb, Root balance issue: Carpet Bomb recharges itself (+1 more)

### Community 42 - "Steel playtest report"
Cohesion: 0.22
Nodes (8): E · Caltrops, LMB · Saw Blade, Passive · Armor Breaker, Q · Magnetize, R · Blade Storm, RMB · Railgun, Steel playtest report, Top 3

### Community 43 - "Sonic playtest report"
Cohesion: 0.18
Nodes (10): boomAt(), RMB: Crush (cd 6, 55 dmg r3.5, stun 1 s, slams airborne), Q: Sigilfall, LMB: Sound Wave, Passive: Resonance, Q: Implosion, R: Bass Drop, RMB: Sonic Boom (+2 more)

### Community 44 - "Illusion playtest report"
Cohesion: 0.22
Nodes (8): E: Kaleidoscope (cd 7), Illusion playtest report, LMB: Phantom Moths (cd .45), Passive: Misdirection (`st: { weak: .2 }`, sim.js:435 1-in-3 miss), Q: Mesmerize (cd 10), R: Phantasmagoria (ultimate), RMB: Decoy (cd 8), Top 3

### Community 45 - "Light playtest report"
Cohesion: 0.14
Nodes (13): aimBeam(), beamFx(), beamMesh(), laserFx(), LMB: Pulse Laser (line 2037), E: Penance, Light playtest report, LMB: Radiant Orbs (+5 more)

### Community 46 - "Crystal playtest report"
Cohesion: 0.22
Nodes (8): Crystal playtest report, E: Crystal Spire (`crystal.3`, line 1135), LMB: Prism Shard (`crystal.0`, line 1097), Passive: Prismatic (`onKill`, line 1095), Q: Resonant Crystal (`crystal.2`, line 1123), R: Crystal Tomb (`crystal.4`, line 1153), RMB: Geode Bomb (`crystal.1`, line 1107), Top 3

### Community 47 - "Blades playtest report"
Cohesion: 0.25
Nodes (7): Blades playtest report, LMB: Flying Daggers (cd .35, 2 x 7.5, home 2), Passive: Sword Halo (+1 sword / 2.5 s, max 6; guard 18 dmg to anything within 3 m every .35 s, costs a sword), Q: Blade Dance (cd 8, 9 m dash, 32 dmg in a 1.8 m lane, +2 swords), R: Colossal Blade (ult, 130 impact r 6 + 5 x 26 waves, halo to 6), RMB: Sword Volley (cd 2.5, max(2, swords) x 24, pierce 3), Top 3

### Community 48 - "Cosmic playtest report"
Cohesion: 0.25
Nodes (7): Cosmic playtest report, E: Meteor Shower, LMB: Star Shot, Passive: Stellar Rhythm / Starstruck, Q: Constellation, R: Supernova, RMB: Orbiting Moons

### Community 49 - "Fire playtest report"
Cohesion: 0.18
Nodes (11): fireBoom(), flameColor(), spread(), Balance summary, E: Ring of Fire (dmg 95, 476 ms avg = fire's slowest, 577 particles, 41 fx, 1 ent), Fire playtest report, LMB: Fireball (dmg 26 into pack, 170 ms avg, 339 particles, 27 fx), Passive: Kindling (death blast 20 x dmgMul, r 2.6) (+3 more)

### Community 50 - "damage"
Cohesion: 0.12
Nodes (28): r2(), chainBolt(), applyStatus(), blast(), cc(), ccEnd(), damage(), elementPower() (+20 more)

### Community 51 - "Nature playtest report"
Cohesion: 0.22
Nodes (8): E: Snaptrap, LMB: Thorn Volley, Nature playtest report, Q: Parasite Seed, R: World Tree, RMB: Entangle, Shared (not nature-specific), Top 3

### Community 52 - "Ink playtest report"
Cohesion: 0.25
Nodes (7): E: Ink Pool, Ink playtest report, LMB: Ink Bolt, Passive: Bleeding Ink (kill splash 15 in 3 m, inked -25% speed), Performance (measured), Q: Ink Koi, R: Ink Dragon (ultimate)

### Community 53 - "Plasma playtest report"
Cohesion: 0.18
Nodes (10): boomFx(), handPos(), E: Thermal Lance (cd 6, 40 pierce in a 12 m line, burn line 6 / .4 s above 50 Heat), LMB: Plasma Bolt (cd .28, 11 + 4 splash, heat 9), Passive: Heat (+0.5% dmg per Heat, overheat at 100 = 25 dmg vent + 2.5 s lock, cools 15/s), Plasma playtest report, Q: Vent (cd 7, 20 + .9 x Heat, r 4 + Heat/30), R: Fusion Beam (ult, 4 s, 15 per .1 s per enemy on a 40 m ray) (+2 more)

### Community 54 - "Soul playtest report"
Cohesion: 0.25
Nodes (7): E: Soulstorm (lines 1900-1909), LMB: Soulfire (`js/elements.js` line 1866), Passive: Soulbound (`js/sim.js` lines 106, 410, 424), Q: Soul Rend (lines 1892-1899), RMB: Reap (lines 1874-1891), Soul playtest report, Top 3

### Community 55 - "Rune playtest report"
Cohesion: 0.18
Nodes (12): dropFade(), tripped(), wardMake(), wardUpd(), wardView(), E: Binding Circle, LMB: Rune Bolt, Passive: Rune Mastery (+4 more)

### Community 56 - "Similar moves (reviewed 2026-10-27)"
Cohesion: 0.25
Nodes (6): Alike within one element, Similar moves (reviewed 2026-10-27), Similar (same role, different twist), Very similar (near-duplicates), Done (2026-10-27), To-do (noted 2026-10-26)

### Community 57 - "Frost playtest report"
Cohesion: 0.20
Nodes (9): renderAim(), E: Frost Nova, Frost playtest report, LMB: Ice Shard, Passive: Permafrost (4 hits -> freeze 1.8 s, frozen take +40%), Performance (measured), R: Blizzard (ultimate), RMB: Glacial Lance (+1 more)

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
Cohesion: 0.28
Nodes (9): capNear(), clampArena(), collide(), confine(), inRects(), laserPath(), offMap(), startAttack() (+1 more)

### Community 63 - ".__init__"
Cohesion: 0.40
Nodes (3): center(), lane_angle(), coll()

### Community 65 - "gainXP"
Cohesion: 0.47
Nodes (6): gainXP(), needXP(), renderProg(), renderTalents(), saveProg(), xpBar()

### Community 66 - "Laser playtest report"
Cohesion: 0.24
Nodes (9): laserShot(), novaBeams(), E: Laser Drone (lines 2050-2063), Laser playtest report, Passive: Ricochet and Focus (laserShot, lines 35-61), Q: Refractor (lines 2042-2049), R: Prism Nova (lines 2064-2089, novaBeams line 63), RMB: Ricochet Beam (line 2040) (+1 more)

### Community 67 - "Mage Arena playtest report (all 30 elements)"
Cohesion: 0.25
Nodes (7): Balance (median of 30: crowd 218.1 dps, boss 137.1 dps), Harness caveats, Mage Arena playtest report (all 30 elements), Performance hot list (peak particles in one move; the pool holds 4000), Second theme: effects that blind your own view, The one big bug: ultimates recharge themselves, Top changes by element

### Community 68 - "stepEnemies"
Cohesion: 0.15
Nodes (30): aoe(), bomberBlast(), bondMul(), bossCoast(), bossMeteors(), dropOrb(), enemyHits(), ev() (+22 more)

### Community 69 - "Earth playtest report"
Cohesion: 0.22
Nodes (8): Earth playtest report, LMB: Stone Shot (cd .7, 5 x 10 dmg, spread ±.13), Other, Passive: Bedrock (15% less damage, poise x2, st vuln .1), Q: Stone Pillar (aim, cd 9, 26 dmg, lift 12, solid wall for 6 s), R: Tectonic Quake (ult, 4 quakes x 40 dmg, 12 m, stun 1.2), RMB: Boulder (cd 5, 38 dmg pierce + 20 AoE at end), Top 3

### Community 70 - "hostStep"
Cohesion: 0.14
Nodes (13): endWave(), hostStep(), idleInput(), own(), startWave(), stepEnts(), stepSpawner(), stepTimers() (+5 more)

### Community 71 - "Storm playtest report"
Cohesion: 0.22
Nodes (8): shake(), skyFx(), Passive: Static (every 8th Storm hit drops a 16-dmg sky strike; Shocked takes +15%), Q: Thunderclap (cd 7, 0.45 s delay, 38 dmg r3.5 + stun 0.8, then 3 jumps x20), R: Thunderstorm (ult, cloud follows you for 5 s, a 38-dmg r1.6 sky bolt + 0.25 s stun every 0.24 s), RMB: Ball Lightning (cd 6, orb 6 dmg pierce, zaps 2 targets x5 every 0.25 s, burst 20), Storm playtest report, Top 3

### Community 72 - "stepShots"
Cohesion: 0.36
Nodes (8): alive(), center(), endShot(), enemiesNear(), nearest(), rayHits(), stepShots(), touches()

### Community 73 - "Gravity playtest report"
Cohesion: 0.29
Nodes (6): E: Repulsor (cd 9, 24 dmg r7, kb 18, reflects shots within 9 m), Gravity playtest report, LMB: Graviton (cd .55, 22 dmg implosion r2, pulls in 3.5 m), Passive: Crushing Weight (x2 dmg vs `e.y > .4`; slams +50% fall dmg), R: Singularity (life 4.5 s, pull r15, grind 4-14 per .25 s within 3.2 m, 100 dmg collapse r6), Top 3

### Community 74 - "Shadow playtest report"
Cohesion: 0.29
Nodes (7): swap(), E: Shadow Swap (cd 9, 14 dmg, swap + stun 1.5 s facing away), LMB: Shadow Daggers (cd .45, 3 x 10.5), Passive: Assassin (+50% from behind, Cursed +15%), Q: Shadow Snare (cd 7, 12 dmg, pull 6, root 1.5 s, +40% dmg taken 1.5 s), Shadow playtest report, Top 3

### Community 75 - "addUlt"
Cohesion: 0.40
Nodes (5): addUlt(), Balance root cause: Supernova recharges itself, Top 3, Top 3, R: The Reaper (lines 1910-1926)

### Community 77 - "Arcane playtest report"
Cohesion: 0.25
Nodes (7): Arcane playtest report, E: Polymorph (dmg 15, 94 ms avg, 681 particles = highest non-ult peak, 15 fx), LMB: Arcane Missiles (dmg 20 into pack, 242 ms avg, 285 particles, 8 fx), Passive: Arcane Charges (+8% per charge, up to 4) and Spellbound (+10% damage taken), Q: Arcane Familiar (dmg 22 in window, 257 ms avg, **5634 ms worst**, 467 particles, 1 ent), R: Arcane Torrent (dmg 67 in window, 95 ms avg, 588 particles, 25 fx). **Affected by the ult loop**, Top 3

### Community 78 - "Blood playtest report"
Cohesion: 0.25
Nodes (7): Blood playtest report, LMB: Blood Bolt (cd .4, 21 dmg), Passive: Bloodlust (2.5% steal, bleed leech .1, up to +50% dmg at low HP), Q: Exsanguinate (cd 8), R: Blood Moon (ult, 4 s, 7 dmg per .25 s to 12 enemies, death pop 30 AoE), RMB: Crimson Fan (cd 3.5, 5 x 16, pierce 99), Top 3

### Community 79 - "Spirit playtest report"
Cohesion: 0.25
Nodes (7): LMB: Soul Wisps, Passive: Restless Dead (+ Haunted), Q: Banshee, R: Army of the Dead, RMB: Command, Spirit playtest report, Top 3

### Community 80 - "Water playtest report"
Cohesion: 0.25
Nodes (7): E - Surf (cd 9, 24 dmg per enemy, 14 m dash), LMB - Aqua Bullets (cd .14, 10.5 dmg, kb 4.5), Passive - Tidal Force (st.kb 1.6), Q - Bubble Prison (cd 9, 10 dmg, 3 s bubble, +30% damage taken), R - Tsunami (ultimate, 110 per enemy, 2.6 s), Top 3, Water playtest report

### Community 81 - "Bone playtest report"
Cohesion: 0.29
Nodes (6): Bone playtest report, LMB: Bone Toss, Performance (measured), Q: Marrow Burst, RMB: Cackling Skull, Top 3

### Community 82 - "Chrono playtest report"
Cohesion: 0.29
Nodes (6): Chrono playtest report, E: Slow Field (cd 13, r 6, 6 s, 70% slow), LMB: Chrono Bolt (cd .45, 16 dmg + 16 echo after 1.2 s), Passive: Time Dilation (cooldowns ×0.82, timeworn slow .35), R: Time Stop (ult, 4 s, damage stored ×1.5), Top 3

### Community 83 - "modelFx"
Cohesion: 0.33
Nodes (6): inkDecal(), modelFx(), zoneCircle(), E: Rain of Blades (cd 11, 12 x 20 in r 1.8 stabs, 6 s field, 30% slow, pick-up), Q: Levitate (cd 9, 22 dmg r4.5, lift 2.2 s, +25% dmg taken), RMB: Brush Stroke

### Community 84 - "burst"
Cohesion: 0.40
Nodes (5): burst(), RMB: Arcane Barrage (dmg 25 with 0 charges, 387 ms avg = the kit's highest, 418 particles, 14 fx), Q: Rewind (cd 6, 8 mark dmg, snap 35 + 14/m up to +200, +150 vs boss), E: Spirit Wolf, LMB: Chain Lightning (cd 0.36, 6 dmg, chains 2 at 75%)

### Community 85 - "emit"
Cohesion: 0.40
Nodes (5): emit(), E: Crimson Mire (cd 9, 4 s pool, 10 dmg per .5 s, pull 22), R: Bone Dragon (ultimate), Passive: Regrowth (1.5 HP/s), RMB - Water Whip (cd 3.5, 22 / 44 tip + .5 s stun)

## Knowledge Gaps
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Blender Assets` connect `lib.py` to `grab`, `Mesh`, `Elements.md`, `In-game look`, `build_elements.py`?**
  _High betweenness centrality (0.252) - this node is a cross-community bridge._
- **Are the 14 inferred relationships involving `build_hell()` (e.g. with `rim()` and `cage()`) actually correct?**
  _`build_hell()` has 14 INFERRED edges - model-reasoned connections that need verification._
- **Should `sim.js` be split into smaller, more focused modules?**
  _Cohesion score 0.11724137931034483 - nodes in this community are weakly interconnected._
- **Why does `In-game look` connect `In-game look` to `lib.py`, `Checklist: adding or changing a move or an element`?**
  _High betweenness centrality (0.173) - this node is a cross-community bridge._
- **Should `core.js` be split into smaller, more focused modules?**
  _Cohesion score 0.023529411764705882 - nodes in this community are weakly interconnected._
- **Why does `Mesh` connect `Mesh` to `lib.py`, `build_hell`, `build_elements.py`, `part`, `.__init__`?**
  _High betweenness centrality (0.155) - this node is a cross-community bridge._
- **Should `dungeon.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07486338797814207 - nodes in this community are weakly interconnected._