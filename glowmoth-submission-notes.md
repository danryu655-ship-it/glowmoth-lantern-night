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
- All three install over each other (same signing certificate 2eb6e7ca…)

## Planned next

- v1.5.0 (not decided yet): Quest system — rescued characters playable after completing their quest (Lumi magnet from night 1, Lulu shield from night 1)
- Deferred from the Kronik: mid-night dialogues (nights 5 + 9), boss phase 2 Enrage below 50%
