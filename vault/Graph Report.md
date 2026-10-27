# Graph Report - Test Game  (2026-10-26)

## Corpus Check
- 24 files · ~129,175 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 2)

## Summary
- 632 nodes · 1173 edges · 31 communities (23 shown, 8 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 41 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6844e6e4`
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
- grab
- Mage Arena
- addShader
- clamp
- css
- lockMouse
- playMood
- Mage Arena
- initAudio
- Enemies
- Netcode
- Elements
- keyName
- pol
- Combos (reactions)
- Blender Assets

## God Nodes (most connected - your core abstractions)
1. `Elements` - 34 edges
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
- `Finishing pass` --references--> `bake_ao()`  [INFERRED]
  vault/Blender Assets.md → blender/lib.py
- `Blender Assets` --references--> `sigil()`  [INFERRED]
  vault/Blender Assets.md → blender/build_elements.py
- `Blender Assets` --references--> `Mesh`  [INFERRED]
  vault/Blender Assets.md → blender/lib.py
- `Combos (reactions)` --references--> `reactionOf()`  [INFERRED]
  vault/Combos.md → js/sim.js
- `Combos (reactions)` --references--> `react()`  [INFERRED]
  vault/Combos.md → js/sim.js

## Import Cycles
- None detected.

## Communities (31 total, 8 thin omitted)

### Community 0 - "sim.js"
Cohesion: 0.07
Nodes (88): addUlt(), aimOf(), alive(), aoe(), applyStatus(), blast(), bomberBlast(), bondMul() (+80 more)

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
Cohesion: 0.10
Nodes (31): digit(), finger(), fist(), limb(), open_hand(), palm(), sleeve(), arm() (+23 more)

### Community 5 - "net.js"
Cohesion: 0.11
Nodes (32): applySettings(), autoQuality(), bfSnap(), bgTick(), BIND_NAMES, dropGuest(), footsteps(), frame() (+24 more)

### Community 6 - "Mesh"
Cohesion: 0.10
Nodes (5): spell_circle(), part(), apply_subsurf(), area(), Mesh

### Community 7 - "elements.js"
Cohesion: 0.06
Nodes (19): r2(), aimBeam(), beamFx(), beamMesh(), _bgeo, boomAt(), chainBolt(), ctxS() (+11 more)

### Community 9 - "lib.py"
Cohesion: 0.11
Nodes (6): apply_bevel(), bake_ao(), pack_bundle(), Previewer, runes(), uv_ribbon()

### Community 10 - "Audio credits"
Cohesion: 0.33
Nodes (5): Audio credits, Music (`audio/music/`), Sound effects (`audio/sfx/`, file names kept from the packs), pickSample(), SFX

### Community 11 - "build_elements.py"
Cohesion: 0.14
Nodes (14): arcpts(), crescent(), crescent_blade(), lens(), M(), mirror_shard(), plated_rock(), put() (+6 more)

### Community 12 - "boltFx"
Cohesion: 0.18
Nodes (18): addFx(), animateArena(), boltFx(), burst(), circleFx(), easeOut(), easeOutBack(), emit() (+10 more)

### Community 13 - "modes.js"
Cohesion: 0.27
Nodes (7): applyMap(), DUEL_SPOTS, duelReset(), showScenery(), startDuel(), startMode(), stepDuel()

### Community 14 - "grab"
Cohesion: 0.67
Nodes (3): grab(), sp(), Conventions

### Community 15 - "Mage Arena"
Cohesion: 0.33
Nodes (6): Controls, Core loop (Arena), Mage Arena, Progression, Why it's replayable, Why it's satisfying

### Community 16 - "addShader"
Cohesion: 0.28
Nodes (9): addShader(), beamMat(), discMat(), energyMat(), flameMat(), model(), pillarFx(), waveMat() (+1 more)

### Community 18 - "clamp"
Cohesion: 0.50
Nodes (4): clamp(), localInput(), pollPad(), setupTouch()

### Community 19 - "css"
Cohesion: 0.67
Nodes (3): comboText(), css(), tintRig()

### Community 21 - "playMood"
Cohesion: 1.00
Nodes (3): MUSIC, playMood(), track()

### Community 24 - "Enemies"
Cohesion: 0.50
Nodes (4): Enemies, Fighting them, Wave budget, Wave modifiers

### Community 25 - "Netcode"
Cohesion: 0.50
Nodes (3): Cross-platform, Known ceilings (`ponytail:` comments in the code), Netcode

### Community 26 - "Elements"
Cohesion: 0.06
Nodes (34): 🐙 Abyss, 🔮 Arcane, 🗡️ Blades, 🩸 Blood, 💀 Bone, ⏳ Chrono, 🌠 Cosmic, 💎 Crystal (+26 more)

### Community 29 - "Combos (reactions)"
Cohesion: 0.67
Nodes (3): Combos (reactions), Named reactions, Reaction kinds (for every other pair)

## Knowledge Gaps
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Blender Assets` connect `Blender Assets` to `Mesh`, `Elements.md`, `build_elements.py`, `grab`, `addShader`?**
  _High betweenness centrality (0.274) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `react()` (e.g. with `r2()` and `Combos (reactions)`) actually correct?**
  _`react()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `sim.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0668859649122807 - nodes in this community are weakly interconnected._
- **Why does `r2()` connect `elements.js` to `sim.js`, `core.js`?**
  _High betweenness centrality (0.263) - this node is a cross-community bridge._
- **Should `core.js` be split into smaller, more focused modules?**
  _Cohesion score 0.023255813953488372 - nodes in this community are weakly interconnected._
- **Why does `Mesh` connect `Mesh` to `lib.py`, `build_elements.py`, `pol`, `Blender Assets`?**
  _High betweenness centrality (0.190) - this node is a cross-community bridge._
- **Should `dungeon.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07486338797814207 - nodes in this community are weakly interconnected._