# Graph Report - Test Game  (2026-10-27)

## Corpus Check
- 25 files · ~132,100 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 2)

## Summary
- 646 nodes · 1201 edges · 27 communities (20 shown, 7 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 46 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2e6c8951`
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
- rand
- To-do (noted 2026-10-26)
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
- `Combos (reactions)` --references--> `reactionOf()`  [INFERRED]
  vault/Combos.md → js/sim.js
- `Combos (reactions)` --references--> `react()`  [INFERRED]
  vault/Combos.md → js/sim.js

## Import Cycles
- None detected.

## Communities (27 total, 7 thin omitted)

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
Cohesion: 0.05
Nodes (36): energyMat(), grab(), model(), sp(), aimBeam(), beamFx(), beamMesh(), _bgeo (+28 more)

### Community 8 - "Elements.md"
Cohesion: 0.09
Nodes (18): Combos (reactions), Named reactions, Reaction kinds (for every other pair), Enemies, Fighting them, Wave budget, Wave modifiers, Cross-platform (+10 more)

### Community 9 - "lib.py"
Cohesion: 0.10
Nodes (8): apply_bevel(), bake_ao(), basis(), pack_bundle(), Previewer, runes(), uv_ribbon(), Finishing pass

### Community 10 - "Audio credits"
Cohesion: 0.33
Nodes (5): Audio credits, Music (`audio/music/`), Sound effects (`audio/sfx/`, file names kept from the packs), pickSample(), SFX

### Community 11 - "build_elements.py"
Cohesion: 0.14
Nodes (14): arcpts(), crescent(), crescent_blade(), lens(), M(), mirror_shard(), plated_rock(), put() (+6 more)

### Community 12 - "boltFx"
Cohesion: 0.27
Nodes (12): addFx(), boltFx(), circleFx(), easeOut(), easeOutBack(), glowify(), glowMats(), makeCircle() (+4 more)

### Community 13 - "modes.js"
Cohesion: 0.27
Nodes (7): applyMap(), DUEL_SPOTS, duelReset(), showScenery(), startDuel(), startMode(), stepDuel()

### Community 14 - "rand"
Cohesion: 0.40
Nodes (6): animateArena(), burst(), emit(), popNum(), rand(), V()

### Community 16 - "addShader"
Cohesion: 0.40
Nodes (6): addShader(), beamMat(), discMat(), flameMat(), pillarFx(), waveMat()

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

- **Why does `Blender Assets` connect `elements.js` to `Elements.md`, `lib.py`, `build_elements.py`, `Mesh`?**
  _High betweenness centrality (0.282) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `react()` (e.g. with `r2()` and `Combos (reactions)`) actually correct?**
  _`react()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `sim.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0661512027491409 - nodes in this community are weakly interconnected._
- **Why does `r2()` connect `sim.js` to `core.js`, `elements.js`?**
  _High betweenness centrality (0.226) - this node is a cross-community bridge._
- **Should `core.js` be split into smaller, more focused modules?**
  _Cohesion score 0.023255813953488372 - nodes in this community are weakly interconnected._
- **Why does `Mesh` connect `Mesh` to `lib.py`, `build_elements.py`, `pol`, `elements.js`?**
  _High betweenness centrality (0.186) - this node is a cross-community bridge._
- **Should `dungeon.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07486338797814207 - nodes in this community are weakly interconnected._