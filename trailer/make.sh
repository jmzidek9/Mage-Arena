#!/bin/sh
# Build the trailer: trailer/mage-arena-trailer.mp4 (about 49 s, 1280x720, 30 fps). See trailer/README.md; recording takes 1-2 hours with software WebGL.
# Needs node + playwright (Chromium), python 3 and ffmpeg. Run from the repo root.
set -e
python pack.py
node trailer/rec.js trailer/frames
node trailer/cards.js trailer/cards
python trailer/make.py trailer/frames trailer/cards trailer/mage-arena-trailer.mp4
