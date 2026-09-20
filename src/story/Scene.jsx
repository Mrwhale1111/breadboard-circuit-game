/**
 * OWNER: Person D (art) / Person B (the light transition)
 *
 * A background with a darkness veil over it. `light` runs 0 (pitch black) to
 * 1 (fully lit), and during the puzzle it is driven live by the circuit — so
 * the room physically brightens the instant the player's LED comes on.
 *
 * That link between the circuit and the room is the whole point of the level.
 * If you change one thing in this file, do not break it.
 *
 * Works with no image files present: every background has a CSS gradient
 * fallback in src/content/assets.js, so art and code never block each other.
 */

import { useState } from 'react';
import { background } from '../content/assets.js';

/**
 * @param {object} props
 * @param {string} props.name    key into BACKGROUNDS
 * @param {number} props.light   0..1
 * @param {number} [props.glare] 0..1 — harsh white wash from an over-driven bulb
 * @param {boolean} [props.effects] Whether to apply lighting overlays
 * @param {React.ReactNode} [props.children]
 */
export function Scene({ name, light, glare = 0, effects = true, children }) {
  const spec = background(name);
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className="scene">
      <div className="scene__fallback" style={{ background: spec.fallback }} />

      {spec.src && !imageFailed && (
        <img
          className="scene__image"
          src={spec.src}
          alt={spec.alt}
          onError={() => setImageFailed(true)}
        />
      )}

      {/* The darkness. Sits above the art, below everything the player touches. */}
      {effects && <div
          className="scene__veil"
          style={{ opacity: 1 - clamp(light) }}
          aria-hidden="true"
        />}

      {/* A warm pool of light that grows as the circuit comes alive. */}
      {effects && <div
        className="scene__glow"
        style={{ opacity: clamp(light) * 0.55 }}
        aria-hidden="true"
      />}

      {/* Too much light: the bleached-out wash of a bulb driven past its limit. */}
      {effects && <div
        className="scene__glare"
        style={{ opacity: clamp(glare) }}
        aria-hidden="true"
      />}

      <div className="scene__content">{children}</div>
    </div>
  );
}

const clamp = (value) => Math.max(0, Math.min(1, value ?? 0));
