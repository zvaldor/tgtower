import pool from '../config/database.js';

/**
 * Get active special offers for user
 */
export async function getActiveOffers(userId) {
  const result = await pool.query(
    `SELECT * FROM special_offers
     WHERE user_id = $1
       AND is_claimed = false
       AND expires_at > NOW()
     ORDER BY created_at DESC`,
    [userId]
  );

  return result.rows;
}

/**
 * Claim special offer
 */
export async function claimOffer(userId, offerId) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get offer
    const offerResult = await client.query(
      `SELECT * FROM special_offers
       WHERE id = $1 AND user_id = $2`,
      [offerId, userId]
    );

    if (offerResult.rows.length === 0) {
      throw new Error('Offer not found');
    }

    const offer = offerResult.rows[0];

    if (offer.is_claimed) {
      throw new Error('Offer already claimed');
    }

    if (new Date(offer.expires_at) < new Date()) {
      throw new Error('Offer expired');
    }

    // Mark offer as claimed
    await client.query(
      'UPDATE special_offers SET is_claimed = true WHERE id = $1',
      [offerId]
    );

    // Add blocks to user balance
    await client.query(
      'UPDATE users SET blocks_balance = blocks_balance + $1 WHERE id = $2',
      [offer.blocks_amount, userId]
    );

    await client.query('COMMIT');

    return { blocks_added: offer.blocks_amount };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
