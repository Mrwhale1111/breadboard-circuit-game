/**
 * OWNER: Person C (behaviour) / Person D (art + copy)
 *
 * The parts bin, drawn as the open toolbox from
 * public/assets/backgrounds/toolbox.png. Parts sit in slots inside the box;
 * drag one out and onto the board.
 *
 * Each slot shows a picture and nothing else — the name, the count and the
 * blurb appear in the caption under the box when you hover or tab to a slot.
 * Person D: that blurb is still where most of the teaching lands, so it stays
 * one plain sentence. It is only hidden until asked for, not cut.
 *
 * The art is optional in both places. No toolbox.png and the tray falls back to
 * the plain glass panel; no component PNG and the slot draws the part's own SVG.
 *
 * It is still a <button>, not a bare <div>, because the keyboard path runs
 * through it: pressing Enter drops the part onto the first free spot, and from
 * there the arrow keys move it. Drag for speed, keys for reach.
 */

import { useState } from 'react';
import { PartIcon } from '../components/library/Part.jsx';
import { TOOLBOX_IMAGE, componentImage, slotScale } from '../content/assets.js';
import { getComponent } from '../content/components.js';
import { useImageAvailable } from '../breadboard/useImageAvailable.js';
import { remainingOf } from '../game/useGameState.js';
import { releaseImplicitCapture } from '../shared/pointer.js';

/**
 * @param {object} props
 * @param {import('../shared/types.js').Level} props.level
 * @param {import('../shared/types.js').Placement[]} props.placements
 * @param {import('../game/useGameState.js').Drag | null} props.drag
 * @param {(type: string, from: {x: number, y: number}) => void} props.onGrab
 * @param {(type: string) => void} props.onPlace
 */
export function Tray({
  level,
  placements,
  drag,
  onGrab,
  onPlace,
  highlightedComponent,
  onInspect,
}) {
  const [hovered, setHovered] = useState(null);
  const skinned = useImageAvailable(TOOLBOX_IMAGE) === true;

  // What the caption is talking about: whatever you are pointing at, or
  // whatever you are dragging once you have picked something up.
  const described = (drag?.source === 'tray' ? drag.type : null) ?? hovered ?? highlightedComponent;

  return (
    <section className={skinned ? 'tray' : 'tray panel'}>
      <h2 className={skinned ? 'visually-hidden' : undefined}>Parts</h2>

      <div
        className="tray__box"
        data-toolbox={skinned}
        style={skinned ? { backgroundImage: `url(${TOOLBOX_IMAGE})` } : undefined}
      >
        <ul className="tray__slots">
          {level.tray.map((item) => {
            const def = getComponent(item.type);
            const left = remainingOf(level, placements, item.type);
            const exhausted = left <= 0;
            const dragging = drag?.source === 'tray' && drag.type === item.type;

            return (
              <li
                className="tray__slot"
                key={item.type}
                style={{ '--slot-scale': slotScale(item.type) }}
              >
                <button
                  type="button"
                  className="tray__item"
                  data-part={item.type}
                  data-dragging={dragging}
                  data-highlighted={highlightedComponent === item.type}
                  disabled={exhausted}
                  aria-label={`${def.label}. ${left === Infinity ? 'Unlimited' : left} left. ${def.blurb}`}
                  onPointerEnter={() => setHovered(item.type)}
                  onPointerLeave={() => setHovered((current) => (current === item.type ? null : current))}
                  onFocus={() => setHovered(item.type)}
                  onBlur={() => setHovered((current) => (current === item.type ? null : current))}
                  onPointerDown={(event) => {
                    if (event.button > 0) return;
                    event.preventDefault();
                    releaseImplicitCapture(event);
                    onGrab(item.type, { x: event.clientX, y: event.clientY });
                  }}
                  /*
                   * detail === 0 means the click came from the keyboard, not from
                   * a pointer. A mouse press here has already started a drag, so
                   * without this guard letting go would place a second part.
                   */
                  onClick={(event) => {
                    onInspect?.(item.type);
                    if (event.detail === 0) onPlace(item.type);
                  }}
                >
                  <PartArt type={item.type} />
                  <span className="tray__count" aria-hidden="true">
                    {left === Infinity ? '∞' : left}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="tray__caption" aria-live="polite">
        {described ? <Caption type={described} /> : <Howto drag={drag} />}
      </p>
    </section>
  );
}

/** The picture in a slot: the PNG if it is there, the drawn part if it is not. */
function PartArt({ type }) {
  const [failed, setFailed] = useState(false);
  const src = componentImage(type);

  if (!src || failed) return <PartIcon type={type} className="tray__art" />;

  return (
    <img
      className="tray__art"
      src={src}
      alt=""
      draggable="false"
      onError={() => setFailed(true)}
    />
  );
}

function Caption({ type }) {
  const def = getComponent(type);
  return (
    <>
      <strong className="tray__name">{def.label}</strong> {def.blurb}
    </>
  );
}

function Howto({ drag }) {
  if (drag?.source === 'tray') return 'Drop it on a hole. The ghost shows where it lands.';
  if (drag) return 'Drop it on a hole, or off the board to take it away.';
  return 'Drag a part onto the board. Drag its ends to move one leg.';
}
