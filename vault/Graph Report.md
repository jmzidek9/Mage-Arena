# Graph Report - Test Game  (2026-10-27)

## Corpus Check
- 29 files · ~163,254 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 2)

## Summary
- 757 nodes · 1404 edges · 34 communities (27 shown, 7 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 52 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bc6e2790`
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
- areas.js
- modes.js
- renderWorld
- city.js
- pol
- boltFx
- addShader
- rand
- Blender Assets
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
1. `Elements` - 36 edges
2. `ev()` - 24 edges
3. `Mesh` - 23 edges
4. `stepEnemies()` - 22 edges
5. `react()` - 21 edges
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
- `Combos (reactions)` --references--> `reactionOf()`  [INFERRED]
  vault/Combos.md → js/sim.js

## Import Cycles
- None detected.

## Communities (34 total, 7 thin omitted)

### Community 0 - "sim.js"
Cohesion: 0.07
Nodes (89): addUlt(), aimOf(), alive(), aoe(), applyStatus(), blast(), bomberBlast(), bondMul() (+81 more)

### Community 1 - "core.js"
Cohesion: 0.02
Nodes (68): amb, ARENA_PILLARS, BH, BH_L, BIND, BIND_DEF, _c, camera (+60 more)

### Community 2 - "dungeon.js"
Cohesion: 0.07
Nodes (55): add(), anchor(), ARRIVE, block(), BUCKET, buildDungeonView(), buildFloor(), buildHall() (+47 more)

### Community 3 - "view.js"
Cohesion: 0.06
Nodes (33): buildBar(), CASTS, CC_OV, COMBO_FX, DIFF, ELMETA, ETPL, FALLBACK (+25 more)

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
Cohesion: 0.05
Nodes (36): energyMat(), flameMat(), model(), r2(), aimBeam(), beamFx(), beamMesh(), _bgeo (+28 more)

### Community 8 - "Elements.md"
Cohesion: 0.07
Nodes (25): Combos (reactions), Named reactions, Reaction kinds (for every other pair), Enemies, Fighting them, Wave budget, Wave modifiers, Cross-platform (+17 more)

### Community 9 - "lib.py"
Cohesion: 0.11
Nodes (6): apply_bevel(), bake_ao(), pack_bundle(), Previewer, runes(), uv_ribbon()

### Community 10 - "Audio credits"
Cohesion: 0.33
Nodes (5): Audio credits, Music (`audio/music/`), Sound effects (`audio/sfx/`, file names kept from the packs), pickSample(), SFX

### Community 11 - "build_elements.py"
Cohesion: 0.14
Nodes (14): arcpts(), crescent(), crescent_blade(), lens(), M(), mirror_shard(), plated_rock(), put() (+6 more)

### Community 12 - "areas.js"
Cohesion: 0.18
Nodes (7): areaIdx(), areaNow(), AREAS, FOE_ATK, RIMC, shove(), stepHazards()

### Community 13 - "modes.js"
Cohesion: 0.27
Nodes (7): applyMap(), DUEL_SPOTS, duelReset(), showScenery(), startDuel(), startMode(), stepDuel()

### Community 14 - "renderWorld"
Cohesion: 0.17
Nodes (15): animEnemy(), makeEnemy(), makeEnt(), makeShot(), makeWizard(), me(), renderAuras(), renderChannels() (+7 more)

### Community 15 - "city.js"
Cohesion: 0.05
Nodes (70): arenaMat(), arenaObj(), blockAt(), buildCityView(), buildKit(), cboxGeo(), CBX, CITY (+62 more)

### Community 18 - "boltFx"
Cohesion: 0.27
Nodes (12): addFx(), boltFx(), circleFx(), easeOut(), easeOutBack(), glowify(), glowMats(), makeCircle() (+4 more)

### Community 19 - "addShader"
Cohesion: 0.50
Nodes (5): addShader(), beamMat(), discMat(), pillarFx(), waveMat()

### Community 20 - "rand"
Cohesion: 0.40
Nodes (6): animateArena(), burst(), emit(), popNum(), rand(), V()

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

### Community 31 - "grab"
Cohesion: 0.67
Nodes (3): grab(), sp(), Conventions

### Community 32 - "css"
Cohesion: 0.67
Nodes (3): comboText(), css(), tintRig()

### Community 33 - "MUSIC"
Cohesion: 1.00
Nodes (3): MUSIC, playMood(), track()

## Knowledge Gaps
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Blender Assets` connect `Blender Assets` to `Mesh`, `elements.js`, `Elements.md`, `build_elements.py`, `grab`?**
  _High betweenness centrality (0.296) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `react()` (e.g. with `r2()` and `Combos (reactions)`) actually correct?**
  _`react()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `sim.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06572164948453608 - nodes in this community are weakly interconnected._
- **Why does `r2()` connect `elements.js` to `sim.js`, `core.js`?**
  _High betweenness centrality (0.187) - this node is a cross-community bridge._
- **Should `core.js` be split into smaller, more focused modules?**
  _Cohesion score 0.023255813953488372 - nodes in this community are weakly interconnected._
- **Why does `Mesh` connect `Mesh` to `pol`, `lib.py`, `build_elements.py`, `Blender Assets`?**
  _High betweenness centrality (0.167) - this node is a cross-community bridge._
- **Should `dungeon.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07486338797814207 - nodes in this community are weakly interconnected._