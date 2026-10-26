# Graph Report - Test Game  (2026-10-25)

## Corpus Check
- 23 files · ~96,682 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 2)

## Summary
- 558 nodes · 1052 edges · 22 communities (19 shown, 3 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 36 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4dc2cf6f`
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
- Elements
- build_elements.py
- boltFx
- modes.js
- Blender Assets
- addShader
- rand
- clamp
- css
- lockMouse
- Mage Arena

## God Nodes (most connected - your core abstractions)
1. `ev()` - 24 edges
2. `Mesh` - 23 edges
3. `Elements` - 23 edges
4. `react()` - 21 edges
5. `stepEnemies()` - 20 edges
6. `stats()` - 18 edges
7. `push()` - 18 edges
8. `TRS()` - 15 edges
9. `damage()` - 15 edges
10. `stepPlayers()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `Finishing pass` --references--> `bake_ao()`  [INFERRED]
  vault/Blender Assets.md → blender/lib.py
- `Blender Assets` --references--> `Mesh`  [INFERRED]
  vault/Blender Assets.md → blender/lib.py
- `Combos (reactions)` --references--> `reactionOf()`  [INFERRED]
  vault/Combos.md → js/sim.js
- `Combos (reactions)` --references--> `react()`  [INFERRED]
  vault/Combos.md → js/sim.js
- `Flow` --references--> `onEvent()`  [INFERRED]
  vault/Netcode.md → js/view.js

## Import Cycles
- None detected.

## Communities (22 total, 3 thin omitted)

### Community 0 - "sim.js"
Cohesion: 0.07
Nodes (88): r2(), addUlt(), aimOf(), alive(), aoe(), applyStatus(), blast(), bomberBlast() (+80 more)

### Community 1 - "core.js"
Cohesion: 0.03
Nodes (61): amb, ARENA_PILLARS, BH, BH_L, _c, camera, CIRCLE_PARTS, composer (+53 more)

### Community 2 - "dungeon.js"
Cohesion: 0.07
Nodes (55): add(), anchor(), ARRIVE, block(), BUCKET, buildDungeonView(), buildFloor(), buildHall() (+47 more)

### Community 3 - "view.js"
Cohesion: 0.07
Nodes (44): animEnemy(), bestFor(), buildBar(), castFx(), CC_OV, COMBO_FX, distTo(), ETPL (+36 more)

### Community 4 - "build_enemies.py"
Cohesion: 0.11
Nodes (30): digit(), finger(), fist(), limb(), open_hand(), palm(), sleeve(), arm() (+22 more)

### Community 5 - "net.js"
Cohesion: 0.13
Nodes (28): applySettings(), autoQuality(), bfSnap(), bgTick(), dropGuest(), frame(), guestStep(), last (+20 more)

### Community 6 - "Mesh"
Cohesion: 0.10
Nodes (5): spell_circle(), part(), apply_subsurf(), area(), Mesh

### Community 7 - "elements.js"
Cohesion: 0.09
Nodes (8): aimBeam(), beamFx(), beamMesh(), _bgeo, boomAt(), chainBolt(), ELEMENTS, fxe()

### Community 8 - "Elements.md"
Cohesion: 0.10
Nodes (17): Combos (reactions), Named reactions, Reaction kinds (for every other pair), Enemies, Fighting them, Wave budget, Wave modifiers, Cross-platform (+9 more)

### Community 9 - "lib.py"
Cohesion: 0.10
Nodes (7): apply_bevel(), bake_ao(), basis(), pack_bundle(), Previewer, runes(), uv_ribbon()

### Community 10 - "Elements"
Cohesion: 0.09
Nodes (23): 🩸 Blood, ⏳ Chrono, 🌠 Cosmic, 💎 Crystal, 🪨 Earth, Elements, 💣 Explosion, 🔥 Fire (+15 more)

### Community 11 - "build_elements.py"
Cohesion: 0.17
Nodes (14): arcpts(), blob_cloud(), crescent(), crescent_blade(), lens(), M(), plated_rock(), put() (+6 more)

### Community 12 - "boltFx"
Cohesion: 0.27
Nodes (12): addFx(), boltFx(), circleFx(), easeOut(), easeOutBack(), glowify(), glowMats(), makeCircle() (+4 more)

### Community 13 - "modes.js"
Cohesion: 0.27
Nodes (7): applyMap(), DUEL_SPOTS, duelReset(), showScenery(), startDuel(), startMode(), stepDuel()

### Community 14 - "Blender Assets"
Cohesion: 0.29
Nodes (8): energyMat(), grab(), model(), sp(), Blender Assets, Conventions, Finishing pass, In-game look

### Community 16 - "addShader"
Cohesion: 0.40
Nodes (6): addShader(), beamMat(), discMat(), flameMat(), pillarFx(), waveMat()

### Community 17 - "rand"
Cohesion: 0.40
Nodes (6): animateArena(), burst(), emit(), popNum(), rand(), V()

### Community 18 - "clamp"
Cohesion: 0.50
Nodes (4): clamp(), localInput(), pollPad(), setupTouch()

### Community 19 - "css"
Cohesion: 0.67
Nodes (3): comboText(), css(), tintRig()

## Knowledge Gaps
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Blender Assets` connect `Blender Assets` to `Elements.md`, `Mesh`?**
  _High betweenness centrality (0.277) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `react()` (e.g. with `r2()` and `Combos (reactions)`) actually correct?**
  _`react()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `sim.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06741321388577827 - nodes in this community are weakly interconnected._
- **Why does `Mesh` connect `Mesh` to `lib.py`, `build_elements.py`, `Blender Assets`?**
  _High betweenness centrality (0.254) - this node is a cross-community bridge._
- **Should `core.js` be split into smaller, more focused modules?**
  _Cohesion score 0.025 - nodes in this community are weakly interconnected._
- **Why does `r2()` connect `sim.js` to `core.js`, `elements.js`?**
  _High betweenness centrality (0.241) - this node is a cross-community bridge._
- **Should `dungeon.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07486338797814207 - nodes in this community are weakly interconnected._