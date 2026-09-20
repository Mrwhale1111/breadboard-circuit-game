/**
 * OWNER: Person D (art) — working placeholder art, replace freely.
 *
 * Renders one placed component across the holes it is plugged into — two for
 * most parts, three for a potentiometer. Everything is drawn in board
 * millimetres, inside the breadboard's own SVG, so one hole pitch is 2.54.
 *
 * The visual job of this file is to make three things unmistakable at a glance:
 *   - which way round a polarized part goes (the LED lesson)
 *   - whether a switch is open or closed
 *   - whether the LED is lit, dark, or burnt out
 *
 * Person D: keep those three readable and the rest is yours to prettify.
 */

import { useRef } from 'react';
import { PITCH, holeCenter } from '../../breadboard/geometry.js';
import { useImageAvailable } from '../../breadboard/useImageAvailable.js';
import { artAnchors, boardArt } from '../../content/assets.js';
import { releaseImplicitCapture } from '../../shared/pointer.js';

/** @typedef {import('../../shared/types.js').Placement} Placement */
/** @typedef {import('../../shared/types.js').PlacementResult} PlacementResult */

/**
 * @param {object} props
 * @param {Placement} props.placement
 * @param {PlacementResult} [props.result]
 * @param {boolean} [props.faulted]
 * @param {boolean} [props.dragging]  This part is the one being dragged
 * @param {boolean} [props.ghost]     A preview of where a drop would land
 * @param {boolean} [props.highlighted] This component type is being explained
 * @param {(id: string, legIndex: number | null, from: {x: number, y: number}) => void} [props.onGrab]
 * @param {(id: string, event: KeyboardEvent) => void} [props.onKeyDown]
 * @param {(id: string, turn: number) => void} [props.onTurn]  potentiometer only
 */
export function Part({
  placement,
  result,
  faulted = false,
  dragging = false,
  ghost = false,
  highlighted = false,
  onGrab,
  onKeyDown,
  onTurn,
}) {
  const knob = useKnobDrag(placement, ghost ? undefined : onTurn);
  const art = boardArt(placement);
  const artReady = useImageAvailable(art?.src ?? '') === true;
  const drawn = art && artReady ? art : null;
  const points = placement.holes.map((id) => holeCenter(id));
  if (points.length < 2 || points.some((point) => !point)) return null;
  const from = points[0];
  const to = points[points.length - 1];

  // Legs between the two ends — a potentiometer's wiper — run their own lead
  // out to the body, because the body only reaches as far as the outer two.
  const innerLegs = points.slice(1, -1);

  const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
  const angle = (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;

  /*
   * Parts are drawn along the line from leg 0 to leg 1, which points backwards
   * whenever leg 1 is to the left — near the right edge of the board, say. Left
   * alone that stands the whole drawing on its head. So the body always uses
   * the forward-facing angle, and `sign` tells it which end leg 0 is now at, so
   * the + and − markings stay on the right legs.
   */
  const backwards = Math.abs(angle) > 90;
  const bodyAngle = backwards ? angle - Math.sign(angle) * 180 : angle;
  const sign = backwards ? -1 : 1;

  const className = [
    'part',
    `part--${placement.type}`,
    faulted ? 'part--faulted' : '',
    result?.energized ? 'part--energized' : '',
    dragging ? 'part--dragging' : '',
    ghost ? 'part--ghost' : '',
    highlighted ? 'part--highlighted' : '',
  ]
    .filter(Boolean)
    .join(' ');

  /**
   * Pressing the body grabs the whole part; pressing an end handle grabs just
   * that leg. `legIndex === null` means "the body" — the reducer reads it that
   * way, so we have to pass null explicitly rather than letting it default.
   */
  const grab = (legIndex) => (event) => {
    if (!onGrab || event.button > 0) return;
    event.stopPropagation();
    event.preventDefault();
    releaseImplicitCapture(event);
    onGrab(placement.id, legIndex, { x: event.clientX, y: event.clientY });
  };

  const shared = {
    className,
    'data-placement': placement.id,
    'data-holes': placement.holes.join(','),
    'data-dragging': dragging || undefined,
    onKeyDown: ghost || !onKeyDown ? undefined : (event) => onKeyDown(placement.id, event),
    tabIndex: ghost ? undefined : 0,
    role: ghost ? undefined : 'button',
    'aria-label': ghost ? undefined : ariaLabel(placement),
    /*
     * A potentiometer's body IS its knob, so dragging it turns it instead of
     * moving it — you cannot have one gesture mean both. Its end handles still
     * move it, as do the arrow keys.
     */
    ...(knob.active ? knob.handlers : { onPointerDown: ghost ? undefined : grab(null) }),
  };

  const handles = ghost
    ? null
    : points.map((at, index) => (
        <LegHandle key={index} index={index} at={at} onPointerDown={grab(index)} />
      ));

  if (placement.type === 'wire') {
    return (
      <g {...shared}>
        <path d={sag(from, to)} className="part__wire" stroke={wireColour(placement)} />
        <path d={sag(from, to)} className="part__hit" />
        {handles}
      </g>
    );
  }

  return (
    <g {...shared}>
      {/*
        A drawing knows where its own legs are, so it runs its leads out to the
        holes itself. The plain SVG parts have no legs of their own and just
        take the straight line between the two.
      */}
      {!drawn && <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} className="part__lead" />}
      {innerLegs.map((at, index) => (
        <line
          key={index}
          x1={mid.x}
          y1={mid.y}
          x2={at.x}
          y2={at.y}
          className="part__lead part__lead--wiper"
        />
      ))}
      <g transform={`translate(${mid.x} ${mid.y}) rotate(${bodyAngle})`}>
        {drawn ? (
          <ArtBody
            art={drawn}
            placement={placement}
            result={result}
            sign={sign}
            reach={Math.hypot(to.x - from.x, to.y - from.y) / 2}
          />
        ) : (
          <DrawnBody placement={placement} result={result} sign={sign} />
        )}
      </g>
      <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} className="part__hit" />
      {handles}
    </g>
  );
}

/**
 * The grab dot on each end of a part. Invisible until you hover the part, then
 * it says "this end moves on its own" without a word of explanation.
 */
function LegHandle({ index, at, onPointerDown }) {
  return (
    <circle
      cx={at.x}
      cy={at.y}
      r={PITCH * 0.55}
      className="part__leg"
      data-leg={index}
      onPointerDown={onPointerDown}
    />
  );
}

function ariaLabel(placement) {
  const where = placement.holes.join(' to ');
  if (placement.type === 'switch') {
    return `Switch at ${where}, ${placement.state?.closed ? 'closed' : 'open'}. Enter to flip, arrow keys to move, Delete to remove.`;
  }
  if (placement.type === 'potentiometer') {
    const percent = Math.round((placement.state?.turn ?? 0) * 100);
    const [a, wiper, b] = placement.holes;
    return `Dimmer, end A at ${a}, wiper at ${wiper}, end B at ${b}, turned ${percent}%. Drag it up or down to set it, or use the slider under the board. Arrow keys to move, Delete to remove.`;
  }
  return `${placement.type} at ${where}. Arrow keys to move, Delete to remove.`;
}

/**
 * The same part, drawn on its own instead of on the board — the tray's
 * stand-in until real component art lands in public/assets/components/.
 *
 * It reuses Body, so a tray icon can never drift out of step with the thing
 * that appears when you drop it.
 *
 * @param {object} props
 * @param {import('../../shared/types.js').ComponentType} props.type
 * @param {string} [props.className]
 */
export function PartIcon({ type, className }) {
  const placement = { id: `icon-${type}`, type, holes: [], state: { closed: false } };

  return (
    <svg
      className={className}
      viewBox="-9 -5 18 10"
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      {type === 'wire' ? (
        <path
          d="M -7.5 2.6 Q 0 -5.5 7.5 2.6"
          className="part__wire"
          stroke={wireColour(placement)}
        />
      ) : (
        <>
          <line x1="-7.5" y1="0" x2="7.5" y2="0" className="part__lead" />
          <g transform={`scale(${ICON_SCALE[type] ?? 1})`}>
            <DrawnBody placement={placement} />
          </g>
        </>
      )}
    </svg>
  );
}

/**
 * Board art is drawn at true millimetre size, where a 9 V battery dwarfs an
 * LED. In a row of tray slots that just reads as "the LED is broken", so the
 * small parts are scaled up to fill their slot.
 */
const ICON_SCALE = {
  battery: 1,
  potentiometer: 1,
  switch: 1.7,
  resistor: 1.9,
  led: 2.2,
};

/**
 * One drawing, lined up with the two holes it is plugged into.
 *
 * The drawing's own legs land exactly on the holes when the part is sitting at
 * its natural width. Stretch it wider and the body stays the size it should be
 * — a real part does not grow — while the leads splay out to reach, which is
 * what bending the legs of a real component looks like.
 *
 * Anything the drawing cannot say for itself goes on top: the LED's glow and
 * its + leg, and the dimmer's pointer.
 *
 * @param {object} props
 * @param {object} props.art     an entry from COMPONENT_ART
 * @param {number} props.reach   half the distance between the two holes, in mm
 */
function ArtBody({ art, placement, result, sign, reach }) {
  const { span, angle, offset, heart } = artAnchors(art);
  const foot = span / 2;
  const lit = placement.type === 'led' && result?.lit === true;
  const brightness = lit ? (result?.brightness ?? 1) : 0;

  return (
    <g
      className="part__art"
      data-lit={placement.type === 'led' ? lit : undefined}
      data-dead={result?.burnedOut === true || undefined}
    >
      {/* Leads from the drawn feet out to the holes, when the holes are further. */}
      {reach > foot + 0.05 && (
        <>
          <line x1={-reach} y1="0" x2={-foot} y2="0" className="part__lead" />
          <line x1={foot} y1="0" x2={reach} y2="0" className="part__lead" />
        </>
      )}

      {lit && (
        <circle
          cx={heart.x}
          cy={heart.y}
          r={art.width * 0.5 + 1.4 * brightness}
          className="part__glow"
          style={{ opacity: 0.1 + 0.22 * brightness }}
        />
      )}

      <g transform={`rotate(${-angle}) translate(${offset.x} ${offset.y})`}>
        <image
          href={art.src}
          x="0"
          y="0"
          width={art.width}
          height={art.height}
          preserveAspectRatio="none"
        />
      </g>

      {/* The drawing shows a round red bulb either way round, so say which leg. */}
      {placement.type === 'led' && (
        <text className="part__pole part__pole--pos" x={-foot - 1.1 * sign} y="0.6">
          +
        </text>
      )}

      {placement.type === 'potentiometer' && <PotPointer placement={placement} at={heart} />}
    </g>
  );
}

/** The dial pointer, drawn over whatever the dimmer's body is. */
function PotPointer({ placement, at = { x: 0, y: 0 } }) {
  const turn = Math.min(1, Math.max(0, placement.state?.turn ?? 0));
  // Sweep through 270 degrees, from 7 o'clock round to 5 o'clock.
  const angle = -135 + turn * 270;
  return (
    <g className="part__pot" data-turn={turn.toFixed(2)} transform={`translate(${at.x} ${at.y})`}>
      <g transform={`rotate(${angle})`}>
        <line x1="0" y1="0" x2="0" y2="-2.2" className="part__pot-pointer" />
      </g>
    </g>
  );
}

function DrawnBody({ placement, result, sign = 1 }) {
  switch (placement.type) {
    case 'battery':
      return (
        <>
          <rect x="-5" y="-2.6" width="10" height="5.2" rx="0.8" className="part__battery" />
          <text className="part__text" x="0" y="0.9">9V</text>
          {/* Leg 0 is + — and leg 0 is not always on the left. */}
          <text className="part__pole part__pole--pos" x={-6.4 * sign} y="0.9">+</text>
          <text className="part__pole part__pole--neg" x={6.4 * sign} y="0.9">&#8722;</text>
        </>
      );

    case 'resistor':
      return (
        <>
          <rect x="-3.4" y="-1.2" width="6.8" height="2.4" rx="1.1" className="part__resistor" />
          {/* 330 ohm: orange, orange, brown, gold */}
          <rect x="-2.2" y="-1.2" width="0.6" height="2.4" fill="#e07b22" />
          <rect x="-1.1" y="-1.2" width="0.6" height="2.4" fill="#e07b22" />
          <rect x="0.0" y="-1.2" width="0.6" height="2.4" fill="#7a4a1e" />
          <rect x="2.2" y="-1.2" width="0.5" height="2.4" fill="#c9a227" />
        </>
      );

    case 'potentiometer':
      return (
        <>
          <rect x="-4.2" y="-4.2" width="8.4" height="8.4" rx="1" className="part__pot-body" />
          <circle r="2.9" className="part__pot-dial" />
          <PotPointer placement={placement} />
        </>
      );

    case 'led': {
      const lit = result?.lit === true;
      const dead = result?.burnedOut === true;
      const brightness = lit ? (result?.brightness ?? 1) : 0;
      return (
        <>
          {/* Flat side marks the cathode, exactly as on a real LED. */}
          <path
            d="M -1.9 -1.9 A 1.9 1.9 0 0 1 -1.9 1.9 L 1.9 1.9 L 1.9 -1.9 Z"
            className="part__led"
            data-lit={lit}
            data-dead={dead}
            style={lit ? { fillOpacity: 0.55 + 0.45 * brightness } : undefined}
          />
          {lit && (
            <circle
              r={2.6 + 1.6 * brightness}
              className="part__glow"
              style={{ opacity: 0.08 + 0.2 * brightness }}
            />
          )}
          <text className="part__pole part__pole--pos" x={-3.6 * sign} y="0.8">+</text>
        </>
      );
    }

    case 'switch': {
      const closed = placement.state?.closed === true;
      return (
        <>
          <rect x="-3.6" y="-2.2" width="7.2" height="4.4" rx="0.7" className="part__switch" />
          <circle cx="-2.2" cy="0" r="0.5" className="part__terminal" />
          <circle cx="2.2" cy="0" r="0.5" className="part__terminal" />
          <line
            x1="-2.2"
            y1="0"
            x2={closed ? 2.2 : 1.0}
            y2={closed ? 0 : -1.5}
            className="part__lever"
            data-closed={closed}
          />
        </>
      );
    }

    default:
      return <rect x="-3" y="-1.5" width="6" height="3" className="part__unknown" />;
  }
}

/** Screen pixels of vertical drag that sweep the knob from one end to the other. */
const KNOB_DRAG_PX = 160;
/** Movement under this many pixels is a tap, not a turn. */
const KNOB_CLICK_SLOP_PX = 4;

/**
 * Drag a potentiometer up to brighten it (less resistance) and down to dim it.
 *
 * This is the one part whose body does not move when you drag it, because the
 * body is a knob and turning it is the more useful thing to do with it. The
 * pointer is captured here rather than released, which is the opposite of what
 * placement dragging wants: a knob only cares how far the pointer travelled,
 * never which hole it is over.
 */
function useKnobDrag(placement, onTurn) {
  const ref = useRef({ down: false, startY: 0, startTurn: 0, moved: false });
  const active = placement.type === 'potentiometer' && typeof onTurn === 'function';

  if (!active) return { active: false, handlers: {} };

  const handlers = {
    onPointerDown(event) {
      if (event.button !== 0) return;
      event.stopPropagation();
      /*
       * Same as the placement grab: without this the press focuses the <g> and
       * the browser paints its own focus ring round the whole part — which,
       * since the knob is the one part you press and hold, is the one place it
       * would sit there staring at you. Keyboard focus still works.
       */
      event.preventDefault();
      event.currentTarget.setPointerCapture?.(event.pointerId);
      ref.current = {
        down: true,
        startY: event.clientY,
        startTurn: placement.state?.turn ?? 0,
        moved: false,
      };
    },
    onPointerMove(event) {
      if (!ref.current.down) return;
      const dy = event.clientY - ref.current.startY;
      if (!ref.current.moved && Math.abs(dy) < KNOB_CLICK_SLOP_PX) return;
      ref.current.moved = true;
      const turn = Math.min(1, Math.max(0, ref.current.startTurn + dy / KNOB_DRAG_PX));
      onTurn(placement.id, turn);
    },
    onPointerUp(event) {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
      ref.current.down = false;
    },
    onPointerCancel() {
      ref.current.down = false;
    },
  };

  return { active: true, handlers };
}

/** A jumper wire arcs rather than lying flat. The arc is what makes crossings readable. */
function sag(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  const lift = Math.min(length * 0.18, 6);
  const cx = (from.x + to.x) / 2;
  const cy = (from.y + to.y) / 2 - lift;
  return `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`;
}

/**
 * Colour-code by what the wire touches: red for a positive rail, blue for
 * negative, green for everything else. That is the convention on every real
 * bench, and it is free teaching.
 */
function wireColour(placement) {
  const touches = (prefixes) =>
    placement.holes.some((hole) => prefixes.some((prefix) => hole?.startsWith(prefix)));
  if (touches(['TP', 'BP'])) return 'var(--rail-positive)';
  if (touches(['TN', 'BN'])) return 'var(--rail-negative)';
  return 'var(--wire-neutral, #2f9e64)';
}
