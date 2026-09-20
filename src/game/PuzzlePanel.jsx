/**
 * OWNER: Person C (layout & wiring) — the three subsystems meet here.
 *
 * Presentational on purpose: it does not own game state. StoryScreen calls
 * useGameState and hands the result down, because the story needs to read the
 * circuit too (to know how bright the room is). One owner, two readers.
 *
 * B's board events go in through dispatch. A's CircuitResult comes back out and
 * drives what B renders and what the player is told.
 */

import { Breadboard } from '../breadboard/Breadboard.jsx';
import { TUTORIAL_LAYOUT, tutorialStageFor } from './tutorialStage.js';
// Paired with the commented-out panels in the sidebar below — put both back together.
// import { HintPanel } from '../ui/HintPanel.jsx';
// import { ObjectiveList } from '../ui/ObjectiveList.jsx';
import { Knob } from '../ui/Knob.jsx';
import { TutorialMouse } from './TutorialMouse.jsx';
import { Tray } from '../ui/Tray.jsx';
import './PuzzlePanel.css';

/**
 * @param {object} props
 * @param {import('../shared/types.js').Level} props.level
 * @param {ReturnType<typeof import('./useGameState.js').useGameState>} props.game
 */
export function PuzzlePanel({ level, game }) {
  // `objectives` comes back out of here too — the ObjectiveList below is
  // commented out for now, so nothing reads it in this file.
  const { state, dispatch, context, preview } = game;

  /**
   * The keyboard equivalent of dragging: arrows nudge, Delete removes, Enter
   * flips a switch. Everything a pointer can do to a placed part, minus speed.
   */
  const handlePartKeyDown = (id, event) => {
    const step = NUDGE[event.key];
    if (step) {
      event.preventDefault();
      dispatch({ type: 'nudge', id, ...step });
      return;
    }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      dispatch({ type: 'remove', id });
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      dispatch({ type: 'toggleSwitch', id });
    }
  };

  const status = state.notice ?? statusLine(context.result);
  const tutorialStage = level.tutorial ? tutorialStageFor(state.placements, state.touched) : null;
  const tutorialLines = tutorialStage ? level.tutorial[tutorialStage] : null;
  const tutorialLayout = tutorialStage ? TUTORIAL_LAYOUT[tutorialStage] : null;
  const knobs = state.placements.filter((placement) => placement.type === 'potentiometer');

  return (
    <div className="puzzle">
      <div className="puzzle__board">
        <Breadboard
          placements={state.placements}
          result={context.result}
          drag={state.drag}
          preview={preview}
          onHoleOver={(hole) => dispatch({ type: 'dragOver', hole })}
          onGrabPart={(id, legIndex, from) => dispatch({ type: 'grabPart', id, legIndex, from })}
          onPartKeyDown={handlePartKeyDown}
          onPartTurn={(id, turn) => dispatch({ type: 'setTurn', id, turn })}
        />

        {tutorialLayout === 'over' && <TutorialMouse layout="over" lines={tutorialLines} />}

        {knobs.length > 0 && (
          <div className="puzzle__knobs">
            {knobs.map((placement) => (
              <Knob
                key={placement.id}
                placement={placement}
                result={context.result.components[placement.id]}
                onTurn={(turn) => dispatch({ type: 'setTurn', id: placement.id, turn })}
              />
            ))}
          </div>
        )}

        <div className="puzzle__toolbar">
          <button
            type="button"
            className="button--ghost"
            onClick={() => dispatch({ type: 'undo' })}
            disabled={state.history.length === 0}
          >
            Undo
          </button>
          <button
            type="button"
            className="button--ghost"
            onClick={() => dispatch({ type: 'reset' })}
            disabled={state.placements.length === 0}
          >
            Clear board
          </button>
          <span className="puzzle__tip">
            Drag parts to move them. Drag one off the board to remove it. Tap a switch to flip it.
            {knobs.length > 0 && ' Drag the dimmer up for brighter, down for dimmer.'}
          </span>
        </div>

        <p
          className="puzzle__status"
          data-tone={toneOf(context.result, state.notice)}
          aria-live="polite"
        >
          {status}
        </p>
      </div>

      <aside className="puzzle__sidebar">
        {tutorialLayout && tutorialLayout !== 'over' && (
          <TutorialMouse layout={tutorialLayout} lines={tutorialLines} />
        )}
        <Tray
          level={level}
          placements={state.placements}
          drag={state.drag}
          onGrab={(componentType, from) => dispatch({ type: 'dragFromTray', componentType, from })}
          onPlace={(componentType) => dispatch({ type: 'placeFromTray', componentType })}
        />
        {/*
          TEMPORARILY OFF — the sidebar is the toolbox and nothing else while the
          art is being worked out. Both panels still work; uncomment them (and
          their imports at the top of this file) to bring them back. The state
          behind them is untouched: useGameState still tracks objectives and
          hintsRevealed, and the story still reads `won` to unblock itself.

        <ObjectiveList objectives={objectives} />
        <HintPanel
          hints={level.hints}
          revealed={state.hintsRevealed}
          onReveal={() => dispatch({ type: 'revealHint' })}
        />
        */}
      </aside>
    </div>
  );
}

/**
 * One line of coaching. Show the first fault only — four red messages at once
 * teaches nothing.
 *
 * @param {import('../shared/types.js').CircuitResult} result
 */
function statusLine(result) {
  if (result.faults.length > 0) return result.faults[0].message;
  if (result.complete) return 'Current is flowing all the way round the loop.';
  return 'The board is empty. Start with the battery — nothing moves without it.';
}

/** Arrow keys, in board terms: rows down the board, columns across it. */
const NUDGE = {
  ArrowUp: { rows: -1, cols: 0 },
  ArrowDown: { rows: 1, cols: 0 },
  ArrowLeft: { rows: 0, cols: -1 },
  ArrowRight: { rows: 0, cols: 1 },
};

function toneOf(result, notice) {
  if (notice) return 'warn';
  if (result.shorted) return 'error';
  if (result.faults.length > 0) return 'warn';
  if (result.complete) return 'ok';
  return 'neutral';
}
