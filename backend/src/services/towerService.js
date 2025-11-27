import pool from '../config/database.js';
import { checkCollapse, calculateCollapseChance, calculatePayout } from './gameLogic.js';
import { updateSeasonStats, getTotalSurvivorHeight } from './seasonService.js';

/**
 * Get or create shared tower for season (one tower for all users)
 */
export async function getOrCreateTower(userId, seasonId) {
  const client = await pool.connect();

  try {
    // Try to find existing tower for this season (shared by all users)
    let result = await client.query(
      'SELECT * FROM towers WHERE season_id = $1 AND user_id IS NULL',
      [seasonId]
    );

    if (result.rows.length > 0) {
      return result.rows[0];
    }

    // Create new shared tower for the season
    result = await client.query(
      `INSERT INTO towers (user_id, season_id, height, is_collapsed)
       VALUES (NULL, $1, 0, false)
       RETURNING *`,
      [seasonId]
    );

    return result.rows[0];
  } finally {
    client.release();
  }
}

/**
 * Place a block on shared tower
 */
export async function placeBlock(userId, seasonId, paidWithStars = true) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get shared tower for season
    const towerResult = await client.query(
      'SELECT * FROM towers WHERE season_id = $1 AND user_id IS NULL',
      [seasonId]
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

    // Get user's clan_id
    const userClanResult = await client.query(
      'SELECT clan_id FROM users WHERE id = $1',
      [userId]
    );
    const userClanId = userClanResult.rows[0]?.clan_id || null;

    // Create block record with clan_id
    const blockResult = await client.query(
      `INSERT INTO blocks (tower_id, user_id, block_number, clan_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [tower.id, userId, newHeight, userClanId]
    );

    const blockId = blockResult.rows[0].id;

    // Track user contribution
    await client.query(
      `INSERT INTO user_contributions (user_id, season_id, blocks_contributed)
       VALUES ($1, $2, 1)
       ON CONFLICT (user_id, season_id)
       DO UPDATE SET
         blocks_contributed = user_contributions.blocks_contributed + 1,
         updated_at = NOW()`,
      [userId, seasonId]
    );

    // Give premium block every 10 regular blocks
    const totalBlocks = await client.query(
      'SELECT blocks_contributed FROM user_contributions WHERE user_id = $1 AND season_id = $2',
      [userId, seasonId]
    );
    const blocksCount = totalBlocks.rows[0]?.blocks_contributed || 0;

    if (blocksCount > 0 && blocksCount % 10 === 0) {
      await client.query(
        'UPDATE users SET premium_blocks_balance = premium_blocks_balance + 1 WHERE id = $1',
        [userId]
      );
    }

    // Check for collapse
    const collapsed = checkCollapse(newHeight, false);

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
        `INSERT INTO activity_feed (user_id, season_id, action, tower_type, height)
         VALUES ($1, $2, 'tower_collapsed', 'regular', $3)`,
        [userId, seasonId, newHeight]
      );
    } else {
      // Tower still standing
      await client.query(
        `INSERT INTO activity_feed (user_id, season_id, action, tower_type, height)
         VALUES ($1, $2, 'block_placed', 'regular', $3)`,
        [userId, seasonId, newHeight]
      );
    }

    // Update season stats (if paid with Stars)
    if (paidWithStars) {
      // Since Telegram Stars are integers and price is 1 Star:
      // - 1 Star goes to regular pool
      // - Premium pool gets 1 Star every 20 blocks (5% average)
      const regularPoolIncrease = 1;

      // Check if this is a multiple of 20 blocks to add to premium pool
      const seasonStats = await client.query(
        'SELECT total_blocks FROM seasons WHERE id = $1',
        [seasonId]
      );
      const totalBlocks = seasonStats.rows[0].total_blocks;
      const premiumPoolIncrease = (totalBlocks + 1) % 20 === 0 ? 1 : 0;

      await client.query(
        `UPDATE seasons
         SET total_pool = total_pool + $1,
             premium_pool = premium_pool + $2,
             total_blocks = total_blocks + 1
         WHERE id = $3`,
        [regularPoolIncrease, premiumPoolIncrease, seasonId]
      );

      // Update user stats
      await client.query(
        `UPDATE users
         SET total_blocks_placed = total_blocks_placed + 1,
             total_stars_spent = total_stars_spent + 1
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
 * Get leaderboard for season (based on user contributions)
 */
export async function getLeaderboard(seasonId, limit = 100) {
  const result = await pool.query(
    `SELECT
       u.telegram_first_name,
       u.telegram_username,
       uc.blocks_contributed as height,
       false as is_collapsed
     FROM user_contributions uc
     JOIN users u ON uc.user_id = u.id
     WHERE uc.season_id = $1
     ORDER BY uc.blocks_contributed DESC, uc.created_at ASC
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

/**
 * Get or create premium tower for user in this season
 */
export async function getOrCreatePremiumTower(userId, seasonId) {
  const client = await pool.connect();

  try {
    // Try to find existing premium tower for this user and season
    let result = await client.query(
      'SELECT * FROM premium_towers WHERE user_id = $1 AND season_id = $2',
      [userId, seasonId]
    );

    if (result.rows.length > 0) {
      return result.rows[0];
    }

    // Create new premium tower for the user
    result = await client.query(
      `INSERT INTO premium_towers (user_id, season_id, height, is_collapsed)
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
 * Place a block on premium tower (user's individual tower)
 */
export async function placePremiumBlock(userId, seasonId) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check user has premium blocks
    const userResult = await client.query(
      'SELECT premium_blocks_balance FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows[0].premium_blocks_balance < 1) {
      throw new Error('Insufficient premium blocks');
    }

    // Deduct premium block
    await client.query(
      'UPDATE users SET premium_blocks_balance = premium_blocks_balance - 1 WHERE id = $1',
      [userId]
    );

    // Get or create premium tower
    const towerResult = await client.query(
      'SELECT * FROM premium_towers WHERE user_id = $1 AND season_id = $2',
      [userId, seasonId]
    );

    let tower;
    if (towerResult.rows.length === 0) {
      const newTowerResult = await client.query(
        `INSERT INTO premium_towers (user_id, season_id, height, is_collapsed)
         VALUES ($1, $2, 0, false)
         RETURNING *`,
        [userId, seasonId]
      );
      tower = newTowerResult.rows[0];
    } else {
      tower = towerResult.rows[0];
    }

    if (tower.is_collapsed) {
      throw new Error('Premium tower already collapsed');
    }

    // Increment tower height
    const newHeight = tower.height + 1;

    await client.query(
      'UPDATE premium_towers SET height = $1, updated_at = NOW() WHERE id = $2',
      [newHeight, tower.id]
    );

    // Check for collapse (2x chance)
    const collapsed = checkCollapse(newHeight, true);

    if (collapsed) {
      // Premium tower collapsed
      await client.query(
        'UPDATE premium_towers SET is_collapsed = true, collapse_height = $1 WHERE id = $2',
        [newHeight, tower.id]
      );

      // Add to activity feed
      await client.query(
        `INSERT INTO activity_feed (user_id, season_id, action, tower_type, height)
         VALUES ($1, $2, 'tower_collapsed', 'premium', $3)`,
        [userId, seasonId, newHeight]
      );
    } else {
      // Tower still standing
      await client.query(
        `INSERT INTO activity_feed (user_id, season_id, action, tower_type, height)
         VALUES ($1, $2, 'block_placed', 'premium', $3)`,
        [userId, seasonId, newHeight]
      );
    }

    await client.query('COMMIT');

    return {
      collapsed,
      height: newHeight,
      collapse_chance: calculateCollapseChance(newHeight + 1, true),
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Calculate potential premium payout for user's premium tower
 */
export async function calculatePremiumPotentialPayout(userId, seasonId) {
  const client = await pool.connect();

  try {
    // Get user's premium tower
    const towerResult = await client.query(
      'SELECT * FROM premium_towers WHERE user_id = $1 AND season_id = $2',
      [userId, seasonId]
    );

    if (towerResult.rows.length === 0 || towerResult.rows[0].is_collapsed) {
      return 0;
    }

    const tower = towerResult.rows[0];

    // Get season premium pool
    const seasonResult = await client.query(
      'SELECT premium_pool FROM seasons WHERE id = $1',
      [seasonId]
    );

    const season = seasonResult.rows[0];

    // Get total premium survivor height
    const totalSurvivorHeight = await getTotalPremiumSurvivorHeight(seasonId);

    if (totalSurvivorHeight === 0) {
      return 0;
    }

    return calculatePayout(tower.height, totalSurvivorHeight, season.premium_pool);
  } finally {
    client.release();
  }
}

/**
 * Get total premium survivor height for season
 */
export async function getTotalPremiumSurvivorHeight(seasonId) {
  const result = await pool.query(
    `SELECT COALESCE(SUM(height), 0) as total
     FROM premium_towers
     WHERE season_id = $1 AND is_collapsed = false`,
    [seasonId]
  );

  return parseInt(result.rows[0].total);
}

/**
 * Get premium leaderboard for season
 */
export async function getPremiumLeaderboard(seasonId, limit = 100) {
  const result = await pool.query(
    `SELECT
       u.telegram_first_name,
       u.telegram_username,
       pt.height,
       pt.is_collapsed
     FROM premium_towers pt
     JOIN users u ON pt.user_id = u.id
     WHERE pt.season_id = $1 AND pt.height > 0
     ORDER BY pt.height DESC, pt.created_at ASC
     LIMIT $2`,
    [seasonId, limit]
  );

  return result.rows;
}

/**
 * Get blocks for a tower with user information and clan info
 */
export async function getTowerBlocks(towerId, limit = 20) {
  const result = await pool.query(
    `SELECT
       b.block_number,
       b.user_id,
       u.telegram_first_name,
       u.telegram_username,
       u.telegram_id,
       b.clan_id,
       c.name as clan_name,
       c.icon as clan_icon,
       c.color_primary as clan_color_primary,
       c.color_secondary as clan_color_secondary
     FROM blocks b
     LEFT JOIN users u ON b.user_id = u.id
     LEFT JOIN clans c ON b.clan_id = c.id
     WHERE b.tower_id = $1
     ORDER BY b.block_number DESC
     LIMIT $2`,
    [towerId, limit]
  );

  return result.rows;
}
