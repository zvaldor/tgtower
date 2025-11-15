import cron from 'node-cron';
import { endSeasonAndCreateNext, checkAllTowersCollapsed, getActiveSeason } from '../services/seasonService.js';
import pool from '../config/database.js';

/**
 * Check for ended seasons every hour
 */
export function scheduleSeasonEndCheck() {
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('[CRON] Checking for ended seasons...');

      // Check if active season has ended by time
      const result = await pool.query(
        `SELECT id, season_number FROM seasons
         WHERE status = 'active' AND end_time < NOW()`
      );

      if (result.rows.length > 0) {
        console.log(`[CRON] Season ${result.rows[0].season_number} has ended by time`);
        await endSeasonAndCreateNext();
      }
    } catch (error) {
      console.error('[CRON] Error in season end check:', error);
    }
  });

  console.log('[CRON] Season end check scheduled (every hour)');
}

/**
 * Check if all towers collapsed every 10 minutes
 */
export function scheduleAllTowersCollapsedCheck() {
  cron.schedule('*/10 * * * *', async () => {
    try {
      console.log('[CRON] Checking if all towers collapsed...');

      const activeSeason = await getActiveSeason();

      if (!activeSeason) {
        console.log('[CRON] No active season found');
        return;
      }

      const allCollapsed = await checkAllTowersCollapsed(activeSeason.id);

      if (allCollapsed) {
        console.log(`[CRON] All towers collapsed in season ${activeSeason.season_number}`);
        await endSeasonAndCreateNext();
      }
    } catch (error) {
      console.error('[CRON] Error in all towers collapsed check:', error);
    }
  });

  console.log('[CRON] All towers collapsed check scheduled (every 10 minutes)');
}

/**
 * Initialize all cron jobs
 */
export function initializeCronJobs() {
  scheduleSeasonEndCheck();
  scheduleAllTowersCollapsedCheck();
  console.log('[CRON] All cron jobs initialized');
}
