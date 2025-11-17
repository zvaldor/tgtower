import React, { useState, useEffect } from 'react';
import './Header.css';

export default function Header({ season, user, timeOffset = 0 }) {
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update current time every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const endDate = new Date(season.end_time);
  const now = new Date(currentTime + timeOffset);
  const timeLeft = Math.max(0, endDate - now);
  const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hoursLeft = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

  // Format time left string
  let timeLeftStr = '';
  if (daysLeft > 0) {
    timeLeftStr = `${daysLeft}d ${hoursLeft}h ${minutesLeft}m left`;
  } else if (hoursLeft > 0) {
    timeLeftStr = `${hoursLeft}h ${minutesLeft}m left`;
  } else {
    timeLeftStr = `${minutesLeft}m left`;
  }

  return (
    <div className="header">
      <div className="header-row">
        <div className="season-info">
          <span className="season-label">Season {season.number}</span>
          <span className="season-time">{timeLeftStr}</span>
        </div>
        <div className="prize-pool">
          <span className="pool-label">Prize Pool</span>
          <span className="pool-amount">{season.total_pool} ⭐️</span>
        </div>
        {user.blocks_balance > 0 && (
          <div className="balance-item">
            <span className="balance-label">Your Blocks</span>
            <span className="balance-value">{user.blocks_balance}</span>
          </div>
        )}
      </div>
    </div>
  );
}
