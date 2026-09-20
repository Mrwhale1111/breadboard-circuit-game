import { parseHole } from '../shared/holes.js';

export const TUTORIAL_LAYOUT = {
  placing: 'beside',
  placed: 'perched',
  board: 'over',
  feed: 'over',
};

const onRails = (placement) =>
  placement.holes.length > 0 && placement.holes.every((id) => parseHole(id)?.kind === 'rail');

const feedsFromPositiveRail = (placement) => {
  if (placement.type !== 'wire' || placement.holes.length !== 2) return false;
  const ends = placement.holes.map((id) => parseHole(id));
  if (ends.some((end) => !end)) return false;
  const positive = ends.filter((end) => end.kind === 'rail' && end.row.endsWith('P'));
  const main = ends.filter((end) => end.kind === 'main');
  return positive.length === 1 && main.length === 1;
};

export function tutorialStageFor(placements, touched) {
  if (placements.some(feedsFromPositiveRail)) return 'feed';
  if (placements.some((placement) => placement.type === 'battery' && onRails(placement))) {
    return 'board';
  }
  if (placements.some((placement) => placement.type === 'wire')) return 'placed';
  if (!touched) return 'placing';
  return null;
}
