# Mage City

The fourth mode (key 4), next to [[Elements|Arena]], Duel and Dungeon. Same endless waves as the Arena, on a floating city about 410 m across: roughly a minute's walk edge to edge. Code: `js/city.js`.

## Layout
- A round island (walkable radius 205 m) on a jagged rock underside, under the same black-hole sky as the Arena, with floating rocks around the rim and a low crenellated parapet at the edge.
- **Plaza** in the middle (27 m): the Arena's gold sigil, a ring of eight monoliths, braziers and crystals.
- **Roads:** two 12 m avenues crossing at the plaza (lined with braziers and colonnades), ring roads at 72 m and 142 m, and a side-street grid every 33 m.
- **Districts by distance:** the core has grand halls with gold bands and crystal-topped towers; the middle ring has houses and halls; the outskirts are ruins with broken tops and more moss. Some lots are open grass courtyards.
- Everything comes from a fixed seed (`cityLayout`), so host and guest build the same city.

## Destruction
- Buildings are built from 1.5 m stone blocks (about 20,000 in the city), in the Arena's palette: pale stone, darker stone, moss, a dark slab base course and corners, gold trim.
- Explosions, area hits and projectiles damage blocks (`cityHit`); a block at 0 hp is blasted out as tumbling fragments with dust.
- **Collapse:** a block with nothing under it falls unless a held neighbour on the same level supports it, up to 3 blocks of overhang (`citySettle`). Falling blocks drop whole and shatter on the ground.
- Props break too: braziers, pillars, monoliths, crystals, banners.
- Walls stop shots (yours and the monsters'), so they work as cover until they are blown away. Lasers and beams still pass through walls.
- The host decides what breaks and sends it as `blk` / `prop` events; a new game sends `cityreset`.

## Monsters
- Spawn on open street 34–70 m from every player (the boss 40–75 m).
- Route through the streets on a flow field to the nearest player, refreshed every 0.8 s and after every break (`cityField`, `cityNav`).
- A monster that hasn't moved for 1.2 s bashes the wall in front of it.

## Performance
Blocks are instanced per 54 m district (about 60 draw calls) and culled per district; shadows follow the camera. The worst frame in a test that cast every element's whole kit at one building was 13 ms; shaders are compiled when the city first loads.
