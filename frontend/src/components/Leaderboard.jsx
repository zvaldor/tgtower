import React from 'react';
import './Leaderboard.css';

export default function Leaderboard({ leaderboard }) {
  return (
    <div className="leaderboard">
      <h3 className="leaderboard-title">Top Towers</h3>
      <div className="leaderboard-list">
        {leaderboard.slice(0, 10).map((entry, index) => (
          <div key={index} className="leaderboard-item">
            <div className="leaderboard-rank">
              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
            </div>
            <div className="leaderboard-content">
              <div className="leaderboard-name">{entry.telegram_first_name || 'Player'}</div>
              <div className="leaderboard-height">
                {entry.height} blocks {entry.is_collapsed && '💥'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
