// Recorded clips sit paused until an operator plays them, so the frame they
// rest on is what the dashboard shows. V3 opens on a hard fade-in from black
// (flat black at t=0, still dim at 1.0s, settled by ~1.8s), which made the tile
// look like a dead feed. Parking the playhead just past the fade gives every
// clip a representative still without changing what gets played.
export const POSTER_TIME = 1.8;

// Seek a paused clip to its poster frame. Safe to call on every loadedmetadata:
// it only moves the playhead while the clip is still at the very start, so it
// never fights a user who has already scrubbed or played.
export const seekToPosterFrame = (el) => {
  if (!el || Number.isNaN(el.duration)) return;
  if (el.currentTime > 0.01) return;
  el.currentTime = Math.min(POSTER_TIME, el.duration / 2);
};
