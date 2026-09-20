import { describe, expect, it } from 'vitest';
import { componentMention } from './componentMention.js';

describe('componentMention', () => {
  it.each([
    ['How does the switch work?', 'switch'],
    ['Why does an LED need resistance?', 'resistor'],
    ['What does the battery do?', 'battery'],
    ['Explain the dimmer knob', 'potentiometer'],
    ['Where should this jumper wire go?', 'wire'],
  ])('detects a component in %s', (question, expected) => {
    expect(componentMention(question)).toBe(expected);
  });

  it('ignores questions without a named component', () => {
    expect(componentMention('How does this circuit work?')).toBeNull();
  });
});
