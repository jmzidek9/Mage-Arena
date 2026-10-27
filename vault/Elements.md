# Elements

29 elements, each with its own passive and 5 moves on **LMB, RMB, Q, E** and **R** (the ultimate, which charges as you deal damage and kill).
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

## 🔥 Fire
Raw destruction. Stack burns on everything, then blow it all up.

**Passive.** Kindling: burns stack up to 3 times, and burning enemies explode when they die.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | ☄️ **Fireball** | 0.5 s | Hurl a fireball that explodes on impact. |
| RMB | 🌋 **Flamethrower** *(hold)* | 4 s | Hold to pour a cone of fire. Stacks burns and ramps up the longer you hold. |
| Q | 🔥 **Fire Brand** | 6 s | Brand the first enemy you hit with 3 burns. A moment later the brand detonates, blasting everything around it. |
| E | ⭕ **Ring of Fire** | 12 s | Raise a wall of flame around you. Enemies that cross it are scorched and thrown back. |
| R | 🐦‍🔥 **Phoenix Dive** *(hold to aim, release to cast)* | ultimate | Rise as a phoenix and crash onto the target, setting the ground ablaze. |

## ❄️ Frost
Control the battlefield. Slow everything down, freeze it solid, then shatter it.

**Passive.** Permafrost: 4 Frost hits freeze an enemy solid. Frozen enemies take 40% more damage.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 🧊 **Ice Shard** | 0.28 s | Rapid crystal shards that pierce one enemy. |
| RMB | 🗡️ **Glacial Lance** *(hold to charge)* | 3 s | Hold to charge a lance that pierces a line of enemies. Fully charged, it freezes them. Frozen targets shatter for double damage. |
| Q | 🧱 **Ice Wall** *(hold to aim, release to cast)* | 10 s | Raise a wall of ice that blocks enemies and their shots, chilling anything that touches it. |
| E | 💠 **Frost Nova** | 11 s | Blast frost in every direction, freezing nearby enemies solid. |
| R | 🌨️ **Blizzard** *(hold to aim, release to cast)* | ultimate | Summon a raging blizzard. Hail pounds everything inside, freezing enemies over and over. |

## ⚡ Storm
Speed and chaos. Lightning that leaps from foe to foe.

**Passive.** Static: every 6th Storm hit calls down a free lightning strike. Shocked enemies take 20% more damage.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | ⚡ **Chain Lightning** | 0.36 s | An instant bolt that chains to 2 more enemies. |
| RMB | 🔮 **Ball Lightning** | 4 s | A slow orb of lightning that zaps nearby enemies as it drifts, then bursts. |
| Q | 🌩️ **Thunderclap** *(hold to aim, release to cast)* | 7 s | Mark a spot: a moment later a huge bolt slams it, stunning everything there, then jumps to up to 3 enemies nearby. |
| E | 🗼 **Tesla Coil** *(hold to aim, release to cast)* | 13 s | Plant a tesla coil that zaps the nearest enemy every half second. |
| R | ⛈️ **Thunderstorm** | ultimate | A storm cloud follows you, hurling a lightning bolt at a nearby enemy four times a second. |

## 🌊 Water
Push and pull. Wash enemies off the island, trap them, and keep your team alive.

**Passive.** Tidal Force: your knockback is 40% stronger. Soaked enemies fly even further.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 💧 **Aqua Bullets** | 0.14 s | Rapid-fire water bullets with heavy knockback. |
| RMB | 🪢 **Water Whip** | 3.5 s | Lash a wide arc in front of you, dragging every enemy it hits toward you. |
| Q | 🫧 **Bubble Prison** | 9 s | Trap an enemy in a floating bubble. It is helpless and takes 30% more damage. |
| E | 🌧️ **Rain Cloud** | 15 s | A rain cloud follows you: it heals you and your partner and soaks enemies nearby. |
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
| R | 🌋 **Tectonic Quake** | ultimate | Shake the island with four quakes that stun every grounded enemy nearby. You take half damage meanwhile. |

## 🌪️ Wind
Mobility and crowd control. Fly over the fight and hurl enemies off the edge.

**Passive.** Tailwind: move 15% faster and double jump.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 🌀 **Wind Blades** | 0.42 s | Wide crescent blades of air that slice through every enemy in a line. |
| RMB | 🍃 **Gale Force** | 5 s | A massive gust that hurls enemies away and blows enemy shots out of the air. Great for ring-outs. |
| Q | 🪶 **Updraft** | 7 s | Launch yourself high into the air (and nearby enemies with you). Hold Space to glide. |
| E | 🌪️ **Tornado** | 12 s | Send out a tornado that sucks enemies in, spins them around, then flings them away. |
| R | 🌬️ **Tempest** | ultimate | Become the storm: move 60% faster inside a cyclone that shreds nearby enemies and their shots. |

## 🌿 Nature
Patient and resilient. Root enemies in place, plant guardians and heal your team.

**Passive.** Regrowth: regenerate 1.5 HP per second.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 🌵 **Thorn Volley** | 0.5 s | Fire a quick burst of three barbed thorns. |
| RMB | 🪴 **Entangle** *(hold to aim, release to cast)* | 6 s | Roots burst from the ground and hold every enemy in the area in place. |
| Q | 🌸 **Lifebloom** | 10 s | A healing flower blooms at your feet, restoring 30 HP over 4 seconds to you, and to your partner if they are close. |
| E | 🪤 **Snaptrap** *(hold to aim, release to cast)* | 14 s | Plant a carnivorous flytrap that chomps the nearest enemy for huge damage and pins it. |
| R | 🌳 **World Tree** *(hold to aim, release to cast)* | ultimate | Grow a great tree that roots every enemy around it, lashes them with vines and heals your team. |

## 🌑 Shadow
An assassin. Pin enemies down, blind them, vanish from sight and strike from the dark.

**Passive.** Assassin: hits on an enemy's back deal 50% more damage. Cursed enemies take 15% more damage.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 🗡️ **Shadow Daggers** | 0.45 s | Throw a fan of three shadow daggers. |
| RMB | 🌑 **Blackout** *(hold to aim, release to cast)* | 6 s | Hurl an orb of darkness that bursts into a choking cloud for 3 s. Every enemy it catches, or that walks in, is blinded: hit for 16, stunned for 1.5 s and spun round, its back wide open to your Assassin bonus. |
| Q | 🕸️ **Shadow Snare** *(hold to aim, release to cast)* | 7 s | Shadow tendrils burst from the ground, pinning every enemy in the area and dragging them together. Your next hit within 2.5 s deals double damage. |
| E | 🌫️ **Veil** | 14 s | Vanish for 4 seconds. Enemies lose track of you, you move 30% faster, and your first hit deals 2.5x damage. |
| R | 🌘 **Eclipse** | ultimate | Blot out the sun. Enemies in the darkness are slowed and cursed, while you steal life and cast 30% faster. |

## ☀️ Light
Holy power. Burn enemies with beams of sunlight and keep your partner standing.

**Passive.** Radiance: your damage heals your partner for 8% of it (or you for 4% when alone). Radiant enemies deal 30% less damage.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | ✨ **Radiant Orbs** | 0.4 s | Orbs of light that home in on enemies. |
| RMB | 🔆 **Solar Beam** *(hold)* | 6 s | Hold to fire a piercing beam of sunlight. It grows stronger the longer you hold it. |
| Q | 💥 **Blinding Flash** | 9 s | A searing flash that blinds enemies in front of you. Blind enemies stumble around and cannot attack. |
| E | ⛩️ **Sanctuary** | 16 s | Consecrate the ground around you. Allies inside heal, enemies burn and get pushed out, and enemy shots are blocked. |
| R | 🌞 **Divine Judgment** | ultimate | Call down a colossal pillar of light that follows your crosshair for 4.5 seconds, searing everything beneath it. |

## ☠️ Venom
A slow, nasty death. Stack poison on everything, then make it erupt and spread.

**Passive.** Virulence: poison stacks up to 8 times, and poisoned enemies spread their poison when they die.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 🤮 **Venom Spit** | 0.55 s | Lob a glob of venom that splashes and leaves a toxic puddle. |
| RMB | ☁️ **Toxic Cloud** *(hold to aim, release to cast)* | 7 s | Release a drifting cloud of poison gas that stacks poison on everything inside it. |
| Q | 🐍 **Serpent** | 7 s | Send a venom serpent slithering across the ground. It bites every enemy in its path, poisoning them 3 times. |
| E | 🧪 **Contagion** | 10 s | Every poisoned enemy nearby erupts, taking damage per poison stack and spreading half its stacks to its neighbours. |
| R | 🐝 **Plague Swarm** | ultimate | Release a swarm of eight venom wasps that hunt down enemies and sting them over and over. |

## ⚔️ Steel
A blade master. Boomerang saws, railguns and a storm of swords. Shields mean nothing to you.

**Passive.** Armor Breaker: Rend stacks 3 times (+6% damage taken each). At 3 stacks your hits go straight through shields.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 🪚 **Saw Blade** | 0.6 s | Throw a spinning saw that slices through enemies, then comes back and slices them again. |
| RMB | 🔫 **Railgun** *(hold to charge)* | 4 s | Hold to charge a hypersonic rail spike that pierces every enemy in a line. Full charge adds 2 Rend stacks. |
| Q | 🧲 **Magnetize** | 8 s | Magnetize every enemy in front of you and drag them right to your feet, stunned. |
| E | 📌 **Caltrops** | 11 s | Scatter a field of steel caltrops. Enemies that step on them are cut, slowed and rended. |
| R | ⚔️ **Blade Storm** | ultimate | Ten giant swords orbit you, sweeping outward and back again, shredding everything they touch. |

## 🌋 Magma
Slow and devastating. Flood the island with lava and drop a meteor on anything left standing.

**Passive.** Molten Core: molten enemies burn and take 10% more damage, and anything that hits you turns molten.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 🔴 **Magma Glob** | 0.7 s | Lob a heavy glob of magma that splashes and leaves a burning pool of lava. |
| RMB | ♨️ **Eruption** *(hold to aim, release to cast)* | 5 s | The ground at your target glows, then erupts in a geyser of lava that launches enemies. |
| Q | 🛡️ **Molten Armor** | 14 s | Coat yourself in molten rock for 6 seconds: take 40% less damage and scorch every enemy near you. |
| E | 🗻 **Volcano** *(hold to aim, release to cast)* | 15 s | Raise a small volcano that keeps lobbing magma bombs at enemies. |
| R | ☄️ **Meteor** *(hold to aim, release to cast)* | ultimate | Call down a colossal meteor. After a short warning it obliterates the area and floods it with lava. |

## 💎 Crystal
Precision and geometry. Shards that split and refract, turrets, and diamond-hard defence.

**Passive.** Prismatic: enemies killed by Crystal shatter into shards that strike nearby foes.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 🔷 **Prism Shard** | 0.45 s | A crystal shard that splits into three smaller shards when it hits. |
| RMB | 🪩 **Geode Bomb** | 6 s | Lob a geode that cracks open and sprays crystal shards in every direction. |
| Q | 🛡️ **Diamond Shell** | 13 s | Encase yourself in a diamond shell that absorbs 60 damage. When it breaks or fades, it bursts into shards. |
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
| Q | 🎈 **Levitate** *(hold to aim, release to cast)* | 9 s | Lift every enemy in the area helplessly into the air for 2 seconds, then drop them hard. |
| E | 💫 **Repulsor** | 9 s | Blast everything away from you and reflect nearby enemy projectiles back at them. |
| R | 🌌 **Singularity** *(hold to aim, release to cast)* | ultimate | Open a black hole that drags in every enemy nearby, grinds them down, then collapses in a huge explosion. |

## ⏳ Chrono
Master of time. Echoing attacks, frozen moments, speeding up your own clock, and stopping time itself.

**Passive.** Time Dilation: all your cooldowns run 18% faster. Timeworn enemies are 35% slower.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 🕐 **Chrono Bolt** | 0.45 s | A bolt of frozen time. Each hit echoes 1.2 seconds later for the same damage again. |
| RMB | ⏸️ **Stasis** | 8 s | Freeze an enemy in time for 3 seconds. Damage it takes meanwhile is stored and lands all at once, 30% stronger. |
| Q | ⏩ **Accelerate** | 14 s | Speed up your own time for 5 s: you move 35% faster and every cooldown runs twice as fast. It also winds your wounds back to the health you had 3 s ago. |
| E | 🕰️ **Slow Field** *(hold to aim, release to cast)* | 13 s | Warp time in an area: enemies inside move and attack 70% slower, and enemy shots crawl. |
| R | ⏱️ **Time Stop** | ultimate | Stop time for 4 seconds. Enemies freeze, and all the damage you deal piles up and lands 50% stronger when time resumes. |

## 🩸 Blood
Power at a price. Spend your own health for brutal damage, and drink it back from your enemies.

**Passive.** Bloodlust: heal for 6% of damage dealt, and hit up to 50% harder the lower your health. Blood moves cost HP. Bleeding enemies feed you.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 🩸 **Blood Bolt** | 0.4 s | Costs 1.5 HP. A fast bolt of blood magic that hits hard. |
| RMB | 🌙 **Blood Scythe** | 4 s | Costs 5 HP. Hurl a huge crescent of blood that cuts through everything and makes enemies bleed. |
| Q | 🪝 **Blood Tether** | 7 s | Costs 4 HP. Hurl a blood hook that latches onto the first enemy, drags it to you and drains its life for 3 seconds. |
| E | 🩸 **Blood Pact** | 15 s | Sacrifice 25% of your current health: +60% damage and 25% faster casting for 7 seconds. |
| R | 🌕 **Blood Moon** | ultimate | A blood moon rises above you and drains every enemy nearby for 4 seconds, healing you and your partner. |

## 👻 Spirit
Commander of the dead. Haunting wisps, a spectral wolf, and an army of ghost knights.

**Passive.** Soul Harvest: enemies you kill release a wisp that heals you for 4. Haunted enemies deal 25% less damage.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 🕯️ **Soul Wisps** | 0.45 s | Release wisps that hunt down enemies on their own. |
| RMB | 😱 **Banshee Wail** | 8 s | A terrifying wail. Enemies in front of you flee in fear for 2.5 seconds. |
| Q | 🌫️ **Phase Walk** | 10 s | Become a ghost for 3 seconds: invulnerable, 30% faster, and you haunt every enemy you pass through. |
| E | 🐺 **Spirit Wolf** | 18 s | Summon a spectral wolf for 16 seconds. It hunts the enemies closest to you and savages them. |
| R | ⚔️ **Army of the Dead** | ultimate | Six spectral knights rise around you and cut down your enemies for 9 seconds. |

## 🌠 Cosmic
The power of the stars. Constellations, orbiting moons, meteor showers and a supernova.

**Passive.** Stellar Rhythm: every 4th Star Shot is a giant piercing star. Starstruck enemies take 12% more damage.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | ⭐ **Star Shot** | 0.38 s | Fire shooting stars. Every 4th one is a giant star that pierces 3 enemies. |
| RMB | 🌙 **Orbiting Moons** | 9 s | Three moons orbit you. Whenever an enemy comes close, a moon slams into it and explodes. |
| Q | ✴️ **Constellation** *(hold to aim, release to cast)* | 1.2 s | Place up to 3 stars. Stars link to each other with beams of starlight that burn enemies crossing them. |
| E | 🌠 **Meteor Shower** *(hold to aim, release to cast)* | 12 s | Rain twelve shooting stars down on the target area. |
| R | 💥 **Supernova** | ultimate | A star ignites above you and grows for 2 seconds, then goes supernova, obliterating and blinding everything nearby. |

## 💣 Explosion
Pure demolition. Grenades, sticky bombs, mines, rocket jumps and a carpet-bombing run.

**Passive.** Demolitions: your explosions are 20% bigger. Primed enemies get knocked back 50% further.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 💣 **Grenade** | 0.6 s | Lob a bouncing grenade that explodes after a short fuse, or instantly when it hits an enemy. |
| RMB | 🧨 **Sticky Bomb** | 0.6 s | Throw a sticky bomb that clings to whatever it hits. Press again to detonate it (it also blows on its own after 3 s). |
| Q | 🚀 **Rocket Jump** | 6 s | Blast the ground under your feet to rocket up and forward, flattening whatever is nearby. |
| E | 🎯 **Proximity Mines** | 12 s | Toss four mines ahead of you. Each one blows when an enemy walks over it. |
| R | ✈️ **Carpet Bomb** | ultimate | Call in a bombing run: fourteen bombs drop in a line ahead of you, one after another. |

## 🎭 Illusion
Smoke and mirrors. Fool monsters into fighting phantoms, and each other.

**Passive.** Misdirection: Beguiled enemies deal 20% less damage, and 1 in 3 of their attacks strikes a phantom instead of you.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 🦋 **Phantom Moths** | 0.45 s | Release a glowing moth flanked by two phantom moths that flutter off to hunt enemies. Phantoms deal half damage. |
| RMB | 🪞 **Decoy** *(hold to aim, release to cast)* | 8 s | Conjure a phantom double of yourself at the target. Monsters within 12 m attack it instead of you for 5 s. Once it is struck 3 times, or time runs out, it shatters, damaging and beguiling everything around it. |
| Q | 😵‍💫 **Mesmerize** | 10 s | A hypnotic pulse charms every monster in front of you for 4 s: they turn on each other and attack the nearest monster instead of you. Bosses resist it. |
| E | 👥 **Mirror Images** | 16 s | Two mirror images of you stand at your sides for 8 s, copying your basic attack at 40% power, whichever element you are using. |
| R | 🎪 **Phantasmagoria** | ultimate | Trap everything within 14 m in a hall of mirrors: monsters are charmed and fight each other for 5 s, then the mirrors shatter for 120 damage to every one of them. |

## 💀 Bone
A necromancer. Thrown bones, cackling skulls, armor of the dead, and the slain rising to fight for you.

**Passive.** Raise Dead: monsters you kill with Bone have a 25% chance to rise as a skeleton warrior that fight for you for 12 s (up to 3 at once). Brittle enemies take 12% more damage.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 🦴 **Bone Toss** | 0.5 s | Hurl a spinning bone that pierces 2 enemies and pins the last one it hits for a moment. |
| RMB | ☠️ **Cackling Skull** | 4 s | Hurl a burning skull that bites an enemy, then leaps on to the next one, up to 5 times. |
| Q | 🛡️ **Bone Armor** | 14 s | Four bone plates orbit you for 10 s. Each one completely blocks a hit, then flies back into the attacker. |
| E | ⛓️ **Bone Cage** *(hold to aim, release to cast)* | 9 s | Ribs of bone burst from the ground at the target, caging every enemy inside for 2.5 s. Anything that touches the bars is gashed. |
| R | 🐉 **Bone Dragon** *(hold to aim, release to cast)* | ultimate | Raise a skeletal dragon that circles the target for 7 s, breathing ghostfire on everything beneath it. |

## 📜 Rune
Ancient script. A trapper: every spell but the bolt is a ward on the ground that enemies set off by walking over it, and every third spell is Empowered.

**Passive.** Rune Mastery: every third spell you cast is Empowered and deals 60% more damage. Inscribed enemies take 10% more damage.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 🔹 **Rune Bolt** | 0.4 s | Fire a spinning rune that pierces through an enemy. |
| RMB | 🔯 **Glyph Trap** *(hold to aim, release to cast)* | 2.5 s | Inscribe a ward glyph at the target (up to 3 at once). It arms after a second, and the first enemy to step on it is blasted into the air and stunned. |
| Q | 🪨 **Sigilfall** *(hold to aim, release to cast)* | 6 s | Inscribe a sigil ward (up to 2 at once). When an enemy steps on it, runic chains hold everything nearby and three runestones crash down, the last and largest stunning everything it hits. |
| E | 🔘 **Binding Circle** *(hold to aim, release to cast)* | 12 s | Inscribe a binding ward. When an enemy steps on it, a great binding circle springs up for 6 s. Enemies inside are slowed by 40%, take 25% more damage from everything, and are scorched by the runes every second. |
| R | 📖 **Word of Ruin** *(hold to aim, release to cast)* | ultimate | Inscribe the word of ruin as a great ward. When an enemy steps on it, a great rune ignites over every enemy within 20 m of it (up to 12), then each one slams down for 90 damage and a 1.5 s stun. |

## ⚛️ Plasma
Raw, unstable power. Every Plasma spell builds Heat that makes you hit harder, right up until you overheat.

**Passive.** Heat: Plasma spells build Heat, which adds up to 50% damage. At 100 Heat you overheat: you vent in a burst and your Plasma spells lock for 2.5 s. Heat cools off on its own. Ionized enemies burn.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 🔴 **Plasma Bolt** | 0.28 s | Rapid bolts of superheated plasma that splash on impact. Builds Heat. |
| RMB | 🟣 **Plasma Cannon** *(hold to charge)* | 3.5 s | Hold to charge a sphere of plasma, then release to fire it. It detonates in a blast that grows with the charge. Builds a lot of Heat. |
| Q | 🌡️ **Vent** | 7 s | Dump all your Heat in a shockwave around you. The more Heat you vent, the harder it hits (up to 110 damage) and the further it throws. |
| E | 🗡️ **Thermal Lance** | 6 s | Sweep a blade of plasma in a wide arc in front of you, cutting every enemy within 7 m and hurling them back. |
| R | ☢️ **Fusion Beam** | ultimate | Fire a colossal beam of plasma for 4 s that follows your aim and melts everything in its path. You cannot overheat meanwhile. |

## 🪔 Soul
A reaper. Harvest a soul from every kill to grow stronger, and cut down the weak in a single swing.

**Passive.** Soulbound: every kill gives you a Soul (up to 15; elites give 2, bosses 5). Each Soul makes your spells 4% stronger, but getting hit makes you drop 2. Soulburned enemies burn.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 💙 **Soulfire** | 0.42 s | Fire bolts of pale soulfire that burn whatever they touch. |
| RMB | 🌒 **Reap** | 5 s | Swing a spectral scythe through everything in front of you (6.5 m). Monsters left under 20% health are reaped outright (not bosses). |
| Q | 🫀 **Soul Rend** | 8 s | Hurl a hook of soulfire that tears the soul half out of the first enemy it hits: 35 damage and a 1 s stun, and the torn soul flies back to heal you for 10. |
| E | 🌀 **Soulstorm** | 10 s | Unleash your Souls as shrieking soul missiles that hunt down enemies: 2 for every Soul you hold (at least 4), 14 damage each. Spends your Souls. |
| R | 💀 **The Reaper** *(hold to aim, release to cast)* | ultimate | Summon the Reaper at the target. Its scythe sweeps round three times, cutting everything within 9 m for 50 and reaping any monster left under 25% health. |

## 🐙 Abyss
Something ancient lives below. Tentacles erupt from the floor to seize, crush and drag your enemies under.

**Passive.** Lurker Below: each Abyss hit has a 20% chance to make a tentacle burst up under the enemy and lash it for 18 more damage. Drowned enemies are 25% slower.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 🔵 **Void Bolt** | 0.42 s | Fire a bolt of black water that bursts on impact, splashing the enemies around it. |
| RMB | 🦑 **Grasp of the Deep** *(hold to aim, release to cast)* | 6 s | A great tentacle erupts at the target and seizes every enemy there, hoisting them into the air, then slams them into the floor. |
| Q | 👄 **Maw of the Deep** *(hold to aim, release to cast)* | 10 s | Tear open a toothed maw in the floor. It drags enemies toward its centre for 2 s, then snaps shut for 70 damage. |
| E | 🐙 **Tentacle Ring** | 14 s | Eight tentacles burst up around you for 6 s and lash any enemy that comes within 6 m, three at a time. |
| R | 👁️ **Kraken** *(hold to aim, release to cast)* | ultimate | The Kraken stirs: colossal tentacles burst from the floor around the target and thrash for 6 s, crushing enemies and dragging them in, then haul everything down for 100 damage. |

## 📡 Laser
Precision light. Instant beams that ricochet off pillars, walls, the floor and your own crystal lenses, hitting harder with every bounce.

**Passive.** Ricochet and Focus: every bounce makes a Laser hit 25% harder, and Laser hits to the head always crit. Hitting the same enemy again within 1.5 s builds Focus, +10% damage per stack (up to 6). Targeted enemies take 12% more damage.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 🟢 **Pulse Laser** | 0.3 s | An instant laser pulse that bounces once off whatever it meets. |
| RMB | ✳️ **Ricochet Beam** *(hold to charge)* | 4 s | Hold to charge a thick beam that bounces up to 4 times off pillars, walls and the floor, piercing everything it touches. |
| Q | 🔷 **Refractor** *(hold to aim, release to cast)* | 5 s | Hang a floating crystal lens at the target for 12 s (up to 2). Any of your lasers that pass through it split into 3 beams that lock onto the nearest enemies, each counting as one more bounce. When it expires it bursts. |
| E | 🛸 **Laser Drone** | 15 s | Deploy a hovering drone that follows you for 12 s and fires a bouncing laser at the nearest enemy every 0.4 s. |
| R | 🔺 **Prism Nova** | ultimate | A great prism rises above you and spins for 4 s, firing eight lasers in a star that bounce off everything and shred whatever they cross. |

## 🔮 Arcane
Pure magic. Homing missiles, an owl familiar and polymorphs, and charges that build into a devastating barrage.

**Passive.** Arcane Charges: every Arcane spell except Barrage gives you a charge (up to 4; they fade 8 s after your last cast). Each charge makes your spells 12% stronger. Spellbound enemies take 10% more damage.

| Key | Move | Cooldown | What it does |
|---|---|---|---|
| LMB | 🌟 **Arcane Missiles** | 0.55 s | Fire three arcane missiles in quick succession that weave toward enemies. |
| RMB | 🎆 **Arcane Barrage** | 3 s | Spend all your Arcane Charges on a barrage of heavy arcane bolts: 2, plus 2 for every charge spent. |
| Q | 🦉 **Arcane Familiar** | 14 s | Summon a spectral owl for 12 s. Every second it swoops on the enemy nearest you and rakes it for 22, and each strike gives you an Arcane Charge. |
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
| E | ☔ **Rain of Blades** *(hold to aim, release to cast)* | 11 s | Twelve swords rain down on the target area, 20 damage each, and the ground they pierce slows enemies by 30% for 4 s. |
| R | ⚜️ **Colossal Blade** *(hold to aim, release to cast)* | ultimate | A colossal sword falls from the heavens onto the target: 160 damage and a huge launch. It stands for 5 s sending out shockwaves, and your halo fills with 6 swords. |

## Element resources
Some elements build up something you can see above your ability bar and around your wizard: Plasma's **Heat** (a bar that turns into OVERHEATED), Soul's **Souls** (pale flames circling you), Arcane's **charges** (orbs whirling round you), Blades' **swords** (orbiting your waist), Bone's armor **plates**, Rune's count toward the next **Empowered** spell and Laser's **Focus** pips.

## Switching mid-game
Press **Esc** (or ⚙ on touch) during a run and pick any element under *General > Switch element*. It replaces the loadout you are using (your Tab loadout stays). Works solo and online. Solo, the menu pauses the game; online it keeps running for your partner and the enemies.

## Second element
Right-click a second element in the lobby (or pick it from the drop-down). **Tab** swaps loadouts mid-fight; each element keeps its own cooldowns, and the ultimate meter is shared.

Related: [[Combos]], [[Enemies]], [[Blender Assets]]
