/**
 * OWNER: Person D (writing) / Person C (beat structure)
 *
 * LEVEL 3 — "Variable Control"
 *
 * The room is safely lit after level 2. Now it is about *how* lit. Same beat
 * shape as the other stories. During the puzzle the room's brightness is driven
 * live by the LED's current, so the dimmer knob and the scene move together.
 */

export const level3Story = {
  id: 'level-3',
  title: 'Variable Control',
  chapter: 'Level 3',

  beats: [
    // Nothing to read on the way in: level 2's end card leads straight to the
    // board. The briefing the player needs is on the puzzle beat itself.
    {
      id: 'puzzle',
      background: 'living-room-lit',
      mode: 'puzzle',
      lines: [
        'Drop the dimmer across the gap after the LED. It has three pins: current in at one ' +
          'end, ground at the other, and the wiper in the middle. Get the wiper carrying the ' +
          'current, then drag the dimmer — down for dimmer, up for brighter — until the room ' +
          'is somewhere you could read: not off, not a spotlight, somewhere in between.',
      ],
      resolve: '',
      resolveLabel: 'Continue to ending',
      blankResolveButton: true,
      next: 'ending-title',
    },

    /*
      PARKED — the two cards the endgame used to run through before the title.
      Nothing reaches them while the puzzle's `next` points straight at
      'ending-title' above; point it back at 'ending-wires' to play them.

    {
      id: 'ending-wires',
      background: 'ending-wires',
      light: 1,
      mode: 'cinematic',
      cinematic: true,
      cardOnly: true,
      lines: [],
      advance: 'A wire starts sparking…',
      next: 'ending-sparks',
    },

    {
      id: 'ending-sparks',
      background: 'ending-sparks',
      light: 1,
      mode: 'cinematic',
      cinematic: true,
      cardOnly: true,
      lines: [],
      advance: 'Continue',
      next: 'ending-title',
    },
    */

    /* Winning level 3 goes straight here. */
    {
      id: 'ending-title',
      background: 'ending-title',
      light: 1,
      mode: 'end',
      cinematic: true,
      lines: [],
      advance: null,
      next: null,
    },
  ],
};
