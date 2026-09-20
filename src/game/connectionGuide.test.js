import { describe, expect, it } from 'vitest';
import { connectionPlan, nextConnectionHint } from './connectionGuide.js';

describe('connection guide', () => {
  it('provides a complete connection chain for every level', () => {
    expect(connectionPlan('level-1')).toHaveLength(3);
    expect(connectionPlan('level-2').join(' ')).toMatch(/resistor/i);
    expect(connectionPlan('level-3').join(' ')).toMatch(/wiper/i);
  });

  it('prioritizes a missing finite part, then live circuit faults', () => {
    const level = { id: 'level-1', tray: [{ type: 'battery', count: 1 }] };
    expect(nextConnectionHint(level, [], { faults: [] })).toMatch(/place the battery/i);
    expect(nextConnectionHint(level, [{ type: 'battery' }], { faults: [{ message: 'LED is backwards.' }] }))
      .toBe('LED is backwards.');
  });

  it('recognizes a completed loop', () => {
    const level = { id: 'level-1', tray: [] };
    expect(nextConnectionHint(level, [], { complete: true })).toMatch(/loop is complete/i);
  });
});
