# Graph Report - Test Game  (2026-11-06)

## Corpus Check
- 71 files · ~307,531 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1409 nodes · 2381 edges · 79 communities (70 shown, 9 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 208 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1c49be46`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- sim.js
- core.js
- dungeon.js
- view.js
- build_islands.py
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
- pol
- boltFx
- addShader
- Wind playtest report
- r2
- Gravity playtest report
- clamp
- build_foes.py
- renderLobby
- Elements
- Mage Arena
- onEvent
- icons.js
- animEnemy
- blocks.js
- css
- MUSIC
- lib.py
- Spirit playtest report
- rand
- build_assets.py
- grab
- scarFx
- Magma playtest report
- Explosion playtest report
- Steel playtest report
- Sonic playtest report
- Illusion playtest report
- Light playtest report
- Crystal playtest report
- Arcane playtest report
- Cosmic playtest report
- Fire playtest report
- Abyss playtest report
- Nature playtest report
- Ink playtest report
- Plasma playtest report
- Soul playtest report
- Rune playtest report
- .__init__
- Frost playtest report
- beamFx
- wardView
- animWizard
- initAudio
- Bone playtest report
- keyName
- Blades playtest report
- lockMouse
- Laser playtest report
- Mage Arena playtest report (all 30 elements)
- Blood playtest report
- Earth playtest report
- Water playtest report
- Shadow playtest report
- pickSample
- Storm playtest report
- entangleRing
- hydraMat
- all.sh
- spectralMat
- Chrono playtest report

## God Nodes (most connected - your core abstractions)
1. `TRS()` - 60 edges
2. `Elements` - 38 edges
3. `aim()` - 32 edges
4. `Mesh` - 30 edges
5. `ell()` - 28 edges
6. `stepEnemies()` - 26 edges
7. `crystal()` - 25 edges
8. `ev()` - 24 edges
9. `pol()` - 22 edges
10. `react()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `sleeve()` --calls--> `aim()`  [INFERRED]
  blender/build_assets.py → blender/lib.py
- `limb()` --calls--> `aim()`  [INFERRED]
  blender/build_assets.py → blender/lib.py
- `wpart()` --calls--> `Mesh`  [INFERRED]
  blender/build_assets.py → blender/lib.py
- `spell_circle()` --calls--> `pol()`  [INFERRED]
  blender/build_assets.py → blender/lib.py
- `spell_circle()` --calls--> `runes()`  [INFERRED]
  blender/build_assets.py → blender/lib.py

## Import Cycles
- None detected.

## Communities (79 total, 9 thin omitted)

### Community 0 - "sim.js"
Cohesion: 0.06
Nodes (98): addUlt(), aimOf(), alive(), aoe(), applyStatus(), blast(), bomberBlast(), bondMul() (+90 more)

### Community 1 - "core.js"
Cohesion: 0.02
Nodes (69): amb, ARENA_PILLARS, BH, BH_L, BIND, BIND_DEF, _c, camera (+61 more)

### Community 2 - "dungeon.js"
Cohesion: 0.07
Nodes (55): add(), anchor(), ARRIVE, block(), BUCKET, buildDungeonView(), buildFloor(), buildHall() (+47 more)

### Community 3 - "view.js"
Cohesion: 0.05
Nodes (43): BOSS_COL, BOSS_GAIT, buildBar(), CAST_T, castFx(), CASTS, CC_OV, COMBO_FX (+35 more)

### Community 4 - "build_islands.py"
Cohesion: 0.23
Nodes (20): build_crypt(), build_frost(), build_hell(), build_void(), chain(), circle(), flame(), hex_tiles() (+12 more)

### Community 5 - "net.js"
Cohesion: 0.08
Nodes (43): applySettings(), autoQuality(), bfSnap(), bgTick(), BIND_NAMES, CHEAT_TOGGLES, cheatSpawn(), dropGuest() (+35 more)

### Community 6 - "Mesh"
Cohesion: 0.09
Nodes (7): 4 objects (ring_outer, runes, ring_inner, sigil) so the game can counter-rotate…, spell_circle(), area(), Mesh, Revolve [(radius, z), ...] around local Z., Sweep a circle along 3D points (radius per point). Good for horns, vines,…, Two crossed ribbons through 3D points, visible from any side (lightning).

### Community 7 - "elements.js"
Cohesion: 0.03
Nodes (19): _bgeo, ELEMENTS, EQ_GEO, FALL_GEO, FLARE_GEO, HYDRA, inkPool, JET_GEO (+11 more)

### Community 8 - "Elements.md"
Cohesion: 0.05
Nodes (38): Blender Assets, Conventions, Finishing pass, In-game look, Combos (reactions), Named reactions, Reaction kinds (for every other pair), Enemies (+30 more)

### Community 9 - "Venom playtest report"
Cohesion: 0.20
Nodes (9): Balance overview, E: Contagion, LMB: Venom Spit, Passive: Virulence, Q: Serpent, R: Plague Swarm, RMB: Toxic Cloud, Top 3 (+1 more)

### Community 10 - "Audio credits"
Cohesion: 0.50
Nodes (3): Audio credits, Music (`audio/music/`), Sound effects (`audio/sfx/`, file names kept from the packs)

### Community 11 - "build_elements.py"
Cohesion: 0.14
Nodes (20): arcpts(), crescent(), crescent_blade(), lens(), M(), mirror_shard(), plated_rock(), put() (+12 more)

### Community 12 - "areas.js"
Cohesion: 0.08
Nodes (33): addPool(), AREAS, aroundIsle(), bridgeEnds(), bsc(), die(), easeBack(), FOE_ATK (+25 more)

### Community 13 - "modes.js"
Cohesion: 0.17
Nodes (9): applyMap(), DUEL_SPOTS, duelReset(), showScenery(), startDuel(), startMode(), startTrain(), stepDuel() (+1 more)

### Community 14 - "renderWorld"
Cohesion: 0.21
Nodes (12): makeEnt(), makeShot(), makeWizard(), me(), renderAuras(), renderChannels(), renderEnts(), renderPartner() (+4 more)

### Community 15 - "city.js"
Cohesion: 0.05
Nodes (69): arenaMat(), arenaObj(), blockAt(), buildCityView(), buildKit(), cboxGeo(), CBX, CITY (+61 more)

### Community 16 - "run.js"
Cohesion: 0.05
Nodes (35): all, { execFile }, fs, OUT, path, src, browser(), { chromium } (+27 more)

### Community 17 - "pol"
Cohesion: 0.15
Nodes (4): blob_cloud(), Isle, The slab every island stands on: floor wedges, a rim curb, and the rock…, pol()

### Community 18 - "boltFx"
Cohesion: 0.22
Nodes (14): addFx(), boltFx(), circleFx(), easeOut(), easeOutBack(), glowify(), glowMats(), makeCircle() (+6 more)

### Community 19 - "addShader"
Cohesion: 0.25
Nodes (9): addShader(), beamMat(), discMat(), energyMat(), fireMat(), flameMat(), model(), pillarFx() (+1 more)

### Community 20 - "Wind playtest report"
Cohesion: 0.20
Nodes (9): E: Tornado (lines 619-638), Expected landing, LMB: Wind Blades (`js/elements.js` line 602), Passive: Tailwind (`js/sim.js` lines 94 and 582), Q: Updraft (lines 615-618), R: Downburst (lines 639-659), RMB: Gale Force (lines 605-614), Top 3 (+1 more)

### Community 21 - "r2"
Cohesion: 0.25
Nodes (8): r2(), boomAt(), chainBolt(), ctxS(), fxe(), inkSplash(), laserShot(), summonAI()

### Community 22 - "Gravity playtest report"
Cohesion: 0.22
Nodes (8): E: Repulsor (cd 9, 24 dmg r7, kb 18, reflects shots within 9 m), Gravity playtest report, LMB: Graviton (cd .55, 22 dmg implosion r2, pulls in 3.5 m), Passive: Crushing Weight (x2 dmg vs `e.y > .4`; slams +50% fall dmg), Q: Levitate (cd 9, 22 dmg r4.5, lift 2.2 s, +25% dmg taken), R: Singularity (life 4.5 s, pull r15, grind 4-14 per .25 s within 3.2 m, 100 dmg collapse r6), RMB: Crush (cd 6, 55 dmg r3.5, stun 1 s, slams airborne), Top 3

### Community 23 - "clamp"
Cohesion: 0.50
Nodes (4): clamp(), localInput(), pollPad(), setupTouch()

### Community 24 - "build_foes.py"
Cohesion: 0.05
Nodes (100): staff(), arm(), barm(), boss_arm(), boss_body(), boss_sword(), brute_body(), claws() (+92 more)

### Community 25 - "renderLobby"
Cohesion: 0.15
Nodes (19): bestFor(), gainXP(), needXP(), PICKABLE(), pickMode(), pvShow(), renderDetail(), renderLobby() (+11 more)

### Community 26 - "Elements"
Cohesion: 0.05
Nodes (38): 🐙 Abyss, 🔮 Arcane, Balance, 🗡️ Blades, Blocks, 🩸 Blood, 💀 Bone, ⏳ Chrono (+30 more)

### Community 27 - "Mage Arena"
Cohesion: 0.29
Nodes (6): Checklist: adding or changing a move or an element, Don't lag the PC (this has happened twice), Knowledge, Mage Arena, Never lose data, Spell icons

### Community 28 - "onEvent"
Cohesion: 0.22
Nodes (18): arcFx(), bossAnim(), bossArrive(), bossAura(), bossCol(), bossDeath(), bossIntro(), bossTransform() (+10 more)

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
Cohesion: 0.08
Nodes (19): base64, apply_bevel(), apply_subsurf(), bake_ao(), pack_bundle(), Previewer, Strip with UVs (u across, v along) for scrolling shaders such as the mana falls., Ray-traced ambient occlusion + per-face colour variation, baked into a corner… (+11 more)

### Community 35 - "Spirit playtest report"
Cohesion: 0.22
Nodes (8): E: Spirit Wolf, LMB: Soul Wisps, Passive: Restless Dead (+ Haunted), Q: Banshee, R: Army of the Dead, RMB: Command, Spirit playtest report, Top 3

### Community 36 - "rand"
Cohesion: 0.40
Nodes (6): animateArena(), burst(), emit(), popNum(), rand(), V()

### Community 37 - "build_assets.py"
Cohesion: 0.11
Nodes (22): arm_l(), cape(), cape2(), digit(), finger(), fist(), head(), limb() (+14 more)

### Community 39 - "scarFx"
Cohesion: 0.15
Nodes (20): bigBoltFx(), blastFx(), bloodSplat(), boomFx(), debrisFx(), deepSplash(), dustFx(), fireBoom() (+12 more)

### Community 40 - "Magma playtest report"
Cohesion: 0.22
Nodes (8): E: Volcano (cd 15, 10 s, bomb 22 r 2.2 every 0.9 s, range 16), LMB: Magma Glob (cd 0.7, 14 dmg splash r 2.2, pool 4 / 0.5 s, cools to rock), Magma playtest report, Passive: Molten Core (dot 6, +10% damage taken; attackers turn molten), Q: Heat Wave (cd 10, 9 m wall, 6 per 0.15 s, melt 70 after 5 scorches), R: Meteor (ult, 135 raw r 7.5, kb 10 lift 9, then a 5 s field of 8 / 0.5 s at r 6), RMB: Eruption (cd 5, 50 raw r 3, lift 13, 3 s pool), Top 3

### Community 41 - "Explosion playtest report"
Cohesion: 0.20
Nodes (9): E: Proximity Mines, Explosion playtest report, LMB: Grenade, Passive: Demolitions, Q: Rocket Jump, R: Carpet Bomb, RMB: Sticky Bomb, Root balance issue: Carpet Bomb recharges itself (+1 more)

### Community 42 - "Steel playtest report"
Cohesion: 0.22
Nodes (8): E · Caltrops, LMB · Saw Blade, Passive · Armor Breaker, Q · Magnetize, R · Blade Storm, RMB · Railgun, Steel playtest report, Top 3

### Community 43 - "Sonic playtest report"
Cohesion: 0.22
Nodes (8): E: Harmonic Link, LMB: Sound Wave, Passive: Resonance, Q: Implosion, R: Bass Drop, RMB: Sonic Boom, Sonic playtest report, Top 3

### Community 44 - "Illusion playtest report"
Cohesion: 0.22
Nodes (8): E: Kaleidoscope (cd 7), Illusion playtest report, LMB: Phantom Moths (cd .45), Passive: Misdirection (`st: { weak: .2 }`, sim.js:435 1-in-3 miss), Q: Mesmerize (cd 10), R: Phantasmagoria (ultimate), RMB: Decoy (cd 8), Top 3

### Community 45 - "Light playtest report"
Cohesion: 0.22
Nodes (8): E: Penance, Light playtest report, LMB: Radiant Orbs, Passive: Radiance, Q: Blinding Flash, R: Divine Judgment, RMB: Solar Beam, Top 3

### Community 46 - "Crystal playtest report"
Cohesion: 0.22
Nodes (8): Crystal playtest report, E: Crystal Spire (`crystal.3`, line 1135), LMB: Prism Shard (`crystal.0`, line 1097), Passive: Prismatic (`onKill`, line 1095), Q: Resonant Crystal (`crystal.2`, line 1123), R: Crystal Tomb (`crystal.4`, line 1153), RMB: Geode Bomb (`crystal.1`, line 1107), Top 3

### Community 47 - "Arcane playtest report"
Cohesion: 0.22
Nodes (8): Arcane playtest report, E: Polymorph (dmg 15, 94 ms avg, 681 particles = highest non-ult peak, 15 fx), LMB: Arcane Missiles (dmg 20 into pack, 242 ms avg, 285 particles, 8 fx), Passive: Arcane Charges (+8% per charge, up to 4) and Spellbound (+10% damage taken), Q: Arcane Familiar (dmg 22 in window, 257 ms avg, **5634 ms worst**, 467 particles, 1 ent), R: Arcane Torrent (dmg 67 in window, 95 ms avg, 588 particles, 25 fx). **Affected by the ult loop**, RMB: Arcane Barrage (dmg 25 with 0 charges, 387 ms avg = the kit's highest, 418 particles, 14 fx), Top 3

### Community 48 - "Cosmic playtest report"
Cohesion: 0.20
Nodes (9): Balance root cause: Supernova recharges itself, Cosmic playtest report, E: Meteor Shower, LMB: Star Shot, Passive: Stellar Rhythm / Starstruck, Q: Constellation, R: Supernova, RMB: Orbiting Moons (+1 more)

### Community 49 - "Fire playtest report"
Cohesion: 0.20
Nodes (9): Balance summary, E: Ring of Fire (dmg 95, 476 ms avg = fire's slowest, 577 particles, 41 fx, 1 ent), Fire playtest report, LMB: Fireball (dmg 26 into pack, 170 ms avg, 339 particles, 27 fx), Passive: Kindling (death blast 20 x dmgMul, r 2.6), Q: Fire Brand (dmg 37 measured, see note; 386 ms avg, 883 particles = fire's highest, 30 fx), R: Conflagration (dmg 249 measured, eruptions not in window; 436 ms avg, 819 particles, 56 fx = fire's highest), RMB: Flamethrower (dmg 118, 381 ms avg, 7347 ms worst, 812 particles, 40 fx) (+1 more)

### Community 50 - "Abyss playtest report"
Cohesion: 0.18
Nodes (10): Abyss playtest report, Balance overview, E: Tentacle Ring, Icons, LMB: Void Bolt, Passive: Lurker Below, Q: Maw of the Deep, R: Kraken (+2 more)

### Community 51 - "Nature playtest report"
Cohesion: 0.20
Nodes (9): E: Snaptrap, LMB: Thorn Volley, Nature playtest report, Passive: Regrowth (1.5 HP/s), Q: Parasite Seed, R: World Tree, RMB: Entangle, Shared (not nature-specific) (+1 more)

### Community 52 - "Ink playtest report"
Cohesion: 0.20
Nodes (9): E: Ink Pool, Ink playtest report, LMB: Ink Bolt, Passive: Bleeding Ink (kill splash 15 in 3 m, inked -25% speed), Performance (measured), Q: Ink Koi, R: Ink Dragon (ultimate), RMB: Brush Stroke (+1 more)

### Community 53 - "Plasma playtest report"
Cohesion: 0.22
Nodes (8): E: Thermal Lance (cd 6, 40 pierce in a 12 m line, burn line 6 / .4 s above 50 Heat), LMB: Plasma Bolt (cd .28, 11 + 4 splash, heat 9), Passive: Heat (+0.5% dmg per Heat, overheat at 100 = 25 dmg vent + 2.5 s lock, cools 15/s), Plasma playtest report, Q: Vent (cd 7, 20 + .9 x Heat, r 4 + Heat/30), R: Fusion Beam (ult, 4 s, 15 per .1 s per enemy on a 40 m ray), RMB: Plasma Cannon (charge 1.1 s, cd 3.5, 25-85 dmg, blast r 2-4.5), Top 3

### Community 54 - "Soul playtest report"
Cohesion: 0.22
Nodes (8): E: Soulstorm (lines 1900-1909), LMB: Soulfire (`js/elements.js` line 1866), Passive: Soulbound (`js/sim.js` lines 106, 410, 424), Q: Soul Rend (lines 1892-1899), R: The Reaper (lines 1910-1926), RMB: Reap (lines 1874-1891), Soul playtest report, Top 3

### Community 55 - "Rune playtest report"
Cohesion: 0.22
Nodes (8): E: Binding Circle, LMB: Rune Bolt, Passive: Rune Mastery, Q: Sigilfall, R: Word of Ruin, RMB: Glyph Trap, Rune playtest report, Top 3

### Community 56 - ".__init__"
Cohesion: 0.40
Nodes (4): center(), lane_angle(), Blender angle (about +Z) from island k toward island j: where the bridge lands., coll()

### Community 57 - "Frost playtest report"
Cohesion: 0.20
Nodes (9): E: Frost Nova, Frost playtest report, LMB: Ice Shard, Passive: Permafrost (4 hits -> freeze 1.8 s, frozen take +40%), Performance (measured), Q: Ice Wall, R: Blizzard (ultimate), RMB: Glacial Lance (+1 more)

### Community 58 - "beamFx"
Cohesion: 0.40
Nodes (5): aimBeam(), beamFx(), beamMesh(), laserFx(), prismRays()

### Community 59 - "wardView"
Cohesion: 0.50
Nodes (4): dropFade(), wardMake(), wardUpd(), wardView()

### Community 60 - "animWizard"
Cohesion: 0.67
Nodes (3): animWizard(), wizardGhost(), wizardPuff()

### Community 62 - "Bone playtest report"
Cohesion: 0.20
Nodes (9): Bone playtest report, E: Bone Cage, LMB: Bone Toss, Passive: Raise Dead (25% raise, Brittle +12%), Performance (measured), Q: Marrow Burst, R: Bone Dragon (ultimate), RMB: Cackling Skull (+1 more)

### Community 64 - "Blades playtest report"
Cohesion: 0.22
Nodes (8): Blades playtest report, E: Rain of Blades (cd 11, 12 x 20 in r 1.8 stabs, 6 s field, 30% slow, pick-up), LMB: Flying Daggers (cd .35, 2 x 7.5, home 2), Passive: Sword Halo (+1 sword / 2.5 s, max 6; guard 18 dmg to anything within 3 m every .35 s, costs a sword), Q: Blade Dance (cd 8, 9 m dash, 32 dmg in a 1.8 m lane, +2 swords), R: Colossal Blade (ult, 130 impact r 6 + 5 x 26 waves, halo to 6), RMB: Sword Volley (cd 2.5, max(2, swords) x 24, pierce 3), Top 3

### Community 66 - "Laser playtest report"
Cohesion: 0.22
Nodes (8): E: Laser Drone (lines 2050-2063), Laser playtest report, LMB: Pulse Laser (line 2037), Passive: Ricochet and Focus (laserShot, lines 35-61), Q: Refractor (lines 2042-2049), R: Prism Nova (lines 2064-2089, novaBeams line 63), RMB: Ricochet Beam (line 2040), Top 3

### Community 67 - "Mage Arena playtest report (all 30 elements)"
Cohesion: 0.25
Nodes (7): Balance (median of 30: crowd 218.1 dps, boss 137.1 dps), Harness caveats, Mage Arena playtest report (all 30 elements), Performance hot list (peak particles in one move; the pool holds 4000), Second theme: effects that blind your own view, The one big bug: ultimates recharge themselves, Top changes by element

### Community 68 - "Blood playtest report"
Cohesion: 0.22
Nodes (8): Blood playtest report, E: Crimson Mire (cd 9, 4 s pool, 10 dmg per .5 s, pull 22), LMB: Blood Bolt (cd .4, 21 dmg), Passive: Bloodlust (2.5% steal, bleed leech .1, up to +50% dmg at low HP), Q: Exsanguinate (cd 8), R: Blood Moon (ult, 4 s, 7 dmg per .25 s to 12 enemies, death pop 30 AoE), RMB: Crimson Fan (cd 3.5, 5 x 16, pierce 99), Top 3

### Community 69 - "Earth playtest report"
Cohesion: 0.20
Nodes (9): E: Fissure (cd 10, 12 spikes x 28 dmg, line from 3 m to 16.75 m), Earth playtest report, LMB: Stone Shot (cd .7, 5 x 10 dmg, spread ±.13), Other, Passive: Bedrock (15% less damage, poise x2, st vuln .1), Q: Stone Pillar (aim, cd 9, 26 dmg, lift 12, solid wall for 6 s), R: Tectonic Quake (ult, 4 quakes x 40 dmg, 12 m, stun 1.2), RMB: Boulder (cd 5, 38 dmg pierce + 20 AoE at end) (+1 more)

### Community 70 - "Water playtest report"
Cohesion: 0.22
Nodes (8): E - Surf (cd 9, 24 dmg per enemy, 14 m dash), LMB - Aqua Bullets (cd .14, 10.5 dmg, kb 4.5), Passive - Tidal Force (st.kb 1.6), Q - Bubble Prison (cd 9, 10 dmg, 3 s bubble, +30% damage taken), R - Tsunami (ultimate, 110 per enemy, 2.6 s), RMB - Water Whip (cd 3.5, 22 / 44 tip + .5 s stun), Top 3, Water playtest report

### Community 71 - "Shadow playtest report"
Cohesion: 0.22
Nodes (8): E: Shadow Swap (cd 9, 14 dmg, swap + stun 1.5 s facing away), LMB: Shadow Daggers (cd .45, 3 x 10.5), Passive: Assassin (+50% from behind, Cursed +15%), Q: Shadow Snare (cd 7, 12 dmg, pull 6, root 1.5 s, +40% dmg taken 1.5 s), R: Night Terror (ult, r 18, up to 12 targets, 18 per .5 s for 5 s + 50 burst), RMB: Blackout (cd 6, 16 dmg once, stun 1.5 s, 3 s cloud r 3), Shadow playtest report, Top 3

### Community 73 - "Storm playtest report"
Cohesion: 0.22
Nodes (8): E: Tesla Coil (cd 13, life 9, zaps 3 every 0.45 s for 10/7/7, fence 9 every 0.3 s), LMB: Chain Lightning (cd 0.36, 6 dmg, chains 2 at 75%), Passive: Static (every 8th Storm hit drops a 16-dmg sky strike; Shocked takes +15%), Q: Thunderclap (cd 7, 0.45 s delay, 38 dmg r3.5 + stun 0.8, then 3 jumps x20), R: Thunderstorm (ult, cloud follows you for 5 s, a 38-dmg r1.6 sky bolt + 0.25 s stun every 0.24 s), RMB: Ball Lightning (cd 6, orb 6 dmg pierce, zaps 2 targets x5 every 0.25 s, burst 20), Storm playtest report, Top 3

### Community 79 - "Chrono playtest report"
Cohesion: 0.22
Nodes (8): Chrono playtest report, E: Slow Field (cd 13, r 6, 6 s, 70% slow), LMB: Chrono Bolt (cd .45, 16 dmg + 16 echo after 1.2 s), Passive: Time Dilation (cooldowns ×0.82, timeworn slow .35), Q: Rewind (cd 6, 8 mark dmg, snap 35 + 14/m up to +200, +150 vs boss), R: Time Stop (ult, 4 s, damage stored ×1.5), RMB: Stasis (cd 8, 6 dmg, stores damage ×1.3 for 3 s), Top 3

## Knowledge Gaps
- **514 isolated node(s):** `AREAS`, `ISLES`, `FOE_ATK`, `RIMC`, `ISLE_FIRE` (+509 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 741 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `r2()` connect `r2` to `sim.js`, `core.js`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Why does `laserShot()` connect `r2` to `elements.js`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `chainBolt()` connect `r2` to `elements.js`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Are the 59 inferred relationships involving `TRS()` (e.g. with `arm_l()` and `finger()`) actually correct?**
  _`TRS()` has 59 INFERRED edges - model-reasoned connections that need verification._
- **Are the 30 inferred relationships involving `aim()` (e.g. with `limb()` and `sleeve()`) actually correct?**
  _`aim()` has 30 INFERRED edges - model-reasoned connections that need verification._
- **Are the 11 inferred relationships involving `Mesh` (e.g. with `spell_circle()` and `wpart()`) actually correct?**
  _`Mesh` has 11 INFERRED edges - model-reasoned connections that need verification._
- **What connects `AREAS`, `ISLES`, `FOE_ATK` to the rest of the system?**
  _514 weakly-connected nodes found - possible documentation gaps or missing edges._