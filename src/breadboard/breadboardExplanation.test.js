import { describe, expect, it } from 'vitest';
import { breadboardExplanation } from './breadboardExplanation.js';

describe('breadboardExplanation', () => {
  it('explains positive and negative rails', () => {
    expect(breadboardExplanation('TP4').title).toMatch(/positive/i);
    expect(breadboardExplanation('BN30').title).toMatch(/negative/i);
  });

  it('explains each independent five-hole center strip', () => {
    expect(breadboardExplanation('C7')).toEqual(expect.objectContaining({ title: 'Five-hole strip A–E7' }));
    expect(breadboardExplanation('H7')).toEqual(expect.objectContaining({ title: 'Five-hole strip F–J7' }));
  });
});
