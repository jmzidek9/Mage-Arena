# Mage Arena

Browser first-person magic game (Arena / 1v1 Duel / Dungeon). Edit `src/index.html` and `js/*.js`, then run `python pack.py` to rebuild the playable `index.html` (never edit `index.html` directly). Self-test: open `index.html#test`.

## Spell icons
- Every move has its own painted icon in `js/icons.js`, keyed by element and slot (`fire` slot 0 = Fireball). The icon must show what the move actually does.
- **Whenever a move is added, removed, reordered, renamed or changed in what it does or how it looks, update or redraw its icon to match in the same change.** Preview it next to the other icons of that element (they should each look clearly different) before committing.

## Checklist: adding or changing a move or an element
Do every step, in order, whenever a move or element is added, changed, renamed or removed.

**1. Build it** (`js/elements.js`)
- Write the move in its element's `moves` list: `cast`, plus `shot` / `ent` / `view` / `fx` as needed. The `desc` must match what the move really does, with its real numbers.
- New element only: also add its entries in `BLOCK` and `BLOCK_LOOK` (`js/blocks.js`), `ELMETA` (`js/view.js`), its sounds (`js/core.js`), its models (`blender/build_elements.py`, then the glb), and a `passive`, `react` and `st`.

**2. Make it look and feel cool**
- Every move should feel powerful and satisfying, not just work. Give it:
  - a clear wind-up or cast (cast circle, hand glow)
  - a readable projectile or effect in the element's own colours and models
  - a punchy impact (burst, ring, debris, scorch or decal that fits the element)
  - its own sound (`<el>` for light moves, `<el>_big` for heavy ones)
- Heavier moves earn more: screen shake, a short `fovKick`, hit-stop, launches and knockback, and lingering aftermath (lava, ice, ink, spikes). An ultimate should be the most spectacular thing in the kit.
- It must look like its element and different from the element's other moves and from other elements' moves. Avoid generic white flashes and plain spheres.
- Make it readable at a glance: you should see where it hits, who it hit, and what state it left them in (frozen, burning, marked, charmed).
- Check the `run.js` screenshots and ask: does this look cool and clearly like this element? If it reads as plain or as another element, improve it before moving on.

**3. Your own view** (first person must stay readable, so cool must never mean blinding)
- Beams, cones, waves and blasts start 1.5–4 m in front of you, not at your eyes.
- Pulled monsters stop about 3 m away. Summons and orbiters appear ahead of you or above eye height, never on the camera.
- No white-outs: `flash()` is capped at 40; only use `whiteFx` with `Math.max(whiteFx, ≤ .6)`.
- Anything attached to the camera uses `nearOff()`, so the near-camera fade doesn't hide it.

**4. Performance**
- Keep a move under about 500 particles at its peak (the pool holds 4000). Build models when the game loads (`warmFx` in `js/view.js`), not on the first cast.

**5. Icon** (`js/icons.js`)
- Draw or redraw the move's icon so it shows what the move does, and preview it next to the element's other 4 icons.

**6. Balance**
- `python pack.py`, then `node playtest/bench.js <outDir> <el>[,<el>]`. It runs 3 fights each and shows damage per move. Put `<outDir>` in the scratchpad or `playtest/out/`.
- Compare with the median from a full bench (all elements). Aim for 0.85–1.2× on both crowd and boss. Control elements may sit lower.
- Single runs swing ±0.15, so only act on bigger gaps. Check the per-move numbers to find the move to change.
- Ultimates never charge themselves (`S.ultSrc`). Keep that intact for anything an ultimate spawns.

**7. Check it**
- `python pack.py`, `node playtest/selftest.js` (must pass), and `node playtest/run.js <el> moves --out <scratchpad dir>`. Look at the screenshots for anything covering the view, whether it looks cool and like its element, and the log for console errors.
- Afterwards, make sure no headless Edge or `playtest/*.js` process is left running.

**8. Notes and save**
- Update the move or element in `vault/Elements.md` (move table, passive, and a line in Balance if numbers changed).
- Commit and push. Then run `graphify update .` once and copy `GRAPH_REPORT.md` to `vault/Graph Report.md`.

## Knowledge
- `vault/` is the Obsidian vault of hand-written design notes. Keep it to real notes only.
- `graphify-out/graph.json` is the graphify knowledge graph of the code + vault notes. For questions about how things connect, run `graphify query "<question>"` first.
- After code or note changes: `graphify update .` (no LLM, fast), then `cp graphify-out/GRAPH_REPORT.md "vault/Graph Report.md"` so the vault shows the current map.
- **Never** run `graphify export obsidian` into `vault/`, and never drop `.graphifyignore`: that once snowballed into 618k generated notes (1.4 GB) and made Obsidian unusable. The old export is preserved in `archive/`.

## Don't lag the PC (this has happened twice)
The project sits in OneDrive, so every file written here is uploaded and virus-scanned, and heavy jobs slow the whole PC.
- **graphify:** run `graphify update .` once per finished slice, never from a hook on every Edit/Write (overlapping runs pile up). Keep `.graphifyignore` covering anything generated or third-party: `node_modules/`, `playtest/out/`, `archive/`, `index.html`, `js/vendor/`. When adding a folder full of generated files, add it there first.
- **Check the size:** before and after graphify work, check `graphify-out/cache/`. Over ~50k files or ~500 MB means something is being indexed that shouldn't be: find it and add it to `.graphifyignore`. Don't keep running graphify until it's fixed. Generated notes must never appear in `vault/`; `vault/` holds only the hand-written notes.
- **Playtests:** use the GPU (`playtest/browser.js`, D3D11). SwiftShader only via `PT_SOFTWARE=1`. Never run more than 2 browsers at once (`sh playtest/all.sh` defaults to 2). Afterwards, make sure no headless Edge or `playtest/*.js` node process is left running.
- **Long jobs** run in the background, one at a time; don't start a second copy while one runs.

## Never lose data
- Move, don't delete: anything that isn't a pure cache goes to `archive/<what>-<date>/`, and you count the files after moving.
- Only regenerable caches (`graphify-out/cache/ast/`) may be deleted outright. Keep `graphify-out/cache/semantic/`, because it was built with an LLM.
- Before any delete or move, list what's there and say in chat what will happen to it.
