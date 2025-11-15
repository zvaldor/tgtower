const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/**
 * Telegram WebApp API wrapper
 */
class TelegramWebApp {
  constructor() {
    this.tg = window.Telegram?.WebApp;
    this.user = this.tg?.initDataUnsafe?.user || null;
  }

  ready() {
    this.tg?.ready();
  }

  expand() {
    this.tg?.expand();
  }

  close() {
    this.tg?.close();
  }

  hapticFeedback(type = 'light') {
    const impactStyles = {
      light: 'light',
      medium: 'medium',
      heavy: 'heavy',
    };

    if (this.tg?.HapticFeedback) {
      this.tg.HapticFeedback.impactOccurred(impactStyles[type] || 'light');
    }
  }

  getUserData() {
    return {
      telegram_id: this.user?.id || 123456789, // Default for testing
      username: this.user?.username || 'testuser',
      first_name: this.user?.first_name || 'Test User',
    };
  }

  showAlert(message) {
    if (this.tg?.showAlert) {
      this.tg.showAlert(message);
    } else {
      alert(message);
    }
  }

  showConfirm(message) {
    return new Promise((resolve) => {
      if (this.tg?.showConfirm) {
        this.tg.showConfirm(message, resolve);
      } else {
        resolve(confirm(message));
      }
    });
  }
}

export const telegramWebApp = new TelegramWebApp();

/**
 * API Client
 */
class ApiClient {
  async request(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  /**
   * Get complete game state
   */
  async getGameState() {
    const userData = telegramWebApp.getUserData();

    return this.request('/api/game-state', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  /**
   * Place a block using balance
   */
  async placeBlock() {
    const userData = telegramWebApp.getUserData();

    return this.request('/api/place-block', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  /**
   * Create Telegram Stars invoice
   */
  async createInvoice(type, amount = null, offerId = null) {
    const userData = telegramWebApp.getUserData();

    return this.request('/api/create-invoice', {
      method: 'POST',
      body: JSON.stringify({
        ...userData,
        type,
        amount,
        offer_id: offerId,
      }),
    });
  }

  /**
   * Claim payout from ended season
   */
  async claimPayout(seasonId) {
    const userData = telegramWebApp.getUserData();

    return this.request('/api/claim-payout', {
      method: 'POST',
      body: JSON.stringify({
        telegram_id: userData.telegram_id,
        season_id: seasonId,
      }),
    });
  }
}

export const apiClient = new ApiClient();
