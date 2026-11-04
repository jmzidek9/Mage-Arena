# Mage Arena

Browser first-person magic game (Arena / 1v1 Duel / Dungeon). Edit `src/index.html` and `js/*.js`, then run `python pack.py` to rebuild the playable `index.html` (never edit `index.html` directly). Self-test: open `index.html#test`.

## Spell icons
- Every move has its own painted icon in `js/icons.js`, keyed by element and slot (`fire` slot 0 = Fireball). The icon must show what the move actually does.
- **Whenever a move is added, removed, reordered, renamed or changed in what it does or how it looks, update or redraw its icon to match in the same change.** Preview it next to the other icons of that element (they should each look clearly different) before committing.

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
