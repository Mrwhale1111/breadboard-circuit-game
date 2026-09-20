import { describe, expect, it, afterEach } from 'vitest';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { startGame } from './helpers/startGame.jsx';
import { resetIds } from '../shared/ids.js';
import {
  boardVisible,
  clickThrough,
  finishLevel1,
  place,
  pullOff,
} from './boardActions.js';

/**
 * Plays level 2 the way a person would: finish level 1, step into level 2,
 * pull the jumper that is over-driving the LED, and drop a resistor in its
 * place.
 */

afterEach(cleanup);

function startLevel2() {
  resetIds();
  startGame();
  // finishLevel1 already lands here: level 1 fades straight into level 2.
  finishLevel1();
}

const veilOpacity = () => Number(document.querySelector('.scene__veil').style.opacity);
const glareOpacity = () => Number(document.querySelector('.scene__glare').style.opacity);

describe('Level 2 — Turn It Down', () => {
  it('level 1 hands straight over, with nothing to press', () => {
    resetIds();
    startGame();
    finishLevel1();
    expect(screen.getByText(/Level 2/i)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /continue to level 2/i })).toBeNull();
  });

  it('opens on the glare, not the puzzle', () => {
    startLevel2();
    expect(screen.getByText(/my eyes are burning/i)).toBeTruthy();
    expect(document.querySelector('[data-hole]')).toBeNull();
    expect(glareOpacity()).toBe(1);

    // One click per line, then the board.
    fireEvent.click(document.querySelector('.dialogue__advance'));
    expect(screen.getByText(/too much power/i)).toBeTruthy();
  });

  it('starts the puzzle with the circuit already built and over-driving the LED', () => {
    startLevel2();
    clickThrough(boardVisible);

    expect(document.querySelector('[data-placement="pre-led"]')).toBeTruthy();
    expect(document.querySelector('[data-placement="pre-bridge"]')).toBeTruthy();

    // Lit, but painfully so.
    expect(veilOpacity()).toBe(0);
    expect(glareOpacity()).toBe(1);
  });

  it('only hands the player a resistor to add', () => {
    startLevel2();
    clickThrough(boardVisible);
    expect(document.querySelector('[data-part="resistor"]').disabled).toBe(false);
    expect(document.querySelector('[data-part="led"]').disabled).toBe(true);
    expect(document.querySelector('[data-part="battery"]').disabled).toBe(true);
  });

  it('pulling the jumper breaks the loop and kills the glare', () => {
    startLevel2();
    clickThrough(boardVisible);

    pullOff(document.querySelector('[data-placement="pre-bridge"]'));

    expect(document.querySelector('[data-placement="pre-bridge"]')).toBeNull();
    expect(glareOpacity()).toBe(0);
    expect(veilOpacity()).toBeGreaterThan(0.8);
  });

  it('a resistor in the jumper’s place dims the light and lets the story continue', () => {
    startLevel2();
    clickThrough(boardVisible);

    pullOff(document.querySelector('[data-placement="pre-bridge"]'));
    place('resistor', 'B9', 'B13');

    expect(veilOpacity()).toBe(0);
    expect(glareOpacity()).toBe(0);
    expect(screen.getByRole('button', { name: /lower your hand/i })).toBeTruthy();
  });

  it('a resistor somewhere off the loop does not count', () => {
    startLevel2();
    clickThrough(boardVisible);

    place('resistor', 'A25', 'A29');

    expect(glareOpacity()).toBe(1);
    expect(screen.queryByRole('button', { name: /lower your hand/i })).toBeNull();
  });

  it('ends with a way into level 3', () => {
    startLevel2();
    clickThrough(boardVisible);
    pullOff(document.querySelector('[data-placement="pre-bridge"]'));
    place('resistor', 'B9', 'B13');
    fireEvent.click(screen.getByRole('button', { name: /lower your hand/i }));
    clickThrough(() => Boolean(screen.queryByText(/End of Level 2/i)));

    expect(screen.getByRole('button', { name: /continue to level 3/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /play level 2 again/i })).toBeTruthy();
  });
});
