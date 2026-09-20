/**
 * OWNER: Person B (Breadboard & Interaction)
 *
 * Draws the board and turns pointer movement into hole ids. It knows nothing
 * about game rules and nothing about electricity — it renders whatever
 * CircuitResult it is handed and never computes one. Keep it that way.
 *
 * Dragging is deliberately split in two: this file only ever reports "the
 * pointer is over hole X" and "the player grabbed part Y". What that means —
 * where the part lands, whether it fits — is the game's business, in
 * game/useGameState.js. That is why there is no coordinate maths here.
 *
 * The one feature here that does the most teaching is the strip highlight:
 * hover any hole and every hole already joined to it by the copper inside the
 * board lights up. That single interaction explains a breadboard faster than
 * any paragraph, so it survives even if the artwork changes.
 *
 * ARTWORK: if public/assets/breadboard/breadboard.png exists it is drawn under
 * the holes and the plain SVG board is hidden. See boardSkin.js for how to line
 * it up. With no image present the drawn board is used and nothing breaks.
 */

import { useMemo, useRef, useState } from 'react';
import { COLUMNS, MAIN_ROWS, RAILS, hole, internalStrips, railHole } from '../shared/holes.js';
import { Part } from '../components/library/Part.jsx';
import { CalibrationPanel } from './CalibrationPanel.jsx';
import { SKIN_IMAGE, calibrationRequested, loadSkin, saveSkin } from './boardSkin.js';
import { useImageAvailable } from './useImageAvailable.js';
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  MARGIN,
  PITCH,
  channelBand,
  holeCenter,
  rowY,
} from './geometry.js';
import './Breadboard.css';

const LABELLED_COLUMNS = [1, 5, 10, 15, 20, 25, 30];
const PAD = 7;

/**
 * @param {object} props
 * @param {import('../shared/types.js').Placement[]} props.placements
 * @param {import('../shared/types.js').CircuitResult} props.result
 * @param {import('../game/useGameState.js').Drag | null} [props.drag]
 * @param {string[] | null} [props.preview]  Where the dragged part would land
 * @param {(hole: string | null) => void} [props.onHoleOver]
 * @param {(id: string, legIndex: number | null, from: object) => void} [props.onGrabPart]
 * @param {(id: string, event: KeyboardEvent) => void} [props.onPartKeyDown]
 * @param {(id: string, turn: number) => void} [props.onPartTurn]
 * @param {string|null} [props.highlightedComponent]
 */
export function Breadboard({
  placements = [],
  result,
  drag = null,
  preview = null,
  onHoleOver,
  onGrabPart,
  onPartKeyDown,
  onPartTurn,
  highlightedComponent = null,
}) {
  const [hovered, setHovered] = useState(null);
  const [skin, setSkin] = useState(loadSkin);
  const calibrating = useMemo(() => calibrationRequested(), []);
  const boardRef = useRef(null);

  // A drag that has travelled far enough to be aiming at a hole.
  const aiming = Boolean(drag?.moved);

  const imageAvailable = useImageAvailable(SKIN_IMAGE);
  const skinned = imageAvailable === true;
  const channel = channelBand();

  const updateSkin = (next) => {
    setSkin(next);
    saveSkin(next);
  };

  // hole id -> the set of holes it is already joined to inside the board.
  const stripOf = useMemo(() => {
    const map = new Map();
    for (const strip of internalStrips()) {
      const set = new Set(strip);
      for (const id of strip) map.set(id, set);
    }
    return map;
  }, []);

  const highlighted = hovered ? stripOf.get(hovered) : null;

  const faultedIds = useMemo(
    () => new Set((result?.faults ?? []).flatMap((fault) => fault.placementIds)),
    [result],
  );

  const targeted = useMemo(() => new Set(preview ?? []), [preview]);

  /**
   * One handler for both jobs a hole has: lighting up its strip on hover, and
   * telling the drag where it is aiming. They are the same gesture.
   */
  const enterHole = (id) => {
    setHovered(id);
    onHoleOver?.(id);
  };

  /**
   * pointerout bubbles, so this fires for every hole. Only the one that leaves
   * the board entirely counts — otherwise moving between two holes would look
   * like dropping the part in mid-air.
   */
  const handlePointerOut = (event) => {
    const next = event.relatedTarget;
    if (next && boardRef.current?.contains(next)) return;
    setHovered(null);
    onHoleOver?.(null);
  };

  const renderHole = (id) => (
    <Hole
      key={id}
      id={id}
      inStrip={highlighted?.has(id) ?? false}
      isTarget={targeted.has(id)}
      armed={aiming}
      onEnter={enterHole}
    />
  );

  return (
    <div className="breadboard-wrap">
      <svg
        ref={boardRef}
        className="breadboard"
        viewBox={`${-PAD} ${-PAD} ${BOARD_WIDTH + PAD * 2} ${BOARD_HEIGHT + PAD * 2}`}
        role="group"
        aria-label="Breadboard"
        data-armed={aiming}
        data-skinned={skinned}
        onPointerOut={handlePointerOut}
      >
        <defs>
          <filter id="led-glow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="1.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {skinned ? (
          <image
            href={SKIN_IMAGE}
            x={skin.x}
            y={skin.y}
            width={skin.width}
            opacity={skin.opacity}
            preserveAspectRatio="xMidYMid meet"
          />
        ) : (
          <>
            <rect className="breadboard__body" width={BOARD_WIDTH} height={BOARD_HEIGHT} rx="2" />

            {/* Rails run the full width — that is the whole point of a rail. */}
            {RAILS.map((rail) => (
              <line
                key={`stripe-${rail}`}
                className="breadboard__rail-stripe"
                data-polarity={rail.endsWith('P') ? 'pos' : 'neg'}
                x1={MARGIN - 3}
                x2={BOARD_WIDTH - MARGIN + 3}
                y1={rowY(rail)}
                y2={rowY(rail)}
              />
            ))}

            <rect
              className="breadboard__channel"
              x="0"
              y={channel.y}
              width={BOARD_WIDTH}
              height={channel.height}
            />
          </>
        )}

        {/* Column numbers along the top */}
        {LABELLED_COLUMNS.map((col) => (
          <text
            key={`col-${col}`}
            className="breadboard__label"
            x={MARGIN + (col - 1) * PITCH}
            y={-2}
            textAnchor="middle"
          >
            {col}
          </text>
        ))}

        {/* Row letters down both sides */}
        {MAIN_ROWS.map((row) => (
          <g key={`row-${row}`}>
            <text className="breadboard__label" x={-2.5} y={rowY(row) + 0.9} textAnchor="middle">
              {row}
            </text>
            <text
              className="breadboard__label"
              x={BOARD_WIDTH + 2.5}
              y={rowY(row) + 0.9}
              textAnchor="middle"
            >
              {row}
            </text>
          </g>
        ))}

        {RAILS.map((rail) => (
          <text
            key={`rail-label-${rail}`}
            className="breadboard__label breadboard__label--rail"
            data-polarity={rail.endsWith('P') ? 'pos' : 'neg'}
            x={-2.5}
            y={rowY(rail) + 0.9}
            textAnchor="middle"
          >
            {rail.endsWith('P') ? '+' : '−'}
          </text>
        ))}

        <g className="breadboard__holes">
          {RAILS.flatMap((rail) =>
            Array.from({ length: COLUMNS }, (_, i) => renderHole(railHole(rail, i + 1))),
          )}
          {MAIN_ROWS.flatMap((row) =>
            Array.from({ length: COLUMNS }, (_, i) => renderHole(hole(row, i + 1))),
          )}
        </g>

        <g className="breadboard__parts">
          {placements.map((placement) => (
            <Part
              key={placement.id}
              placement={placement}
              result={result?.components?.[placement.id]}
              faulted={faultedIds.has(placement.id)}
              dragging={drag?.id === placement.id && aiming}
              highlighted={placement.type === highlightedComponent}
              onGrab={onGrabPart}
              onKeyDown={onPartKeyDown}
              onTurn={onPartTurn}
            />
          ))}
        </g>

        {/* Where it would land if you let go now. */}
        {preview && (
          <g className="breadboard__ghost">
            <Part ghost placement={{ id: 'drop-preview', type: drag.type, holes: preview }} />
          </g>
        )}
      </svg>

      {calibrating && <CalibrationPanel skin={skin} onChange={updateSkin} imageFound={skinned} />}
    </div>
  );
}

function Hole({ id, inStrip, isTarget, armed, onEnter }) {
  const center = holeCenter(id);
  if (!center) return null;
  return (
    <g
      className="hole"
      data-hole={id}
      data-in-strip={inStrip}
      data-target={isTarget}
      onPointerOver={() => onEnter(id)}
    >
      {/* Generous invisible hit target — the real hole is under 1 mm across. */}
      <circle cx={center.x} cy={center.y} r={PITCH * 0.5} className="hole__hit" data-armed={armed} />
      <circle cx={center.x} cy={center.y} r={PITCH * 0.28} className="hole__dot" />
      {isTarget && (
        <circle cx={center.x} cy={center.y} r={PITCH * 0.45} className="hole__target" />
      )}
      <title>{id}</title>
    </g>
  );
}
