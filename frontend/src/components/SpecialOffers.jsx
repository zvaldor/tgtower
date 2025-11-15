import React from 'react';
import { motion } from 'framer-motion';
import './SpecialOffers.css';

export default function SpecialOffers({ offers, onBuyOffer }) {
  if (!offers || offers.length === 0) {
    return null;
  }

  const formatTimeLeft = (expiresAt) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires - now;

    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  return (
    <div className="special-offers">
      <h3 className="offers-title">Special Offers</h3>
      <div className="offers-list">
        {offers.map((offer) => (
          <motion.div
            key={offer.id}
            className="offer-card"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="offer-badge">Limited Time</div>
            <div className="offer-content">
              <div className="offer-title">
                {offer.offer_type === 'newcomer_50blocks' ? 'Newcomer Pack' : 'Special Pack'}
              </div>
              <div className="offer-description">{offer.blocks_amount} Blocks</div>
              <div className="offer-price">{offer.stars_price} ⭐️</div>
              <div className="offer-expires">{formatTimeLeft(offer.expires_at)}</div>
            </div>
            <motion.button
              className="offer-button button-success"
              onClick={() => onBuyOffer(offer)}
              whileTap={{ scale: 0.95 }}
            >
              Buy Now
            </motion.button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
