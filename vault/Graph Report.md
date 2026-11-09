# Graph Report - Test Game  (2026-11-09)

## Corpus Check
- 73 files · ~324,230 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 2)

## Summary
- 1530 nodes · 2800 edges · 89 communities (84 shown, 5 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 269 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c6487803`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- TRS
- core.js
- dungeon.js
- view.js
- aim
- net.js
- Mesh
- elements.js
- Elements.md
- Venom playtest report
- Audio credits
- build_hell
- areas.js
- modes.js
- renderWorld
- city.js
- run.js
- part
- ringFx
- addShader
- Wind playtest report
- boomAt
- Ink playtest report
- clamp
- build_foes.py
- renderLobby
- Elements
- stepCast
- onEvent
- icons.js
- animEnemy
- blocks.js
- sim.js
- MUSIC
- Abyss playtest report
- build_elements.py
- stepShots
- build_assets.py
- grab
- pol
- Magma playtest report
- Explosion playtest report
- Steel playtest report
- Sonic playtest report
- Illusion playtest report
- Shadow playtest report
- Crystal playtest report
- lib.py
- settings.js
- Fire playtest report
- Cosmic playtest report
- Bone playtest report
- Arcane playtest report
- Plasma playtest report
- .__init__
- Rune playtest report
- circleFx
- Frost playtest report
- react
- Q: Thunderclap (cd 7, 0.45 s delay, 38 dmg r3.5 + stun 0.8, then 3 jumps x20)
- keyName
- lockMouse
- build_enemies.py
- Blades playtest report
- cityLayout
- Laser playtest report
- Earth playtest report
- scarFx
- Spirit playtest report
- buildCityView
- all.sh
- stepEnemies
- ctxOf
- burst
- cIx
- lfxFrame
- pvShow
- ev
- gfx.js
- Netcode
- Light playtest report
- Soul playtest report
- Mage Arena playtest report (all 30 elements)
- Chrono playtest report
- hud
- css
- Enemies
- Similar moves (reviewed 2026-10-27)
- initAudio

## God Nodes (most connected - your core abstractions)
1. `TRS()` - 74 edges
2. `aim()` - 39 edges
3. `Elements` - 38 edges
4. `ell()` - 31 edges
5. `Mesh` - 31 edges
6. `build_hell()` - 30 edges
7. `crystal()` - 29 edges
8. `build_frost()` - 27 edges
9. `pol()` - 27 edges
10. `build_crypt()` - 26 edges

## Surprising Connections (you probably didn't know these)
- `Q: Arcane Familiar (dmg 22 in window, 257 ms avg, **5634 ms worst**, 467 particles, 1 ent)` --references--> `ringFx()`  [INFERRED]
  playtest/reports/arcane.md → js/core.js
- `R: Bass Drop` --references--> `ringFx()`  [INFERRED]
  playtest/reports/sonic.md → js/core.js
- `R: Colossal Blade (ult, 130 impact r 6 + 5 x 26 waves, halo to 6)` --references--> `addUlt()`  [INFERRED]
  playtest/reports/blades.md → js/sim.js
- `Balance root cause: Supernova recharges itself` --references--> `addUlt()`  [INFERRED]
  playtest/reports/cosmic.md → js/sim.js
- `Top 3` --references--> `addUlt()`  [INFERRED]
  playtest/reports/cosmic.md → js/sim.js

## Import Cycles
- None detected.

## Communities (89 total, 5 thin omitted)

### Community 0 - "TRS"
Cohesion: 0.12
Nodes (19): sbody(), tent(), ba_body(), bwing(), bz_arm(), cn_leg(), eyeball(), gz_body() (+11 more)

### Community 1 - "core.js"
Cohesion: 0.02
Nodes (70): amb, ARENA_PILLARS, BH, BH_L, BIND, BIND_DEF, bloomPass, _c (+62 more)

### Community 2 - "dungeon.js"
Cohesion: 0.07
Nodes (55): add(), anchor(), ARRIVE, block(), BUCKET, buildDungeonView(), buildFloor(), buildHall() (+47 more)

### Community 3 - "view.js"
Cohesion: 0.04
Nodes (48): BOSS_COL, BOSS_GAIT, CAST_T, castFx(), CASTS, CC_OV, COMBO_FX, DIFF (+40 more)

### Community 4 - "aim"
Cohesion: 0.13
Nodes (24): barm(), boss_body(), boss_sword(), brute_body(), cn_body(), ft_body(), golem(), hg_ring() (+16 more)

### Community 5 - "net.js"
Cohesion: 0.09
Nodes (39): autoQuality(), bfSnap(), bgTick(), CHEAT_TOGGLES, cheatSpawn(), dropGuest(), footsteps(), frame() (+31 more)

### Community 6 - "Mesh"
Cohesion: 0.13
Nodes (9): spell_circle(), wpart(), bridge(), bridge_gate(), bridge_pier(), bridge_post(), horn_(), area() (+1 more)

### Community 7 - "elements.js"
Cohesion: 0.03
Nodes (27): _bgeo, chainBolt(), DOME_GEO, ELEMENTS, entangleRing(), EQ_GEO, FALL_GEO, FLARE_GEO (+19 more)

### Community 9 - "Venom playtest report"
Cohesion: 0.18
Nodes (9): Balance overview, E: Contagion, LMB: Venom Spit, Passive: Virulence, Q: Serpent, R: Plague Swarm, RMB: Toxic Cloud, Top 3 (+1 more)

### Community 10 - "Audio credits"
Cohesion: 0.33
Nodes (5): Audio credits, Music (`audio/music/`), Sound effects (`audio/sfx/`, file names kept from the packs), pickSample(), SFX

### Community 11 - "build_hell"
Cohesion: 0.17
Nodes (16): build_crypt(), branch(), build_frost(), rim(), build_hell(), build_void(), chain(), circle() (+8 more)

### Community 12 - "areas.js"
Cohesion: 0.08
Nodes (34): addPool(), AREAS, aroundIsle(), bridgeEnds(), bsc(), die(), easeBack(), FOE_ATK (+26 more)

### Community 13 - "modes.js"
Cohesion: 0.12
Nodes (15): applyMap(), buildTrain(), DUEL_SPOTS, duelReset(), showScenery(), startDuel(), startMode(), startTrain() (+7 more)

### Community 14 - "renderWorld"
Cohesion: 0.16
Nodes (15): animWizard(), makeEnt(), makeShot(), makeWizard(), me(), renderAuras(), renderChannels(), renderEnts() (+7 more)

### Community 15 - "city.js"
Cohesion: 0.07
Nodes (36): CBX, CITY, cityApply(), cityBreakFx(), cityCrackFx(), cityFrame(), cityG, cityPropFx() (+28 more)

### Community 16 - "run.js"
Cohesion: 0.05
Nodes (32): all, { execFile }, fs, OUT, path, src, browser(), { chromium } (+24 more)

### Community 17 - "part"
Cohesion: 0.19
Nodes (9): caster(), sbody(), floater(), tent(), keg(), knight(), kbody(), part() (+1 more)

### Community 18 - "ringFx"
Cohesion: 0.12
Nodes (22): addFx(), animateArena(), boltFx(), easeOut(), glowify(), glowMats(), makeCircle(), meshFx() (+14 more)

### Community 19 - "addShader"
Cohesion: 0.33
Nodes (7): addShader(), beamMat(), discMat(), fireMat(), flameMat(), pillarFx(), waveMat()

### Community 20 - "Wind playtest report"
Cohesion: 0.20
Nodes (9): E: Tornado (lines 619-638), Expected landing, LMB: Wind Blades (`js/elements.js` line 602), Passive: Tailwind (`js/sim.js` lines 94 and 582), Q: Updraft (lines 615-618), R: Downburst (lines 639-659), RMB: Gale Force (lines 605-614), Top 3 (+1 more)

### Community 21 - "boomAt"
Cohesion: 0.25
Nodes (8): boomAt(), ctxS(), fxe(), inkSplash(), summonAI(), RMB: Crush (cd 6, 55 dmg r3.5, stun 1 s, slams airborne), Q: Sigilfall, Q: Implosion

### Community 22 - "Ink playtest report"
Cohesion: 0.18
Nodes (10): inkDecal(), E: Ink Pool, Ink playtest report, LMB: Ink Bolt, Passive: Bleeding Ink (kill splash 15 in 3 m, inked -25% speed), Performance (measured), Q: Ink Koi, R: Ink Dragon (ultimate) (+2 more)

### Community 23 - "clamp"
Cohesion: 0.50
Nodes (4): clamp(), localInput(), pollPad(), setupTouch()

### Community 24 - "build_foes.py"
Cohesion: 0.11
Nodes (35): ba_arm(), bake_scale(), bd_body(), beast(), legq(), biped(), arm(), leg() (+27 more)

### Community 25 - "renderLobby"
Cohesion: 0.18
Nodes (17): bestFor(), gainXP(), needXP(), PICKABLE(), renderDetail(), renderLobby(), renderProg(), renderTalents() (+9 more)

### Community 26 - "Elements"
Cohesion: 0.06
Nodes (36): 🐙 Abyss, 🔮 Arcane, Balance, 🗡️ Blades, Blocks, 🩸 Blood, 💀 Bone, ⏳ Chrono (+28 more)

### Community 27 - "stepCast"
Cohesion: 0.18
Nodes (12): Don't lag the PC (this has happened twice), Knowledge, Mage Arena, Never lose data, Spell icons, r2(), canCast(), castEv() (+4 more)

### Community 28 - "onEvent"
Cohesion: 0.22
Nodes (18): arcFx(), bossAnim(), bossArrive(), bossAura(), bossCol(), bossDeath(), bossIntro(), bossTransform() (+10 more)

### Community 29 - "icons.js"
Cohesion: 0.14
Nodes (5): elIcon(), moveIcon(), paintKit, SIGIL, SPELL_ART

### Community 30 - "animEnemy"
Cohesion: 0.83
Nodes (4): animEnemy(), bossGait(), heavyGait(), legLen()

### Community 31 - "blocks.js"
Cohesion: 0.23
Nodes (8): BLOCK, BLOCK_LOOK, guardFrame(), guardMake(), guardParticles(), guardPose(), GV, myGuard()

### Community 32 - "sim.js"
Cohesion: 0.09
Nodes (22): BOSS_SKY, coneHits(), elementPower(), ELIST, endWave(), ET, flatAim(), HARD (+14 more)

### Community 33 - "MUSIC"
Cohesion: 1.00
Nodes (3): MUSIC, playMood(), track()

### Community 34 - "Abyss playtest report"
Cohesion: 0.22
Nodes (8): Abyss playtest report, Balance overview, E: Tentacle Ring, Icons, LMB: Void Bolt, R: Kraken, RMB: Grasp of the Deep, Top 3

### Community 35 - "build_elements.py"
Cohesion: 0.14
Nodes (15): arcpts(), crescent(), crescent_blade(), lens(), M(), mirror_shard(), plated_rock(), put() (+7 more)

### Community 36 - "stepShots"
Cohesion: 0.43
Nodes (7): alive(), center(), endShot(), nearest(), rayHits(), stepShots(), touches()

### Community 37 - "build_assets.py"
Cohesion: 0.10
Nodes (21): arm_l(), cape(), cape2(), digit(), finger(), fist(), head(), leg() (+13 more)

### Community 38 - "grab"
Cohesion: 0.67
Nodes (3): grab(), sp(), Conventions

### Community 39 - "pol"
Cohesion: 0.33
Nodes (5): blob_cloud(), gravestone(), rim(), radial_tiles(), pol()

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
Cohesion: 0.15
Nodes (12): beamFx(), beamMesh(), laserFx(), prismRays(), LMB: Pulse Laser (line 2037), E: Harmonic Link, LMB: Sound Wave, Passive: Resonance (+4 more)

### Community 44 - "Illusion playtest report"
Cohesion: 0.22
Nodes (8): E: Kaleidoscope (cd 7), Illusion playtest report, LMB: Phantom Moths (cd .45), Passive: Misdirection (`st: { weak: .2 }`, sim.js:435 1-in-3 miss), Q: Mesmerize (cd 10), R: Phantasmagoria (ultimate), RMB: Decoy (cd 8), Top 3

### Community 45 - "Shadow playtest report"
Cohesion: 0.29
Nodes (7): swap(), E: Shadow Swap (cd 9, 14 dmg, swap + stun 1.5 s facing away), LMB: Shadow Daggers (cd .45, 3 x 10.5), Passive: Assassin (+50% from behind, Cursed +15%), Q: Shadow Snare (cd 7, 12 dmg, pull 6, root 1.5 s, +40% dmg taken 1.5 s), Shadow playtest report, Top 3

### Community 46 - "Crystal playtest report"
Cohesion: 0.22
Nodes (8): Crystal playtest report, E: Crystal Spire (`crystal.3`, line 1135), LMB: Prism Shard (`crystal.0`, line 1097), Passive: Prismatic (`onKill`, line 1095), Q: Resonant Crystal (`crystal.2`, line 1123), R: Crystal Tomb (`crystal.4`, line 1153), RMB: Geode Bomb (`crystal.1`, line 1107), Top 3

### Community 47 - "lib.py"
Cohesion: 0.09
Nodes (8): apply_bevel(), apply_subsurf(), bake_ao(), pack_bundle(), Previewer, uv_ribbon(), Blender Assets, Finishing pass

### Community 48 - "settings.js"
Cohesion: 0.08
Nodes (31): applySettings(), audioGains(), audioTick(), BIND_NAMES, CB_SHIFT, CB_SIM, cbMatrix(), closeSettings() (+23 more)

### Community 49 - "Fire playtest report"
Cohesion: 0.18
Nodes (11): fireBoom(), flameColor(), spread(), Balance summary, E: Ring of Fire (dmg 95, 476 ms avg = fire's slowest, 577 particles, 41 fx, 1 ent), Fire playtest report, LMB: Fireball (dmg 26 into pack, 170 ms avg, 339 particles, 27 fx), Passive: Kindling (death blast 20 x dmgMul, r 2.6) (+3 more)

### Community 50 - "Cosmic playtest report"
Cohesion: 0.20
Nodes (9): Balance root cause: Supernova recharges itself, Cosmic playtest report, E: Meteor Shower, LMB: Star Shot, Passive: Stellar Rhythm / Starstruck, Q: Constellation, R: Supernova, RMB: Orbiting Moons (+1 more)

### Community 51 - "Bone playtest report"
Cohesion: 0.05
Nodes (33): emit(), Blood playtest report, E: Crimson Mire (cd 9, 4 s pool, 10 dmg per .5 s, pull 22), LMB: Blood Bolt (cd .4, 21 dmg), Passive: Bloodlust (2.5% steal, bleed leech .1, up to +50% dmg at low HP), Q: Exsanguinate (cd 8), R: Blood Moon (ult, 4 s, 7 dmg per .25 s to 12 enemies, death pop 30 AoE), RMB: Crimson Fan (cd 3.5, 5 x 16, pierce 99) (+25 more)

### Community 52 - "Arcane playtest report"
Cohesion: 0.25
Nodes (7): Arcane playtest report, E: Polymorph (dmg 15, 94 ms avg, 681 particles = highest non-ult peak, 15 fx), LMB: Arcane Missiles (dmg 20 into pack, 242 ms avg, 285 particles, 8 fx), Passive: Arcane Charges (+8% per charge, up to 4) and Spellbound (+10% damage taken), Q: Arcane Familiar (dmg 22 in window, 257 ms avg, **5634 ms worst**, 467 particles, 1 ent), R: Arcane Torrent (dmg 67 in window, 95 ms avg, 588 particles, 25 fx). **Affected by the ult loop**, Top 3

### Community 53 - "Plasma playtest report"
Cohesion: 0.22
Nodes (8): boomFx(), E: Thermal Lance (cd 6, 40 pierce in a 12 m line, burn line 6 / .4 s above 50 Heat), LMB: Plasma Bolt (cd .28, 11 + 4 splash, heat 9), Passive: Heat (+0.5% dmg per Heat, overheat at 100 = 25 dmg vent + 2.5 s lock, cools 15/s), Plasma playtest report, Q: Vent (cd 7, 20 + .9 x Heat, r 4 + Heat/30), RMB: Plasma Cannon (charge 1.1 s, cd 3.5, 25-85 dmg, blast r 2-4.5), Top 3

### Community 54 - ".__init__"
Cohesion: 0.40
Nodes (3): center(), lane_angle(), coll()

### Community 55 - "Rune playtest report"
Cohesion: 0.18
Nodes (12): dropFade(), tripped(), wardMake(), wardUpd(), wardView(), E: Binding Circle, LMB: Rune Bolt, Passive: Rune Mastery (+4 more)

### Community 56 - "circleFx"
Cohesion: 0.40
Nodes (5): circleFx(), easeOutBack(), nearOff(), spinCircle(), E: Bone Cage

### Community 57 - "Frost playtest report"
Cohesion: 0.20
Nodes (9): renderAim(), E: Frost Nova, Frost playtest report, LMB: Ice Shard, Passive: Permafrost (4 hits -> freeze 1.8 s, frozen take +40%), Performance (measured), R: Blizzard (ultimate), RMB: Glacial Lance (+1 more)

### Community 58 - "react"
Cohesion: 0.31
Nodes (8): Checklist: adding or changing a move or an element, ent(), launch(), react(), reactionOf(), Combos (reactions), Named reactions, Reaction kinds (for every other pair)

### Community 59 - "Q: Thunderclap (cd 7, 0.45 s delay, 38 dmg r3.5 + stun 0.8, then 3 jumps x20)"
Cohesion: 0.50
Nodes (4): padBuzz(), shake(), skyFx(), Q: Thunderclap (cd 7, 0.45 s delay, 38 dmg r3.5 + stun 0.8, then 3 jumps x20)

### Community 63 - "build_enemies.py"
Cohesion: 0.24
Nodes (16): arm(), boss_arm(), claws(), dkbody(), ellipsoid(), horn(), kbody(), leg() (+8 more)

### Community 64 - "Blades playtest report"
Cohesion: 0.20
Nodes (9): zoneCircle(), Blades playtest report, E: Rain of Blades (cd 11, 12 x 20 in r 1.8 stabs, 6 s field, 30% slow, pick-up), LMB: Flying Daggers (cd .35, 2 x 7.5, home 2), Passive: Sword Halo (+1 sword / 2.5 s, max 6; guard 18 dmg to anything within 3 m every .35 s, costs a sword), Q: Blade Dance (cd 8, 9 m dash, 32 dmg in a 1.8 m lane, +2 swords), R: Colossal Blade (ult, 130 impact r 6 + 5 x 26 waves, halo to 6), RMB: Sword Volley (cd 2.5, max(2, swords) x 24, pierce 3) (+1 more)

### Community 65 - "cityLayout"
Cohesion: 0.18
Nodes (17): cityHit(), cityLayout(), house(), tower(), cityMap(), cityPropMask(), cityReset(), citySettle() (+9 more)

### Community 66 - "Laser playtest report"
Cohesion: 0.24
Nodes (9): laserShot(), novaBeams(), E: Laser Drone (lines 2050-2063), Laser playtest report, Passive: Ricochet and Focus (laserShot, lines 35-61), Q: Refractor (lines 2042-2049), R: Prism Nova (lines 2064-2089, novaBeams line 63), RMB: Ricochet Beam (line 2040) (+1 more)

### Community 68 - "Earth playtest report"
Cohesion: 0.22
Nodes (8): Earth playtest report, LMB: Stone Shot (cd .7, 5 x 10 dmg, spread ±.13), Other, Passive: Bedrock (15% less damage, poise x2, st vuln .1), Q: Stone Pillar (aim, cd 9, 26 dmg, lift 12, solid wall for 6 s), R: Tectonic Quake (ult, 4 quakes x 40 dmg, 12 m, stun 1.2), RMB: Boulder (cd 5, 38 dmg pierce + 20 AoE at end), Top 3

### Community 69 - "scarFx"
Cohesion: 0.11
Nodes (26): energyMat(), model(), bigBoltFx(), blastFx(), bloodSplat(), debrisFx(), deepSplash(), dustFx() (+18 more)

### Community 73 - "Spirit playtest report"
Cohesion: 0.25
Nodes (7): LMB: Soul Wisps, Passive: Restless Dead (+ Haunted), Q: Banshee, R: Army of the Dead, RMB: Command, Spirit playtest report, Top 3

### Community 75 - "buildCityView"
Cohesion: 0.24
Nodes (11): arenaMat(), arenaObj(), buildCityView(), buildKit(), cboxGeo(), cityLights, cityRng(), GB (+3 more)

### Community 79 - "stepEnemies"
Cohesion: 0.11
Nodes (28): bossCoast(), bossMeteors(), capNear(), clampArena(), collide(), confine(), dropOrb(), enemiesNear() (+20 more)

### Community 82 - "ctxOf"
Cohesion: 0.36
Nodes (11): aimOf(), castAim(), ctxOf(), eyeOf(), groundAt(), handOf(), steerEnt(), steerer() (+3 more)

### Community 83 - "burst"
Cohesion: 0.20
Nodes (9): burst(), RMB: Arcane Barrage (dmg 25 with 0 charges, 387 ms avg = the kit's highest, 418 particles, 14 fx), Q: Rewind (cd 6, 8 mark dmg, snap 35 + 14/m up to +200, +150 vs boss), E: Spirit Wolf, LMB: Chain Lightning (cd 0.36, 6 dmg, chains 2 at 75%), Passive: Static (every 8th Storm hit drops a 16-dmg sky strike; Shocked takes +15%), R: Thunderstorm (ult, cloud follows you for 5 s, a 38-dmg r1.6 sky bolt + 0.25 s stun every 0.24 s), Storm playtest report (+1 more)

### Community 86 - "cIx"
Cohesion: 0.25
Nodes (11): blockAt(), cityCollide(), cityField(), gate(), cityLOS(), cityNav(), citySpawnSpot(), cityStep() (+3 more)

### Community 87 - "lfxFrame"
Cohesion: 0.43
Nodes (8): lfxA(), lfxAmbient(), lfxFrame(), lfxLite(), lfxRgb(), lfxSpawn(), lfxSprite(), lobbyFx()

### Community 91 - "pvShow"
Cohesion: 0.33
Nodes (6): flat0(), pvDot, pvFit(), pvShow(), smoothGeo(), soften()

### Community 96 - "ev"
Cohesion: 0.19
Nodes (26): addUlt(), aoe(), applyStatus(), blast(), bomberBlast(), bondMul(), cc(), ccEnd() (+18 more)

### Community 97 - "gfx.js"
Cohesion: 0.06
Nodes (34): AO_Q, aoA, aoB, applyGfx(), blit(), fxaaPass, _gcam, _gd (+26 more)

### Community 98 - "Netcode"
Cohesion: 0.25
Nodes (7): handPos(), R: Fusion Beam (ult, 4 s, 15 per .1 s per enemy on a 40 m ray), Cross-platform, Known ceilings (`ponytail:` comments in the code), Netcode, Partner animation, Testing

### Community 104 - "Light playtest report"
Cohesion: 0.18
Nodes (11): flash(), aimBeam(), E: Penance, Light playtest report, LMB: Radiant Orbs, Passive: Radiance, Q: Blinding Flash, R: Divine Judgment (+3 more)

### Community 113 - "Soul playtest report"
Cohesion: 0.25
Nodes (7): E: Soulstorm (lines 1900-1909), LMB: Soulfire (`js/elements.js` line 1866), Passive: Soulbound (`js/sim.js` lines 106, 410, 424), Q: Soul Rend (lines 1892-1899), RMB: Reap (lines 1874-1891), Soul playtest report, Top 3

### Community 122 - "Mage Arena playtest report (all 30 elements)"
Cohesion: 0.29
Nodes (6): Balance (median of 30: crowd 218.1 dps, boss 137.1 dps), Harness caveats, Mage Arena playtest report (all 30 elements), Performance hot list (peak particles in one move; the pool holds 4000), Second theme: effects that blind your own view, Top changes by element

### Community 126 - "Chrono playtest report"
Cohesion: 0.29
Nodes (6): Chrono playtest report, E: Slow Field (cd 13, r 6, 6 s, 70% slow), LMB: Chrono Bolt (cd .45, 16 dmg + 16 echo after 1.2 s), Passive: Time Dilation (cooldowns ×0.82, timeworn slow .35), R: Time Stop (ult, 4 s, damage stored ×1.5), Top 3

### Community 131 - "hud"
Cohesion: 0.50
Nodes (4): buildBar(), hud(), mateMark(), Partner HUD

### Community 138 - "css"
Cohesion: 0.67
Nodes (3): comboText(), css(), tintRig()

### Community 142 - "Enemies"
Cohesion: 0.50
Nodes (4): Enemies, Fighting them, Wave budget, Wave modifiers

### Community 143 - "Similar moves (reviewed 2026-10-27)"
Cohesion: 0.25
Nodes (6): Alike within one element, Similar moves (reviewed 2026-10-27), Similar (same role, different twist), Very similar (near-duplicates), Done (2026-10-27), To-do (noted 2026-10-26)

## Knowledge Gaps
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Blender Assets` connect `lib.py` to `build_elements.py`, `scarFx`, `grab`, `Mesh`, `Elements.md`?**
  _High betweenness centrality (0.237) - this node is a cross-community bridge._
- **Should `TRS` be split into smaller, more focused modules?**
  _Cohesion score 0.11695906432748537 - nodes in this community are weakly interconnected._
- **Why does `Mesh` connect `Mesh` to `build_elements.py`, `Venom playtest report`, `build_hell`, `lib.py`, `part`, `.__init__`, `build_enemies.py`?**
  _High betweenness centrality (0.196) - this node is a cross-community bridge._
- **Should `core.js` be split into smaller, more focused modules?**
  _Cohesion score 0.023529411764705882 - nodes in this community are weakly interconnected._
- **Why does `react()` connect `react` to `sim.js`, `ev`, `stepShots`, `stepEnemies`, `stepCast`?**
  _High betweenness centrality (0.133) - this node is a cross-community bridge._
- **Should `dungeon.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07486338797814207 - nodes in this community are weakly interconnected._
- **Should `view.js` be split into smaller, more focused modules?**
  _Cohesion score 0.04392156862745098 - nodes in this community are weakly interconnected._