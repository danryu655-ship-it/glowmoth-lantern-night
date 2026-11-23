// Boot and the one loop. The world advances in fixed 1/60 s steps, the renderer paints what is
// there, and one small state machine moves between title, play, paused, cutscene, dawn, game over
// and victory. ?shot=title|skills|modeselect|play|dawn|victory|over stages a screenshot frame instead of starting
// the loop; ?seed=N makes a run's patterns repeatable.

import { BADGES_KEY, BEST_KEY, BOSS, BOSS_KINDS, CHARACTER_CARDS, CUTSCENE, CUTSCENES, EPILOGUE_KEY, FIELD, HUD_BUTTONS, LANTERN, MODE_CARDS, PAUSE_BUTTONS, PROLOGUE_KEY, RUN, SELECT_KEY, STEP, STRINGS, SKILL_BUTTON, SKILL_TIPS, SKIN_BUTTON, SKIN_CARDS, SKIN_KEY, BACK_BUTTON, START_BUTTON, TIPS, bossKind } from './config.js';
import { autopilotDirection, autopilotFlare } from './autopilot.js';
import { createAudio } from './audio.js';
import { createInput } from './input.js';
import {
  createRenderer, SCREEN_CHARACTER, SCREEN_CUTSCENE, SCREEN_DAWN, SCREEN_EPILOGUE, SCREEN_MODE, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_PROLOGUE, SCREEN_SKILLS, SCREEN_SKINS, SCREEN_TITLE, SCREEN_VICTORY,
} from './render.js';
import {
  createWorld, EVENT_DEW, EVENT_HIT, EVENT_LANTERN, EVENT_NIGHT, EVENT_OVER, EVENT_SHIELD, EVENT_SPARK,
} from './world.js';
import { createTips } from './tips.js';
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

// ANDROID BUILD ONLY (v1.6.0) — the moth's skin, picked on the title screen.
function readSkin() {
  try {
    const saved = window.localStorage.getItem(SKIN_KEY);
    return saved === 'golden' || saved === 'cyber' ? saved : 'luma';
  } catch {
    return 'luma';
  }
}

function saveSkin(value) {
  try {
    window.localStorage.setItem(SKIN_KEY, value);
  } catch {
    // Private windows keep the skin for this visit only.
  }
}

// ANDROID BUILD ONLY (v1.9.0) — the last mode + character pick, remembered
// like the skin so the player does not re-pick every run.
function readSelection() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(SELECT_KEY) ?? '{}') || {};
    const mode = saved.mode === 'endless' ? 'endless' : 'quest';
    const character = ['luma', 'lumi', 'lulu', 'koko', 'zephyr'].includes(saved.character) ? saved.character : 'luma';
    return { mode, character };
  } catch {
    return { mode: 'quest', character: 'luma' };
  }
}

function saveSelection(value) {
  try {
    window.localStorage.setItem(SELECT_KEY, JSON.stringify(value));
  } catch {
    // Private windows keep the pick for this visit only.
  }
}

function runShot(name) {
  const best = readBest();
  const scene = stageShot(name, world, best);
  // ANDROID BUILD ONLY (v1.6.2) — the shot paints only 2 frames and stops,
  // so motion can never be seen by comparing screenshots over time. ?t=N
  // shifts the frozen frame's clock instead: two URLs (t=0 vs t=2.2) show
  // two different poses of the same scene.
  const tParam = Number.parseFloat(params.get('t') ?? '');
  if (Number.isFinite(tParam)) world.state.time = 12.4 + tParam;
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best, { cutscene: scene.cutscene, prologuePage: scene.prologuePage, epiloguePage: scene.epiloguePage, epilogueCard: scene.epilogueCard ?? false, badges: readBadges(), skin: scene.skin ?? readSkin(), selection: scene.selection ?? null, tip: scene.tip ?? null, tipAlpha: 1, tipTarget: scene.tipTarget ?? null });
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
  // ANDROID BUILD ONLY (v1.8.0) — in-game tips, in-memory only: they show
  // once per page load (one open game) and never again on replay while
  // the game stays open.
  const tips = createTips(TIPS);
  let epiloguePage = 0;
  let epilogueCard = false;
  let skin = readSkin();
  let selection = readSelection();
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
    // ANDROID BUILD ONLY (v1.8.0) — the first tip: how to collect light.
    // Shown on the first run after the game is opened; the in-memory
    // flag in tips.js keeps it from ever repeating while the game stays open.
    // ANDROID BUILD ONLY (v1.9.7) — the hero's skill tip queues right
    // after it: what the skill does and what the player does.
    if (!demo && world.state.night === 1) {
      tips.show('collect', ambientClock);
      tips.show('skill', ambientClock, SKILL_TIPS[selection.character]);
    }
  }

  function startRun() {
    world.reset();
    // ANDROID BUILD ONLY (v1.9.0) — the selection drives the run: the
    // chosen moth's passive is live from night 1, and Endless records
    // its mode so the story beats are skipped.
    world.applyCharacter(selection.character);
    world.state.mode = selection.mode;
    accumulator = 0;
    audio.unlock();
    // ANDROID BUILD ONLY (v1.4.5) — the prologue plays once, before the
    // first run. The demo skips it. v1.9.0: Endless skips the prologue too —
    // it jumps straight into the night.
    if (!demo && selection.mode === 'quest' && !storySeen(PROLOGUE_KEY)) {
      prologuePage = 0;
      screen = SCREEN_PROLOGUE;
      audio.play('start');
      announce('Padang rumput Luminaria. Tekan Enter untuk memulai.');
    } else {
      enterPlay();
    }
  }

  // ANDROID BUILD ONLY (v1.8.0) — the in-game tips replaced the old
  // full-screen tutorial: the first run starts at once, and the tips
  // appear while playing, at the moment each one matters.
  function enterPlay() {
    startPlay();
  }

  // ANDROID BUILD ONLY (v1.9.7) — where the tip's pointer should point:
  // the nearest mote / shade, the next unlit lantern, the dew drop, or
  // the HUD clusters (sparks, lives). Null when there is nothing to
  // point at — the tip still shows as text.
  function tipTargetPoint(target) {
    const state = world.state;
    const nearest = (items) => {
      let best = null;
      let bestDist = Infinity;
      for (const item of items) {
        const d = Math.hypot(item.x - state.player.x, item.y - state.player.y);
        if (d < bestDist) { bestDist = d; best = item; }
      }
      return best;
    };
    if (target === 'mote') {
      const mote = nearest(state.motes);
      return mote ? { x: mote.x, y: mote.y } : null;
    }
    if (target === 'shade') {
      const shade = nearest(state.hazards.filter((h) => h.kind === 'shade'));
      return shade ? { x: shade.x, y: shade.y } : null;
    }
    if (target === 'lantern') {
      const pos = LANTERN.positions[state.litCount];
      return pos ? { x: pos.x, y: pos.y } : null;
    }
    if (target === 'dew') return state.dew ? { x: state.dew.x, y: state.dew.y } : null;
    if (target === 'sparks') return { x: FIELD.width - 72, y: 50 };
    if (target === 'lives') {
      const max = state.maxLives ?? RUN.lives;
      return { x: FIELD.width - 196 - (max - 3) * 34 + (max - 1) * 17, y: 50 };
    }
    return null;
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
      // ANDROID BUILD ONLY (v1.6.0) — a tap on the SKIN button opens the
      // skin picker; the title background itself is unchanged.
      const onSkinButton = pos.x >= SKIN_BUTTON.x && pos.x <= SKIN_BUTTON.x + SKIN_BUTTON.w
        && pos.y >= SKIN_BUTTON.y && pos.y <= SKIN_BUTTON.y + SKIN_BUTTON.h;
      if (input.consume('skills') || (pointer && onSkillButton)) {
        screen = SCREEN_SKILLS;
        announce('Skill & Badge. Tekan Enter untuk kembali.');
        return;
      }
      if (pointer && onSkinButton) {
        screen = SCREEN_SKINS;
        announce('Pilih Skin. Ketuk kartu untuk memilih, Enter untuk kembali.');
        return;
      }
      // ANDROID BUILD ONLY (v1.9.0) — a tap or Enter on the title opens
      // the mode picker instead of starting the run at once.
      if (confirm || pointer) {
        screen = SCREEN_MODE;
        announce('Pilih mode dulu — Quest atau Tanpa Akhir.');
      }
      return;
    }
    // ANDROID BUILD ONLY (v1.6.0) — the skin picker: tap a card to choose
    // it (saved at once); Enter, Esc or KEMBALI returns to the title.
    if (screen === SCREEN_SKINS) {
      const pos = input.pointerPos();
      if (pointer) {
        for (const card of SKIN_CARDS) {
          if (pos.x >= card.x && pos.x <= card.x + card.w && pos.y >= card.y && pos.y <= card.y + card.h) {
            skin = card.id;
            saveSkin(skin);
            announce(`Skin ${skin === 'luma' ? 'Luma' : skin === 'golden' ? 'Golden Sun' : 'Cyber Neon'} dipilih.`);
            break;
          }
        }
        const onBackButton = pos.x >= BACK_BUTTON.x && pos.x <= BACK_BUTTON.x + BACK_BUTTON.w
          && pos.y >= BACK_BUTTON.y && pos.y <= BACK_BUTTON.y + BACK_BUTTON.h;
        if (onBackButton) {
          screen = SCREEN_TITLE;
          announce('Glowmoth: Lantern Night. Press Enter or click to fly.');
        }
      }
      if (confirm || pause) {
        screen = SCREEN_TITLE;
        announce('Glowmoth: Lantern Night. Press Enter or click to fly.');
      }
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
    // ANDROID BUILD ONLY (v1.9.0 round 2) — mode picker: a tap on a
    // card acts at once — QUEST starts the run as Luma, TANPA AKHIR opens
    // the character picker. Enter uses the remembered mode; Esc returns
    // to the title. (v1.9.6: the v1.9.5 Quest picker was reverted — the
    // mission is Luma rescuing Lumi and Lulu.)
    if (screen === SCREEN_MODE) {
      const pos = input.pointerPos();
      if (pointer) {
        for (const card of MODE_CARDS) {
          if (pos.x >= card.x && pos.x <= card.x + card.w && pos.y >= card.y && pos.y <= card.y + card.h) {
            if (card.id === 'quest') {
              selection = { mode: 'quest', character: 'luma' };
              saveSelection(selection);
              startRun();
            } else {
              selection = { ...selection, mode: 'endless' };
              saveSelection(selection);
              screen = SCREEN_CHARACTER;
              announce('Pilih karakter untuk mode Tanpa Akhir. Enter untuk mulai main.');
            }
            return;
          }
        }
        const onBackButton = pos.x >= BACK_BUTTON.x && pos.x <= BACK_BUTTON.x + BACK_BUTTON.w
          && pos.y >= BACK_BUTTON.y && pos.y <= BACK_BUTTON.y + BACK_BUTTON.h;
        if (onBackButton) {
          screen = SCREEN_TITLE;
          announce('Glowmoth: Lantern Night. Press Enter or click to fly.');
          return;
        }
      }
      if (confirm) {
        if (selection.mode === 'endless') {
          screen = SCREEN_CHARACTER;
          announce('Pilih karakter untuk mode Tanpa Akhir. Enter untuk mulai main.');
        } else {
          selection = { mode: 'quest', character: 'luma' };
          saveSelection(selection);
          startRun();
        }
        return;
      }
      if (pause) {
        screen = SCREEN_TITLE;
        announce('Glowmoth: Lantern Night. Press Enter or click to fly.');
      }
      return;
    }
    // ANDROID BUILD ONLY (v1.9.0 round 2) — Endless character picker: tap
    // a card to choose it (saved at once); MULAI MAIN or Enter starts the
    // run, KEMBALI or Esc returns to the mode picker.
    if (screen === SCREEN_CHARACTER) {
      const pos = input.pointerPos();
      if (pointer) {
        let picked = false;
        for (const card of CHARACTER_CARDS) {
          if (pos.x >= card.x && pos.x <= card.x + card.w && pos.y >= card.y && pos.y <= card.y + card.h) {
            selection = { ...selection, character: card.id };
            saveSelection(selection);
            announce(`Karakter ${card.id} dipilih.`);
            picked = true;
            break;
          }
        }
        if (!picked) {
          const onStartButton = pos.x >= START_BUTTON.x && pos.x <= START_BUTTON.x + START_BUTTON.w
            && pos.y >= START_BUTTON.y && pos.y <= START_BUTTON.y + START_BUTTON.h;
          if (onStartButton) {
            startRun();
            return;
          }
          const onBackButton = pos.x >= BACK_BUTTON.x && pos.x <= BACK_BUTTON.x + BACK_BUTTON.w
            && pos.y >= BACK_BUTTON.y && pos.y <= BACK_BUTTON.y + BACK_BUTTON.h;
          if (onBackButton) {
            screen = SCREEN_MODE;
            announce('Pilih mode dulu — Quest atau Tanpa Akhir.');
            return;
          }
        }
      }
      if (confirm) {
        startRun();
        return;
      }
      if (pause) {
        screen = SCREEN_MODE;
        announce('Pilih mode dulu — Quest atau Tanpa Akhir.');
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
          enterPlay();
        }
      }
      return;
    }
    if (screen === SCREEN_EPILOGUE) {
      if (confirm || pointer) {
        // ANDROID BUILD ONLY (v1.6.0) — the ending illustration comes first.
        if (epilogueCard) {
          epilogueCard = false;
        } else if (epiloguePage < 1) {
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
        // cutscene instead of jumping straight into the fight. v1.6.0: only
        // Dark Pekat gets the intro — the Spider Queen has no dialogue.
        if (ENDLESS && selection.mode === 'quest' && world.state.night % BOSS.every === 0 && bossKind(world.state.night) === 'pekat') {
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
    // ANDROID BUILD ONLY (v1.9.1) — the pause screen's buttons:
    // LANJUTKAN resumes, ULANGI restarts the run, MENU UTAMA goes to the
    // title. A tap anywhere else still resumes, as before.
    if (screen === SCREEN_PAUSED) {
      const pos = input.pointerPos();
      if (pointer) {
        const onResumeButton = pos.x >= PAUSE_BUTTONS.resume.x && pos.x <= PAUSE_BUTTONS.resume.x + PAUSE_BUTTONS.resume.w
          && pos.y >= PAUSE_BUTTONS.resume.y && pos.y <= PAUSE_BUTTONS.resume.y + PAUSE_BUTTONS.resume.h;
        if (onResumeButton) {
          screen = SCREEN_PLAY;
          announce('Playing.');
          return;
        }
        const onRestartButton = pos.x >= PAUSE_BUTTONS.restart.x && pos.x <= PAUSE_BUTTONS.restart.x + PAUSE_BUTTONS.restart.w
          && pos.y >= PAUSE_BUTTONS.restart.y && pos.y <= PAUSE_BUTTONS.restart.y + PAUSE_BUTTONS.restart.h;
        if (onRestartButton) {
          startRun();
          return;
        }
        const onMenuButton = pos.x >= PAUSE_BUTTONS.menu.x && pos.x <= PAUSE_BUTTONS.menu.x + PAUSE_BUTTONS.menu.w
          && pos.y >= PAUSE_BUTTONS.menu.y && pos.y <= PAUSE_BUTTONS.menu.y + PAUSE_BUTTONS.menu.h;
        if (onMenuButton) {
          screen = SCREEN_TITLE;
          announce('Glowmoth: Lantern Night. Press Enter or click to fly.');
          return;
        }
      }
      if (confirm || pointer) {
        screen = SCREEN_PLAY;
        announce('Playing.');
      }
      return;
    }
    if (screen === SCREEN_PLAY) {
      // ANDROID BUILD ONLY (v1.9.1) — the HUD buttons, checked BEFORE the
      // flare: a tap on JEDA / ULANG / MENU must never fire a Flare.
      if (pointer) {
        const pos = input.pointerPos();
        const onPauseButton = pos.x >= HUD_BUTTONS.pause.x && pos.x <= HUD_BUTTONS.pause.x + HUD_BUTTONS.pause.w
          && pos.y >= HUD_BUTTONS.pause.y && pos.y <= HUD_BUTTONS.pause.y + HUD_BUTTONS.pause.h;
        if (onPauseButton) {
          screen = SCREEN_PAUSED;
          announce('Paused.');
          return;
        }
        const onRestartButton = pos.x >= HUD_BUTTONS.restart.x && pos.x <= HUD_BUTTONS.restart.x + HUD_BUTTONS.restart.w
          && pos.y >= HUD_BUTTONS.restart.y && pos.y <= HUD_BUTTONS.restart.y + HUD_BUTTONS.restart.h;
        if (onRestartButton) {
          startRun();
          return;
        }
        const onMenuButton = pos.x >= HUD_BUTTONS.menu.x && pos.x <= HUD_BUTTONS.menu.x + HUD_BUTTONS.menu.w
          && pos.y >= HUD_BUTTONS.menu.y && pos.y <= HUD_BUTTONS.menu.y + HUD_BUTTONS.menu.h;
        if (onMenuButton) {
          screen = SCREEN_TITLE;
          announce('Glowmoth: Lantern Night. Press Enter or click to fly.');
          return;
        }
      }
      if (input.consume('flare') || pointer) {
        audio.unlock();
        if (world.flare()) {
          audio.play('flare');
          // ANDROID BUILD ONLY (v1.8.0) — tip the first time Flare is used.
          tips.show('spark', ambientClock);
        }
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
    if (world.state.bossBonus > 0) awardBadge(world.state.lastBossKind === 'ratu' ? 'ratu' : 'pekat');
    const joined = world.state.night === 3 && selection.character !== 'lumi' ? ' Lumi bergabung dengan Luma.'
      : world.state.night === 6 && selection.character !== 'lulu' ? ' Lulu bergabung dengan Luma.'
      : world.state.night === 9 && selection.character !== 'koko' ? ' Koko bergabung dengan Luma.'
      : world.state.night === 12 && selection.character !== 'zephyr' ? ' Zephyr bergabung dengan Luma.' : '';
    const bossDown = world.state.bossBonus > 0 ? ` ${BOSS_KINDS[world.state.lastBossKind ?? 'pekat'].name} kalah! Bonus bos ${world.state.bossBonus}.` : '';
    announce(ENDLESS && world.state.night >= RUN.nightsToWin
      ? `Three nights lit — you won! The garden glows on. Bonus ${world.state.bonus}.${joined}${bossDown} Press Enter for night ${world.state.night + 1}.`
      : `Night ${world.state.night} survived. Bonus ${world.state.bonus}.${joined}${bossDown} Press Enter for the next night.`);
  }

  // ANDROID BUILD ONLY (v1.4.4) — one cutscene beat forward; after the last
  // beat the dawn card takes over.
  function advanceCutscene() {
    if (!cutscene) return;
    // ANDROID BUILD ONLY (v1.6.0) — the illustration card comes first.
    if (cutscene.card && !cutscene.cardDone) {
      cutscene.cardDone = true;
      cutscene.beatTime = 0;
      announce(CUTSCENES[cutscene.night].beats[0].text);
      return;
    }
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
      // ANDROID BUILD ONLY (v1.8.0) — tip the first time the moth is hit.
      if (!demo) tips.show('lives', ambientClock);
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
    if (events & EVENT_LANTERN) {
      audio.play('lantern');
      // ANDROID BUILD ONLY (v1.8.0) — tip when a lantern lights (not the
      // last one: the night ends right after it).
      if (!demo && world.state.litCount < LANTERN.count) tips.show('lantern', ambientClock);
    }
    if (events & EVENT_DEW) {
      audio.play('dew');
      announce('Dew drop. One life restored.');
    }
    if (events & EVENT_SPARK) audio.play('mote', 4);
    if (events & EVENT_NIGHT) {
      if (!ENDLESS && world.state.night >= RUN.nightsToWin) finishRun(true);
      // ANDROID BUILD ONLY (v1.4.4) — after night 3 (Lumi freed) and night 6
      // (Lulu freed) the dawn cutscene plays before the dawn card.
      else if (ENDLESS && selection.mode === 'quest' && CUTSCENES[world.state.night]) {
        // ANDROID BUILD ONLY (v1.6.0) — the illustration card comes first.
        const cardForNight = { 3: 'cardNight3', 6: 'cardNight6' };
        cutscene = { night: world.state.night, beat: 0, beatTime: 0, card: cardForNight[world.state.night] ?? null, cardDone: false };
        screen = SCREEN_CUTSCENE;
        autoClock = 0;
        audio.play('clear');
        announce(cutscene.card ? 'Ilustrasi malam ini. Ketuk untuk lanjut.' : CUTSCENES[world.state.night].beats[0].text);
      // ANDROID BUILD ONLY (v1.4.5) — the first boss defeat ends in the
      // epilogue, once, before the dawn card. v1.6.0: the epilogue is Dark
      // Pekat's redemption; it only plays when he falls, not the Queen.
      } else if (selection.mode === 'quest' && world.state.bossBonus > 0 && world.state.lastBossKind === 'pekat' && !storySeen(EPILOGUE_KEY)) {
        markStorySeen(EPILOGUE_KEY);
        epiloguePage = 0;
        epilogueCard = true;
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
      // ANDROID BUILD ONLY (v1.8.0) — in-game tips, checked every frame
      // while playing (never in the demo): a shade closing in teaches
      // Flare, a spawned dew drop teaches the life restore.
      if (!demo) {
        if (!tips.hasShown('flare') && world.state.hazards.some((h) => h.kind === 'shade'
          && Math.hypot(h.x - world.state.player.x, h.y - world.state.player.y) < 280)) {
          tips.show('flare', ambientClock);
        }
        if (world.state.dew && !tips.hasShown('dew')) tips.show('dew', ambientClock);
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
        if (ENDLESS && selection.mode === 'quest' && world.state.night % BOSS.every === 0 && bossKind(world.state.night) === 'pekat') {
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
      if (epilogueCard) epilogueCard = false;
      else enterDawn();
    }
    const tip = tips.active(ambientClock);
    renderer.draw(world.state, screen, best, { timeOffset: screen === SCREEN_CUTSCENE || screen === SCREEN_DAWN || screen === SCREEN_EPILOGUE || screen === SCREEN_OVER || screen === SCREEN_PROLOGUE || screen === SCREEN_VICTORY ? ambientClock : 0, demo, cutscene, prologuePage, epiloguePage, epilogueCard, badges, skin, selection, tip: tip?.text ?? null, tipAlpha: tip?.alpha ?? 0, tipTarget: tip?.target ? tipTargetPoint(tip.target) : null });
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
