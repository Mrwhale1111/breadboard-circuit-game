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

import { useEffect, useRef, useState } from 'react';
import { useGameState } from '../game/useGameState.js';
import { PuzzlePanel } from '../game/PuzzlePanel.jsx';
import { DialogueBox } from './DialogueBox.jsx';
import { Scene } from './Scene.jsx';
import { useStory } from './useStory.js';
import './story.css';

/** How dark "dark" is. Not zero — the player still needs to see the furniture. */
const DARK = 0.07;

/**
 * How long the fade to black runs on an `autoAdvance` puzzle before the next
 * level opens. Long enough to sit with what just happened, short enough that
 * it does not feel like the game has hung.
 *
 * The overlay is handed this as a custom property, so this is the only place
 * the number lives — the CSS cannot drift out of step with the timer.
 */
export const FADE_MS = 2200;

/**
 * @param {object} props
 * @param {import('../shared/types.js').Level} props.level
 * @param {{ id: string, title: string, chapter?: string, beats: any[] }} props.story
 * @param {{ label: string, onSelect: () => void } | null} [props.nextLevel]
 *   Offered on the story's end beat. Null on the last level.
 * @param {() => void} [props.onMenu] Return to the title screen.
 * @param {string|null} [props.highlightedComponent]
 * @param {(type: string) => void} [props.onHighlightComponent]
 * @param {import('react').ReactNode} [props.levelNav]  Level picker shown in the header.
 */
export function StoryScreen({
  level,
  story,
  nextLevel = null,
  onMenu,
  highlightedComponent = null,
  onHighlightComponent,
  levelNav = null,
}) {
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

  /*
   * Some puzzles do not ask. Level 1 ends by blinding the player, so instead
   * of a "Continue" button the screen fades out and the next level takes over
   * by itself — see the `autoAdvance` beat in level1Story.js.
   *
   * The callback goes through a ref because App builds `nextLevel` fresh on
   * every render: depending on the object directly would restart the timer on
   * every render and it would never fire.
   */
  const autoAdvance = beat.autoAdvance === true && Boolean(nextLevel);
  const fading = autoAdvance && canContinue;
  const onNext = nextLevel?.onSelect;
  const onNextRef = useRef(onNext);
  const [faded, setFaded] = useState(false);

  useEffect(() => {
    onNextRef.current = onNext;
  }, [onNext]);

  useEffect(() => {
    if (!fading) return undefined;
    const timer = window.setTimeout(() => {
      setFaded(true);
      onNextRef.current?.();
    }, FADE_MS);
    return () => window.clearTimeout(timer);
  }, [fading]);

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
            <PuzzlePanel
              level={level}
              game={game}
              highlightedComponent={highlightedComponent}
              onHighlightComponent={onHighlightComponent}
            />
            {canContinue && !autoAdvance && (
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

      {/* Over everything, including the board — the player is done here. */}
      {fading && (
        <div
          className="story__fade"
          data-held={faded || undefined}
          style={{ '--story-fade-ms': `${FADE_MS}ms` }}
        />
      )}
    </Scene>
  );
}
