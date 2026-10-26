# Combos (reactions)

Every element applies its own status on hit. A reaction triggers when an enemy already has a status from one element and gets hit by a **different** element: the status is consumed, the game freezes for a frame (hit-stop), and the reaction name pops up on screen. With one element you can only react with your partner, or with your second element (Tab).

All 380 ordered pairs react. 16 pairs have a named reaction. Every other pair is named **"<status adjective> <reaction of the element that hit>"** (for example BURNING COLLAPSE) and uses the hitting element's reaction kind. The logic is `reactionOf()` / `react()` in `js/sim.js`.

## Named reactions

| Status on enemy | Hit by | Reaction | Effect |
|---|---|---|---|
| Fire | Frost | **STEAM** | 36 dmg in a 4.2 m radius, steam cloud |
| Frost | Storm | **SHATTER** | 62 dmg to the target, 22 around it |
| Storm | Fire | **OVERLOAD** | 32 dmg in 5 m with huge knockback (ring-outs) |
| Water | Storm | **CONDUCT** | Lightning arcs through up to 8 soaked enemies, 30 each |
| Water | Frost | **FLASH FREEZE** | Freezes everything within 4.5 m |
| Fire | Wind | **FIRESTORM** | 34 dmg in 6 m and sets them all burning |
| Nature | Fire | **WILDFIRE** | Spreads the status to everything within 6 m |
| Frost | Magma | **MELTDOWN** | Shatter-style burst |
| Magma | Water | **OBSIDIAN** | Stuns everything nearby |
| Venom | Fire | **TOXIC BLAZE** | Big blast |
| Light | Shadow | **TWILIGHT** | Area stun |
| Shadow | Light | **DAWNBREAK** | Big blast |
| Earth | Water | **MUDSLIDE** | Launches nearby enemies |
| Blood | Venom | **SEPSIS** | Spreads the status |
| Gravity | Cosmic | **BIG BANG** | Overload-style blast |
| Chrono | Sonic | **TIME QUAKE** | Hits now, then again a second later |

## Reaction kinds (for every other pair)
blast · freeze · chain · pull · launch · heal (heals both players) · spread · drain · echo · shatter · stun. Each element's kind is listed in [[Elements]].

Reactions also add ult charge.
