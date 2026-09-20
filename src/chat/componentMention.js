const COMPONENT_TERMS = [
  ['potentiometer', /\b(potentiometer|dimmer|knob)\b/i],
  ['resistor', /\b(resistor|resistance|ohms?)\b/i],
  ['battery', /\b(battery|voltage|volt)\b/i],
  ['switch', /\b(switch|button)\b/i],
  ['led', /\b(led|light[- ]?emitting diode)\b/i],
  ['wire', /\b(wire|jumper)\b/i],
];

export function componentMention(text) {
  return COMPONENT_TERMS.find(([, pattern]) => pattern.test(text))?.[0] ?? null;
}
