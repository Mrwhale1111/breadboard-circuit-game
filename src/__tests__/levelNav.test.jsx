import { describe, expect, it, afterEach } from 'vitest';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { startGame } from './helpers/startGame.jsx';
import { resetIds } from '../shared/ids.js';

afterEach(cleanup);

const navButtons = () => screen.getByRole('navigation', { name: /levels/i }).querySelectorAll('.level-nav__item');
const current = () => document.querySelector('.level-nav__item[aria-current="page"]');

/*
 * SKIPPED while the level picker is commented out in App.jsx. Uncomment the
 * levelNav prop there and drop the .skip below to bring these back — they
 * were passing when it was switched off, and nothing in LevelNav changed.
 */
describe.skip('Level navigation', () => {
  it('lists every level and marks the one being played', () => {
    resetIds();
    startGame();

    const buttons = navButtons();
    expect(buttons.length).toBe(3);
    expect(current().textContent).toBe('1');
    expect(screen.getByRole('button', { name: /level 3: variable control/i })).toBeTruthy();
  });

  it('jumps straight to level 3 and back to level 1, starting each fresh', () => {
    resetIds();
    startGame();

    fireEvent.click(screen.getByRole('button', { name: /level 3/i }));
    expect(current().textContent).toBe('3');
    expect(screen.getByText(/found a book/i)).toBeTruthy();

    // Advance a little into level 3, then leave and come back — it restarts.
    fireEvent.click(document.querySelector('.dialogue__advance'));
    fireEvent.click(screen.getByRole('button', { name: /level 1/i }));
    expect(current().textContent).toBe('1');
    expect(screen.queryByText(/found a book/i)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /level 3/i }));
    expect(screen.getByText(/found a book/i)).toBeTruthy();
  });

  it('clicking the current level does nothing', () => {
    resetIds();
    startGame();
    fireEvent.click(document.querySelector('.dialogue__advance'));
    const before = document.querySelector('.dialogue').textContent;

    fireEvent.click(screen.getByRole('button', { name: /level 1/i }));
    expect(document.querySelector('.dialogue').textContent).toBe(before);
  });
});
