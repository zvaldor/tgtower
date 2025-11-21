import React, { useState } from 'react';
import TowerDisplay from './TowerDisplay';
import './TowerCarousel.css';

export default function TowerCarousel({ regularTower, premiumTower, isCollapsing, onTowerChange }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const towers = [
    { type: 'regular', data: regularTower, icon: '🪵', name: 'Wooden Tower' },
    { type: 'premium', data: premiumTower, icon: '💎', name: 'Premium Tower' },
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
        <TowerDisplay
          tower={currentTower.data}
          isCollapsing={isCollapsing && currentIndex === 0}
          isPremium={currentTower.type === 'premium'}
          towerIcon={currentTower.icon}
        />
      </div>

      <button className="carousel-arrow carousel-arrow-right" onClick={handleNext}>
        ▶
      </button>
    </div>
  );
}
