# Mage City

The fourth mode (key 4), next to [[Elements|Arena]], Duel and Dungeon. Same endless waves as the Arena, on a floating city about 410 m across: roughly a minute's walk edge to edge. Code: `js/city.js`.

## Layout
- A round island (walkable radius 205 m) on a jagged rock underside, under the same black-hole sky as the Arena, with floating rocks around the rim and a low crenellated parapet at the edge.
- **Plaza** in the middle (27 m): the Arena's gold sigil, a ring of eight monoliths, braziers and crystals.
- **Roads:** two 12 m avenues crossing at the plaza (lined with braziers and colonnades), ring roads at 72 m and 142 m, and a side-street grid every 33 m.
- **Districts by distance:** the core has grand halls with gold bands and crystal-topped towers; the middle ring has houses and halls; the outskirts are ruins with broken tops and more moss. Some lots are open grass courtyards.
- Everything comes from a fixed seed (`cityLayout`), so host and guest build the same city.

## Look (2026-10-27 detail pass)
- Each 1.5 m cell is drawn as a carved masonry piece, not a cube: ashlar walls (three course patterns, a chipped ruin variant), quoins on corners, cornices every fourth course, gold-banded trim with diamond reliefs, pilasters on halls, arched voussoir stones over doorways, a skirted base course, battlements with capstones, and tiled roofs.
- Towers are true circles (the rules still use the grid ring they cover); some carry conical slate roofs with gold finials.
- Windows get sills and lintels; doors get striped awnings; halls hang banners; some windows have lanterns.
- Streets: cobbles, curbs round every block, lamp posts, benches, crates and barrels, market stalls on the avenues, fountains and trees on the ring roads, wizard statues on the plaza, gateway arches where the avenues cross the ring roads, setback upper storeys on some roofs.
- All stone uses one shader: grain and colour blotches, soft relief, moss on top faces, rain streaks, grime at the foot.
- Near districts (within 92 m) draw the carved pieces in one batched mesh each; far ones draw plain blocks.

## Destruction
- Explosions, area hits and projectiles damage cells (`cityHit`); a broken cell's piece is thrown off whole (its own shape and colour) away from the hit, with stone chips and dust.
- **Collapse:** a cell with nothing under it falls unless a held neighbour on the same level carries it, up to 4 cells of overhang (`citySettle`). Collapsing pieces drop and tumble.
- **Debris stays:** pieces bounce off standing walls, tip onto a flat face, come to rest and pile up (a rubble height map). Later blasts throw them around again (`cityPush`, also from every explosion effect), and walking through rubble kicks it aside. Up to 3200 pieces; the oldest resting piece is reused when the pool is full.
- Sills, awnings, banners and lanterns go with the stone they hang on; a tower that loses its top loses its roof. Props break too.
- Walls stop shots (yours and the monsters'), so they work as cover. Lasers and beams still pass through walls.
- The host decides what breaks and sends it as `blk` / `prop` events; a new game sends `cityreset`.

## Monsters
- Spawn on open street 34–70 m from every player (the boss 40–75 m).
- Route through the streets on a flow field to the nearest player, refreshed every 0.8 s and after every break (`cityField`, `cityNav`).
- A monster that hasn't moved for 1.2 s bashes the wall in front of it.

## Performance
About 42,000 cells and 4,000 attachments in 72 districts. Shadows follow the camera. The city draws one warm-up frame while it loads (about 3 s) so its shaders compile before the fight. A test casting every element's whole kit at one building (650 cells broken, 1,350 debris pieces) averaged 77 fps with no city stalls.
