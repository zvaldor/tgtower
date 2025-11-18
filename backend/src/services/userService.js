import pool from '../config/database.js';

/**
 * Get or create user from Telegram data
 */
export async function getOrCreateUser(telegramId, username, firstName, referredByTelegramId = null) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Try to find existing user
    let result = await client.query(
      'SELECT * FROM users WHERE telegram_id = $1',
      [telegramId]
    );

    if (result.rows.length > 0) {
      await client.query('COMMIT');
      return { user: result.rows[0], isNewUser: false, referrerTelegramId: null };
    }

    // Create new user
    let referrerId = null;
    let referrerTelegramId = null;
    if (referredByTelegramId) {
      const referrerResult = await client.query(
        'SELECT id, telegram_id FROM users WHERE telegram_id = $1',
        [referredByTelegramId]
      );

      if (referrerResult.rows.length > 0) {
        referrerId = referrerResult.rows[0].id;
        referrerTelegramId = referrerResult.rows[0].telegram_id;

        // Give referrer +1 block bonus
        await client.query(
          'UPDATE users SET blocks_balance = blocks_balance + 1 WHERE id = $1',
          [referrerId]
        );
      }
    }

    // Create user with +1 block if referred
    result = await client.query(
      `INSERT INTO users (telegram_id, telegram_username, telegram_first_name, referred_by, blocks_balance)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [telegramId, username, firstName, referrerId, referrerId ? 1 : 0]
    );

    const newUser = result.rows[0];

    // Create newcomer special offer (50 blocks for 475 Stars, expires in 3 days)
    await client.query(
      `INSERT INTO special_offers (user_id, offer_type, blocks_amount, stars_price, expires_at)
       VALUES ($1, 'newcomer_50blocks', 50, 475, NOW() + INTERVAL '3 days')`,
      [newUser.id]
    );

    await client.query('COMMIT');
    return { user: newUser, isNewUser: true, referrerTelegramId };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get user by telegram_id
 */
export async function getUserByTelegramId(telegramId) {
  const result = await pool.query(
    'SELECT * FROM users WHERE telegram_id = $1',
    [telegramId]
  );

  return result.rows[0] || null;
}

/**
 * Update user blocks balance
 */
export async function updateUserBlocksBalance(userId, amount) {
  const result = await pool.query(
    'UPDATE users SET blocks_balance = blocks_balance + $1 WHERE id = $2 RETURNING *',
    [amount, userId]
  );

  return result.rows[0];
}

/**
 * Get user statistics
 */
export async function getUserStats(userId) {
  const result = await pool.query(
    `SELECT
       total_blocks_placed,
       total_stars_spent,
       total_stars_won,
       blocks_balance
     FROM users
     WHERE id = $1`,
    [userId]
  );

  return result.rows[0] || null;
}
