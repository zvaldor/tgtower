import React from 'react';
import { motion } from 'framer-motion';
import './ActionButton.css';

export default function ActionButton({
  tower,
  premiumTower,
  user,
  currentTowerType,
  onPlaceBlock,
  onPlacePremiumBlock,
  isLoading,
}) {
  const isPremium = currentTowerType === 'premium';
  const currentTower = isPremium ? premiumTower : tower;
  const hasBlocks = isPremium ? user.premium_blocks_balance > 0 : user.blocks_balance > 0;
  const isCollapsed = currentTower.is_collapsed;

  const handleClick = () => {
    if (isLoading) return;
    if (isPremium) {
      onPlacePremiumBlock();
    } else {
      onPlaceBlock();
    }
  };

  const getButtonText = () => {
    if (isLoading) return 'Placing...';
    if (isCollapsed) return '🔄 Start New Season';

    if (isPremium) {
      return hasBlocks
        ? `➕ Place Premium Block (${user.premium_blocks_balance})`
        : '🔒 Need Premium Blocks (10 regular blocks = 1 premium)';
    } else {
      return hasBlocks ? '➕ Place Block' : '➕ Place Block (10 ⭐️)';
    }
  };

  return (
    <div className="action-button-container">
      <motion.button
        className={`action-button ${isCollapsed ? 'button-danger' : isPremium ? 'button-premium' : 'button-primary'}`}
        onClick={handleClick}
        disabled={isLoading || (isPremium && !hasBlocks)}
        whileTap={{ scale: 0.98 }}
        whileHover={{ scale: 1.02 }}
      >
        <span>{getButtonText()}</span>
      </motion.button>
    </div>
  );
}
