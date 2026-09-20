import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { CircuitCoach } from './CircuitCoach.jsx';

afterEach(cleanup);

describe('CircuitCoach', () => {
  it('opens from a compact button and can be closed again', () => {
    render(
      <CircuitCoach
        level={{ id: 'level-1', tray: [] }}
        placements={[]}
        result={{ complete: false, faults: [] }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /guide from watt/i }));
    expect(screen.getByRole('complementary', { name: /watt's wiring guide/i })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /close guide/i }));
    expect(screen.getByRole('button', { name: /guide from watt/i })).toBeTruthy();
  });
});
