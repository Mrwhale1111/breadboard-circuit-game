/**
 * OWNER: Person C (rules) / Person D (which stage says what)
 *
 * Which of the mouse's speeches is due, and where that one stands. Kept out of
 * PuzzlePanel because it is a pure reading of the board and it is the part
 * most likely to keep growing — adding a stage should be a line here and a
 * string in content/tutorial.js, and nothing else.
 *
 * A stage is a key into the level's `tutorial`. A layout is where that speech
 * appears on screen, and several stages can share one: a new stage that only
 * changes the words reuses a layout that already exists.
 */

import { buildNetlist } from '../engine/netlist.js';
import { parseHole } from '../shared/holes.js';

/**
 * Where each stage stands.
 *   beside   — left of the toolbox, text above the mouse's head
 *   perched  — mouse on top of the toolbox, text to the left of it
 *   over     — laid across the board: mouse at its left edge, text on the
 *              bottom half. PuzzlePanel mounts these inside the board.
 *
 * @type {Record<string, 'beside'|'perched'|'over'>}
 */
export const TUTORIAL_LAYOUT = {
  placing: 'beside',
  dropped: 'beside',
  placed: 'perched',
  board: 'over',
  feed: 'over',
  ground: 'over',
  switched: 'over',
  led: 'over',
  lit: 'over',
};

/** Both legs on rails, whichever pair. */
const onRails = (placement) =>
  placement.holes.length > 0 && placement.holes.every((id) => parseHole(id)?.kind === 'rail');

/**
 * A wire with one end on a rail of this polarity and the other in the main
 * grid — a rail brought off the edge and onto the board proper. Doing it on
 * the + side is where every circuit starts; doing it on both sides is what
 * gives the current somewhere to come back to.
 *
 * Rail rows are 'TP'/'BP' for positive and 'TN'/'BN' for negative, so the
 * last letter is the polarity.
 *
 * @param {'P'|'N'} polarity
 */
const feedsFromRail = (polarity) => (placement) => {
  if (placement.type !== 'wire' || placement.holes.length !== 2) return false;
  const ends = placement.holes.map((id) => parseHole(id));
  if (ends.some((end) => !end)) return false;
  const rail = ends.filter((end) => end.kind === 'rail' && end.row.endsWith(polarity));
  const main = ends.filter((end) => end.kind === 'main');
  return rail.length === 1 && main.length === 1;
};

const feedsFromPositiveRail = feedsFromRail('P');
const feedsFromGroundRail = feedsFromRail('N');

/**
 * The two speeches that are about the switch, worked out together because
 * they need the same netlist and asking twice would build it twice.
 *
 *   'switched'  the switch has one leg on the positive side and the other in
 *               a column with nothing else in it: the first component in the
 *               loop proper, reaching out into empty board. Its text asks the
 *               player to press it.
 *   'led'       they pressed it. Closing a switch that is genuinely wired to
 *               power is the cue to start talking about the LED.
 *
 * "Positive" here is electrical, not geometric: the leg has to be in the same
 * net as a + rail, which it usually reaches through the feed wire rather than
 * by sitting on the rail itself. That is why these two need the netlist and
 * the other stages do not.
 *
 * Both require the switch to be on the positive side, so a switch dropped
 * loose on the board and idly tapped does not skip the player forward.
 *
 * @param {import('../shared/types.js').Placement[]} placements
 * @returns {'led'|'switched'|null}
 */
const switchStageFor = (placements) => {
  const switches = placements.filter(
    (placement) => placement.type === 'switch' && placement.holes.length === 2,
  );
  // Nothing to say yet, and no reason to walk the board working it out.
  if (switches.length === 0) return null;

  const { netOf } = buildNetlist(placements);
  const positive = new Set(['TP1', 'BP1'].map((id) => netOf(id)).filter((net) => net !== -1));

  /** The net at the far leg, or null if this switch is not on the + side. */
  const farNetOf = (sw) => {
    const [a, b] = sw.holes.map((id) => netOf(id));
    if (a === -1 || b === -1 || a === b) return null;
    const far = positive.has(a) ? b : positive.has(b) ? a : null;
    return far === null || positive.has(far) ? null : far;
  };

  const live = switches.filter((sw) => farNetOf(sw) !== null);
  if (live.length === 0) return null;

  if (live.some((sw) => sw.state?.closed === true)) return 'led';

  return live.some((sw) => {
    const far = farNetOf(sw);
    // Empty means empty: nothing else on the board touches that strip.
    return !placements.some(
      (other) => other.id !== sw.id && other.holes.some((id) => netOf(id) === far),
    );
  })
    ? 'switched'
    : null;
};

/**
 * The speech that is due, latest milestone first. Null means the mouse has
 * nothing to add right now and stays off screen.
 *
 * @param {import('../shared/types.js').Placement[]} placements
 * @param {boolean} touched   The player has changed the board at least once
 * @param {boolean} lightOn   The LED is giving off light. That is the end of
 *                            the tutorial: there is nothing left to teach, so
 *                            the mouse just reacts and the story takes over.
 * @returns {string | null}
 */
export function tutorialStageFor(placements, touched, lightOn = false) {
  if (lightOn) return 'lit';

  const fromSwitch = switchStageFor(placements);
  if (fromSwitch) return fromSwitch;

  const positiveFeed = placements.some(feedsFromPositiveRail);
  // Both rails onto the board: there is a way out and a way back.
  if (positiveFeed && placements.some(feedsFromGroundRail)) return 'ground';
  if (positiveFeed) return 'feed';
  if (placements.some((placement) => placement.type === 'battery' && onRails(placement))) {
    return 'board';
  }
  if (placements.some((placement) => placement.type === 'wire')) return 'placed';

  /*
   * They have dropped something, and it was not a wire. The gesture landed,
   * so 'placing' has done its job — but nothing joins up until a wire does,
   * so the mouse stays where it is and says so rather than disappearing.
   */
  if (placements.some((placement) => placement.type !== 'wire')) return 'dropped';

  if (!touched) return 'placing';
  return null;
}
