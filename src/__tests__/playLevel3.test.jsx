import { describe, expect, it, afterEach } from 'vitest';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { startGame } from './helpers/startGame.jsx';
import { resetIds } from '../shared/ids.js';
import {
  boardVisible,
  clickThrough,
  dropFromTray,
  finishLevel1,
  place,
  placeDimmer,
  pullOff,
  tap,
} from './boardActions.js';

/**
 * Plays level 3 the way a person would: finish levels 1 and 2, drop the
 * three-pin dimmer across the gap after the LED, wire its wiper into the loop,
 * and turn the knob until the light is soft.
 */

afterEach(cleanup);

function finishLevel2() {
  // finishLevel1 has already faded us into level 2.
  clickThrough(boardVisible);
  pullOff(document.querySelector('[data-placement="pre-bridge"]'));
  place('resistor', 'B9', 'B13');
  fireEvent.click(screen.getByRole('button', { name: /lower your hand/i }));
  clickThrough(() => Boolean(screen.queryByText(/End of Level 2/i)));
}

function startLevel3() {
  resetIds();
  startGame();
  finishLevel1();
  finishLevel2();
  fireEvent.click(screen.getByRole('button', { name: /continue to level 3/i }));
}

const veilOpacity = () => Number(document.querySelector('.scene__veil').style.opacity);
const knob = () => document.querySelector('.knob__input');
const turnTo = (percent) => fireEvent.change(knob(), { target: { value: String(percent) } });
const continueButton = () => screen.queryByRole('button', { name: /sit back down/i });

describe('Level 3 — Variable Control', () => {
  it('opens on the story, then a board with a gap after the LED', () => {
    startLevel3();
    expect(screen.getByText(/found a book/i)).toBeTruthy();
    clickThrough(boardVisible);

    expect(document.querySelector('[data-placement="pre-led"]')).toBeTruthy();
    expect(document.querySelector('[data-placement="pre-resistor"]')).toBeTruthy();
    expect(knob()).toBeNull();
    expect(document.querySelector('[data-part="potentiometer"]').disabled).toBe(false);
  });

  it('drops in across the gap with a leg either side and its wiper between', () => {
    startLevel3();
    clickThrough(boardVisible);

    dropFromTray('potentiometer', 'C17');
    const pot = document.querySelector('.breadboard [data-placement^="potentiometer-"]');
    expect(pot.getAttribute('data-holes')).toBe('C17,C19,C21');
    expect(pot.querySelectorAll('[data-leg]').length).toBe(3);
  });

  it('wired end to end the knob does nothing', () => {
    startLevel3();
    clickThrough(boardVisible);

    // Both outer pins in the loop, wiper connected to nothing: the current
    // crosses the whole track whatever the knob says.
    dropFromTray('potentiometer', 'C17');

    expect(screen.getByText(/^1000 Ω$/)).toBeTruthy();
    turnTo(20);
    expect(screen.getByText(/^1000 Ω$/)).toBeTruthy();
    expect(continueButton()).toBeNull();
  });

  it('a jumper from the wiper to the ground end puts the knob in charge', () => {
    startLevel3();
    clickThrough(boardVisible);

    placeDimmer();

    expect(knob()).toBeTruthy();
    expect(knob().value).toBe('0');
    expect(screen.getByText(/^0 Ω$/)).toBeTruthy();
    expect(veilOpacity()).toBe(0);
    // Full brightness is not a reading light yet.
    expect(continueButton()).toBeNull();
  });

  it('more resistance means a dimmer room; less means brighter', () => {
    startLevel3();
    clickThrough(boardVisible);
    placeDimmer();

    turnTo(100);
    const dim = veilOpacity();
    expect(screen.getByText(/^1000 Ω$/)).toBeTruthy();
    expect(dim).toBeGreaterThan(0.5);
    expect(dim).toBeLessThan(0.93); // still on — not as dark as an open switch

    turnTo(50);
    const half = veilOpacity();
    expect(half).toBeLessThan(dim);
    expect(half).toBeGreaterThan(0);

    turnTo(0);
    expect(veilOpacity()).toBe(0);
  });

  it('the knob turns the pointer on the part itself', () => {
    startLevel3();
    clickThrough(boardVisible);
    placeDimmer();

    expect(document.querySelector('.part__pot').dataset.turn).toBe('0.00');
    turnTo(75);
    expect(document.querySelector('.part__pot').dataset.turn).toBe('0.75');
  });

  it('dragging the part down dims it and up brightens it', () => {
    startLevel3();
    clickThrough(boardVisible);
    placeDimmer();
    const pot = () => document.querySelector('.breadboard [data-placement^="potentiometer-"]');

    fireEvent.pointerDown(pot(), { button: 0, pointerId: 1, clientY: 100 });
    expect(document.body.classList.contains('paw-pressed')).toBe(true);
    fireEvent.pointerMove(pot(), { pointerId: 1, clientY: 180 });
    fireEvent.pointerUp(pot(), { pointerId: 1, clientY: 180 });
    expect(document.body.classList.contains('paw-pressed')).toBe(false);
    fireEvent.click(pot());
    expect(pot()).toBeTruthy();
    expect(knob().value).toBe('50');
    expect(screen.getByText(/^500 Ω$/)).toBeTruthy();
    const dimmed = veilOpacity();
    expect(dimmed).toBeGreaterThan(0);

    fireEvent.pointerDown(pot(), { button: 0, pointerId: 1, clientY: 100 });
    fireEvent.pointerMove(pot(), { pointerId: 1, clientY: 60 });
    fireEvent.pointerUp(pot(), { pointerId: 1, clientY: 60 });
    fireEvent.click(pot());
    expect(knob().value).toBe('25');
    expect(veilOpacity()).toBeLessThan(dimmed);

    fireEvent.pointerDown(pot(), { button: 0, pointerId: 1, clientY: 100 });
    fireEvent.pointerMove(pot(), { pointerId: 1, clientY: -900 });
    fireEvent.pointerUp(pot(), { pointerId: 1, clientY: -900 });
    fireEvent.click(pot());
    expect(knob().value).toBe('0');

    // A press that goes nowhere changes nothing: the dimmer is not a switch,
    // and its body is a knob, so it cannot be grabbed and moved either.
    fireEvent.pointerDown(pot(), { button: 0, pointerId: 1, clientY: 100 });
    fireEvent.pointerUp(pot(), { pointerId: 1, clientY: 101 });
    expect(pot()).toBeTruthy();
    expect(knob().value).toBe('0');
  });

  it('the dimmer comes off the board by its legs, like everything else', () => {
    startLevel3();
    clickThrough(boardVisible);
    placeDimmer();
    expect(knob()).toBeTruthy();

    pullOff(document.querySelector('.breadboard [data-placement^="potentiometer-"]'));

    expect(document.querySelector('.breadboard [data-placement^="potentiometer-"]')).toBeNull();
    expect(knob()).toBeNull();
  });

  it('a soft setting completes the level; a spotlight does not', () => {
    startLevel3();
    clickThrough(boardVisible);
    placeDimmer();

    turnTo(50);
    expect(continueButton()).toBeTruthy();

    turnTo(0);
    expect(continueButton()).toBeNull();

    turnTo(50);
    tap(document.querySelector('[data-placement="pre-switch"]'));
    expect(veilOpacity()).toBeGreaterThan(0.9);
    expect(continueButton()).toBeNull();
  });

  it('the dimmer somewhere off the loop does nothing', () => {
    startLevel3();
    clickThrough(boardVisible);

    dropFromTray('potentiometer', 'A25');

    expect(knob()).toBeTruthy();
    turnTo(50);
    expect(continueButton()).toBeNull();
  });

  it('reaches the end of the game', () => {
    startLevel3();
    clickThrough(boardVisible);
    placeDimmer();
    turnTo(50);
    fireEvent.click(continueButton());
    clickThrough(() => Boolean(screen.queryByRole('button', { name: /wire starts sparking/i })));

    expect(screen.getByAltText(/electrical wires crossing and sparking/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /wire starts sparking/i }));
    expect(screen.getByAltText(/bedroom filled with bright electrical sparks/i)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /^continue$/i }));
    expect(screen.getByAltText(/the end/i)).toBeTruthy();

    expect(screen.queryByRole('button', { name: /continue to/i })).toBeNull();
    const menu = screen.getByRole('button', { name: /back to menu/i });
    expect(menu).toBeTruthy();
    fireEvent.click(menu);
    expect(screen.getByRole('button', { name: /start game/i })).toBeTruthy();
  });
});
