import React from 'react';
import { motion } from 'framer-motion';
import './ActionButton.css';

export default function ActionButton({ tower, user, onPlaceBlock, isLoading }) {
  const hasBlocks = user.blocks_balance > 0;
  const isCollapsed = tower.is_collapsed;

  const handleClick = () => {
    if (isLoading) return;
    onPlaceBlock();
  };

  return (
    <div className="action-button-container">
      <motion.button
        className={`action-button ${isCollapsed ? 'button-danger' : 'button-primary'}`}
        onClick={handleClick}
        disabled={isLoading}
        whileTap={{ scale: 0.98 }}
        whileHover={{ scale: 1.02 }}
      >
        {isLoading ? (
          <span>Placing...</span>
        ) : isCollapsed ? (
          <span>🔄 Start New Season</span>
        ) : hasBlocks ? (
          <span>➕ Place Block</span>
        ) : (
          <span>➕ Place Block (10 ⭐️)</span>
        )}
      </motion.button>
    </div>
  );
}
