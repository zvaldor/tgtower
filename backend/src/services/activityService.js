import pool from '../config/database.js';

/**
 * Get recent activity feed for season
 */
export async function getActivityFeed(seasonId, limit = 5) {
  const result = await pool.query(
    `SELECT
       af.action,
       af.height,
       af.created_at,
       u.telegram_first_name,
       u.telegram_username
     FROM activity_feed af
     JOIN users u ON af.user_id = u.id
     WHERE af.season_id = $1
     ORDER BY af.created_at DESC
     LIMIT $2`,
    [seasonId, limit]
  );

  return result.rows;
}
