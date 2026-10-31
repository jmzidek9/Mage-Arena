# Graph Report - Test Game  (2026-10-30)

## Corpus Check
- 31 files · ~181,803 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 2)

## Summary
- 888 nodes · 1788 edges · 31 communities (27 shown, 4 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 120 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5da948e3`
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
- boltFx
- addShader
- Mage Arena
- clamp
- renderLobby
- Elements
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
- `In-game look` --references--> `energyMat()`  [INFERRED]
  vault/Blender Assets.md → js/core.js
- `In-game look` --references--> `model()`  [INFERRED]
  vault/Blender Assets.md → js/core.js

## Import Cycles
- None detected.

## Communities (31 total, 4 thin omitted)

### Community 0 - "sim.js"
Cohesion: 0.06
Nodes (92): r2(), addUlt(), aimOf(), alive(), aoe(), applyStatus(), blast(), bomberBlast() (+84 more)

### Community 1 - "core.js"
Cohesion: 0.02
Nodes (68): amb, ARENA_PILLARS, BH, BH_L, BIND, BIND_DEF, _c, camera (+60 more)

### Community 2 - "dungeon.js"
Cohesion: 0.07
Nodes (55): add(), anchor(), ARRIVE, block(), BUCKET, buildDungeonView(), buildFloor(), buildHall() (+47 more)

### Community 3 - "view.js"
Cohesion: 0.05
Nodes (35): buildBar(), CASTS, CC_OV, COMBO_FX, DIFF, ELMETA, ETPL, FALLBACK (+27 more)

### Community 4 - "lib.py"
Cohesion: 0.06
Nodes (32): sbody(), build_crypt(), branch(), gravestone(), skull(), build_frost(), rim(), build_hell() (+24 more)

### Community 5 - "net.js"
Cohesion: 0.11
Nodes (32): applySettings(), autoQuality(), bfSnap(), bgTick(), BIND_NAMES, dropGuest(), footsteps(), frame() (+24 more)

### Community 6 - "Mesh"
Cohesion: 0.10
Nodes (6): spell_circle(), part(), bridge(), apply_subsurf(), area(), Mesh

### Community 7 - "elements.js"
Cohesion: 0.06
Nodes (32): aimBeam(), beamFx(), beamMesh(), _bgeo, blastFx(), boomAt(), boomFx(), chainBolt() (+24 more)

### Community 8 - "Elements.md"
Cohesion: 0.07
Nodes (24): Combos (reactions), Named reactions, Reaction kinds (for every other pair), Enemies, Fighting them, Wave budget, Wave modifiers, Cross-platform (+16 more)

### Community 9 - "TRS"
Cohesion: 0.05
Nodes (78): arm(), barm(), boss_arm(), boss_body(), brute_body(), claws(), dkbody(), ellipsoid() (+70 more)

### Community 10 - "Audio credits"
Cohesion: 0.33
Nodes (5): Audio credits, Music (`audio/music/`), Sound effects (`audio/sfx/`, file names kept from the packs), pickSample(), SFX

### Community 11 - "build_elements.py"
Cohesion: 0.12
Nodes (17): arcpts(), blob_cloud(), crescent(), crescent_blade(), lens(), M(), mirror_shard(), plated_rock() (+9 more)

### Community 12 - "areas.js"
Cohesion: 0.10
Nodes (16): AREAS, bridgeEnds(), easeBack(), FOE_ATK, islandFrame(), islandInit(), islandMap(), ISLE_FIRE (+8 more)

### Community 13 - "modes.js"
Cohesion: 0.27
Nodes (7): applyMap(), DUEL_SPOTS, duelReset(), showScenery(), startDuel(), startMode(), stepDuel()

### Community 14 - "renderWorld"
Cohesion: 0.17
Nodes (15): animEnemy(), makeEnemy(), makeEnt(), makeShot(), makeWizard(), me(), renderAuras(), renderChannels() (+7 more)

### Community 15 - "city.js"
Cohesion: 0.05
Nodes (70): arenaMat(), arenaObj(), blockAt(), buildCityView(), buildKit(), cboxGeo(), CBX, CITY (+62 more)

### Community 16 - "build_assets.py"
Cohesion: 0.22
Nodes (7): digit(), finger(), fist(), limb(), open_hand(), palm(), sleeve()

### Community 18 - "boltFx"
Cohesion: 0.18
Nodes (18): addFx(), animateArena(), boltFx(), burst(), circleFx(), easeOut(), easeOutBack(), emit() (+10 more)

### Community 19 - "addShader"
Cohesion: 0.25
Nodes (9): addShader(), beamMat(), discMat(), energyMat(), fireMat(), flameMat(), model(), pillarFx() (+1 more)

### Community 23 - "clamp"
Cohesion: 0.50
Nodes (4): clamp(), localInput(), pollPad(), setupTouch()

### Community 25 - "renderLobby"
Cohesion: 0.25
Nodes (11): bestFor(), pickMode(), pvShow(), renderDetail(), renderLobby(), renderModes(), runXP(), savePick() (+3 more)

### Community 26 - "Elements"
Cohesion: 0.06
Nodes (36): 🐙 Abyss, 🔮 Arcane, Balance, 🗡️ Blades, 🩸 Blood, 💀 Bone, ⏳ Chrono, 🌠 Cosmic (+28 more)

### Community 28 - "onEvent"
Cohesion: 0.40
Nodes (6): castFx(), distTo(), meteorFall(), onEvent(), teleFx(), teleMat()

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
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Blender Assets` connect `build_elements.py` to `Elements.md`, `elements.js`, `Mesh`, `grab`?**
  _High betweenness centrality (0.366) - this node is a cross-community bridge._
- **Are the 14 inferred relationships involving `build_hell()` (e.g. with `rim()` and `cage()`) actually correct?**
  _`build_hell()` has 14 INFERRED edges - model-reasoned connections that need verification._
- **Should `sim.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06363636363636363 - nodes in this community are weakly interconnected._
- **Why does `Mesh` connect `Mesh` to `TRS`, `build_elements.py`, `lib.py`?**
  _High betweenness centrality (0.237) - this node is a cross-community bridge._
- **Are the 14 inferred relationships involving `build_frost()` (e.g. with `cluster()` and `fallen()`) actually correct?**
  _`build_frost()` has 14 INFERRED edges - model-reasoned connections that need verification._
- **Should `core.js` be split into smaller, more focused modules?**
  _Cohesion score 0.023255813953488372 - nodes in this community are weakly interconnected._
- **Why does `In-game look` connect `elements.js` to `addShader`, `build_elements.py`?**
  _High betweenness centrality (0.161) - this node is a cross-community bridge._