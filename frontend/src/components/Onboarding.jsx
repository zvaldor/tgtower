import React, { useState } from 'react';
import './Onboarding.css';

export default function Onboarding({ onComplete }) {
  const [currentScreen, setCurrentScreen] = useState(0);

  const screens = [
    {
      emoji: '🎮',
      title: 'Welcome!',
      text: 'Buy blocks with Stars and build your tower. The higher your tower, the bigger your share of the prize pool!',
    },
    {
      emoji: '💥',
      title: 'Don\'t Drop the Tower!',
      text: 'If the tower collapses, the prize pool is distributed among all users. The one who dropped it gets nothing. Others split the Stars proportionally to their height.',
    },
    {
      emoji: '💎',
      title: 'Premium Tower',
      text: 'For every 10 blocks you earn a premium block. Use them to build the premium diamond tower. It adds to the prize pool. If it falls before the wooden tower, part of the prize pool burns, so be careful, builder!',
    },
  ];

  const handleNext = () => {
    if (currentScreen < screens.length - 1) {
      setCurrentScreen(currentScreen + 1);
    } else {
      onComplete();
    }
  };

  const screen = screens[currentScreen];

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-modal">
        <div className="onboarding-emoji">{screen.emoji}</div>
        <h2 className="onboarding-title">{screen.title}</h2>
        <p className="onboarding-text">{screen.text}</p>

        <div className="onboarding-dots">
          {screens.map((_, index) => (
            <div
              key={index}
              className={`onboarding-dot ${index === currentScreen ? 'active' : ''}`}
            />
          ))}
        </div>

        <button className="onboarding-button" onClick={handleNext}>
          {currentScreen < screens.length - 1 ? 'Next' : 'Start!'}
        </button>
      </div>
    </div>
  );
}
