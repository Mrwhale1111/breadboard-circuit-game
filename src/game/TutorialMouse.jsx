/**
 * OWNER: Person D (copy + art) / Person C (layout)
 *
 * The mouse from the title screen, teaching the board. It comes back several
 * times as the player gets further, and it takes one of three positions:
 *
 *   'beside'   left of the toolbox, text above its head pointing down at it
 *   'perched'  sat on top of the toolbox, text to the left pointing across
 *   'over'     laid across the board itself: mouse at the left-hand edge,
 *              text on the bottom half
 *
 * It takes a layout rather than a stage on purpose. Stages that only change
 * what is said reuse a position that already exists, and the mouse does not
 * need to know which milestone it is talking about — see game/tutorialStage.js
 * for which stage stands where, and which is due.
 *
 * The first two mount in the sidebar beside the toolbox and 'over' mounts
 * inside the board, so PuzzlePanel picks the mount point: it is the only thing
 * that knows where those places are. No animation, nothing to click.
 *
 * THE COPY LIVES IN content/tutorial.js, not here. Rewrite it there and
 * nothing in this file has to change.
 */

import { MOUSE_SPRITE } from '../menu/MainMenu.jsx';
import { useImageAvailable } from '../breadboard/useImageAvailable.js';
import './TutorialMouse.css';

/**
 * @param {object} props
 * @param {'beside'|'perched'|'over'|null} props.layout  Where it stands, or
 *                                        null to keep it off screen.
 * @param {string[]} props.lines  What it says this time round.
 */
export function TutorialMouse({ layout, lines = [] }) {
  const hasMouse = useImageAvailable(MOUSE_SPRITE) === true;
  if (!layout || lines.length === 0) return null;

  const box = (
    <aside className={`tutor__box tutor__box--${layout}`} aria-label="How to play">
      {lines.map((line) => (
        <p className="tutor__line" key={line}>
          {line}
        </p>
      ))}
    </aside>
  );

  const mouse = hasMouse ? (
    <img className="tutor__mouse" src={MOUSE_SPRITE} alt="" aria-hidden="true" />
  ) : null;

  /*
   * Beside the toolbox: one column of its own, so the box stacks above the
   * mouse and the whole thing is a single item in the sidebar row.
   */
  if (layout === 'beside') {
    return (
      <div className="tutor tutor--beside">
        {box}
        {mouse}
      </div>
    );
  }

  /*
   * Across the board: one absolutely positioned layer over it, with the mouse
   * at the left-hand edge and the text filling the bottom half beside it.
   */
  if (layout === 'over') {
    return (
      <div className="tutor tutor--over">
        {box}
        {mouse}
      </div>
    );
  }

  /*
   * On top of the toolbox: two separate pieces. The box is an ordinary item
   * in the sidebar row and lands left of the toolbox on its own; the mouse is
   * lifted out of the flow and parked over it, because perching on something
   * means overlapping it and flow layout cannot overlap.
   */
  return (
    <>
      {box}
      {mouse && (
        <div className="tutor__perch" aria-hidden="true">
          {mouse}
        </div>
      )}
    </>
  );
}
