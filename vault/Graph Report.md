# Graph Report - Test Game  (2026-11-08)

## Corpus Check
- 151 files · ~396,630 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 27 file(s) not represented in the graph (top: (none) 12, .ipynb 12, .properties 1)

## Summary
- 2330 nodes · 3962 edges · 154 communities (138 shown, 16 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 288 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e8b9ee07`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- evaluate_chat_ceval.py
- core.js
- dungeon.js
- view.js
- aim
- net.js
- Mesh
- elements.js
- Elements.md
- Venom playtest report
- Audio credits
- build_hell
- areas.js
- modes.js
- renderWorld
- city.js
- run.js
- argparse
- ringFx
- addShader
- Wind playtest report
- boomAt
- finetune.py
- clamp
- TRS
- renderLobby
- Elements
- stepCast
- onEvent
- icons.js
- animEnemy
- blocks.js
- sim.js
- MUSIC
- os
- build_elements.py
- transformers
- build_assets.py
- grab
- puffTex
- Magma playtest report
- Explosion playtest report
- Steel playtest report
- Sonic playtest report
- Illusion playtest report
- add_merges.py
- Crystal playtest report
- lib.py
- settings.js
- Fire playtest report
- addUlt
- Nature playtest report
- Arcane playtest report
- Plasma playtest report
- README_ES.md
- Rune playtest report
- README_FR.md
- Frost playtest report
- react
- evaluate_plugin.py
- Qwen/README.md
- EVALUATION.md
- evaluate_ceval.py
- build_enemies.py
- Blades playtest report
- cityLayout
- Laser playtest report
- Demo & Inference
- Earth playtest report
- scarFx
- Fine-tuning Qwen Using Deepspeed
- openai_api.py
- llm.py
- Spirit playtest report
- Qwen/web_demo.py
- buildCityView
- all.sh
- model
- auto_comments.py
- stepEnemies
- README_JA.md
- Evaluation
- ctxOf
- Storm playtest report
- Qwen/README_CN.md
- デモと推論
- cIx
- lfxFrame
- evaluate_chat_mmlu.py
- evaluate_cmmlu.py
- 环境配置
- pvShow
- evaluate_mmlu.py
- .chat
- system_prompt.md
- 使用通义千问作为Agent
- damage
- gfx.js
- Netcode
- numpy
- Qwen/cli_demo.py
- json
- Demo & 推理
- Quickstart
- Light playtest report
- Inference Qwen Using vLLM
- Inference Qwen Using 🤖 ModelScope and 🤗 Transformers
- 运行步骤
- Deployment
- 部署
- Inicio rápido
- Blood playtest report
- デプロイ
- Soul playtest report
- Tokenization
- Water playtest report
- react_demo.py
- 快速使用
- swift/README.md
- swift/README_CN.md
- Tokenization
- dcu-support/web_demo.py
- Mage Arena playtest report (all 30 elements)
- finetune_lora_single_gpu.sh
- finetune_qlora_single_gpu.sh
- Bone playtest report
- Chrono playtest report
- Démarrage Rapide
- .chat
- .chat
- Mage Arena
- hud
- auto_comments.md
- finetune_ds.sh
- finetune_lora_ds.sh
- finetune_qlora_ds.sh
- BasicAuthMiddleware
- burst
- css
- Fine-tuning Qwen by Ascend NPU
- Quantization
- Inference Qwen Using TensorRT-LLM
- Enemies
- Similar moves (reviewed 2026-10-27)
- docker_qwen.sh
- docker_cli_demo.sh
- docker_openai_api.sh
- docker_web_demo.sh
- emit
- initAudio
- dashscope/README.md
- tests/README.md

## God Nodes (most connected - your core abstractions)
1. `TRS()` - 74 edges
2. `aim()` - 39 edges
3. `Elements` - 38 edges
4. `ell()` - 31 edges
5. `Mesh` - 31 edges
6. `build_hell()` - 30 edges
7. `crystal()` - 29 edges
8. `build_frost()` - 27 edges
9. `pol()` - 27 edges
10. `build_crypt()` - 26 edges

## Surprising Connections (you probably didn't know these)
- `Finishing pass` --references--> `bake_ao()`  [INFERRED]
  vault/Blender Assets.md → blender/lib.py
- `R: Bass Drop` --references--> `ringFx()`  [INFERRED]
  playtest/reports/sonic.md → js/core.js
- `RMB: Ball Lightning (cd 6, orb 6 dmg pierce, zaps 2 targets x5 every 0.25 s, burst 20)` --references--> `boltFx()`  [INFERRED]
  playtest/reports/storm.md → js/core.js
- `Passive: Kindling (death blast 20 x dmgMul, r 2.6)` --references--> `fireBoom()`  [INFERRED]
  playtest/reports/fire.md → js/elements.js
- `LMB: Grenade` --references--> `blastFx()`  [INFERRED]
  playtest/reports/explosion.md → js/elements.js

## Import Cycles
- None detected.

## Communities (154 total, 16 thin omitted)

### Community 0 - "evaluate_chat_ceval.py"
Cohesion: 0.31
Nodes (8): cal_ceval(), eval_subject(), extract_answer(), extract_choice(), format_example(), load_models_tokenizer(), main(), process_before_extraction()

### Community 1 - "core.js"
Cohesion: 0.02
Nodes (74): amb, ARENA_PILLARS, BH, BH_L, BIND, BIND_DEF, bloomPass, _c (+66 more)

### Community 2 - "dungeon.js"
Cohesion: 0.07
Nodes (55): add(), anchor(), ARRIVE, block(), BUCKET, buildDungeonView(), buildFloor(), buildHall() (+47 more)

### Community 3 - "view.js"
Cohesion: 0.04
Nodes (48): BOSS_COL, BOSS_GAIT, CAST_T, castFx(), CASTS, CC_OV, COMBO_FX, DIFF (+40 more)

### Community 4 - "aim"
Cohesion: 0.12
Nodes (25): limb(), sleeve(), barm(), boss_body(), boss_sword(), brute_body(), cn_body(), ft_body() (+17 more)

### Community 5 - "net.js"
Cohesion: 0.09
Nodes (38): autoQuality(), bfSnap(), bgTick(), CHEAT_TOGGLES, cheatSpawn(), dropGuest(), footsteps(), frame() (+30 more)

### Community 6 - "Mesh"
Cohesion: 0.12
Nodes (10): spell_circle(), part(), bridge(), bridge_gate(), bridge_pier(), bridge_post(), horn_(), apply_subsurf() (+2 more)

### Community 7 - "elements.js"
Cohesion: 0.03
Nodes (29): _bgeo, chainBolt(), DOME_GEO, ELEMENTS, entangleRing(), EQ_GEO, FALL_GEO, FLARE_GEO (+21 more)

### Community 8 - "Elements.md"
Cohesion: 0.24
Nodes (4): Spells, Done (2026-10-27), To-do (noted 2026-10-26), Upgrades (removed)

### Community 9 - "Venom playtest report"
Cohesion: 0.18
Nodes (9): Balance overview, E: Contagion, LMB: Venom Spit, Passive: Virulence, Q: Serpent, R: Plague Swarm, RMB: Toxic Cloud, Top 3 (+1 more)

### Community 10 - "Audio credits"
Cohesion: 0.33
Nodes (5): Audio credits, Music (`audio/music/`), Sound effects (`audio/sfx/`, file names kept from the packs), pickSample(), SFX

### Community 11 - "build_hell"
Cohesion: 0.15
Nodes (21): build_crypt(), branch(), gravestone(), build_frost(), rim(), build_hell(), rim(), build_void() (+13 more)

### Community 12 - "areas.js"
Cohesion: 0.08
Nodes (33): addPool(), AREAS, aroundIsle(), bridgeEnds(), bsc(), die(), easeBack(), FOE_ATK (+25 more)

### Community 13 - "modes.js"
Cohesion: 0.12
Nodes (15): applyMap(), buildTrain(), DUEL_SPOTS, duelReset(), showScenery(), startDuel(), startMode(), startTrain() (+7 more)

### Community 14 - "renderWorld"
Cohesion: 0.16
Nodes (15): animWizard(), makeEnt(), makeShot(), makeWizard(), me(), renderAuras(), renderChannels(), renderEnts() (+7 more)

### Community 15 - "city.js"
Cohesion: 0.07
Nodes (36): CBX, CITY, cityApply(), cityBreakFx(), cityCrackFx(), cityFrame(), cityG, cityPropFx() (+28 more)

### Community 16 - "run.js"
Cohesion: 0.05
Nodes (32): all, { execFile }, fs, OUT, path, src, browser(), { chromium } (+24 more)

### Community 17 - "argparse"
Cohesion: 0.10
Nodes (14): args_parser(), args_parser(), extract_answer(), is_correct(), number_equal(), extract_code(), generate_sample(), decode() (+6 more)

### Community 18 - "ringFx"
Cohesion: 0.10
Nodes (28): addFx(), animateArena(), boltFx(), circleFx(), easeOut(), easeOutBack(), glowify(), glowMats() (+20 more)

### Community 19 - "addShader"
Cohesion: 0.22
Nodes (10): addShader(), beamMat(), discMat(), energyMat(), fireMat(), flameMat(), model(), pillarFx() (+2 more)

### Community 20 - "Wind playtest report"
Cohesion: 0.20
Nodes (9): E: Tornado (lines 619-638), Expected landing, LMB: Wind Blades (`js/elements.js` line 602), Passive: Tailwind (`js/sim.js` lines 94 and 582), Q: Updraft (lines 615-618), R: Downburst (lines 639-659), RMB: Gale Force (lines 605-614), Top 3 (+1 more)

### Community 21 - "boomAt"
Cohesion: 0.25
Nodes (8): boomAt(), ctxS(), fxe(), inkSplash(), summonAI(), RMB: Crush (cd 6, 55 dmg r3.5, stun 1 s, slams airborne), Q: Sigilfall, Q: Implosion

### Community 22 - "finetune.py"
Cohesion: 0.08
Nodes (13): DataArguments, get_peft_state_maybe_zero_3(), LazySupervisedDataset, LoraArguments, make_supervised_data_module(), maybe_zero_3(), ModelArguments, preprocess() (+5 more)

### Community 23 - "clamp"
Cohesion: 0.50
Nodes (4): clamp(), localInput(), pollPad(), setupTouch()

### Community 24 - "TRS"
Cohesion: 0.07
Nodes (62): ba_arm(), ba_body(), bake_scale(), bd_body(), beast(), legq(), biped(), arm() (+54 more)

### Community 25 - "renderLobby"
Cohesion: 0.18
Nodes (17): bestFor(), gainXP(), needXP(), PICKABLE(), renderDetail(), renderLobby(), renderProg(), renderTalents() (+9 more)

### Community 26 - "Elements"
Cohesion: 0.06
Nodes (36): 🐙 Abyss, 🔮 Arcane, Balance, 🗡️ Blades, Blocks, 🩸 Blood, 💀 Bone, ⏳ Chrono (+28 more)

### Community 27 - "stepCast"
Cohesion: 0.16
Nodes (13): Checklist: adding or changing a move or an element, Don't lag the PC (this has happened twice), Knowledge, Mage Arena, Never lose data, Spell icons, canCast(), castEv() (+5 more)

### Community 28 - "onEvent"
Cohesion: 0.22
Nodes (18): arcFx(), bossAnim(), bossArrive(), bossAura(), bossCol(), bossDeath(), bossIntro(), bossTransform() (+10 more)

### Community 29 - "icons.js"
Cohesion: 0.14
Nodes (5): elIcon(), moveIcon(), paintKit, SIGIL, SPELL_ART

### Community 30 - "animEnemy"
Cohesion: 0.83
Nodes (4): animEnemy(), bossGait(), heavyGait(), legLen()

### Community 31 - "blocks.js"
Cohesion: 0.23
Nodes (8): BLOCK, BLOCK_LOOK, guardFrame(), guardMake(), guardParticles(), guardPose(), GV, myGuard()

### Community 32 - "sim.js"
Cohesion: 0.09
Nodes (28): BOSS_SKY, capNear(), clampArena(), collide(), confine(), ELIST, endWave(), ET (+20 more)

### Community 33 - "MUSIC"
Cohesion: 1.00
Nodes (3): MUSIC, playMood(), track()

### Community 34 - "os"
Cohesion: 0.15
Nodes (8): test_finetune(), test_inference_api(), test_inference_vllm_fschat(), run_in_subprocess(), simple_openai_api(), TelnetPort(), _device_map(), load_model_on_gpus()

### Community 35 - "build_elements.py"
Cohesion: 0.13
Nodes (15): arcpts(), blob_cloud(), crescent(), crescent_blade(), lens(), M(), mirror_shard(), plated_rock() (+7 more)

### Community 36 - "transformers"
Cohesion: 0.15
Nodes (5): get_stop_words_ids(), vLLMWrapper, get_stop_words_ids(), vLLMWrapper, preprocess()

### Community 37 - "build_assets.py"
Cohesion: 0.11
Nodes (20): arm_l(), cape(), cape2(), digit(), finger(), fist(), head(), leg() (+12 more)

### Community 38 - "grab"
Cohesion: 0.67
Nodes (3): grab(), sp(), Conventions

### Community 39 - "puffTex"
Cohesion: 0.67
Nodes (3): puffTex(), smokeCloud(), RMB: Blackout (cd 6, 16 dmg once, stun 1.5 s, 3 s cloud r 3)

### Community 40 - "Magma playtest report"
Cohesion: 0.20
Nodes (9): pulse(), E: Volcano (cd 15, 10 s, bomb 22 r 2.2 every 0.9 s, range 16), LMB: Magma Glob (cd 0.7, 14 dmg splash r 2.2, pool 4 / 0.5 s, cools to rock), Magma playtest report, Passive: Molten Core (dot 6, +10% damage taken; attackers turn molten), Q: Heat Wave (cd 10, 9 m wall, 6 per 0.15 s, melt 70 after 5 scorches), R: Meteor (ult, 135 raw r 7.5, kb 10 lift 9, then a 5 s field of 8 / 0.5 s at r 6), RMB: Eruption (cd 5, 50 raw r 3, lift 13, 3 s pool) (+1 more)

### Community 41 - "Explosion playtest report"
Cohesion: 0.20
Nodes (9): E: Proximity Mines, Explosion playtest report, LMB: Grenade, Passive: Demolitions, Q: Rocket Jump, R: Carpet Bomb, RMB: Sticky Bomb, Root balance issue: Carpet Bomb recharges itself (+1 more)

### Community 42 - "Steel playtest report"
Cohesion: 0.22
Nodes (8): E · Caltrops, LMB · Saw Blade, Passive · Armor Breaker, Q · Magnetize, R · Blade Storm, RMB · Railgun, Steel playtest report, Top 3

### Community 43 - "Sonic playtest report"
Cohesion: 0.15
Nodes (12): beamFx(), beamMesh(), laserFx(), prismRays(), LMB: Pulse Laser (line 2037), E: Harmonic Link, LMB: Sound Wave, Passive: Resonance (+4 more)

### Community 44 - "Illusion playtest report"
Cohesion: 0.22
Nodes (8): E: Kaleidoscope (cd 7), Illusion playtest report, LMB: Phantom Moths (cd .45), Passive: Misdirection (`st: { weak: .2 }`, sim.js:435 1-in-3 miss), Q: Mesmerize (cd 10), R: Phantasmagoria (ultimate), RMB: Decoy (cd 8), Top 3

### Community 45 - "add_merges.py"
Cohesion: 0.11
Nodes (20): swap(), E: Shadow Swap (cd 9, 14 dmg, swap + stun 1.5 s facing away), LMB: Shadow Daggers (cd .45, 3 x 10.5), Passive: Assassin (+50% from behind, Cursed +15%), Q: Shadow Snare (cd 7, 12 dmg, pull 6, root 1.5 s, +40% dmg taken 1.5 s), Shadow playtest report, Top 3, apply_bp() (+12 more)

### Community 46 - "Crystal playtest report"
Cohesion: 0.22
Nodes (8): Crystal playtest report, E: Crystal Spire (`crystal.3`, line 1135), LMB: Prism Shard (`crystal.0`, line 1097), Passive: Prismatic (`onKill`, line 1095), Q: Resonant Crystal (`crystal.2`, line 1123), R: Crystal Tomb (`crystal.4`, line 1153), RMB: Geode Bomb (`crystal.1`, line 1107), Top 3

### Community 47 - "lib.py"
Cohesion: 0.10
Nodes (8): center(), lane_angle(), apply_bevel(), bake_ao(), coll(), pack_bundle(), Previewer, uv_ribbon()

### Community 48 - "settings.js"
Cohesion: 0.08
Nodes (31): applySettings(), audioGains(), audioTick(), BIND_NAMES, CB_SHIFT, CB_SIM, cbMatrix(), closeSettings() (+23 more)

### Community 49 - "Fire playtest report"
Cohesion: 0.18
Nodes (10): spread(), Balance summary, E: Ring of Fire (dmg 95, 476 ms avg = fire's slowest, 577 particles, 41 fx, 1 ent), Fire playtest report, LMB: Fireball (dmg 26 into pack, 170 ms avg, 339 particles, 27 fx), Passive: Kindling (death blast 20 x dmgMul, r 2.6), Q: Fire Brand (dmg 37 measured, see note; 386 ms avg, 883 particles = fire's highest, 30 fx), R: Conflagration (dmg 249 measured, eruptions not in window; 436 ms avg, 819 particles, 56 fx = fire's highest) (+2 more)

### Community 50 - "addUlt"
Cohesion: 0.10
Nodes (19): addUlt(), Balance root cause: Supernova recharges itself, Cosmic playtest report, E: Meteor Shower, LMB: Star Shot, Passive: Stellar Rhythm / Starstruck, Q: Constellation, R: Supernova (+11 more)

### Community 51 - "Nature playtest report"
Cohesion: 0.22
Nodes (8): E: Snaptrap, LMB: Thorn Volley, Nature playtest report, Q: Parasite Seed, R: World Tree, RMB: Entangle, Shared (not nature-specific), Top 3

### Community 52 - "Arcane playtest report"
Cohesion: 0.29
Nodes (6): Arcane playtest report, E: Polymorph (dmg 15, 94 ms avg, 681 particles = highest non-ult peak, 15 fx), LMB: Arcane Missiles (dmg 20 into pack, 242 ms avg, 285 particles, 8 fx), Passive: Arcane Charges (+8% per charge, up to 4) and Spellbound (+10% damage taken), R: Arcane Torrent (dmg 67 in window, 95 ms avg, 588 particles, 25 fx). **Affected by the ult loop**, Top 3

### Community 53 - "Plasma playtest report"
Cohesion: 0.29
Nodes (6): E: Thermal Lance (cd 6, 40 pierce in a 12 m line, burn line 6 / .4 s above 50 Heat), LMB: Plasma Bolt (cd .28, 11 + 4 splash, heat 9), Passive: Heat (+0.5% dmg per Heat, overheat at 100 = 25 dmg vent + 2.5 s lock, cools 15/s), Plasma playtest report, RMB: Plasma Cannon (charge 1.1 s, cd 3.5, 25-85 dmg, blast r 2-4.5), Top 3

### Community 54 - "README_ES.md"
Cohesion: 0.07
Nodes (28): Acuerdo de Licencia, API, Cita, Comprensión del Contexto Largo, Contacte con Nosotros, Cuantización, Cuantización de la caché KV, Demo CLI (+20 more)

### Community 55 - "Rune playtest report"
Cohesion: 0.18
Nodes (12): dropFade(), tripped(), wardMake(), wardUpd(), wardView(), E: Binding Circle, LMB: Rune Bolt, Passive: Rune Mastery (+4 more)

### Community 56 - "README_FR.md"
Cohesion: 0.07
Nodes (28): Accord de Licence, API, Besoins, Citation, Compréhension du Contexte Long, Contactez-nous, 🐳 Docker, Démo CLI (+20 more)

### Community 57 - "Frost playtest report"
Cohesion: 0.20
Nodes (9): renderAim(), E: Frost Nova, Frost playtest report, LMB: Ice Shard, Passive: Permafrost (4 hits -> freeze 1.8 s, frozen take +40%), Performance (measured), R: Blizzard (ultimate), RMB: Glacial Lance (+1 more)

### Community 58 - "react"
Cohesion: 0.19
Nodes (17): r2(), alive(), blast(), center(), endShot(), enemiesNear(), launch(), nearest() (+9 more)

### Community 59 - "evaluate_plugin.py"
Cohesion: 0.15
Nodes (11): _DummyTokenizer, eval_action(), eval_action_input(), _get_tokenized_string(), is_callable(), load_jobs(), load_models_tokenizer(), main() (+3 more)

### Community 60 - "Qwen/README.md"
Cohesion: 0.08
Nodes (25): Citation, Contact Us, Deployment, 🐳 Docker, FAQ, Finetuning, Finetuning, GPTQ (+17 more)

### Community 61 - "EVALUATION.md"
Cohesion: 0.14
Nodes (11): 评测复现, Coding, Conclusion, Data, Evaluation, Fine-tuning, Introducing Qwen-7B: Open foundation and human-aligned models (of the state-of-the-arts), Math (+3 more)

### Community 62 - "evaluate_ceval.py"
Cohesion: 0.36
Nodes (7): cal_ceval(), eval_subject(), format_example(), generate_few_shot_prompt(), get_logits(), load_models_tokenizer(), main()

### Community 63 - "build_enemies.py"
Cohesion: 0.22
Nodes (17): arm(), boss_arm(), claws(), dkbody(), ellipsoid(), horn(), kbody(), leg() (+9 more)

### Community 64 - "Blades playtest report"
Cohesion: 0.20
Nodes (9): zoneCircle(), Blades playtest report, E: Rain of Blades (cd 11, 12 x 20 in r 1.8 stabs, 6 s field, 30% slow, pick-up), LMB: Flying Daggers (cd .35, 2 x 7.5, home 2), Passive: Sword Halo (+1 sword / 2.5 s, max 6; guard 18 dmg to anything within 3 m every .35 s, costs a sword), Q: Blade Dance (cd 8, 9 m dash, 32 dmg in a 1.8 m lane, +2 swords), R: Colossal Blade (ult, 130 impact r 6 + 5 x 26 waves, halo to 6), RMB: Sword Volley (cd 2.5, max(2, swords) x 24, pierce 3) (+1 more)

### Community 65 - "cityLayout"
Cohesion: 0.18
Nodes (17): cityHit(), cityLayout(), house(), tower(), cityMap(), cityPropMask(), cityReset(), citySettle() (+9 more)

### Community 66 - "Laser playtest report"
Cohesion: 0.24
Nodes (9): laserShot(), novaBeams(), E: Laser Drone (lines 2050-2063), Laser playtest report, Passive: Ricochet and Focus (laserShot, lines 35-61), Q: Refractor (lines 2042-2049), R: Prism Nova (lines 2064-2089, novaBeams line 63), RMB: Ricochet Beam (line 2040) (+1 more)

### Community 67 - "Demo & Inference"
Cohesion: 0.09
Nodes (22): bos_id/eos_id/pad_id not found, Can I use CPU only?, Can Qwen support SFT or even RLHF?, Can Qwen support streaming?, Demo & Inference, Docker, Download official docker image is very slow, Failure in installing flash attention (+14 more)

### Community 68 - "Earth playtest report"
Cohesion: 0.22
Nodes (8): Earth playtest report, LMB: Stone Shot (cd .7, 5 x 10 dmg, spread ±.13), Other, Passive: Bedrock (15% less damage, poise x2, st vuln .1), Q: Stone Pillar (aim, cd 9, 26 dmg, lift 12, solid wall for 6 s), R: Tectonic Quake (ult, 4 quakes x 40 dmg, 12 m, stun 1.2), RMB: Boulder (cd 5, 38 dmg pierce + 20 AoE at end), Top 3

### Community 69 - "scarFx"
Cohesion: 0.12
Nodes (25): bigBoltFx(), blastFx(), bloodSplat(), boomFx(), debrisFx(), deepSplash(), dustFx(), fireBoom() (+17 more)

### Community 70 - "Fine-tuning Qwen Using Deepspeed"
Cohesion: 0.12
Nodes (16): Data Preparation, Environments, Fine-tuning Qwen Using Deepspeed, Full-parameter Fine-tuning, Inference with Adapters, Inference with Merged Weights, LoRA Fine-tuning, Merging Weights from LoRA and Q-LoRA (+8 more)

### Community 71 - "openai_api.py"
Cohesion: 0.12
Nodes (19): add_extra_stop_words(), ChatCompletionRequest, ChatCompletionResponse, ChatCompletionResponseChoice, ChatCompletionResponseStreamChoice, ChatMessage, create_chat_completion(), DeltaMessage (+11 more)

### Community 73 - "Spirit playtest report"
Cohesion: 0.25
Nodes (7): LMB: Soul Wisps, Passive: Restless Dead (+ Haunted), Q: Banshee, R: Army of the Dead, RMB: Command, Spirit playtest report, Top 3

### Community 74 - "Qwen/web_demo.py"
Cohesion: 0.19
Nodes (9): _gc(), _get_args(), _launch_demo(), predict(), regenerate(), reset_state(), _load_model_tokenizer(), main() (+1 more)

### Community 75 - "buildCityView"
Cohesion: 0.24
Nodes (11): arenaMat(), arenaObj(), buildCityView(), buildKit(), cboxGeo(), cityLights, cityRng(), GB (+3 more)

### Community 78 - "auto_comments.py"
Cohesion: 0.26
Nodes (10): deal_folder(), deal_one_file(), gen_code_comments(), merge_code_and_comments(), QWenChat, read_file(), split_context_by_maxline(), split_context_by_splitkey() (+2 more)

### Community 79 - "stepEnemies"
Cohesion: 0.17
Nodes (28): aoe(), bomberBlast(), bossCoast(), bossMeteors(), dropOrb(), enemyHits(), ev(), foeOrb() (+20 more)

### Community 80 - "README_JA.md"
Cohesion: 0.06
Nodes (34): CPU, DashScope, 🐳 Docker, FAQ, GPTQ, KVキャッシュ量子化, 🤖 ModelScope, 🤗 Transformers (+26 more)

### Community 81 - "Evaluation"
Cohesion: 0.22
Nodes (9): Coding, Data, Evaluation, Long-context inference, Math, Model, Natural language processing, Pretraining (+1 more)

### Community 82 - "ctxOf"
Cohesion: 0.28
Nodes (13): aimOf(), castAim(), coneHits(), ctxOf(), eyeOf(), flatAim(), groundAt(), handOf() (+5 more)

### Community 83 - "Storm playtest report"
Cohesion: 0.20
Nodes (9): padBuzz(), shake(), skyFx(), Passive: Static (every 8th Storm hit drops a 16-dmg sky strike; Shocked takes +15%), Q: Thunderclap (cd 7, 0.45 s delay, 38 dmg r3.5 + stun 0.8, then 3 jumps x20), R: Thunderstorm (ult, cloud follows you for 5 s, a 38-dmg r1.6 sky bolt + 0.25 s stun every 0.24 s), RMB: Ball Lightning (cd 6, orb 6 dmg pierce, zaps 2 targets x5 every 0.25 s, burst 20), Storm playtest report (+1 more)

### Community 84 - "Qwen/README_CN.md"
Cohesion: 0.08
Nodes (25): FAQ, GPTQ, KV cache量化, Tokenizer, 使用协议, 使用方法, 🐳 使用预构建的Docker镜像, 准备操作 (+17 more)

### Community 85 - "デモと推論"
Cohesion: 0.10
Nodes (20): bos_id/eos_id/pad_id が見つかりません。, chat_stream() を使用すると、結果に文字化けが発生します。, CPU のみを使うことはできますか？, FAQ, Flash attention 導入の失敗例, `qwen.tiktoken` が見つかりません。これは何ですか？, Qwen は SFT、あるいは RLHF に対応できますか？, Qwen はストリーミングに対応していますか？ (+12 more)

### Community 86 - "cIx"
Cohesion: 0.25
Nodes (11): blockAt(), cityCollide(), cityField(), gate(), cityLOS(), cityNav(), citySpawnSpot(), cityStep() (+3 more)

### Community 87 - "lfxFrame"
Cohesion: 0.43
Nodes (8): lfxA(), lfxAmbient(), lfxFrame(), lfxLite(), lfxRgb(), lfxSpawn(), lfxSprite(), lobbyFx()

### Community 88 - "evaluate_chat_mmlu.py"
Cohesion: 0.31
Nodes (8): cal_mmlu(), eval_subject(), extract_answer(), extract_choice(), format_example(), load_models_tokenizer(), main(), process_before_extraction()

### Community 89 - "evaluate_cmmlu.py"
Cohesion: 0.36
Nodes (7): cal_cmmlu(), eval_subject(), format_example(), generate_few_shot_prompt(), get_logits(), load_models_tokenizer(), main()

### Community 90 - "环境配置"
Cohesion: 0.20
Nodes (9): DCU 架构基于 fastllm 推理 Qwen 模型, 加载环境, 安装方法, 容器启动, 推理, 模型推理, 模型转换, 环境准备 (+1 more)

### Community 91 - "pvShow"
Cohesion: 0.33
Nodes (6): flat0(), pvDot, pvFit(), pvShow(), smoothGeo(), soften()

### Community 92 - "evaluate_mmlu.py"
Cohesion: 0.36
Nodes (7): cal_mmlu(), eval_subject(), format_example(), generate_few_shot_prompt(), get_logits(), load_models_tokenizer(), main()

### Community 93 - ".chat"
Cohesion: 0.29
Nodes (6): FAQ, ReAct Prompting 示例, 准备工作一：样例问题、样例工具, 准备工作二：ReAct 模版, 步骤一：让千问判断要调用什么工具、生成工具入参, 步骤二：让千问根据插件返回结果继续作答

### Community 94 - "system_prompt.md"
Cohesion: 0.22
Nodes (8): 什么是系统指令? (What is the System Prompts?), 代码示例 Example, 任务设定 Task Setting, 系统指令 (System Prompts), 系统指令能做什么？ (What can System Prompts do?), 行为设定 Behavior Setting, 角色扮演 Role Play, 语言风格 Language Style

### Community 95 - "使用通义千问作为Agent"
Cohesion: 0.22
Nodes (8): Tools, Tools支持, Tools模型部署, 什么是HuggingFace Agent, 使用示例, 使用通义千问作为Agent, 安装依赖, 构建QWenAgent

### Community 96 - "damage"
Cohesion: 0.12
Nodes (22): applyStatus(), bondMul(), cc(), ccEnd(), damage(), elementPower(), hitEnemy(), hurt() (+14 more)

### Community 97 - "gfx.js"
Cohesion: 0.08
Nodes (22): aoA, aoB, applyGfx(), fxaaPass, _gcam, _gd, GFX_KEYS, GFX_ORDER (+14 more)

### Community 98 - "Netcode"
Cohesion: 0.25
Nodes (7): handPos(), R: Fusion Beam (ult, 4 s, 15 per .1 s per enemy on a 40 m ray), Cross-platform, Known ceilings (`ponytail:` comments in the code), Netcode, Partner animation, Testing

### Community 99 - "numpy"
Cohesion: 0.64
Nodes (5): tofile(), write_int4(), write_int8(), writeKeyValue(), writeString()

### Community 100 - "Qwen/cli_demo.py"
Cohesion: 0.43
Nodes (6): _clear_screen(), _gc(), _get_input(), _load_model_tokenizer(), main(), _print_history()

### Community 101 - "json"
Cohesion: 0.26
Nodes (7): call_qwen(), test_1(), test_2(), test_3(), build_react_instruction(), format_train_sample(), main()

### Community 102 - "Demo & 推理"
Cohesion: 0.09
Nodes (22): bos_id/eos_id/pad_id，这些token id不存在，为什么？, Demo & 推理, Docker, FAQ, flash attention 安装失败, `qwen.tiktoken`这个文件找不到，怎么办？, Qwen支持流式推理吗？, Tokenizer (+14 more)

### Community 103 - "Quickstart"
Cohesion: 0.25
Nodes (8): Batch Inference, CPU, DashScope, 🤖 ModelScope, Multiple GPUs, Quickstart, 🤗 Transformers, x86 Platforms

### Community 104 - "Light playtest report"
Cohesion: 0.20
Nodes (10): flash(), aimBeam(), E: Penance, Light playtest report, LMB: Radiant Orbs, Passive: Radiance, Q: Blinding Flash, R: Divine Judgment (+2 more)

### Community 105 - "Inference Qwen Using vLLM"
Cohesion: 0.22
Nodes (7): GPU Requirements, Inference Qwen Using vLLM, Installation, Usage, vLLM Standalone OpenAI-like API, vLLM + Transformer-like Wrapper, vLLM + Web Demo / OpenAI-like API

### Community 106 - "Inference Qwen Using 🤖 ModelScope and 🤗 Transformers"
Cohesion: 0.25
Nodes (8): Batch Inference, CPU, Inference Qwen Using 🤖 ModelScope and 🤗 Transformers, Installation, 🤖 ModelScope, Multiple GPUs, Requirements, 🤗 Transformers

### Community 107 - "运行步骤"
Cohesion: 0.29
Nodes (6): 下载并启动镜像, 执行推理, 执行权重转换, 昇腾910架构基于mindformers推理Qwen-7B-Chat模型, 环境要求, 运行步骤

### Community 108 - "Deployment"
Cohesion: 0.29
Nodes (7): API, CLI Demo, Deployment, vLLM, vLLM + Transformer-like Wrapper, vLLM + Web Demo / OpenAI-like API, Web UI

### Community 109 - "部署"
Cohesion: 0.29
Nodes (7): API, vLLM, vLLM + 类Transformer接口, vLLM + 网页Demo / 类OpenAI API, Web UI, 交互式Demo, 部署

### Community 110 - "Inicio rápido"
Cohesion: 0.29
Nodes (7): CPU, DashScope, Inferencia por lotes, Inicio rápido, 🤖 ModelScope, Múltiples GPU, 🤗 Transformers

### Community 111 - "Blood playtest report"
Cohesion: 0.25
Nodes (7): Blood playtest report, LMB: Blood Bolt (cd .4, 21 dmg), Passive: Bloodlust (2.5% steal, bleed leech .1, up to +50% dmg at low HP), Q: Exsanguinate (cd 8), R: Blood Moon (ult, 4 s, 7 dmg per .25 s to 12 enemies, death pop 30 AoE), RMB: Crimson Fan (cd 3.5, 5 x 16, pierce 99), Top 3

### Community 112 - "デプロイ"
Cohesion: 0.29
Nodes (7): API, CLI デモ, vLLM, vLLM + Transformer Wrapper, vLLM + Web デモ / OpenAI API, ウェブ UI, デプロイ

### Community 113 - "Soul playtest report"
Cohesion: 0.25
Nodes (7): E: Soulstorm (lines 1900-1909), LMB: Soulfire (`js/elements.js` line 1866), Passive: Soulbound (`js/sim.js` lines 106, 410, 424), Q: Soul Rend (lines 1892-1899), RMB: Reap (lines 1874-1891), Soul playtest report, Top 3

### Community 114 - "Tokenization"
Cohesion: 0.29
Nodes (6): Caveats, Injection attack prevention, Regular tokens, Special tokens, Tokenization, Vocabulary Expansion

### Community 115 - "Water playtest report"
Cohesion: 0.25
Nodes (7): E - Surf (cd 9, 24 dmg per enemy, 14 m dash), LMB - Aqua Bullets (cd .14, 10.5 dmg, kb 4.5), Passive - Tidal Force (st.kb 1.6), Q - Bubble Prison (cd 9, 10 dmg, 3 s bubble, +30% damage taken), R - Tsunami (ultimate, 110 per enemy, 2.6 s), Top 3, Water playtest report

### Community 116 - "react_demo.py"
Cohesion: 0.43
Nodes (6): build_input_text(), call_plugin(), llm_with_plugin(), parse_latest_plugin_call(), test(), text_completion()

### Community 117 - "快速使用"
Cohesion: 0.25
Nodes (8): Batch推理, CPU, 🤖 ModelScope, 🤗 Transformers, x86 平台, 多GPU, 快速使用, 阿里云灵积（DashScope）API服务

### Community 118 - "swift/README.md"
Cohesion: 0.33
Nodes (5): Fine-tuning, Inference, Installation, Introduction, WebUI Usage

### Community 119 - "swift/README_CN.md"
Cohesion: 0.33
Nodes (5): webui使用, 介绍, 安装, 微调, 推理

### Community 120 - "Tokenization"
Cohesion: 0.33
Nodes (5): Tokenization, 普通token, 注意事项, 特殊token, 词表扩展

### Community 122 - "Mage Arena playtest report (all 30 elements)"
Cohesion: 0.29
Nodes (6): Balance (median of 30: crowd 218.1 dps, boss 137.1 dps), Harness caveats, Mage Arena playtest report (all 30 elements), Performance hot list (peak particles in one move; the pool holds 4000), Second theme: effects that blind your own view, Top changes by element

### Community 123 - "finetune_lora_single_gpu.sh"
Cohesion: 0.50
Nodes (4): CUDA_DEVICE_MAX_CONNECTIONS, CUDA_VISIBLE_DEVICES, finetune_lora_single_gpu.sh script, usage()

### Community 124 - "finetune_qlora_single_gpu.sh"
Cohesion: 0.50
Nodes (4): CUDA_DEVICE_MAX_CONNECTIONS, CUDA_VISIBLE_DEVICES, finetune_qlora_single_gpu.sh script, usage()

### Community 125 - "Bone playtest report"
Cohesion: 0.29
Nodes (6): Bone playtest report, LMB: Bone Toss, Performance (measured), Q: Marrow Burst, RMB: Cackling Skull, Top 3

### Community 126 - "Chrono playtest report"
Cohesion: 0.29
Nodes (6): Chrono playtest report, E: Slow Field (cd 13, r 6, 6 s, 70% slow), LMB: Chrono Bolt (cd .45, 16 dmg + 16 echo after 1.2 s), Passive: Time Dilation (cooldowns ×0.82, timeworn slow .35), R: Time Stop (ult, 4 s, damage stored ×1.5), Top 3

### Community 127 - "Démarrage Rapide"
Cohesion: 0.29
Nodes (7): CPU, DashScope, Démarrage Rapide, Inférence par lots, 🤖 ModelScope, Plusieurs GPU, 🤗 Transformers

### Community 130 - "Mage Arena"
Cohesion: 0.40
Nodes (5): Controls, Core loop (Arena), Mage Arena, Why it's replayable, Why it's satisfying

### Community 131 - "hud"
Cohesion: 0.50
Nodes (4): buildBar(), hud(), mateMark(), Partner HUD

### Community 132 - "auto_comments.md"
Cohesion: 0.50
Nodes (3): Auto Comments, 使用方法, 使用样例

### Community 133 - "finetune_ds.sh"
Cohesion: 0.67
Nodes (3): CUDA_DEVICE_MAX_CONNECTIONS, finetune_ds.sh script, usage()

### Community 134 - "finetune_lora_ds.sh"
Cohesion: 0.67
Nodes (3): CUDA_DEVICE_MAX_CONNECTIONS, finetune_lora_ds.sh script, usage()

### Community 135 - "finetune_qlora_ds.sh"
Cohesion: 0.67
Nodes (3): CUDA_DEVICE_MAX_CONNECTIONS, finetune_qlora_ds.sh script, usage()

### Community 137 - "burst"
Cohesion: 0.40
Nodes (5): burst(), RMB: Arcane Barrage (dmg 25 with 0 charges, 387 ms avg = the kit's highest, 418 particles, 14 fx), Q: Rewind (cd 6, 8 mark dmg, snap 35 + 14/m up to +200, +150 vs boss), E: Spirit Wolf, LMB: Chain Lightning (cd 0.36, 6 dmg, chains 2 at 75%)

### Community 138 - "css"
Cohesion: 0.67
Nodes (3): comboText(), css(), tintRig()

### Community 139 - "Fine-tuning Qwen by Ascend NPU"
Cohesion: 0.50
Nodes (3): Environment Requirement, Fine-tuning Qwen by Ascend NPU, Quickstart

### Community 140 - "Quantization"
Cohesion: 0.50
Nodes (3): GPTQ, Quantization, Quantization of KV cache

### Community 141 - "Inference Qwen Using TensorRT-LLM"
Cohesion: 0.50
Nodes (3): Inference Qwen Using TensorRT-LLM, Installation, Quickstart

### Community 142 - "Enemies"
Cohesion: 0.50
Nodes (4): Enemies, Fighting them, Wave budget, Wave modifiers

### Community 143 - "Similar moves (reviewed 2026-10-27)"
Cohesion: 0.50
Nodes (4): Alike within one element, Similar moves (reviewed 2026-10-27), Similar (same role, different twist), Very similar (near-duplicates)

### Community 148 - "emit"
Cohesion: 0.40
Nodes (5): emit(), E: Crimson Mire (cd 9, 4 s pool, 10 dmg per .5 s, pull 22), R: Bone Dragon (ultimate), Passive: Regrowth (1.5 HP/s), RMB - Water Whip (cd 3.5, 22 / 44 tip + .5 s stun)

## Knowledge Gaps
- **7 isolated node(s):** `CUDA_DEVICE_MAX_CONNECTIONS`, `CUDA_DEVICE_MAX_CONNECTIONS`, `CUDA_DEVICE_MAX_CONNECTIONS`, `CUDA_VISIBLE_DEVICES`, `CUDA_DEVICE_MAX_CONNECTIONS` (+2 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1100 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Blender Assets` connect `scarFx` to `Elements.md`, `grab`, `build_elements.py`, `Mesh`?**
  _High betweenness centrality (0.242) - this node is a cross-community bridge._
- **What connects `CUDA_DEVICE_MAX_CONNECTIONS`, `CUDA_DEVICE_MAX_CONNECTIONS`, `CUDA_DEVICE_MAX_CONNECTIONS` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `core.js` be split into smaller, more focused modules?**
  _Cohesion score 0.022982635342185902 - nodes in this community are weakly interconnected._
- **Why does `model` connect `model` to `llm.py`, `argparse`, `.chat`?**
  _High betweenness centrality (0.210) - this node is a cross-community bridge._
- **Should `dungeon.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07486338797814207 - nodes in this community are weakly interconnected._
- **Why does `Mesh` connect `Mesh` to `build_elements.py`, `build_assets.py`, `scarFx`, `Venom playtest report`, `build_hell`, `lib.py`, `TRS`?**
  _High betweenness centrality (0.153) - this node is a cross-community bridge._
- **Should `view.js` be split into smaller, more focused modules?**
  _Cohesion score 0.04392156862745098 - nodes in this community are weakly interconnected._