# Shadow playtest report

**Verdict:** a well-built assassin kit whose moves set up Assassin's back-stab bonus, and it sits right on the median. But most of its crowd damage comes from Night Terror recasting itself (the shared ult-refill bug), and its purple accents bloom to warm white. **Crowd 218.1 dps (1.00x median 218.1), boss 151.3 dps (1.10x median 137.1)**. Worst frame: Blackout, 2901 ms on one frame (first use, probably a shader compile). The average frame time is 25-136 ms, inflated by parallel runs.

Harness notes: Blackout and Shadow Snare show **0 dmg** in the move test because the aim landed off the pack. The Blackout cloud is on the far right of the pack (`m1_Blackout_074.jpg`), and the Snare bursts land at the caster's feet (`m2_ShadowSnare_045.jpg`, white blobs at the bottom of the screen). Only the kit and boss numbers mean anything for those two. The orange-white glowing outlines on the pack (`m1_Blackout_010/022`, `m2_*`) appear before any shadow hit lands, so they are the shared effect already noted in other reports, not Shadow's.

**Ult bug: Shadow is affected.** Night Terror was cast 6 times in the 30 s crowd run and 5 times on the boss (ready 100%). One cast does `18 x 10 ticks + 50 = 230` to each of up to 12 targets, which refills the bar by itself. The 1.00x crowd figure depends on this. Once `addUlt` stops counting ultimate hits, expect Shadow to fall to about 0.5-0.6x crowd. The balance changes below are sized for after that fix.

## LMB: Shadow Daggers (cd .45, 3 x 10.5)
- **[visual]** The daggers can't be seen at frames 3/10 (`look.blink: 1` makes them flicker, and they are small at speed 48). The only feedback is the target's hit bloom (`m0_ShadowDaggers_010.jpg`, a white-hot brute). That makes the fan unreadable as "three daggers". Change: keep the blink but make the trail stronger, `trail: [0x7a3acc, .14, .25, 0, 1]` -> `[0x9a4cff, .2, .3, 0, 1]`, and give the dagger a faint `light: 2` so it shows against the night floor. Impact med, effort S.
- **[balance]** 58 casts in 30 s; this is the boss-fight workhorse (about 70 dps single target if all 3 hit). After the ult fix, `dmg: 10.5 * c.dmg` -> `12 * c.dmg` gets back roughly 10% of crowd and boss dps. The boss score has room (1.10x now, and it will also lose ult damage). Impact high, effort S.

## RMB: Blackout (cd 6, 16 dmg once, stun 1.5 s, 3 s cloud r 3)
- **[visual]** The cloud (`smokeCloud(16, n.r, 0x2a1250)`) reads as a small dim purple puff against the dark sky at 15 m (`m1_Blackout_074.jpg`). It is hard to tell where the blind zone is. Change: raise the zone circle's opacity `zoneCircle('shadow', n.r, .5)` -> `.7`, and the wisp rate `Math.random() < .5` -> `< .8`, so the edge and inside of the zone read from range. Impact med, effort S.
- **[visual]** The thrown orb (`shadow__orb`, `scale .25`) is a clean black ball with a trail (`m1_Blackout_022.jpg`, top centre). It reads well; no change.
- **[balance]** One 16 hit per enemy per cloud (`ready(n, e, 99)`) is very little for a 6 s cooldown, even for a setup move. The value is in the stun plus the turned back (+50% from Assassin). Change: `16 * n.mul` -> `24 * n.mul`. Impact med, effort S.
- **[performance]** Worst frame of the kit, 2901 ms, the first time Blackout is cast (every other Blackout frame is normal). Most likely the `smokeCloud` or `shadow__orb` material compiling on first use. Check that both are in the warm-up pass. Impact med, effort S.

## Q: Shadow Snare (cd 7, 12 dmg, pull 6, root 1.5 s, +40% dmg taken 1.5 s)
- **[visual]** The tendrils are only `burst(...)` particles in `0x5a2a9c` / `0xc090ff`. Under bloom the light lavender `0xc090ff` turns warm white-orange (`m2_ShadowSnare_045.jpg`, bottom of the screen), so it reads as fire sparks, not shadow tendrils. Change: accent `0xc090ff` -> `0x8a50e0` in `snare` (and the same accent in Blackout `burst`, Swap `swap` and Night Terror `pop`). Impact med, effort S.
- **[feel]** Rooted for 1.5 s and +40% damage for 1.5 s on a 7 s cooldown: a short window that one dagger volley barely fills. Change: `cc(e, 'root', 1.5, p); ... e.fvU = S.t + 1.5` -> `2` for both, so a Blackout or Swap fits inside the window. Impact med, effort S.
- **[feel]** `e.fv = .4` overwrites any active mark outright. Use `e.fv = Math.max(e.fvU > S.t ? e.fv : 0, .4)`, the same as Light's Blinding Flash, so a stronger mark from a partner isn't cut. Impact low, effort S.
- **[balance]** `12 * c.dmg` -> `18 * c.dmg`. Impact med, effort S.

## E: Shadow Swap (cd 9, 14 dmg, swap + stun 1.5 s facing away)
- **[feel]** Works as described: you land inside the pack between two imps that have their backs turned (`m3_ShadowSwap_022/074.jpg`), and the fovKick sells the teleport. The problem is that you end up melee-close to the whole pack, and the imps fill both halves of the screen. That is expected for an assassin, but worth knowing. No change.
- **[visual]** After the swap there is no sign of which enemy is stunned and open to the back-stab (`m3_ShadowSwap_074.jpg`). Change: in `swap` fx, add `ringFx(e.x2? ...)` -> put a small purple `ringFx(x, .1, z, .8, 0x9a4cff, 1.5)` under the swapped enemy (`e.x, e.z`) that lasts the stun. Impact low, effort S.
- **[balance]** Only 4 casts in 30 s. It is utility, so 14 dmg is fine. No change.

## R: Night Terror (ult, r 18, up to 12 targets, 18 per .5 s for 5 s + 50 burst)
- **[balance]** Affected by the ult-refill bug (6 casts / 30 s). 276 dmg in the move test with 5 kills, which is high for one ult compared with the median ultDmg of 19. Once the bug is fixed it is a strong but fair ultimate. No change to the numbers.
- **[visual]** The stalking shadows use `ghostWizard(0x1a0630)`, and `energyMat` is **additive**, so a near-black colour adds almost nothing. The "dark copy" is close to invisible, or shows only as a pale fresnel rim (`kit_1199.jpg`, white outline figures on the left). Change: give the shadow figure its own normal-blended material (e.g. `new THREE.MeshBasicMaterial({ color: 0x14081f, transparent: true, opacity: .75, depthWrite: false })` traversed onto `WIZ.clone()` in the Night Terror `make`/`upd`), so it actually looks like a shadow. Impact high, effort S.
- **[visual] (unverified)** At `m4_NightTerror_003/010/022.jpg` the whole screen is a flat orange low-poly surface, and at `_045` a large orange blob still sits in front of the camera. No other element's `m4_*_003` frame looks like this (compare `soul/m4_TheReaper_003.jpg`). By `_074` the view is normal again, with the pack fleeing in a purple haze. Fear flight (sim.js:908) moves enemies away from the player, so it's not that. The cause wasn't found from code reading. Rerun `node playtest/run.js shadow` and check whether it's the new ghost figures (the `WIZ` clone before it is first positioned) or a harness carry-over from the Swap test. Impact high if real, effort S to M.
- **[performance]** Peaks at 691 particles and 68 fx objects, the most in the kit: one ghost per victim emitting 30% of frames, plus 60 particles and a flash per victim on `pop`. Change: `pop` `burst(..., 40, 0x140a24, ...)` -> `24`, and keep one `flash` for the whole burst (in `end`, not per enemy). Impact med, effort S.
- **[feel]** The description says the enemies "flee from it" (their shadow), but the code flees from the nearest player. That is the better design (it turns their backs to you for the Assassin bonus), so just change the text: "They flee from you in terror while it strikes them...". Impact low, effort S.

## Passive: Assassin (+50% from behind, Cursed +15%)
- **[feel/balance]** Back-stab check (sim.js:330, dot < -.3) works with all three setups. Blackout and Swap both set `e.yaw` to face away from the caster, and Fear makes enemies run away (backs turned). The kit is built around its passive. The boss can't be feared and only stuns for .35x, so on the Tyrant the bonus mostly applies by chance. That's fine. No change.
- **[visual]** Nothing shows a back-stab when it lands. Change: in `damage()` at sim.js:330, when the 1.5x applies, pass a crit flag so the popup shows as a crit (the same `crit` path Light's headshot uses). That way players learn the mechanic. Impact med, effort S.

## Top 3
1. **Night Terror shadows visible:** swap the additive `ghostWizard(0x1a0630)` for a normal-blended dark material, so the "dark copy" reads as a shadow instead of a pale rim. Also recheck the orange screen-fill in `m4_NightTerror_003-045`.
2. **Retune for after the ult fix:** Daggers `10.5 -> 12`, Blackout `16 -> 24`, Snare `12 -> 18` and root/mark `1.5 -> 2 s`. Aim for about 0.9x crowd median once Night Terror stops recasting itself.
3. **Purple, not white:** accent `0xc090ff -> 0x8a50e0` across the Blackout, Snare, Swap and Night Terror bursts, plus a crit-style popup for back-stabs.
