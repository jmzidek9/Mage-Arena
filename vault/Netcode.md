# Netcode

Peer-to-peer WebRTC through **PeerJS 1.5.4**, using its free cloud broker for the handshake and its default STUN + TURN servers, so there's no server to run.

## Flow
1. The host clicks **Host** and gets the 5-letter room code (peer id `magepact-XXXXX`).
2. The guest types the code and clicks **Join**, then sends `{t:'hello', el, el2, v}`. `v` is `GAME_VERSION`: if the two builds differ, the host refuses with `{t:'bad'}` and both players are told to refresh or re-download.
3. The host runs the whole simulation (`hostStep`).
4. The guest simulates its **own movement** locally (`stepMove`) and sends input plus position about 30 times a second (`{t:'i', ...}`). The input carries the held state of all 5 move slots, analog movement, and jump / dash / swap counters.
5. The host sends a JSON snapshot plus that frame's events 20 times a second (`{t:'s', s, ev}`). A busy snapshot is about 2–3 KB. Projectiles and entities are capped (160 / 120) so it stays small. The guest eases entities toward the snapshot positions and plays the events as VFX.
6. **Cast prediction:** the guest runs the same `stepCast` rules locally (`host = false`): cooldowns, charge / aim / channel states, instant cast circles and hand kick, and the move's own movement (dashes, blinks, leaps, rewind). `onEvent` skips the host's copy of the guest's own `cast` events, so nothing plays twice. The host still decides all damage, projectiles and entities.
7. Mid-game element switches go to the host as `{t:'el', el}`, and the host applies them.
8. The guest sends a heartbeat `{t:'hb'}` every second. After 6 s of silence the host drops the guest and keeps playing solo, and the guest can rejoin with the same code.

## Cross-platform
- Works in current Chrome (Windows, Mac, ChromeOS / Chromebooks), Edge, Firefox and Safari 15+ (Mac, iPad). Different browsers can play together. Both players just need the same version of the files.
- Everything loads as local plain scripts (three.js and PeerJS live in `js/vendor/`), so there's nothing to block: no CDN, no import maps, no ES modules on `file://`. Any error while starting is shown on screen, and a device without WebGL 2 gets a clear message.
- No pointer lock on iPad / iPhone: touch controls take over. Older Safari's non-promise `requestPointerLock` is handled.
- Audio uses `webkitAudioContext` where needed and resumes on the first tap (Safari / iOS start audio suspended).
- When the host's tab is hidden or its window covered, browsers pause `requestAnimationFrame`. A 30 Hz timer (and each guest input message) keeps the simulation and snapshots going, so the game doesn't freeze for the guest. The guest has the same fallback.
- Projectiles are simulated in ~60 Hz sub-steps, so a slow host (a weak Chromebook running at 20 fps) still registers hits from fast shots.
- Slow devices drop to low graphics automatically. Frame rate never changes game speed, because everything runs on delta time.

## Known ceilings (`ponytail:` comments in the code)
- STUN + PeerJS's TURN on port 3478. Very strict networks (some school or office wifi) that only allow web traffic on port 443 may still block the connection. Fixing that needs a TURN server on 443 (TLS).
- JSON over the reliable channel. If bandwidth becomes a problem, switch to packed arrays on an unreliable channel.
- The guest owns its own position (no reconciliation). That's fine between friends, not against strangers.
- The guest's cooldowns and Overcharge count are local predictions and can drift slightly from the host's if inputs drop.

Related: [[Overview]]
