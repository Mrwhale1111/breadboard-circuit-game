import { describe, expect, it, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from '../App.jsx';
import { skipIntro } from './helpers/startGame.jsx';
import { resetIds } from '../shared/ids.js';

afterEach(cleanup);

describe('Main menu', () => {
  it('opens on the title screen with no board showing', () => {
    resetIds();
    render(<App />);
    expect(screen.getByRole('heading', { name: /watt.s wrong/i })).toBeTruthy();
    expect(document.querySelector('[data-hole]')).toBeNull();
    expect(document.querySelector('.dialogue')).toBeNull();
  });

  it('toggles the how-to-play instructions', () => {
    render(<App />);
    const help = screen.getByRole('button', { name: /how to play/i });
    expect(document.getElementById('menu-instructions')).toBeNull();
    fireEvent.click(help);
    expect(help.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText(/complete loop/i)).toBeTruthy();
    fireEvent.click(help);
    expect(document.getElementById('menu-instructions')).toBeNull();
  });

  it('Start game begins Level 1', () => {
    resetIds();
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /start game/i }));

    // The intro slides come first, and the story only starts once they are done.
    expect(document.querySelector('.intro-slide')).toBeTruthy();
    expect(screen.queryByText(/Oh shoot/i)).toBeNull();

    skipIntro();
    expect(screen.getByText(/Oh shoot/i)).toBeTruthy();
    // Off with the level picker in App.jsx — restore together.
    // expect(document.querySelector('.level-nav__item[aria-current="page"]').textContent).toBe('1');
  });

  it('jumps straight to a level from the menu', () => {
    resetIds();
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /^3/ }));
    // Jumping to a later level skips the intro — it sets up the beginning.
    expect(document.querySelector('.intro-slide')).toBeNull();
    expect(screen.getByText(/found a book/i)).toBeTruthy();

    /*
      The way back lives on the level picker, which is commented out in
      App.jsx. Restore this with it — and note there is no route to the title
      screen from inside a level until then.

    fireEvent.click(screen.getByRole('button', { name: /menu/i }));
    expect(screen.getByRole('heading', { name: /watt.s wrong/i })).toBeTruthy();
    */
  });
});
