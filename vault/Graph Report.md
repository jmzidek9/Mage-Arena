# Graph Report - Test Game  (2026-10-27)

## Corpus Check
- 30 files · ~168,869 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 2)

## Summary
- 803 nodes · 1508 edges · 35 communities (29 shown, 6 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 68 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1ea177c4`
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
- build_crypt
- boltFx
- addShader
- rand
- .__init__
- Mage Arena
- clamp
- chain
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
2. `build_crypt()` - 26 edges
3. `Mesh` - 26 edges
4. `ev()` - 24 edges
5. `stepEnemies()` - 22 edges
6. `react()` - 21 edges
7. `TRS()` - 20 edges
8. `stats()` - 18 edges
9. `push()` - 17 edges
10. `pol()` - 16 edges

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

## Communities (35 total, 6 thin omitted)

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
Cohesion: 0.06
Nodes (33): buildBar(), CASTS, CC_OV, COMBO_FX, DIFF, ELMETA, ETPL, FALLBACK (+25 more)

### Community 4 - "build_enemies.py"
Cohesion: 0.11
Nodes (30): digit(), finger(), fist(), limb(), open_hand(), palm(), sleeve(), arm() (+22 more)

### Community 5 - "net.js"
Cohesion: 0.11
Nodes (32): applySettings(), autoQuality(), bfSnap(), bgTick(), BIND_NAMES, dropGuest(), footsteps(), frame() (+24 more)

### Community 6 - "Mesh"
Cohesion: 0.10
Nodes (6): spell_circle(), part(), bridge(), apply_subsurf(), area(), Mesh

### Community 7 - "elements.js"
Cohesion: 0.06
Nodes (34): energyMat(), model(), aimBeam(), beamFx(), beamMesh(), _bgeo, blastFx(), boomAt() (+26 more)

### Community 8 - "Elements.md"
Cohesion: 0.07
Nodes (26): Blender Assets, Finishing pass, Combos (reactions), Named reactions, Reaction kinds (for every other pair), Enemies, Fighting them, Wave budget (+18 more)

### Community 9 - "lib.py"
Cohesion: 0.12
Nodes (6): apply_bevel(), bake_ao(), mat(), pack_bundle(), Previewer, uv_ribbon()

### Community 10 - "Audio credits"
Cohesion: 0.33
Nodes (5): Audio credits, Music (`audio/music/`), Sound effects (`audio/sfx/`, file names kept from the packs), pickSample(), SFX

### Community 11 - "build_elements.py"
Cohesion: 0.14
Nodes (15): arcpts(), crescent(), crescent_blade(), lens(), M(), mirror_shard(), plated_rock(), put() (+7 more)

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

### Community 16 - "build_crypt"
Cohesion: 0.16
Nodes (11): blob_cloud(), build_crypt(), branch(), gravestone(), skull(), circle(), flame(), Isle (+3 more)

### Community 18 - "boltFx"
Cohesion: 0.27
Nodes (12): addFx(), boltFx(), circleFx(), easeOut(), easeOutBack(), glowify(), glowMats(), makeCircle() (+4 more)

### Community 19 - "addShader"
Cohesion: 0.33
Nodes (7): addShader(), beamMat(), discMat(), fireMat(), flameMat(), pillarFx(), waveMat()

### Community 20 - "rand"
Cohesion: 0.40
Nodes (6): animateArena(), burst(), emit(), popNum(), rand(), V()

### Community 21 - ".__init__"
Cohesion: 0.40
Nodes (3): center(), lane_angle(), coll()

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
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Blender Assets` connect `Elements.md` to `build_elements.py`, `elements.js`, `Mesh`, `grab`?**
  _High betweenness centrality (0.313) - this node is a cross-community bridge._
- **Are the 12 inferred relationships involving `build_crypt()` (e.g. with `skull()` and `.base()`) actually correct?**
  _`build_crypt()` has 12 INFERRED edges - model-reasoned connections that need verification._
- **Should `sim.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06363636363636363 - nodes in this community are weakly interconnected._
- **Why does `Mesh` connect `Mesh` to `Elements.md`, `lib.py`, `build_elements.py`, `build_crypt`, `.__init__`?**
  _High betweenness centrality (0.181) - this node is a cross-community bridge._
- **Should `core.js` be split into smaller, more focused modules?**
  _Cohesion score 0.023255813953488372 - nodes in this community are weakly interconnected._
- **Why does `r2()` connect `sim.js` to `core.js`, `elements.js`?**
  _High betweenness centrality (0.174) - this node is a cross-community bridge._
- **Should `dungeon.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07486338797814207 - nodes in this community are weakly interconnected._