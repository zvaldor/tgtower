import React, { useState } from 'react';
import { apiClient, telegramWebApp } from '../api/client';
import './ClansPage.css';

export default function ClansPage({
  clans,
  clanLeaderboard,
  userClan,
  clanOffers,
  seasonNumber,
  towerIsCollapsed,
  onClanJoined,
  onBuyOffer
}) {
  const [selectedClan, setSelectedClan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleJoinClan = async (clanId) => {
    try {
      setIsLoading(true);
      telegramWebApp.hapticFeedback('medium');

      const result = await apiClient.joinClan(clanId, seasonNumber);

      if (result.success) {
        telegramWebApp.hapticFeedback('heavy');
        telegramWebApp.showAlert(`Successfully joined ${result.clan.name}!`);
        if (onClanJoined) onClanJoined();
      }
    } catch (error) {
      console.error('Failed to join clan:', error);
      telegramWebApp.showAlert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveClan = async () => {
    try {
      const confirmed = await telegramWebApp.showConfirm(
        'Are you sure you want to leave your clan? You can only change clans between seasons.'
      );

      if (!confirmed) return;

      setIsLoading(true);
      telegramWebApp.hapticFeedback('medium');

      const result = await apiClient.leaveClan(seasonNumber, towerIsCollapsed);

      if (result.success) {
        telegramWebApp.hapticFeedback('heavy');
        telegramWebApp.showAlert('Successfully left clan');
        if (onClanJoined) onClanJoined();
      }
    } catch (error) {
      console.error('Failed to leave clan:', error);
      telegramWebApp.showAlert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const canChangeClan = !userClan || towerIsCollapsed;

  return (
    <div className="clans-page">
      {/* User's Current Clan */}
      {userClan && (
        <div className="current-clan-section">
          <h3>Your Clan</h3>
          <div
            className="clan-card current"
            style={{
              background: `linear-gradient(135deg, ${userClan.color_primary}, ${userClan.color_secondary})`
            }}
          >
            <div className="clan-icon">{userClan.icon}</div>
            <div className="clan-info">
              <h3 className="clan-name">{userClan.name}</h3>
              <p className="clan-description">{userClan.description}</p>
            </div>
          </div>

          {canChangeClan && (
            <button
              className="button button-danger"
              onClick={handleLeaveClan}
              disabled={isLoading}
              style={{ marginTop: '12px' }}
            >
              Leave Clan
            </button>
          )}
        </div>
      )}

      {/* Clan Special Offers */}
      {userClan && clanOffers && clanOffers.length > 0 && (
        <div className="clan-offers-section">
          <h3>🎁 Exclusive Clan Offers</h3>
          <div className="clan-offers-grid">
            {clanOffers.map((offer) => (
              <div
                key={offer.id}
                className="clan-offer-card"
                onClick={() => onBuyOffer && onBuyOffer(offer)}
                style={{
                  background: `linear-gradient(135deg, ${userClan.color_primary}, ${userClan.color_secondary})`
                }}
              >
                <div className="clan-offer-icon">📦</div>
                <div className="clan-offer-info">
                  <div className="clan-offer-amount">{offer.blocks_amount} Blocks</div>
                  <div className="clan-offer-price">{offer.stars_price} ⭐️</div>
                </div>
                <div className="clan-offer-badge">CLAN EXCLUSIVE</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clan Leaderboard */}
      <div className="clan-leaderboard-section">
        <h3>🏆 Clan Rankings</h3>
        <div className="clan-leaderboard">
          {clanLeaderboard.map((clan, index) => (
            <div
              key={clan.id}
              className="clan-leaderboard-item"
              onClick={() => setSelectedClan(clan)}
            >
              <div className="clan-rank">#{index + 1}</div>
              <div className="clan-icon-small">{clan.icon}</div>
              <div className="clan-leaderboard-info">
                <div className="clan-name">{clan.name}</div>
                <div className="clan-stats">
                  {clan.member_count} members • {clan.total_blocks} blocks
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* All Clans */}
      {canChangeClan && (
        <div className="all-clans-section">
          <h3>All Clans</h3>
          <div className="clans-grid">
            {clans.map((clan) => (
              <div
                key={clan.id}
                className="clan-card"
                style={{
                  background: `linear-gradient(135deg, ${clan.color_primary}, ${clan.color_secondary})`
                }}
                onClick={() => {
                  if (userClan?.id !== clan.id) {
                    handleJoinClan(clan.id);
                  }
                }}
              >
                <div className="clan-icon">{clan.icon}</div>
                <div className="clan-info">
                  <h3 className="clan-name">{clan.name}</h3>
                  <p className="clan-description">{clan.description}</p>
                  <div className="clan-stats">
                    {clan.member_count || 0} members
                  </div>
                </div>
                {userClan?.id === clan.id && (
                  <div className="clan-badge">Your Clan</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!canChangeClan && (
        <div className="info-message">
          ℹ️ You can change clans after the tower collapses and a new season begins.
        </div>
      )}
    </div>
  );
}
