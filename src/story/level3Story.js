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
    {
      id: 'evening',
      background: 'living-room-lit',
      light: 1,
      mode: 'narrative',
      lines: [
        'Later. You have found a book, and the sofa, and the one working light in the house.',
        'It is safe now. It is also aimed at you like an interrogation lamp.',
        'You want it on. You just want less of it.',
      ],
      advance: 'Go and look at the panel',
      next: 'panel',
    },

    {
      id: 'panel',
      background: 'living-room-lit',
      light: 1,
      mode: 'narrative',
      lines: [
        'The loop is as you left it: battery, switch, resistor, LED.',
        'Except someone has pulled the return wire back four columns and left a gap after the LED.',
        'Taped to the inside of the door is a small blue part with a knob on top, and a note: “for when it is too much.”',
      ],
      advance: 'Pick it up',
      next: 'puzzle',
    },

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
      next: 'ending-wires',
    },

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
