import pool from '../config/database.js';

/**
 * Get current active season
 */
export async function getActiveSeason() {
  const result = await pool.query(
    `SELECT * FROM seasons WHERE status = 'active' ORDER BY season_number DESC LIMIT 1`
  );

  return result.rows[0] || null;
}

/**
 * Get season by ID
 */
export async function getSeasonById(seasonId) {
  const result = await pool.query(
    'SELECT * FROM seasons WHERE id = $1',
    [seasonId]
  );

  return result.rows[0] || null;
}

/**
 * End current season and create next one
 */
export async function endSeasonAndCreateNext() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get active season
    const activeSeasonResult = await client.query(
      `SELECT * FROM seasons WHERE status = 'active' ORDER BY season_number DESC LIMIT 1`
    );

    if (activeSeasonResult.rows.length === 0) {
      await client.query('COMMIT');
      return null;
    }

    const activeSeason = activeSeasonResult.rows[0];

    // End active season
    await client.query(
      `UPDATE seasons SET status = 'ended' WHERE id = $1`,
      [activeSeason.id]
    );

    console.log(`Season ${activeSeason.season_number} ended`);

    // Create next season
    const nextSeasonResult = await client.query(
      `INSERT INTO seasons (season_number, start_time, end_time, status)
       VALUES ($1, NOW(), NOW() + INTERVAL '5 days', 'active')
       RETURNING *`,
      [activeSeason.season_number + 1]
    );

    const nextSeason = nextSeasonResult.rows[0];
    console.log(`Season ${nextSeason.season_number} started`);

    await client.query('COMMIT');
    return nextSeason;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Check if all towers in season have collapsed
 */
export async function checkAllTowersCollapsed(seasonId) {
  const result = await pool.query(
    `SELECT COUNT(*) as total,
            SUM(CASE WHEN is_collapsed = false THEN 1 ELSE 0 END) as standing
     FROM towers
     WHERE season_id = $1`,
    [seasonId]
  );

  const stats = result.rows[0];
  return stats.total > 0 && stats.standing === '0';
}

/**
 * Update season pool and blocks count
 */
export async function updateSeasonStats(seasonId, starsAmount) {
  await pool.query(
    `UPDATE seasons
     SET total_pool = total_pool + $1,
         total_blocks = total_blocks + 1
     WHERE id = $2`,
    [starsAmount, seasonId]
  );
}

/**
 * Get total survivor height for season
 */
export async function getTotalSurvivorHeight(seasonId) {
  const result = await pool.query(
    `SELECT COALESCE(SUM(height), 0) as total
     FROM towers
     WHERE season_id = $1 AND is_collapsed = false`,
    [seasonId]
  );

  return parseInt(result.rows[0].total, 10);
}
