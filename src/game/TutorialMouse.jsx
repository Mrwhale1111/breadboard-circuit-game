import { MOUSE_SPRITE } from '../menu/MainMenu.jsx';
import { useImageAvailable } from '../breadboard/useImageAvailable.js';
import './TutorialMouse.css';

export function TutorialMouse({ layout, lines = [] }) {
  const hasMouse = useImageAvailable(MOUSE_SPRITE) === true;
  if (!layout || lines.length === 0) return null;

  const box = (
    <aside className={`tutor__box tutor__box--${layout}`} aria-label="How to play">
      {lines.map((line) => <p className="tutor__line" key={line}>{line}</p>)}
    </aside>
  );
  const mouse = hasMouse
    ? <img className="tutor__mouse" src={MOUSE_SPRITE} alt="" aria-hidden="true" />
    : null;

  if (layout === 'beside') {
    return <div className="tutor tutor--beside">{box}{mouse}</div>;
  }
  if (layout === 'over') {
    return <div className="tutor tutor--over">{box}{mouse}</div>;
  }
  return <>{box}{mouse && <div className="tutor__perch" aria-hidden="true">{mouse}</div>}</>;
}
