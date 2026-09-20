import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { CircuitFaultBox } from './CircuitFaultBox.jsx';

afterEach(cleanup);

describe('CircuitFaultBox', () => {
  it('names the fault and affected component', () => {
    render(
      <CircuitFaultBox
        placements={[{ id: 'led-1', type: 'led', holes: ['A1', 'A2'] }]}
        faults={[{ message: 'The LED is backwards.', placementIds: ['led-1'] }]}
      />,
    );
    expect(screen.getByRole('alert').textContent).toMatch(/LED is backwards/i);
    expect(screen.getByRole('alert').textContent).toMatch(/red highlight: LED/i);
  });

  it('stays hidden when the circuit has no fault', () => {
    render(<CircuitFaultBox placements={[]} faults={[]} />);
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
