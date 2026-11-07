# Elements

29 elements, each with its own passive and 5 moves on **LMB, RMB, Q, E** and **R** (the ultimate, which charges as you deal damage and kill).
Each element applies its own status on hit. Element combos were removed on 2026-11-04: an enemy can carry several elements' statuses at once and nothing reacts (see [[Combos]] for what they used to do). The reaction column below is historical.
Everything here is generated from `js/elements.js` (the `ELEMENTS` table), so it matches the game.

Move modes: **tap** casts on press (LMB repeats while held), **hold to aim** shows a ground reticle and casts on release, **hold to charge** powers up the longer you hold, **hold** channels while held.

| Element | Status | Reaction when it hits a statused enemy |
|---|---|---|
| 🔥 Fire | burning | IGNITION (blast) |
| ❄️ Frost | frozen | FREEZE (freeze) |
| ⚡ Storm | shocked | SURGE (chain) |
| 🌊 Water | soaked | TORRENT (pull) |
| 🪨 Earth | cracked | QUAKE (launch) |
| 🌪️ Wind | windswept | CYCLONE (launch) |
| 🌿 Nature | entangled | BLOOM (heal) |
| 🌑 Shadow | cursed | NIGHTFALL (drain) |
| ☀️ Light | radiant | SMITE (heal) |
| ☠️ Venom | poisoned | CONTAGION (spread) |
| 🧲 Steel (removed) | rended | SHRAPNEL (shatter) |
| 🌋 Magma | molten | ERUPTION (blast) |
| 💎 Crystal | refracted | PRISM (shatter) |
| 🔊 Sonic | resonant | FEEDBACK (stun) |
| 🕳️ Gravity | heavy | COLLAPSE (pull) |
| ⏳ Chrono | timeworn | PARADOX (echo) |
| 🩸 Blood | bleeding | HEMORRHAGE (drain) |
| 👻 Spirit | haunted | POSSESSION (stun) |
| 🌠 Cosmic | starstruck | STARFALL (blast) |
| 💣 Explosion | primed | DETONATION (blast) |
| 🎭 Illusion | beguiled | MIRAGE (echo) |
| 💀 Bone | brittle | SPLINTER (shatter) |
| 📜 Rune | inscribed | GLYPHBURST (blast) |
| ⚛️ Plasma | ionized | FUSION (blast) |
| 🪔 Soul | soulburned | SOUL RIP (drain) |
| 🐙 Abyss | drowned | UNDERTOW (pull) |
| 📡 Laser | targeted | REFRACTION (chain) |
| 🔮 Arcane | spellbound | ARCANE SURGE (overload) |
| 🗡️ Blades | lacerated | THOUSAND CUTS (chain) |
| 🖌️ Ink | inked | INKBLOT (spread) |

## 🔥 Fire
Raw destruction. Stack burns on everything, then blow it all up.

**Passive.** Kindling: burns stack up to 3 times, and burning enemies explode when they die. A Fireball that hits an enemy already burning 3 times makes it Flare: a second, hotter blast.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | ☄️ **Fireball** | 0.5 s | Hurl a fireball that explodes on impact. Hitting an enemy that is already burning 3 times makes it Flare for 15 more around it. |
| RMB | 🌋 **Flamethrower** *(hold)* | 4 s | Hold to pour a roaring cone of fire. It stacks burns and ramps up the longer you hold, burning white-hot at full heat. |
| Q | 🐦 **Phoenix Strike** | 7 s | Loose a phoenix of living flame that flies 20 m along your aim, searing everything it passes for 22 and setting it burning twice, then dives into the ground and bursts for 40 around it. |
| E | ⭕ **Ring of Fire** | 12 s | Raise a roaring wall of flame around you. Enemies that cross it are scorched and thrown back. |
| R | 🎇 **Conflagration** | ultimate | A wall of fire rolls out from you across 22 m, setting everything it reaches burning 3 times over. A moment later every burning enemy within 30 m erupts in a pillar of flame: 12, plus 8 for each burn on it, and the eruption sets the enemies around it alight. |

*Look and sound (2026-10-27):* fire explosions are their own effect (a swelling fireball, flame tongues, embers that rise and fall, smoke, a scorch); fireballs trail flame, sparks and smoke; the flamethrower is a two-layer stream that turns white-hot as it ramps and scorches the floor; burning enemies burn visibly. Fire has its own layered sounds: cast whoosh, impact roar, Flare crack, a held roar for the flamethrower and the ring, the brand's sizzle and the ultimate.

*Fire rework (2026-11-04):* the Flamethrower is now a turbulent jet of fire (its own shader on an open cone, starting 0.9 m ahead of your hand): white-yellow at the nozzle, orange in the middle, deep red tongues at the tip, embers, and dark smoke rolling off the end. In your own view it is narrower and dimmer, because you look straight down it. Fire Brand is replaced by **Phoenix Strike**: a big phoenix with flaming wings (the `fire__phoenix` model) flies out 2.5 m ahead of you, sears everything in its path and dives into a fiery blast. Monsters now flash white at most once every 0.25 s, so a stream of hits no longer keeps them solid white. Bench: crowd 1.25, boss 0.86.
## ❄️ Frost
Control the battlefield. Slow everything down, freeze it solid, then shatter it.

**Passive.** Permafrost: 3 Frost hits freeze an enemy solid. Frozen enemies take 40% more damage.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 🧊 **Ice Shard** | 0.28 s | Rapid crystal shards that pierce one enemy. |
| RMB | 🗡️ **Glacial Lance** *(hold to charge)* | 3 s | Hold to charge a lance that pierces a line of enemies and leaves a strip of slick ice along its path for 4 s: anything standing on it slips and takes 20% more damage. Fully charged, it freezes them. Frozen targets shatter for double damage. |
| Q | 🔮 **Frost Orb** | 8 s | Loose a slow orb of ice that drifts 15 m ahead, spraying ice shards in a spinning spiral (8 each, chilling what they hit), then bursts in a ring of 16 shards for 12 each. |
| E | 💠 **Frost Nova** | 11 s | Ice erupts from the ground all around you in three racing waves of spikes, freezing nearby enemies solid. |
| R | 🌨️ **Blizzard** *(hold to aim, release to cast)* | ultimate | Summon a raging blizzard. Hail pounds everything inside, freezing enemies over and over. |

*Frost rework (2026-11-04):* Ice Wall is replaced by **Frost Orb**, a churning ball of ice with orbiting shards that drifts forward from 2 m ahead of you, sprays shards in a two-armed spiral and bursts into a ring of 16. **Frost Nova** now looks like ice erupting from the ground: three waves of tall blue ice spikes race outward (none closer than 2.4 m, the nearest kept short so your view stays open), frost spreads over the floor, cold mist rolls off the edge and snow blasts along the ground; each spike holds for a moment and then shatters. Bench: crowd 0.89, boss 1.00 (was 0.77 / 0.78).

## ⚡ Storm
Speed and chaos. Lightning that leaps from foe to foe.

**Passive.** Static: every 8th Storm hit calls down a free lightning strike. Shocked enemies take 15% more damage.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | ⚡ **Chain Lightning** | 0.36 s | An instant bolt that chains to 2 more enemies. |
| RMB | ⚡ **Lightning Dash** | 5 s | Become a bolt of lightning and streak 8 m forward (further, if a monster is in the way): everything you pass through takes 40 and is stunned for 0.4 s. You leave a crackling trail for 2 s that shocks anything crossing it for 12. |
| Q | 🌩️ **Thunderclap** *(hold to aim, release to cast)* | 7 s | Mark a spot: a moment later a huge bolt slams it, stunning everything there, then jumps to up to 3 enemies nearby. |
| E | 🗼 **Tesla Coil** *(hold to aim, release to cast)* | 13 s | Plant a tesla coil that zaps up to 3 enemies every half second. Two of your coils within 12 m of each other link up with a crackling fence that shocks anything crossing it. |
| R | ⛈️ **Thunderstorm** | ultimate | A storm cloud follows you, hurling a lightning bolt at a nearby enemy four times a second. |

*Storm rework (2026-11-04):* Ball Lightning is replaced by **Lightning Dash**: you streak forward as a jagged bolt with a white core, leaving a fading afterimage where you stood and a crackling trail. A dash never ends inside a monster: it runs on past it, or stops short if the monster is too big (the same rule as Blade Dance). **Thunderclap** now warns with a storm sigil, static crawling up off it and flickers overhead, then lands as a heavy branching bolt (`bigBoltFx`): a white-hot core, forks, a glowing column that lingers, shockwave rings, a scorched crater, arcs over the floor, and arcs that visibly jump to each chained monster. **Thunderstorm** spreads a wide, low storm front of grey-violet cloud overhead, lit by flickers inside it, with driving rain, and every strike is a heavy branching bolt; strikes within 6 m of you are drawn without the white core so they can't white out your view. Bench: crowd 1.10, boss 1.16. Later the same day both got flashier: Thunderclap stabs three thinner bolts down round the sigil before it lands, and its main strike adds an electric dome bursting outward, rubble, sparks raining back down and ground that keeps crackling for a moment; in Thunderstorm, sheet lightning crawls across the cloud's underside, lighting it, and about one strike in three is an extra-heavy bolt with the same dome and rubble plus a crown of bolts arcing out of it. **While Thunderstorm lasts, the whole sky turns into a storm** (`uStorm` in the sky shader, driven from net.js): a dark churning overcast hides the stars, and lightning flashes light the clouds from inside with forked veins running across the sky; the heavy strikes and Thunderclap flash it too. Thunderclap also gathers a knot of storm cloud over its target. Heavy strikes within 9 m of you skip the white core, forks and crown, so they can't white out your view.

## 🌊 Water
Push and pull. Wash enemies off the island, scoop them up, trap them and pound them flat.

**Passive.** Tidal Force: your knockback is 40% stronger. Soaked enemies fly even further.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 💧 **Aqua Bullets** | 0.14 s | Rapid-fire water bullets with heavy knockback. |
| RMB | 🌀 **Riptide Ring** | 4.5 s | Hurl a spinning ring of water 15 m ahead. It scoops up the enemies it touches (up to 5), hits them for 16 and carries them along inside it, then bursts at the end of its run: 30 damage to everything within 4 m, flinging them away. A boss is too heavy to carry: the ring bursts on it. |
| Q | 💦 **Water Cannon** | 7 s | Blast a thick jet of pressurised water 14 m straight ahead for 0.8 s. Everything caught in it takes 6 every 0.1 s and is driven back along the jet, then shoved off the end of it. Bosses only budge a little. |
| E | 🚿 **Waterfall** *(hold to aim, release to cast)* | 10 s | A waterfall crashes down on the target for 3 s. Enemies under it (3 m) are pinned and pounded for 8 every 0.25 s. When it stops, the pool it leaves surges outward: 35 damage to everything within 6 m, sweeping them away. |
| R | 🌊 **Tsunami** | ultimate | Unleash a towering wave that rolls 46 m across the island, carrying enemies with it, often right off the edge. |

## 🪨 Earth
Heavy and unstoppable. Launch enemies into the air and stagger even the biggest brutes.

**Passive.** Bedrock: you take 15% less damage, and your hits stagger enemies twice as fast.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 🪨 **Stone Shot** | 0.7 s | A shotgun blast of stone pebbles. Devastating up close. |
| RMB | 🌑 **Boulder** | 5 s | Roll a huge boulder that plows straight through every enemy in its path. |
| Q | 🗿 **Stone Pillar** *(hold to aim, release to cast)* | 9 s | Erupt a stone pillar that launches enemies skyward. Aim at your own feet to ride it up. |
| E | ⛰️ **Fissure** | 10 s | Split the ground in a line ahead of you. Spikes burst up one after another, launching enemies. |
| R | 🌋 **Tectonic Quake** | ultimate | Shake the island with four quakes that stun every grounded enemy nearby. |

## 🌪️ Wind
Mobility and crowd control. Fly over the fight and hurl enemies off the edge.

**Passive.** Tailwind: move 15% faster and double jump.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 🌀 **Wind Blades** | 0.36 s | Wide crescent blades of air that slice through every enemy in a line. |
| RMB | 💨 **Jet Stream** | 6 s | Open a 16 m wind tunnel straight ahead for 3 s. Enemies that enter it are swept along it, 6 damage every 0.25 s, and hurled out of the far end for 20 more and a launch. Aim it at the edge for ring-outs. Bosses only take the damage. |
| Q | 🪶 **Updraft** | 7 s | Launch yourself high into the air (and nearby enemies with you). Hold Space to glide. |
| E | 🌪️ **Tornado** | 10 s | Send out a tornado that sucks enemies in, spins them around, then flings them away. |
| R | 🌪️ **Downburst** | ultimate | Rip every enemy within 15 m (up to 12) into the sky. For 2 s they are carried through the air toward wherever you aim, then hurled down together for 120 damage and a 1.2 s stun to everything within 5 m of the landing. Aim at the edge for ring-outs. |

## 🌿 Nature
Patient and resilient. Root enemies in place, wall them off with brambles and slam them with living vines.

**Passive.** Regrowth: regenerate 1.5 HP per second.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 🌵 **Thorn Volley** | 0.5 s | Fire a quick burst of three barbed thorns. They stick in the enemy, and every 6th thorn in the same enemy makes them all burst out for 12. |
| RMB | 🪴 **Entangle** *(hold to aim, release to cast)* | 6 s | Roots burst from the ground and hold every enemy in the area in place. As long as they have something to hold, the roots keep spreading: 1 m wider every second, up to 7 m, catching anyone nearby. |
| Q | 🍄 **Sleepcaps** | 9 s | Toss three glowing mushrooms ahead of you. They take root and grow for 1 s, then wait up to 10 s. When a monster comes within 3 m of one, it bursts in a cloud of sleep spores: 28 damage and 2.5 s of deep sleep to every enemy within 3.5 m. |
| E | 🌵 **Bramble Wall** *(hold to aim, release to cast)* | 12 s | Raise a 10 m hedge of thorny brambles across the target for 5 s, side-on to you. Monsters cannot walk through it and enemy shots stop dead in it. Anything touching it is slowed and takes 12 every 0.5 s. When it withers it bursts into a hail of thorns: 25 to everything within 2.5 m of it. |
| R | 🌳 **World Tree** *(hold to aim, release to cast)* | ultimate | Grow a great tree that roots every enemy around it and lashes them with vines. |

## 🌑 Shadow
An assassin. Drag enemies into the dark, snare them, ambush them from every side and strike from behind.

**Passive.** Assassin: hits on an enemy's back deal 50% more damage. Cursed enemies take 15% more damage.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 🗡️ **Shadow Daggers** | 0.45 s | Throw a fan of three shadow daggers. |
| RMB | ⚫ **Void Orb** | 6 s | Launch a slow black sun of shadow that drifts 18 m ahead, passing through enemies. Its tendrils drag every enemy within 6 m toward it, and anything it touches takes 18. Then it collapses: 65 to everything within 4.5 m, and a ring of shadow daggers bursts out of it for 14 each. |
| Q | 🕸️ **Shadow Snare** *(hold to aim, release to cast)* | 7 s | A pool of darkness opens at the target and shadow tendrils burst out of it, seizing every enemy in the area: 18 damage, held in place for 1.5 s and dragged into the middle. While held they take 40% more damage. |
| E | 🥷 **Shade Ambush** *(hold to aim, release to cast)* | 9 s | Three shadow assassins climb out of the ground around the target, daggers drawn, then one after another dash straight through it from three sides: each dash cuts every enemy in its path for 30 and stuns it for 0.5 s. |
| R | 🌑 **Eclipse** | ultimate | A black sun rises and night falls for 5 s. Every enemy within 20 m (up to 14) is blinded, unable to attack, and shadows slash it for 22 every 0.6 s. When the light returns, every one of them is cut down for 60 more. |

## ☀️ Light
Holy power. Burn enemies with beams of sunlight and smite anything that dares to attack.

**Passive.** Radiance: your damage heals your partner for 8% of it (or you for 4% when alone). Radiant enemies deal 30% less damage.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | ✨ **Radiant Orbs** | 0.4 s | Fast, dead-straight bolts of light. No homing, but a headshot hits 75% harder. |
| RMB | 🔆 **Solar Beam** *(hold)* | 6 s | Hold to fire a piercing beam of sunlight. It starts wide and soft, then focuses the longer you hold it: narrower, but much stronger. |
| Q | 💥 **Blinding Flash** | 8 s | A searing flash in front of you. Enemies caught in it are blinded for 1 s and left Illuminated for 5 s: they glow, and take 20% more damage from everything. |
| E | ⚖️ **Penance** | 12 s | Brand every enemy in front of you (14 m) for 8 s: a halo appears over each one, with 2 spears of light hanging above it. Whenever a branded enemy starts an attack, a spear drops on it first: 70 damage and a 0.6 s stun, so the attack never lands. |
| R | 🌞 **Divine Judgment** | ultimate | Press once to call down a colossal pillar of light for 5 s. It follows your crosshair on its own, sliding onto whatever monster you look at, and sears everything beneath it. |

## ☠️ Venom
A slow, nasty death. Stack poison on everything with gas, acid and fangs, and let it spread.

**Passive.** Virulence: poison stacks up to 8 times, and poisoned enemies spread their poison when they die.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 🤮 **Venom Spit** | 0.55 s | Lob a glob of venom that splashes and leaves a toxic puddle. Every monster that dies in a puddle makes it grow and last longer. |
| RMB | ☁️ **Toxic Cloud** *(hold to aim, release to cast)* | 7 s | Release a drifting cloud of poison gas that stacks poison on everything inside it. |
| Q | 🐍 **Serpent** | 7 s | Send a venom serpent racing across the ground for 4.5 s. It locks onto the nearest enemy within 18 m, lunges at it, bites it for 9 and poisons it twice, then darts to the next one; it can bite the same enemy again after 1.5 s. |
| E | 🦂 **Scorpion Sting** *(hold to aim, release to cast)* | 9 s | A giant scorpion tail bursts out of the ground at the target and stings the enemy nearest it 3 times: 20 damage and 2 poison stacks per sting, and the last sting flings it into the air. The tail lashes everything within 2.5 m of where it strikes for 8. |
| R | 🐉 **Hydra** *(hold to aim, release to cast)* | ultimate | A three-headed venom hydra bursts out of the ground at the target for 6 s. Each head spits venom at a different enemy within 16 m every 0.4 s: 7 damage and a poison stack around the hit, and a small toxic puddle. Then it dives back into the ground in a poison eruption: 60 to everything within 6 m. |

## 🧲 Steel (removed)
Removed from the game on 2026-11-04 at the player's request. Its code and icons are in `archive/steel-2026-11-04/` (paste back into `js/elements.js` and `js/icons.js` to restore).

## 🌋 Magma
Slow and devastating. Flood the island with lava and drop a meteor on anything left standing.

**Passive.** Molten Core: molten enemies burn and take 10% more damage, and anything that hits you turns molten.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 🔴 **Magma Glob** | 0.7 s | Lob a heavy glob of magma. It bounces once before it splashes, and leaves a pool of lava that cools into a lump of black rock after 3 s, blocking monsters for 6 s (up to 4 rocks). |
| RMB | ♨️ **Eruption** *(hold to aim, release to cast)* | 5 s | The ground at your target glows, then erupts in a geyser of lava that launches enemies. They come down into the lava pool it leaves behind, which burns for 3 s and then cools into rock. |
| Q | 🌊 **Lava Tide** | 10 s | Send a slow, 9 m wide wave of molten lava rolling 10 m forward. Enemies caught in it are slowed and coated in lava with every scorch (6 each), and any coated 5 times harden into rock and crack apart for 70. |
| E | 🗻 **Volcano** *(hold to aim, release to cast)* | 15 s | Raise a small volcano for 10 s that lobs a magma bomb every 0.9 s at an enemy within 16 m, aimed where it is heading: 22 damage in a 2.2 m splash. |
| R | ☄️ **Meteor** *(hold to aim, release to cast)* | ultimate | Call down a colossal meteor. After a short warning it obliterates the area and floods it with lava. |

## 💎 Crystal
Precision and geometry. Shards that split and refract, turrets, and diamond-hard defence.

**Passive.** Prismatic: enemies killed by Crystal shatter into shards that strike nearby foes.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 🔷 **Prism Shard** | 0.45 s | A crystal shard that splits into three smaller shards when it hits. |
| RMB | 🪩 **Geode Bomb** | 6 s | Lob a geode that cracks open and sprays crystal shards in every direction. The shards stick in the ground as a field of crystal spikes for 4 s that cut anything walking over them for 9. |
| Q | 💠 **Crystal Rift** | 8 s | Rip a rift of jagged crystal spikes 16 m along the floor toward your aim. Every enemy it reaches is impaled for 60 and launched. A moment later the spikes shatter, cutting everything along the rift for 30 more. |
| E | 🔮 **Crystal Spire** *(hold to aim, release to cast)* | 14 s | Grow a crystal spire for 10 s, crowned by three orbiting shards. Every 0.5 s it fires a crystal bolt (13) at the nearest enemy within 16 m. Your own projectiles that pass by it refract into three. |
| R | 🏺 **Crystal Tomb** *(hold to aim, release to cast)* | ultimate | Encase every enemy in the area in crystal. After 2.5 seconds the tombs shatter for massive damage. |

## 🔊 Sonic
Rhythm and resonance. Waves of sound that build up until enemies burst.

**Passive.** Resonance: 5 Sonic hits make an enemy resonate and burst, damaging and stunning everything around it.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 〰️ **Sound Wave** | 0.5 s | A wave of sound that passes through enemies and widens as it travels. |
| RMB | 📢 **Sonic Boom** *(hold to charge)* | 5 s | Hold to build up a sonic boom, then blast a cone in front of you. Full charge stuns. |
| Q | 🌀 **Implosion** *(hold to aim, release to cast)* | 7 s | A pocket of silence at the target sucks enemies in for a moment, then bursts in a sonic boom that stuns them. |
| E | 🔗 **Harmonic Link** *(hold to aim, release to cast)* | 13 s | Link up to 6 enemies with a harmonic chord for 6 s. Damage dealt to one is shared at 40% with all the others. |
| R | 🎵 **Bass Drop** | ultimate | Eight beats of bass blast out around you, each bigger than the last, ending in a massive drop. |

## 🕳️ Gravity
Bend space. Pull enemies together, lift them helplessly into the air, then slam them down.

**Passive.** Crushing Weight: your hits deal double damage to airborne enemies, and slammed enemies take 50% more fall damage.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | ⚫ **Graviton** | 0.55 s | A slow, heavy orb that drags nearby enemies toward its path and implodes on impact. |
| RMB | ⬇️ **Crush** *(hold to aim, release to cast)* | 6 s | Multiply gravity at the target, crushing and stunning enemies. Airborne enemies are slammed into the floor. |
| Q | 🎈 **Levitate** *(hold to aim, release to cast)* | 9 s | Lift every enemy in the area helplessly into the air for 2 seconds, then drop them hard. While they float they take 25% more damage from everything. |
| E | 💫 **Repulsor** | 9 s | Blast everything away from you and reflect nearby enemy projectiles back at them. |
| R | 🌌 **Singularity** *(hold to aim, release to cast)* | ultimate | Open a black hole that drags in every enemy nearby, grinds them down, then collapses in a huge explosion. |

## ⏳ Chrono
Master of time. Echoing attacks, frozen moments, rewinding your enemies, and stopping time itself.

**Passive.** Time Dilation: all your cooldowns run 18% faster. Timeworn enemies are 35% slower.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 🕐 **Chrono Bolt** | 0.45 s | A bolt of frozen time. Each hit echoes 1.2 seconds later for the same damage again. |
| RMB | ⏸️ **Stasis** | 8 s | Fire an hourglass that shatters on the first enemy it hits and freezes it, and up to 3 more within 6 m of it, in time for 3 seconds. Damage they take meanwhile is stored and lands all at once, 30% stronger. Bosses resist it and take 30 instead. |
| Q | 👤 **Future Self** | 12 s | Tear open a rift in time and pull your future self through it. For 6 s a golden echo of you fights at your side, firing a Chrono Bolt (18, echoing 1.2 s later for 18 more) every 0.3 s at the enemy nearest your aim within 24 m. When its time runs out it snaps back to the future in a burst: 40 to everything within 4 m. |
| E | 🕰️ **Slow Field** *(hold to aim, release to cast)* | 13 s | Raise a golden dome of warped time (6 m, 6 s) over the target: enemies inside move and attack 70% slower, turn Timeworn every second, and enemy shots crawl. |
| R | ⏱️ **Time Stop** | ultimate | Stop time for 4 seconds. Enemies freeze, and all the damage you deal piles up and lands 50% stronger when time resumes. |

## 🩸 Blood
Brutal damage that grows the lower your health gets. Make enemies bleed, pile them up and rip them open.

**Passive.** Bloodlust: heal for 2.5% of damage dealt, and hit up to 50% harder the lower your health. Bleeding enemies feed you.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 🩸 **Blood Bolt** | 0.4 s | A fast bolt of blood magic that hits hard. |
| RMB | 🌙 **Crimson Fan** | 3.5 s | Fling a fan of five blood blades that slice through everything in front of you, 16 damage each, and make enemies bleed. Up close, every blade lands. |
| Q | 🌀 **Crimson Maelstrom** | 8 s | A whirlwind of blood blades spins around you for 2.5 s, cutting every enemy within 4.5 m for 6 every 0.25 s and making it bleed. Then the blades fly outward, slashing everything within 7 m for 24 and throwing it back. |
| E | 🩸 **Crimson Mire** | 9 s | Splash a pool of blood on the ground for 4 seconds. It drags enemies toward its centre and makes them bleed, 10 damage every half second. Pile them up, then spin Crimson Maelstrom through them. |
| R | 🌕 **Blood Moon** | ultimate | A blood moon rises above you and drains every enemy nearby for 4 seconds. Anything it drains to death bursts, splashing 18 damage on the enemies around it. |

**Rework (2026-11-03):** healing cut (lifesteal 6% to 2.5%, bleeding enemies feed you 10% of the bleed instead of 50%). Blood Scythe, Blood Tether and Blood Orb became Crimson Fan, Exsanguinate and Crimson Mire: make them bleed, pile them up, rip them open. Blood moves no longer cost HP. Blood Moon now rises out of the ground into a pulsing halo over a sea of red light, with blood raining up into it.

## 👻 Spirit
The summoner. The restless dead, a shrieking banshee, a spectral wolf and an army of ghost knights fight for you.

**Passive.** Spectral Host: monsters fight back against your summons (a spirit falls after 2 blows, a knight after 4, the wolf after 6), drawing them away from you. Haunted enemies deal 25% less damage.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 🕯️ **Soul Wisps** | 0.45 s | Release wisps that hunt down enemies on their own. |
| RMB | 👉 **Command** | 7 s | Point at an enemy: every spirit, wolf and knight you have lunges at it, strikes for 20 and keeps attacking it. With no summons, a wandering spirit rises beside you instead. |
| Q | 😱 **Banshee** *(hold to aim, release to cast)* | 10 s | Summon a banshee at the target for 7 s. Every 2 seconds she shrieks: enemies within 5 m take 18 damage and flee in fear for 1.5 s. |
| E | 🐺 **Spirit Wolf** | 12 s | Summon a spectral wolf for 16 seconds. It hunts the enemies closest to you and savages them. |
| R | ⚔️ **Army of the Dead** | ultimate | Six spectral knights rise around you and cut down your enemies for 9 seconds. |

## 🌠 Cosmic
The power of the stars. Constellations, orbiting moons, meteor showers and a supernova.

**Passive.** Stellar Rhythm: every 4th Star Shot is a giant piercing star. Starstruck enemies take 12% more damage.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | ⭐ **Star Shot** | 0.38 s | Fire shooting stars. Every 4th one is a giant star that pierces 3 enemies. |
| RMB | 🌙 **Orbiting Moons** | 9 s | Three moons orbit you. Whenever an enemy comes close, a moon slams into it and explodes. |
| Q | ✴️ **Constellation** *(hold to aim, release to cast)* | 2.5 s | Place up to 3 stars. Stars link to each other with beams of starlight that burn enemies crossing them. |
| E | 🌠 **Meteor Shower** *(hold to aim, release to cast)* | 12 s | Tear open a starry rift in the sky over the target and rain twelve shooting stars down through it, 22 damage each within 2 m, then drop one great star in the middle: 45 within 4 m. |
| R | 💥 **Supernova** | ultimate | A star ignites above you and grows for 2 seconds, then goes supernova, obliterating and blinding everything nearby. |

## 💣 Explosion
Pure demolition. Grenades, sticky bombs, mines, rocket jumps and a carpet-bombing run.

**Passive.** Demolitions: your explosions are 20% bigger. Primed enemies get knocked back 50% further.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 💣 **Grenade** | 0.6 s | Lob a bouncing grenade that explodes after a short fuse, or instantly when it hits an enemy. |
| RMB | 🚀 **Rocket Launcher** | 3 s | Fire a smoking rocket straight ahead. It picks up speed as it flies and blows up on the first thing it hits: 52 damage in a 3.6 m blast that hurls enemies away. |
| Q | 🚀 **Rocket Jump** | 6 s | Blast the ground under your feet to rocket up and forward, flattening whatever is nearby. |
| E | 🎯 **Proximity Mines** | 12 s | Toss four mines ahead of you. Each one blows when an enemy walks over it, and every blast sets off your other mines within 5 m a moment later, so a minefield goes up in a chain. |
| R | ✈️ **Carpet Bomb** | ultimate | Call in a bombing run: fourteen bombs drop in a line ahead of you, one after another. |

## 🎭 Illusion
Smoke and mirrors. Fool monsters into fighting phantoms, and each other.

**Passive.** Misdirection: Beguiled enemies deal 20% less damage, and 1 in 3 of their attacks strikes a phantom instead of you.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 🦋 **Phantom Moths** | 0.45 s | Release a glowing moth flanked by two phantom moths that flutter off to hunt enemies. Phantoms deal half damage. |
| RMB | 🪞 **Decoy** *(hold to aim, release to cast)* | 8 s | Conjure a phantom double of yourself at the target. Monsters within 12 m attack it instead of you for 5 s. Once it is struck 3 times, or time runs out, it shatters, damaging and beguiling everything around it. |
| Q | 😵‍💫 **Mesmerize** | 10 s | A hypnotic pulse charms every monster in front of you for 4 s: they turn on each other and attack the nearest monster instead of you. Bosses resist it. |
| E | 🔷 **Kaleidoscope** | 7 s | Fire a prism shard (20). The enemy it hits splinters into 3 big glittering false images of itself that race off to the monsters nearest it and burst against them, 50 damage within 3 m each. With no other monster around, they turn back on the enemy itself. |
| R | 🎪 **Phantasmagoria** | ultimate | Trap everything within 14 m in a hall of mirrors: monsters are charmed and fight each other for 5 s, then the mirrors shatter for 55 damage to every one of them. |

## 💀 Bone
A necromancer. Bone spears, cackling skulls, skeletons that burst into shrapnel, and the slain rising to fight for you.

**Passive.** Raise Dead: monsters you kill with Bone have a 25% chance to rise as a skeleton warrior that fights for you for 12 s (up to 3 at once). Brittle enemies take 12% more damage.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 🦴 **Bone Toss** | 0.5 s | Hurl a spinning bone that pierces 2 enemies and pins the last one it hits for a moment. |
| RMB | 🪝 **Skeleton Rip** | 5 s | Hurl a barbed bone hook. The enemy it catches has its skeleton torn right out of it: 40 damage and stunned for 1.5 s, while its skeleton rises in front of it as a skeleton warrior that fights for you for 12 s (it counts for Marrow Burst). |
| Q | 💥 **Marrow Burst** | 12 s | Every skeleton you have explodes in a storm of bone shrapnel: 28 damage within 3.5 m of each. Monsters the blasts kill rise as new skeletons. With no skeletons, one rises beside you instead. |
| E | ⛓️ **Bone Cage** *(hold to aim, release to cast)* | 9 s | Ribs of bone burst from the ground at the target for 4 s: a real cage. Monsters inside cannot get out, monsters outside cannot get in, and enemy shots cannot pass the bars. Anything that touches the bars is gashed. |
| R | 🐉 **Bone Dragon** *(hold to aim, release to cast)* | ultimate | Raise a skeletal dragon that makes three low strafing runs across the target, criss-crossing it and breathing a line of ghostfire along each pass. Everything it burns turns Brittle, and monsters it kills rise as skeletons. |

## 📜 Rune
Ancient script. A trapper: every spell but the bolt is a ward on the ground that enemies set off by walking over it, and every third spell is Empowered.

**Passive.** Rune Mastery: every third spell you cast is Empowered and deals 60% more damage. Inscribed enemies take 10% more damage.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 🔹 **Rune Bolt** | 0.4 s | Fire a spinning rune that pierces through an enemy. |
| RMB | 🔯 **Glyph Trap** *(hold to aim, release to cast)* | 4 s | Inscribe a ward glyph at the target (up to 3 at once). It arms after a second, and the first enemy to step on it is blasted into the air and stunned. |
| Q | 🪨 **Sigilfall** *(hold to aim, release to cast)* | 6 s | Inscribe a sigil ward (up to 2 at once). When an enemy steps on it, runic chains hold everything nearby and three runestones crash down, the last and largest stunning everything it hits. |
| E | 🔘 **Binding Circle** *(hold to aim, release to cast)* | 12 s | Inscribe a binding ward. When an enemy steps on it, a great binding circle springs up for 6 s: enemies inside are slowed by 40%, take 25% more damage from everything, and are scorched by the runes every second. |
| R | 📖 **Word of Ruin** *(hold to aim, release to cast)* | ultimate | Inscribe the word of ruin as a great ward. When an enemy steps on it, a great rune ignites over every enemy within 20 m of it (up to 12), then each one slams down for 75 damage and a 1.5 s stun (a lone boss takes 225). |

## ⚛️ Plasma
Raw, unstable power. Every Plasma spell builds Heat that makes you hit harder, right up until you overheat.

**Passive.** Heat: Plasma spells build Heat, which adds up to 50% damage. At 100 Heat you overheat: you vent in a burst and your Plasma spells lock for 2.5 s. Heat cools off on its own. Ionized enemies burn.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 🔴 **Plasma Bolt** | 0.28 s | Rapid bolts of superheated plasma that splash on impact. Builds Heat. |
| RMB | 🟣 **Plasma Cannon** *(hold to charge)* | 3.5 s | Hold to charge a sphere of plasma, then release to fire it. It detonates in a blast that grows with the charge. Builds a lot of Heat. |
| Q | 🌡️ **Vent** | 7 s | Dump all your Heat in a shockwave around you. The more Heat you vent, the harder it hits (up to 110 damage) and the further it throws. |
| E | 🗡️ **Thermal Lance** | 6 s | Thrust a thin, white-hot lance of plasma 12 m straight ahead, piercing every enemy in the line for 40 and driving them back. Above 50 Heat it also leaves a burning line on the floor for 3 s. |
| R | ☢️ **Fusion Beam** | ultimate | Fire a colossal beam of plasma for 4 s that follows your aim and melts everything in its path. You cannot overheat meanwhile. |

## 🪔 Soul
A reaper. Harvest a soul from every kill to grow stronger, and cut down the weak in a single swing.

**Passive.** Soulbound: every kill gives you a Soul (up to 15; elites give 2, bosses 5). Each Soul you hold makes your spells 4% stronger, and getting hit makes you drop 1 (then none for 0.5 s). Reap and Soul Rend tear out extra Souls; Soulstorm and The Reaper spend them. Soulburned enemies burn.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 💙 **Soulfire** | 0.42 s | Fire bolts of pale soulfire that burn whatever they touch. |
| RMB | 🌒 **Reap** | 5 s | Wind up and sweep a spectral scythe through everything in front of you (6.5 m), flinging them aside. Monsters left under 20% health are reaped outright (not bosses), and each one reaped gives you an extra Soul. |
| Q | 🫀 **Soul Rend** | 8 s | A pale ghostly hand reaches into the first enemy it touches and rips a see-through copy of it out of its body: 45 damage, a 1 s stun, and 2 Souls for you. The enemy is left Hollowed for 4 s and takes 25% more damage from Soul. |
| E | 🌀 **Soulstorm** | 10 s | Unleash your Souls as shrieking soul missiles that hunt down enemies: 2 for every Soul you hold (at least 8), 18 damage each. Spends your Souls. |
| R | 💀 **The Reaper** *(hold to aim, release to cast)* | ultimate | Summon the Reaper at the target. It spends your Souls: its scythe sweeps round three times, plus once more for every 3 Souls spent (up to 8 sweeps), cutting everything within 9 m for 70 and reaping any monster left under 25% health. |

## 🐙 Abyss
Something ancient lives below. Tentacles erupt from the floor to seize, crush and drag your enemies under.

**Passive.** Lurker Below: each Abyss hit has a 20% chance to make a tentacle burst up under the enemy and lash it for 18 more damage. Drowned enemies are 25% slower.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 🔵 **Void Bolt** | 0.42 s | Fire a bolt of black water that bursts on impact, splashing the enemies around it. |
| RMB | 🦑 **Grasp of the Deep** *(hold to aim, release to cast)* | 6 s | A great tentacle erupts at the target and seizes every enemy there, hoisting them into the air. Then it hurls the biggest one at the nearest other monster (within 14 m): 45 to both and a splash around the landing. The rest are slammed into the floor. |
| Q | 🌀 **Whirlpool** *(hold to aim, release to cast)* | 10 s | Open a whirlpool of black water at the target for 3 s. It spins every enemy within 5 m round and drags it toward the eye, drowning it for 10 every 0.3 s. Then the deep erupts in a geyser: 75 to everything within 3.5 m of the eye, flinging it high. Bosses only take the damage. |
| E | 🐙 **Tentacle Ring** | 14 s | Eight tentacles burst up around you for 6 s and lash any enemy that comes within 6 m, three at a time. |
| R | 👁️ **Kraken** *(hold to aim, release to cast)* | ultimate | The Kraken stirs: colossal tentacles burst from the floor around the target and thrash for 6 s, crushing enemies and dragging them in, then haul everything down for 100 damage. |

## 📡 Laser
Precision light. Instant beams that ricochet off pillars, walls, the floor and your own crystal lenses, hitting harder with every bounce.

**Passive.** Ricochet and Focus: every bounce makes a Laser hit 25% harder, and Laser hits to the head always crit. Hitting the same enemy again within 1.5 s builds Focus, +6% damage per stack (up to 6). Targeted enemies take 12% more damage.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 🟢 **Pulse Laser** | 0.3 s | An instant laser pulse that bounces once off whatever it meets. |
| RMB | ✳️ **Ricochet Beam** *(hold to charge)* | 4 s | Hold to charge a thick beam that bounces up to 4 times off pillars, walls and the floor, piercing everything it touches. |
| Q | 🔷 **Refractor** *(hold to aim, release to cast)* | 5 s | Hang a floating crystal lens at the target for 12 s (up to 2). Any of your lasers that pass through it split into 3 beams that lock onto the nearest enemies, each counting as one more bounce. When it expires it bursts. |
| E | 🛸 **Laser Drone** | 15 s | Deploy a hovering drone that follows you for 12 s and fires a bouncing laser at the nearest enemy every 0.4 s. |
| R | 🔺 **Prism Nova** | ultimate | A great prism rises above you for 4 s and fires eight standing lasers out in a star. Each bounces up to 3 times off everything it meets, and every enemy in a beam is shredded for 17 every 0.25 s (25% more after each bounce). |

## 🔮 Arcane
Pure magic. Homing missiles, an owl familiar and polymorphs, and charges that build into a devastating barrage.

**Passive.** Arcane Charges: every Arcane spell except Barrage gives you a charge (up to 4; they fade 8 s after your last cast). Each charge makes your spells 8% stronger. Spellbound enemies take 10% more damage.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 🌟 **Arcane Missiles** | 0.55 s | Fire three arcane missiles in quick succession that weave toward enemies. |
| RMB | 🎆 **Arcane Barrage** | 3 s | Spend all your Arcane Charges on a barrage of heavy arcane bolts: 2, plus 2 for every charge spent. |
| Q | 🦉 **Arcane Familiar** | 14 s | Summon a spectral owl for 12 s. It circles above you, and every second it swoops on whatever you are aiming at, raking it for 22 and marking it: marked enemies take 20% more damage for 4 s. Each strike gives you an Arcane Charge. |
| E | 🐑 **Polymorph** | 12 s | Turn the first enemy you hit, and up to 2 more near it, into harmless sheep for 4 s. Bosses resist it. |
| R | 🪄 **Arcane Torrent** | ultimate | Tear open a great arcane rift in the sky in front of you that rains 38 homing missiles on enemies within 22 m over 4 s, then collapses in a nova: 40 to everything within 6 m under it. |

## 🗡️ Blades
A sword saint. Summoned swords orbit you, guard you, and fly wherever you point.

**Passive.** Sword Halo: a spectral sword forms around you every 2.5 s (up to 6), and an orbiting sword strikes any enemy that gets within 3 m. Lacerated enemies bleed.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 🔪 **Flying Daggers** | 0.35 s | Throw a pair of spectral daggers that curve toward enemies. Each hit has a 25% chance to forge a new orbiting sword. |
| RMB | 🏹 **Sword Volley** | 2.5 s | Launch every orbiting sword at your crosshair. Each one pierces through enemies for 20 damage. With no swords ready, you conjure three. |
| Q | 💃 **Blade Dance** | 8 s | Dash 9 m forward in a whirl of blades, cutting everything you pass through for 32 damage, and forge 2 new swords. |
| E | ☔ **Rain of Blades** *(hold to aim, release to cast)* | 11 s | Twelve swords rain down in a ring around the target, 28 damage each, and stay stuck in the ground for 6 s, slowing enemies among them by 30%. Walk through a planted sword to pull it into your halo. |
| R | ⚜️ **Colossal Blade** *(hold to aim, release to cast)* | ultimate | A colossal sword falls from the heavens onto the target: 160 damage and a huge launch. It stands for 5 s sending out shockwaves, and your halo fills with 6 swords. |

## 🖌️ Ink
A calligrapher. Living ink: brush strokes that mire, koi that hunt, and a dragon painted across the sky.

**Passive.** Bleeding Ink: monsters you kill with Ink burst in a splash that hits everything within 3 m for 15 and inks it. Inked enemies are 25% slower.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 💧 **Ink Bolt** | 0.4 s | Fling a glob of ink that splashes where it lands, inking everything within 2 m. |
| RMB | 🖌️ **Brush Stroke** | 5 s | Sweep a giant brush through a 120° arc in front of you: 30 damage to everything within 7.5 m and a hard shove, leaving a crescent of wet ink that mires anything on it (50% slower) for 5 s. |
| Q | 🐟 **Ink Koi** | 9 s | Paint three koi of living ink that swim low along the floor as if it were water, hunting the nearest enemies. Each one leaps up to bite for 36 and bursts in a splash of ink. |
| E | 🫧 **Ink Pool** *(hold to aim, release to cast)* | 12 s | Pour a pool of ink at the target for 6 s. Every enemy that wades in is seized by the ink and stuck fast for 1.5 s, then mired (50% slower) while it stays, taking damage every second. |
| R | 🐉 **Ink Dragon** *(hold to aim, release to cast)* | ultimate | Paint a great ink dragon that bursts from the floor and circles high over the target for 4 s. Its coil is a cage: nothing caught inside can get out, and it tightens, squeezing everyone toward the centre. All the while the dragon spits globs of ink down on them, 4 a second, each 22 on a direct hit and 22 within 2.4 m. Then it dives in: 90 damage and a 1.2 s stun. |

## Balance
**Ability rework, part 1 (2026-11-04):** Water Whip became Riptide Ring and Surf became Waterfall; Gale Force became Jet Stream; Parasite Seed became Vine Slam and Snaptrap became Bramble Wall. Tsunami, Tectonic Quake, Entangle and World Tree got new looks (a curling crest and spray, racing molten cracks and rings of spikes, roots tearing up round the area, vines whipping out of the tree). Bench after: Water 1.07 / 0.88, Earth 0.85 / 0.99, Nature 0.83 / 0.90 (then Vine Slam 25 + 15 raised to 30 + 20), Wind 0.74 / 1.00 (control kit). Riptide Ring bursts on a boss instead of passing through it.

**After removing combos and Steel (2026-11-04):** full bench, median crowd 175.8 / boss 138.7. Tuned the outliers: Meteor 135 → 110 (Magma 1.30 → 1.08 crowd), The Reaper 70 → 85 a sweep (Soul 0.74 → 0.85), Arcane Torrent missiles 16 → 22 (Arcane 0.73 → 0.83 crowd, 1.31 boss), Rain of Blades 28 → 36 (Blades 0.76 → 0.81). Gravity (0.61) and Sonic (0.65) stay low on bosses, as before: they are crowd-control kits.

**Rework (2026-11-04, second pass):** Eruption no longer shakes the screen; Heat Wave became Lava Tide (a rolling crest of molten lava, no more fire); Volcano bombs lead moving targets (0.8 s flight). Crystal Rift replaces Resonant Crystal; Crystal Spire got an orbiting crown, beam shots and climbing light rings. Crimson Maelstrom replaces Exsanguinate, Void Orb replaces Nightmare Pit (it looked like Shadow Snare), Whirlpool replaces Maw of the Deep, Future Self replaces Rewind, Skeleton Rip replaces Cackling Skull, Rocket Launcher replaces Sticky Bomb. Stasis now freezes up to 4 enemies. Ink Dragon circles high and spits ink (4 a second) before it dives. Kaleidoscope, Slow Field, Arcane Torrent (rift now in front of you, ends in a nova) and Meteor Shower (sky rift plus a great final star) are much easier to see. Prism Nova's lasers stand still and have a three-layer pulsing look. The 1v1 Duel is off the menu: **Training** took its place (dummies that never attack, damage / DPS per move, N = cooldowns off, X = reset; `js/modes.js`).

**Visual pass (2026-11-04):** every move of Magma, Crystal, Sonic, Gravity, Chrono, Blood, Spirit, Cosmic, Explosion, Illusion, Bone, Rune, Plasma, Soul, Abyss, Laser, Arcane, Blades and Ink got stronger looks (no number changes), built on shared helpers in `js/elements.js`: lavaSplash, prismFx/prismRays, eqBars, clockFx, bloodSplat, starPop, deepSplash, plasmaArcs, runeLetters, bladeCut, quakeCracks, plus a per-projectile `look.upd` hook (`js/view.js`). The Blood Moon turns the sky red (`uRed`), the Eclipse turns it dark (`uEclipse`). Fixed on the way: Heat Wave's wall never showed (its width wasn't sent to clients), and Supernova, Singularity, Phantasmagoria, Word of Ruin and Kraken flashed far above the 40 cap; Vent and Fusion Beam no longer white out your own view.

**Steel's own identity (2026-11-04):** Steel was a second sword element next to Blades. It is now heavy metal and magnetism: Caltrops became Polarity (charged pairs yanked into each other) and Blade Storm became Wrecking Ball (a spiked ball on a chain that pays out to 9.5 m, then smashes down where you look; bosses take 60 a hit since they can't be flung). Saw Blade 14 → 17. Glyph 🧲. Bench: 1.03 / 0.95.

**Ability rework, part 3 (2026-11-04):** Bubble Prison became Water Cannon and Tsunami now rolls 46 m (life 2.6 → 4.2 s); Vine Slam became Sleepcaps; Blackout became Nightmare Pit and Shade Ambush is slower (assassins rise over 0.9 s, dashes 0.38 s apart) with daggers, afterimages and a triple-slash mark; Penance shows a shaft of light, a bigger halo and spears, and a sigil under each branded enemy; Serpent moves 16 m/s (lunging at 26), turns hard and looks 18 m ahead; Acid Rain became Scorpion Sting so Venom's E is no longer a second cloud; Hydra got spines, horns, a bubbling pool and mist. Bench after: Water 0.88 / 0.91, Nature 0.81 / 0.89 (Sleepcaps 28, World Tree vines 30), Shadow 1.09 / 1.11, Light 0.96 / 1.15, Venom 1.20 / 0.86 (Serpent poisons twice per bite, Hydra 6 s and 7 per spit). Nature's Q and E icons were still the old Parasite Seed and Snaptrap pictures; fixed.

**Ability rework, part 2 (2026-11-04):** Shadow Swap became Shade Ambush and Night Terror became Eclipse (the sky goes dark under a black sun); Shadow Snare now shows its tendrils and a +40% mark on everyone it holds. Blinding Flash got rays and a fan of light, Penance shows the two spears hanging over each branded enemy, and Divine Judgment locks onto the monster under your crosshair (before, it only followed the floor point, so aiming at a body sent it far behind). Toxic Cloud is real billowing gas; Serpent lives 4.5 s instead of 1.6 s, hunts from enemy to enemy and has a body; Contagion became Acid Rain and Plague Swarm became Hydra. Bench after: Shadow 1.02 / 1.10, Light 0.86 / 1.18 (Divine Judgment hits bosses for 30%, since it now actually stays on them; 16 per tick instead of 14), Venom 1.16 / 0.92 (Hydra spits 8 and 1 stack, puddles 1.5 s; Hydra puddles count as Venom Spit in the per-move numbers). The move showcase (`run.js moves`) now aims aimed moves at the monsters' feet instead of over their heads; the bench still aims the old way, so its numbers stay comparable.

**After the 30-element playtest (2026-11-04):** ultimates no longer charge themselves, and the bench (`node playtest/bench.js`) now runs every element 3 times and reports damage per move, because a single 30 s crowd run swings by up to 2x. Five rounds of tuning brought every element to 0.85–1.2x the median on crowds and bosses. Control and mobility kits (Frost, Wind, Gravity on bosses) sit lower, and so do Sonic, Rune and Abyss against a lone boss (about 0.65–0.75x): they are built for crowds. The main changes:
- **Too strong:** Supernova 140 → 55 (bosses still take 140), Thunderstorm 38 → 16, Phantasmagoria 120 → 55 and charmed monsters hit each other ×1.2 (was ×1.6), Prism Nova 28 → 17, burns 7 → 3/s, burning-death blasts 20 → 12, Fireball 18 → 16, and the Conflagration eruption cut to 12 + 8 per burn, Blood Moon drain 7 → 5 (pop 30 → 18, 8 targets), Carpet Bomb 130 → 50, Grenade 21 → 17, Fusion Beam 15 → 5.5, Plasma Cannon −25%, Blade Storm 20 → 16, Meteor lava 8 → 6 for 4 s.
- **Too strong on bosses:** Arcane Torrent missiles do 2.5 to a boss (16 to anything else), Barrage 12 → 8.5. Spirit summons do about half damage to bosses (Army 12/4.5, Wolf 34/13, Command 20/9). World Tree vines do 14 to bosses.
- **Too weak:** Soul loses 1 Soul per hit with 0.5 s grace (it was 2 per hit, so Souls never built up), plus Soulfire 20, Reap 45, Soul Rend 45, at least 8 Soulstorm missiles at 18, and a Reaper that sweeps for 70. Crystal: Prism Shard 17, turret 13, Resonant base 25, Geode shards 15 and spikes 9. Wind: Blades 26 with cd 0.36 s, Tornado ticks 9 with cd 10 s, and Downburst slams bosses for 120. Ink: Bolt 27, Brush 40, Koi 36, Pool 12, Dragon 20. Frost: Nova 7.5 m for 34, hail 12, freezes after 3 hits. Bone: Toss 21, Skull 22 with cd 3.5 s, raise chance 35%. Rune: Bolt 21, Glyph Trap 55; a big boss trips wards with its edge; Word of Ruin 75, but a lone boss takes 225. Abyss: Void Bolt 20, Kraken crush 24, and Maw bites a boss for 70. Gravity: Crush +80 to bosses, and Levitate's +25% applies to bosses too. Cosmic: Star Shot 11/40, Moons 36. Light: Penance 70, Flash cd 8 s, Orbs 19, Judgment 14. Chrono: Rewind 55 base in a 100° cone. Shadow: Daggers 11.5, Blackout 24, Snare 18. Blades: Daggers 9.5, Volley 20 per sword (at least 3, pierce 5), Rain of Blades 28, Colossal Blade 160. Spirit: Wisps 30. Sonic: Sound Wave 15, Sonic Boom 18–72, Bass Drop beats 13 and a 40 drop (a boss takes 120).

**After the move rework (2026-10-27):** the bench was rebuilt and run on the old and new builds side by side, comparing each element with itself. Elements whose moves did not change wander by up to about ±30% between runs, so only bigger shifts were tuned: Frost's Glacial Lance ice no longer slows (it kept monsters out of Frost Nova's reach; it makes them take 20% more damage instead), Chrono's Rewind is stronger and hits bosses harder to make up for losing Accelerate, Blood got a harder Blood Bolt and a heavier Blood Orb to replace Blood Pact against bosses, and Kaleidoscope and Downburst were buffed. Trimmed: Geode Bomb's spike field, Resonant Crystal, Penance (two smites per brand), Venom Spit puddle growth and Serpent, Thorn Volley and Parasite Seed, Spirit's Command, Bone's Marrow Burst and skeletons, Surf. Every element now lands within that noise band of its old score.

**Original pass:** tuned with an automated bench (a bot plays every element through the same fights: 40 s against 8 respawning mixed monsters, 30 s against a boss, and each ultimate on its own). After the pass every element's core kit lands within about 0.85–1.2x of the median damage, the spread the bench's own run-to-run noise allows. Elements built for control, defence or bosses (Wind, Sonic, Soul, Gravity) sit lower against crowds or bosses on purpose; Blood sits higher because it pays for it in health. Fixed along the way: Graviton, Venom Spit and Magma Glob ignored their listed damage; Sticky Bomb could be thrown and detonated every 0.6 s (now it sticks and blows on its own).

## Visual pass
A capture of every move in action, plus a count of each element's bespoke effects, picked out the plainest four, and they were reworked:
- **Explosion:** every blast is a burst of fire-lit smoke rolling into grey smoke, with flying debris, embers and a glowing scorch mark.
- **Earth:** new pillar and spike models (warm two-tone stone, glowing amber seams, rubble); real dust instead of glowing dust; rock debris off every impact; the Boulder trails dust as it rolls.
- **Crystal:** shards shatter into crystal fragments on hit; Geode Bomb and the Spire burst into crystals; Diamond Shell visibly forms around you out of shards.
- **Gravity:** Graviton visibly drags matter into itself and collapses into a black core; Crush leaves a crater; Levitate lifts rubble with the enemies; Repulsor throws out a force dome.
Every element that kicks up dust now gets real dust too.

**Your own view (2026-11-04):** glow and particles fade out within about 2 m of the camera, light flashes are capped, and the white screen wash never goes above 35%. Beams, cones and waves start 1.5–5 m ahead of you (Solar Beam, Blinding Flash, Gale Force, Thermal Lance, Tsunami, Tornado, Boulder, Fissure). Pulls stop short of the camera (Water Whip 3.5 m, Magnetize 3 m). Summons appear ahead of you (Spirit Wolf, the Marrow and Command spirits), and orbiters fly above eye height (Moons, Familiar). Tentacle Ring leaves a gap straight ahead. Blade Dance keeps dashing until you're clear of the monster. Night Terror's shadows are solid dark figures. Ink's Dragon is built when the game loads.

**Spirit rework (2026-11-04):** monsters now fight Spirit's summons. Any monster whose nearest target is a summon (or one about as close as you are) goes for it, and every blow it lands costs the summon a life: a spirit has 2, a knight 4, the wolf 6. Summons of the same kind spread out: each takes the nearest monster no ally is already fighting, keeps it until it dies, and keeps its distance from the others, so the six Army knights fan out over six monsters instead of piling onto one. All summons use a solid spectral look (a dark see-through body with a bright green rim, drawn with normal blending), so a group no longer adds up to a white blob, and they turn see-through when one is right beside you. Each knight rises from its own ring of light, the wolf trails mist as it runs, and a summon flashes white when it's hit. In the bench, damage taken in the crowd fight fell from about 507 to 184 HP; damage dealt is unchanged (crowd 0.84, boss 1.15). Kills no longer raise wandering spirits (the old Restless Dead passive): only Spirit's own abilities summon (Command when you have no summons out, Spirit Wolf, Army of the Dead). Damage stayed the same (crowd 0.84, boss 1.11).

## Blocks
Hold **C** to raise your element's block (`js/blocks.js`). Every block works the same way: while it holds, nothing reaches you from any side; it has 80 health, breaks when that runs out (back in 4 s) and mends when you let go. Only the look is the element's own: its casting rings and a signature piece (a frost wall, a spirit knight, a saw...). Water, Arcane and God Mode raise a bubble round you.

**Brightness (2026-11-04):** blocks glow at full strength on purpose: dimming the glow was tried and read as too dim. Frost's Ice Mirror tints its ice wall a deeper blue with half the glow (pale ice bloomed into a white slab); the Ice Wall spell itself is unchanged. Spirit's Ancestral Ward glows at 75%, a touch softer than the rest. Checked for all 30: each one soaks a full monster hit.

## Element resources
Some elements build up something you can see above your ability bar and around your wizard: Plasma's **Heat** (a bar that turns into OVERHEATED), Soul's **Souls** (pale flames circling you), Arcane's **charges** (orbs whirling round you), Blades' **swords** (orbiting your waist), Bone's armor **plates**, Rune's count toward the next **Empowered** spell and Laser's **Focus** pips.

## Switching mid-game
Press **Esc** (or ⚙ on touch) during a run and pick any element under *General > Switch element*. It replaces the loadout you are using (your Tab loadout stays). Works solo and online. Solo, the menu pauses the game; online it keeps running for your partner and the enemies.

## Second element
Right-click a second element in the lobby (or pick it from the drop-down). **Tab** swaps loadouts mid-fight; each element keeps its own cooldowns, and the ultimate meter is shared.

Related: [[Combos]], [[Enemies]], [[Blender Assets]]
