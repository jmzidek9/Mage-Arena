# Blender Assets

Every visual is built procedurally in Blender 5.2. Shared helpers (the `Mesh` builder, materials, bevel / subsurf / AO bake, export and the bundle packer) live in `blender/lib.py`. Rebuild any part with:

```
"C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" --background --factory-startup --python blender/build_assets.py
"C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" --background --factory-startup --python blender/build_elements.py
"C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" --background --factory-startup --python blender/build_enemies.py
```

Each script saves its own `.blend`, exports its `.glb` files, renders previews to `blender/renders/` and re-packs every glb as base64 into `assets/bundle.js`. The game loads that bundle, because browsers block fetching local `.glb` files when `index.html` is opened by double-click.

| Script | File | Contents |
|---|---|---|
| `build_assets.py` | `arena.glb` | Floating ruined temple: tiled disc, walls, rock underside, pillars, banners, archway, braziers, crystals, mana falls, orbiting monoliths, floating rocks, distant islands, the central arcane sigil |
| | `spells.glb` | Shared meshes: fireball, ice shard, ice spike, bolt ribbon, shockwave ring, light-pillar tube, glow disc, steam / shatter / overload bursts |
| | `fp_rig.glb` | First-person hands and staff |
| | `wizard.glb` | Third-person body for your partner |
| `build_elements.py` | `elements.glb` | A unique spell circle per element (`<el>__ring_outer`, `__runes`, `__ring_inner`, `__sigil`, counter-rotated in game), plus ~120 move meshes: phoenix, ice wall, glacial lance, tesla coil, storm cloud, tsunami wave, boulder, basalt pillar (two-tone stone, glowing seams, strata, rubble), stone spike cluster, tornado, flytrap (jaw children), world tree, black sun, light halo and spear, wasp (wing children), saw blade, giant sword, volcano, meteor, geode, crystal spire and tomb, sound waves, black hole, clock (hand children), hourglass, blood moon, spectral wolf (leg/head/tail children) and knight (sword child), comet, grenade, sticky bomb, mine, aerial bomb, illusion moth, charm mask, mirror walls and shards, thrown femur, skull (jaw child), bone plates, rib cage, skeleton warrior (head/arm/leg children), bone dragon (head/jaw/wing children), rune bolt, glyph trap, runestone and glyph, plasma bolt, orb and blade, soul flame, scythe and reaper (scythe child), abyss orb, tentacle (5 segment chain) and maw, laser drone, prism and lens, arcane missile, orb, owl familiar (wing children), polymorph sheep and rift, flying sword and colossal blade, ink drop, brush stroke and pool splats, koi (tail child), calligraphy brush, ink dragon head and body segment, and generic cones, domes and clouds. The arena's centre circle uses the `sigil` template |
| `build_enemies.py` | `enemies.glb` | 9 articulated rigs: grunt, runner, shooter, bomber, splitter, brute, knight, shaman, boss. Each is an empty root with child parts named `<type>_body/_head/_jaw/_armL/_armR/_legL/_legR/_leg0-3/_tail/_ring/_tent0-4/_shield/_weapon/_staff/_fuse/_crown`, with their origins at the joints |

## Finishing pass
- **Bevels:** stonework and the knight's armour get a bevel modifier applied before export, then smooth-by-angle shading.
- **Subdivision:** organic enemy bodies get one subsurf level.
- **Baked AO:** `bake_ao()` ray-traces ambient occlusion with a BVH, adds per-face colour variation, and bakes it into a `Col` corner colour attribute (exported as `COLOR_0`). Used on the arena and every enemy.

## In-game look
- **Smoke, dust and debris:** particles are additive and can only glow, so smoke and dust are real normal-blended sprite puffs (`smokeFx`, and `dustFx` built on it), flying chunks are tumbling models that bounce and settle (`debrisFx`), and scorches or craters are Ink's splat model with a rim in the element's colour (`scarFx`). Explosion's blasts (`blastFx`) combine all of them.
- **Energy shader:** materials named `<el>_glow` / `<el>_core` become an additive fresnel "energy" shader tinted per element (`energyMat()` / `model()` in `js/core.js`). Flames use an animated fire shader, and the tsunami uses a water shader.
- **Lighting:** moonlight with soft shadow maps, sky-based image lighting (PMREM) and bloom.
- **Sky and clouds:** a procedural shader sky with nebula, aurora and moon, plus a two-layer sea of clouds.
- **Post effect:** a film-grade pass with vignette, a slight colour fringe and grain, plus a sepia fade for Chrono's Time Stop and a white flash for Supernova.
- **Enemies:** procedural animation per part (walk cycle, wind-up, strike, flinch, stagger), rim glow, a red tint while winding up, crowd-control overlays (ice block, crystal tomb, bubble, clock, roots, skull, gravity rings), and they burn away and break apart on death.

## Conventions
- Projectiles and enemies face Blender **-Y**, which becomes three.js +Z (so `lookAt` works).
- Ground things stand on z = 0.
- The first-person rig sits in camera space looking Blender **+Y**.
- `build_assets.py` names get Blender's dedupe suffixes (`ring_outer.001` → `ring_outer001`), so its `grab()` ignores numeric suffixes. `elements.glb` and `enemies.glb` use unique names.

Related: [[Elements]], [[Enemies]], [[Overview]]
