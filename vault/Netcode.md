# Netcode

Peer-to-peer WebRTC through **PeerJS 1.5.4**, using its free cloud broker for the handshake and its default STUN + TURN servers, so there's no server to run.

## Flow
1. The host clicks **Host** and gets the 5-letter room code (peer id `magepact-XXXXX`).
2. The guest types the code and clicks **Join**, then sends `{t:'hello', el, el2, v}`. `v` is `GAME_VERSION`: if the two builds differ, the host refuses with `{t:'bad'}` and both players are told to refresh or re-download. A third player gets `{t:'full'}`. While waiting in the lobby the two stay in sync: the guest re-sends `hello` when its pick changes, the host sends `{t:'room', mode, el}`.
3. The host runs the whole simulation (`hostStep`).
4. The guest simulates its **own movement** locally (`stepMove`) and sends input plus position about 30 times a second (`{t:'i', ...}`). The input carries the held state of all 5 move slots, analog movement, and jump / dash / swap counters.
5. The host sends a JSON snapshot plus that frame's events 20 times a second (`{t:'s', s, ev}`). A busy snapshot is about 2–3 KB. Projectiles and entities are capped (160 / 120) so it stays small. The guest eases entities toward the snapshot positions and plays the events as VFX.
6. **Cast prediction:** the guest runs the same `stepCast` rules locally (`host = false`): cooldowns, charge / aim / channel states, instant cast circles and hand kick, and the move's own movement (dashes, leaps, glides). `onEvent` skips the host's copy of the guest's own `cast` events, so nothing plays twice. The host still decides all damage, projectiles and entities.
7. Mid-game element switches go to the host as `{t:'el', el}`, and the host applies them.
8. Both sides send a heartbeat `{t:'hb', at}` every second and answer it with `{t:'pg', at}`, which gives the ping shown on the partner's HUD box. 2.5 s of silence shows "connection unstable"; 10 s means gone. Leaving on purpose sends `{t:'bye'}`, so the other side knows at once.
9. **If the guest goes:** the host keeps playing and sees the room code (also in the Esc menu). A rejoiner lands at the host's side, on whatever island or floor that is, and in Mage City gets the city as it stands (`citysync`: broken and cracked blocks, dead props). A silent seat can be taken over straight away, so reloading a crashed tab works. Joining on the game-over screen waits for Play again.
10. **If the host goes:** the guest gets a HOST LEFT screen and keeps their XP. In the lobby the guest returns to a clean state and can join again.
11. PeerJS's default channel retransmits but is **unordered**, so snapshots and inputs carry a sequence number `n` and stale ones are dropped (a stale snapshot's events still play). The host skips a snapshot when over 512 KB is waiting to send, instead of building up lag.
12. Room-server blips don't touch a game in progress: the guest ignores them once connected, and the host reconnects to keep its code alive for rejoins.

## Testing
`node playtest/coop.js [outDir]` runs real clients over the real room server (needs internet): host and join, wrong code, lobby sync, ping, a full room, leaving and rejoining mid-run, the revive marker, game over, Play again and the host leaving. Run it after any change here. Tabs in the background draw no frames, so the test calls `MP.frames` before reading the HUD.

## Partner HUD
`mateMark` (view.js) puts a tag over the partner's head showing distance. It slides to the screen edge with an arrow when they're out of view and reads REVIVE or REVIVING when they're down. The end screen shows both players' numbers.

## Partner animation
The wizard is jointed (`blender/build_assets.py`: legs, skirt, body, head, hat, arms, staff, two-part cape in the wizard's element colour). `animWizard` (view.js) poses it on both machines from the snapshot and events, so it costs no extra bandwidth beyond three small fields (`gr` grounded, `dsh` dashing, `cg` charging or aiming a move). Speed and direction are measured from what's on screen, so legs match the real motion, forward, back or sideways.
- **Moving:** stride with dust at each footfall, lean, arm swing, cape on a spring, hat tip that flops; the head follows the aim and the body turns a beat later.
- **Air:** arms out, legs tucked, robe flared; a puff on take-off, and a squash and ring on a hard landing.
- **Dash:** hard lean, cape out, two afterimages and a spark trail.
- **Casting:** basic moves jab the palm, RMB thrusts the staff, skills use both, an ultimate throws both arms up and floats off the ground. Charging gathers at the chest, channels hold the arm out with a tremble, and gem and palm flare with all of these. `handPos` returns the real animated palm, so a partner's beams start from their hand.
- **Block, hit, down:** staff held across, a flinch with a red flash, a collapse that rises with the revive progress, then a burst and arms flung up when revived.
- **Element swap:** the staff twirls and everything retints. **Joining or leaving:** burns in with a pillar, leaves in a burst.

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
- JSON snapshots with sequence numbers. If bandwidth becomes a problem, switch to packed arrays.
- The guest owns its own position (no reconciliation). That's fine between friends, not against strangers.
- The guest's cooldowns and Overcharge count are local predictions and can drift slightly from the host's if inputs drop.

Related: [[Overview]]
