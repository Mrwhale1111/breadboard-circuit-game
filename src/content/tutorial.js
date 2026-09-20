/**
 * OWNER: Person D (copy)
 *
 * What the mouse says while the player learns the board, in three goes.
 *
 *   PLACING  from the moment the board appears until the player drags their
 *            first part. It teaches the one gesture everything depends on.
 *   DROPPED  they dropped a part, but not a wire. Stands in the same place as
 *            PLACING — the mouse has not moved, it has just moved on.
 *   PLACED   from the moment a wire is on the board. They can work the
 *            toolbox now, so this one is about what to do with a wire.
 *   BOARD    once the battery is across the power rails. This one is about
 *            the board itself, so it is shown on the board, not beside it.
 *   FEED     once a wire carries the + rail into the main grid. Same place on
 *            the board as BOARD — only the words change.
 *   GROUND   once the − rail is wired into the grid as well, so there is a way
 *            out and a way back. Same place again.
 *   SWITCHED once the switch bridges the positive side into an empty column.
 *            Same place again. This one asks the player to press the switch.
 *   LED      they pressed it. Same place again, and now it is about the LED.
 *   LIT      the light is on. The tutorial is over — the mouse only reacts,
 *            and the story picks it up from there.
 *
 * THIS IS PLACEHOLDER COPY. Rewrite the strings and nothing else changes —
 * TutorialMouse renders whatever lines it is handed, however many.
 *
 * Which levels get a mouse at all is decided in the level files, not here.
 */

/** Before the player has dragged anything. @type {string[]} */
export const TUTORIAL_PLACING = [
  'PLACEHOLDER — Press and hold a part in the toolbox, then drag it out onto the board.',
  'PLACEHOLDER — Let go over a hole. The ghost shows you where it will land.',
];

/**
 * Once they have dropped something that is not a wire. Same place as
 * TUTORIAL_PLACING; only the words change.
 * @type {string[]}
 */
export const TUTORIAL_DROPPED = [
  'PLACEHOLDER — That is the gesture. Every part goes on the board the same way.',
  'PLACEHOLDER — Now fetch a jumper wire — nothing on the board is joined up without one.',
];

/** Once there is a wire on the board. @type {string[]} */
export const TUTORIAL_PLACED = [
  'PLACEHOLDER — Nice. That wire joins the two holes it sits in into one point.',
  'PLACEHOLDER — To move just one end of it, grab the dot on that tip and drag it somewhere else.',
];

/** Once the battery is on the power rails. Shown across the board. @type {string[]} */
export const TUTORIAL_BOARD = [
  'PLACEHOLDER — Holes in the same column strip are already joined inside the board.',
  'PLACEHOLDER — The gap down the middle splits every column in two, so the halves are not connected.',
];

/**
 * Once a wire runs from a positive rail into the main grid. Shown in the same
 * place as TUTORIAL_BOARD — this stage changes the words, not the position.
 * @type {string[]}
 */
export const TUTORIAL_FEED = [
  'PLACEHOLDER — That wire brings power off the + rail and onto the board itself.',
  'PLACEHOLDER — Everything in that column strip is now live. Build the rest of the loop from there.',
];

/**
 * Once both rails reach the main grid — + out and − back. Shown in the same
 * place as TUTORIAL_BOARD and TUTORIAL_FEED; only the words change.
 * @type {string[]}
 */
export const TUTORIAL_GROUND = [
  'PLACEHOLDER — Both rails are on the board now: one column live, another back to −.',
  'PLACEHOLDER — Everything you add from here goes between those two, so the current has a way round.',
];

/**
 * Once the switch runs from the positive side out into an empty column. Shown
 * in the same place as the three above; only the words change.
 * @type {string[]}
 */
export const TUTORIAL_SWITCH = [
  'PLACEHOLDER — The switch is in the path now, with its far leg out in a column of its own.',
  'PLACEHOLDER — Press the switch to close it — that is the gap in the loop you control.',
];

/**
 * Once the player has pressed the switch closed. Shown in the same place as
 * the ones above; only the words change.
 * @type {string[]}
 */
export const TUTORIAL_LED = [
  'PLACEHOLDER — Closed. Now the loop needs something to light up at the end of it.',
  'PLACEHOLDER — The LED only works one way round: its long leg has to face the + side.',
];

/**
 * The light is on and the tutorial is done. Not placeholder: it hands off to
 * level 1's closing beat, which opens on the same noise.
 *
 * @type {string[]}
 */
export const TUTORIAL_LIT = ['ahhhhhhh'];
