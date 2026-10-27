# Graph Report - Test Game  (2026-10-27)

## Corpus Check
- 28 files · ~151,946 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 2)

## Summary
- 729 nodes · 1354 edges · 34 communities (26 shown, 8 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 52 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b8f005dd`
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
- pol
- city.js
- addShader
- clamp
- css
- lockMouse
- playMood
- Mage Arena
- initAudio
- grab
- Blender Assets
- Elements
- keyName
- Mage Arena
- Enemies
- Netcode
- Similar moves (reviewed 2026-10-27)
- Previewer
- Combos (reactions)

## God Nodes (most connected - your core abstractions)
1. `Elements` - 36 edges
2. `Mesh` - 23 edges
3. `ev()` - 23 edges
4. `react()` - 21 edges
5. `stepEnemies()` - 21 edges
6. `stats()` - 18 edges
7. `push()` - 17 edges
8. `buildCityView()` - 16 edges
9. `TRS()` - 15 edges
10. `damage()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `Finishing pass` --references--> `bake_ao()`  [INFERRED]
  vault/Blender Assets.md → blender/lib.py
- `Blender Assets` --references--> `sigil()`  [INFERRED]
  vault/Blender Assets.md → blender/build_elements.py
- `Blender Assets` --references--> `Mesh`  [INFERRED]
  vault/Blender Assets.md → blender/lib.py
- `Layout` --references--> `cityLayout()`  [INFERRED]
  vault/Mage City.md → js/city.js
- `In-game look` --references--> `energyMat()`  [INFERRED]
  vault/Blender Assets.md → js/core.js

## Import Cycles
- None detected.

## Communities (34 total, 8 thin omitted)

### Community 0 - "sim.js"
Cohesion: 0.07
Nodes (87): addUlt(), aimOf(), alive(), aoe(), applyStatus(), blast(), bomberBlast(), bondMul() (+79 more)

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
Nodes (4): spell_circle(), part(), area(), Mesh

### Community 7 - "elements.js"
Cohesion: 0.06
Nodes (31): r2(), aimBeam(), beamFx(), beamMesh(), _bgeo, blastFx(), boomAt(), boomFx() (+23 more)

### Community 8 - "Elements.md"
Cohesion: 0.23
Nodes (4): Spells, Done (2026-10-27), To-do (noted 2026-10-26), Upgrades (removed)

### Community 9 - "lib.py"
Cohesion: 0.11
Nodes (7): apply_bevel(), apply_subsurf(), bake_ao(), basis(), pack_bundle(), runes(), uv_ribbon()

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

### Community 15 - "city.js"
Cohesion: 0.05
Nodes (69): arenaMat(), arenaObj(), blockAt(), buildCityView(), buildKit(), cboxGeo(), CBX, CITY (+61 more)

### Community 16 - "addShader"
Cohesion: 0.29
Nodes (8): addShader(), beamMat(), discMat(), energyMat(), flameMat(), model(), pillarFx(), waveMat()

### Community 18 - "clamp"
Cohesion: 0.50
Nodes (4): clamp(), localInput(), pollPad(), setupTouch()

### Community 19 - "css"
Cohesion: 0.67
Nodes (3): comboText(), css(), tintRig()

### Community 21 - "playMood"
Cohesion: 1.00
Nodes (3): MUSIC, playMood(), track()

### Community 24 - "grab"
Cohesion: 0.67
Nodes (3): grab(), sp(), Conventions

### Community 26 - "Elements"
Cohesion: 0.06
Nodes (36): 🐙 Abyss, 🔮 Arcane, Balance, 🗡️ Blades, 🩸 Blood, 💀 Bone, ⏳ Chrono, 🌠 Cosmic (+28 more)

### Community 28 - "Mage Arena"
Cohesion: 0.33
Nodes (6): Controls, Core loop (Arena), Mage Arena, Progression, Why it's replayable, Why it's satisfying

### Community 29 - "Enemies"
Cohesion: 0.50
Nodes (4): Enemies, Fighting them, Wave budget, Wave modifiers

### Community 30 - "Netcode"
Cohesion: 0.50
Nodes (3): Cross-platform, Known ceilings (`ponytail:` comments in the code), Netcode

### Community 31 - "Similar moves (reviewed 2026-10-27)"
Cohesion: 0.50
Nodes (4): Alike within one element, Similar moves (reviewed 2026-10-27), Similar (same role, different twist), Very similar (near-duplicates)

### Community 33 - "Combos (reactions)"
Cohesion: 0.67
Nodes (3): Combos (reactions), Named reactions, Reaction kinds (for every other pair)

## Knowledge Gaps
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Blender Assets` connect `Blender Assets` to `Mesh`, `elements.js`, `Elements.md`, `build_elements.py`, `grab`?**
  _High betweenness centrality (0.311) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `react()` (e.g. with `r2()` and `Combos (reactions)`) actually correct?**
  _`react()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `sim.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06629339305711086 - nodes in this community are weakly interconnected._
- **Why does `r2()` connect `elements.js` to `sim.js`, `core.js`?**
  _High betweenness centrality (0.191) - this node is a cross-community bridge._
- **Should `core.js` be split into smaller, more focused modules?**
  _Cohesion score 0.023255813953488372 - nodes in this community are weakly interconnected._
- **Why does `Mesh` connect `Mesh` to `lib.py`, `build_elements.py`, `pol`, `Blender Assets`?**
  _High betweenness centrality (0.175) - this node is a cross-community bridge._
- **Should `dungeon.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07486338797814207 - nodes in this community are weakly interconnected._