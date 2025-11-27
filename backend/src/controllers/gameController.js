import pool from '../config/database.js';
import { getOrCreateUser } from '../services/userService.js';
import { getActiveSeason } from '../services/seasonService.js';
import {
  getOrCreateTower,
  getOrCreatePremiumTower,
  placeBlock,
  placePremiumBlock,
  calculatePotentialPayout,
  calculatePremiumPotentialPayout,
  getLeaderboard,
  getPremiumLeaderboard,
  getTowerBlocks,
  claimPayout,
} from '../services/towerService.js';
import { getActivityFeed } from '../services/activityService.js';
import { getActiveOffers } from '../services/offerService.js';
import { calculateCollapseChance } from '../services/gameLogic.js';
import clanService from '../services/clanService.js';
import bot from '../bot/index.js';

/**
 * Get complete game state for user
 */
export async function getGameState(req, res) {
  try {
    const { telegram_id, username, first_name } = req.body;

    if (!telegram_id) {
      return res.status(400).json({ error: 'telegram_id is required' });
    }

    // Get or create user
    const { user, isNewUser, referrerTelegramId } = await getOrCreateUser(telegram_id, username, first_name);

    // If new user was referred, send notification to referrer
    if (isNewUser && referrerTelegramId) {
      try {
        const referredUserName = first_name || username || 'Your friend';
        await bot.sendMessage(
          referrerTelegramId,
          `🎉 Ура! ${referredUserName} теперь тоже строит башню!\n\n🎁 Награждаем тебя 1 бесплатным блоком!`
        );
      } catch (notificationError) {
        console.error('Failed to send referral notification:', notificationError);
        // Don't fail the request if notification fails
      }
    }

    // Get active season
    const season = await getActiveSeason();

    if (!season) {
      return res.status(500).json({ error: 'No active season found' });
    }

    // Get or create user's tower
    const tower = await getOrCreateTower(user.id, season.id);

    // Get or create user's premium tower
    const premiumTower = await getOrCreatePremiumTower(user.id, season.id);

    // Calculate potential payout
    const potentialPayout = await calculatePotentialPayout(user.id, season.id);
    const premiumPotentialPayout = await calculatePremiumPotentialPayout(user.id, season.id);

    // Get next block collapse chance
    const nextBlockCollapseChance = tower.is_collapsed
      ? 0
      : calculateCollapseChance(tower.height + 1, false);

    const nextPremiumBlockCollapseChance = premiumTower.is_collapsed
      ? 0
      : calculateCollapseChance(premiumTower.height + 1, true);

    // Get leaderboard
    const leaderboard = await getLeaderboard(season.id, 100);
    const premiumLeaderboard = await getPremiumLeaderboard(season.id, 100);

    // Get tower blocks with user info
    const towerBlocks = await getTowerBlocks(tower.id, 20);

    // Get activity feed
    const activityFeed = await getActivityFeed(season.id, 10);

    // Get special offers
    const specialOffers = await getActiveOffers(user.id);

    // Get bot username for referral links
    const botInfo = await bot.getMe();
    const botUsername = botInfo.username;

    // Get user's clan info
    let userClan = null;
    let clanOffers = [];
    if (user.clan_id) {
      userClan = await clanService.getClanById(user.clan_id);
      clanOffers = await clanService.getClanSpecialOffers(user.clan_id);
    }

    // Get all clans
    const allClans = await clanService.getAllClans();

    // Get clan leaderboard
    const clanLeaderboard = await clanService.getClanLeaderboard(season.id);

    res.json({
      server_time: new Date().toISOString(),
      user: {
        id: user.id,
        telegram_id: user.telegram_id,
        first_name: user.telegram_first_name,
        username: user.telegram_username,
        blocks_balance: user.blocks_balance,
        premium_blocks_balance: user.premium_blocks_balance,
        total_blocks_placed: user.total_blocks_placed,
        total_stars_spent: user.total_stars_spent,
        total_stars_won: user.total_stars_won,
        showed_onboarding: user.showed_onboarding,
        clan: userClan,
        clan_join_season: user.clan_join_season,
      },
      season: {
        number: season.season_number,
        end_time: season.end_time,
        total_pool: season.total_pool,
        premium_pool: season.premium_pool,
        total_blocks: season.total_blocks,
        status: season.status,
      },
      tower: {
        height: tower.height,
        is_collapsed: tower.is_collapsed,
        collapse_height: tower.collapse_height,
        potential_payout: potentialPayout,
        next_block_collapse_chance: nextBlockCollapseChance,
        blocks: towerBlocks,
      },
      premium_tower: {
        height: premiumTower.height,
        is_collapsed: premiumTower.is_collapsed,
        collapse_height: premiumTower.collapse_height,
        potential_payout: premiumPotentialPayout,
        next_block_collapse_chance: nextPremiumBlockCollapseChance,
      },
      bot_username: botUsername,
      special_offers: specialOffers,
      clan_offers: clanOffers,
      leaderboard,
      premium_leaderboard: premiumLeaderboard,
      activity_feed: activityFeed,
      clans: allClans,
      clan_leaderboard: clanLeaderboard,
    });
  } catch (error) {
    console.error('Error in getGameState:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Place a block using blocks balance
 */
export async function placeBlockHandler(req, res) {
  try {
    const { telegram_id, username, first_name } = req.body;

    if (!telegram_id) {
      return res.status(400).json({ error: 'telegram_id is required' });
    }

    // Get user
    const { user } = await getOrCreateUser(telegram_id, username, first_name);

    // Get active season
    const season = await getActiveSeason();

    if (!season) {
      return res.status(500).json({ error: 'No active season found' });
    }

    // Place block (using balance, not Stars)
    const result = await placeBlock(user.id, season.id, false);

    // Calculate potential payout
    const potentialPayout = await calculatePotentialPayout(user.id, season.id);

    res.json({
      success: true,
      server_time: new Date().toISOString(),
      collapsed: result.collapsed,
      height: result.height,
      collapse_chance: result.collapse_chance,
      potential_payout: potentialPayout,
    });
  } catch (error) {
    console.error('Error in placeBlockHandler:', error);
    res.status(400).json({ error: error.message });
  }
}

/**
 * Place a premium block using premium blocks balance
 */
export async function placePremiumBlockHandler(req, res) {
  try {
    const { telegram_id, username, first_name } = req.body;

    if (!telegram_id) {
      return res.status(400).json({ error: 'telegram_id is required' });
    }

    // Get user
    const { user } = await getOrCreateUser(telegram_id, username, first_name);

    // Get active season
    const season = await getActiveSeason();

    if (!season) {
      return res.status(500).json({ error: 'No active season found' });
    }

    // Place premium block
    const result = await placePremiumBlock(user.id, season.id);

    // Calculate potential payout
    const potentialPayout = await calculatePremiumPotentialPayout(user.id, season.id);

    res.json({
      success: true,
      server_time: new Date().toISOString(),
      collapsed: result.collapsed,
      height: result.height,
      collapse_chance: result.collapse_chance,
      potential_payout: potentialPayout,
    });
  } catch (error) {
    console.error('Error in placePremiumBlockHandler:', error);
    res.status(400).json({ error: error.message });
  }
}

/**
 * Mark onboarding as shown for user
 */
export async function markOnboardingShownHandler(req, res) {
  try {
    const { telegram_id } = req.body;

    if (!telegram_id) {
      return res.status(400).json({ error: 'telegram_id is required' });
    }

    // Get user
    const { user } = await getOrCreateUser(telegram_id);

    // Mark onboarding as shown
    await pool.query(
      'UPDATE users SET showed_onboarding = true WHERE id = $1',
      [user.id]
    );

    res.json({
      success: true,
    });
  } catch (error) {
    console.error('Error in markOnboardingShownHandler:', error);
    res.status(400).json({ error: error.message });
  }
}

/**
 * Claim payout from ended season
 */
export async function claimPayoutHandler(req, res) {
  try {
    const { telegram_id, season_id } = req.body;

    if (!telegram_id || !season_id) {
      return res.status(400).json({ error: 'telegram_id and season_id are required' });
    }

    // Get user
    const { user } = await getOrCreateUser(telegram_id);

    // Claim payout
    const result = await claimPayout(user.id, season_id);

    res.json({
      success: true,
      payout: result.payout,
    });
  } catch (error) {
    console.error('Error in claimPayoutHandler:', error);
    res.status(400).json({ error: error.message });
  }
}
