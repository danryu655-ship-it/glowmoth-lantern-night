// Boot and the one loop. The world advances in fixed 1/60 s steps, the renderer paints what is
// there, and one small state machine moves between title, play, paused, cutscene, dawn, game over
// and victory. ?shot=title|play|dawn|victory|over stages a screenshot frame instead of starting
// the loop; ?seed=N makes a run's patterns repeatable.

import { BEST_KEY, BOSS, CUTSCENE, CUTSCENES, RUN, STEP } from './config.js';
import { autopilotDirection, autopilotFlare } from './autopilot.js';
import { createAudio } from './audio.js';
import { createInput } from './input.js';
import {
  createRenderer, SCREEN_CUTSCENE, SCREEN_DAWN, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_VICTORY,
} from './render.js';
import {
  createWorld, EVENT_DEW, EVENT_HIT, EVENT_LANTERN, EVENT_NIGHT, EVENT_OVER, EVENT_SHIELD, EVENT_SPARK,
} from './world.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const demo = params.has('demo');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : (demo ? 11 : Math.floor(Math.random() * 4294967296));

// ANDROID BUILD ONLY — endless mode: the nights never end. After night 3 the
// run continues (night 4, 5, ...) with the same per-night difficulty scaling
// (faster shades/darts, denser spawns) until the moth loses all lives. The
// competition build in the game repo still ends in victory after 3 nights.
const ENDLESS = true;

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(seed);
const renderer = createRenderer(canvas);
const audio = createAudio();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Private windows keep the best for this visit only.
  }
}

function runShot(name) {
  const best = readBest();
  const scene = stageShot(name, world, best);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best, { cutscene: scene.cutscene });
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else {
      window.__shotScene = name;
      window.__shotReady = true;
    }
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let cutscene = null;
  let best = readBest();
  let accumulator = 0;
  let ambientClock = 0;
  let autoClock = 0;
  let last = performance.now();
  // The demo runs a little faster than real time so one night plays out inside ~30 seconds.
  const timeScale = 1;

  if (params.has('debug') || demo) {
    window.__glowmoth = {
      get screen() { return screen; },
      get state() { return world.state; },
      world,
      demo,
    };
  }

  function announce(message) {
    status.textContent = message;
  }

  function startRun() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    audio.unlock();
    audio.play('start');
    announce(ENDLESS
  ? `Night 1. ${RUN.lives} lives. Collect golden motes to light four lanterns — the nights go on as long as you can fly.`
  : `Night 1 of ${RUN.nightsToWin}. ${RUN.lives} lives. Collect golden motes to light four lanterns.`);
  }

  function finishRun(victory) {
    if (world.state.score > best) {
      best = world.state.score;
      saveBest(best);
    }
    screen = victory ? SCREEN_VICTORY : SCREEN_OVER;
    audio.play(victory ? 'victory' : 'over');
    announce(victory
      ? `Dawn breaks. Final score ${world.state.score}. Best ${best}. Press Enter to fly again.`
      : `The night takes you. Final score ${world.state.score}. Best ${best}. Press Enter to fly again.`);
  }

  function handleActions() {
    if (demo) return; // The autopilot drives; the demo takes no keyboard or pointer input.
    if (input.consume('mute')) {
      const muted = audio.toggleMute();
      announce(muted ? 'Sound off.' : 'Sound on.');
    }
    const confirm = input.consume('confirm');
    const pointer = input.consume('pointer');
    const pause = input.consume('pause');

    if (screen === SCREEN_TITLE) {
      if (confirm || pointer) startRun();
      return;
    }
    if (screen === SCREEN_OVER || screen === SCREEN_VICTORY) {
      if (confirm || pointer) startRun();
      return;
    }
    // ANDROID BUILD ONLY (v1.4.4) — a tap or Enter skips one cutscene beat.
    if (screen === SCREEN_CUTSCENE) {
      if (confirm || pointer) advanceCutscene();
      return;
    }
    if (screen === SCREEN_DAWN) {
      if (confirm || pointer) {
        world.nextNight();
        accumulator = 0;
        // ANDROID BUILD ONLY (v1.4.4) — a boss night opens with its intro
        // cutscene instead of jumping straight into the fight.
        if (ENDLESS && world.state.night % BOSS.every === 0) {
          cutscene = { night: world.state.night, boss: true, beat: 0, beatTime: 0 };
          screen = SCREEN_CUTSCENE;
          audio.play('clear');
          announce(CUTSCENES.boss.beats[0].text);
        } else {
          screen = SCREEN_PLAY;
          audio.play('start');
          announce(ENDLESS ? `Night ${world.state.night}.` : `Night ${world.state.night} of ${RUN.nightsToWin}.`);
        }
      }
      return;
    }
    if (pause) {
      if (screen === SCREEN_PAUSED) {
        screen = SCREEN_PLAY;
        announce('Playing.');
      } else if (screen === SCREEN_PLAY) {
        screen = SCREEN_PAUSED;
        announce('Paused.');
      }
      return;
    }
    if (screen === SCREEN_PAUSED) {
      if (confirm || pointer) {
        screen = SCREEN_PLAY;
        announce('Playing.');
      }
      return;
    }
    if (screen === SCREEN_PLAY) {
      if (input.consume('flare') || pointer) {
        audio.unlock();
        if (world.flare()) audio.play('flare');
      }
    }
  }

  // ANDROID BUILD ONLY (v1.4.4) — the dawn card, shared by the night-clear
  // path and by the cutscene's last beat.
  function enterDawn() {
    screen = SCREEN_DAWN;
    autoClock = 0;
    audio.play('clear');
    const joined = world.state.night === 3 ? ' Lumi bergabung dengan Luma.'
      : world.state.night === 6 ? ' Lulu bergabung dengan Luma.' : '';
    const bossDown = world.state.bossBonus > 0 ? ` Dark Pekat kalah! Bonus bos ${world.state.bossBonus}.` : '';
    announce(ENDLESS && world.state.night >= RUN.nightsToWin
      ? `Three nights lit — you won! The garden glows on. Bonus ${world.state.bonus}.${joined}${bossDown} Press Enter for night ${world.state.night + 1}.`
      : `Night ${world.state.night} survived. Bonus ${world.state.bonus}.${joined}${bossDown} Press Enter for the next night.`);
  }

  // ANDROID BUILD ONLY (v1.4.4) — one cutscene beat forward; after the last
  // beat the dawn card takes over.
  function advanceCutscene() {
    if (!cutscene) return;
    const beats = cutscene.boss ? CUTSCENES.boss.beats : CUTSCENES[cutscene.night].beats;
    cutscene.beat += 1;
    cutscene.beatTime = 0;
    if (cutscene.beat >= beats.length) {
      const wasBoss = cutscene.boss;
      cutscene = null;
      // A boss intro ends in the fight; a dawn cutscene ends in the dawn card.
      if (wasBoss) {
        screen = SCREEN_PLAY;
        audio.play('start');
        announce(ENDLESS ? `Night ${world.state.night}.` : `Night ${world.state.night} of ${RUN.nightsToWin}.`);
      } else {
        enterDawn();
      }
    } else {
      announce(beats[cutscene.beat].text);
    }
  }

  function handleEvents(events) {
    if (events & EVENT_HIT) {
      audio.play('hit');
      announce(world.state.lives === 1 ? 'Hit. One life left.' : `Hit. ${world.state.lives} lives left.`);
    }
    if (events & EVENT_SHIELD) {
      if (world.state.shield) {
        audio.play('shield');
        announce('Lulu memberi perisai.');
      } else {
        audio.play('shieldBreak');
        announce('Perisai pecah!');
      }
    }
    if (events & EVENT_LANTERN) audio.play('lantern');
    if (events & EVENT_DEW) {
      audio.play('dew');
      announce('Dew drop. One life restored.');
    }
    if (events & EVENT_SPARK) audio.play('mote', 4);
    if (events & EVENT_NIGHT) {
      if (!ENDLESS && world.state.night >= RUN.nightsToWin) finishRun(true);
      // ANDROID BUILD ONLY (v1.4.4) — after night 3 (Lumi freed) and night 6
      // (Lulu freed) the dawn cutscene plays before the dawn card.
      else if (ENDLESS && CUTSCENES[world.state.night]) {
        cutscene = { night: world.state.night, beat: 0, beatTime: 0 };
        screen = SCREEN_CUTSCENE;
        autoClock = 0;
        audio.play('clear');
        announce(CUTSCENES[world.state.night].beats[0].text);
      } else {
        enterDawn();
      }
    }
    if (events & EVENT_OVER) finishRun(false);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const delta = Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    ambientClock += delta;
    autoClock += delta;
    handleActions();
    // ANDROID BUILD ONLY (v1.4.4) — cutscene beats advance on their own.
    if (screen === SCREEN_CUTSCENE && cutscene) {
      cutscene.beatTime += delta;
      if (cutscene.beatTime >= CUTSCENE.beatSeconds) advanceCutscene();
    }
    if (demo && screen === SCREEN_TITLE && autoClock > 1.5) {
      autoClock = 0;
      startRun();
    }
    if (screen === SCREEN_TITLE) {
      accumulator += delta * timeScale;
      while (accumulator >= STEP) {
        world.step(STEP, { x: 0, y: 0 }, true);
        accumulator -= STEP;
      }
    } else if (screen === SCREEN_PLAY) {
      accumulator += delta * timeScale;
      while (accumulator >= STEP && screen === SCREEN_PLAY) {
        let direction;
        if (demo) {
          direction = autopilotDirection(world.state);
          if (autopilotFlare(world.state) && world.flare()) audio.play('flare');
        } else {
          direction = input.direction(world.state.player);
        }
        const events = world.step(STEP, direction, false);
        accumulator -= STEP;
        if (events !== 0) handleEvents(events);
        if (screen !== SCREEN_PLAY) accumulator = 0;
      }
    } else {
      accumulator = 0;
    }
    // The demo plays one night, then rests on its dawn card long enough to read.
    if (demo && screen === SCREEN_DAWN && autoClock > 3.2) {
      autoClock = 0;
      if (!ENDLESS && world.state.night >= RUN.nightsToWin) finishRun(true);
      else {
        world.nextNight();
        if (ENDLESS && world.state.night % BOSS.every === 0) {
          cutscene = { night: world.state.night, boss: true, beat: 0, beatTime: 0 };
          screen = SCREEN_CUTSCENE;
          audio.play('clear');
          announce(CUTSCENES.boss.beats[0].text);
        } else {
          screen = SCREEN_PLAY;
          audio.play('start');
          announce(ENDLESS ? `Night ${world.state.night}.` : `Night ${world.state.night} of ${RUN.nightsToWin}.`);
        }
      }
    }
    renderer.draw(world.state, screen, best, { timeOffset: screen === SCREEN_CUTSCENE || screen === SCREEN_DAWN || screen === SCREEN_OVER || screen === SCREEN_VICTORY ? ambientClock : 0, demo, cutscene });
    input.endFrame();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  window.addEventListener('keydown', () => audio.unlock(), { once: true });
  canvas.addEventListener('mousedown', () => audio.unlock(), { once: true });

  announce('Glowmoth: Lantern Night. Press Enter or click to fly.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
