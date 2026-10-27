# Mage Arena

A first-person magic game for 1–2 players in the browser, with three modes: Arena, 1v1 Duel and Dungeon.

- **Code:** `index.html` (styles, HTML, a small boot script) plus classic scripts in `js/` that share one global scope: `core.js` (renderer, scene, shaders, VFX, sound, input), `elements.js` (the 30 elements and their 150 moves), `sim.js` (host simulation), `modes.js` (the Duel and Dungeon rules, plus the map switch), `view.js` (rendering, HUD, lobby) and `net.js` (snapshots, networking, main loop, self-test). Three.js (r169, bundled with esbuild) and PeerJS 1.5.4 ship locally in `js/vendor/`, so the game needs no CDN, import maps or ES modules and runs from a double-clicked file in any browser, Safari included.
- **Art:** built in Blender by `blender/build_assets.py`, `build_elements.py` and `build_enemies.py` (see [[Blender Assets]])
- **Share:** run `python pack.py` to build `MagePact.html`, one ~5 MB file with everything inside (three.js, PeerJS, the game scripts, gzip-compressed models). Send that single file; your friend double-clicks it. (`index.html` alone won't work, since it needs the `js/` and `assets/` folders next to it.)
- **Run:** double-click `index.html`. The models load from `assets/bundle.js`, so no server is needed. A local server (`python -m http.server 8000`) also works.
- **Modes:** the game opens on a mode screen split into three: **Arena**, **1v1 Duel** and **Dungeon**. Each plays solo, or online with **Host game** / **Join** (see [[Netcode]]); the host's mode is the one played.
  - **Arena:** the original endless waves on the floating ruins under the black hole.
  - **1v1 Duel:** best of 3 rounds on a smaller floating plaza (radius 14). A round is lost at 0 HP or by falling off the edge. Online it's host vs guest; solo you face an AI wizard with a random element. Each wizard has 300 HP and an invisible stand-in enemy that every move can hit, so all 150 moves work against players; your own moves skip your own stand-in.
  - **Dungeon:** endless medieval floors. Each floor is a random chain of stone rooms and corridors (generated from a seed, so the guest builds the same one). Entering a room drops its portcullises and wakes its monsters; clearing it lifts them. The farthest room holds the stairs down; every 5th floor it's the Bone Warden's room. Foes: skeletons, skeleton archers, giant rats, ghouls, dark knights. Descending heals 25% and revives a downed partner. Deepest floor is saved per element.
- **Self-check:** open `index.html#test`. It checks the data tables, casts all 150 moves against test enemies, checks that dungeon floors always connect every room, and that duel hits land on the opponent but never on yourself.

## Core loop (Arena)
1. Each player picks one of 20 [[Elements]], and optionally a second one (Tab swaps between them).
2. Each element has 5 moves: **LMB, RMB, Q, E** and an **R** ultimate that charges as you fight.
3. Waves of [[Enemies]] climb out of red summoning circles. They telegraph their attacks with red ground markers. Dash through an attack at the last moment for a **perfect dodge** (slow motion, ult charge, dash refund).
4. Hitting an enemy that carries a different element's status triggers a reaction (see [[Combos]]).
5. Between waves there's a short breather (no upgrade picks).
6. A downed player is revived by their partner standing close for 3 s. If both go down, the run is over.

## Controls
- **Keyboard + mouse:** WASD, mouse aim, LMB / RMB (or **F**, or **Ctrl+click** on a Mac trackpad) / Q / E / R, Space jump (hold to glide when a move allows it), Shift dash, Tab swap element, Esc settings.
- **Touch** (iPad, touchscreen Chromebooks, phones): the controls appear after the first touch. Left side is a move stick, right side drags to look, buttons for the 5 moves, jump, dash and swap, and a gear for settings.
- **Gamepad:** left stick move, right stick look, RT/LT/LB/RB/Y = LMB/RMB/Q/E/R, A jump, B dash, X swap, Start opens the menu.
- **Settings:** General (sensitivity, sound, music, screen shake, damage numbers), Visuals (field of view, brightness, render scale, bloom, shadows, film filter) and Controls (invert mouse Y, every key rebindable; taking a key that's already used swaps the two). All saved per browser. **Graphics: Low** turns off bloom and shadows. Slow devices switch to low graphics on their own after a few seconds, unless the player chose a setting.

## Progression
Saved per browser in `magepact_prog` (code at the top of the lobby section in `view.js`).
- **XP** at the end of every run: Arena 60 per wave + 3 per kill, Dungeon 80 per floor + 3 per kill, Duel 250 for a win or 100 for a loss. Level n needs 200 + 60n XP.
- **Unlocks:** you start with 10 elements (Fire, Frost, Storm, Water, Earth, Wind, Nature, Shadow, Light, Venom). Each level gives an unlock key; click any locked element to spend it. An **Unlock all** button sits at the bottom of the lobby.
- **Talents:** a point per level, 5 ranks each: Vitality (+6% HP), Power (+4% damage), Haste (4% faster cooldowns), Swiftness (+3% speed), Focus (+8% ultimate charge). They apply in the Arena and Dungeon only; Duels stay fair. The guest sends theirs in the `hello` message. Refundable any time.
- **Mastery:** the elements you carried earn the run's XP too: stars at 400 / 1,200 / 2,500 / 4,500 / 7,500, shown on the lobby cards.
- **Element picker:** each element shows playstyle tags, a difficulty (Easy / Medium / Hard) and a live 3D preview of its spell circle and signature model (`ELMETA`, rendered by a small second WebGL renderer).

## Why it's replayable
- 30 elements × a second element
- Random enemy mix and a budget per wave, 8 enemy types plus the boss
- About 1 wave in 3 rolls a modifier, and a boss every 5th wave
- Best wave (Arena) and deepest floor (Dungeon) are remembered per element (shown on the lobby cards)

## Why it's satisfying
- Elemental-Battlegrounds-style spell circles (a unique design per element) at your feet and in your hand
- Bloom, pooled additive particles, hit-stop, screen shake, FOV kick, damage numbers, headshot crits and a combo counter
- Articulated enemies that wind up, flinch, stagger and break apart when they die
- Real recorded CC0 sound effects, layered and varied per hit, and 12 CC0 music tracks that follow the situation: menu, Arena, Duel, Dungeon, boss fights (credits in `audio/CREDITS.md`)
- Knocking enemies off the floating island sends them falling to their death

See also: [[Netcode]].
