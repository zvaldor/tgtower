import pool from '../config/database.js';

class ClanService {
  /**
   * Get all clans
   */
  async getAllClans() {
    const result = await pool.query(`
      SELECT
        c.*,
        COUNT(DISTINCT u.id) as member_count,
        COALESCE(SUM(uc.blocks_contributed), 0) as total_blocks
      FROM clans c
      LEFT JOIN users u ON u.clan_id = c.id
      LEFT JOIN user_contributions uc ON uc.user_id = u.id
      GROUP BY c.id
      ORDER BY total_blocks DESC
    `);
    return result.rows;
  }

  /**
   * Get clan by ID
   */
  async getClanById(clanId) {
    const result = await pool.query(
      'SELECT * FROM clans WHERE id = $1',
      [clanId]
    );
    return result.rows[0];
  }

  /**
   * Get clan leaderboard (sum of all members' blocks)
   */
  async getClanLeaderboard(seasonId) {
    const result = await pool.query(`
      SELECT
        c.id,
        c.name,
        c.icon,
        c.color_primary,
        c.color_secondary,
        COUNT(DISTINCT u.id) as member_count,
        COALESCE(SUM(uc.blocks_contributed), 0) as total_blocks
      FROM clans c
      LEFT JOIN users u ON u.clan_id = c.id
      LEFT JOIN user_contributions uc ON uc.user_id = u.id AND uc.season_id = $1
      GROUP BY c.id
      ORDER BY total_blocks DESC
    `, [seasonId]);
    return result.rows;
  }

  /**
   * Get clan members leaderboard
   */
  async getClanMembersLeaderboard(clanId, seasonId, limit = 50) {
    const result = await pool.query(`
      SELECT
        u.id,
        u.telegram_id,
        u.telegram_username,
        u.telegram_first_name,
        COALESCE(uc.blocks_contributed, 0) as blocks_contributed
      FROM users u
      LEFT JOIN user_contributions uc ON uc.user_id = u.id AND uc.season_id = $2
      WHERE u.clan_id = $1
      ORDER BY uc.blocks_contributed DESC NULLS LAST
      LIMIT $3
    `, [clanId, seasonId, limit]);
    return result.rows;
  }

  /**
   * Join a clan
   * @returns {object} { success: boolean, message: string, clan?: object }
   */
  async joinClan(userId, clanId, currentSeasonNumber) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get user's current clan status
      const userResult = await client.query(
        'SELECT clan_id, clan_join_season FROM users WHERE id = $1',
        [userId]
      );
      const user = userResult.rows[0];

      // Check if user is already in this clan
      if (user.clan_id === clanId) {
        await client.query('ROLLBACK');
        return { success: false, message: 'You are already in this clan' };
      }

      // Check if user is in another clan during active season
      if (user.clan_id && user.clan_join_season === currentSeasonNumber) {
        await client.query('ROLLBACK');
        return {
          success: false,
          message: 'You cannot change clans during an active season'
        };
      }

      // Join the clan
      await client.query(
        'UPDATE users SET clan_id = $1, clan_join_season = $2 WHERE id = $3',
        [clanId, currentSeasonNumber, userId]
      );

      // Get clan info
      const clanResult = await client.query(
        'SELECT * FROM clans WHERE id = $1',
        [clanId]
      );

      await client.query('COMMIT');
      return { success: true, message: 'Successfully joined clan', clan: clanResult.rows[0] };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Leave current clan (only allowed between seasons)
   * @returns {object} { success: boolean, message: string }
   */
  async leaveClan(userId, currentSeasonNumber, towerIsCollapsed) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get user's current clan status
      const userResult = await client.query(
        'SELECT clan_id, clan_join_season FROM users WHERE id = $1',
        [userId]
      );
      const user = userResult.rows[0];

      // Check if user is in a clan
      if (!user.clan_id) {
        await client.query('ROLLBACK');
        return { success: false, message: 'You are not in any clan' };
      }

      // Check if user can leave (only between seasons when tower is collapsed)
      if (user.clan_join_season === currentSeasonNumber && !towerIsCollapsed) {
        await client.query('ROLLBACK');
        return {
          success: false,
          message: 'You can only leave your clan after the tower collapses'
        };
      }

      // Leave the clan
      await client.query(
        'UPDATE users SET clan_id = NULL, clan_join_season = NULL WHERE id = $1',
        [userId]
      );

      await client.query('COMMIT');
      return { success: true, message: 'Successfully left clan' };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get clan special offers
   */
  async getClanSpecialOffers(clanId) {
    const result = await pool.query(`
      SELECT * FROM clan_special_offers
      WHERE clan_id = $1 AND is_active = true
      ORDER BY blocks_amount DESC
    `, [clanId]);
    return result.rows;
  }

  /**
   * Check if user can change clan
   */
  async canChangeClan(userId, currentSeasonNumber, towerIsCollapsed) {
    const result = await pool.query(
      'SELECT clan_id, clan_join_season FROM users WHERE id = $1',
      [userId]
    );
    const user = result.rows[0];

    // If not in any clan, can join
    if (!user.clan_id) {
      return { canChange: true, reason: null };
    }

    // If in clan during active season, cannot change
    if (user.clan_join_season === currentSeasonNumber && !towerIsCollapsed) {
      return {
        canChange: false,
        reason: 'Cannot change clans during active season'
      };
    }

    // Can change between seasons
    return { canChange: true, reason: null };
  }
}

export default new ClanService();
