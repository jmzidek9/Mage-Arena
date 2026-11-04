# Sonic playtest report

**Verdict:** a strong crowd clearer that stays readable at range, but up close it hides the screen. The crowd damage is too high for a control element, and the boss damage is too low.

| | value |
|---|---|
| Crowd dps (kit, 30 s vs wave-5 x8) | **323.7** (83 kills, 150 HP lost) |
| Boss dps (Tyrant, 30 s) | **85.3** (423 HP lost) |
| x-median (19 elements: crowd 225.1 / boss 134.3) | **crowd 1.44x, boss 0.64x** |
| Worst frame cost | Bass Drop worst frame 2079 ms (a one-off spike). Highest average is Sonic Boom at 217 ms/frame, against 123-130 ms for the other moves (this was measured with 30 harnesses running at once, so only the relative numbers mean anything) |

Notes on the bench. The move test lasts 75 frames, about 1.25 s. That is why Bass Drop records only 18 dmg (one beat; the drop comes at 4 s) and Harmonic Link records 0 (it deals no damage itself). Implosion recorded **0 dmg** even though its 0.7 s fuse should go off inside the window. It cast 5 times in the kit run, so it does work in play. The cause is not verified (it may be how the harness places the aim target). See Q.

---

## LMB: Sound Wave
- **[visual]** The wave renders as a blown-out white oval, not cyan rings, and near the player it covers the target. Evidence: `m0_SoundWave_003.jpg` (the pack is completely hidden), `m0_SoundWave_010.jpg` and `kit_1199.jpg`. It also looks almost the same as the generic white bolt of light elements, so it reads as "light", not "sound". Proposed change in `look: { m: 'sonic__wave', light: 3 }`: set `light: 3 -> 1.2`. In `shot.tick`, separate the drawn size from the hitbox: `s.sc = s.r / .8` -> `s.sc = Math.min(2.4, s.r / .8) * .8`. The hitbox keeps widening, but the mesh stops covering the screen. **Impact high, effort S.**
- **[balance]** Sound Wave pierces 99 enemies and adds a Resonance stack on every hit. In a crowd, every cast advances the passive on the whole line, and this is the main cascade behind the 1.44x crowd score. On a boss it does 11.5 per 0.5 s. Proposed change: `pierce: 99 -> 4` and `dmg: 11.5 -> 13`. Crowd damage per cast drops, single-target damage rises about 13%. **Impact med, effort S.**

## RMB: Sonic Boom
- **[visual]** The fully charged release fills the centre of the screen with stacked white rings (`m1_SonicBoom_074.jpg`). The first ring spawns at the cast origin, which is at the camera (`(k + i * .15)` starts at 0), and grows to 5x scale. Proposed change: offset the start, `(k + i * .15)` -> `(.2 + k + i * .15)`, and dim the rings, `fade(o, 1 - k)` -> `fade(o, (1 - k) * .6)`. **Impact high, effort S.**
- **[feel]** Charging shows nothing. Frames 3, 10 and 45 (`m1_SonicBoom_003/010/045.jpg`) look the same apart from the hand sigil, so the player can't tell when the charge is full and will stun. Proposed change: during the charge, pulse the hand sigil's scale with `c.k`, or play `sfx('sonic')` once when `c.k` reaches 1. This keeps the move as it is and adds a cue. **Impact med, effort S.**
- **[performance]** It has the highest frame average of the kit (217 ms against 123-130 ms) and the most fx objects (61), with 583 particles at peak. Proposed change in `fx.boom`: `for (let i = 0; i < 40; i++) emit(...)` -> `i < 24`. **Impact low, effort S.**
- **[balance]** It deals 236 dmg into the pack, with 4 kills, and is the best burst in the kit. No crowd change. To help against bosses: `(15 + 45 * c.k)` -> `(15 + 60 * c.k)` (75 at full charge). **Impact low, effort S.**

## Q: Implosion
- **[visual]** The `sonic__rings` view looks like upright concentric half-arcs half sunk into the floor (`m2_Implosion_010.jpg`), not a flat vortex on the ground. The cause is probably `o.rotation.x = Math.PI / 2` standing up a model that is already flat. The same line is in the Bass Drop view. Check the model's axis and drop or change the rotation. Also, by frame 45 nothing of the burst is left on screen (`m2_Implosion_045.jpg`). Proposed change: `boomFx(..., .8)` -> `boomFx(..., 1.1)` and add `dustFx(e.x, e.z, e.r)` to `fx.boom`. **Impact med, effort S.**
- **[balance]** 0 dmg in the move test while the kit casts it fine. Before tuning, confirm the `end()` boom lands, for example by logging `boomAt` hits for `sonic.2`. If it is working: Implosion is a control move, so leave `30 * n.mul` as it is. **Impact med, effort S.**

## E: Harmonic Link
- **[visual]** You can't see what is linked. After the 1 s ground circle (`circleFx ... life: 1`), nothing shows which enemies share damage for the 6 s (`m3_HarmonicLink_010.jpg` and `_022.jpg` show only generic hit glows). Proposed change: `circleFx(..., { life: 1 })` -> `{ life: 6 }` at low opacity, or draw a thin `beamFx` between linked enemies once a second while `e.link.t > 0`. **Impact med, effort M.**
- **[balance]** It is useless on a solo boss (nothing to share with), and it has a 13 s cooldown with 4% ready time. Proposed change: `cd: 13 -> 11`. **Impact low, effort S.**

## R: Bass Drop
- **[visual]** The final drop is centred on the player (`boomAt(c, n.x, .5, n.z, 14, ...)` with `boomFx(..., 2.5)`), and the camera sits inside a 14 m blast. `boss_1199.jpg` is a full whiteout. It may be partly the Tyrant's effect, but Bass Drop is the likely source. Proposed change: `drop(e) { boomFx(e.x, 1, e.z, e.r, 0x3ee8ff, 2.5)` -> intensity `1.2`, and `shake(.8) -> .5`. Lean on the outer `ringFx` for the readable edge instead. **Impact high, effort S.**
- **[feel]** The first beats (`4 + n.s * 1.1` = 5.1 to 7.3 m) don't reach a pack only a few metres away. The move test shows one 18-damage hit in the first 1.25 s. Proposed change: `4 + n.s * 1.1` -> `6 + n.s * 1.0`, which gives 7 to 13 m before the 14 m drop. **Impact med, effort S.**
- **[performance]** It caused a 2079 ms worst frame (437 particles, 17 fx objects), most likely a first-time shader or model warm-up for `sonic__rings` or `sfx('ult')`, not steady cost. Warm `sonic__rings` up at load. **Impact low, effort S.**
- **[balance]** It has the most crowd output in the kit (8 casts across the kit run, every one hitting the whole wave). To trim the crowd score: `60 * n.mul -> 50` (drop) and `18 * n.mul -> 15` (beats). **Impact med, effort S.**

## Passive: Resonance
- **[balance]** Every 5 stacks, a 2.6 m burst does 40 dmg plus a 0.8 s stun to everything nearby. Combined with Sound Wave's pierce-99 stacking and the ult, it chains through packs. Proposed change: `40 * stats(p).dmgMul -> 32`. Keep the stun, because that is the control identity. **Impact med, effort S.**
- **[visual]** The `res` burst (4 note models, 2 rings, 30 particles) is readable and distinctive, with the music notes. Keep it.

---

## Top 3
1. **Stop the screen covering:** Sound Wave `light: 3 -> 1.2` with the drawn size capped (`s.sc = Math.min(2.4, s.r/.8)*.8`), Sonic Boom rings start at `.2 +` offset and `fade *.6`, and Bass Drop drop `boomFx 2.5 -> 1.2`.
2. **Bring crowd damage back toward the control band (1.44x -> about 1.1x):** Sound Wave `pierce: 99 -> 4`, Resonance `40 -> 32`, Bass Drop `60 -> 50` / `18 -> 15`.
3. **Raise boss damage (0.64x -> about 0.8x):** Sound Wave `dmg: 11.5 -> 13` and Sonic Boom `45 * c.k -> 60 * c.k`. Also check why Implosion records 0 dmg in the move test.
