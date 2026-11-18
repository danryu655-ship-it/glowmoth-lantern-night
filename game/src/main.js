// Boot and the one loop. The world advances in fixed 1/60 s steps, the renderer paints what is
// there, and one small state machine moves between title, play, paused, cutscene, dawn, game over
// and victory. ?shot=title|skills|play|dawn|victory|over stages a screenshot frame instead of starting
// the loop; ?seed=N makes a run's patterns repeatable.

import { BADGES_KEY, BEST_KEY, BOSS, CUTSCENE, CUTSCENES, EPILOGUE_KEY, PROLOGUE_KEY, RUN, STEP, STRINGS, SKILL_BUTTON, BACK_BUTTON } from './config.js';
import { autopilotDirection, autopilotFlare } from './autopilot.js';
import { createAudio } from './audio.js';
import { createInput } from './input.js';
import {
  createRenderer, SCREEN_CUTSCENE, SCREEN_DAWN, SCREEN_EPILOGUE, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_PROLOGUE, SCREEN_SKILLS, SCREEN_TITLE, SCREEN_VICTORY,
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

// ANDROID BUILD ONLY (v1.5.0) — earned badges for the Skill screen.
function readBadges() {
  try {
    return JSON.parse(window.localStorage.getItem(BADGES_KEY) ?? '{}') || {};
  } catch {
    return {};
  }
}

function runShot(name) {
  const best = readBest();
  const scene = stageShot(name, world, best);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best, { cutscene: scene.cutscene, prologuePage: scene.prologuePage, epiloguePage: scene.epiloguePage, badges: readBadges() });
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
  let prologuePage = 0;
  let epiloguePage = 0;
  let best = readBest();
  let badges = readBadges();
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

  // ANDROID BUILD ONLY (v1.4.5) — one-time story flags in localStorage.
  function storySeen(key) {
    try {
      return window.localStorage.getItem(key) === '1';
    } catch {
      return false;
    }
  }

  function markStorySeen(key) {
    try {
      window.localStorage.setItem(key, '1');
    } catch {
      // Private windows keep the flag for this visit only.
    }
  }

  // ANDROID BUILD ONLY (v1.5.0) — a badge is earned once and kept.
  function awardBadge(name) {
    if (badges[name]) return;
    badges = { ...badges, [name]: true };
    try {
      window.localStorage.setItem(BADGES_KEY, JSON.stringify(badges));
    } catch {
      // Private windows keep the badge for this visit only.
    }
  }

  function startPlay() {
    screen = SCREEN_PLAY;
    audio.play('start');
    announce(ENDLESS
  ? `Night 1. ${RUN.lives} lives. Collect golden motes to light four lanterns — the nights go on as long as you can fly.`
  : `Night 1 of ${RUN.nightsToWin}. ${RUN.lives} lives. Collect golden motes to light four lanterns.`);
  }

  function startRun() {
    world.reset();
    accumulator = 0;
    audio.unlock();
    // ANDROID BUILD ONLY (v1.4.5) — the prologue plays once, before the
    // first run. The demo skips it.
    if (!demo && !storySeen(PROLOGUE_KEY)) {
      prologuePage = 0;
      screen = SCREEN_PROLOGUE;
      audio.play('start');
      announce('Padang rumput Luminaria. Tekan Enter untuk memulai.');
    } else {
      startPlay();
    }
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
      // ANDROID BUILD ONLY (v1.5.0) — a tap on the SKILL button (or K)
      // opens the guide; a tap anywhere else starts the run.
      const pos = input.pointerPos();
      const onSkillButton = pos.x >= SKILL_BUTTON.x && pos.x <= SKILL_BUTTON.x + SKILL_BUTTON.w
        && pos.y >= SKILL_BUTTON.y && pos.y <= SKILL_BUTTON.y + SKILL_BUTTON.h;
      if (input.consume('skills') || (pointer && onSkillButton)) {
        screen = SCREEN_SKILLS;
        announce('Skill & Badge. Tekan Enter untuk kembali.');
        return;
      }
      if (confirm || pointer) startRun();
      return;
    }
    // ANDROID BUILD ONLY (v1.5.0) — the guide is display only: Enter, Esc
    // or a tap on KEMBALI returns to the title.
    if (screen === SCREEN_SKILLS) {
      const pos = input.pointerPos();
      const onBackButton = pos.x >= BACK_BUTTON.x && pos.x <= BACK_BUTTON.x + BACK_BUTTON.w
        && pos.y >= BACK_BUTTON.y && pos.y <= BACK_BUTTON.y + BACK_BUTTON.h;
      if (confirm || pause || (pointer && onBackButton)) {
        screen = SCREEN_TITLE;
        announce('Glowmoth: Lantern Night. Press Enter or click to fly.');
      }
      return;
    }
    // ANDROID BUILD ONLY (v1.4.5) — the prologue leads into night 1; the
    // epilogue leads into the dawn card.
    if (screen === SCREEN_PROLOGUE) {
      if (confirm || pointer) {
        if (prologuePage < STRINGS.prologue.length - 1) {
          prologuePage += 1;
        } else {
          markStorySeen(PROLOGUE_KEY);
          startPlay();
        }
      }
      return;
    }
    if (screen === SCREEN_EPILOGUE) {
      if (confirm || pointer) {
        if (epiloguePage < 1) {
          epiloguePage += 1;
        } else {
          enterDawn();
        }
      }
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
    // ANDROID BUILD ONLY (v1.5.0) — the night just cleared earns its badge
    // for the Skill screen: Lumi at night 3, Lulu at night 6, Dark Pekat
    // when the boss falls.
    if (world.state.night === 3) awardBadge('lumi');
    if (world.state.night === 6) awardBadge('lulu');
    if (world.state.bossBonus > 0) awardBadge('pekat');
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
      // ANDROID BUILD ONLY (v1.4.5) — the first boss defeat ends in the
      // epilogue, once, before the dawn card.
      } else if (world.state.bossBonus > 0 && !storySeen(EPILOGUE_KEY)) {
        markStorySeen(EPILOGUE_KEY);
        epiloguePage = 0;
        screen = SCREEN_EPILOGUE;
        autoClock = 0;
        audio.play('clear');
        announce('Fajar kemenangan. Dark Pekat kalah!');
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
    // The demo rests on the epilogue, then moves to the dawn card.
    if (demo && screen === SCREEN_EPILOGUE && autoClock > 3.2) {
      autoClock = 0;
      enterDawn();
    }
    renderer.draw(world.state, screen, best, { timeOffset: screen === SCREEN_CUTSCENE || screen === SCREEN_DAWN || screen === SCREEN_EPILOGUE || screen === SCREEN_OVER || screen === SCREEN_PROLOGUE || screen === SCREEN_VICTORY ? ambientClock : 0, demo, cutscene, prologuePage, epiloguePage, badges });
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
