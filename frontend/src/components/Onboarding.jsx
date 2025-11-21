import React, { useState } from 'react';
import './Onboarding.css';

export default function Onboarding({ onComplete }) {
  const [currentScreen, setCurrentScreen] = useState(0);

  const screens = [
    {
      emoji: '🎮',
      title: 'Добро пожаловать!',
      text: 'Покупай блоки за стразы и строй башню. Чем выше твоя башня, тем больше твоя доля в призовом пуле!',
    },
    {
      emoji: '💥',
      title: 'Не урони башню!',
      text: 'Если башня падает, призовой пул разыгрывается между всеми пользователями. Тот, кто уронил башню, ничего не получает. Остальные распределяют стразы между собой пропорционально высоте.',
    },
    {
      emoji: '💎',
      title: 'Премиум башня',
      text: 'За каждые 10 блоков ты получаешь премиум блок. Они используются для строительства премиум башни из бриллиантов. Премиум башня добавляет призовой пул. Если она упала раньше обычной башни, то часть призового фонда сгорит, так что будь аккуратен, строитель!',
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
          {currentScreen < screens.length - 1 ? 'Далее' : 'Начать!'}
        </button>
      </div>
    </div>
  );
}
