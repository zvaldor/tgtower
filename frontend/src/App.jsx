import React, { useState, useEffect } from 'react';
import { apiClient, telegramWebApp } from './api/client';
import Header from './components/Header';
import TowerCarousel from './components/TowerCarousel';
import ActionButton from './components/ActionButton';
import SpecialOffers from './components/SpecialOffers';
import ActivityFeed from './components/ActivityFeed';
import Leaderboard from './components/Leaderboard';
import ReferralButton from './components/ReferralButton';
import Onboarding from './components/Onboarding';
import ScreenCarousel from './components/ScreenCarousel';
import ScrollToTopButton from './components/ScrollToTopButton';
import './App.css';

export default function App() {
  const [gameState, setGameState] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCollapsing, setIsCollapsing] = useState(false);
  const [error, setError] = useState(null);
  const [timeOffset, setTimeOffset] = useState(0); // Server time - client time
  const [currentTowerType, setCurrentTowerType] = useState('regular'); // 'regular' or 'premium'
  const [showOnboarding, setShowOnboarding] = useState(false);

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

      <ScreenCarousel>
        {/* Screen 1: Main Screen */}
        <div className="screen">
          <div className="screen-header">
            <div className="container">
              <Header season={gameState.season} user={gameState.user} timeOffset={timeOffset} />
            </div>
          </div>
          <div className="screen-content">
            <TowerCarousel
              regularTower={gameState.tower}
              premiumTower={gameState.premium_tower}
              isCollapsing={isCollapsing}
              onTowerChange={setCurrentTowerType}
            />

            <ActionButton
              tower={gameState.tower}
              premiumTower={gameState.premium_tower}
              user={gameState.user}
              currentTowerType={currentTowerType}
              onPlaceBlock={handlePlaceBlock}
              onPlacePremiumBlock={handlePlacePremiumBlock}
              isLoading={isLoading}
            />

            {gameState.special_offers && gameState.special_offers.length > 0 && (
              <SpecialOffers offers={gameState.special_offers} onBuyOffer={handleBuyOffer} />
            )}
          </div>
        </div>

        {/* Screen 2: Top Tower Builders */}
        <div className="screen">
          <div className="container">
            <h2 className="screen-title">🏆 Top Tower Builders</h2>
            <Leaderboard
              leaderboard={gameState.leaderboard || []}
              premiumLeaderboard={gameState.premium_leaderboard || []}
            />

            <ReferralButton
              userId={gameState.user.telegram_id}
              botUsername={gameState.bot_username}
            />
          </div>
        </div>

        {/* Screen 3: Live Activity */}
        <div className="screen">
          <div className="container">
            <h2 className="screen-title">⚡ Live Activity</h2>
            <ActivityFeed activities={gameState.activity_feed || []} />
            <ScrollToTopButton />
          </div>
        </div>
      </ScreenCarousel>
    </div>
  );
}
