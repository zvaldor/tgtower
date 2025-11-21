import React, { useState } from 'react';
import TowerDisplay from './TowerDisplay';
import './TowerCarousel.css';

export default function TowerCarousel({ regularTower, premiumTower, isCollapsing, onTowerChange }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const towers = [
    { type: 'premium', data: premiumTower, icon: '💎', name: 'Премиум башня' },
    { type: 'regular', data: regularTower, icon: '🪵', name: 'Обычная башня' },
  ];

  const handlePrev = () => {
    const newIndex = (currentIndex - 1 + towers.length) % towers.length;
    setCurrentIndex(newIndex);
    onTowerChange(towers[newIndex].type);
  };

  const handleNext = () => {
    const newIndex = (currentIndex + 1) % towers.length;
    setCurrentIndex(newIndex);
    onTowerChange(towers[newIndex].type);
  };

  const currentTower = towers[currentIndex];

  return (
    <div className="tower-carousel">
      <button className="carousel-arrow carousel-arrow-left" onClick={handlePrev}>
        ◀
      </button>

      <div className="tower-carousel-content">
        <div className="tower-type-label">
          <span className="tower-icon">{currentTower.icon}</span>
          <span className="tower-name">{currentTower.name}</span>
        </div>
        <TowerDisplay
          tower={currentTower.data}
          isCollapsing={isCollapsing && currentIndex === 1}
          isPremium={currentTower.type === 'premium'}
        />
      </div>

      <button className="carousel-arrow carousel-arrow-right" onClick={handleNext}>
        ▶
      </button>
    </div>
  );
}
