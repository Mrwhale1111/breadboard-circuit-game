/**
 * OWNER: Person D (writing) / Person C (beat structure)
 *
 * LEVEL 3 — "Reading Light"
 *
 * The room is safely lit after level 2. Now it is about *how* lit. Same beat
 * shape as the other stories. During the puzzle the room's brightness is driven
 * live by the LED's current, so the dimmer knob and the scene move together.
 */

export const level3Story = {
  id: 'level-3',
  title: 'Reading Light',
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
      resolve: 'The light eases. The page in your lap is still readable; the rest of the room falls back into shadow.',
      resolveLabel: 'Sit back down',
      next: 'solved',
    },

    {
      id: 'solved',
      background: 'living-room-lit',
      light: 0.45,
      mode: 'narrative',
      lines: [
        'The knob is only a resistor you can change by hand. Turn it one way and the current has a longer path to fight through — less gets to the LED, and it dims.',
        'Turn it the other way and the path shortens. More current, more light.',
        'Every volume knob and dimmer switch you have ever touched was this part.',
      ],
      advance: 'Open the book',
      next: 'rest',
    },

    {
      id: 'rest',
      background: 'living-room-lit',
      light: 0.45,
      mode: 'narrative',
      lines: [
        'The house is quiet. The light is exactly as bright as you want it and not a bit more.',
        'Whoever left the parts by the panel knew what they were doing. You are starting to think they wanted you to learn this.',
      ],
      advance: 'Check the sound in the wall',
      next: 'ending-wires',
    },

    {
      id: 'ending-wires',
      background: 'ending-wires',
      light: 1,
      mode: 'cinematic',
      cinematic: true,
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
