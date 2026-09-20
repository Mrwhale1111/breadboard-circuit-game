/**
 * OWNER: Person D (writing) / Person C (beat structure)
 *
 * LEVEL 2 — "Turn It Down"
 *
 * Picks up exactly where level 1's `toobright` beat left off: the room is lit,
 * but painfully so. Same beat shape as level1Story.js. One extra field:
 *
 *   glare       0..1, a harsh white wash over the scene. During the puzzle this
 *               is ignored and driven live by the circuit (an over-driven LED
 *               glares; a resistor-protected one does not).
 */

export const level2Story = {
  id: 'level-2',
  title: 'Turn It Down',
  chapter: 'Level 2',

  beats: [
    {
      id: 'burn',
      background: 'living-room-lit',
      light: 1,
      glare: 1,
      mode: 'narrative',
      lines: [
        'ahhhhhh my eyes are burninggggggg :(',
        'I must have used too much power I can almost feel it in my bones',
      ],
      advance: 'Get back to the panel',
      next: 'puzzle',
    },

    {
      id: 'puzzle',
      background: 'living-room-lit',
      mode: 'puzzle',
      lines: [
        'Pull the jumper that runs straight from the switch to the LED and put the ' +
          'resistor in its place. The loop still has to close — it just has to make the ' +
          'electricity work for it.',
      ],
      resolve: 'The glare drops away. The light settles to something warm and steady.',
      resolveLabel: 'Lower your hand',
      next: 'rest',
    },

    /*
     * Nothing to read after the puzzle: solving it goes straight to the end
     * card and the way into level 3. The beat stays because an `end` beat is
     * what draws that card — it just has no lines of its own any more.
     */
    {
      id: 'rest',
      background: 'living-room-lit',
      light: 0.85,
      mode: 'end',
      lines: [],
      advance: null,
      next: null,
      blankNextLevelButton: true,
    },
  ],
};
