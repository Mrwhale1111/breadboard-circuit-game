import { getComponent } from '../content/components.js';

export function CircuitFaultBox({ placements, faults }) {
  const fault = faults?.[0];
  if (!fault) return null;

  const affected = (fault.placementIds ?? [])
    .map((id) => placements.find((placement) => placement.id === id))
    .filter(Boolean)
    .map((placement) => getComponent(placement.type).label);
  const labels = [...new Set(affected)];

  return (
    <aside className="circuit-fault" role="alert">
      <header>
        <span aria-hidden="true">!</span>
        <strong>Circuit Check</strong>
      </header>
      <p>{fault.message}</p>
      {labels.length > 0 && (
        <p className="circuit-fault__parts">
          Look for the red highlight: {labels.join(', ')}
        </p>
      )}
    </aside>
  );
}
