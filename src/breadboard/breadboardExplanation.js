import { parseHole } from '../shared/holes.js';

export function breadboardExplanation(holeId) {
  const hole = parseHole(holeId);
  if (!hole) return null;

  if (hole.kind === 'rail' && hole.row.endsWith('P')) {
    return {
      title: 'Positive power rail (+)',
      text:
        'This long red line is usually connected to the battery’s positive terminal. ' +
        'Every hole along this + rail is connected inside the breadboard.',
    };
  }

  if (hole.kind === 'rail') {
    return {
      title: 'Negative return rail (−)',
      text:
        'This long blue line is usually connected to the battery’s negative terminal. ' +
        'It gives current a return path; every hole along this − rail is connected.',
    };
  }

  const half = hole.row <= 'E' ? 'A–E' : 'F–J';
  return {
    title: `Five-hole strip ${half}${hole.col}`,
    text:
      `This unmarked area is not positive or negative by itself. The five holes in column ${hole.col}, ` +
      `rows ${half}, are connected together. The center gap separates them from the five holes on the other side.`,
  };
}
