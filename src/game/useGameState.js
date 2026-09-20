/**
 * OWNER: Person C (Game Shell & Levels)
 *
 * The single source of truth for one level's play session. Every change the
 * player makes goes through dispatch(), which is what makes undo nearly free
 * and guarantees the engine only ever sees a consistent snapshot.
 *
 * INTERACTION MODEL — drag and drop:
 *   1. Drag a part out of the tray onto the board. It lands spanning the hole
 *      you dropped it on plus its own footprint (see footprint.js).
 *   2. Drag a part's body to move the whole thing, keeping its span.
 *   3. Drag either end handle to re-seat one leg on its own.
 *   4. Drag a part off the board, by body or by leg, to take it away.
 *   Tap a switch to flip it. Escape cancels a drag in progress.
 *
 *   The potentiometer is the one exception: its body is a knob, so dragging it
 *   turns it rather than moving it. Move one by its end handles or the arrow
 *   keys. It also gets a slider under the board, which is the keyboard path.
 *
 * The one subtlety worth knowing: a press only becomes a *drag* once the
 * pointer has travelled DRAG_THRESHOLD pixels. Below that it is a tap, which
 * is what makes "click the switch to flip it" survive in a drag-first world.
 *
 * Keyboard players are not left out: parts are focusable, arrow keys nudge,
 * Delete removes, Enter flips a switch, and Enter on a tray item drops the
 * part onto the first free spot.
 */

import { useCallback, useEffect, useMemo, useReducer } from 'react';
import { simulateAll } from '../engine/simulate.js';
import { makeId } from '../shared/ids.js';
import { holeDelta, shiftHole } from '../shared/holes.js';
import { firstFreeFootprint, footprintFor } from './footprint.js';
import { getComponent } from '../content/components.js';

/** @typedef {import('../shared/types.js').Placement} Placement */
/** @typedef {import('../shared/types.js').Level} Level */
/** @typedef {import('../shared/types.js').HoleId} HoleId */

/** Pixels the pointer must travel before a press counts as a drag, not a tap. */
export const DRAG_THRESHOLD = 4;

/**
 * @typedef {object} Drag
 * @property {'tray'|'move'|'leg'} source  Where the thing being dragged came from
 * @property {string} type                 Component type
 * @property {string} [id]                 Placement being dragged (move/leg)
 * @property {number} legIndex             Which leg is under the pointer
 * @property {HoleId[]} [origin]           Where the part sat when it was grabbed
 * @property {HoleId | null} hole          Hole under the pointer right now
 * @property {boolean} moved               Past the threshold — a real drag
 * @property {{ x: number, y: number }} from  Pointer position when grabbed
 */

/**
 * @typedef {object} GameState
 * @property {Placement[]} placements
 * @property {Drag | null} drag
 * @property {Placement[][]} history   Snapshots for undo, newest last
 * @property {number} hintsRevealed
 * @property {string | null} notice    Transient message, e.g. "no wires left"
 * @property {boolean} touched         Whether the player has changed the board
 */

/** @param {Level} level @returns {GameState} */
const initialState = (level) => ({
  placements: [...level.preplaced],
  drag: null,
  history: [],
  hintsRevealed: 0,
  notice: null,
  touched: false,
});

/**
 * How many of this type the level still allows.
 * @param {Level} level
 * @param {Placement[]} placements
 * @param {string} type
 */
export function remainingOf(level, placements, type) {
  const allowance = level.tray.find((item) => item.type === type)?.count ?? 0;
  if (allowance === Infinity) return Infinity;
  return allowance - placements.filter((placement) => placement.type === type).length;
}

/**
 * Where the part being dragged would land if the player let go right now.
 * Pure, derived from the drag — nothing stores it. The board renders this as a
 * ghost so the answer to "where will this go?" is always on screen.
 *
 * @param {Drag | null} drag
 * @returns {HoleId[] | null} null when there is nowhere valid to drop
 */
export function previewHoles(drag) {
  if (!drag || !drag.moved || !drag.hole) return null;

  if (drag.source === 'tray') return footprintFor(drag.type, drag.hole);

  if (drag.source === 'leg') {
    const holes = [...drag.origin];
    holes[drag.legIndex] = drag.hole;
    return holes;
  }

  // Moving the whole part: shift both legs by however far the grabbed leg went.
  const delta = holeDelta(drag.origin[drag.legIndex], drag.hole);
  if (!delta) return null;
  const holes = drag.origin.map((id) => shiftHole(id, delta.rows, delta.cols));
  return holes.every(Boolean) ? holes : null;
}

/**
 * @param {GameState} state
 * @param {{ type: string, [key: string]: any }} action
 * @returns {GameState}
 */
function reducer(state, action) {
  /** Snapshot the current placements so `undo` can come back here. */
  const commit = (placements, extra = {}) => ({
    ...state,
    placements,
    history: [...state.history, state.placements],
    drag: null,
    notice: null,
    touched: true,
    ...extra,
  });

  /** End the drag without changing the board. */
  const clearDrag = (notice = null) => ({ ...state, drag: null, notice });

  const withHoles = (id, holes) =>
    state.placements.map((placement) =>
      placement.id === id ? { ...placement, holes } : placement,
    );

  switch (action.type) {
    /** Picked a part up out of the tray. */
    case 'dragFromTray': {
      if (remainingOf(action.level, state.placements, action.componentType) <= 0) {
        return {
          ...state,
          notice: `You have used every ${label(action.componentType)} this level gives you.`,
        };
      }
      return {
        ...state,
        notice: null,
        drag: {
          source: 'tray',
          type: action.componentType,
          legIndex: 0,
          hole: null,
          // A part hauled out of the tray is a drag from the very first pixel;
          // there is nothing on the board yet for a tap to mean.
          moved: true,
          from: action.from ?? { x: 0, y: 0 },
        },
      };
    }

    /** Pressed on a part already on the board — body (legIndex null) or one leg. */
    case 'grabPart': {
      const placement = state.placements.find((item) => item.id === action.id);
      if (!placement) return state;
      const legIndex = action.legIndex ?? 0;
      return {
        ...state,
        notice: null,
        drag: {
          source: action.legIndex === null ? 'move' : 'leg',
          type: placement.type,
          id: placement.id,
          legIndex,
          origin: placement.holes,
          hole: placement.holes[legIndex],
          moved: false,
          from: action.from ?? { x: 0, y: 0 },
        },
      };
    }

    /** The pointer has travelled far enough that this is a drag, not a tap. */
    case 'dragMove':
      if (!state.drag || state.drag.moved) return state;
      return { ...state, drag: { ...state.drag, moved: true } };

    /** The pointer is over `hole` — or over nothing, if it left the board. */
    case 'dragOver': {
      if (!state.drag || state.drag.hole === action.hole) return state;
      return {
        ...state,
        drag: {
          ...state.drag,
          hole: action.hole,
          // Leaving the board is always deliberate, so it counts as movement.
          moved: state.drag.moved || action.hole === null,
        },
      };
    }

    /** Let go. Everything that changes the board happens here. */
    case 'drop': {
      const drag = state.drag;
      if (!drag) return state;

      // A press that never moved is a tap: flip a switch, do nothing else.
      if (!drag.moved) {
        if (drag.source === 'move' && drag.type === 'switch') {
          return reducer({ ...state, drag: null }, { ...action, type: 'toggleSwitch', id: drag.id });
        }
        return clearDrag();
      }

      /*
       * Dropped off the board: anything already placed comes away, whether you
       * had it by the body or by one leg. One rule, and it is the only way to
       * unplug a potentiometer with a pointer — its body is a knob, so it
       * cannot be grabbed. Undo puts it straight back.
       */
      if (!drag.hole) {
        if (drag.source === 'tray') return clearDrag(); // never placed — no-op
        // No notice: the player watched it happen, and saying so would hide the
        // fault line explaining what removing it did to the circuit.
        return commit(state.placements.filter((placement) => placement.id !== drag.id));
      }

      const holes = previewHoles(drag);
      if (!holes) return clearDrag('That does not fit on the board. Try further in.');
      if (new Set(holes).size !== holes.length) {
        return clearDrag('Two legs cannot go in the same hole. Drop it somewhere with room.');
      }

      if (drag.source === 'tray') {
        return commit([
          ...state.placements,
          {
            id: makeId(drag.type),
            type: drag.type,
            holes,
            state: initialPartState(drag.type),
          },
        ]);
      }

      // Nothing actually changed — do not burn an undo step on it.
      if (holes.every((id, i) => id === drag.origin[i])) return clearDrag();
      return commit(withHoles(drag.id, holes));
    }

    case 'dragCancel':
      return state.drag ? clearDrag() : state;

    /** Keyboard path: no pointer, so the board picks the spot. */
    case 'placeFromTray': {
      if (remainingOf(action.level, state.placements, action.componentType) <= 0) {
        return {
          ...state,
          notice: `You have used every ${label(action.componentType)} this level gives you.`,
        };
      }
      const holes = firstFreeFootprint(action.componentType, state.placements);
      if (!holes) return { ...state, notice: 'No room left on the board.' };
      return commit([
        ...state.placements,
        {
          id: makeId(action.componentType),
          type: action.componentType,
          holes,
          state: initialPartState(action.componentType),
        },
      ]);
    }

    /** Keyboard path: arrow keys walk a placed part around the board. */
    case 'nudge': {
      const placement = state.placements.find((item) => item.id === action.id);
      if (!placement) return state;
      const holes = placement.holes.map((id) => shiftHole(id, action.rows, action.cols));
      if (!holes.every(Boolean)) return state;
      return commit(withHoles(action.id, holes));
    }

    case 'remove':
      return commit(state.placements.filter((placement) => placement.id !== action.id));

    /** The knob on a potentiometer, 0 (no resistance) to 1 (all of it). */
    case 'setTurn': {
      const turn = Math.min(1, Math.max(0, Number(action.turn) || 0));
      return {
        ...state,
        placements: state.placements.map((placement) =>
          placement.id === action.id && placement.type === 'potentiometer'
            ? { ...placement, state: { ...placement.state, turn } }
            : placement,
        ),
        notice: null,
      };
    }

    case 'toggleSwitch':
      return {
        ...state,
        placements: state.placements.map((placement) =>
          placement.id === action.id && placement.type === 'switch'
            ? { ...placement, state: { ...placement.state, closed: !placement.state?.closed } }
            : placement,
        ),
        notice: null,
      };

    case 'undo': {
      if (state.history.length === 0) return { ...state, drag: null };
      const previous = state.history[state.history.length - 1];
      return {
        ...state,
        placements: previous,
        history: state.history.slice(0, -1),
        drag: null,
        notice: null,
      };
    }

    case 'reset':
      return initialState(action.level);

    case 'revealHint':
      return { ...state, hintsRevealed: Math.min(state.hintsRevealed + 1, action.total) };

    default:
      return state;
  }
}

/**
 * What a freshly placed part starts out as. A switch starts open; a dimmer
 * starts turned all the way down, which is its brightest setting.
 *
 * @param {string} type
 */
function initialPartState(type) {
  if (type === 'switch') return { closed: false };
  if (type === 'potentiometer') return { turn: 0 };
  return {};
}

/** The player-facing name of a part, for messages. */
function label(type) {
  return getComponent(type).label.toLowerCase();
}

/**
 * @param {Level} level
 */
export function useGameState(level) {
  const [state, rawDispatch] = useReducer(reducer, level, initialState);

  // Actions that need the level get it injected here, so callers never have to
  // remember to pass it.
  const dispatch = useCallback(
    (action) => rawDispatch({ ...action, level, total: level.hints.length }),
    [level],
  );

  // Escape always cancels whatever you were in the middle of.
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') dispatch({ type: 'dragCancel' });
      if ((event.key === 'z' || event.key === 'Z') && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        dispatch({ type: 'undo' });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [dispatch]);

  /*
   * A drag is owned by the window, not by whatever you pressed on. Letting go
   * anywhere ends it — including outside the browser window, which is exactly
   * when a drag stuck in the "on" position would be most annoying.
   */
  const dragging = Boolean(state.drag);
  const dragFrom = state.drag?.from;

  useEffect(() => {
    if (!dragging) return undefined;

    const onMove = (event) => {
      const far =
        Math.hypot(event.clientX - dragFrom.x, event.clientY - dragFrom.y) > DRAG_THRESHOLD;
      if (far) dispatch({ type: 'dragMove' });
    };
    const onUp = () => dispatch({ type: 'drop' });
    const onCancel = () => dispatch({ type: 'dragCancel' });

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
    };
  }, [dragging, dragFrom, dispatch]);

  const context = useMemo(() => simulateAll(state.placements), [state.placements]);

  const objectives = useMemo(
    () => level.objectives.map((objective) => ({ ...objective, passed: objective.check(context) })),
    [level.objectives, context],
  );

  const won = objectives.length > 0 && objectives.every((objective) => objective.passed);

  const preview = useMemo(() => previewHoles(state.drag), [state.drag]);

  return { state, dispatch, context, objectives, won, preview };
}
