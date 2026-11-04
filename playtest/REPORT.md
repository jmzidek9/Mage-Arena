# Mage Arena playtest report (all 30 elements)

30 Opus agents each played one element through `playtest/run.js`, which drives the real game in headless Edge. Each run cast every move alone, then fought for 30 s against a respawning wave-5 crowd and for 30 s against the Tyrant, while saving screenshots and metrics. Full per-element reports are in `playtest/reports/<element>.md`, and raw numbers and screenshots are in `playtest/out/`.

## The one big bug: ultimates recharge themselves
Every hit adds ultimate charge (`addUlt` in `js/sim.js`, inside `damage()`), and that includes hits from the ultimate itself. A big area ultimate refills its own meter, so it is ready again almost at once. Ultimate casts in 30 s (crowd / boss):

| Element | Casts | Element | Casts |
|---|---|---|---|
| Laser (Prism Nova) | **35** / 6 | Arcane (Torrent) | 8 / **25** |
| Storm (Thunderstorm) | **25** / **25** | Plasma (Fusion Beam) | 7 / 10 |
| Blood (Blood Moon) | **16** / 5 | Explosion (Carpet Bomb) | 7 / 9 |
| Spirit (Army of the Dead) | 4 / **16** | Most other elements | 4–7 |
| Cosmic (Supernova) | **14** / 3 | | |

This one loop explains almost every balance outlier, and most of the screen white-outs. **Fix once, in the shared code:** damage dealt by an ultimate gives no ultimate charge (a `noUlt` flag that `damage()` checks). Then rerun the bench before changing any numbers. Several agents also gave "after the fix" numbers, because their element turns out weak once its ultimate stops looping: Laser is about 0.4×, and Arcane and Shadow about 0.6–0.9×.

## Balance (median of 30: crowd 218.1 dps, boss 137.1 dps)
Target band: 0.85–1.2× the median. ⚠ = the ultimate loop inflates this number.

| Element | Crowd dps | ×median | Boss dps | ×median | Note |
|---|---|---|---|---|---|
| Laser | 1455.9 | 6.68 | 195.9 | 1.43 | ⚠ Nova cast 35×; about 0.4× without it |
| Storm | 987.6 | 4.53 | 907.6 | 6.62 | ⚠ |
| Cosmic | 712.0 | 3.26 | 98.7 | 0.72 | ⚠; weak on bosses |
| Blood | 580.3 | 2.66 | 155.2 | 1.13 | ⚠ |
| Sonic | 323.7 | 1.48 | 85.3 | 0.62 | crowd high, boss low |
| Illusion | 295.9 | 1.36 | 121.9 | 0.89 | charmed monsters hit each other too hard |
| Plasma | 292.9 | 1.34 | 349.8 | 2.55 | ⚠ Fusion Beam on boss |
| Explosion | 282.1 | 1.29 | 298.8 | 2.18 | ⚠ Carpet Bomb |
| Arcane | 278.4 | 1.28 | 913.2 | 6.66 | ⚠ 25 stacked rifts on boss |
| Water | 258.1 | 1.18 | 119.9 | 0.87 | in band |
| Fire | 257.1 | 1.18 | 156.8 | 1.14 | in band |
| Gravity | 231.0 | 1.06 | 72.5 | 0.53 | under-measured: the bot aims past the pack |
| Earth | 226.5 | 1.04 | 139.0 | 1.01 | in band |
| Steel | 225.1 | 1.03 | 134.3 | 0.98 | in band |
| Nature | 217.5 | 1.00 | 208.5 | 1.52 | World Tree too strong on bosses |
| Shadow | 218.1 | 1.00 | 151.3 | 1.10 | in band, but leans on Night Terror looping |
| Rune | 208.8 | 0.96 | 51.5 | 0.38 | very weak on bosses |
| Magma | 206.3 | 0.95 | 146.3 | 1.07 | in band |
| Light | 171.3 | 0.79 | 133.4 | 0.97 | crowd a bit low |
| Bone | 163.6 | 0.75 | 91.0 | 0.66 | low on both |
| Crystal | 163.8 | 0.75 | 95.9 | 0.70 | low on both |
| Venom | 164.0 | 0.75 | 210.9 | 1.54 | stacking pays off on bosses only |
| Abyss | 143.8 | 0.66 | 86.4 | 0.63 | low on both |
| Spirit | 139.2 | 0.64 | 566.4 | 4.13 | ⚠ on boss; crowd low |
| Blades | 134.2 | 0.62 | 166.4 | 1.21 | crowd low |
| Chrono | 129.9 | 0.60 | 137.1 | 1.00 | crowd low |
| Ink | 124.0 | 0.57 | 75.1 | 0.55 | low on both |
| Frost | 105.6 | 0.48 | 116.8 | 0.85 | crowd too low, even for a control element |
| Wind | 78.0 | 0.36 | 65.8 | 0.48 | very weak |
| Soul | 53.0 | 0.24 | 90.5 | 0.66 | weakest: the Soul resource never builds up |

## Second theme: effects that blind your own view
Over half the agents found a move that covers your first-person view: a white-out, a beam or cone starting at your eyes, or something ending up in the camera.
- **White-outs:** Storm Thunderstorm, Cosmic Supernova, Laser Prism Nova, Spirit Army, Arcane Torrent (boss), Illusion Phantasmagoria, Fire Conflagration, Light Blinding Flash, Explosion Carpet Bomb, Plasma Vent, Blades Colossal Blade, Rune Word of Ruin, Abyss Kraken, Soul Reaper.
- **Starts at your eyes:** Light Solar Beam, Wind Gale Force and Tornado, Water Tsunami, Frost Glacial Lance and Blizzard cloud, Sonic Sound Wave, Illusion Mesmerize, Plasma Thermal Lance, Earth Fissure, Boulder and Tectonic Quake dust.
- **Things in your face:** Steel Magnetize and Water Whip pull monsters too close, Blades' Blade Dance leaves the camera inside the target, Spirit Wolf and Bone's Marrow skeleton spawn beside the camera, Abyss tentacle stands dead centre, Cosmic Moons and the Arcane Familiar orbit at eye height, Venom wasps are too big.

The usual fix is to start the effect 1.5–4 m in front of you, lower its opacity or flash, or cap the `whiteFx` value.

## Performance hot list (peak particles in one move; the pool holds 4000)
Water Tsunami 1031 · Explosion Carpet Bomb 910 (plus 252 fx objects) · Frost Blizzard 900 · Fire Fire Brand 883 · Illusion Kaleidoscope 844 (84 fx) · Blood 822 · Storm 802 (Ball Lightning 91 fx) · Soul Soulstorm 685.
Ink's Dragon has a one-time 12 s freeze on first cast while its 30 segment models are built; prebuild them when the game loads. Frame times were measured with software rendering and many browsers running at once, so only compare them within one element.

## Top changes by element
- **Laser:** fix the ult loop; Nova less washed out; after the fix, Pulse 6.5→9, Ricochet 18+40k→24+56k, Drone 9→12, Refractor 25→40; your own lasers visible in first person.
- **Storm:** Thunderstorm blast 38→22, one cloud at a time; soften the cloud flash; drop `sky:1` from the passive strike.
- **Cosmic:** Star Shot 8.5/30→10/36 and Moons 30→36 for bosses; cap Supernova `whiteFx` at .6; raise and shrink the Moons.
- **Blood:** Blood Moon drain 7→5, pop 30→18, cap 12→8; lower the moon; Exsanguinate's backup range 8→12 m.
- **Sonic:** Sound Wave light 3→1.2, pierce 99→4; Resonance 40→32; Bass Drop 60/18→50/15; boss damage up.
- **Illusion:** Phantasmagoria opacity .45, whiteFx .4; charmed-on-charmed damage 1.6→1.2; Kaleidoscope pop 50→44.
- **Plasma:** Vent blast at your feet and half size (white-out); smaller Fusion Beam ball in your own view; Bolt heat 9→7.
- **Explosion:** Carpet Bomb 130→75 plus `noUlt`; less smoke and blast effects.
- **Arcane:** only one Torrent rift at a time; Familiar orbit further out and higher; Missiles 6→7.5, Barrage pierce 1.
- **Water:** Whip pulls to 3.5 m; Tsunami spawns 4 m out; Surf more visible in first person.
- **Fire:** Conflagration flash 35→20; thinner Flamethrower in your own view; Fire Brand fuse 1.2→.9 s.
- **Gravity:** Levitate's +25% damage taken also applies to bosses; Crush +45 on bosses; Graviton 22→25; remove the duplicate Repulsor ring.
- **Earth:** Fissure starts 4.5 m out; Tectonic Quake dust around the edge, not in the middle; Boulder spawns 2.4 m out.
- **Steel:** Magnetize stops at 3 m plus the monster's size; Railgun beam visible in first person, recoil 16→10; Blade Storm swords tilted.
- **Nature:** World Tree vines 25→14 on bosses; less World Tree clutter; Entangle tick 6→8.
- **Shadow:** Night Terror shadows drawn dark, not as pale outlines; after the fix, Daggers 10.5→12, Blackout 16→24, Snare 12→18; purple instead of white bursts.
- **Rune:** Word of Ruin hits a lone boss up to 3× harder; Bolt 13→16, Glyph Trap 45→55, wards arm at 0.6 s; Word of Ruin flash 60→30.
- **Magma:** Heat Wave band 1.3→1.6; Meteor field 8→6 dmg, 5→4 s; lava easier to read.
- **Light:** Solar Beam and Blinding Flash start further forward; Penance 60→70, Flash cd 9→8, Orbs 17→19; Judgment lands on the pack.
- **Bone:** Bone Toss 17→21, Skull 18→22 with cd 4→3.5, Raise Dead chance .25→.35; Marrow skeleton spawns ahead; Bone Dragon passes aimed at the target.
- **Crystal:** Prism Shard 14→17 (split 5→6); Spire turret 10→13; Resonant base 15→25; Geode fewer and bigger spikes.
- **Venom:** Contagion n·7→n·5; Spit 8→10, puddle tick 2→3, Serpent 11→14; wasps smaller.
- **Abyss:** Tentacle Ring wider so none stands in front of you; Void Bolt 13→16, Ring 18→22; Grasp and Maw do damage to bosses; Kraken flash 60→30.
- **Spirit:** no ult charge from knight hits; Wolf spawns ahead of you; Wisps 24→30, Wolf 30→36, Command 20→30.
- **Blades:** Blade Dance dashes until clear of enemies, invulnerability .35→.6 s; Volley at least 3 swords, pierce 3→5; Colossal Blade flash 90→40.
- **Chrono:** Rewind 35→55 and cone 80→100°; Chrono Bolt echo splashes; Slow Field deals 10/s.
- **Ink:** Bolt 14.5→18, Brush 30→40, Pool tick 8→12; Dragon hits bosses harder; prebuild the Dragon models.
- **Frost:** Nova radius 6.5→7.5 and dmg 20→34; hail 8→12; Permafrost stacks 4→3; smaller Lance release; higher, thinner Blizzard cloud.
- **Wind:** Wind Blades 17→24 and cd .42→.36; Tornado spawns 5 m out, ticks 6→9, cd 12→10; Downburst hits bosses (120).
- **Soul:** losing Souls when hit drops from 2 to 1 per hit, with 0.5 s of protection after each, so Souls actually build up; Soulfire 12→16, Reap 30→45; the Reaper fades when it's close to the camera.

## Harness caveats
- Each move's damage is measured over 1.25 s, so fuses, wards, summons and delayed blasts read low or 0. Use the 30 s kit and boss numbers.
- The bot aims at the nearest enemy, so aimed area moves can land behind the pack (Gravity, Nature, Shadow, Earth).
- Frame times were taken under heavy load (up to 20 software-rendered browsers at once).
- Bone: `vault/Elements.md` mentions Bone armor "plates", but no code builds them.
