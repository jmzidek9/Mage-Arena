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
