/**
 * OWNER: Person C (Game Shell & Story)
 *
 * Opens on the main menu, runs the intro slides, then picks which story +
 * level pair to run. Levels are played in the order they
 * are registered in content/levels; each level's end beat offers the next one,
 * and the header lets the player jump to any level directly.
 *
 * `key` remounts StoryScreen on a level change, so story position and board
 * state start clean instead of leaking from the previous level.
 */

import { useState } from 'react';
import { MainMenu } from './menu/MainMenu.jsx';
import { IntroSlides } from './story/IntroSlides.jsx';
import { LevelNav } from './story/LevelNav.jsx';
import { StoryScreen } from './story/StoryScreen.jsx';
import { getStory } from './story/index.js';
import { LEVELS } from './content/levels/index.js';
import { INTRO_SLIDES } from './content/assets.js';
import { usePawCursor } from './ui/usePawCursor.js';
import { CircuitChat } from './chat/CircuitChat.jsx';

export default function App() {
  const [levelIndex, setLevelIndex] = useState(null);
  const [showIntro, setShowIntro] = useState(false);
  usePawCursor();

  /*
   * Starting from the menu shows the intro slides first — but only on the way
   * into level 1. Jumping straight to a later level, from the menu or from the
   * header, skips them: they set up the beginning of the story, not a level.
   */
  const start = (index) => {
    setLevelIndex(index);
    setShowIntro(index === 0 && INTRO_SLIDES.length > 0);
  };

  if (levelIndex === null) {
    return (
      <>
        <MainMenu levels={LEVELS} onStart={start} />
        <CircuitChat />
      </>
    );
  }

  if (showIntro) {
    return <IntroSlides onDone={() => setShowIntro(false)} />;
  }

  const level = LEVELS[levelIndex];
  const story = getStory(level.id);
  const upcoming = LEVELS[levelIndex + 1];

  const nextLevel = upcoming
    ? {
        label: `Continue to ${getStory(upcoming.id)?.chapter ?? upcoming.title}`,
        onSelect: () => setLevelIndex(levelIndex + 1),
      }
    : null;

  return <>
    <StoryScreen
      key={level.id}
      level={level}
      story={story}
      nextLevel={nextLevel}
      onMenu={() => setLevelIndex(null)}
      levelNav={
        <LevelNav
          levels={LEVELS}
          current={levelIndex}
          onSelect={setLevelIndex}
          onMenu={() => setLevelIndex(null)}
        />
      }
    />
    <CircuitChat />
  </>;
}
