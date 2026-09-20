import { connectionPlan, nextConnectionHint } from './connectionGuide.js';

export function CircuitCoach({ level, placements, result }) {
  const plan = connectionPlan(level.id);
  const hint = nextConnectionHint(level, placements, result);

  return (
    <aside className="circuit-coach" aria-label="Watt's wiring guide">
      <header>
        <span aria-hidden="true">⚡</span>
        <strong>Watt’s Wiring Guide</strong>
      </header>
      <p className="circuit-coach__hint">{hint}</p>
      <ol className="circuit-coach__plan">
        {plan.map((connection) => <li key={connection}>{connection}</li>)}
      </ol>
    </aside>
  );
}
