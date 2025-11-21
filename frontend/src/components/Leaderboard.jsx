import React from 'react';
import './Leaderboard.css';

export default function Leaderboard({ leaderboard, premiumLeaderboard }) {
  // Merge leaderboards by username
  const mergedLeaderboard = leaderboard.slice(0, 10).map((entry) => {
    const premiumEntry = premiumLeaderboard.find(
      (p) => p.telegram_username === entry.telegram_username
    );
    return {
      ...entry,
      premium_height: premiumEntry?.height || 0,
      premium_collapsed: premiumEntry?.is_collapsed || false,
    };
  });

  return (
    <div className="leaderboard">
      <h3 className="leaderboard-title">Top Towers</h3>
      <div className="leaderboard-list">
        {mergedLeaderboard.map((entry, index) => (
          <div key={index} className="leaderboard-item">
            <div className="leaderboard-rank">
              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
            </div>
            <div className="leaderboard-content">
              <div className="leaderboard-name">{entry.telegram_first_name || 'Player'}</div>
              <div className="leaderboard-heights">
                <span className="height-regular">
                  🪵 {entry.height} {entry.is_collapsed && '💥'}
                </span>
                {entry.premium_height > 0 && (
                  <span className="height-premium">
                    💎 {entry.premium_height} {entry.premium_collapsed && '💥'}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
