import { useState } from 'react';
import { connectionPlan, nextConnectionHint } from './connectionGuide.js';

export function CircuitCoach({ level, placements, result }) {
  const [open, setOpen] = useState(false);
  const plan = connectionPlan(level.id);
  const hint = nextConnectionHint(level, placements, result);

  if (!open) {
    return (
      <button
        type="button"
        className="circuit-coach-toggle"
        aria-expanded="false"
        onClick={() => setOpen(true)}
      >
        <span aria-hidden="true">⚡</span>
        Guide from Watt
      </button>
    );
  }

  return (
    <aside className="circuit-coach" aria-label="Watt's wiring guide">
      <header>
        <div>
          <span aria-hidden="true">⚡</span>
          <strong>Watt’s Wiring Guide</strong>
        </div>
        <button type="button" aria-expanded="true" onClick={() => setOpen(false)}>
          Close Guide
        </button>
      </header>
      <p className="circuit-coach__hint">{hint}</p>
      <ol className="circuit-coach__plan">
        {plan.map((connection) => <li key={connection}>{connection}</li>)}
      </ol>
    </aside>
  );
}
