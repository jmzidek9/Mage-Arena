# Trailer

`mage-arena-trailer.mp4` is a 49-second trailer at 1280×720 and 30 fps. All of it is real in-game footage, recorded by script:

1. Fire, Frost, Storm, Water and Earth fighting a lineup of monsters ("30 Elements · 150 spells")
2. Six ultimates in quick cuts: Singularity, Supernova, Divine Judgment, Colossal Blade, Fusion Beam and Ink Dragon
3. Magma against the Arena boss, then a 1v1 Duel against the AI, the Dungeon and Mage City
4. The logo card

Music: *Fantasy Orchestral Theme* by Joth (CC0), from `audio/music/` (see `audio/CREDITS.md`).

## Rebuilding

Run `trailer/make.sh` from the repo root. You need node with Playwright (Chromium), Python 3 and ffmpeg.

- `rec.js` opens the packed `index.html` in headless Chromium. It stops the game's render loop and drives each shot with the `MP` test hooks (`MP.setup`, `MP.frames`, inputs). One video frame is one `MP.frames(1, 1/30)` step, so the footage stays smooth however slow the machine is. Shots are defined in `SHOTS`.
- `cards.js` renders the title cards in `cards.html` to transparent PNGs.
- `make.py` trims each shot, lays the cards over it and adds the music. The cut list is `EDIT`.

Recording uses software WebGL (SwiftShader) and takes about 1–2 hours on 4 cores. Mage City is the slowest at roughly 6 s per frame.

- The GPU watchdog is turned off because long shader compiles would otherwise crash the tab.
- The browser restarts every ~500 frames to stop it running out of memory.
- When the Dungeon's torch-lit monsters first appear, their shaders need about 8 GB to compile. On a 16 GB machine that shot can crash its tab, so re-run it on its own: `node trailer/rec.js trailer/frames dungeon`.
