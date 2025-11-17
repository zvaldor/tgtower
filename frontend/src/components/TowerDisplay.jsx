import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './TowerDisplay.css';

export default function TowerDisplay({ tower, isCollapsing }) {
  const maxBlocksToShow = 20;
  const blocksToShow = Math.min(tower.height, maxBlocksToShow);

  return (
    <div className="tower-display">
      {tower.is_collapsed ? (
        <motion.div
          className="collapsed-state"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="collapsed-icon">💥</div>
          <div className="collapsed-title">Tower Collapsed!</div>
          <div className="collapsed-height">Height reached: {tower.collapse_height}</div>
        </motion.div>
      ) : (
        <div className="standing-state">
          <motion.div
            className="height-number gradient-text"
            animate={isCollapsing ? { scale: [1, 0.95, 1], rotate: [0, -2, 2, 0] } : {}}
            transition={{ duration: 0.5 }}
          >
            {tower.height}
          </motion.div>

          <div className="blocks-visual">
            <AnimatePresence>
              {[...Array(blocksToShow)].map((_, index) => (
                <motion.div
                  key={index}
                  className="block"
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  transition={{ delay: index * 0.02, duration: 0.2 }}
                />
              ))}
            </AnimatePresence>
            {tower.height > maxBlocksToShow && (
              <div className="blocks-overflow">+{tower.height - maxBlocksToShow} more</div>
            )}
          </div>

          <div className="tower-stats">
            <div className="stat-item">
              <span className="stat-label">Potential Payout</span>
              <span className="stat-value">{tower.potential_payout} ⭐️</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Next Block Risk</span>
              <span className="stat-value stat-danger">
                {(tower.next_block_collapse_chance * 100).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
