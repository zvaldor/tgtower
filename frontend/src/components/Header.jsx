import React from 'react';
import './Header.css';

export default function Header({ season, user }) {
  const endDate = new Date(season.end_time);
  const now = new Date();
  const timeLeft = Math.max(0, endDate - now);
  const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hoursLeft = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  return (
    <div className="header">
      <div className="header-season">
        <div className="season-info">
          <span className="season-label">Season {season.number}</span>
          <span className="season-time">
            {daysLeft > 0 ? `${daysLeft}d ${hoursLeft}h left` : `${hoursLeft}h left`}
          </span>
        </div>
        <div className="prize-pool">
          <span className="pool-label">Prize Pool</span>
          <span className="pool-amount">{season.total_pool} ⭐️</span>
        </div>
      </div>

      <div className="header-balance">
        <div className="balance-item">
          <span className="balance-label">Your Blocks</span>
          <span className="balance-value">{user.blocks_balance}</span>
        </div>
      </div>
    </div>
  );
}
