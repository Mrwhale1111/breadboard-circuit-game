/**
 * OWNER: Person C (Game Shell & Story)
 *
 * The director. This is the one file that knows about both the story and the
 * circuit, and it is where they meet:
 *
 *   circuit result  ->  how bright the room is
 *   circuit solved  ->  the story is allowed to move on
 *
 * Everything else stays ignorant of the other half. The engine has never heard
 * of a living room; the story has never heard of Ohm's law.
 */

import { useGameState } from '../game/useGameState.js';
import { PuzzlePanel } from '../game/PuzzlePanel.jsx';
import { DialogueBox } from './DialogueBox.jsx';
import { Scene } from './Scene.jsx';
import { useStory } from './useStory.js';
import './story.css';

/** How dark "dark" is. Not zero — the player still needs to see the furniture. */
const DARK = 0.07;

/**
 * @param {object} props
 * @param {import('../shared/types.js').Level} props.level
 * @param {{ id: string, title: string, chapter?: string, beats: any[] }} props.story
 * @param {{ label: string, onSelect: () => void } | null} [props.nextLevel]
 *   Offered on the story's end beat. Null on the last level.
 * @param {() => void} [props.onMenu] Return to the title screen.
 * @param {import('react').ReactNode} [props.levelNav]  Level picker shown in the header.
 */
export function StoryScreen({ level, story, nextLevel = null, onMenu, levelNav = null }) {
  const { beat, visibleLines, hasMoreLines, advance, restart } = useStory(story);
  const game = useGameState(level);
  const { context } = game;

  const isPuzzle = beat.mode === 'puzzle';
  const isCinematic = beat.cinematic === true;

  /*
   * The room follows the LED *right now* — not whether the puzzle is solved.
   * Those are different questions, and conflating them costs the level its
   * point: with a correct circuit and the switch flipped off, the room must go
   * dark again. That is the whole lesson about what a switch is.
   *
   * An LED with nothing limiting its current is not dark — it is far too
   * bright, right up until it dies. So an over-driven LED lights the room too,
   * with a glare on top. Level 2 is built on that difference.
   *
   * A lit LED is only as bright as the current through it, so the room follows
   * that too. Level 3's dimmer is built on that.
   */
  const parts = Object.values(context.result.components);
  const roomLit = parts.some((part) => part.lit === true);
  const roomGlare = parts.some((part) => part.burnedOut === true);
  const brightness = parts.reduce(
    (max, part) => (part.lit === true ? Math.max(max, part.brightness ?? 1) : max),
    0,
  );

  /*
   * You may move on once the circuit is right AND the light is actually on.
   * An over-driven LED counts: level 1 has no resistor to tame it, so its
   * light arrives as glare, and refusing that would leave the level unfinishable.
   */
  const canContinue = game.won && (roomLit || roomGlare);

  const liveLight = roomGlare ? 1 : roomLit ? DARK + (1 - DARK) * brightness : DARK;
  const light = isPuzzle ? liveLight : (beat.light ?? 1);
  const glare = isPuzzle ? (roomGlare ? 1 : 0) : (beat.glare ?? 0);

  return (
    <Scene
      key={beat.background}
      name={beat.background}
      light={light}
      glare={glare}
      effects={!isCinematic}
    >
      <div className="story" data-mode={beat.mode} data-cinematic={isCinematic}>
        {!isCinematic && <header className="story__header">
          <div>
            <span className="story__chapter">{story.chapter ?? level.title}</span>
            <h1>{story.title}</h1>
          </div>
          {levelNav}
        </header>}

        {isCinematic ? (
          <div className="story__cinematic">
            {beat.next ? (
              <button type="button" onClick={advance}>{beat.advance ?? 'Continue'}</button>
            ) : (
              <button type="button" className="story__menu-button" onClick={onMenu ?? restart}>
                Back to Menu
              </button>
            )}
          </div>
        ) : isPuzzle ? (
          <>
            <DialogueBox lines={visibleLines} dimmed />
            <PuzzlePanel level={level} game={game} />
            {canContinue && (
              <div className="story__resolve">
                <p>{beat.resolve ?? 'The circuit works.'}</p>
                <button type="button" onClick={advance}>
                  {beat.resolveLabel ?? 'Continue'}
                </button>
              </div>
            )}
          </>
        ) : (
          <DialogueBox
            lines={visibleLines}
            hasMoreLines={hasMoreLines}
            advanceLabel={beat.advance}
            onAdvance={beat.advance || hasMoreLines ? advance : undefined}
          />
        )}

        {!isCinematic && beat.mode === 'end' && !hasMoreLines && (
          <div className="story__end">
            <p className="story__end-label">End of {story.chapter ?? level.title}</p>
            <p className="story__end-note">
              {nextLevel
                ? 'The story continues in the next level.'
                : 'That is every level there is — for now.'}
            </p>
            <div className="story__end-actions">
              {nextLevel && (
                <button
                  type="button"
                  className={beat.blankNextLevelButton ? 'story__blank-continue' : undefined}
                  aria-label={beat.blankNextLevelButton ? nextLevel.label : undefined}
                  onClick={nextLevel.onSelect}
                >
                  {beat.blankNextLevelButton ? null : nextLevel.label}
                </button>
              )}
              <button type="button" className="button--ghost" onClick={restart}>
                Play {story.chapter ?? level.title} again
              </button>
            </div>
          </div>
        )}
      </div>
    </Scene>
  );
}
