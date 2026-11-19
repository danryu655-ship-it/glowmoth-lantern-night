Glowmoth: Lantern Night — Submission Record
Game: Glowmoth: Lantern Night (arcade lantern-collecting, night theme, fireflies + lanterns; 3 nights, 4 lanterns, 3 lives, flare + combo)
Competition: make.fun best-game-01
Account: plucky-tapir-54
Submission ID: 01a1e7f7-a2fc-7152-a2b8-d9ac28390ed5
Submitted: 17 Nov 2026 ~12:46 WIB
Leaderboard: rank 3,249 of 10,946; judges 7 wins / 5 losses of 12; provisional (range 495-8,604); prizes top 10 only
Competition closes: 19 Nov 2026 01:00 WIB; final result due 3 Dec 2026
Round 3 polish (18 Nov 2026): Miku visual polish applied (Mystical Night palette, minimal HUD, glow / particle / flare effects), commit b33f76e; tests passed; screenshots regenerated
Round 3 resubmission: NOT submitted — blocked, submit needs a wallet keypair and no keypair file exists on machine-1; last submission before 18 Nov 2026 18:00 UTC is final
Demo video: demo-gameplay.mp4 (30 seconds, autoplay, included in repo)
Design specs: miku-glowmoth-polish.md and aneko-catur-v2-analisis.md live in GitHub repo danryu655-ship-it/agents-workspace

## Story

Canon story: docs/kronik-luminaria.md ("Kronik Luminaria", written by the user 18 Nov 2026) — the Four Ancient Lanterns, Dark Pekat's tragedy, night-by-night chronicles 1-10, 5-beat cutscenes (nights 3, 6, boss 10), redemption epilogue. 15 story moments in-game.

## Android versions (repo danryu655-ship-it/glowmoth-android, package com.danryu.glowmoth)

- v1.4.4 (versionCode 10, 18 Nov ~13:52): dawn cutscenes nights 3 + 6 + boss intro, 3 beats each
- v1.4.5 (versionCode 11, 18 Nov ~14:13): Kronik Luminaria story — 2-page prologue, dawn texts nights 1-9, 5-beat cutscenes, 2-page epilogue; story screens use a dark panel; APK 11,049,954 bytes, sha256 41d24f9c…
- v1.4.6 (versionCode 12, 18 Nov ~14:20): dawn story wrap fix (long Kronik lines ran off the screen edges); night-9 story line now shows on the boss-warning dawn screen; APK 11,050,258 bytes, sha256 a0a26e7b…
- v1.5.0 (versionCode 13, 18 Nov ~16:25): Skill & Badge screen — display-only guide to the 4 skills (Flare Burst, Mote Magnet, Lulu's Shield, Dewdrop Vitality) with the user's own SVG icons, plus 3 earnable badges (Lumi night 3, Lulu night 6, Dark Pekat night 10, kept in localStorage); SKILL button on the title screen (tap, or K on PC); APK 11,063,745 bytes, sha256 583351d6…
- v1.6.0 "Cahaya Baru" (versionCode 14, 18 Nov ~17:33): the user's new asset pack — parallax layers 1+2 drift in-game (title keeps the GLOWMOTH LEGENDS artwork), obsidian arena on boss nights, Shadow Spider Queen boss on nights 20/40/60 (Dark Pekat 10/30/50), Void Scorpion hazard from night 4 (lunge; Flare only stuns), Koko joins night 9 (scorches a shade every 8 s) + Zephyr joins night 12 (hazards 25% slower), skin picker on the title (Luma / Golden Sun / Cyber Neon, persisted), cutscene illustrations as full-screen opening cards (nights 3/6 + ending), Skill screen 2 columns x 3 rows + 4th badge (Ratu, night 20), dawn story +3 lines (nights 10/11/12), epilogue only on a Dark Pekat defeat; visual fixes: dark pill behind the top-centre HUD (moon), endless nights show just "NIGHT n", card hint on a dark chip; APK 11,117,564 bytes, sha256 aa63f7c8…, release https://github.com/danryu655-ship-it/glowmoth-lantern-night/releases/download/v1.6.0/glowmoth-android-v1.6.0.apk
- v1.6.1 (versionCode 15, 18 Nov ~17:43): visual fix on v1.6.0 — card hint chip moved from inside the dialogue box (it covered the second dialogue line at y 663) to a docked bar in the strip below the box (y 698-720); Void Scorpion draws a vector body while its SVG is still loading (cold-cache loads showed an empty disc); APK 11,094,136 bytes, sha256 fb2ac2da…, release https://github.com/danryu655-ship-it/glowmoth-lantern-night/releases/download/v1.6.1/glowmoth-android-v1.6.1.apk
- v1.6.2 (versionCode 16, 19 Nov ~15:19): stronger idle motion + shadowed portrait circles, per user decision ("Perkuat gerakannya, lingkaran tetap" + "Lingkarannya dibuat agak shadow seperti yang lain") — boss: bob 8 -> 18px, sway 0.05 -> 0.12 rad, aura 0.55+-0.25, scale breathe 1+-0.04; scorpion: bob 5 -> 10px, lean 0.08 -> 0.15 rad, lunge stretch 1.18/0.82 -> 1.3/0.7, fallback tail wags; circles kept as portrait frames, a dark band now hugs the ring's outer edge as a drop shadow (drawn after the portrait — the earlier disc drawn before it was invisible under the glow); shot mode gains ?t=N to compare frozen frames at different times (shot pages paint only twice by design, so time-comparison screenshots can never show motion); motion + shadow verified visually on GitHub Pages (queen ~40px between poses, scorpion ~28px + lean; shadow clear on scorpion, subtle on queen against the dark sky); hitboxes and behaviour unchanged; APK 11,094,944 bytes, sha256 29995837…, release https://github.com/danryu655-ship-it/glowmoth-lantern-night/releases/download/v1.6.2/glowmoth-android-v1.6.2.apk
- All three install over each other (same signing certificate 2eb6e7ca…)

## Planned next

- Quest system (user decision pending): quest board — rescued characters playable after completing their quest (Lumi magnet from night 1, Lulu shield from night 1)
- Deferred from the Kronik: mid-night dialogues (nights 5 + 9), boss phase 2 Enrage below 50%
