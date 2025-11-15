import React, { useState, useEffect } from 'react';
import { apiClient, telegramWebApp } from './api/client';
import Header from './components/Header';
import TowerDisplay from './components/TowerDisplay';
import ActionButton from './components/ActionButton';
import SpecialOffers from './components/SpecialOffers';
import ActivityFeed from './components/ActivityFeed';
import Leaderboard from './components/Leaderboard';
import './App.css';

export default function App() {
  const [gameState, setGameState] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCollapsing, setIsCollapsing] = useState(false);
  const [error, setError] = useState(null);

  // Load game state on mount
  useEffect(() => {
    loadGameState();

    // Initialize Telegram WebApp
    telegramWebApp.expand();
    telegramWebApp.ready();

    // Apply theme
    const theme = telegramWebApp.tg?.colorScheme || 'light';
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  const loadGameState = async () => {
    try {
      setError(null);
      const data = await apiClient.getGameState();
      setGameState(data);
    } catch (err) {
      console.error('Failed to load game state:', err);
      setError(err.message);
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
        await apiClient.createInvoice('single_block');

        // Show message and reload after payment
        telegramWebApp.showAlert('Invoice sent! Complete payment to place block.');

        // Reload game state after a short delay
        setTimeout(loadGameState, 2000);
      }
    } catch (err) {
      console.error('Failed to place block:', err);
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
      await apiClient.createInvoice('block_pack', offer.blocks_amount, offer.id);

      telegramWebApp.showAlert('Invoice sent! Complete payment to receive blocks.');

      // Reload game state after a short delay
      setTimeout(loadGameState, 2000);
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
      <div className="container">
        <Header season={gameState.season} user={gameState.user} />

        <TowerDisplay tower={gameState.tower} isCollapsing={isCollapsing} />

        <ActionButton
          tower={gameState.tower}
          user={gameState.user}
          onPlaceBlock={handlePlaceBlock}
          isLoading={isLoading}
        />

        {gameState.special_offers && gameState.special_offers.length > 0 && (
          <SpecialOffers offers={gameState.special_offers} onBuyOffer={handleBuyOffer} />
        )}

        <ActivityFeed activities={gameState.activity_feed || []} />

        <Leaderboard leaderboard={gameState.leaderboard || []} />
      </div>
    </div>
  );
}
