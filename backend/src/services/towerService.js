import pool from '../config/database.js';
import { checkCollapse, calculateCollapseChance, calculatePayout } from './gameLogic.js';
import { updateSeasonStats, getTotalSurvivorHeight } from './seasonService.js';

/**
 * Get or create tower for user in current season
 */
export async function getOrCreateTower(userId, seasonId) {
  const client = await pool.connect();

  try {
    // Try to find existing tower
    let result = await client.query(
      'SELECT * FROM towers WHERE user_id = $1 AND season_id = $2',
      [userId, seasonId]
    );

    if (result.rows.length > 0) {
      return result.rows[0];
    }

    // Create new tower
    result = await client.query(
      `INSERT INTO towers (user_id, season_id, height, is_collapsed)
       VALUES ($1, $2, 0, false)
       RETURNING *`,
      [userId, seasonId]
    );

    return result.rows[0];
  } finally {
    client.release();
  }
}

/**
 * Place a block on user's tower
 */
export async function placeBlock(userId, seasonId, paidWithStars = true) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get tower
    const towerResult = await client.query(
      'SELECT * FROM towers WHERE user_id = $1 AND season_id = $2',
      [userId, seasonId]
    );

    if (towerResult.rows.length === 0) {
      throw new Error('Tower not found');
    }

    const tower = towerResult.rows[0];

    if (tower.is_collapsed) {
      throw new Error('Tower already collapsed');
    }

    // If not paid with Stars, deduct from blocks_balance
    if (!paidWithStars) {
      const userResult = await client.query(
        'SELECT blocks_balance FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows[0].blocks_balance < 1) {
        throw new Error('Insufficient blocks');
      }

      await client.query(
        'UPDATE users SET blocks_balance = blocks_balance - 1 WHERE id = $1',
        [userId]
      );
    }

    // Increment tower height
    const newHeight = tower.height + 1;

    await client.query(
      'UPDATE towers SET height = $1, updated_at = NOW() WHERE id = $2',
      [newHeight, tower.id]
    );

    // Create block record
    const blockResult = await client.query(
      `INSERT INTO blocks (tower_id, block_number)
       VALUES ($1, $2)
       RETURNING id`,
      [tower.id, newHeight]
    );

    const blockId = blockResult.rows[0].id;

    // Check for collapse
    const collapsed = checkCollapse(newHeight);

    if (collapsed) {
      // Tower collapsed
      await client.query(
        'UPDATE towers SET is_collapsed = true, collapse_height = $1 WHERE id = $2',
        [newHeight, tower.id]
      );

      await client.query(
        'UPDATE blocks SET was_fatal = true WHERE id = $1',
        [blockId]
      );

      // Add to activity feed
      await client.query(
        `INSERT INTO activity_feed (user_id, season_id, action, height)
         VALUES ($1, $2, 'tower_collapsed', $3)`,
        [userId, seasonId, newHeight]
      );
    } else {
      // Tower still standing
      await client.query(
        `INSERT INTO activity_feed (user_id, season_id, action, height)
         VALUES ($1, $2, 'block_placed', $3)`,
        [userId, seasonId, newHeight]
      );
    }

    // Update season stats (if paid with Stars)
    if (paidWithStars) {
      await client.query(
        `UPDATE seasons
         SET total_pool = total_pool + 10,
             total_blocks = total_blocks + 1
         WHERE id = $1`,
        [seasonId]
      );

      // Update user stats
      await client.query(
        `UPDATE users
         SET total_blocks_placed = total_blocks_placed + 1,
             total_stars_spent = total_stars_spent + 10
         WHERE id = $1`,
        [userId]
      );
    } else {
      // Only update blocks count
      await client.query(
        `UPDATE seasons SET total_blocks = total_blocks + 1 WHERE id = $1`,
        [seasonId]
      );

      await client.query(
        `UPDATE users SET total_blocks_placed = total_blocks_placed + 1 WHERE id = $1`,
        [userId]
      );
    }

    await client.query('COMMIT');

    return {
      collapsed,
      height: newHeight,
      collapse_chance: calculateCollapseChance(newHeight + 1),
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Calculate potential payout for user's tower
 */
export async function calculatePotentialPayout(userId, seasonId) {
  const client = await pool.connect();

  try {
    // Get user's tower
    const towerResult = await client.query(
      'SELECT * FROM towers WHERE user_id = $1 AND season_id = $2',
      [userId, seasonId]
    );

    if (towerResult.rows.length === 0 || towerResult.rows[0].is_collapsed) {
      return 0;
    }

    const tower = towerResult.rows[0];

    // Get season
    const seasonResult = await client.query(
      'SELECT total_pool FROM seasons WHERE id = $1',
      [seasonId]
    );

    const season = seasonResult.rows[0];

    // Get total survivor height
    const totalSurvivorHeight = await getTotalSurvivorHeight(seasonId);

    if (totalSurvivorHeight === 0) {
      return 0;
    }

    return calculatePayout(tower.height, totalSurvivorHeight, season.total_pool);
  } finally {
    client.release();
  }
}

/**
 * Get leaderboard for season
 */
export async function getLeaderboard(seasonId, limit = 100) {
  const result = await pool.query(
    `SELECT
       u.telegram_first_name,
       u.telegram_username,
       t.height,
       t.is_collapsed
     FROM towers t
     JOIN users u ON t.user_id = u.id
     WHERE t.season_id = $1
     ORDER BY t.height DESC, t.created_at ASC
     LIMIT $2`,
    [seasonId, limit]
  );

  return result.rows;
}

/**
 * Claim payout for ended season
 */
export async function claimPayout(userId, seasonId) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verify season is ended
    const seasonResult = await client.query(
      'SELECT * FROM seasons WHERE id = $1',
      [seasonId]
    );

    if (seasonResult.rows.length === 0) {
      throw new Error('Season not found');
    }

    const season = seasonResult.rows[0];

    if (season.status !== 'ended') {
      throw new Error('Season is not ended yet');
    }

    // Get user's tower
    const towerResult = await client.query(
      'SELECT * FROM towers WHERE user_id = $1 AND season_id = $2',
      [userId, seasonId]
    );

    if (towerResult.rows.length === 0) {
      throw new Error('Tower not found');
    }

    const tower = towerResult.rows[0];

    if (tower.is_collapsed) {
      throw new Error('Tower collapsed - no payout');
    }

    if (tower.final_payout !== null) {
      throw new Error('Payout already claimed');
    }

    // Calculate payout
    const totalSurvivorHeight = await getTotalSurvivorHeight(seasonId);
    const payout = calculatePayout(tower.height, totalSurvivorHeight, season.total_pool);

    // Update tower
    await client.query(
      'UPDATE towers SET final_payout = $1 WHERE id = $2',
      [payout, tower.id]
    );

    // Update user stats
    await client.query(
      'UPDATE users SET total_stars_won = total_stars_won + $1 WHERE id = $2',
      [payout, userId]
    );

    // Add to activity feed
    await client.query(
      `INSERT INTO activity_feed (user_id, season_id, action, height)
       VALUES ($1, $2, 'payout_claimed', $3)`,
      [userId, seasonId, tower.height]
    );

    await client.query('COMMIT');

    return { payout };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
