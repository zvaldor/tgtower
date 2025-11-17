import React from 'react';
import { telegramWebApp } from '../api/client';
import './ReferralButton.css';

export default function ReferralButton({ userId, botUsername }) {
  const handleInviteFriend = () => {
    if (!userId || !botUsername) return;

    // Generate referral link
    const referralCode = userId;
    const referralLink = `https://t.me/${botUsername}?start=${referralCode}`;

    // Share link using Telegram's share functionality
    const shareText = `🏗️ Join me in Tower Build!\n\nBuild the tallest tower together and win Stars!\n\n🎁 We both get 1 free block when you join!`;

    if (telegramWebApp.tg?.openTelegramLink) {
      // Use Telegram share dialog
      const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`;
      telegramWebApp.tg.openTelegramLink(shareUrl);
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(referralLink).then(() => {
        telegramWebApp.showAlert('Referral link copied to clipboard!');
      });
    }

    telegramWebApp.hapticFeedback('medium');
  };

  return (
    <div className="referral-button-container">
      <button className="referral-button" onClick={handleInviteFriend}>
        👥 Invite a Friend - Get 1 Free Block Each!
      </button>
    </div>
  );
}
