# Elements

30 elements, each with its own passive and 5 moves on **LMB, RMB, Q, E** and **R** (the ultimate, which charges as you deal damage and kill).
Each element applies its own status on hit; hitting an enemy that carries a *different* element's status triggers a reaction (see [[Combos]]).
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
| ⚔️ Steel | rended | SHRAPNEL (shatter) |
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

**Passive.** Kindling: burns stack up to 3 times, and burning enemies explode when they die.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | ☄️ **Fireball** | 0.5 s | Hurl a fireball that explodes on impact. |
| RMB | 🌋 **Flamethrower** *(hold)* | 4 s | Hold to pour a cone of fire. Stacks burns and ramps up the longer you hold. |
| Q | 🔥 **Fire Brand** | 6 s | Brand the first enemy you hit with 3 burns. A moment later the brand detonates, blasting everything around it and setting every enemy caught in the blast burning with 3 burns of its own. |
| E | ⭕ **Ring of Fire** | 12 s | Raise a wall of flame around you. Enemies that cross it are scorched and thrown back. |
| R | 🐦‍🔥 **Phoenix Dive** *(hold to aim, release to cast)* | ultimate | Rise as a phoenix and crash onto the target, setting the ground ablaze. |

## ❄️ Frost
Control the battlefield. Slow everything down, freeze it solid, then shatter it.

**Passive.** Permafrost: 4 Frost hits freeze an enemy solid. Frozen enemies take 40% more damage.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 🧊 **Ice Shard** | 0.28 s | Rapid crystal shards that pierce one enemy. |
| RMB | 🗡️ **Glacial Lance** *(hold to charge)* | 3 s | Hold to charge a lance that pierces a line of enemies and leaves a strip of slick ice along its path for 4 s: anything standing on it slips and takes 20% more damage. Fully charged, it freezes them. Frozen targets shatter for double damage. |
| Q | 🧱 **Ice Wall** *(hold to aim, release to cast)* | 10 s | Raise a wall of ice that blocks enemies and their shots, chilling anything that touches it. |
| E | 💠 **Frost Nova** | 11 s | Blast frost in every direction, freezing nearby enemies solid. |
| R | 🌨️ **Blizzard** *(hold to aim, release to cast)* | ultimate | Summon a raging blizzard. Hail pounds everything inside, freezing enemies over and over. |

## ⚡ Storm
Speed and chaos. Lightning that leaps from foe to foe.

**Passive.** Static: every 8th Storm hit calls down a free lightning strike. Shocked enemies take 15% more damage.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | ⚡ **Chain Lightning** | 0.36 s | An instant bolt that chains to 2 more enemies. |
| RMB | 🔮 **Ball Lightning** | 6 s | A slow orb of lightning that zaps nearby enemies as it drifts, then bursts. |
| Q | 🌩️ **Thunderclap** *(hold to aim, release to cast)* | 7 s | Mark a spot: a moment later a huge bolt slams it, stunning everything there, then jumps to up to 3 enemies nearby. |
| E | 🗼 **Tesla Coil** *(hold to aim, release to cast)* | 13 s | Plant a tesla coil that zaps up to 3 enemies every half second. Two of your coils within 12 m of each other link up with a crackling fence that shocks anything crossing it. |
| R | ⛈️ **Thunderstorm** | ultimate | A storm cloud follows you, hurling a lightning bolt at a nearby enemy four times a second. |

## 🌊 Water
Push and pull. Wash enemies off the island, trap them, and surf straight through the crowd.

**Passive.** Tidal Force: your knockback is 40% stronger. Soaked enemies fly even further.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 💧 **Aqua Bullets** | 0.14 s | Rapid-fire water bullets with heavy knockback. |
| RMB | 🪢 **Water Whip** | 3.5 s | Crack a 10 m whip of water straight ahead. Everything along it is dragged toward you, and the tip cracks for double damage and a 0.5 s stun. |
| Q | 🫧 **Bubble Prison** | 9 s | Trap an enemy in a floating bubble. It is helpless and takes 30% more damage. |
| E | 🏄 **Surf** | 9 s | Ride a wave 14 m forward. Every enemy in your way is hit for 24, soaked and thrown aside, clearing a lane through the crowd. |
| R | 🌊 **Tsunami** | ultimate | Unleash a towering wave that sweeps across the island, carrying enemies with it, often right off the edge. |

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
| LMB | 🌀 **Wind Blades** | 0.42 s | Wide crescent blades of air that slice through every enemy in a line. |
| RMB | 🍃 **Gale Force** | 5 s | A massive gust that hurls enemies away and blows enemy shots out of the air. Great for ring-outs. |
| Q | 🪶 **Updraft** | 7 s | Launch yourself high into the air (and nearby enemies with you). Hold Space to glide. |
| E | 🌪️ **Tornado** | 12 s | Send out a tornado that sucks enemies in, spins them around, then flings them away. |
| R | 🌪️ **Downburst** | ultimate | Rip every enemy within 15 m (up to 12) into the sky. For 2 s they are carried through the air toward wherever you aim, then hurled down together for 120 damage and a 1.2 s stun to everything within 5 m of the landing. Aim at the edge for ring-outs. |

## 🌿 Nature
Patient and resilient. Root enemies in place, plant guardians and seeds that grow inside your foes.

**Passive.** Regrowth: regenerate 1.5 HP per second.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 🌵 **Thorn Volley** | 0.5 s | Fire a quick burst of three barbed thorns. They stick in the enemy, and every 6th thorn in the same enemy makes them all burst out for 12. |
| RMB | 🪴 **Entangle** *(hold to aim, release to cast)* | 6 s | Roots burst from the ground and hold every enemy in the area in place. As long as they have something to hold, the roots keep spreading: 1 m wider every second, up to 7 m, catching anyone nearby. |
| Q | 🌱 **Parasite Seed** | 11 s | Shoot a seed into an enemy. It grows inside it for 3 s, slowing it more and more, then bursts into vines that root it and up to 3 enemies near it for 2 s, 30 damage each. |
| E | 🪤 **Snaptrap** *(hold to aim, release to cast)* | 14 s | Plant a carnivorous flytrap that chomps the nearest enemy for huge damage and pins it. Small monsters (not elites or bosses) are swallowed whole. |
| R | 🌳 **World Tree** *(hold to aim, release to cast)* | ultimate | Grow a great tree that roots every enemy around it and lashes them with vines. |

## 🌑 Shadow
An assassin. Pin enemies down, blind them, swap places with them and strike from the dark.

**Passive.** Assassin: hits on an enemy's back deal 50% more damage. Cursed enemies take 15% more damage.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 🗡️ **Shadow Daggers** | 0.45 s | Throw a fan of three shadow daggers. |
| RMB | 🌑 **Blackout** *(hold to aim, release to cast)* | 6 s | Hurl an orb of darkness that bursts into a choking cloud for 3 s. Every enemy it catches, or that walks in, is blinded: hit for 16, stunned for 1.5 s and spun round, its back wide open to your Assassin bonus. |
| Q | 🕸️ **Shadow Snare** *(hold to aim, release to cast)* | 7 s | Shadow tendrils burst from the ground, pinning every enemy in the area and dragging them together. While held they take 40% more damage. |
| E | 🔄 **Shadow Swap** | 9 s | Throw a shadow bolt. You trade places with the first enemy it hits, which is stunned for 1.5 s facing away from you, its back wide open to your Assassin bonus. Bosses are only stunned. |
| R | 👤 **Night Terror** | ultimate | Every enemy within 18 m (up to 12) is haunted by its own shadow for 5 s. They flee from it in terror while it strikes them twice a second, then every shadow bursts for 50. |

## ☀️ Light
Holy power. Burn enemies with beams of sunlight and smite anything that dares to attack.

**Passive.** Radiance: your damage heals your partner for 8% of it (or you for 4% when alone). Radiant enemies deal 30% less damage.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | ✨ **Radiant Orbs** | 0.4 s | Fast, dead-straight bolts of light. No homing, but a headshot hits 75% harder. |
| RMB | 🔆 **Solar Beam** *(hold)* | 6 s | Hold to fire a piercing beam of sunlight. It starts wide and soft, then focuses the longer you hold it: narrower, but much stronger. |
| Q | 💥 **Blinding Flash** | 9 s | A searing flash in front of you. Enemies caught in it are blinded for 1 s and left Illuminated for 5 s: they glow, and take 20% more damage from everything. |
| E | ⚖️ **Penance** | 12 s | Brand every enemy in front of you (14 m) with a halo for 8 s. The first 2 times a branded enemy tries to attack, a spear of light smites it for 60 and stuns it for 0.6 s before the attack lands. |
| R | 🌞 **Divine Judgment** | ultimate | Call down a colossal pillar of light that follows your crosshair for 4.5 seconds, searing everything beneath it. |

## ☠️ Venom
A slow, nasty death. Stack poison on everything, then make it erupt and spread.

**Passive.** Virulence: poison stacks up to 8 times, and poisoned enemies spread their poison when they die.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 🤮 **Venom Spit** | 0.55 s | Lob a glob of venom that splashes and leaves a toxic puddle. Every monster that dies in a puddle makes it grow and last longer. |
| RMB | ☁️ **Toxic Cloud** *(hold to aim, release to cast)* | 7 s | Release a drifting cloud of poison gas that stacks poison on everything inside it. |
| Q | 🐍 **Serpent** | 7 s | Send a venom serpent slithering across the ground. It weaves toward the nearest enemy ahead of it and bites every enemy in its path, poisoning them 3 times. |
| E | 🧪 **Contagion** | 10 s | Every poisoned enemy nearby erupts, taking damage per poison stack and spreading half its stacks to its neighbours. |
| R | 🐝 **Plague Swarm** | ultimate | Release a swarm of eight venom wasps that hunt down enemies and sting them over and over. |

## ⚔️ Steel
A blade master. Boomerang saws, railguns and a storm of swords. Shields mean nothing to you.

**Passive.** Armor Breaker: Rend stacks 3 times (+6% damage taken each). At 3 stacks your hits go straight through shields.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 🪚 **Saw Blade** | 0.6 s | Throw a spinning saw that slices through enemies, then comes back and slices them again. |
| RMB | 🔫 **Railgun** *(hold to charge)* | 4 s | Hold to charge a hypersonic rail spike that pierces every enemy in a line and blasts them far back. The recoil shoves you backward too. Full charge adds 2 Rend stacks. |
| Q | 🧲 **Magnetize** | 8 s | Magnetize every enemy in front of you and drag them right to your feet, stunned. |
| E | 📌 **Caltrops** | 11 s | Scatter a field of steel caltrops. Enemies that step on them are cut, slowed and rended. |
| R | ⚔️ **Blade Storm** | ultimate | Ten giant swords orbit you, sweeping outward and back again, shredding everything they touch. |

## 🌋 Magma
Slow and devastating. Flood the island with lava and drop a meteor on anything left standing.

**Passive.** Molten Core: molten enemies burn and take 10% more damage, and anything that hits you turns molten.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 🔴 **Magma Glob** | 0.7 s | Lob a heavy glob of magma. It bounces once before it splashes, and leaves a pool of lava that cools into a lump of black rock after 3 s, blocking monsters for 6 s (up to 4 rocks). |
| RMB | ♨️ **Eruption** *(hold to aim, release to cast)* | 5 s | The ground at your target glows, then erupts in a geyser of lava that launches enemies. They come down into the lava pool it leaves behind, which burns for 3 s and then cools into rock. |
| Q | 🌡️ **Heat Wave** | 10 s | Send a slow, 9 m wide wall of shimmering heat rolling 10 m forward. Enemies caught in it are slowed and heat up with every scorch, and any that heat up 5 times melt for 70. |
| E | 🗻 **Volcano** *(hold to aim, release to cast)* | 15 s | Raise a small volcano that keeps lobbing magma bombs at enemies. |
| R | ☄️ **Meteor** *(hold to aim, release to cast)* | ultimate | Call down a colossal meteor. After a short warning it obliterates the area and floods it with lava. |

## 💎 Crystal
Precision and geometry. Shards that split and refract, turrets, and diamond-hard defence.

**Passive.** Prismatic: enemies killed by Crystal shatter into shards that strike nearby foes.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 🔷 **Prism Shard** | 0.45 s | A crystal shard that splits into three smaller shards when it hits. |
| RMB | 🪩 **Geode Bomb** | 6 s | Lob a geode that cracks open and sprays crystal shards in every direction. The shards stick in the ground as a field of crystal spikes for 4 s that cut anything walking over them for 6. |
| Q | 💠 **Resonant Crystal** *(hold to aim, release to cast)* | 12 s | Plant a humming crystal for 6 s. It soaks up a share of all the damage dealt to enemies within 6 m of it, glowing brighter, then shatters for 15 plus 8% of everything it soaked (up to 50 more) to every enemy in range. |
| E | 🔮 **Crystal Spire** *(hold to aim, release to cast)* | 14 s | Grow a crystal spire that shoots enemies. Your own projectiles that pass by it refract into three. |
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
| RMB | ⏸️ **Stasis** | 8 s | Freeze an enemy in time for 3 seconds. Damage it takes meanwhile is stored and lands all at once, 30% stronger. |
| Q | ⏪ **Rewind** | 6 s | Mark the spot every enemy in front of you (14 m) is standing on. 2.5 s later time snaps back: each one is yanked back to its mark and takes 35, plus 14 for every metre it had moved (up to 235). Bosses take 150 more. Knock them far away first. |
| E | 🕰️ **Slow Field** *(hold to aim, release to cast)* | 13 s | Warp time in an area: enemies inside move and attack 70% slower, and enemy shots crawl. |
| R | ⏱️ **Time Stop** | ultimate | Stop time for 4 seconds. Enemies freeze, and all the damage you deal piles up and lands 50% stronger when time resumes. |

## 🩸 Blood
Power at a price. Spend your own health for brutal damage, and drink it back from your enemies.

**Passive.** Bloodlust: heal for 6% of damage dealt, and hit up to 50% harder the lower your health. Blood moves cost HP. Bleeding enemies feed you.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 🩸 **Blood Bolt** | 0.4 s | Costs 1.5 HP. A fast bolt of blood magic that hits hard. |
| RMB | 🌙 **Blood Scythe** | 4 s | Costs 5 HP. Hurl a huge crescent of blood that cuts through everything and makes enemies bleed. |
| Q | 🪝 **Blood Tether** | 7 s | Costs 4 HP. Hurl a blood hook that latches onto the first enemy, drags it to you and bleeds it for 3 seconds. |
| E | 🩸 **Blood Orb** | 6 s | Costs 4 HP. Rip blood out of every enemy in front of you (12 m, 8 damage each) into an orb over your hand, then hurl it. It bursts for 85, plus 8 and a bigger blast for every enemy you drained. |
| R | 🌕 **Blood Moon** | ultimate | A blood moon rises above you and drains every enemy nearby for 4 seconds. Anything it drains to death bursts, splashing 30 damage on the enemies around it. |

## 👻 Spirit
The summoner. The restless dead, a shrieking banshee, a spectral wolf and an army of ghost knights fight for you.

**Passive.** Restless Dead: every monster you kill rises as a wandering spirit that fights for you for 8 s (up to 4 at once). Haunted enemies deal 25% less damage.

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
| E | 🌠 **Meteor Shower** *(hold to aim, release to cast)* | 12 s | Rain twelve shooting stars down on the target area. |
| R | 💥 **Supernova** | ultimate | A star ignites above you and grows for 2 seconds, then goes supernova, obliterating and blinding everything nearby. |

## 💣 Explosion
Pure demolition. Grenades, sticky bombs, mines, rocket jumps and a carpet-bombing run.

**Passive.** Demolitions: your explosions are 20% bigger. Primed enemies get knocked back 50% further.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 💣 **Grenade** | 0.6 s | Lob a bouncing grenade that explodes after a short fuse, or instantly when it hits an enemy. |
| RMB | 🧨 **Sticky Bomb** | 3 s | Throw a sticky bomb that clings to whatever it hits and blows a moment later in a big blast. Bombs stuck to the same monster merge into one: every extra bomb adds its damage and widens the blast. |
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
| E | 🔷 **Kaleidoscope** | 7 s | Fire a prism shard. The enemy it hits splinters into 3 glittering false images of itself that race off to the monsters nearest it and burst against them, 50 damage within 3 m each. With no other monster around, they turn back on the enemy itself. |
| R | 🎪 **Phantasmagoria** | ultimate | Trap everything within 14 m in a hall of mirrors: monsters are charmed and fight each other for 5 s, then the mirrors shatter for 120 damage to every one of them. |

## 💀 Bone
A necromancer. Bone spears, cackling skulls, skeletons that burst into shrapnel, and the slain rising to fight for you.

**Passive.** Raise Dead: monsters you kill with Bone have a 25% chance to rise as a skeleton warrior that fights for you for 12 s (up to 3 at once). Brittle enemies take 12% more damage.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 🦴 **Bone Toss** | 0.5 s | Hurl a spinning bone that pierces 2 enemies and pins the last one it hits for a moment. |
| RMB | ☠️ **Cackling Skull** | 4 s | Hurl a burning skull that bites an enemy, then leaps on to the next one, up to 5 times. |
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
| R | 📖 **Word of Ruin** *(hold to aim, release to cast)* | ultimate | Inscribe the word of ruin as a great ward. When an enemy steps on it, a great rune ignites over every enemy within 20 m of it (up to 12), then each one slams down for 90 damage and a 1.5 s stun. |

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

**Passive.** Soulbound: every kill gives you a Soul (up to 15; elites give 2, bosses 5). Each Soul you hold makes your spells 4% stronger, and getting hit makes you drop 2. Reap and Soul Rend tear out extra Souls; Soulstorm and The Reaper spend them. Soulburned enemies burn.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 💙 **Soulfire** | 0.42 s | Fire bolts of pale soulfire that burn whatever they touch. |
| RMB | 🌒 **Reap** | 5 s | Wind up and sweep a spectral scythe through everything in front of you (6.5 m), flinging them aside. Monsters left under 20% health are reaped outright (not bosses), and each one reaped gives you an extra Soul. |
| Q | 🫀 **Soul Rend** | 8 s | A pale ghostly hand reaches into the first enemy it touches and rips a see-through copy of it out of its body: 35 damage, a 1 s stun, and 2 Souls for you. The enemy is left Hollowed for 4 s and takes 25% more damage from Soul. |
| E | 🌀 **Soulstorm** | 10 s | Unleash your Souls as shrieking soul missiles that hunt down enemies: 2 for every Soul you hold (at least 4), 14 damage each. Spends your Souls. |
| R | 💀 **The Reaper** *(hold to aim, release to cast)* | ultimate | Summon the Reaper at the target. It spends your Souls: its scythe sweeps round three times, plus once more for every 3 Souls spent (up to 8 sweeps), cutting everything within 9 m for 50 and reaping any monster left under 25% health. |

## 🐙 Abyss
Something ancient lives below. Tentacles erupt from the floor to seize, crush and drag your enemies under.

**Passive.** Lurker Below: each Abyss hit has a 20% chance to make a tentacle burst up under the enemy and lash it for 18 more damage. Drowned enemies are 25% slower.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 🔵 **Void Bolt** | 0.42 s | Fire a bolt of black water that bursts on impact, splashing the enemies around it. |
| RMB | 🦑 **Grasp of the Deep** *(hold to aim, release to cast)* | 6 s | A great tentacle erupts at the target and seizes every enemy there, hoisting them into the air. Then it hurls the biggest one at the nearest other monster (within 14 m): 45 to both and a splash around the landing. The rest are slammed into the floor. |
| Q | 👄 **Maw of the Deep** *(hold to aim, release to cast)* | 10 s | Hide a maw in the floor at the target for up to 12 s. The first monster to step on it is swallowed whole: gone from the fight for 2 s, then spat out for 70 damage, splashing 35 on everything within 3.5 m. Bosses are too big to swallow. |
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
| R | 🔺 **Prism Nova** | ultimate | A great prism rises above you and spins for 4 s, firing eight lasers in a star that bounce off everything and shred whatever they cross. |

## 🔮 Arcane
Pure magic. Homing missiles, an owl familiar and polymorphs, and charges that build into a devastating barrage.

**Passive.** Arcane Charges: every Arcane spell except Barrage gives you a charge (up to 4; they fade 8 s after your last cast). Each charge makes your spells 8% stronger. Spellbound enemies take 10% more damage.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 🌟 **Arcane Missiles** | 0.55 s | Fire three arcane missiles in quick succession that weave toward enemies. |
| RMB | 🎆 **Arcane Barrage** | 3 s | Spend all your Arcane Charges on a barrage of heavy arcane bolts: 2, plus 2 for every charge spent. |
| Q | 🦉 **Arcane Familiar** | 14 s | Summon a spectral owl for 12 s. It circles above you, and every second it swoops on whatever you are aiming at, raking it for 22 and marking it: marked enemies take 20% more damage for 4 s. Each strike gives you an Arcane Charge. |
| E | 🐑 **Polymorph** | 12 s | Turn the first enemy you hit, and up to 2 more near it, into harmless sheep for 4 s. Bosses resist it. |
| R | 🪄 **Arcane Torrent** | ultimate | Open an arcane rift above you that rains 38 homing missiles on enemies within 22 m over 4 s. |

## 🗡️ Blades
A sword saint. Summoned swords orbit you, guard you, and fly wherever you point.

**Passive.** Sword Halo: a spectral sword forms around you every 2.5 s (up to 6), and an orbiting sword strikes any enemy that gets within 3 m. Lacerated enemies bleed.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 🔪 **Flying Daggers** | 0.35 s | Throw a pair of spectral daggers that curve toward enemies. Each hit has a 25% chance to forge a new orbiting sword. |
| RMB | 🏹 **Sword Volley** | 2.5 s | Launch every orbiting sword at your crosshair. Each one pierces through enemies for 24 damage. With no swords ready, you conjure two. |
| Q | 💃 **Blade Dance** | 8 s | Dash 9 m forward in a whirl of blades, cutting everything you pass through for 32 damage, and forge 2 new swords. |
| E | ☔ **Rain of Blades** *(hold to aim, release to cast)* | 11 s | Twelve swords rain down in a ring around the target, 20 damage each, and stay stuck in the ground for 6 s, slowing enemies among them by 30%. Walk through a planted sword to pull it into your halo. |
| R | ⚜️ **Colossal Blade** *(hold to aim, release to cast)* | ultimate | A colossal sword falls from the heavens onto the target: 160 damage and a huge launch. It stands for 5 s sending out shockwaves, and your halo fills with 6 swords. |

## 🖌️ Ink
A calligrapher. Living ink: brush strokes that mire, koi that hunt, and a dragon painted across the sky.

**Passive.** Bleeding Ink: monsters you kill with Ink burst in a splash that hits everything within 3 m for 15 and inks it. Inked enemies are 25% slower.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 💧 **Ink Bolt** | 0.4 s | Fling a glob of ink that splashes where it lands, inking everything within 2 m. |
| RMB | 🖌️ **Brush Stroke** | 5 s | Sweep a giant brush through a 120° arc in front of you: 30 damage to everything within 7.5 m and a hard shove, leaving a crescent of wet ink that mires anything on it (50% slower) for 5 s. |
| Q | 🐟 **Ink Koi** | 9 s | Paint three koi of living ink that swim low along the floor as if it were water, hunting the nearest enemies. Each one leaps up to bite for 26 and bursts in a splash of ink. |
| E | 🫧 **Ink Pool** *(hold to aim, release to cast)* | 12 s | Pour a pool of ink at the target for 6 s. Every enemy that wades in is seized by the ink and stuck fast for 1.5 s, then mired (50% slower) while it stays, taking damage every second. |
| R | 🐉 **Ink Dragon** *(hold to aim, release to cast)* | ultimate | Paint a great ink dragon that bursts from the floor and coils around the target for 4 s. Its body is a cage: nothing caught inside can get out, and the coil tightens, squeezing everyone toward the centre while ink rains on them. Then it dives in: 90 damage and a 1.2 s stun. |

## Balance
**After the move rework (2026-10-27):** the bench was rebuilt and run on the old and new builds side by side, comparing each element with itself. Elements whose moves did not change wander by up to about ±30% between runs, so only bigger shifts were tuned: Frost's Glacial Lance ice no longer slows (it kept monsters out of Frost Nova's reach; it makes them take 20% more damage instead), Chrono's Rewind is stronger and hits bosses harder to make up for losing Accelerate, Blood got a harder Blood Bolt and a heavier Blood Orb to replace Blood Pact against bosses, and Kaleidoscope and Downburst were buffed. Trimmed: Geode Bomb's spike field, Resonant Crystal, Penance (two smites per brand), Venom Spit puddle growth and Serpent, Thorn Volley and Parasite Seed, Spirit's Command, Bone's Marrow Burst and skeletons, Surf. Every element now lands within that noise band of its old score.

**Original pass:** tuned with an automated bench (a bot plays every element through the same fights: 40 s against 8 respawning mixed monsters, 30 s against a boss, and each ultimate on its own). After the pass every element's core kit lands within about 0.85–1.2x of the median damage, the spread the bench's own run-to-run noise allows. Elements built for control, defence or bosses (Wind, Sonic, Soul, Gravity) sit lower against crowds or bosses on purpose; Blood sits higher because it pays for it in health. Fixed along the way: Graviton, Venom Spit and Magma Glob ignored their listed damage; Sticky Bomb could be thrown and detonated every 0.6 s (now it sticks and blows on its own).

## Visual pass
A capture of every move in action, plus a count of each element's bespoke effects, picked out the plainest four, and they were reworked:
- **Explosion:** every blast is a burst of fire-lit smoke rolling into grey smoke, with flying debris, embers and a glowing scorch mark.
- **Earth:** new pillar and spike models (warm two-tone stone, glowing amber seams, rubble); real dust instead of glowing dust; rock debris off every impact; the Boulder trails dust as it rolls.
- **Crystal:** shards shatter into crystal fragments on hit; Geode Bomb and the Spire burst into crystals; Diamond Shell visibly forms around you out of shards.
- **Gravity:** Graviton visibly drags matter into itself and collapses into a black core; Crush leaves a crater; Levitate lifts rubble with the enemies; Repulsor throws out a force dome.
Every element that kicks up dust now gets real dust too.

## Element resources
Some elements build up something you can see above your ability bar and around your wizard: Plasma's **Heat** (a bar that turns into OVERHEATED), Soul's **Souls** (pale flames circling you), Arcane's **charges** (orbs whirling round you), Blades' **swords** (orbiting your waist), Bone's armor **plates**, Rune's count toward the next **Empowered** spell and Laser's **Focus** pips.

## Switching mid-game
Press **Esc** (or ⚙ on touch) during a run and pick any element under *General > Switch element*. It replaces the loadout you are using (your Tab loadout stays). Works solo and online. Solo, the menu pauses the game; online it keeps running for your partner and the enemies.

## Second element
Right-click a second element in the lobby (or pick it from the drop-down). **Tab** swaps loadouts mid-fight; each element keeps its own cooldowns, and the ultimate meter is shared.

Related: [[Combos]], [[Enemies]], [[Blender Assets]]
