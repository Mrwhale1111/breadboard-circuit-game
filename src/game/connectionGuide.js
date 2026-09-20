const PLANS = {
  'level-1': [
    'Battery + → switch',
    'Switch → LED long leg (+)',
    'LED short leg (−) → battery −',
  ],
  'level-2': [
    'Battery + → switch',
    'Switch → 330 Ω resistor',
    'Resistor → LED long leg (+)',
    'LED short leg (−) → battery −',
  ],
  'level-3': [
    'Battery + → switch → resistor',
    'Resistor → LED long leg (+)',
    'LED short leg (−) → dimmer wiper',
    'Dimmer outer pin → battery −',
  ],
};

export function connectionPlan(levelId) {
  return PLANS[levelId] ?? [];
}

export function nextConnectionHint(level, placements, result) {
  if (result?.complete) return 'The loop is complete. Close the switch and check the light.';

  const missing = level.tray.find((item) => {
    if (item.count === Infinity) return false;
    return !placements.some((placement) => placement.type === item.type);
  });
  if (missing) return `Place the ${missing.type} from the toolbox, then follow the connection plan.`;

  const fault = result?.faults?.[0]?.message;
  if (fault) return fault;

  if (level.id === 'level-2') {
    return 'Remove the direct jumper between the switch and LED, then put the resistor in that gap.';
  }
  if (level.id === 'level-3') {
    return 'Bridge the gap with the dimmer, then connect its middle wiper pin to the return side.';
  }
  return 'Use jumper wires to join each item in the order shown, then return to battery −.';
}
