# Graph Report - Test Game  (2026-10-26)

## Corpus Check
- 24 files · ~122,929 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 2)

## Summary
- 602 nodes · 1119 edges · 26 communities (22 shown, 4 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 41 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4a104560`
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
- rand
- addShader
- clamp
- css
- lockMouse
- playMood
- Mage Arena
- initAudio
- Blender Assets
- Elements

## God Nodes (most connected - your core abstractions)
1. `Elements` - 33 edges
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
- `Combos (reactions)` --references--> `react()`  [INFERRED]
  vault/Combos.md → js/sim.js
- `Flow` --references--> `stepMove()`  [INFERRED]
  vault/Netcode.md → js/sim.js

## Import Cycles
- None detected.

## Communities (26 total, 4 thin omitted)

### Community 0 - "sim.js"
Cohesion: 0.07
Nodes (89): r2(), chainBolt(), addUlt(), aimOf(), alive(), aoe(), applyStatus(), blast() (+81 more)

### Community 1 - "core.js"
Cohesion: 0.02
Nodes (66): amb, ARENA_PILLARS, BH, BH_L, _c, camera, CIRCLE_PARTS, composer (+58 more)

### Community 2 - "dungeon.js"
Cohesion: 0.07
Nodes (55): add(), anchor(), ARRIVE, block(), BUCKET, buildDungeonView(), buildFloor(), buildHall() (+47 more)

### Community 3 - "view.js"
Cohesion: 0.07
Nodes (45): animEnemy(), bestFor(), buildBar(), castFx(), CC_OV, COMBO_FX, distTo(), ETPL (+37 more)

### Community 4 - "build_enemies.py"
Cohesion: 0.10
Nodes (31): digit(), finger(), fist(), limb(), open_hand(), palm(), sleeve(), arm() (+23 more)

### Community 5 - "net.js"
Cohesion: 0.12
Nodes (29): applySettings(), autoQuality(), bfSnap(), bgTick(), dropGuest(), footsteps(), frame(), guestStep() (+21 more)

### Community 6 - "Mesh"
Cohesion: 0.10
Nodes (4): spell_circle(), part(), area(), Mesh

### Community 7 - "elements.js"
Cohesion: 0.07
Nodes (13): aimBeam(), beamFx(), beamMesh(), _bgeo, boomAt(), dropFade(), ELEMENTS, fxe() (+5 more)

### Community 8 - "Elements.md"
Cohesion: 0.09
Nodes (19): reactionOf(), Combos (reactions), Named reactions, Reaction kinds (for every other pair), Enemies, Fighting them, Wave budget, Wave modifiers (+11 more)

### Community 9 - "lib.py"
Cohesion: 0.11
Nodes (7): apply_bevel(), apply_subsurf(), bake_ao(), pack_bundle(), Previewer, runes(), uv_ribbon()

### Community 10 - "Audio credits"
Cohesion: 0.33
Nodes (5): Audio credits, Music (`audio/music/`), Sound effects (`audio/sfx/`, file names kept from the packs), pickSample(), SFX

### Community 11 - "build_elements.py"
Cohesion: 0.16
Nodes (15): arcpts(), blob_cloud(), crescent(), crescent_blade(), lens(), M(), mirror_shard(), plated_rock() (+7 more)

### Community 12 - "boltFx"
Cohesion: 0.27
Nodes (12): addFx(), boltFx(), circleFx(), easeOut(), easeOutBack(), glowify(), glowMats(), makeCircle() (+4 more)

### Community 13 - "modes.js"
Cohesion: 0.27
Nodes (7): applyMap(), DUEL_SPOTS, duelReset(), showScenery(), startDuel(), startMode(), stepDuel()

### Community 14 - "grab"
Cohesion: 0.67
Nodes (3): grab(), sp(), Conventions

### Community 15 - "rand"
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

### Community 24 - "Blender Assets"
Cohesion: 0.50
Nodes (5): energyMat(), model(), Blender Assets, Finishing pass, In-game look

### Community 26 - "Elements"
Cohesion: 0.06
Nodes (33): 🐙 Abyss, 🔮 Arcane, 🗡️ Blades, 🩸 Blood, 💀 Bone, ⏳ Chrono, 🌠 Cosmic, 💎 Crystal (+25 more)

## Knowledge Gaps
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Blender Assets` connect `Blender Assets` to `Elements.md`, `build_elements.py`, `Mesh`, `grab`?**
  _High betweenness centrality (0.279) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `react()` (e.g. with `r2()` and `Combos (reactions)`) actually correct?**
  _`react()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `sim.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Why does `r2()` connect `sim.js` to `core.js`, `elements.js`?**
  _High betweenness centrality (0.261) - this node is a cross-community bridge._
- **Should `core.js` be split into smaller, more focused modules?**
  _Cohesion score 0.023809523809523808 - nodes in this community are weakly interconnected._
- **Why does `Mesh` connect `Mesh` to `Blender Assets`, `lib.py`, `build_elements.py`?**
  _High betweenness centrality (0.196) - this node is a cross-community bridge._
- **Should `dungeon.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07486338797814207 - nodes in this community are weakly interconnected._