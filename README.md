# Glowmoth: Lantern Night

[![best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/c/best-game-01)
[![rank](https://make.fun/badge/best-game-01/danryu655-ship-it/glowmoth-lantern-night/rank.svg)](https://make.fun/c/best-game-01)
[![reward](https://make.fun/badge/best-game-01/danryu655-ship-it/glowmoth-lantern-night/reward.svg)](https://make.fun/c/best-game-01)

An original arcade game for make.fun's **best-game-01**: guide a glowmoth through three
nights of a lantern-lit garden, gathering golden motes while shadow shades and darting
sparks try to snuff your light.

Everything here is drawn procedurally on a 2D canvas and every sound is synthesised with
the Web Audio API. The game makes no network requests and loads no external assets: one
HTML file and its ES modules are all a desktop browser needs.

## How to play

- **Arrows / WASD** or **move the mouse** — fly the moth.
- **Space** or **click** — burn a spark and flare, pushing shades back and shattering darts.
- **P** — pause. **M** — mute. **R** — restart after a night ends.
- Fill all four lanterns on a night to see the dawn. Three nights and you win.
- Dew drops repair one heart. Golden motes chain into a combo multiplier, up to ×5.

## Run it locally

No build step and no dependencies beyond Node 22:

```sh
node serve.ts
# open http://localhost:8080
```

Screenshot scenes are addressable while you work on the art:
`?shot=title|play|victory|over`, plus `?seed=N` and `?debug=1` (which exposes
`window.__glowmoth` for play-testing).

## Hand it in

`main.ts` copies `game/` and `screenshots/` into the output directory and writes the
make.fun dossier. The grader runs it twice and compares the outputs.

```sh
mkdir -p out
MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Layout

```text
game/index.html        page shell and canvas
game/src/config.js     tuning constants
game/src/world.js      rules, nights, scoring, collisions
game/src/entities.js   moth, motes, shades, darts, dew
game/src/render.js     procedural art and every screen
game/src/audio.js      Web Audio synthesis
game/src/main.js       fixed-step loop and screen state machine
game/src/shots.js      deterministic screenshot staging
screenshots/           four 1280×720 renders used by the judge
main.ts                hand-in: copies the game and writes dossier.json
serve.ts               local static server
```

## License

MIT. Artwork, sound and code were written for this entry; the vendored
`vendor/makefun-game.ts` is the unmodified make.fun library.
