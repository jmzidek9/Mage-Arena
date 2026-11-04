# Mage Arena playtest report (19 elements)

19 Opus agents each played one element through `playtest/run.js`, which drives the real game in headless Edge. Each run cast every move alone, then fought for 30 s against a respawning wave-5 crowd and for 30 s against the Tyrant, while saving screenshots and metrics. Full per-element reports are in `playtest/reports/<element>.md`, and raw numbers and screenshots are in `playtest/out/`.

**Not covered:** Shadow and Earth (stopped partway through), plus Bone, Rune, Plasma, Soul, Abyss, Laser, Arcane, Blades and Ink (never started).

## The one big bug: ultimates recharge themselves
Every hit adds ultimate charge (`addUlt` in `js/sim.js`, inside `damage()`), and that includes hits from the ultimate itself. A big area ultimate refills its own meter, so it is ready again almost at once:

| Element | Ultimate casts in 30 s (crowd / boss) |
|---|---|
| Storm (Thunderstorm) | 25 / 25 |
| Blood (Blood Moon) | 16 / 5 |
| Spirit (Army of the Dead) | 4 / 16 |
| Cosmic (Supernova) | 14 / 3 |
| Explosion (Carpet Bomb) | 7 / 9 |
| Fire, Water, Magma… | 6–7 |

This one loop explains almost all of the balance outliers. Storm without its ultimate does about 237 dps, right at the median. **Fix once, in the shared code:** give no ultimate charge for damage dealt by an ultimate. Damage from ultimate entities and shots would carry a `noUlt` flag that `damage()` checks. After that, rerun the bench before changing any numbers.

## Balance (median: crowd 225.1 dps, boss 134.3 dps)
Target band: 0.85–1.2× the median. ⚠ = the ultimate loop inflates this number.

| Element | Crowd dps | ×median | Boss dps | ×median | Note |
|---|---|---|---|---|---|
| Storm | 987.6 | 4.39 | 907.6 | 6.76 | ⚠ ult loop |
| Cosmic | 712.0 | 3.16 | 98.7 | 0.73 | ⚠ ult loop; weak on bosses |
| Blood | 580.3 | 2.58 | 155.2 | 1.16 | ⚠ ult loop |
| Sonic | 323.7 | 1.44 | 85.3 | 0.64 | crowd high, boss low |
| Illusion | 295.9 | 1.31 | 121.9 | 0.91 | charmed monsters hit each other too hard |
| Explosion | 282.1 | 1.25 | 298.8 | 2.22 | ⚠ Carpet Bomb loop |
| Water | 258.1 | 1.15 | 119.9 | 0.89 | in band |
| Fire | 257.1 | 1.14 | 156.8 | 1.17 | in band |
| Gravity | 231.0 | 1.03 | 72.5 | 0.54 | under-measured: the bot aims past the pack |
| Steel | 225.1 | 1.00 | 134.3 | 1.00 | in band |
| Nature | 217.5 | 0.97 | 208.5 | 1.55 | World Tree too strong on bosses |
| Magma | 206.3 | 0.92 | 146.3 | 1.09 | in band |
| Light | 171.3 | 0.76 | 133.4 | 0.99 | crowd a bit low |
| Crystal | 163.8 | 0.73 | 95.9 | 0.71 | low on both |
| Venom | 164.0 | 0.73 | 210.9 | 1.57 | stacking pays off on bosses only |
| Spirit | 139.2 | 0.62 | 566.4 | 4.22 | ⚠ ult loop on boss; crowd low |
| Chrono | 129.9 | 0.58 | 137.1 | 1.02 | crowd low |
| Frost | 105.6 | 0.47 | 116.8 | 0.87 | crowd too low even for control |
| Wind | 78.0 | 0.35 | 65.8 | 0.49 | weakest element |

## Second theme: effects that blind your own view
Over half the agents found a move that covers your first-person view: a white-out, a beam or cone starting at your eyes, or a summon or pulled monster ending up in the camera.
- **White-outs:** Storm Thunderstorm, Cosmic Supernova, Spirit Army, Illusion Phantasmagoria, Fire Conflagration, Light Blinding Flash, Explosion Carpet Bomb.
- **Starts at your eyes:** Light Solar Beam, Wind Gale Force and Tornado, Water Tsunami, Frost Glacial Lance and Blizzard cloud, Sonic Sound Wave, Illusion Mesmerize.
- **Things in your face:** Steel Magnetize and Water Whip pull monsters too close, Spirit Wolf spawns on the camera, Cosmic Moons orbit at eye height, Venom wasps are too big.

The usual fix is to start the effect 1.5–4 m in front of you, lower its opacity or flash, or cap the `whiteFx` value.

## Performance hot list (peak particles in one move; the pool holds 4000)
Water Tsunami 1031 · Explosion Carpet Bomb 910 (plus 252 fx objects) · Frost Blizzard 900 · Fire Fire Brand 883 · Illusion Kaleidoscope 844 (84 fx) · Blood 822 · Storm 802 (Ball Lightning 91 fx).
Frame times were measured with software rendering and 19 browsers running at once, so only compare them within one element.

## Top changes by element
- **Storm:** Thunderstorm blast 38→22, one cloud at a time; soften the cloud flash; drop `sky:1` from the passive strike.
- **Cosmic:** fix the ult loop; Star Shot 8.5/30→10/36 and Moons 30→36 for bosses; cap Supernova `whiteFx` at .6; raise and shrink the Moons.
- **Blood:** Blood Moon drain 7→5, pop 30→18, cap 12→8; lower the moon (1+8→1+5.5); Exsanguinate's backup range 8→12 m.
- **Spirit:** no ult charge from knight hits, and clear old knights; Wolf spawns ahead of you; Wisps 24→30, Wolf 30→36, Command 20→30.
- **Explosion:** Carpet Bomb 130→75 plus the `noUlt` flag; less smoke and blast effects.
- **Sonic:** Sound Wave light 3→1.2, pierce 99→4; Resonance 40→32; Bass Drop 60/18→50/15; boss damage up (Sound Wave 13, Sonic Boom 60·k).
- **Illusion:** Phantasmagoria mirror opacity .45, whiteFx .4; charmed-on-charmed damage 1.6→1.2; Kaleidoscope pop 50→44.
- **Water:** Whip pulls to 3.5 m; Tsunami spawns 4 m out; Surf more visible in first person.
- **Fire:** Conflagration flash 35→20; thinner Flamethrower in your own view; Fire Brand fuse 1.2→.9 s and fewer particles.
- **Gravity:** Levitate's +25% damage taken also applies to bosses; Crush +45 on bosses; Graviton 22→25; remove the duplicate Repulsor ring.
- **Steel:** Magnetize stops at 3 m plus the monster's size; Railgun beam visible in first person and recoil 16→10; Blade Storm swords tilted.
- **Nature:** World Tree vines 25→14 on bosses; less World Tree clutter; Entangle tick 6→8.
- **Magma:** Heat Wave band 1.3→1.6; Meteor field 8→6 dmg and 5→4 s; lava easier to read.
- **Light:** Solar Beam and Blinding Flash start further forward; Penance 60→70, Flash cd 9→8, Orbs 17→19; Judgment lands on the pack.
- **Crystal:** Prism Shard 14→17 (split 5→6); Spire turret 10→13; Resonant base 15→25; Geode fewer and bigger spikes.
- **Venom:** Contagion n·7→n·5; Spit 8→10, puddle tick 2→3, Serpent 11→14; wasps smaller; zones easier to read.
- **Chrono:** Rewind 35→55 and cone 80→100°; Chrono Bolt echo splashes; Slow Field deals 10/s.
- **Frost:** Nova radius 6.5→7.5 and dmg 20→34; hail 8→12; Permafrost stacks 4→3; smaller Lance release; higher, thinner Blizzard cloud.
- **Wind:** Wind Blades 17→24 and cd .42→.36; Tornado spawns 5 m out, ticks 6→9, cd 12→10; Downburst hits bosses (120).

## Harness caveats
- Each move's damage is measured over 1.25 s, so fuses, summons and delayed blasts read low or 0. Use the 30 s kit and boss numbers.
- The bot aims at the nearest enemy, so aimed area moves (Gravity's Crush and Singularity, Nature's Entangle) can land behind the pack.
- Frame times were taken under heavy load (19 software-rendered browsers at once).
