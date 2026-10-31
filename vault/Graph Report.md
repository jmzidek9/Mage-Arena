# Graph Report - Test Game  (2026-10-31)

## Corpus Check
- 31 files · ~184,252 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 2)

## Summary
- 899 nodes · 1811 edges · 36 communities (31 shown, 5 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 120 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `887b8893`
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
- TRS
- Audio credits
- build_elements.py
- areas.js
- modes.js
- renderWorld
- city.js
- build_assets.py
- Similar moves (reviewed 2026-10-27)
- boltFx
- addShader
- rand
- Mage Arena
- Mage Arena
- clamp
- Enemies
- renderLobby
- Elements
- Netcode
- onEvent
- gainXP
- grab
- css
- MUSIC
- initAudio
- keyName
- lockMouse

## God Nodes (most connected - your core abstractions)
1. `TRS()` - 53 edges
2. `Elements` - 36 edges
3. `build_hell()` - 30 edges
4. `build_frost()` - 27 edges
5. `pol()` - 27 edges
6. `Mesh` - 27 edges
7. `build_crypt()` - 26 edges
8. `build_void()` - 26 edges
9. `ev()` - 24 edges
10. `ell()` - 23 edges

## Surprising Connections (you probably didn't know these)
- `Finishing pass` --references--> `bake_ao()`  [INFERRED]
  vault/Blender Assets.md → blender/lib.py
- `Blender Assets` --references--> `Mesh`  [INFERRED]
  vault/Blender Assets.md → blender/lib.py
- `Layout` --references--> `cityLayout()`  [INFERRED]
  vault/Mage City.md → js/city.js
- `Flow` --references--> `onEvent()`  [INFERRED]
  vault/Netcode.md → js/view.js
- `Blender Assets` --references--> `sigil()`  [INFERRED]
  vault/Blender Assets.md → blender/build_elements.py

## Import Cycles
- None detected.

## Communities (36 total, 5 thin omitted)

### Community 0 - "sim.js"
Cohesion: 0.06
Nodes (95): r2(), addUlt(), aimOf(), alive(), aoe(), applyStatus(), blast(), bomberBlast() (+87 more)

### Community 1 - "core.js"
Cohesion: 0.02
Nodes (68): amb, ARENA_PILLARS, BH, BH_L, BIND, BIND_DEF, _c, camera (+60 more)

### Community 2 - "dungeon.js"
Cohesion: 0.07
Nodes (55): add(), anchor(), ARRIVE, block(), BUCKET, buildDungeonView(), buildFloor(), buildHall() (+47 more)

### Community 3 - "view.js"
Cohesion: 0.05
Nodes (38): BOSS_COL, buildBar(), CASTS, CC_OV, COMBO_FX, DIFF, ELMETA, ETPL (+30 more)

### Community 4 - "lib.py"
Cohesion: 0.07
Nodes (30): build_crypt(), branch(), gravestone(), build_frost(), rim(), build_hell(), rim(), build_void() (+22 more)

### Community 5 - "net.js"
Cohesion: 0.10
Nodes (35): applySettings(), autoQuality(), bfSnap(), bgTick(), BIND_NAMES, CHEAT_TOGGLES, cheatSpawn(), dropGuest() (+27 more)

### Community 6 - "Mesh"
Cohesion: 0.10
Nodes (6): spell_circle(), part(), bridge(), apply_subsurf(), area(), Mesh

### Community 7 - "elements.js"
Cohesion: 0.05
Nodes (35): energyMat(), flameMat(), model(), aimBeam(), beamFx(), beamMesh(), _bgeo, blastFx() (+27 more)

### Community 9 - "TRS"
Cohesion: 0.05
Nodes (80): arm(), barm(), boss_arm(), boss_body(), brute_body(), claws(), dkbody(), ellipsoid() (+72 more)

### Community 10 - "Audio credits"
Cohesion: 0.33
Nodes (5): Audio credits, Music (`audio/music/`), Sound effects (`audio/sfx/`, file names kept from the packs), pickSample(), SFX

### Community 11 - "build_elements.py"
Cohesion: 0.12
Nodes (17): arcpts(), blob_cloud(), crescent(), crescent_blade(), lens(), M(), mirror_shard(), plated_rock() (+9 more)

### Community 12 - "areas.js"
Cohesion: 0.10
Nodes (17): AREAS, bridgeEnds(), easeBack(), FOE_ATK, goIsland(), islandFrame(), islandInit(), islandMap() (+9 more)

### Community 13 - "modes.js"
Cohesion: 0.27
Nodes (7): applyMap(), DUEL_SPOTS, duelReset(), showScenery(), startDuel(), startMode(), stepDuel()

### Community 14 - "renderWorld"
Cohesion: 0.21
Nodes (12): makeEnt(), makeShot(), makeWizard(), me(), renderAuras(), renderChannels(), renderEnts(), renderPartner() (+4 more)

### Community 15 - "city.js"
Cohesion: 0.05
Nodes (70): arenaMat(), arenaObj(), blockAt(), buildCityView(), buildKit(), cboxGeo(), CBX, CITY (+62 more)

### Community 16 - "build_assets.py"
Cohesion: 0.22
Nodes (7): digit(), finger(), fist(), limb(), open_hand(), palm(), sleeve()

### Community 17 - "Similar moves (reviewed 2026-10-27)"
Cohesion: 0.25
Nodes (6): Alike within one element, Similar moves (reviewed 2026-10-27), Similar (same role, different twist), Very similar (near-duplicates), Done (2026-10-27), To-do (noted 2026-10-26)

### Community 18 - "boltFx"
Cohesion: 0.27
Nodes (12): addFx(), boltFx(), circleFx(), easeOut(), easeOutBack(), glowify(), glowMats(), makeCircle() (+4 more)

### Community 19 - "addShader"
Cohesion: 0.40
Nodes (6): addShader(), beamMat(), discMat(), fireMat(), pillarFx(), waveMat()

### Community 20 - "rand"
Cohesion: 0.40
Nodes (6): animateArena(), burst(), emit(), popNum(), rand(), V()

### Community 21 - "Mage Arena"
Cohesion: 0.33
Nodes (6): Controls, Core loop (Arena), Mage Arena, Progression, Why it's replayable, Why it's satisfying

### Community 23 - "clamp"
Cohesion: 0.50
Nodes (4): clamp(), localInput(), pollPad(), setupTouch()

### Community 24 - "Enemies"
Cohesion: 0.50
Nodes (4): Enemies, Fighting them, Wave budget, Wave modifiers

### Community 25 - "renderLobby"
Cohesion: 0.25
Nodes (11): bestFor(), pickMode(), pvShow(), renderDetail(), renderLobby(), renderModes(), runXP(), savePick() (+3 more)

### Community 26 - "Elements"
Cohesion: 0.06
Nodes (36): 🐙 Abyss, 🔮 Arcane, Balance, 🗡️ Blades, 🩸 Blood, 💀 Bone, ⏳ Chrono, 🌠 Cosmic (+28 more)

### Community 27 - "Netcode"
Cohesion: 0.50
Nodes (3): Cross-platform, Known ceilings (`ponytail:` comments in the code), Netcode

### Community 28 - "onEvent"
Cohesion: 0.22
Nodes (13): animEnemy(), bossAnim(), bossCol(), bossDeath(), bossWind(), castFx(), distTo(), makeEnemy() (+5 more)

### Community 29 - "gainXP"
Cohesion: 0.47
Nodes (6): gainXP(), needXP(), renderProg(), renderTalents(), saveProg(), xpBar()

### Community 30 - "grab"
Cohesion: 0.67
Nodes (3): grab(), sp(), Conventions

### Community 32 - "css"
Cohesion: 0.67
Nodes (3): comboText(), css(), tintRig()

### Community 33 - "MUSIC"
Cohesion: 1.00
Nodes (3): MUSIC, playMood(), track()

## Knowledge Gaps
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Blender Assets` connect `build_elements.py` to `Elements.md`, `elements.js`, `Mesh`, `grab`?**
  _High betweenness centrality (0.361) - this node is a cross-community bridge._
- **Are the 14 inferred relationships involving `build_hell()` (e.g. with `rim()` and `cage()`) actually correct?**
  _`build_hell()` has 14 INFERRED edges - model-reasoned connections that need verification._
- **Should `sim.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06072720350276033 - nodes in this community are weakly interconnected._
- **Why does `Mesh` connect `Mesh` to `TRS`, `build_elements.py`, `lib.py`?**
  _High betweenness centrality (0.234) - this node is a cross-community bridge._
- **Are the 14 inferred relationships involving `build_frost()` (e.g. with `cluster()` and `fallen()`) actually correct?**
  _`build_frost()` has 14 INFERRED edges - model-reasoned connections that need verification._
- **Should `core.js` be split into smaller, more focused modules?**
  _Cohesion score 0.023255813953488372 - nodes in this community are weakly interconnected._
- **Why does `r2()` connect `sim.js` to `core.js`, `elements.js`?**
  _High betweenness centrality (0.158) - this node is a cross-community bridge._