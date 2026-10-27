# Enemies

Enemies rise out of red summoning circles near the arena edge and chase the nearest visible player (Veil and Phase hide you). HP scales +12% per wave and damage +6% per wave. Every enemy is an articulated Blender rig (see [[Blender Assets]]).

**Animation:** each attack has its own pose: a slow coil into the windup, a tremble just before the blow, then a snap and follow-through. Enemies lean into turns, crouch before leaps, stretch in the air and squash when they land. They claw their way up out of the summoning circle, flinch to the side when hit, droop when stunned, and their heads track you while they aren't busy attacking. Casters gather glowing power at their hands while they chant.

| Enemy | HP | Speed | Cost | From wave | Attack (telegraphed) | Second move |
|---|---|---|---|---|---|---|
| Grunt | 40 | 3.8 | 1 | 1 | Horned imp: claw swipe in a cone | **Leap** (4.5–9 m): pounces onto a marked circle where you stand |
| Runner | 22 | 7.0 | 1 | 2 | Feral hound: lunges along a line | |
| Shooter | 34 | 3.0 | 3 | 3 | Floating eye: keeps its distance, fires green orbs | **Volley**: a fan of 5 slower orbs, step into a gap |
| Bomber | 24 | 6.2 | 2 | 3 | Living powder keg: lights its fuse and explodes. Kill it first and its blast hurts the other enemies instead | |
| Splitter | 70 | 2.6 | 2 | 4 | Slime with a skull inside: ground slam, splits in two on death | |
| Stalker | 48 | 4.6 | 3 | 4 | Shadow imp: claw swipe | **Blink** (5–18 m): vanishes and steps out right behind you, then swipes |
| Brute | 190 | 2.3 | 5 | 5 | Rock golem: overhead smash on a marked circle | **Quake** (4–15 m): a stomp that rips a rolling line of stone spikes toward you |
| Knight | 120 | 3.3 | 4 | 6 | Death knight: sword thrust. **Its shield blocks 85% of frontal hits.** Flank it, use area attacks, or hit it with Steel at 3 Rend stacks | **Shield bash** (4–9 m): charges down a marked lane |
| Shaman | 60 | 2.9 | 4 | 7 | Hooded cultist: hangs back and heals nearby enemies, giving them a shield. Kill it first | **Hex**: a curse ring at your feet that bursts when the chant ends |
| Boss (Obsidian Tyrant) | 1500+ | 2.1 | – | every 5th | Smash, charges, shockwave rings you have to jump | **Meteor rain**: three burning rocks on each player, the first right where you stand |

Dungeon foes share these second moves: the archer volleys, the ghoul leaps, the death knight bashes and the Warden calls meteors.

Each second move has its own cooldown and range band, so it comes on top of the normal attack instead of replacing it.

## Fighting them
- **Telegraphs:** every attack winds up with a red ground marker (cone, line or circle) and a red glow. Step out, or dash through it.
- **Perfect dodge:** dashing (or being invulnerable) when an attack lands, if the dash started within 0.4 s, triggers slow motion, +12% ult and resets your dash.
- **Poise:** damage wears down an enemy's poise. When it breaks, the enemy is staggered (stunned, attack cancelled). Earth and Explosion break poise faster.
- **Headshots:** projectile and railgun hits on the top quarter of an enemy crit for ×1.5.
- **Crowd control:** stun, freeze, root, fear, blind, lift, bubble, stasis and encase. The boss shrugs off most of it, and elites resist some. Hard crowd control or a launch knocks a leaping enemy out of the air.
- **Airborne:** launched enemies can't act. Slammed enemies take fall damage (Gravity adds 50%).
- **Drops:** enemies sometimes drop a healing orb. Elites and bosses drop a heartstone that heals the whole team and adds ult charge.

## Wave budget
- Each wave's budget is `10 + 6 × wave`, cut to 60% when playing solo and halved on boss waves.
- The spawner buys enemies at random, weighting cheaper ones more heavily, in bursts of 1–4.

## Wave modifiers
About 1 wave in 3 (from wave 2, never on boss waves) rolls one of these:
- **Swarm:** 1.6× the budget at half HP
- **Haste:** enemies move 40% faster
- **Darkness:** heavy fog and dim braziers
- **Elite:** one enemy with 4× HP and a golden circle

Knocking a non-boss enemy past the edge sends it falling off the island.
