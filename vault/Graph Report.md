# Graph Report - Test Game  (2026-10-26)

## Corpus Check
- 24 files · ~130,877 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 2)

## Summary
- 639 nodes · 1193 edges · 26 communities (19 shown, 7 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 46 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `044c52e5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- sim.js
- core.js
- dungeon.js
- view.js
- build_enemies.py
- net.js
- Mesh
- elements.js
- Elements.md
- lib.py
- Audio credits
- build_elements.py
- boltFx
- modes.js
- SFX
- addShader
- clamp
- css
- lockMouse
- playMood
- Mage Arena
- initAudio
- Elements
- keyName
- pol

## God Nodes (most connected - your core abstractions)
1. `Elements` - 36 edges
2. `ev()` - 24 edges
3. `Mesh` - 23 edges
4. `react()` - 21 edges
5. `stepEnemies()` - 21 edges
6. `stats()` - 19 edges
7. `push()` - 18 edges
8. `TRS()` - 15 edges
9. `damage()` - 15 edges
10. `stepPlayers()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `Blender Assets` --references--> `sigil()`  [INFERRED]
  vault/Blender Assets.md → blender/build_elements.py
- `Blender Assets` --references--> `Mesh`  [INFERRED]
  vault/Blender Assets.md → blender/lib.py
- `Finishing pass` --references--> `bake_ao()`  [INFERRED]
  vault/Blender Assets.md → blender/lib.py
- `In-game look` --references--> `energyMat()`  [INFERRED]
  vault/Blender Assets.md → js/core.js
- `In-game look` --references--> `model()`  [INFERRED]
  vault/Blender Assets.md → js/core.js

## Import Cycles
- None detected.

## Communities (26 total, 7 thin omitted)

### Community 0 - "sim.js"
Cohesion: 0.07
Nodes (89): r2(), addUlt(), aimOf(), alive(), aoe(), applyStatus(), blast(), bomberBlast() (+81 more)

### Community 1 - "core.js"
Cohesion: 0.02
Nodes (68): amb, ARENA_PILLARS, BH, BH_L, BIND, BIND_DEF, _c, camera (+60 more)

### Community 2 - "dungeon.js"
Cohesion: 0.07
Nodes (55): add(), anchor(), ARRIVE, block(), BUCKET, buildDungeonView(), buildFloor(), buildHall() (+47 more)

### Community 3 - "view.js"
Cohesion: 0.05
Nodes (61): animEnemy(), bestFor(), buildBar(), castFx(), CC_OV, COMBO_FX, DIFF, distTo() (+53 more)

### Community 4 - "build_enemies.py"
Cohesion: 0.11
Nodes (30): digit(), finger(), fist(), limb(), open_hand(), palm(), sleeve(), arm() (+22 more)

### Community 5 - "net.js"
Cohesion: 0.11
Nodes (32): applySettings(), autoQuality(), bfSnap(), bgTick(), BIND_NAMES, dropGuest(), footsteps(), frame() (+24 more)

### Community 6 - "Mesh"
Cohesion: 0.10
Nodes (5): spell_circle(), part(), apply_subsurf(), area(), Mesh

### Community 7 - "elements.js"
Cohesion: 0.07
Nodes (27): aimBeam(), beamFx(), beamMesh(), _bgeo, blastFx(), boomAt(), boomFx(), chainBolt() (+19 more)

### Community 8 - "Elements.md"
Cohesion: 0.08
Nodes (22): grab(), sp(), Blender Assets, Conventions, Combos (reactions), Named reactions, Reaction kinds (for every other pair), Enemies (+14 more)

### Community 9 - "lib.py"
Cohesion: 0.10
Nodes (8): apply_bevel(), bake_ao(), basis(), pack_bundle(), Previewer, runes(), uv_ribbon(), Finishing pass

### Community 10 - "Audio credits"
Cohesion: 0.50
Nodes (3): Audio credits, Music (`audio/music/`), Sound effects (`audio/sfx/`, file names kept from the packs)

### Community 11 - "build_elements.py"
Cohesion: 0.14
Nodes (14): arcpts(), crescent(), crescent_blade(), lens(), M(), mirror_shard(), plated_rock(), put() (+6 more)

### Community 12 - "boltFx"
Cohesion: 0.18
Nodes (17): addFx(), animateArena(), boltFx(), burst(), circleFx(), easeOutBack(), emit(), glowify() (+9 more)

### Community 13 - "modes.js"
Cohesion: 0.27
Nodes (7): applyMap(), DUEL_SPOTS, duelReset(), showScenery(), startDuel(), startMode(), stepDuel()

### Community 16 - "addShader"
Cohesion: 0.25
Nodes (9): addShader(), beamMat(), discMat(), easeOut(), energyMat(), flameMat(), model(), pillarFx() (+1 more)

### Community 18 - "clamp"
Cohesion: 0.50
Nodes (4): clamp(), localInput(), pollPad(), setupTouch()

### Community 19 - "css"
Cohesion: 0.67
Nodes (3): comboText(), css(), tintRig()

### Community 21 - "playMood"
Cohesion: 1.00
Nodes (3): MUSIC, playMood(), track()

### Community 26 - "Elements"
Cohesion: 0.06
Nodes (36): 🐙 Abyss, 🔮 Arcane, Balance, 🗡️ Blades, 🩸 Blood, 💀 Bone, ⏳ Chrono, 🌠 Cosmic (+28 more)

## Knowledge Gaps
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Blender Assets` connect `Elements.md` to `lib.py`, `build_elements.py`, `Mesh`, `elements.js`?**
  _High betweenness centrality (0.285) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `react()` (e.g. with `r2()` and `Combos (reactions)`) actually correct?**
  _`react()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `sim.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0661512027491409 - nodes in this community are weakly interconnected._
- **Why does `r2()` connect `sim.js` to `core.js`, `elements.js`?**
  _High betweenness centrality (0.226) - this node is a cross-community bridge._
- **Should `core.js` be split into smaller, more focused modules?**
  _Cohesion score 0.023255813953488372 - nodes in this community are weakly interconnected._
- **Why does `Mesh` connect `Mesh` to `Elements.md`, `lib.py`, `build_elements.py`, `pol`?**
  _High betweenness centrality (0.188) - this node is a cross-community bridge._
- **Should `dungeon.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07486338797814207 - nodes in this community are weakly interconnected._