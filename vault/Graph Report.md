# Graph Report - Test Game  (2026-11-03)

## Corpus Check
- 33 files · ~226,443 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 2)

## Summary
- 986 nodes · 2049 edges · 36 communities (33 shown, 3 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 144 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3af88e58`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- sim.js
- core.js
- dungeon.js
- view.js
- lib.py
- net.js
- Mesh
- elements.js
- Elements.md
- Audio credits
- build_elements.py
- areas.js
- modes.js
- renderWorld
- city.js
- build_foes.py
- build_enemies.py
- boltFx
- addShader
- part
- Mage Arena
- clamp
- TRS
- renderLobby
- Elements
- rand
- onEvent
- icons.js
- animEnemy
- blocks.js
- css
- MUSIC
- initAudio
- keyName
- lockMouse
- grab

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
- `Finishing pass` --references--> `bake_ao()`  [INFERRED]
  vault/Blender Assets.md → blender/lib.py
- `Spell icons` --references--> `fire()`  [INFERRED]
  CLAUDE.md → js/sim.js
- `Blender Assets` --references--> `sigil()`  [INFERRED]
  vault/Blender Assets.md → blender/build_elements.py
- `Blender Assets` --references--> `Mesh`  [INFERRED]
  vault/Blender Assets.md → blender/lib.py
- `Layout` --references--> `cityLayout()`  [INFERRED]
  vault/Mage City.md → js/city.js

## Import Cycles
- None detected.

## Communities (36 total, 3 thin omitted)

### Community 0 - "sim.js"
Cohesion: 0.06
Nodes (99): r2(), addUlt(), aimOf(), alive(), aoe(), applyStatus(), blast(), bomberBlast() (+91 more)

### Community 1 - "core.js"
Cohesion: 0.02
Nodes (68): amb, ARENA_PILLARS, BH, BH_L, BIND, BIND_DEF, _c, camera (+60 more)

### Community 2 - "dungeon.js"
Cohesion: 0.07
Nodes (55): add(), anchor(), ARRIVE, block(), BUCKET, buildDungeonView(), buildFloor(), buildHall() (+47 more)

### Community 3 - "view.js"
Cohesion: 0.05
Nodes (40): BOSS_COL, BOSS_GAIT, buildBar(), CASTS, CC_OV, COMBO_FX, DIFF, ELMETA (+32 more)

### Community 4 - "lib.py"
Cohesion: 0.07
Nodes (31): build_crypt(), branch(), gravestone(), build_frost(), rim(), build_hell(), rim(), build_void() (+23 more)

### Community 5 - "net.js"
Cohesion: 0.10
Nodes (36): applySettings(), autoQuality(), bfSnap(), bgTick(), BIND_NAMES, CHEAT_TOGGLES, cheatSpawn(), dropGuest() (+28 more)

### Community 6 - "Mesh"
Cohesion: 0.13
Nodes (7): spell_circle(), bridge(), bridge_gate(), bridge_pier(), bridge_post(), horn_(), Mesh

### Community 7 - "elements.js"
Cohesion: 0.05
Nodes (34): energyMat(), model(), aimBeam(), beamFx(), beamMesh(), _bgeo, blastFx(), boomAt() (+26 more)

### Community 8 - "Elements.md"
Cohesion: 0.07
Nodes (23): Blender Assets, Finishing pass, Enemies, Fighting them, Wave budget, Wave modifiers, Cross-platform, Known ceilings (`ponytail:` comments in the code) (+15 more)

### Community 10 - "Audio credits"
Cohesion: 0.33
Nodes (5): Audio credits, Music (`audio/music/`), Sound effects (`audio/sfx/`, file names kept from the packs), pickSample(), SFX

### Community 11 - "build_elements.py"
Cohesion: 0.08
Nodes (22): digit(), finger(), fist(), limb(), open_hand(), palm(), sleeve(), arcpts() (+14 more)

### Community 12 - "areas.js"
Cohesion: 0.08
Nodes (33): addPool(), AREAS, aroundIsle(), bridgeEnds(), bsc(), die(), easeBack(), FOE_ATK (+25 more)

### Community 13 - "modes.js"
Cohesion: 0.27
Nodes (7): applyMap(), DUEL_SPOTS, duelReset(), showScenery(), startDuel(), startMode(), stepDuel()

### Community 14 - "renderWorld"
Cohesion: 0.21
Nodes (12): makeEnt(), makeShot(), makeWizard(), me(), renderAuras(), renderChannels(), renderEnts(), renderPartner() (+4 more)

### Community 15 - "city.js"
Cohesion: 0.05
Nodes (73): arenaMat(), arenaObj(), blockAt(), buildCityView(), buildKit(), cboxGeo(), CBX, CITY (+65 more)

### Community 16 - "build_foes.py"
Cohesion: 0.11
Nodes (35): ba_arm(), bake_scale(), bd_body(), biped(), arm(), leg(), claws(), cn_arm() (+27 more)

### Community 17 - "build_enemies.py"
Cohesion: 0.20
Nodes (18): arm(), claws(), dkbody(), ellipsoid(), horn(), kbody(), leg(), legq() (+10 more)

### Community 18 - "boltFx"
Cohesion: 0.27
Nodes (12): addFx(), boltFx(), circleFx(), easeOut(), easeOutBack(), glowify(), glowMats(), makeCircle() (+4 more)

### Community 19 - "addShader"
Cohesion: 0.33
Nodes (7): addShader(), beamMat(), discMat(), fireMat(), flameMat(), pillarFx(), waveMat()

### Community 21 - "part"
Cohesion: 0.16
Nodes (11): beast(), legq(), caster(), sbody(), floater(), tent(), keg(), knight() (+3 more)

### Community 22 - "Mage Arena"
Cohesion: 0.50
Nodes (3): Knowledge, Mage Arena, Spell icons

### Community 23 - "clamp"
Cohesion: 0.50
Nodes (4): clamp(), localInput(), pollPad(), setupTouch()

### Community 24 - "TRS"
Cohesion: 0.09
Nodes (41): barm(), boss_arm(), boss_body(), boss_sword(), brute_body(), ba_body(), bwing(), bz_arm() (+33 more)

### Community 25 - "renderLobby"
Cohesion: 0.19
Nodes (16): bestFor(), gainXP(), needXP(), PICKABLE(), pvShow(), renderDetail(), renderLobby(), renderProg() (+8 more)

### Community 26 - "Elements"
Cohesion: 0.06
Nodes (36): 🐙 Abyss, 🔮 Arcane, Balance, 🗡️ Blades, 🩸 Blood, 💀 Bone, ⏳ Chrono, 🌠 Cosmic (+28 more)

### Community 27 - "rand"
Cohesion: 0.40
Nodes (6): animateArena(), burst(), emit(), popNum(), rand(), V()

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

### Community 38 - "grab"
Cohesion: 0.67
Nodes (3): grab(), sp(), Conventions

## Knowledge Gaps
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Blender Assets` connect `Elements.md` to `grab`, `build_elements.py`, `Mesh`, `elements.js`?**
  _High betweenness centrality (0.342) - this node is a cross-community bridge._
- **Are the 14 inferred relationships involving `build_hell()` (e.g. with `rim()` and `cage()`) actually correct?**
  _`build_hell()` has 14 INFERRED edges - model-reasoned connections that need verification._
- **Should `sim.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05801445953094692 - nodes in this community are weakly interconnected._
- **Why does `Mesh` connect `Mesh` to `lib.py`, `Elements.md`, `build_elements.py`, `build_enemies.py`, `part`?**
  _High betweenness centrality (0.234) - this node is a cross-community bridge._
- **Should `core.js` be split into smaller, more focused modules?**
  _Cohesion score 0.023255813953488372 - nodes in this community are weakly interconnected._
- **Why does `r2()` connect `sim.js` to `core.js`, `elements.js`?**
  _High betweenness centrality (0.146) - this node is a cross-community bridge._
- **Should `dungeon.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07486338797814207 - nodes in this community are weakly interconnected._