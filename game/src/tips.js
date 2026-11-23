// ANDROID BUILD ONLY (v1.8.0) — in-game tips ("Tips Sambil Main").
// The tutorial is no longer a screen before the first run: short tips
// appear while playing, at the moment each one matters, then fade away.
// The game never pauses for a tip, and only one shows at a time.
// ANDROID BUILD ONLY (v1.9.7) — each tip also points at the thing it is
// about (a pulsing gold ring drawn by the renderer), and a skill tip
// explains the hero's skill on the first run.
//
// Session scope, in-memory only: a tip shows once per page load (one open
// game). Replaying without closing the game never shows them again; a
// fresh open shows them again on the first run. No localStorage — the
// player already knows them once they have played.
export function createTips(list, duration = 4.5) {
  const byId = new Map(list.map((tip) => [tip.id, tip]));
  const shown = new Set();
  let current = null;
  const queue = [];

  // Show a tip by id (with an optional text override and target).
  // Returns false when the tip was already shown this session, or the id
  // has no text. The target names what the tip points at ('mote',
  // 'shade', 'lantern', 'dew', 'sparks', 'lives') and is carried through
  // to the pointer the renderer draws.
  function show(id, now, text, target) {
    if (shown.has(id)) return false;
    shown.add(id);
    const def = byId.get(id);
    const item = { text: text ?? def?.text ?? '', target: target ?? def?.target ?? null, until: 0 };
    if (!item.text) return false;
    if (current) queue.push(item);
    else {
      current = item;
      current.until = now + duration;
    }
    return true;
  }

  // The tip to draw right now, or null. Advances the queue as tips expire;
  // alpha fades out over the last 0.6 s.
  function active(now) {
    if (current && now >= current.until) {
      current = queue.shift() ?? null;
      if (current) current.until = now + duration;
    }
    if (!current) return null;
    const remain = current.until - now;
    return { text: current.text, alpha: remain < 0.6 ? Math.max(0, remain / 0.6) : 1, target: current.target };
  }

  function hasShown(id) {
    return shown.has(id);
  }

  return { show, active, hasShown };
}
