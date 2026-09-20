/**
 * OWNER: Person D (wording, hints, real-world note)
 *          + Person C (objective `check` functions)
 *
 * LEVEL 1 — "Light It Up"
 * The player wires a battery, switch and LED into one loop, then flips the
 * switch to prove the light is under their control.
 *
 * The win condition is deliberately two-sided: the LED must be OFF with the
 * switch open and ON with it closed. That rules out the common cheat of
 * bridging around the switch, and it is the actual idea the level teaches.
 *
 * No resistor here — that is level 2's lesson. With nothing limiting the
 * current the LED comes on far too hard, which is exactly the note level 1
 * ends on and the reason the player goes looking for a resistor next.
 */

import {
  TUTORIAL_BOARD,
  TUTORIAL_DROPPED,
  TUTORIAL_FEED,
  TUTORIAL_GROUND,
  TUTORIAL_LED,
  TUTORIAL_LIT,
  TUTORIAL_PLACED,
  TUTORIAL_PLACING,
  TUTORIAL_SWITCH,
} from '../tutorial.js';

/** @typedef {import('../../shared/types.js').Level} Level */

/** @type {Level} */
export const level1 = {
  id: 'level-1',
  title: 'Light It Up',
  brief:
    'Electricity only does useful work when it can travel in a complete loop. ' +
    'Build a loop from the battery, through a switch, to the LED and back — ' +
    'then put the light under your control.',

  tray: [
    { type: 'wire', count: Infinity },
    { type: 'battery', count: 1 },
    { type: 'switch', count: 1 },
    { type: 'led', count: 1 },
  ],

  preplaced: [],

  /*
   * The only level that gets the mouse. It teaches working the toolbox, which
   * is a thing you learn once — by level 2 it would just be a picture standing
   * in front of the board.
   */
  tutorial: {
    placing: TUTORIAL_PLACING,
    dropped: TUTORIAL_DROPPED,
    placed: TUTORIAL_PLACED,
    board: TUTORIAL_BOARD,
    feed: TUTORIAL_FEED,
    ground: TUTORIAL_GROUND,
    switched: TUTORIAL_SWITCH,
    led: TUTORIAL_LED,
    lit: TUTORIAL_LIT,
  },

  objectives: [
    {
      id: 'loop',
      description: 'Build one complete loop from + back to −',
      check: ({ resultClosed }) => resultClosed.complete && !resultClosed.shorted,
    },
    {
      id: 'switch-off',
      description: 'With the switch OPEN, the LED is dark',
      check: ({ resultOpen, placements }) => {
        const led = placements.find((p) => p.type === 'led');
        if (!led) return false;
        const result = resultOpen.components[led.id];
        return result?.lit !== true && result?.burnedOut !== true;
      },
    },
    {
      /*
       * "On" here means shining, not shining *well*. With no resistor in the
       * level the LED is always over-driven, which the engine reports as
       * `burnedOut` rather than `lit` — it still floods the room, painfully,
       * and that glare is the whole hand-off into level 2.
       */
      id: 'switch-on',
      description: 'With the switch CLOSED, the LED lights up',
      check: ({ resultClosed, placements }) => {
        const led = placements.find((p) => p.type === 'led');
        if (!led) return false;
        const result = resultClosed.components[led.id];
        return result?.lit === true || result?.burnedOut === true;
      },
    },
  ],

  hints: [
    'Holes in the same column strip (A1–E1) are already joined inside the board. You do not need a wire between them.',
    'The gap down the middle splits every column in two. A1–E1 and F1–J1 are NOT connected.',
    'Give each component its own column. If both legs of the LED land in the same strip, current skips straight past it.',
    'The LED only works one way round. Its long leg (anode) must face the battery’s + side.',
    'Put the switch anywhere along the loop — a break anywhere stops the whole thing. That is why one light switch controls one light.',
  ],

  realWorld: {
    title: 'You just built a light switch',
    body:
      'The switch on your wall does exactly this: it opens and closes a gap in a loop ' +
      'running from the power source to the bulb and back. Nothing clever happens inside ' +
      'the switch — it is two pieces of metal that touch or do not. The same loop shows up ' +
      'in a torch, a car headlight, and the button on a game controller.',
  },
};
