import React from 'react';
import './QuickActions.css';

export default function QuickActions({ onOpenLeaderboard, onOpenActivity, onOpenOffers, onOpenClans }) {
  return (
    <div className="quick-actions">
      <button className="quick-action-button" onClick={onOpenLeaderboard}>
        <span className="quick-action-icon">🏆</span>
        <span className="quick-action-label">Top Builders</span>
      </button>

      <button className="quick-action-button" onClick={onOpenActivity}>
        <span className="quick-action-icon">⚡</span>
        <span className="quick-action-label">Live Activity</span>
      </button>

      <button className="quick-action-button" onClick={onOpenOffers}>
        <span className="quick-action-icon">🎁</span>
        <span className="quick-action-label">Offers</span>
      </button>

      <button className="quick-action-button" onClick={onOpenClans}>
        <span className="quick-action-icon">🛡️</span>
        <span className="quick-action-label">Clans</span>
      </button>
    </div>
  );
}
