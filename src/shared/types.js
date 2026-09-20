/**
 * SHARED VOCABULARY — owned by the whole team, changed only by agreement.
 *
 * These are JSDoc typedefs. They generate no runtime code, but VS Code will
 * autocomplete and type-check against them, which is why we use them instead
 * of plain comments. If you change a shape here, you are changing a contract
 * that another teammate is coding against — open a PR and tag everyone.
 *
 * Read docs/ARCHITECTURE.md alongside this file.
 */

/**
 * A single hole on the breadboard, identified by a short string.
 *
 * Main grid:   "A1" .. "J30"   (row letter + column number, 1-indexed)
 * Power rails: "TP1".."TP30"   top    positive (+, red)
 *              "TN1".."TN30"   top    negative (-, blue)
 *              "BP1".."BP30"   bottom positive
 *              "BN1".."BN30"   bottom negative
 *
 * Hole IDs are THE shared language between the renderer and the engine.
 * The renderer turns clicks into hole IDs; the engine only ever sees hole IDs
 * and never knows anything about pixels.
 *
 * @typedef {string} HoleId
 */

/**
 * The kind of thing a player can place on the board.
 * @typedef {'wire' | 'battery' | 'led' | 'resistor' | 'switch' | 'potentiometer'} ComponentType
 */

/**
 * A component definition — the static facts about a part, from the catalog.
 * Owned by Person D in src/content/components.js
 *
 * @typedef {object} ComponentDef
 * @property {ComponentType} type
 * @property {string} label            Human name shown in the tray, e.g. "LED"
 * @property {string} blurb            One sentence: what it does in plain English
 * @property {PinDef[]} pins           Ordered. Placement.holes[i] maps to pins[i]
 * @property {boolean} polarized       True if plugging it in backwards matters
 * @property {object} [electrical]     Engine-relevant numbers (see below)
 * @property {number} [electrical.volts]           battery only
 * @property {number} [electrical.ohms]            resistor only
 * @property {number} [electrical.trackOhms]       potentiometer only — the whole
 *                                                 track, end pin to end pin. The
 *                                                 knob decides how it splits
 *                                                 either side of the wiper.
 * @property {number} [electrical.nominalCurrentMa] led only — current at which brightness is 1
 * @property {number} [electrical.forwardVolts]    led only
 * @property {number} [electrical.minCurrentMa]    led only — below this it won't glow
 * @property {number} [electrical.maxCurrentMa]    led only — above this it burns out
 */

/**
 * One electrical terminal of a component.
 * @typedef {object} PinDef
 * @property {string} name    Stable id, e.g. "anode", "cathode", "pos", "neg", "a", "b"
 * @property {string} label   Shown to the player, e.g. "+ (long leg)"
 */

/**
 * A component the player has actually placed on the board.
 * This is the core piece of game state. The renderer produces it,
 * the engine consumes it, the game shell stores it.
 *
 * @typedef {object} Placement
 * @property {string} id                Unique, e.g. "led-1". Use makeId() from shared/ids.js
 * @property {ComponentType} type
 * @property {HoleId[]} holes           One per pin, SAME ORDER as ComponentDef.pins
 * @property {PlacementState} [state]   Mutable per-instance state (switch open/closed, etc.)
 */

/**
 * Per-instance mutable state. Only the fields relevant to the type are used.
 * @typedef {object} PlacementState
 * @property {boolean} [closed]   switch only — true when the switch is pressed/flipped on
 * @property {boolean} [burnedOut] led only — set by the engine, persists until reset
 * @property {number} [turn]      potentiometer only — knob position, 0 (min ohms) .. 1 (max ohms)
 */

/**
 * A "net" is a set of holes that are all electrically the same point.
 * Two holes in the same net are connected by copper (or by a wire the player added).
 *
 * @typedef {object} Net
 * @property {number} id
 * @property {HoleId[]} holes
 */

/**
 * What the engine tells the rest of the app after it solves the circuit.
 * This is the single most important contract in the project.
 *
 * @typedef {object} CircuitResult
 * @property {boolean} complete                   A closed loop exists from battery + to battery -
 * @property {boolean} shorted                    Current can get from + to - without passing a load
 * @property {Net[]} nets
 * @property {Record<string, PlacementResult>} components   Keyed by Placement.id
 * @property {Fault[]} faults
 */

/**
 * Per-component simulation output.
 * @typedef {object} PlacementResult
 * @property {boolean} energized      Current is flowing through this component
 * @property {number} currentMa       Milliamps through it. 0 when not energized.
 * @property {boolean} [lit]          led only — energized AND correct polarity AND enough current
 * @property {boolean} [reverseBiased] led only — wired backwards
 * @property {boolean} [burnedOut]    led only — too much current, no resistor
 * @property {number} [brightness]    led only — 0 (dark) .. 1 (full), scales with current
 * @property {number} [ohms]          potentiometer only — the resistance it is
 *                                    actually contributing: the half the current
 *                                    crosses, or the whole track if it went in
 *                                    one end and out the other
 * @property {boolean} [viaWiper]     potentiometer only — the current enters or
 *                                    leaves at the wiper, so the knob is in
 *                                    charge. False means it ran end to end past
 *                                    the wiper and turning the knob does nothing.
 */

/**
 * Something wrong the player should be told about, in teaching language.
 * @typedef {object} Fault
 * @property {FaultCode} code
 * @property {string} message           Player-facing. Explain, don't just scold.
 * @property {string[]} placementIds    Which components to highlight in red
 */

/**
 * @typedef {'OPEN_CIRCUIT'
 *   | 'SHORT_CIRCUIT'
 *   | 'NO_BATTERY'
 *   | 'NO_LOAD'
 *   | 'LED_BACKWARDS'
 *   | 'LED_BURNED_OUT'
 *   | 'SWITCH_OPEN'
 *   | 'FLOATING_PIN'
 *   | 'PINS_SAME_NET'
 *   | 'POT_ENDS_ONLY'
 * } FaultCode
 */

/**
 * A level. Owned by Person C (format) and Person D (wording/content).
 *
 * @typedef {object} Level
 * @property {string} id
 * @property {string} title
 * @property {string} brief             2-3 sentences setting up the challenge
 * @property {TrayItem[]} tray          What the player is given to work with
 * @property {Placement[]} preplaced    Components already on the board, not removable
 * @property {Objective[]} objectives   ALL must pass to win
 * @property {string[]} hints           Revealed one at a time, in order
 * @property {RealWorldNote} realWorld  Shown after winning — the "why this matters" payoff
 * @property {Tutorial} [tutorial]      Optional staged Level 1 coaching
 */

/**
 * @typedef {object} Tutorial
 * @property {string[]} placing
 * @property {string[]} placed
 * @property {string[]} board
 * @property {string[]} feed
 */

/**
 * @typedef {object} TrayItem
 * @property {ComponentType} type
 * @property {number} count    How many the player gets. Use Infinity for unlimited wires.
 */

/**
 * @typedef {object} Objective
 * @property {string} id
 * @property {string} description                       Shown as a checklist item
 * @property {(ctx: ObjectiveContext) => boolean} check  Pure function, no side effects
 */

/**
 * @typedef {object} ObjectiveContext
 * @property {CircuitResult} result       Simulation with the switch in its CURRENT position
 * @property {CircuitResult} resultOpen   Simulation forcing every switch OPEN
 * @property {CircuitResult} resultClosed Simulation forcing every switch CLOSED
 * @property {Placement[]} placements
 */

/**
 * @typedef {object} RealWorldNote
 * @property {string} title
 * @property {string} body
 * @property {string} [imageSrc]
 */

export {};
