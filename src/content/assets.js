/**
 * OWNER: Person D (Content & Art)
 *
 * Every image the game can use, in one place, with a placeholder to fall back
 * on when the file is not there yet.
 *
 * This is what lets art and code proceed in parallel on a 24-hour clock: the
 * game runs correctly with zero image files present, and each drop-in improves
 * it without anyone touching a component.
 *
 * See public/assets/README.md for the filenames and sizes expected.
 */

const BASE = '/assets';

/**
 * @typedef {object} AssetSpec
 * @property {string} src        URL under public/
 * @property {string} alt        Describe it for screen readers AND for teammates
 * @property {string} fallback   CSS background used until the file exists
 */

/**
 * The key is what a story beat asks for; `src` is the file on disk. They do not
 * have to match, and currently do not — drop a file in and point `src` at it.
 * A missing file is not an error: the scene draws `fallback` instead, which is
 * exactly what you are looking at if a background seems not to have loaded.
 *
 * @type {Record<string, AssetSpec>}
 */
export const BACKGROUNDS = {
  'house-exterior-night': {
    src: `${BASE}/backgrounds/house-exterior-night.png`,
    alt: 'A small house at night, windows dark, porch light out',
    fallback: 'linear-gradient(180deg, #141c2e 0%, #1e2a44 55%, #0d1220 100%)',
  },
  'living-room-dark': {
    src: `${BASE}/backgrounds/backgrounddark.png`,
    alt: 'A living room in near-total darkness, shapes barely visible',
    fallback: 'linear-gradient(180deg, #0c0f16 0%, #151a26 100%)',
  },
  'living-room-lit': {
    src: `${BASE}/backgrounds/background.png`,
    alt: 'The same living room, warmly lit',
    fallback: 'linear-gradient(180deg, #4a3a22 0%, #6b5233 60%, #3a2c19 100%)',
  },
  'ending-wires': {
    src: `${BASE}/backgrounds/ending-wires.png`,
    alt: 'Exposed electrical wires crossing and sparking inside a wall panel',
    fallback: 'linear-gradient(180deg, #9a6139 0%, #4a2c1b 100%)',
  },
  'ending-sparks': {
    src: `${BASE}/backgrounds/ending-sparks.png`,
    alt: 'The bedroom filled with bright electrical sparks',
    fallback: 'linear-gradient(180deg, #72a6f4 0%, #705276 100%)',
  },
  'ending-title': {
    src: `${BASE}/backgrounds/ending-title.png`,
    alt: 'The End, with a message that the story is to be continued',
    fallback: 'linear-gradient(180deg, #32115c 0%, #7a237f 65%, #24123f 100%)',
  },
};

/** @type {Record<string, AssetSpec>} */
export const PROPS = {
  'panel-closed': {
    src: `${BASE}/props/panel-closed.png`,
    alt: 'A closed electrical panel on the wall',
    fallback: 'linear-gradient(180deg, #2a2f3a 0%, #1b1f28 100%)',
  },
};

/**
 * Shown full screen, one at a time, between pressing start and the story
 * beginning. The player clicks through them.
 *
 * These are pictures of something else — a phone screen, a note — rather than
 * rooms the player stands in, so they are shown whole rather than cropped, and
 * none of the room's lighting touches them. Add `introslidetwo.png` and so on
 * here in order.
 *
 * @type {{ src: string, alt: string }[]}
 */
export const INTRO_SLIDES = [
  {
    src: `${BASE}/backgrounds/introslideone.png`,
    alt:
      'A phone conversation. A friend asks how your week is going; you answer ' +
      'that you have just moved into a new house; she asks whether she can come over.',
  },
  {
    src: `${BASE}/backgrounds/intoslidetwo.png`,
    alt: 'The dark, broken house you have just moved into.',
  },
];

export const BREADBOARD_IMAGE = `${BASE}/breadboard/breadboard.png`;

/** The open toolbox the parts tray is drawn inside. */
export const TOOLBOX_IMAGE = `${BASE}/backgrounds/toolbox.png`;

/**
 * ART NAMING — the convention the drawings follow.
 *
 *   <part>tool.png   the icon in the toolbox, before the part is picked up
 *   <part>board.png  the part sitting on the breadboard
 *
 * Parts with more than one look get one file per state, e.g. switchonboard
 * and switchoffboard. Anything with no file falls back to the drawn SVG, so
 * the game still runs with an empty assets folder.
 */

/**
 * One picture per part, shown in the tray. These are the `tool` drawings.
 *
 * Drop a PNG at any of these paths and it replaces the drawn placeholder on
 * refresh — no code change. Until then the tray draws the part's own SVG art.
 *
 * Square images work best; they are letterboxed into a square slot.
 *
 * @type {Record<string, string>}
 */
export const COMPONENT_IMAGES = {
  led: `${BASE}/components/ledtool.png`,
  potentiometer: `${BASE}/components/pottool.png`,
  switch: `${BASE}/components/switchonofftool.png`,
  // No tool drawing of its own yet, so the board one stands in.
  resistor: `${BASE}/components/resblue.png`,
  // wire and battery have no art yet — they draw their SVG icon instead.
};

/**
 * @param {string} type
 * @returns {string} '' when this part has no image slot at all
 */
export function componentImage(type) {
  return COMPONENT_IMAGES[type] ?? '';
}

/**
 * How big a part's slot is in the toolbox, as a fraction of a full one. Shrinks
 * the whole slot — the dark cut-out and the picture in it together.
 *
 * Icons are fitted to their slot, so a long thin drawing is scaled up until its
 * length fills the height and ends up towering over the chunky ones. The
 * resistor is the case in point: its tray icon is really its board art doing
 * double duty, leads and all, so it gets a smaller slot and reads as a small
 * part rather than a pole. Give it its own `restool.png`, drawn square like the
 * others, and this entry can go.
 *
 * @type {Record<string, number>}
 */
export const SLOT_SCALE = {
  resistor: 0.5,
};

/** @param {string} type */
export function slotScale(type) {
  return SLOT_SCALE[type] ?? 1;
}

/**
 * Bitmap art for parts sitting on the board — the `board` drawings.
 *
 * Each entry says how big the drawing is in board millimetres (one hole pitch
 * is 2.54) and, crucially, WHERE ITS LEGS ARE. `legs` gives the two points that
 * plug into holes, as fractions of the image: [0, 0] is the top-left corner,
 * [1, 1] the bottom-right. The board lines those two points up with the two
 * holes the part occupies, so what you see sits exactly on the nodes the
 * circuit solver is using, and draws the rest of each lead out to the hole.
 *
 * That is why the files are cropped tight to the artwork: with no transparent
 * margin, `width` is simply how wide the part is, and the leg fractions are
 * easy to read off. Keep new drawings cropped the same way.
 *
 *   legs [[0.3, 1], [0.7, 1]]  legs side by side along the bottom — a part
 *                              drawn front-on, standing up (LED, switch, dimmer)
 *   legs [[0.5, 0], [0.5, 1]]  a lead out of each end — a part drawn lying
 *                              down (resistor)
 *
 * A part that looks different in different states maps state -> art; see
 * `boardArt` below. Both switch states share one scale so it does not change
 * size when you flip it.
 *
 * @type {Record<string, object>}
 */
export const COMPONENT_ART = {
  led: {
    src: `${BASE}/components/ledboard.png`,
    alt: 'A round red LED standing on two legs',
    width: 5.1,
    height: 7.55,
    legs: [
      [0.32, 1],
      [0.68, 1],
    ],
    // The bulb, not the middle of the picture — the legs take up the bottom.
    heart: [0.5, 0.44],
  },

  resistor: {
    src: `${BASE}/components/resblue.png`,
    alt: 'A blue resistor with a lead out of each end',
    width: 2.2,
    height: 8.73,
    legs: [
      [0.49, 0],
      [0.49, 1],
    ],
  },

  potentiometer: {
    src: `${BASE}/components/potboard.png`,
    alt: 'A round gold potentiometer with a dial on top',
    width: 6.95,
    height: 8.02,
    // Three pins are drawn; the circuit uses the outer two.
    legs: [
      [0.31, 1],
      [0.68, 1],
    ],
    heart: [0.5, 0.42],
  },

  switch: {
    closed: {
      src: `${BASE}/components/switchonboard.png`,
      alt: 'A rocker switch, pressed on',
      width: 6.15,
      height: 8.5,
      legs: [
        [0.22, 1],
        [0.78, 1],
      ],
    },
    open: {
      src: `${BASE}/components/switchoffboard.png`,
      alt: 'A rocker switch, off',
      width: 5.75,
      height: 7.92,
      legs: [
        [0.22, 1],
        [0.77, 1],
      ],
    },
  },
};

/**
 * The drawing for one placed part, in the state it is actually in.
 *
 * @param {import('../shared/types.js').Placement} placement
 * @returns {object | null} null when this part has no board art
 */
export function boardArt(placement) {
  const entry = COMPONENT_ART[placement.type];
  if (!entry) return null;
  if (entry.src) return entry;

  // A part with one drawing per state — the switch, so far.
  if (placement.type === 'switch') {
    return placement.state?.closed ? entry.closed : entry.open;
  }
  return null;
}

/**
 * Where a drawing's legs and middle sit once it is laid against its two holes,
 * in millimetres, with the midpoint between the legs at the origin and the legs
 * along the x axis. The renderer puts that origin on the middle of the two
 * holes, so `span` is how far apart the drawn legs land.
 *
 * @param {object} art an entry from COMPONENT_ART
 */
export function artAnchors(art) {
  const [a, b] = art.legs.map(([fx, fy]) => ({ x: fx * art.width, y: fy * art.height }));
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const [hx, hy] = art.heart ?? [0.5, 0.5];

  // Turn the drawing so its legs lie along the x axis, feet down.
  const radians = Math.atan2(b.y - a.y, b.x - a.x);
  const heart = { x: hx * art.width - mid.x, y: hy * art.height - mid.y };

  return {
    span: Math.hypot(b.x - a.x, b.y - a.y),
    angle: (radians * 180) / Math.PI,
    // Offset that brings the midpoint between the legs to the origin.
    offset: { x: -mid.x, y: -mid.y },
    // The middle of the part, turned to match — glows and dials hang off this.
    heart: {
      x: heart.x * Math.cos(radians) + heart.y * Math.sin(radians),
      y: -heart.x * Math.sin(radians) + heart.y * Math.cos(radians),
    },
  };
}

/**
 * @param {string} name
 * @returns {AssetSpec}
 */
export function background(name) {
  return (
    BACKGROUNDS[name] ?? {
      src: '',
      alt: '',
      fallback: 'linear-gradient(180deg, #1a1f2b, #0d1118)',
    }
  );
}
