import React from 'react';
import { motion } from 'framer-motion';
import './ActivityFeed.css';

export default function ActivityFeed({ activities }) {
  const getTowerIcon = (towerType) => {
    return towerType === 'premium' ? '💎' : '🪵';
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'block_placed':
        return '🧱';
      case 'tower_collapsed':
        return '💥';
      case 'payout_claimed':
        return '💰';
      default:
        return '📌';
    }
  };

  const getActionText = (activity) => {
    const name = activity.telegram_first_name || 'Player';
    const towerIcon = getTowerIcon(activity.tower_type);

    switch (activity.action) {
      case 'block_placed':
        return `${name} placed ${towerIcon} block #${activity.height}`;
      case 'tower_collapsed':
        return `${name}'s ${towerIcon} tower collapsed at ${activity.height}`;
      case 'payout_claimed':
        return `${name} claimed payout!`;
      default:
        return `${name} did something`;
    }
  };

  const getUserPhoto = (telegramId) => {
    // Telegram doesn't provide profile photos via WebApp API directly
    // We'll use a placeholder or initials
    return null;
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="activity-feed">
      <h3 className="activity-title">Live Activity</h3>
      <div className="activity-list">
        {activities.length === 0 ? (
          <div className="activity-empty">No activity yet...</div>
        ) : (
          activities.map((activity, index) => (
            <motion.div
              key={`${activity.created_at}-${index}`}
              className="activity-item"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="activity-icon">{getActionIcon(activity.action)}</div>
              <div className="activity-content">
                <div className="activity-text">{getActionText(activity)}</div>
                <div className="activity-time">{formatTime(activity.created_at)}</div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
