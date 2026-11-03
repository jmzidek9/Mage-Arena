# Graph Report - Test Game  (2026-11-02)

## Corpus Check
- 32 files · ~211,398 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 2)

## Summary
- 968 nodes · 2024 edges · 37 communities (32 shown, 5 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 143 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0779975f`
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
- bake_scale
- Audio credits
- build_elements.py
- areas.js
- modes.js
- renderWorld
- city.js
- build_foes.py
- build_enemies.py
- boltFx
- addShader
- TRS
- part
- Mage Arena
- clamp
- aim
- renderLobby
- Elements
- rand
- onEvent
- gainXP
- blocks.js
- css
- MUSIC
- initAudio
- keyName
- lockMouse
- grab

## God Nodes (most connected - your core abstractions)
1. `TRS()` - 69 edges
2. `aim()` - 38 edges
3. `Elements` - 36 edges
4. `ell()` - 31 edges
5. `build_hell()` - 30 edges
6. `Mesh` - 30 edges
7. `crystal()` - 28 edges
8. `build_frost()` - 27 edges
9. `pol()` - 27 edges
10. `build_crypt()` - 26 edges

## Surprising Connections (you probably didn't know these)
- `Finishing pass` --references--> `bake_ao()`  [INFERRED]
  vault/Blender Assets.md → blender/lib.py
- `Blender Assets` --references--> `Mesh`  [INFERRED]
  vault/Blender Assets.md → blender/lib.py
- `Layout` --references--> `cityLayout()`  [INFERRED]
  vault/Mage City.md → js/city.js
- `Combos (reactions)` --references--> `reactionOf()`  [INFERRED]
  vault/Combos.md → js/sim.js
- `Combos (reactions)` --references--> `react()`  [INFERRED]
  vault/Combos.md → js/sim.js

## Import Cycles
- None detected.

## Communities (37 total, 5 thin omitted)

### Community 0 - "sim.js"
Cohesion: 0.06
Nodes (96): r2(), addUlt(), aimOf(), alive(), aoe(), applyStatus(), blast(), bomberBlast() (+88 more)

### Community 1 - "core.js"
Cohesion: 0.02
Nodes (68): amb, ARENA_PILLARS, BH, BH_L, BIND, BIND_DEF, _c, camera (+60 more)

### Community 2 - "dungeon.js"
Cohesion: 0.07
Nodes (55): add(), anchor(), ARRIVE, block(), BUCKET, buildDungeonView(), buildFloor(), buildHall() (+47 more)

### Community 3 - "view.js"
Cohesion: 0.05
Nodes (38): BOSS_COL, BOSS_GAIT, buildBar(), CASTS, CC_OV, COMBO_FX, DIFF, ELMETA (+30 more)

### Community 4 - "lib.py"
Cohesion: 0.05
Nodes (38): digit(), finger(), fist(), limb(), open_hand(), palm(), sleeve(), build_crypt() (+30 more)

### Community 5 - "net.js"
Cohesion: 0.10
Nodes (36): applySettings(), autoQuality(), bfSnap(), bgTick(), BIND_NAMES, CHEAT_TOGGLES, cheatSpawn(), dropGuest() (+28 more)

### Community 6 - "Mesh"
Cohesion: 0.12
Nodes (9): spell_circle(), part(), bridge(), bridge_gate(), bridge_pier(), bridge_post(), horn_(), area() (+1 more)

### Community 7 - "elements.js"
Cohesion: 0.05
Nodes (34): energyMat(), model(), aimBeam(), beamFx(), beamMesh(), _bgeo, blastFx(), boomAt() (+26 more)

### Community 8 - "Elements.md"
Cohesion: 0.07
Nodes (24): Combos (reactions), Named reactions, Reaction kinds (for every other pair), Enemies, Fighting them, Wave budget, Wave modifiers, Cross-platform (+16 more)

### Community 10 - "Audio credits"
Cohesion: 0.33
Nodes (5): Audio credits, Music (`audio/music/`), Sound effects (`audio/sfx/`, file names kept from the packs), pickSample(), SFX

### Community 11 - "build_elements.py"
Cohesion: 0.12
Nodes (17): arcpts(), blob_cloud(), crescent(), crescent_blade(), lens(), M(), mirror_shard(), plated_rock() (+9 more)

### Community 12 - "areas.js"
Cohesion: 0.08
Nodes (33): addPool(), AREAS, aroundIsle(), bridgeEnds(), bsc(), die(), easeBack(), FOE_ATK (+25 more)

### Community 13 - "modes.js"
Cohesion: 0.27
Nodes (7): applyMap(), DUEL_SPOTS, duelReset(), showScenery(), startDuel(), startMode(), stepDuel()

### Community 14 - "renderWorld"
Cohesion: 0.21
Nodes (12): makeEnt(), makeShot(), makeWizard(), me(), renderAuras(), renderChannels(), renderEnts(), renderPartner() (+4 more)

### Community 15 - "city.js"
Cohesion: 0.05
Nodes (73): arenaMat(), arenaObj(), blockAt(), buildCityView(), buildKit(), cboxGeo(), CBX, CITY (+65 more)

### Community 16 - "build_foes.py"
Cohesion: 0.13
Nodes (32): ba_arm(), bd_body(), biped(), arm(), leg(), claws(), cn_arm(), cn_head() (+24 more)

### Community 17 - "build_enemies.py"
Cohesion: 0.22
Nodes (17): arm(), boss_arm(), claws(), dkbody(), ellipsoid(), horn(), kbody(), leg() (+9 more)

### Community 18 - "boltFx"
Cohesion: 0.27
Nodes (12): addFx(), boltFx(), circleFx(), easeOut(), easeOutBack(), glowify(), glowMats(), makeCircle() (+4 more)

### Community 19 - "addShader"
Cohesion: 0.33
Nodes (7): addShader(), beamMat(), discMat(), fireMat(), flameMat(), pillarFx(), waveMat()

### Community 20 - "TRS"
Cohesion: 0.14
Nodes (16): ba_body(), bwing(), bz_arm(), cn_leg(), eyeball(), gz_body(), ho_arm(), ig_leg() (+8 more)

### Community 21 - "part"
Cohesion: 0.16
Nodes (11): beast(), legq(), caster(), sbody(), floater(), tent(), keg(), knight() (+3 more)

### Community 23 - "clamp"
Cohesion: 0.50
Nodes (4): clamp(), localInput(), pollPad(), setupTouch()

### Community 24 - "aim"
Cohesion: 0.13
Nodes (25): barm(), boss_body(), boss_sword(), brute_body(), cn_body(), ft_body(), golem(), hg_ring() (+17 more)

### Community 25 - "renderLobby"
Cohesion: 0.23
Nodes (12): bestFor(), PICKABLE(), pickMode(), pvShow(), renderDetail(), renderLobby(), renderModes(), runXP() (+4 more)

### Community 26 - "Elements"
Cohesion: 0.06
Nodes (36): 🐙 Abyss, 🔮 Arcane, Balance, 🗡️ Blades, 🩸 Blood, 💀 Bone, ⏳ Chrono, 🌠 Cosmic (+28 more)

### Community 27 - "rand"
Cohesion: 0.40
Nodes (6): animateArena(), burst(), emit(), popNum(), rand(), V()

### Community 28 - "onEvent"
Cohesion: 0.21
Nodes (19): animEnemy(), arcFx(), bossAnim(), bossArrive(), bossAura(), bossCol(), bossDeath(), bossGait() (+11 more)

### Community 29 - "gainXP"
Cohesion: 0.47
Nodes (6): gainXP(), needXP(), renderProg(), renderTalents(), saveProg(), xpBar()

### Community 31 - "blocks.js"
Cohesion: 0.22
Nodes (6): BLOCK, BLOCK_LOOK, guardFrame(), guardMake(), guardParticles(), GV

### Community 32 - "css"
Cohesion: 0.67
Nodes (3): comboText(), css(), tintRig()

### Community 33 - "MUSIC"
Cohesion: 1.00
Nodes (3): MUSIC, playMood(), track()

### Community 38 - "grab"
Cohesion: 0.67
Nodes (3): grab(), sp(), Conventions

## Knowledge Gaps
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Blender Assets` connect `build_elements.py` to `Elements.md`, `grab`, `Mesh`, `elements.js`?**
  _High betweenness centrality (0.351) - this node is a cross-community bridge._
- **Are the 14 inferred relationships involving `build_hell()` (e.g. with `rim()` and `cage()`) actually correct?**
  _`build_hell()` has 14 INFERRED edges - model-reasoned connections that need verification._
- **Should `sim.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06067961165048544 - nodes in this community are weakly interconnected._
- **Why does `Mesh` connect `Mesh` to `build_elements.py`, `lib.py`, `part`?**
  _High betweenness centrality (0.241) - this node is a cross-community bridge._
- **Should `core.js` be split into smaller, more focused modules?**
  _Cohesion score 0.023255813953488372 - nodes in this community are weakly interconnected._
- **Why does `In-game look` connect `elements.js` to `build_elements.py`?**
  _High betweenness centrality (0.148) - this node is a cross-community bridge._
- **Should `dungeon.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07486338797814207 - nodes in this community are weakly interconnected._