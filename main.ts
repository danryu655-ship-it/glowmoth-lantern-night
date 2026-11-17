// Glowmoth: Lantern Night — a best-game-01 entry for make.fun (Node 22, standard library only).
//
// The game itself is game/: one index.html and its ES modules, plain static files a desktop
// browser loads offline. This program only hands the entry in: it copies game/ and screenshots/
// from beside this file to the output directory and writes dossier.json, the summary the judge
// reads, with buildDossier from the vendored make.fun library. It writes the same bytes on every
// run, because the grader runs it twice and compares the two outputs.
//
// Play it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const gameDir = join(here, 'game');
const shotsDir = join(here, 'screenshots');

if (!existsSync(join(gameDir, 'index.html'))) {
  throw new Error('game/index.html is missing: the entry has no playable page to hand in');
}
const indexBytes = statSync(join(gameDir, 'index.html')).size;
if (indexBytes > 1_048_576) {
  throw new Error(`game/index.html is ${indexBytes} bytes, over the 1 MiB gate limit`);
}
if (!existsSync(shotsDir)) {
  throw new Error('screenshots/ is missing: the judge needs 3 or 4 real renders of the game');
}

mkdirSync(out, { recursive: true });

// Clear the two copied trees first. The grader gives a fresh /output, but a local out/ may hold
// files from an earlier build; removing them keeps the two runs byte-for-byte identical.
for (const name of ['game', 'screenshots']) {
  rmSync(join(out, name), { recursive: true, force: true });
}
cpSync(gameDir, join(out, 'game'), { recursive: true });
cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the dossier's bytes;
// the others refuse an entry the scorer would refuse (more than 4 screenshots or one over
// 256 KiB; more than 993 files in game/ or 48 MiB of game files in all, or a path under game/
// over 1000 bytes, because game/ shares /output's 1000-entry cap with screenshots/ and
// dossier.json).
const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(out, 'dossier.json'), dossier);

const sourceCount = JSON.parse(dossier).game?.source_files ?? 0;
console.log(`handed in game/ (${indexBytes} bytes of index.html, ${sourceCount} source files) and ${out}/dossier.json`);
