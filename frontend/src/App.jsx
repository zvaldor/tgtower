import React, { useState, useEffect } from 'react';
import { apiClient, telegramWebApp } from './api/client';
import Header from './components/Header';
import TowerCarousel from './components/TowerCarousel';
import ActionButton from './components/ActionButton';
import QuickActions from './components/QuickActions';
import BottomSheet from './components/BottomSheet';
import SpecialOffers from './components/SpecialOffers';
import ActivityFeed from './components/ActivityFeed';
import Leaderboard from './components/Leaderboard';
import ReferralButton from './components/ReferralButton';
import Onboarding from './components/Onboarding';
import ClansPage from './components/ClansPage';
import './App.css';

export default function App() {
  const [gameState, setGameState] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCollapsing, setIsCollapsing] = useState(false);
  const [error, setError] = useState(null);
  const [timeOffset, setTimeOffset] = useState(0); // Server time - client time
  const [currentTowerType, setCurrentTowerType] = useState('regular'); // 'regular' or 'premium'
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Bottom sheet states
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [showOffers, setShowOffers] = useState(false);
  const [showClans, setShowClans] = useState(false);

  // Load game state on mount
  useEffect(() => {
    loadGameState();

    // Initialize Telegram WebApp
    telegramWebApp.expand();
    telegramWebApp.ready();

    // Disable vertical swipes to prevent closing the app
    if (telegramWebApp.tg?.disableVerticalSwipes) {
      telegramWebApp.tg.disableVerticalSwipes();
    }

    // Apply theme
    const theme = telegramWebApp.tg?.colorScheme || 'light';
    document.documentElement.setAttribute('data-theme', theme);

    // Handle app visibility change (resume from background)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // App resumed - sync time with server
        loadGameState();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const loadGameState = async () => {
    try {
      setError(null);
      const data = await apiClient.getGameState();

      // Sync time with server
      if (data.server_time) {
        const serverTime = new Date(data.server_time).getTime();
        const clientTime = Date.now();
        setTimeOffset(serverTime - clientTime);
      }

      // Show onboarding for new users
      if (!data.user.showed_onboarding) {
        setShowOnboarding(true);
      }

      setGameState(data);
    } catch (err) {
      console.error('Failed to load game state:', err);
      setError(err.message);
    }
  };

  const handleOnboardingComplete = async () => {
    setShowOnboarding(false);
    try {
      await apiClient.markOnboardingShown();
    } catch (err) {
      console.error('Failed to mark onboarding shown:', err);
    }
  };

  const handlePlaceBlock = async () => {
    if (!gameState) return;

    try {
      setIsLoading(true);
      setError(null);

      const hasBlocks = gameState.user.blocks_balance > 0;

      if (hasBlocks) {
        // Use block from balance
        telegramWebApp.hapticFeedback('medium');

        const result = await apiClient.placeBlock();

        // Sync time with server
        if (result.server_time) {
          const serverTime = new Date(result.server_time).getTime();
          const clientTime = Date.now();
          setTimeOffset(serverTime - clientTime);
        }

        if (result.collapsed) {
          // Tower collapsed
          setIsCollapsing(true);
          telegramWebApp.hapticFeedback('heavy');

          setTimeout(() => {
            setIsCollapsing(false);
            telegramWebApp.showAlert(`Your tower collapsed at height ${result.height}! Better luck next time.`);
          }, 500);
        } else {
          // Block placed successfully
          telegramWebApp.hapticFeedback('light');
        }

        // Reload game state
        await loadGameState();
      } else {
        // Create invoice for Stars payment
        telegramWebApp.hapticFeedback('light');
        const invoiceData = await apiClient.createInvoice('single_block');

        // Open invoice directly in WebApp
        telegramWebApp.openInvoice(invoiceData.invoice_link, (status) => {
          if (status === 'paid') {
            telegramWebApp.hapticFeedback('heavy');
            loadGameState();
          } else if (status === 'failed') {
            telegramWebApp.showAlert('Payment failed. Please try again.');
          }
          // Don't show alert for 'cancelled' status
        });
      }
    } catch (err) {
      console.error('Failed to place block:', err);
      setError(err.message);
      telegramWebApp.showAlert(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlacePremiumBlock = async () => {
    if (!gameState) return;

    try {
      setIsLoading(true);
      setError(null);

      const hasPremiumBlocks = gameState.user.premium_blocks_balance > 0;

      if (!hasPremiumBlocks) {
        telegramWebApp.showAlert('You need premium blocks! Place 10 regular blocks to earn 1 premium block.');
        return;
      }

      telegramWebApp.hapticFeedback('medium');

      const result = await apiClient.placePremiumBlock();

      // Sync time with server
      if (result.server_time) {
        const serverTime = new Date(result.server_time).getTime();
        const clientTime = Date.now();
        setTimeOffset(serverTime - clientTime);
      }

      if (result.collapsed) {
        // Premium tower collapsed
        setIsCollapsing(true);
        telegramWebApp.hapticFeedback('heavy');

        setTimeout(() => {
          setIsCollapsing(false);
          telegramWebApp.showAlert(
            `Your premium tower collapsed at height ${result.height}! The premium pool is lost.`
          );
        }, 500);
      } else {
        // Block placed successfully
        telegramWebApp.hapticFeedback('light');
      }

      // Reload game state
      await loadGameState();
    } catch (err) {
      console.error('Failed to place premium block:', err);
      setError(err.message);
      telegramWebApp.showAlert(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuyOffer = async (offer) => {
    try {
      telegramWebApp.hapticFeedback('medium');

      // Create invoice for block pack
      const invoiceData = await apiClient.createInvoice('block_pack', offer.blocks_amount, offer.id);

      // Open invoice directly in WebApp
      telegramWebApp.openInvoice(invoiceData.invoice_link, (status) => {
        if (status === 'paid') {
          telegramWebApp.hapticFeedback('heavy');
          telegramWebApp.showAlert('Blocks added to your balance!');
          loadGameState();
        } else if (status === 'failed') {
          telegramWebApp.showAlert('Payment failed. Please try again.');
        }
        // Don't show alert for 'cancelled' status
      });
    } catch (err) {
      console.error('Failed to buy offer:', err);
      telegramWebApp.showAlert(`Error: ${err.message}`);
    }
  };

  if (error && !gameState) {
    return (
      <div className="container">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <div className="error-title">Connection Error</div>
          <div className="error-message">{error}</div>
          <button className="button button-primary" onClick={loadGameState}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading game...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}

      {/* Main Screen */}
      <div className="main-screen">
        {/* Header */}
        <div className="main-header">
          <Header season={gameState.season} user={gameState.user} timeOffset={timeOffset} />
        </div>

        {/* Tower Display */}
        <div className="tower-container">
          <TowerCarousel
            regularTower={gameState.tower}
            premiumTower={gameState.premium_tower}
            isCollapsing={isCollapsing}
            onTowerChange={setCurrentTowerType}
          />
        </div>

        {/* Fixed Action Button (Dynamic Island style) */}
        <div className="action-island">
          <ActionButton
            tower={gameState.tower}
            premiumTower={gameState.premium_tower}
            user={gameState.user}
            currentTowerType={currentTowerType}
            onPlaceBlock={handlePlaceBlock}
            onPlacePremiumBlock={handlePlacePremiumBlock}
            isLoading={isLoading}
          />

          {/* Quick Actions */}
          <QuickActions
            onOpenLeaderboard={() => setShowLeaderboard(true)}
            onOpenActivity={() => setShowActivity(true)}
            onOpenOffers={() => setShowOffers(true)}
            onOpenClans={() => setShowClans(true)}
          />
        </div>
      </div>

      {/* Bottom Sheets */}
      <BottomSheet
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        title="🏆 Top Tower Builders"
        height="85vh"
      >
        <Leaderboard
          leaderboard={gameState.leaderboard || []}
          premiumLeaderboard={gameState.premium_leaderboard || []}
        />
        <ReferralButton
          userId={gameState.user.telegram_id}
          botUsername={gameState.bot_username}
        />
      </BottomSheet>

      <BottomSheet
        isOpen={showActivity}
        onClose={() => setShowActivity(false)}
        title="⚡ Live Activity"
        height="85vh"
      >
        <ActivityFeed activities={gameState.activity_feed || []} />
      </BottomSheet>

      <BottomSheet
        isOpen={showOffers}
        onClose={() => setShowOffers(false)}
        title="🎁 Special Offers"
        height="70vh"
      >
        {gameState.special_offers && gameState.special_offers.length > 0 ? (
          <SpecialOffers offers={gameState.special_offers} onBuyOffer={handleBuyOffer} />
        ) : (
          <div className="empty-state">
            <p>No special offers available at the moment.</p>
          </div>
        )}
      </BottomSheet>

      <BottomSheet
        isOpen={showClans}
        onClose={() => setShowClans(false)}
        title="🛡️ Clans"
        height="85vh"
      >
        <ClansPage
          clans={gameState.clans || []}
          clanLeaderboard={gameState.clan_leaderboard || []}
          userClan={gameState.user?.clan}
          clanOffers={gameState.clan_offers || []}
          seasonNumber={gameState.season?.number}
          towerIsCollapsed={gameState.tower?.is_collapsed}
          onClanJoined={loadGameState}
          onBuyOffer={handleBuyOffer}
        />
      </BottomSheet>
    </div>
  );
}
