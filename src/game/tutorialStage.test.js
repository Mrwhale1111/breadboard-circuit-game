import { describe, expect, it } from 'vitest';
import { tutorialStageFor } from './tutorialStage.js';

describe('tutorialStageFor', () => {
  it('starts with placement coaching and leaves once the untouched board changes', () => {
    expect(tutorialStageFor([], false)).toBe('placing');
    expect(tutorialStageFor([], true)).toBeNull();
  });

  it('advances through wire, rail battery, and positive-feed scenes', () => {
    const wire = { type: 'wire', holes: ['A1', 'A5'] };
    const battery = { type: 'battery', holes: ['TP1', 'TN1'] };
    const feed = { type: 'wire', holes: ['TP2', 'A2'] };

    expect(tutorialStageFor([wire], true)).toBe('placed');
    expect(tutorialStageFor([wire, battery], true)).toBe('board');
    expect(tutorialStageFor([wire, battery, feed], true)).toBe('feed');
  });
});
